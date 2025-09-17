<template>
  <div class="epub-reader">
    <!-- Always-mounted hidden file input for uploads -->
    <input
      ref="fileInput"
      type="file"
      accept=".epub,application/epub+zip"
      style="display: none"
      @change="onFileInputChange"
      />
    <div class="reader-interface">
      <div class="reader-layout">
        <div :class="['reader-pane', showUpload ? 'upload-mode' : '']">
          <template v-if="showUpload">
            <div class="upload-zone" @click="onUploadZoneClick" @drop.prevent="onDrop" @dragover.prevent @dragleave.prevent>
              <div class="upload-icon">📚</div>
              <h3>{{ t.dragAndDrop }}</h3>
              <p>{{ t.supportedFormat }}</p>
              <div v-if="isLoadingBook" class="loading-indicator">{{ t.processingEpub }}</div>
              <div v-if="uploadError" class="error-message">{{ uploadError }}</div>
              <button class="upload-btn" @click.stop="onUploadZoneClick">{{ t.uploadBook }}</button>
            </div>
          </template>
          <template v-else>
            <div class="book-viewer-scrollable">
              <BookViewer
                ref="bookViewerRef"
                :key="bookViewerKey"
                :currentCfi="currentCfi"
                :totalPages="totalPages"
                :metadata="bookMetadata"
                :isLoadingBook="isLoadingBook"
                :fontSize="fontSize"
                @pageChange="handlePageChange"
                @textSelected="handleTextSelection"
                @bookReady="onBookReady"
                @restoreComplete="onRestoreComplete"
              />
            </div>
            <div v-if="!isLoadingBook" class="viewer-controls">
              <div class="navigation-controls">
                <button 
                  class="nav-btn load-book-btn"
                  @click="onUploadZoneClick"
                  :disabled="isLoadingBook"
                  :title="t.loadBook"
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button 
                  @click="previousPage" 
                  class="nav-btn"
                  :disabled="!bookLoaded || isLoadingBook"
                  :title="t.previousPage"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <div class="page-input-container">
                  <!-- Slider and page number hidden for minimal navigation -->
                </div>
                <button 
                  @click="nextPage" 
                  class="nav-btn"
                  :disabled="!bookLoaded || isLoadingBook"
                  :title="t.nextPage"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
              <div class="action-controls">
                <button @click="decreaseFontSize" class="action-btn" :disabled="!bookLoaded || isLoadingBook || fontSize <= minFontSize" :title="t.decreaseTextSize">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
                <button @click="increaseFontSize" class="action-btn" :disabled="!bookLoaded || isLoadingBook || fontSize >= maxFontSize" :title="t.increaseTextSize">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
                <button @click="toggleBookmark" class="action-btn" :class="{ 'active-bookmark': isCurrentBookmarked }" :disabled="!bookLoaded || isLoadingBook" :title="t.addRemoveBookmark">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                  </svg>
                </button>
                <button @click="showBookmarks = true" class="action-btn" :disabled="!bookLoaded || isLoadingBook" :title="t.showBookmarks">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 3a2 2 0 0 0-2 2v16l7-4 7 4V5a2 2 0 0 0-2-2H5z"/>
                    <line x1="8" y1="8" x2="16" y2="8"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                    <line x1="8" y1="16" x2="13" y2="16"/>
                  </svg>
                </button>
              </div>
            </div>
          </template>
        </div>
        <div class="image-pane">
          <ImageViewer
            ref="imageViewerRef"
            :aiMode="aiMode"
            :imageUrl="currentGeneration?.imageUrl"
            :summary="currentGeneration?.summary"
            :isGenerating="isGeneratingImage"
            :selectedText="selectedText"
            :bookTitle="bookMetadata?.title"
            :selectedArtStyle="selectedArtStyle"
            :wasCanceled="wasGenerationCanceled"
            @regenerate="regenerateCurrentImageWithStyle"
            @download="downloadImage"
            @updatePrompt="handleStreamPromptUpdate"
            @stream-created="handleStreamCreated"
          />
        </div>
      </div>
    </div>
    <transition name="fade">
      <div v-if="showBookmarks" class="bookmarks-modal" @click.self="showBookmarks = false">
        <div class="modal-content">
          <div class="modal-header">
      <h3>{{ t.bookmarks }}</h3>
            <button class="close-x-btn" @click="showBookmarks = false" :title="t.close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="bookmark-list">
            <div v-for="bookmark in bookmarks" :key="bookmark.positionId + bookmark.timestamp" class="bookmark-item" @click="goToBookmark(bookmark.positionId)">
              <div class="bookmark-info">
                <span class="bookmark-title">{{ bookmark.label }}</span>
                <span class="bookmark-date">{{ new Date(bookmark.timestamp).toLocaleString() }}</span>
              </div>
              <button @click.stop="removeBookmark(bookmark.positionId)" class="remove-bookmark">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import BookViewer from './BookViewer.vue';
import ImageViewer from './ImageViewer.vue';
import epubService from '../services/epubService';
import CloudflareAIService from '../services/cloudflareAI';
import type { BookMetadata, AIGeneration } from '../types/epub';
import { useI18n } from '../composables/useI18n';

// State management
interface Props {
  aiMode?: 'static' | 'streaming';
}

const props = withDefaults(defineProps<Props>(), {
  aiMode: 'static'
});


const { t } = useI18n();
const bookLoaded = ref(false);
const isLoadingBook = ref(false);
const uploadError = ref('');
const bookMetadata = ref<BookMetadata | null>(null);
const currentCfi = ref<string | null>(null);
const totalPages = ref(1);
const currentPageNumber = ref(1);
const currentGeneration = ref<AIGeneration | null>(null);
const isGeneratingImage = ref(false);
const wasGenerationCanceled = ref(false);
const selectedText = ref('');
const currentPageText = ref(''); // Track current page text for streaming
const showUpload = ref(true); // controls upload UI (for drag-and-drop, optional)
const fileInput = ref<HTMLInputElement | null>(null);
const bookViewerKey = ref(0);
const bookViewerRef = ref();
const imageViewerRef = ref();
const showBookCover = ref(false);

const aiService = new CloudflareAIService();

// Set up callback for IO API success
aiService.setOnSummarySuccess(async (summary: string, originalText: string) => {
  console.log('🎉 IO API success callback triggered!');
  console.log('   Summary:', summary.slice(0, 100) + '...');
  console.log('   Original text length:', originalText.length);


  // Update selectedText to trigger ImageViewer watcher
  console.log('🔄 Updating selectedText from IO callback');
  selectedText.value = summary;

  // Update currentStreamPrompt for streaming mode
  currentStreamPrompt.value = summary;
  console.log('📝 Updated currentStreamPrompt for streaming mode');

  // Note: Removed direct Daydream API call here to prevent duplicates
  // The ImageViewer watcher will handle the Daydream update when selectedText changes
  console.log('ℹ️ Daydream update will be handled by ImageViewer watcher');
});

// AbortController for AI image generation
let imageGenAbortController: AbortController | null = null;

type Bookmark = { positionId: string; label: string; timestamp: number; snippet?: string };
const bookmarks = ref<Bookmark[]>([]);
const showBookmarks = ref(false);

const getBookmarksKey = () => `epub-bookmarks-${bookMetadata.value?.title || 'default'}`;
const getFontSizeKey = () => `epub-font-size-${bookMetadata.value?.title || 'default'}`;

const selectedArtStyle = ref(localStorage.getItem('epub-art-style') || 'futuristic');
const currentStreamPrompt = ref('');

let pendingRestoreCfi: string | null = null;
let cfiRestorationTimeout: ReturnType<typeof setTimeout> | null = null;

const handleFileUpload = async (file: File) => {
  showBookCover.value = false;
  try {
    // Reset state
    bookMetadata.value = null;
    currentCfi.value = null;
    currentGeneration.value = null;
    isLoadingBook.value = true;
    uploadError.value = '';
    showUpload.value = false;
    bookLoaded.value = false;
    pendingRestoreCfi = null;

    if (cfiRestorationTimeout) {
      clearTimeout(cfiRestorationTimeout);
      cfiRestorationTimeout = null;
    }

    // Save book as Data URL in localStorage for reload persistence
    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = e.target?.result as string;
      localStorage.setItem('lastOpenedBook', dataUrl);
    };
    reader.readAsDataURL(file);

    // Load the book into memory
    const arrayBuffer = await file.arrayBuffer();
    (window as any).lastOpenedBookArrayBuffer = arrayBuffer;

    // Load metadata
    try {
      const metadata = await epubService.loadEpub(file);
      bookMetadata.value = metadata;
      
      // Store just the book name for reference
      localStorage.setItem('lastOpenedBookName', file.name);
      
      // Load book-specific font size (ensure always restored after reload)
      const savedFontSize = localStorage.getItem(getFontSizeKey());
      if (savedFontSize) {
        fontSize.value = parseInt(savedFontSize, 10);
      } else {
        fontSize.value = 150; // Default font size for new books
      }
      
      // Force BookViewer to reinitialize (after CFI is set)
      bookViewerKey.value++;
      
      // Set a maximum timeout for loading
      const loadingTimeout = setTimeout(() => {
        if (isLoadingBook.value) {
          console.log('Loading timeout reached - forcing state reset');
          isLoadingBook.value = false;
    bookLoaded.value = true;
        }
      }, 25000); // 25 second maximum loading time

      // Wait for book to be ready
      await new Promise<void>((resolve) => {
        const checkLoaded = () => {
          if (bookLoaded.value) {
            clearTimeout(loadingTimeout);
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });

      console.log('Book loading completed successfully');
    } catch (error) {
      console.error('Error loading EPUB:', error);
      uploadError.value = t.value.failedToLoadEpub;
      localStorage.removeItem('lastOpenedBook');
      localStorage.removeItem('lastOpenedBookName');
      showUpload.value = true;
      isLoadingBook.value = false;
      bookLoaded.value = false;
      return;
    }
  } catch (error) {
    console.error('File handling error:', error);
    uploadError.value = t.value.errorHandlingFile;
    localStorage.removeItem('lastOpenedBook');
    localStorage.removeItem('lastOpenedBookName');
    isLoadingBook.value = false;
    showUpload.value = true;
    bookLoaded.value = false;
  }
};

function onFileInputChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file && (file.type === 'application/epub+zip' || file.name.toLowerCase().endsWith('.epub'))) {
    handleFileUpload(file);
  } else {
    uploadError.value = t.value.selectValidEpub;
  }
  if (fileInput.value) fileInput.value.value = '';
  }

const handleTextSelection = async (text: string) => {
  console.log('📝 Text selection detected, waiting for IO API result before updating...');

  // If a generation is in progress, show 'Illustration canceled' for 1 second before starting new generation
  if (isGeneratingImage.value && props.aiMode === 'static') {
    wasGenerationCanceled.value = true;
    isGeneratingImage.value = false;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (props.aiMode === 'static') {
    // For static mode, still need to generate image immediately
    await generateImageForSelection(text);
  } else {
    // For streaming mode, just initiate the summarization
    // The IO callback will handle updating selectedText when ready
    try {
      console.log('🚀 Initiating text summarization for streaming mode...');
      await aiService.summarizeText(text);
      // selectedText will be updated by the IO callback when summarization completes
    } catch (error) {
      console.error('❌ Text summarization failed:', error);
      // Fallback: use raw text if summarization fails
      selectedText.value = text;
      currentStreamPrompt.value = text;
      console.log('📝 Using raw text as fallback for streaming selection');
    }
  }
};

let currentGenerationToken = 0;

const generateImageForSelection = async (text: string, style?: string) => {
  if (!text.trim()) return;
  // Abort any in-progress generation
  if (imageGenAbortController) {
    imageGenAbortController.abort();
  }
  imageGenAbortController = new AbortController();
  // Clear previous image immediately
  currentGeneration.value = null;
  isGeneratingImage.value = true;
  wasGenerationCanceled.value = false;
  const myToken = ++currentGenerationToken;
  try {
    // Summarize the selected text first
    const summary = await aiService.summarizeText(text, imageGenAbortController.signal);
    if (!summary || !summary.trim()) throw new Error('No summary generated');
    const imageUrl = await aiService.generateImage(summary, style || selectedArtStyle.value, imageGenAbortController.signal);
    if (myToken !== currentGenerationToken) return; // Outdated
    currentGeneration.value = {
      summary,
      imageUrl,
      prompt: summary,
      isLoading: false
    };
    wasGenerationCanceled.value = false;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      wasGenerationCanceled.value = true;
      return;
    }
    wasGenerationCanceled.value = false;
    console.error('Failed to summarize or generate image:', error);
  } finally {
    if (myToken === currentGenerationToken) isGeneratingImage.value = false;
  }
};

// Streaming mode functions
const updateStreamPrompt = async (prompt: string) => {
  currentStreamPrompt.value = prompt;
  
  // If stream is active, update parameters
  if (props.aiMode === 'streaming' && currentStreamPrompt.value) {
    try {
      // This would trigger StreamViewer to update its prompt
      // For now, just store it - StreamViewer will watch this or receive via props
      console.log('Updating stream prompt:', prompt);
    } catch (error) {
      console.error('Failed to update stream prompt:', error);
    }
  }
};

const handleStreamPromptUpdate = (prompt: string) => {
  currentStreamPrompt.value = prompt;
  // The StreamViewer handles the Daydream API update directly
  console.log('Stream prompt updated:', prompt);
};

const currentStreamId = ref<string | null>(null);

const handleStreamCreated = async (streamData: { streamId: string; playbackId: string }) => {
  currentStreamId.value = streamData.streamId;
  console.log('Stream created with ID:', currentStreamId.value);

  // Note: Removed direct Daydream API call here to prevent duplicates
  // The ImageViewer will handle updating the stream when it receives the stream-created event
  // and detects that selectedText has a value
  console.log('ℹ️ Stream creation complete - ImageViewer will handle initial prompt update');
};


const regenerateCurrentImageWithStyle = async (style?: string) => {
  if (style && style !== selectedArtStyle.value) {
    selectedArtStyle.value = style;
  }
  
  if (props.aiMode === 'static') {
    const content = selectedText.value;
    if (content) {
      await generateImageForSelection(content, style || selectedArtStyle.value);
    } else {
      await generateImageForCurrentPage(style || selectedArtStyle.value);
    }
  } else {
    // In streaming mode, just update the style for future generations
    // StreamViewer will handle live updates
    console.log('Style updated for streaming mode:', style || selectedArtStyle.value);
  }
};

const downloadImage = (imageUrl: string) => {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = `ai-illustration-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

let imageGenDebounceTimer: ReturnType<typeof setTimeout> | null = null;

async function handlePageChange({ page, cfi }: { page: number; cfi: string }) {
  // Update currentPositionId after page change
  currentPositionId.value = bookViewerRef.value?.getCurrentPositionId?.() ?? null;
  if (pendingRestoreCfi) {
    if (cfi === pendingRestoreCfi) {
      // Arrived at the restored CFI, now allow saving
      
      pendingRestoreCfi = null;
      if (cfiRestorationTimeout) {
        clearTimeout(cfiRestorationTimeout);
        cfiRestorationTimeout = null;
      }
    } else {
      // Not at the restored CFI yet, do not save
      return;
    }
  }
  
  if (cfi) {
    currentCfi.value = cfi;
    currentPageNumber.value = page;
    
    if (props.aiMode === 'static') {
      // Debounce image generation for static mode
      if (imageGenDebounceTimer) clearTimeout(imageGenDebounceTimer);
      imageGenDebounceTimer = setTimeout(() => {
        generateImageForCurrentPage(selectedArtStyle.value);
      }, 500); // 500ms debounce
    } else {
      // For streaming mode, get page text and update prompt
      const text = await bookViewerRef.value?.getCurrentPageText?.();
      if (text && text.trim().length > 0) {
        currentPageText.value = text; // Store raw page text

        // Initiate summarization - IO callback will handle the update
        try {
          console.log('📖 Page changed - initiating summarization for Daydream update');
          console.log('📄 Current page text length:', text.length);

          await aiService.summarizeText(text);
          // selectedText and currentStreamPrompt will be updated by IO callback
        } catch (error) {
          console.warn('⚠️ Summarization failed, using raw text:', error);
          const newPrompt = text.slice(0, 200);
          selectedText.value = newPrompt;
          currentStreamPrompt.value = newPrompt;

          console.log('📝 Using raw text for stream prompt:', newPrompt.slice(0, 100) + '...');
        }
      } else {
        console.log('📭 No text content found on current page');
        selectedText.value = `${bookMetadata.value?.title || 'Unknown Book'} - page ${page}`;
        currentStreamPrompt.value = selectedText.value;
      }
    }
  } else {
    // Only update page number if CFI didn't change
    currentPageNumber.value = page;
  }
}

async function generateImageForCurrentPage(style?: string) {
  // Only generate for static mode
  if (props.aiMode !== 'static') return;
  
  // Abort any in-progress generation
  if (imageGenAbortController) {
    imageGenAbortController.abort();
  }
  imageGenAbortController = new AbortController();
  const text = await bookViewerRef.value?.getCurrentPageText?.();
  if (text && text.trim().length > 0) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pause before generating
    isGeneratingImage.value = true;
    wasGenerationCanceled.value = false;
    currentGeneration.value = null;
    const myToken = ++currentGenerationToken;
    try {
      // Summarize the page text
      const summary = await aiService.summarizeText(text, imageGenAbortController.signal);
      const imageUrl = await aiService.generateImage(summary, style || selectedArtStyle.value, imageGenAbortController.signal);
      if (myToken !== currentGenerationToken) return;
      currentGeneration.value = {
        summary,
        imageUrl,
        prompt: summary,
        isLoading: false
      };
      wasGenerationCanceled.value = false;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        wasGenerationCanceled.value = true;
        return;
      }
      wasGenerationCanceled.value = false;
      console.error('Failed to summarize or generate image:', error);
    } finally {
      if (myToken === currentGenerationToken) isGeneratingImage.value = false;
    }
  } else {
    currentGeneration.value = null;
  }
}

let lastPageTurnTime = 0;
const PAGE_TURN_DELAY = 10; // ms

async function nextPage() {
  const now = Date.now();
  if (now - lastPageTurnTime < PAGE_TURN_DELAY) return;
  lastPageTurnTime = now;
  // If user turns page during CFI restoration, clear restoration state
  if (pendingRestoreCfi) {
    pendingRestoreCfi = null;
    if (cfiRestorationTimeout) {
      clearTimeout(cfiRestorationTimeout);
      cfiRestorationTimeout = null;
    }
    console.log('[EpubReader] User turned page during CFI restoration, clearing pendingRestoreCfi');
  }
  if (bookViewerRef.value?.nextPage) {
    await bookViewerRef.value.nextPage();
  }
}
async function previousPage() {
  const now = Date.now();
  if (now - lastPageTurnTime < PAGE_TURN_DELAY) return;
  lastPageTurnTime = now;
  // If user turns page during CFI restoration, clear restoration state
  if (pendingRestoreCfi) {
    pendingRestoreCfi = null;
    if (cfiRestorationTimeout) {
      clearTimeout(cfiRestorationTimeout);
      cfiRestorationTimeout = null;
    }
    console.log('[EpubReader] User turned page during CFI restoration, clearing pendingRestoreCfi');
  }
  if (bookViewerRef.value?.previousPage) {
    await bookViewerRef.value.previousPage();
  }
}

function handleKeydown(event: KeyboardEvent) {
  const tag = (event.target as HTMLElement)?.tagName;
  const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (event.target as HTMLElement)?.isContentEditable;
  if (isInput) return;
  if (event.key === 'ArrowLeft') {
    previousPage();
  } else if (event.key === 'ArrowRight') {
    nextPage();
  }
}

// Navigation bar state and logic
const pageInputValue = ref(1);
const fontSize = ref(100); // Will be loaded per-book
const minFontSize = 80;
const maxFontSize = 350;

// Restore font size for the current book on book load or metadata change
watch(bookMetadata, () => {
  if (bookMetadata.value) {
    const savedFontSize = localStorage.getItem(getFontSizeKey());
    if (savedFontSize) {
      fontSize.value = parseInt(savedFontSize, 10);
    } else {
      fontSize.value = 100;
    }
  }
});

function increaseFontSize() {
  if (fontSize.value < maxFontSize) {
    fontSize.value += 10;
    localStorage.setItem(getFontSizeKey(), String(fontSize.value));
  }
}

function decreaseFontSize() {
  if (fontSize.value > minFontSize) {
    fontSize.value -= 10;
    localStorage.setItem(getFontSizeKey(), String(fontSize.value));
  }
}

// Update bookmark if on a bookmarked position when font size changes
watch(fontSize, async (val, oldVal) => {
  if (bookMetadata.value && oldVal !== undefined && val !== oldVal && bookmarks.value.length > 0) {
    const positionId = bookViewerRef.value?.getCurrentPositionId?.();
    if (!positionId) return;
    const idx = bookmarks.value.findIndex(b => b.positionId === positionId);
    if (idx > -1) {
      // Update the bookmark to the new positionId
      bookmarks.value[idx].positionId = positionId;
      saveBookmarks();
    }
  }
});
// Also update on window resize
window.addEventListener('resize', async () => {
  const positionId = bookViewerRef.value?.getCurrentPositionId?.();
  if (!positionId) return;
  const idx = bookmarks.value.findIndex(b => b.positionId === positionId);
  if (idx > -1) {
    bookmarks.value[idx].positionId = positionId;
    saveBookmarks();
  }
});

// Keep slider in sync with BookViewer
watch(() => pageInputValue.value, (val) => {
  if (val < 1) pageInputValue.value = 1;
  if (val > totalPages.value) pageInputValue.value = totalPages.value;
});

onMounted(() => {
  const lastBook = localStorage.getItem('lastOpenedBook');
  const lastBookName = localStorage.getItem('lastOpenedBookName') || 'book.epub';
  if (lastBook) {
    const arr = lastBook.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !arr[1]) {
      throw new Error('Invalid image data URL');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    const file = new File([u8arr], lastBookName, { type: mime });
    showUpload.value = false;
    handleFileUpload(file).then(() => {
      // Restore font size for the current book after reload
      const savedFontSize = localStorage.getItem(getFontSizeKey());
      if (savedFontSize) {
        fontSize.value = parseInt(savedFontSize, 10);
      } else {
        fontSize.value = 100;
      }
    });
  }
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  if (cfiRestorationTimeout) {
    clearTimeout(cfiRestorationTimeout);
  }
});

function loadBookmarks() {
  const saved = localStorage.getItem(getBookmarksKey());
  if (saved) {
    try {
      bookmarks.value = JSON.parse(saved);
    } catch {
      bookmarks.value = [];
    }
  } else {
    bookmarks.value = [];
  }
}

function saveBookmarks() {
  localStorage.setItem(getBookmarksKey(), JSON.stringify(bookmarks.value));
}

const currentPositionId = ref<string | null>(null);
function onRestoreComplete(positionId: string) {
  currentPositionId.value = positionId;
}

const isCurrentBookmarked = computed(() => {
  if (!currentPositionId.value) return false;
  return bookmarks.value.some(b => b.positionId === currentPositionId.value);
});

async function toggleBookmark() {
  const positionId = bookViewerRef.value?.getCurrentPositionId?.();
  if (!positionId) return;
  const idx = bookmarks.value.findIndex(b => b.positionId === positionId);
  if (idx > -1) {
    bookmarks.value.splice(idx, 1);
    saveBookmarks();
    return;
  }
  // Optionally get a snippet for display
  const snippet = await bookViewerRef.value?.getCurrentPageText?.();
  bookmarks.value.push({ positionId, label: t.value.bookmark, timestamp: Date.now(), snippet: snippet?.slice(0, 64) });
  saveBookmarks();
}

function goToBookmark(positionId: string) {
  bookViewerRef.value?.restorePositionById?.(positionId);
  showBookmarks.value = false;

  // Generate based on mode
  setTimeout(() => {
    if (props.aiMode === 'static') {
      generateImageForCurrentPage(selectedArtStyle.value);
    } else {
      // Update stream prompt for new page - initiate summarization
      const text = bookViewerRef.value?.getCurrentPageText?.();
      if (text) {
        console.log('📖 Bookmark navigation - initiating summarization for new page');
        aiService.summarizeText(text).catch(error => {
          console.warn('⚠️ Bookmark summarization failed, using raw text:', error);
          updateStreamPrompt(text.slice(0, 100));
        });
      }
    }
  }, 1000);
}

function removeBookmark(positionId: string) {
  const idx = bookmarks.value.findIndex(b => b.positionId === positionId);
  if (idx > -1) {
    bookmarks.value.splice(idx, 1);
    saveBookmarks();
  }
}

watch(bookMetadata, () => {
  loadBookmarks();
});

function onDrop(event: DragEvent) {
  event.preventDefault();
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (file.type === 'application/epub+zip' || file.name.endsWith('.epub')) {
      handleFileUpload(file);
    } else {
      uploadError.value = t.value.dropValidEpub;
    }
  }
}

function onUploadZoneClick() {
  if (fileInput.value) fileInput.value.click();
}

const onBookReady = () => {
  isLoadingBook.value = false;
  bookLoaded.value = true;
  // (Removed old lastCfi logic)
  // Set a timeout to clear the restoration state if it takes too long
  cfiRestorationTimeout = setTimeout(() => {
    if (pendingRestoreCfi) {
      // Generate image for current page since restoration is complete
      setTimeout(() => generateImageForCurrentPage(selectedArtStyle.value), 500);
    }
  }, 3000); // 3 second timeout for CFI restoration
};

// Watch and persist art style changes
watch(selectedArtStyle, (val) => {
  localStorage.setItem('epub-art-style', val);
});

// Watch aiMode changes
watch(() => props.aiMode, (newMode) => {
  if (newMode === 'streaming') {
    // Reset image generation state when switching to streaming
    isGeneratingImage.value = false;
    currentGeneration.value = null;
    wasGenerationCanceled.value = false;
  } else {
    // Generate current page when switching to static mode
    if (bookLoaded.value && selectedText.value) {
      generateImageForSelection(selectedText.value, selectedArtStyle.value);
    } else if (bookLoaded.value) {
      generateImageForCurrentPage(selectedArtStyle.value);
    }
  }
});

// Watch for aiMode prop changes and emit toggle if needed
watch(() => props.aiMode, (newMode) => {
  // If parent toggles mode, we just follow
  console.log('AI Mode changed to:', newMode);
});


// Expose methods to parent
defineExpose({
  // No methods needed for fixed noise parameters
});
</script>

<style scoped>
.epub-reader {
  min-height: 100vh;
  width: 100%;
  max-width: 100%;
  background: linear-gradient(135deg, rgb(239,226,204) 0%, rgb(239,226,204) 100%);
  position: relative;
  overflow-x: hidden;
  box-sizing: border-box;
}

.upload-section {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.reader-interface {
  min-height: 100vh;
  padding: 24px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.reader-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  height: calc(100vh - 48px);
  box-sizing: border-box;
}

.reader-pane,
.image-pane {
  background: rgb(239,226,204);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
}

.reader-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.book-viewer-scrollable {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
  /* Ensure BookViewer fills available space */
  display: flex;
  flex-direction: column;
}

.reader-pane.upload-mode {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.reader-pane:hover,
.image-pane:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.bookmarks-sidebar {
  position: fixed;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  width: 280px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.bookmarks-sidebar h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #1D1D1F;
}

.bookmark-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bookmark-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.bookmark-item:hover {
  background: #F2F2F7;
  border-color: #D1D1D6;
}

.bookmark-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bookmark-title {
  font-size: 14px;
  font-weight: 500;
  color: #1D1D1F;
  line-height: 1.3;
}

.bookmark-date {
  font-size: 12px;
  color: #86868B;
}

.remove-bookmark {
  background: none;
  border: none;
  color: #FF3B30;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.remove-bookmark:hover {
  background: rgba(255, 59, 48, 0.1);
}

@media (max-width: 1200px) {
  .reader-layout {
    grid-template-columns: 1fr;
    gap: 16px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .bookmarks-sidebar {
    position: static;
    width: 100%;
    margin-top: 16px;
    transform: none;
  }
}

@media (max-width: 768px) {
  .reader-interface {
    padding: 8px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .reader-layout {
    height: auto;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .reader-pane,
  .image-pane {
    min-height: 50vh;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.bookmarks-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}
.modal-content {
  background: rgb(239,226,204);
  border-radius: 16px;
  padding: 0 0 24px 0;
  min-width: 340px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 12px 48px rgba(0,0,0,0.22);
  animation: popin 0.25s cubic-bezier(.4,2,.6,1) 1;
}
@keyframes popin {
  0% { transform: scale(0.95); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 12px 24px;
  border-bottom: 1px solid #E5E5EA;
}
.close-x-btn {
  background: none;
  border: none;
  color: #86868B;
  cursor: pointer;
  border-radius: 50%;
  padding: 4px;
  transition: background 0.2s;
}
.close-x-btn:hover {
  background: #F2F2F7;
}

.new-book-btn {
  margin: 16px 0 0 0;
  padding: 10px 18px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.new-book-btn:hover {
  background: #0056CC;
}

.upload-zone {
  border: 2px dashed #007AFF;
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(0, 122, 255, 0.02);
  position: relative;
  max-width: 480px;
  margin: 0 auto;
}

.upload-zone h3 {
  white-space: pre-line;
  margin: 0 0 10px 0;
  line-height: 1.4;
}

.upload-zone:hover {
  border-color: #0056CC;
  background: rgba(0, 122, 255, 0.05);
  transform: translateY(-2px);
}

.upload-icon {
  font-size: 48px;
  color: #007AFF;
  margin-bottom: 16px;
}
.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
  font-size: 16px;
  color: #1D1D1F;
  font-weight: 500;
}
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(255, 59, 48, 0.1);
  color: #FF3B30;
  border-radius: 8px;
  font-size: 14px;
  justify-content: center;
}

.viewer-controls {
  flex-shrink: 0;
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: var(--color-card);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 16px 9px 16px;
  border-top: 1px solid var(--color-border);
  margin: 0;
  gap: 16px;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.03);
  border-bottom-left-radius: var(--radius);
  border-bottom-right-radius: var(--radius);
}
.navigation-controls {
  display: flex;
  align-items: center;
  gap: 18px;
  margin: 0;
}
.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1.5px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-card);
  color: var(--color-primary);
  cursor: pointer;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, border-color 0.18s;
  margin: 0;
  font-size: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  outline: none;
}
.nav-btn:hover:not(:disabled), .nav-btn:focus-visible {
  background: var(--color-secondary);
  color: #fff;
  border-color: var(--color-primary);
  box-shadow: 0 4px 16px rgba(0,122,255,0.10);
}
.nav-btn:active {
  background: var(--color-accent);
  color: var(--color-primary);
}
.nav-btn:disabled {
  color: #C7C7CC;
  cursor: not-allowed;
  background: var(--color-border);
  box-shadow: none;
}
.page-input-container {
  display: flex;
  align-items: center;
  gap: 0;
  margin: 0;
}
.page-slider {
  width: 120px;
  height: 24px;
  accent-color: var(--color-primary, #007AFF);
  background: transparent;
  margin: 0 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: accent-color 0.2s;
}
.page-slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.page-progress-label {
  font-size: 12px;
  color: var(--color-muted);
  margin-left: 6px;
  min-width: 80px;
  display: inline-block;
  text-align: left;
}
.action-controls {
  display: flex;
  gap: 6px;
  margin: 0;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 5px 9px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-card);
  color: var(--color-primary);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
  position: relative;
  margin: 0;
  outline: none;
  font-weight: 500;
}
.action-btn:hover, .action-btn:focus-visible {
  background: var(--color-secondary);
  color: #fff;
  border-color: var(--color-primary);
}
.action-btn:disabled {
  color: #C7C7CC;
  background: var(--color-border);
}
.action-btn.active-bookmark {
  background: #ffe9a8;
  color: #b8860b;
  border-color: #ffd700;
  cursor: pointer;
}
.page-input::-webkit-outer-spin-button,
.page-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.page-input[type='number'] {
  -moz-appearance: textfield;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin: 18px auto 0 auto;
  transition: background 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.upload-btn:hover {
  background: #0056CC;
}

.load-book-btn {
  margin-right: 18px;
}
.load-book-btn > svg {
  transform: scale(1.35);
}
</style>