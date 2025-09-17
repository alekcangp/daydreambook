<template>
  <div class="stream-viewer">
    <div class="stream-header">
      <div class="stream-mode-info">
        <div class="mode-indicator">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17,8 12,13 7,8"/>
            <path d="M12 20a1 1 0 0 0 0-2 1 1 0 0 0 0 2z"/>
          </svg>
          <span>{{ t.streamingMode }}</span>
        </div>
        <button @click="toggleStream" class="toggle-btn" :class="{ active: isStreaming }" :title="isStreaming ? t.stopStreaming : t.startStreaming">
          {{ isStreaming ? t.stopStreaming : t.startStreaming }}
        </button>
      </div>
    </div>

    <div class="stream-container">
      <!-- Webcam Input -->
      <div v-if="showWebcam" class="webcam-section">
        <div class="webcam-container">
          <video ref="webcamVideo" class="webcam-video" autoplay muted playsinline></video>
          <canvas ref="webcamCanvas" class="webcam-canvas" :class="{ active: noiseEnabled }"></canvas>
          <div class="webcam-overlay">
            <svg class="webcam-indicator" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
          </div>
        </div>
        <div class="webcam-status">
          {{ t.webcamActive }}
          <button @click="toggleWebcam" class="webcam-toggle" :title="t.toggleWebcam">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1 7 2c2.7 0 5.25-1.07 7-3A7.37 7.37 0 0 0 23 3z"/>
            </svg>
          </button>
          <button @click="toggleNoise" class="noise-toggle" :class="{ active: noiseEnabled }" :title="noiseEnabled ? 'Disable Noise' : 'Enable Noise'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 12h2M20 12h2M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else-if="isConnecting" class="loading-state">
        <div class="ai-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <h4>{{ t.connectingStream }}</h4>
        <p>{{ t.pleaseWait }}</p>
      </div>

      <!-- Stream Output -->
      <div v-else-if="outputUrl" class="stream-output">
        <div class="output-header">
          <h4>{{ t.liveOutput }}</h4>
          <div class="stream-controls">
            <button @click="refreshStream" class="control-btn" :title="t.refreshStream">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23,4 23,10 17,10"/>
                <path d="M20.49,15A9,9 0 0,0 5.64,9.64L1,5"/>
                <path d="M6.51,9A9,9 0 0,1 18.36,14.36L22,18"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Livepeer Iframe -->
        <div class="player-container">
          <iframe 
            :src="outputUrl"
            class="livepeer-player"
            frameborder="0"
            allowfullscreen
            :title="t.liveStreamPlayer"
          ></iframe>
        </div>

        <!-- Connection Status -->
        <div class="connection-status" :class="{ connected: isConnected, disconnected: !isConnected }">
          <span class="status-dot"></span>
          <span>{{ isConnected ? t.streamConnected : t.streamDisconnected }}</span>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="error-state">
        <div class="error-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h4>{{ t.streamError }}</h4>
        <p>{{ errorMessage }}</p>
        <button @click="retryConnection" class="retry-btn">{{ t.retry }}</button>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17,8 12,13 7,8"/>
            <path d="M12 20a1 1 0 0 0 0-2 1 1 0 0 0 0 2z"/>
          </svg>
        </div>
        <h4>{{ t.noStreamYet }}</h4>
        <p>{{ t.startStreamingToView }}</p>
      </div>
    </div>

    <!-- AI Parameters Controls -->
    <div v-if="isStreaming && showControls" class="ai-controls">
      <div class="control-section">
        <h5>{{ t.aiParameters }}</h5>
        
        <!-- Prompt -->
        <div class="control-group">
          <label>{{ t.prompt }}:</label>
          <input 
            v-model="currentPrompt" 
            type="text" 
            class="control-input"
            :placeholder="t.enterPrompt"
            @input="debouncedUpdateParams"
          />
        </div>

        <!-- Negative Prompt -->
        <div class="control-group">
          <label>{{ t.negativePrompt }}:</label>
          <input 
            v-model="negativePrompt" 
            type="text" 
            class="control-input"
            placeholder="blurry, low quality, distorted"
            @input="debouncedUpdateParams"
          />
        </div>

        <!-- Inference Steps -->
        <div class="control-group">
          <label>{{ t.inferenceSteps }}:</label>
          <input 
            v-model.number="inferenceSteps" 
            type="range" 
            min="10" 
            max="100" 
            class="control-slider"
            @input="debouncedUpdateParams"
          />
          <span class="slider-value">{{ inferenceSteps }}</span>
        </div>

        <!-- ControlNets -->
        <div class="control-group">
          <label>{{ t.controlNets }}:</label>
          <div class="controlnet-toggles">
            <label v-for="controlnet in controlNets" :key="controlnet.id" class="controlnet-toggle">
              <input 
                type="checkbox" 
                :value="controlnet.id" 
                v-model="activeControlNets"
                @change="updateParams"
              />
              <span>{{ controlnet.name }}</span>
            </label>
          </div>
        </div>

        <!-- Seed -->
        <div class="control-group">
          <label>{{ t.randomSeed }}:</label>
          <input
            v-model.number="seed"
            type="number"
            class="control-input"
            min="0"
            max="999999"
            @input="updateParams"
          />
          <button @click="randomizeSeed" class="seed-randomize">{{ t.randomize }}</button>
        </div>

        <!-- Noise Controls -->
        <div v-if="noiseEnabled" class="control-group">
          <label>Noise Scale:</label>
          <input
            v-model.number="noiseScale"
            type="range"
            min="0.001"
            max="0.1"
            step="0.001"
            class="control-slider"
          />
          <span class="slider-value">{{ noiseScale.toFixed(3) }}</span>
        </div>

        <div v-if="noiseEnabled" class="control-group">
          <label>Noise Intensity:</label>
          <input
            v-model.number="noiseIntensity"
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            class="control-slider"
          />
          <span class="slider-value">{{ noiseIntensity.toFixed(1) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, nextTick } from 'vue';
import { useI18n } from '../composables/useI18n';
import DaydreamService from '../services/daydreamService';
import { createNoise2D } from 'simplex-noise';

interface Props {
  bookTitle?: string;
  selectedText?: string;
  selectedArtStyle?: string;
}

interface Emits {
  (e: 'updatePrompt', prompt: string): void;
  (e: 'request-initial-prompt'): void;
  (e: 'stream-created', data: { streamId: string; playbackId: string }): void;
}

const props = withDefaults(defineProps<Props>(), {
  bookTitle: 'Unknown Book',
  selectedText: '',
  selectedArtStyle: 'fanturistic'
});

const emit = defineEmits<Emits>();

const { t } = useI18n();

// State
const isStreaming = ref(false);
const showWebcam = ref(false);
const isConnecting = ref(false);
const isConnected = ref(false);
const outputUrl = ref('');
const errorMessage = ref('');
const currentStreamId = ref<string | null>(null);
const currentWhipUrl = ref<string | null>(null);

const webcamVideo = ref<HTMLVideoElement | null>(null);
const webcamCanvas = ref<HTMLCanvasElement | null>(null);
const localStream = ref<MediaStream | null>(null);
const processedStream = ref<MediaStream | null>(null);
const webRtcConnection = ref<RTCPeerConnection | null>(null);

// Noise processing
const noiseEnabled = ref(false);
const noise2D = createNoise2D();
const animationFrame = ref<number | null>(null);
const noiseScale = ref(0.01);
const noiseIntensity = ref(0.3);
const timeOffset = ref(0);

const showControls = ref(false);
const currentPrompt = ref('');
const negativePrompt = ref('blurry, low quality, flat, 2d');
const inferenceSteps = ref(50);
const seed = ref(Math.floor(Math.random() * 1000000));
const activeControlNets = ref<string[]>([
  'openpose',
  'hed',
  'canny',
  'depth',
  'color'
]);

const controlNets = [
  { id: 'openpose', name: t.value.controlNets?.openpose || 'Pose' },
  { id: 'hed', name: t.value.controlNets?.hed || 'Edges' },
  { id: 'canny', name: t.value.controlNets?.canny || 'Canny' },
  { id: 'depth', name: t.value.controlNets?.depth || 'Depth' },
  { id: 'color', name: t.value.controlNets?.color || 'Color' }
];

// Debounced parameter updates
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const debouncedUpdateParams = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    updateParams();
  }, 500);
};

const updateParams = async () => {
  if (!currentStreamId.value) return;

  const params = DaydreamService.getDefaultParams(currentPrompt.value);
  params.params.negative_prompt = negativePrompt.value;
  params.params.num_inference_steps = inferenceSteps.value;
  params.params.seed = seed.value;

  // Update controlnets
  params.params.controlnets = params.params.controlnets?.map((controlnet: any) => {
    const isActive = activeControlNets.value.includes(controlnet.model_id.split('-')[1]);
    return {
      ...controlnet,
      conditioning_scale: isActive ? 0.22 : 0
    };
  });

  try {
    await DaydreamService.updateStreamParams(currentStreamId.value, params);
    console.log('Stream parameters updated successfully');
  } catch (error) {
    console.error('Failed to update stream parameters:', error);
  }
};

const toggleStream = async () => {
  if (isStreaming.value) {
    await stopStream();
  } else {
    await startStream();
  }
};

const startStream = async () => {
  try {
    isConnecting.value = true;
    errorMessage.value = '';
    
    // Create stream via API
    const response = await fetch('/api/daydream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create-stream' })
    });

    if (!response.ok) {
      throw new Error(`Failed to create stream: ${response.statusText}`);
    }

    const { streamId, playbackId, whipUrl, outputUrl: url } = await response.json();
    currentStreamId.value = streamId;
    currentWhipUrl.value = whipUrl;
    outputUrl.value = url;

    // Update prompt from selected text or book title
    currentPrompt.value = props.selectedText || `${props.bookTitle} scene`;
    emit('updatePrompt', currentPrompt.value);
    
    // Start webcam
    await startWebcam();
    
    // Connect WebRTC
    await connectWebRTC();
    
    isStreaming.value = true;
    showControls.value = true;
    isConnected.value = true;
    
    // Initial parameter update
    await updateParams();
    
    // Request initial prompt from parent
    emit('request-initial-prompt');
    
    // Emit stream created event to parent
    if (currentStreamId.value && playbackId) {
      emit('stream-created', {
        streamId: currentStreamId.value,
        playbackId: playbackId
      });
    }
    
  } catch (error: any) {
    console.error('Failed to start stream:', error);
    errorMessage.value = error.message || t.value.streamStartError;
    isConnecting.value = false;
  }
};

const stopStream = async () => {
  await disconnectWebRTC();
  await stopWebcam();
  
  isStreaming.value = false;
  showControls.value = false;
  isConnecting.value = false;
  isConnected.value = false;
  outputUrl.value = '';
  currentStreamId.value = null;
  currentWhipUrl.value = null;
  
  // Clean up stream on server
  if (currentStreamId.value) {
    try {
      await fetch('/api/daydream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-stream', streamId: currentStreamId.value })
      });
    } catch (error) {
      console.error('Failed to clean up stream:', error);
    }
  }
};

const startWebcam = async () => {
  try {
    localStream.value = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: false
    });

    if (webcamVideo.value && localStream.value) {
      webcamVideo.value.srcObject = localStream.value;
      await nextTick();
      webcamVideo.value.play();

      // Wait for video to load metadata
      await new Promise((resolve) => {
        if (webcamVideo.value) {
          webcamVideo.value.onloadedmetadata = resolve;
        }
      });

      // Start noise processing if enabled
      if (noiseEnabled.value) {
        startNoiseProcessing();
      }
    }

    showWebcam.value = true;
  } catch (error: any) {
    console.error('Failed to access webcam:', error);
    errorMessage.value = t.value.webcamError;
    throw error;
  }
};

const stopWebcam = async () => {
  // Stop noise processing
  stopNoiseProcessing();

  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop());
    localStream.value = null;
  }

  if (processedStream.value) {
    processedStream.value.getTracks().forEach(track => track.stop());
    processedStream.value = null;
  }

  if (webcamVideo.value) {
    webcamVideo.value.srcObject = null;
  }

  showWebcam.value = false;
};

const toggleWebcam = () => {
  if (showWebcam.value) {
    stopWebcam();
  } else {
    startWebcam();
  }
};

const toggleNoise = () => {
  noiseEnabled.value = !noiseEnabled.value;
  if (noiseEnabled.value) {
    startNoiseProcessing();
  } else {
    stopNoiseProcessing();
  }
};

const startNoiseProcessing = () => {
  if (!webcamVideo.value || !webcamCanvas.value) return;

  const canvas = webcamCanvas.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = webcamVideo.value.videoWidth;
  canvas.height = webcamVideo.value.videoHeight;

  // Create a stream from the canvas
  processedStream.value = canvas.captureStream(30); // 30 FPS

  const processFrame = () => {
    if (!noiseEnabled.value || !webcamVideo.value || !ctx) return;

    // Draw the video frame to canvas
    ctx.drawImage(webcamVideo.value, 0, 0, canvas.width, canvas.height);

    // Apply simplex noise
    applyNoise(ctx, canvas.width, canvas.height);

    // Continue processing
    animationFrame.value = requestAnimationFrame(processFrame);
  };

  processFrame();
};

const stopNoiseProcessing = () => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
    animationFrame.value = null;
  }
};

const applyNoise = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  timeOffset.value += 0.01; // Animate the noise over time

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;

      // Generate simplex noise value
      const noiseValue = noise2D(x * noiseScale.value, y * noiseScale.value + timeOffset.value);

      // Convert noise to RGB offset
      const offset = Math.floor(noiseValue * 255 * noiseIntensity.value);

      // Apply noise to each color channel
      data[index] = Math.max(0, Math.min(255, data[index] + offset));     // Red
      data[index + 1] = Math.max(0, Math.min(255, data[index + 1] + offset)); // Green
      data[index + 2] = Math.max(0, Math.min(255, data[index + 2] + offset)); // Blue
      // Alpha channel remains unchanged
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

const connectWebRTC = async () => {
  if (!currentWhipUrl.value) return;

  // Use processed stream if noise is enabled, otherwise use local stream
  const streamToUse = noiseEnabled.value && processedStream.value ? processedStream.value : localStream.value;
  if (!streamToUse) return;

  try {
    webRtcConnection.value = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add stream to connection
    streamToUse.getTracks().forEach(track => {
      webRtcConnection.value!.addTrack(track, streamToUse);
    });

    webRtcConnection.value.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to WHIP server (handled by signaling)
      }
    };

    webRtcConnection.value.onconnectionstatechange = () => {
      const state = webRtcConnection.value?.connectionState;
      console.log('WebRTC connection state:', state);
      
      if (state === 'connected') {
        console.log('WebRTC connected');
        isConnecting.value = false;
        isConnected.value = true;
      } else if (state === 'failed' || state === 'disconnected') {
        console.error('WebRTC connection failed:', state);
        errorMessage.value = t.value.webrtcError;
        isConnecting.value = false;
        isConnected.value = false;
      }
    };

    // Create WHIP offer
    const offer = await webRtcConnection.value.createOffer();
    await webRtcConnection.value.setLocalDescription(offer);

    // Send offer to WHIP endpoint
    const response = await fetch(currentWhipUrl.value, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp'
      },
      body: offer.sdp
    });

    if (!response.ok) {
      throw new Error(`WHIP signaling failed: ${response.status}`);
    }

    const answerSdp = await response.text();
    const answer = new RTCSessionDescription({ type: 'answer', sdp: answerSdp });
    await webRtcConnection.value.setRemoteDescription(answer);

    isConnecting.value = false;
    isConnected.value = true;

  } catch (error) {
    console.error('Failed to connect WebRTC:', error);
    errorMessage.value = t.value.webrtcError;
    isConnecting.value = false;
    isConnected.value = false;
    throw error;
  }
};

const disconnectWebRTC = async () => {
  if (webRtcConnection.value) {
    webRtcConnection.value.close();
    webRtcConnection.value = null;
  }
};

const refreshStream = async () => {
  if (!currentStreamId.value) {
    console.warn('Cannot refresh stream - no stream ID available');
    return;
  }

  try {
    console.log('Refreshing stream info for ID:', currentStreamId.value);
    const response = await fetch('/api/daydream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get-stream', streamId: currentStreamId.value })
    });

    if (!response.ok) {
      throw new Error(`Failed to get stream info: ${response.status}`);
    }

    const data = await response.json();
    console.log('Stream info refreshed:', data);
    
    if (data.success && data.outputUrl) {
      outputUrl.value = data.outputUrl;
      console.log('Output URL updated:', outputUrl.value);
      
      // Force iframe reload if it exists
      if (isConnected.value) {
        // Wait a moment then refresh the iframe
        setTimeout(() => {
          const iframe = document.querySelector('.livepeer-player') as HTMLIFrameElement;
          if (iframe) {
            iframe.src = iframe.src;
            console.log('Iframe refreshed');
          }
        }, 1000);
      }
    } else {
      console.error('Invalid stream data received:', data);
      errorMessage.value = 'Stream not available';
      isConnected.value = false;
    }
  } catch (error: any) {
    console.error('Failed to refresh stream:', error);
    errorMessage.value = `Stream refresh failed: ${error.message}`;
    isConnected.value = false;
  }
};

const retryConnection = () => {
  errorMessage.value = '';
  startStream();
};

const randomizeSeed = () => {
  seed.value = Math.floor(Math.random() * 1000000);
  updateParams();
};

// Watch for selected text changes to update prompt
watch(() => props.selectedText, (newText) => {
  if (newText) {
    const basePrompt = newText;
    currentPrompt.value = `${props.selectedArtStyle} ${basePrompt}`;
    emit('updatePrompt', currentPrompt.value);
    if (isStreaming.value) {
      updateParams();
    }
  }
});

// Cleanup on unmount
onUnmounted(() => {
  stopStream();
  stopNoiseProcessing();
  if (debounceTimer) clearTimeout(debounceTimer);
});
</script>

<style scoped>
.stream-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  width: 100%;
  max-width: 100vw;
  margin: 0;
  padding: 28px 32px 24px 32px;
  box-sizing: border-box;
  overflow-x: auto;
}

.player-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 240px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  border: 2px dashed #d1d5db;
  color: #6b7280;
}

.placeholder-content {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.stream-warning {
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 6px;
  font-size: 13px;
  color: #d97706;
}

.stream-warning p {
  margin: 0;
  font-weight: 500;
}

.player-container {
  flex: 1;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  min-height: 240px;
  display: flex;
  flex-direction: column;
}

.livepeer-player {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 12px;
  background: #000;
}

.livepeer-player:empty {
  background: #1f2937;
}

.stream-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.stream-mode-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mode-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-muted);
  font-weight: 500;
}

.toggle-btn {
  padding: 6px 12px;
  border: 1px solid var(--color-primary);
  border-radius: 6px;
  background: white;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: var(--color-primary);
  color: white;
}

.toggle-btn.active {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.stream-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 8px;
  width: 100%;
  margin: 0;
  box-sizing: border-box;
  overflow-x: auto;
}

.webcam-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
}

.webcam-container {
  position: relative;
  width: 100%;
  max-width: 480px;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

.webcam-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.webcam-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.webcam-canvas.active {
  opacity: 1;
}

.webcam-overlay {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 122, 255, 0.8);
  border-radius: 50%;
  padding: 4px;
  backdrop-filter: blur(10px);
}

.webcam-indicator {
  color: white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.webcam-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text);
  font-weight: 500;
}

.webcam-toggle {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.webcam-toggle:hover {
  background: var(--color-secondary);
  color: white;
  border-color: var(--color-primary);
}

.noise-toggle {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 8px;
}

.noise-toggle:hover {
  background: var(--color-secondary);
  color: white;
  border-color: var(--color-primary);
}

.noise-toggle.active {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.loading-state {
  text-align: center;
  padding: 48px 24px;
}

.ai-spinner {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 2s linear infinite;
}

.spinner-ring:nth-child(1) {
  border-top-color: var(--color-primary);
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  border-right-color: var(--color-secondary);
  animation-delay: 0.3s;
}

.spinner-ring:nth-child(3) {
  border-bottom-color: var(--color-accent);
  animation-delay: 0.6s;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state h4 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--color-text);
}

.loading-state p {
  font-size: 14px;
  color: var(--color-muted);
  margin: 0;
}

.stream-output {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 320px;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.output-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.stream-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: var(--color-secondary);
  color: white;
  border-color: var(--color-primary);
}

.player-container {
  flex: 1;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  min-height: 240px;
}

.livepeer-player {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 12px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-muted);
  animation: pulse 1.5s infinite;
}

.connected .status-dot {
  background: #34C759;
}

.disconnected .status-dot {
  background: #FF3B30;
}

.connection-status.connected {
  color: #34C759;
  background: rgba(52, 199, 89, 0.1);
}

.connection-status.disconnected {
  color: #FF3B30;
  background: rgba(255, 59, 48, 0.1);
}

.error-state {
  text-align: center;
  padding: 48px 24px;
}

.error-icon {
  color: #FF3B30;
  margin-bottom: 16px;
}

.error-state h4 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #FF3B30;
}

.error-state p {
  font-size: 14px;
  color: var(--color-muted);
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.retry-btn {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.retry-btn:hover {
  background: #0056CC;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  color: #C7C7CC;
  margin-bottom: 16px;
}

.empty-state h4 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #86868B;
}

.empty-state p {
  font-size: 14px;
  color: #C7C7CC;
  margin: 0;
  line-height: 1.4;
}

.ai-controls {
  margin-top: 20px;
  padding: 16px;
  background: rgba(0, 122, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(0, 122, 255, 0.2);
}

.control-section h5 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.control-group {
  margin-bottom: 16px;
}

.control-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-muted);
  margin-bottom: 6px;
}

.control-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.control-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1);
}

.control-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--color-border);
  outline: none;
  -webkit-appearance: none;
  margin: 0;
}

.control-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
}

.control-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  border: none;
}

.slider-value {
  display: inline-block;
  min-width: 24px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text);
  margin-left: 12px;
  font-weight: 500;
}

.controlnet-toggles {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.controlnet-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
}

.controlnet-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.seed-randomize {
  margin-left: 8px;
  padding: 4px 8px;
  background: rgba(0, 122, 255, 0.1);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.seed-randomize:hover {
  background: var(--color-primary);
  color: white;
}

@media (max-width: 768px) {
  .stream-viewer {
    padding: 16px;
  }
  
  .stream-container {
    min-height: 300px;
  }
  
  .player-container {
    min-height: 200px;
  }
  
  .ai-controls {
    padding: 12px;
    margin-top: 12px;
  }
  
  .control-group {
    margin-bottom: 12px;
  }
}
</style>