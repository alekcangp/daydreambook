import { ref, computed } from 'vue';

type Language = 'ru' | 'en';

const currentLanguage = ref<Language>((localStorage.getItem('app-language') as Language) || 'ru');

const translations = {
  ru: {
    // Upload zone
    uploadBook: 'Загрузить книгу',
    dragAndDrop: 'Перетащите или используйте кнопку',
    supportedFormat: 'Поддерживаемый формат: EPUB',
    processingEpub: 'Обработка EPUB...',
    
    // Navigation
    loadBook: 'Загрузить книгу',
    previousPage: 'Предыдущая страница (←)',
    nextPage: 'Следующая страница (→)',
    decreaseTextSize: 'Уменьшить размер текста',
    increaseTextSize: 'Увеличить размер текста',
    addRemoveBookmark: 'Добавить или удалить закладку',
    showBookmarks: 'Показать закладки',
    
    // Image viewer
    artStyle: 'Стиль изображения',
    chooseOrEnterStyle: 'Выберите или введите стиль',
    generatingAiIllustration: 'Генерация ИИ иллюстрации...',
    downloadImage: 'Скачать',
    noIllustrationYet: 'Пока нет иллюстрации',
    turnPageOrSelect: 'Перелистните страницу или выделите текст для генерации ИИ иллюстрации',
    illustrationCanceled: 'Иллюстрация отменена',
    canceledPrevious: 'Вы отменили предыдущую генерацию. Перелистните страницу или выделите текст для создания новой иллюстрации.',
    
    // Bookmarks
    bookmarks: 'Закладки',
    bookmark: 'Закладка',
    close: 'Закрыть',
    
    // Errors
    failedToLoadEpub: 'Не удалось загрузить EPUB файл. Попробуйте другой файл.',
    errorHandlingFile: 'Ошибка обработки загрузки файла. Попробуйте снова.',
    selectValidEpub: 'Пожалуйста, выберите действительный EPUB файл.',
    dropValidEpub: 'Пожалуйста, перетащите действительный EPUB файл.',
    
    // Art styles
    artStyles: {
      futuristic: 'Футуристический',
      fantasy: 'Фэнтези',
      steampunk: 'Стимпанк',
      cyberpunk: 'Киберпанк',
      watercolor: 'Акварель',
      oil_painting: 'Масляная живопись',
      anime: 'Аниме',
      sketch: 'Эскиз',
      minimalism: 'Минимализм',
      realism: 'Реализм',
      impressionism: 'Импрессионизм',
      surrealism: 'Сюрреализм',
      cartoon: 'Мультфильм',
      pixel_art: 'Пиксель-арт',
      noir: 'Нуар',
      gothic: 'Готика',
      baroque: 'Барокко',
      pop_art: 'Поп-арт',
      abstract: 'Абстракция',
      photorealistic: 'Фотореализм',
      render_3d: '3D Рендер',
      ink: 'Тушь',
      classic: 'Классический',
      modern: 'Современный',
      custom: 'Пользовательский...'
    },

    // Streaming mode
    staticMode: 'Статический режим',
    streamingMode: 'Потоковый режим',

    // Stream viewer
    streamOutput: 'Вывод потока',
    connectingStream: 'Подключение к потоку...',
    streamStarting: 'Запуск потока...',
    streamInitializing: 'Инициализация потока...',
    stopStreaming: 'Остановить поток',
    startStreaming: 'Начать поток',
    webcamActive: 'Веб-камера активна',
    toggleWebcam: 'Переключить веб-камеру',
    pleaseWait: 'Пожалуйста, подождите...',
    liveOutput: 'Живой вывод',
    refreshStream: 'Обновить поток',
    liveStreamPlayer: 'Плеер живого потока',
    streamConnected: 'Поток подключен',
    streamDisconnected: 'Поток отключен',
    streamError: 'Ошибка потока',
    retry: 'Повторить',
    noStreamYet: 'Пока нет потока',
    startStreamingToView: 'Начать поток для просмотра',
    aiParameters: 'Параметры ИИ',
    prompt: 'Промпт',
    enterPrompt: 'Введите промпт',
    negativePrompt: 'Негативный промпт',
    inferenceSteps: 'Шаги вывода',
    controlNets: {
      openpose: 'Поза',
      hed: 'Края',
      canny: 'Канни',
      depth: 'Глубина',
      color: 'Цвет'
    },
    randomSeed: 'Случайное зерно',
    randomize: 'Рандомизировать',
    streamStartError: 'Ошибка запуска потока',
    webcamError: 'Ошибка веб-камеры',
    webrtcError: 'Ошибка WebRTC'
  },
  en: {
    // Upload zone
    uploadBook: 'Upload EPUB Book',
    dragAndDrop: 'Drag and drop or use the button',
    supportedFormat: 'Supported format: EPUB',
    processingEpub: 'Processing EPUB...',
    
    // Navigation
    loadBook: 'Load Book',
    previousPage: 'Previous page (←)',
    nextPage: 'Next page (→)',
    decreaseTextSize: 'Decrease text size',
    increaseTextSize: 'Increase text size',
    addRemoveBookmark: 'Add or remove bookmark',
    showBookmarks: 'Show bookmarks',
    
    // Image viewer
    artStyle: 'Art Style',
    chooseOrEnterStyle: 'Choose or enter style',
    generatingAiIllustration: 'Generating AI Illustration...',
    downloadImage: 'Download image',
    noIllustrationYet: 'No illustration yet',
    turnPageOrSelect: 'Turn the page or select text to generate an AI illustration',
    illustrationCanceled: 'Illustration canceled',
    canceledPrevious: 'You canceled the previous generation. Turn the page or select text to generate a new illustration.',
    
    // Bookmarks
    bookmarks: 'Bookmarks',
    bookmark: 'Bookmark',
    close: 'Close',
    
    // Errors
    failedToLoadEpub: 'Failed to load EPUB file. Please try another file.',
    errorHandlingFile: 'Error handling file upload. Please try again.',
    selectValidEpub: 'Please select a valid EPUB file.',
    dropValidEpub: 'Please drop a valid EPUB file.',
    
    // Art styles
    artStyles: {
      futuristic: 'Futuristic',
      fantasy: 'Fantasy',
      steampunk: 'Steampunk',
      cyberpunk: 'Cyberpunk',
      watercolor: 'Watercolor',
      oil_painting: 'Oil Painting',
      anime: 'Anime',
      sketch: 'Sketch',
      minimalism: 'Minimalism',
      realism: 'Realism',
      impressionism: 'Impressionism',
      surrealism: 'Surrealism',
      cartoon: 'Cartoon',
      pixel_art: 'Pixel Art',
      noir: 'Noir',
      gothic: 'Gothic',
      baroque: 'Baroque',
      pop_art: 'Pop Art',
      abstract: 'Abstract',
      photorealistic: 'Photorealistic',
      render_3d: '3D Render',
      ink: 'Ink',
      classic: 'Classic',
      modern: 'Modern',
      custom: 'Custom...'
    },

    // Streaming mode
    staticMode: 'Static Mode',
    streamingMode: 'Streaming Mode',

    // Stream viewer
    streamOutput: 'Stream Output',
    connectingStream: 'Connecting to stream...',
    streamStarting: 'Stream starting...',
    streamInitializing: 'Stream initializing...',
    stopStreaming: 'Stop Streaming',
    startStreaming: 'Start Streaming',
    webcamActive: 'Webcam Active',
    toggleWebcam: 'Toggle Webcam',
    pleaseWait: 'Please wait...',
    liveOutput: 'Live Output',
    refreshStream: 'Refresh Stream',
    liveStreamPlayer: 'Live Stream Player',
    streamConnected: 'Stream Connected',
    streamDisconnected: 'Stream Disconnected',
    streamError: 'Stream Error',
    retry: 'Retry',
    noStreamYet: 'No stream yet',
    startStreamingToView: 'Start streaming to view',
    aiParameters: 'AI Parameters',
    prompt: 'Prompt',
    enterPrompt: 'Enter prompt',
    negativePrompt: 'Negative Prompt',
    inferenceSteps: 'Inference Steps',
    controlNets: {
      openpose: 'Pose',
      hed: 'Edges',
      canny: 'Canny',
      depth: 'Depth',
      color: 'Color'
    },
    randomSeed: 'Random Seed',
    randomize: 'Randomize',
    streamStartError: 'Stream start error',
    webcamError: 'Webcam error',
    webrtcError: 'WebRTC error'
  }
};

// English style names for API (always use English for prompts)
const englishStyleNames = {
  futuristic: 'Futuristic',
  fantasy: 'Fantasy',
  steampunk: 'Steampunk',
  cyberpunk: 'Cyberpunk',
  watercolor: 'Watercolor',
  oil_painting: 'Oil Painting',
  anime: 'Anime',
  sketch: 'Sketch',
  minimalism: 'Minimalism',
  realism: 'Realism',
  impressionism: 'Impressionism',
  surrealism: 'Surrealism',
  cartoon: 'Cartoon',
  pixel_art: 'Pixel Art',
  noir: 'Noir',
  gothic: 'Gothic',
  baroque: 'Baroque',
  pop_art: 'Pop Art',
  abstract: 'Abstract',
  photorealistic: 'Photorealistic',
  render_3d: '3D Render',
  ink: 'Ink',
  classic: 'Classic',
  modern: 'Modern',
  custom: 'Custom...'
};

export function useI18n() {
  const t = computed(() => translations[currentLanguage.value]);
  
  const switchLanguage = () => {
    currentLanguage.value = currentLanguage.value === 'ru' ? 'en' : 'ru';
    localStorage.setItem('app-language', currentLanguage.value);
  };
  
  const getEnglishStyleName = (styleKey: string): string => {
    return englishStyleNames[styleKey as keyof typeof englishStyleNames] || styleKey;
  };
  
  return {
    currentLanguage: computed(() => currentLanguage.value),
    t,
    switchLanguage,
    getEnglishStyleName
  };
}