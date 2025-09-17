<template>
  <div class="image-viewer">

    <div class="image-style-select" style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; flex: 1 1 auto; min-width: 0;">

      <label for="art-style-combobox">{{ t.artStyle }}:&nbsp; </label>
      <div class="combobox-wrapper">
        <input
          id="art-style-combobox"
          ref="comboboxInput"
          :readonly="!isCustomSelected"
          :value="displayedValue"
          :key="currentLanguage + selectedStyle"
          @focus="openDropdown"
          @click="openDropdown"
          @input="onInput"
          @keydown.down.prevent="onArrowDown"
          @keydown.up.prevent="onArrowUp"
          @keydown.enter.prevent="onEnter"
          @keydown.esc.prevent="closeDropdown"
          @blur="onBlur"
          class="combobox-input"
          autocomplete="off"
          :placeholder="t.chooseOrEnterStyle"
        />
        <ul :class="['combobox-dropdown', filteredStyles.length > 8 ? 'too-many' : '']" v-if="dropdownOpen">
          <li
            v-for="(style, idx) in filteredStyles"
            :key="style"
            :class="{ selected: idx === highlightedIndex }"
            @mousedown.prevent="selectStyle(style)"
          >
            {{ getLocalizedStyleName(style) }}

          </li>
          <li
            v-if="!filteredStyles.includes('custom')"
            :class="{ selected: highlightedIndex === filteredStyles.length }"
            @mousedown.prevent="selectStyle('custom')"

          >
            {{ t.artStyles.custom }}
          </li>
        </ul>
      </div>


      <div class="external-links">
        <button
          @click="switchLanguage"
          class="lang-btn"
          :title="currentLanguage === 'ru' ? 'Переключить на английский' : 'Switch to Russian'"
        >
          {{ currentLanguage == 'ru' ? 'EN' : 'RU' }}
        </button>
        <!-- Docs link hidden -->
        <!-- <a
          href="https://deepwiki.com/alekcangp/sova"
          class="docs-link"
          target="_blank"
          rel="noopener noreferrer"
          :title="currentLanguage === 'ru' ? 'Посмотреть документацию' : 'View Documentation'"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="3" width="16" height="18" rx="2"/>
            <path d="M8 6h8M8 10h8M8 14h6"/>
          </svg>
        </a> -->
        <!-- GitHub link hidden -->
        <!-- <a
          href="https://github.com/alekcangp/sova"
          class="github-link"
          target="_blank"
          rel="noopener noreferrer"
          :title="currentLanguage === 'ru' ? 'Посмотреть на GitHub' : 'View on GitHub'"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.09.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.687-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.908-1.296 2.747-1.025 2.747-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.594 1.028 2.687 0 3.847-2.338 4.695-4.566 4.944.36.31.68.92.68 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.577.688.48C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z"/>
          </svg>
        </a> -->
      </div>

    </div>
  </div>
    <div class="image-container">
      <!-- Hidden canvas for noise processing -->
      <canvas ref="webcamCanvas" class="webcam-canvas" style="display: none;"></canvas>

      <!-- Always show streaming player container -->
      <div class="streaming-mode-container">
        <!-- Always show iframe container -->
        <div class="stream-container">
          <!-- Always show iframe container -->
          <div class="iframe-container">
            <iframe
              v-if="playbackId"
              :src="DaydreamService.getOutputUrl(playbackId)"
              frameborder="0"
              allowfullscreen
              class="stream-iframe"
              :title="t.streamOutput || 'AI Stream Output'"
              :key="iframeKey"
              @load="onIframeLoad"
              @error="onIframeError"
            ></iframe>

          </div>


          <!-- Show connecting state -->
          <div v-if="isConnecting && !playbackId" class="stream-placeholder connecting">
            <div class="ai-spinner">
              <div class="spinner-ring"></div>
              <div class="spinner-ring"></div>
              <div class="spinner-ring"></div>
            </div>
            <h4 class="connecting-text">{{ t.connectingStream || 'Connecting to AI Stream...' }}</h4>
          </div>

          <!-- Show stream starting state when connected but iframe hasn't loaded yet -->
          <div v-if="isConnected && !streamError && playbackId && !iframeLoaded" class="stream-placeholder stream-starting">
            <div class="ai-spinner">
              <div class="spinner-ring"></div>
              <div class="spinner-ring"></div>
              <div class="spinner-ring"></div>
            </div>
            <h4 class="connecting-text">{{ t.streamStarting || 'Starting AI Stream...' }}</h4>
            <p class="connecting-text">{{ t.streamInitializing || 'Initializing video processing - this may take a few moments' }}</p>
          </div>

          <!-- Show static content when not streaming -->
          <div v-if="!isStreaming && !isConnecting && props.aiMode === 'static' && props.imageUrl && props.imageUrl.length > 0" class="static-content-overlay">
            <!-- Show video player if it's a video file -->
            <video
              v-if="isVideo"
              :src="props.imageUrl"
              controls
              autoplay
              muted
              loop
              class="media-player"
              alt="AI Generated Video"
            ></video>
            <!-- Show image if it's not a video -->
            <img
              v-else
              :src="props.imageUrl"
              alt="AI Generated Illustration"
              class="static-image"
            />
          </div>




        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import { useI18n } from '../composables/useI18n';
import DaydreamService from '../services/daydreamService';
import { createNoise2D } from 'simplex-noise';

interface Props {
  aiMode?: 'static' | 'streaming';
  imageUrl?: string;
  summary?: string;
  isGenerating?: boolean;
  selectedText?: string;
  bookTitle?: string;
  selectedArtStyle?: string;
  wasCanceled?: boolean;
  summaryData?: {
    summary: string;
    key_points: string[];
  };
}

const props = withDefaults(defineProps<Props>(), {
  aiMode: 'static',
  imageUrl: '',
  summary: '',
  isGenerating: false,
  selectedText: '',
  bookTitle: 'Unknown Book',
  selectedArtStyle: 'futuristic',
  wasCanceled: false,
  summaryData: () => ({ summary: '', key_points: [] })
});

const emit = defineEmits<{
  (e: 'regenerate', style: string): void;
  (e: 'download', url: string): void;
  (e: 'update:selectedArtStyle', style: string): void;
  (e: 'updatePrompt', prompt: string): void;
  (e: 'stream-created', data: { streamId: string; playbackId: string }): void;
}>();

const { t, currentLanguage, switchLanguage, getEnglishStyleName } = useI18n();

const ArtStyles = [
  'futuristic',
  'fantasy',
  'steampunk',
  'cyberpunk',
  'watercolor',
  'oil_painting',
  'anime',
  'sketch',
  'minimalism',
  'realism',
  'impressionism',
  'surrealism',
  'cartoon',
  'pixel_art',
  'noir',
  'gothic',
  'baroque',
  'pop_art',
  'abstract',
  'photorealistic',
  'render_3d',
  'ink',
  'classic',
  'modern',
  
];

const comboboxInput = ref<HTMLInputElement | null>(null);
const dropdownOpen = ref(false);
const highlightedIndex = ref(-1);
const filterText = ref('');

// Combobox displayed value - always show current selection, fallback to placeholder only when truly empty
const displayedValue = computed(() => {
  if (selectedStyle.value === 'custom') {
    return customStyle.value || '';
  }
  return getLocalizedStyleName(selectedStyle.value) || '';
});

const isCustomSelected = computed(() => selectedStyle.value === 'custom');

// Check if the current imageUrl is a video
const isVideo = computed(() => {
  if (!props.imageUrl) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv'];
  return videoExtensions.some(ext => props.imageUrl.toLowerCase().endsWith(ext));
});

// Streaming refs
const isStreaming = ref(false);
const isConnecting = ref(false);
const isConnected = ref(false);
const streamError = ref<string | null>(null);
const localStream = ref<MediaStream | null>(null);
const streamId = ref<string | null>(null);
const playbackId = ref<string | null>(null);
const whipClient = ref<RTCPeerConnection | null>(null);
const iframeKey = ref(0);
const iframeLoaded = ref(false);

// Noise processing
const noise2D = createNoise2D();
const webcamCanvas = ref<HTMLCanvasElement | null>(null);
const processedStream = ref<MediaStream | null>(null);
const animationFrame = ref<number | null>(null);
const noiseScale = ref(0.1); // Fixed at maximum scale
const noiseIntensity = ref(1.0); // Fixed at maximum intensity
const timeOffset = ref(0);

// Computed property to check if noise should be applied
const hasNoise = computed(() => noiseScale.value > 0 && noiseIntensity.value > 0);

const selectedStyle = ref(
  ArtStyles.includes(props.selectedArtStyle as any)
    ? props.selectedArtStyle
    : 'custom'
);
const customStyle = ref(
  ArtStyles.includes(props.selectedArtStyle as any)
    ? ''
    : props.selectedArtStyle || ''
);

const getLocalizedStyleName = (styleKey: string) => {
  return t.value.artStyles[styleKey as keyof typeof t.value.artStyles] || styleKey;
};

const filteredStyles = computed(() => {
  if (!dropdownOpen.value || !filterText.value) return [...ArtStyles];
  return ArtStyles.filter(styleKey =>
    getLocalizedStyleName(styleKey).toLowerCase().includes(filterText.value.toLowerCase()) ||
    getEnglishStyleName(styleKey).toLowerCase().includes(filterText.value.toLowerCase())
  );
});

// Streaming methods
async function startStreaming() {
  console.log('🎬 === STARTING STREAMING ===');
  console.log('📊 Initial state:', {
    isStreaming: isStreaming.value,
    isConnecting: isConnecting.value,
    isConnected: isConnected.value,
    playbackId: playbackId.value,
    aiMode: props.aiMode
  });

  try {
    isConnecting.value = true;
    isConnected.value = false;
    streamError.value = null;
    iframeLoaded.value = false;

    console.log('🎥 Requesting webcam access...');
    console.log('   Browser supports WebRTC:', !!navigator.mediaDevices?.getUserMedia);
    console.log('   HTTPS:', location.protocol === 'https:');

    // Get webcam access
    localStream.value = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: false
    });
    console.log('✅ Webcam access granted');
    console.log('   Video tracks:', localStream.value.getVideoTracks().length);
    console.log('   Audio tracks:', localStream.value.getAudioTracks().length);

    // Start noise processing (always, since sliders control the effect)
    console.log('🎨 Starting noise processing...');
    await startNoiseProcessing();
    console.log('✅ Noise processing started and stream ready');

    // Create stream with Daydream API
    console.log('🚀 Creating Daydream stream...');
    console.log('   API Key configured:', !!import.meta.env.VITE_DAYDREAM_API_KEY);

    const streamResponse = await DaydreamService.createStream();
    streamId.value = streamResponse.id;
    playbackId.value = streamResponse.output_playback_id;

    console.log('✅ Stream created successfully:');
    console.log('   Stream ID:', streamId.value);
    console.log('   Playback ID:', playbackId.value);
    console.log('   WHIP URL:', streamResponse.whip_url);
    console.log('   Output URL:', DaydreamService.getOutputUrl(playbackId.value));

    // Initialize WHIP client and connect
    console.log('🔗 Connecting WebRTC...');
    await connectWhip(streamResponse.whip_url);

    // Note: Removed initial prompt parameter update to prevent duplicates
    // The selectedText watcher will handle updating parameters when needed
    console.log('ℹ️ Initial stream created - parameters will be updated by selectedText watcher when needed');

    isStreaming.value = true;

    console.log('🎬 Streaming started successfully!');
    console.log('📊 Final state:', {
      isStreaming: isStreaming.value,
      isConnecting: isConnecting.value,
      isConnected: isConnected.value,
      playbackId: playbackId.value,
      iframeKey: iframeKey.value,
      usingProcessedStream: hasNoise.value && processedStream.value !== null,
      noiseScale: noiseScale.value,
      noiseIntensity: noiseIntensity.value
    });

    // Emit stream created event
    emit('stream-created', {
      streamId: streamId.value!,
      playbackId: playbackId.value!
    });

    console.log('=== STREAMING START COMPLETE ===');

  } catch (error: any) {
    console.error('❌ Streaming error:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);

    streamError.value = error.message || 'Failed to start streaming';
    isConnecting.value = false;
    isConnected.value = false;

    // Provide specific error guidance
    if (error.message.includes('NotAllowedError')) {
      console.error('💡 Camera permission denied. User must allow camera access.');
      console.log('ℹ️ Streaming will not start automatically. The interface will still work for static content.');
    } else if (error.message.includes('NotFoundError')) {
      console.error('💡 No camera found. Check camera connection.');
      console.log('ℹ️ Streaming will not start automatically. The interface will still work for static content.');
    } else if (error.message.includes('401')) {
      console.error('💡 API authentication failed. Check Daydream API key.');
      console.log('ℹ️ Streaming will not start automatically. The interface will still work for static content.');
    } else if (error.message.includes('network')) {
      console.error('💡 Network error. Check internet connection.');
      console.log('ℹ️ Streaming will not start automatically. The interface will still work for static content.');
    } else {
      console.log('ℹ️ Streaming failed to start automatically, but the interface will still work for static content.');
    }
  }
}

async function stopStreaming() {
  try {
    // Stop noise processing
    stopNoiseProcessing();

    if (whipClient.value) {
      whipClient.value.close();
      whipClient.value = null;
    }

    if (localStream.value) {
      localStream.value.getTracks().forEach(track => track.stop());
      localStream.value = null;
    }

    if (processedStream.value) {
      processedStream.value.getTracks().forEach(track => track.stop());
      processedStream.value = null;
    }

    streamId.value = null;
    playbackId.value = null;
    isStreaming.value = false;
    streamError.value = null;
  } catch (error) {
    console.error('Error stopping stream:', error);
  }
}


async function startNoiseProcessing() {
  return new Promise<void>((resolve) => {
    if (!webcamCanvas.value || !localStream.value) {
      resolve();
      return;
    }

    const canvas = webcamCanvas.value;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve();
      return;
    }

    // Create video element to capture webcam
    const video = document.createElement('video');
    video.srcObject = localStream.value;
    video.autoplay = true;
    video.muted = true;

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Create processed stream from canvas
      processedStream.value = canvas.captureStream(30);

      const processFrame = () => {
        if (!ctx) return;
  
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
        // Apply simplex noise if active
        if (hasNoise.value) {
          applyNoise(ctx, canvas.width, canvas.height);
        }
  
        // Continue processing
        animationFrame.value = requestAnimationFrame(processFrame);
      };

      processFrame();
      resolve();
    };

    // Fallback timeout in case video doesn't load
    setTimeout(() => {
      resolve();
    }, 2000);
  });
}

function stopNoiseProcessing() {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
    animationFrame.value = null;
  }
  if (processedStream.value) {
    processedStream.value.getTracks().forEach(track => track.stop());
    processedStream.value = null;
  }
}

function applyNoise(ctx: CanvasRenderingContext2D, width: number, height: number) {
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
}

async function connectWhip(whipUrl: string) {
  console.log('🔗 === STARTING WHIP CONNECTION ===');
  console.log('   WHIP URL:', whipUrl);

  if (!localStream.value) {
    console.error('❌ No local stream available for WHIP connection');
    return;
  }

  try {
    console.log('📡 Creating RTCPeerConnection...');

    // Create WebRTC connection with multiple ICE servers
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });

    console.log('📹 Adding stream tracks...');
    // Use processed stream if noise is active, otherwise use local stream
    const streamToUse = hasNoise.value && processedStream.value ? processedStream.value : localStream.value;
    if (!streamToUse) {
      throw new Error('No stream available for WebRTC connection');
    }

    // Add stream tracks
    streamToUse.getTracks().forEach((track, index) => {
      console.log(`   Track ${index}: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}`);
      pc.addTrack(track, streamToUse!);
    });

    // Set up event handlers
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 ICE candidate generated:', event.candidate.type, event.candidate.protocol);
      } else {
        console.log('🧊 ICE candidate gathering complete');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔄 WebRTC connection state changed to:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('✅ WebRTC connection established successfully');
        isConnecting.value = false;
        isConnected.value = true;
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.error('❌ WebRTC connection failed:', pc.connectionState);
        streamError.value = `WebRTC connection ${pc.connectionState}`;
        isConnecting.value = false;
        isConnected.value = false;
      } else if (pc.connectionState === 'connecting') {
        console.log('🔄 WebRTC connection in progress...');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state changed to:', pc.iceConnectionState);
    };

    pc.onicegatheringstatechange = () => {
      console.log('🧊 ICE gathering state changed to:', pc.iceGatheringState);
    };

    pc.onsignalingstatechange = () => {
      console.log('📡 Signaling state changed to:', pc.signalingState);
    };

    console.log('📤 Creating WebRTC offer...');
    // Create offer
    const offer = await pc.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: false
    });

    console.log('📤 Setting local description...');
    await pc.setLocalDescription(offer);

    console.log('🧊 Waiting for ICE gathering to complete...');
    // Wait for ICE gathering to complete
    await new Promise((resolve) => {
      if (pc.iceGatheringState === 'complete') {
        console.log('🧊 ICE gathering already complete');
        resolve(undefined);
      } else {
        const checkState = () => {
          if (pc.iceGatheringState === 'complete') {
            console.log('🧊 ICE gathering completed');
            pc.removeEventListener('icegatheringstatechange', checkState);
            resolve(undefined);
          }
        };
        pc.addEventListener('icegatheringstatechange', checkState);
      }
    });

    console.log('📡 Sending WHIP offer to:', whipUrl);
    console.log('📄 Offer SDP length:', pc.localDescription!.sdp.length);

    // Send offer to WHIP endpoint
    const response = await fetch(whipUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp',
        'Accept': 'application/sdp'
      },
      body: pc.localDescription!.sdp
    });

    console.log('📡 WHIP response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ WHIP request failed with response:', errorText);
      throw new Error(`WHIP request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const answerSdp = await response.text();
    console.log('📡 Received WHIP answer, length:', answerSdp.length);
    console.log('📡 Setting remote description...');

    await pc.setRemoteDescription(new RTCSessionDescription({
      type: 'answer',
      sdp: answerSdp
    }));

    whipClient.value = pc;
    console.log('✅ WHIP connection setup completed');

    // Set a timeout to check if connection succeeds
    const connectionTimeout = setTimeout(() => {
      if (isConnecting.value && !isConnected.value) {
        console.warn('⚠️ Connection timeout - checking connection state');
        console.log('   Current connection state:', pc.connectionState);
        console.log('   Current ICE connection state:', pc.iceConnectionState);
        console.log('   Current signaling state:', pc.signalingState);

        if (pc.connectionState === 'connected') {
          console.log('✅ Connection actually succeeded despite timeout');
          isConnecting.value = false;
          isConnected.value = true;
        } else {
          console.error('❌ Connection timeout - forcing failure');
          isConnecting.value = false;
          isConnected.value = false;
          streamError.value = 'Connection timeout - please try again';
        }
      }
    }, 15000); // 15 second timeout

    // Clear timeout if connection succeeds
    const clearTimeoutIfConnected = () => {
      if (isConnected.value) {
        clearTimeout(connectionTimeout);
      }
    };

    // Monitor connection state changes
    pc.onconnectionstatechange = () => {
      clearTimeoutIfConnected();
    };

    console.log('=== WHIP CONNECTION SETUP COMPLETE ===');

  } catch (error: any) {
    console.error('❌ WHIP connection failed:', error);
    console.error('   Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    streamError.value = `WHIP connection failed: ${error.message}`;
    isConnecting.value = false;
    throw error;
  }
}

function getCurrentPrompt(): string {
  return isCustomSelected.value ? customStyle.value : selectedStyle.value;
}

async function updateStreamPrompt() {
  if (!streamId.value || !isStreaming.value) return;

  // Combine art style with selected text if available
  const artStyle = getCurrentPrompt();
  const selectedText = props.selectedText;

  let finalPrompt = artStyle;
  if (selectedText && selectedText.trim()) {
    finalPrompt = `Artwork of ${artStyle} style: ${selectedText}, highly detailed, digital art, vibrant colors, professional quality`;
  }
  
  if (!finalPrompt.trim()) return;

  try {
    console.log('🔄 Updating stream prompt:', finalPrompt);
    await DaydreamService.updateStreamParams(streamId.value!, DaydreamService.getDefaultParams(finalPrompt));
    console.log('✅ Stream prompt updated successfully');
    
    // Emit the updated prompt to parent
    emit('updatePrompt', finalPrompt);
  } catch (error: any) {
    console.error('❌ Failed to update prompt:', error);
    streamError.value = `Failed to update prompt: ${error.message}`;
  }
}


function openDropdown() {
  dropdownOpen.value = true;
  filterText.value = '';
  highlightedIndex.value = -1;
}

function closeDropdown() {
  dropdownOpen.value = false;
  filterText.value = '';
  highlightedIndex.value = -1;
}


async function selectStyle(style: string) {
  
  if (style === 'custom') {
    selectedStyle.value = 'custom';
    const saved = localStorage.getItem('epub-custom-art-style');
    customStyle.value = saved || '';
    nextTick(() => {
      if (comboboxInput.value) comboboxInput.value.focus();
    });
    if ((saved && saved.trim()) || (customStyle.value && customStyle.value.trim())) {
      updateStreamPrompt();
    }
  } else {

    selectedStyle.value = style;
    customStyle.value = '';
    updateStreamPrompt();
  }
  closeDropdown();
}

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  if (isCustomSelected.value) {
    customStyle.value = val;
    localStorage.setItem('epub-custom-art-style', val);
    if (isStreaming.value) {
      updateStreamPrompt();
    }
    // Close dropdown when typing custom style
    closeDropdown();
  } else {
    // Filter and show dropdown if there's text
    filterText.value = val;
    if (val.trim()) {
      if (!dropdownOpen.value) {
        openDropdown();
      }
      // Auto-select matching style as user types
      const matchedStyle = ArtStyles.find(style =>
        getLocalizedStyleName(style).toLowerCase().includes(val.toLowerCase()) ||
        getEnglishStyleName(style).toLowerCase().includes(val.toLowerCase())
      );
      
      if (matchedStyle && matchedStyle !== selectedStyle.value) {
        selectedStyle.value = matchedStyle;
        if (isStreaming.value) {
          updateStreamPrompt();
        }
      }
    } else {
      closeDropdown();
    }
    highlightedIndex.value = -1;
  }
}

function onArrowDown() {
  if (!dropdownOpen.value) openDropdown();
  if (highlightedIndex.value < filteredStyles.value.length - 1) {
    highlightedIndex.value++;
  } else if (isCustomSelected.value && highlightedIndex.value < filteredStyles.value.length) {
    highlightedIndex.value++;
  }
}

function onArrowUp() {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--;
  }
}

function onEnter() {
  if (dropdownOpen.value) {
    if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredStyles.value.length) {
      selectStyle(filteredStyles.value[highlightedIndex.value]);
    } else if (highlightedIndex.value === filteredStyles.value.length) {
      selectStyle('custom');
    } else if (isCustomSelected.value && customStyle.value) {
      updateStreamPrompt();
      localStorage.setItem('epub-custom-art-style', customStyle.value);
      closeDropdown();
    }
  } else if (isCustomSelected.value && customStyle.value) {
    updateStreamPrompt();
    localStorage.setItem('epub-custom-art-style', customStyle.value);
  }
}

watch([isCustomSelected, customStyle], ([isCustom, val]) => {
  if (isCustom) {
    // Always update localStorage when in custom mode, even with empty string
    // This ensures we clear the value when all characters are deleted
    localStorage.setItem('epub-custom-art-style', val || '');
  }
  if (isStreaming.value) {
    updateStreamPrompt();
  }
});

function onBlur() {
  setTimeout(() => closeDropdown(), 100);
}

watch(() => props.selectedArtStyle, (val) => {
  if (val && ArtStyles.includes(val as any)) {
    selectedStyle.value = val;
    customStyle.value = '';
  } else if (val && val !== 'custom') {
    selectedStyle.value = 'custom';
    customStyle.value = val;
  }
  if (isStreaming.value) {
    updateStreamPrompt();
  }
});

// Watch for language changes to ensure the displayed value updates
watch(currentLanguage, () => {
  // The displayedValue computed property will automatically update
  // when the language changes, causing Vue to re-render the input
});

// Watch for selectedText changes from parent and update streaming prompt
watch(() => props.selectedText, async (newText, oldText) => {
  console.log('👀 ImageViewer selectedText watcher triggered');
  console.log('   New text:', newText ? newText.slice(0, 50) + '...' : 'null');
  console.log('   Old text:', oldText ? oldText.slice(0, 50) + '...' : 'null');
  console.log('   isStreaming:', isStreaming.value);
  console.log('   streamId:', streamId.value);

  if (newText && newText !== oldText) {
    console.log('📝 New text detected, preparing for Daydream update');

    // Create enhanced prompt in the standardized format
    const artStyle = isCustomSelected.value ? customStyle.value : selectedStyle.value;
    const enhancedPrompt = `Artwork of ${artStyle} style: ${newText}, highly detailed, digital art, vibrant colors, professional quality`;

    console.log('🎨 Enhanced prompt for Daydream:', enhancedPrompt);

    // Always try to update Daydream if we have a stream ID, regardless of streaming state
    if (streamId.value) {
      try {
        console.log('🎬 [ImageViewer] Updating Daydream stream parameters (single update)');

        // Update Daydream stream parameters with new prompt
        const params = DaydreamService.getDefaultParams(enhancedPrompt);
        await DaydreamService.updateStreamParams(streamId.value, params);

        console.log('✅ [ImageViewer] Daydream parameters updated successfully (single update)');

        // Emit prompt update to parent
        emit('updatePrompt', enhancedPrompt);
      } catch (error: any) {
        console.error('❌ [ImageViewer] Failed to update stream parameters:', error);
        streamError.value = `Failed to update prompt: ${error.message}`;
      }
    } else {
      console.log('ℹ️ [ImageViewer] No stream ID available yet, but prompt prepared for when streaming starts');
      // Emit prompt update anyway so it's ready when streaming starts
      emit('updatePrompt', enhancedPrompt);
    }
  } else {
    console.log('⚠️ [ImageViewer] No new text or text unchanged - skipping update');
  }
});

// Note: Removed summaryData watcher to prevent duplicate Daydream API calls
// The selectedText watcher handles all prompt updates now

// Watch for aiMode changes
watch(() => props.aiMode, (newMode, oldMode) => {
  console.log('🎭 AI Mode changed:', oldMode, '→', newMode);
  if (oldMode === 'streaming' && newMode === 'static') {
    // Stop streaming when switching to static mode
    if (isStreaming.value) {
      stopStreaming();
    }
  }
});

// Watch for streaming state changes
watch([isStreaming, isConnecting, isConnected, playbackId], ([streaming, connecting, connected, pbId]) => {
  console.log('📊 Streaming state changed:', {
    isStreaming: streaming,
    isConnecting: connecting,
    isConnected: connected,
    playbackId: pbId,
    iframeKey: iframeKey.value
  });
});



// Iframe event handlers for debugging
function onIframeLoad() {
  console.log('📺 Iframe loaded successfully');
  if (playbackId.value) {
    console.log('📺 Iframe src:', DaydreamService.getOutputUrl(playbackId.value));
  }
  iframeLoaded.value = true;
}

function onIframeError() {
  console.error('❌ Iframe failed to load');
  if (playbackId.value) {
    console.error('❌ Iframe src that failed:', DaydreamService.getOutputUrl(playbackId.value));
  }
  streamError.value = 'Failed to load video player';
  iframeLoaded.value = false;
}

// Auto-refresh iframe after connection is established to try to get stream
let streamStartTimeout: ReturnType<typeof setTimeout> | null = null;

watch([isConnected, playbackId], ([connected, pbId]) => {
  if (connected && pbId && !streamStartTimeout) {
    console.log('🎬 Stream connected, scheduling iframe refresh...');
    // Wait a bit for the stream to become available, then refresh iframe
    streamStartTimeout = setTimeout(() => {
      console.log('🔄 Auto-refreshing iframe to connect to stream...');
      iframeKey.value++;
      streamStartTimeout = null;
    }, 3000); // 3 seconds delay
  }
});

// Clear timeout when component unmounts
onUnmounted(() => {
  if (streamStartTimeout) {
    clearTimeout(streamStartTimeout);
    streamStartTimeout = null;
  }
  stopNoiseProcessing();
});

// Expose methods to parent
defineExpose({
  // No methods needed for fixed noise parameters
});

// Check iframe visibility on mount
onMounted(() => {
  console.log('🎬 ImageViewer mounted');
  console.log('   Current state:', {
    isStreaming: isStreaming.value,
    playbackId: playbackId.value,
    isConnecting: isConnecting.value,
    isConnected: isConnected.value,
    aiMode: props.aiMode
  });
});





onMounted(async () => {
  if (props.selectedArtStyle && !ArtStyles.includes(props.selectedArtStyle as any)) {
    selectedStyle.value = 'custom';
    customStyle.value = props.selectedArtStyle;
  } else if (selectedStyle.value === 'custom') {
    const saved = localStorage.getItem('epub-custom-art-style');
    if (saved) customStyle.value = saved;
  }

  // Request camera permissions and automatically start streaming
  try {
    await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    console.log('🎬 Camera permissions granted, starting streaming automatically...');

    // Automatically start streaming
    await startStreaming();
  } catch (err) {
    console.warn('Camera access not granted:', err);
    console.log('⚠️ Cannot start streaming automatically - camera access denied');
  }
});
</script>

<style scoped>
.image-viewer {
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

.image-container {
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
  margin: 0 0 20px 0;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  border-radius: 2px;
  transition: width 0.3s ease;
}

.image-display {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 320px;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
  border-radius: var(--radius);
}

.image-hover-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.image-hover-container::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.55);
  border-radius: 12px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  z-index: 1;
}

.image-hover-container:hover::before,
.image-hover-container:focus-within::before {
  opacity: 0.22;
  background: rgba(0,0,0,0.72);
}

.image-hover-buttons {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  gap: 14px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s, transform 0.18s;
  width: auto;
  background: none;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
  align-items: center;
  z-index: 10;
}

.image-hover-container:hover .image-hover-buttons,
.image-hover-container:focus-within .image-hover-buttons {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, -50%) scale(1.04);
}

.image-hover-container img,
.image-hover-container video {
  display: block;
  width: auto;
  max-width: 100%;
  max-height: 100%;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.12);
  object-fit: contain;
  z-index: 0;
}

.media-player {
  background: #000;
  border-radius: 12px;
}

.static-content-overlay {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.static-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
}

.image-hover-buttons .action-btn {
  font-size: 1rem;
  padding: 12px 0;
  border-radius: 8px;
  background: #fff;
  color: #007AFF;
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.13);
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.12s, opacity 0.18s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  cursor: pointer;
  width: 160px;
  min-width: 160px;
  min-height: 48px;
  opacity: 0.7;
}

.image-hover-buttons .action-btn:hover,
.image-hover-buttons .action-btn:focus {
  background: #e6eeff;
  color: #0056CC;
  box-shadow: 0 4px 16px rgba(0,122,255,0.10);
  transform: translateY(-2px) scale(1.05);
  opacity: 1;
}

.image-hover-buttons .action-btn:active {
  background: #dbeafe;
  color: #003e99;
  transform: scale(0.97);
}

.image-hover-buttons .action-btn:disabled {
  color: #C7C7CC;
  cursor: not-allowed;
  background: #f0f0f0;
  box-shadow: none;
}

.image-info {
  margin-top: 20px;
}

.summary-section h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--color-text);
}

.summary-section p {
  font-size: 14px;
  color: var(--color-muted);
  line-height: 1.5;
  margin: 0;
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

.combobox-wrapper {
  position: relative;
  display: inline-block;
  min-width: 240px;
  margin-top: 8px
}

.combobox-input {
  font-size: 1rem;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  outline: none;
  transition: border 0.2s;
  width: 220px;
  background: rgb(239,226,204);
  color: #1D1D1F;
}
.combobox-input:focus {
  border: 1.5px solid #007AFF;
}
.combobox-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 10;
  background: rgb(239,226,204);
  border: 1px solid #ccc;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  margin-top: 2px;
  list-style: none;
  padding: 0;
  height: auto;
  overflow-y: visible;
}
/* If there are more than 8 items, limit height and enable scroll */
.combobox-dropdown.too-many {
  max-height: 320px;
  overflow-y: auto;
}
.combobox-dropdown li {
  padding: 10px 14px;
  cursor: pointer;
  font-size: 1rem;
  color: #1D1D1F;
  background: rgb(239,226,204);
  transition: background 0.15s;
}
.combobox-dropdown li.selected,
.combobox-dropdown li:hover {
  background: #e6eeff;
  color: #0056CC;
}
.external-links {
  display: flex;
  align-items: right;
  gap: 8px;
  margin-left: auto;
}
.docs-link, .github-link {
  position: static;
  bottom: unset;
  right: unset;
  z-index: 1;
  opacity: 0.82;
  transition: opacity 0.18s, transform 0.18s;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 4px;
  display: flex;
  align-items: center;
}

.lang-btn {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 6px;
  border-radius: 50%;
  border:0;
  position: static;
  bottom: unset;
  right: unset;
  z-index: 1;
  opacity: 0.82;
  transition: opacity 0.18s, transform 0.18s;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  cursor: pointer;
}

  
.docs-link {
  right: 62px;
}
.github-link {
  right: 24px;
}

 
.lang-btn:hover,
.lang-btn:hover,
.docs-link:hover, .github-link:hover {
  opacity: 1;
  background:  rgba(255,255,255,0.5);
  transform: scale(1.02) translateY(-1px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  border:0
}
.image-viewer {
  position: relative;
}

.streaming-mode-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.stream-container {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 520px; /* 512px + some padding */
  overflow: hidden;
  background: transparent;
  border: none;
}

.stream-iframe {
  width: 512px;
  height: 512px;
  border: none;
  border-radius: 10px;
  background: transparent !important;
  display: block !important;
  position: relative;
  z-index: 1;
  opacity: 1 !important;
  visibility: visible !important;
  margin: 0 auto; /* Center the iframe */
}

/* Ensure iframe is always visible when it exists */
.stream-container iframe {
  display: block !important;
  width: 512px !important;
  height: 512px !important;
  background: transparent !important;
  border: none !important;
  position: relative !important;
  z-index: 1 !important;
  opacity: 1 !important;
  visibility: visible !important;
  margin: 0 auto !important; /* Center the iframe */
}

/* Force iframe visibility in all states */
.stream-iframe {
  display: block !important;
  width: 512px !important;
  height: 512px !important;
  background: transparent !important;
  border: none !important;
  position: relative !important;
  z-index: 1 !important;
  opacity: 1 !important;
  visibility: visible !important;
  margin: 0 auto !important; /* Center the iframe */
}

.stream-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 520px; /* Match container height */
  background: transparent;
  color: #white;
  text-align: center;
  padding: 40px 20px;
}

.stream-placeholder.connecting {
  background: transparent;
}

.stream-placeholder.stream-starting {
  background: transparent;
}

.stream-placeholder h4 {
  color: #ffffff;
  margin: 16px 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.connecting-text {
  color: var(--color-text) !important;
}

.stream-placeholder p {
  color: var(--color-text) !important;
}

.stream-placeholder p {
  color: #b0b0b0;
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.stream-placeholder .empty-icon {
  color: #666;
  margin-bottom: 16px;
}

.stream-controls-overlay {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.update-prompt-btn {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 4px;
}

.update-prompt-btn:hover {
  background: rgba(0, 122, 255, 0.8);
  border-color: rgba(0, 122, 255, 0.6);
  transform: translateY(-1px);
}






.stream-error {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  padding: 12px;
  background: rgba(255, 59, 48, 0.9);
  color: white;
  border-radius: 8px;
  font-size: 14px;
  backdrop-filter: blur(10px);
  z-index: 10;
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
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #0056CC;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

</style>