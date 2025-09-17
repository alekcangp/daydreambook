<template>
  <div id="app">
    <main class="app-main">
      <EpubReader
        ref="epubReaderRef"
        :ai-mode="aiMode"
        @toggle-ai-mode="aiMode = $event"
      />
    </main>
    
    <!-- Mode Toggle Button -->
    <button
      v-if="showInfo"
      @click="toggleAIMode"
      class="mode-toggle-btn"
      :class="{ 'streaming-mode': aiMode === 'streaming' }"
      :title="aiMode === 'streaming' ? t.staticMode : t.streamingMode"
    >
      <svg v-if="aiMode === 'static'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21,15 16,10 5,21"/>
      </svg>
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17,8 12,13 7,8"/>
        <path d="M12 20a1 1 0 0 0 0-2 1 1 0 0 0 0 2z"/>
      </svg>
      <span>{{ aiMode === 'streaming' ? t.staticMode : t.streamingMode }}</span>
    </button>

    
    <div class="app-info-overlay" v-if="showInfo">
      <div class="info-content">
        <button @click="showInfo = false" class="close-info">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        
        <div class="info-section" id="features">
          <h2>Features</h2>
          <div class="feature-grid">
            <div class="feature-card">
              <div class="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
              </div>
              <h3>EPUB Reading</h3>
              <p>Upload and read EPUB books with smooth pagination and keyboard navigation</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
              </div>
              <h3>AI Illustrations</h3>
              <p>Generate beautiful AI-powered illustrations for each page using Cloudflare Workers AI</p>
            </div>
          </div>
        </div>
        
        <div class="info-section" id="about">
          <h2>About AI Books</h2>
          <p>
            AI Books transforms the reading experience by combining traditional EPUB reading with 
            cutting-edge AI technology. As you read, our AI generates beautiful illustrations that 
            bring your stories to life, creating a unique visual narrative alongside the text.
          </p>
          <p>
            Select any text passage to generate custom illustrations that bring your stories to life.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import EpubReader from './components/EpubReader.vue';
import { useI18n } from './composables/useI18n';

const { t } = useI18n();
const aiMode = ref<'static' | 'streaming'>('static');

const toggleAIMode = () => {
  aiMode.value = aiMode.value === 'static' ? 'streaming' : 'static';
};

const showInfo = ref(false);
const epubReaderRef = ref();
</script>

<style scoped>
#app {
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.app-main {
  flex: 1;
  position: relative;
}

.mode-toggle-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 122, 255, 0.2);
  border-radius: 12px;
  color: #1D1D1F;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  min-width: 140px;
  justify-content: center;
}

.mode-toggle-btn:hover {
  background: white;
  border-color: rgba(0, 122, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.mode-toggle-btn.streaming-mode {
  background: rgba(0, 122, 255, 0.1);
  border-color: rgba(0, 122, 255, 0.4);
  color: #007AFF;
}

.mode-toggle-btn.streaming-mode:hover {
  background: rgba(0, 122, 255, 0.15);
  color: #0056CC;
}

.mode-toggle-btn svg {
  flex-shrink: 0;
}


.app-info-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.info-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.close-info {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: #86868B;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-info:hover {
  background: #F2F2F7;
  color: #1D1D1F;
}

.info-section {
  margin-bottom: 32px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: #1D1D1F;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.feature-card {
  padding: 20px;
  border: 1px solid #E5E5EA;
  border-radius: 12px;
  text-align: center;
}

.feature-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 122, 255, 0.1);
  border-radius: 12px;
  color: #007AFF;
  margin: 0 auto 12px;
}

.feature-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1D1D1F;
}

.feature-card p {
  font-size: 14px;
  color: #86868B;
  line-height: 1.4;
  margin: 0;
}

.info-section p {
  font-size: 16px;
  line-height: 1.6;
  color: #1D1D1F;
  margin: 0 0 16px 0;
}

.info-section p:last-child {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .info-content {
    padding: 24px;
    margin: 16px;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>