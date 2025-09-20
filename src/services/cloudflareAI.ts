class CloudflareAIService {
  private ioApiKey = import.meta.env.VITE_IO_API_KEY as string;
  private onSummarySuccess?: (summary: string, originalText: string) => void;

  /**
   * Set callback to be called after every successful IO API response
   */
  setOnSummarySuccess(callback: (summary: string, originalText: string) => void) {
    this.onSummarySuccess = callback;
  }

  /**
   * Summarize text using IO API. Supports cancellation via AbortSignal.
   */
  async summarizeText(text: string, signal?: AbortSignal): Promise<string> {
    if (!this.ioApiKey) {
      console.error('IO API key not set in environment variables');
      return 'Summary generation failed: API key missing';
    }

    try {
      const response = await fetch('https://api.intelligence.io.solutions/api/v1/workflows/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.ioApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          agent_names: ["summary_agent"],
          args: { "type": "summarize_text" }
        }),
        signal
      });

      if (!response.ok) {
        throw new Error(`IO API summarization failed: ${response.statusText}`);
      }

      const data = await response.json();
      const summary = data.result?.summary || data.result || 'Unable to generate summary';

      // Call success callback if set
      if (this.onSummarySuccess) {
        console.log('📡 IO API success - triggering callback with summary');
        console.log('   Summary length:', summary.length);
        console.log('   Original text length:', text.length);
        this.onSummarySuccess(summary, text);
        console.log('✅ IO callback completed');
      } else {
        console.log('⚠️ IO API success but no callback registered');
      }

      return summary;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled
        return 'Summary generation cancelled';
      }
      console.error('Summarization error:', error);
      return 'Summary generation failed';
    }
  }

  /**
   * Generate streaming content using Daydream API. Returns a stream URL or text response.
   * NOTE: v1/generate endpoint removed - app now uses real-time streaming mode only
   */
  async generateStream(prompt: string, style: string, _signal?: AbortSignal): Promise<string> {
    // App now uses real-time streaming mode only
    // This method is kept for compatibility but returns a placeholder
    console.log('generateStream called - app uses streaming mode only, v1/generate endpoint removed');
    return `Streaming mode active: ${style} ${prompt}`;
  }

  /**
   * Generate static image using Daydream API.
   * NOTE: App now uses streaming mode only - this method returns placeholder
   */
  async generateImage(prompt: string, style: string, _signal?: AbortSignal): Promise<string> {
    // App now uses real-time streaming mode only
    // Static image generation disabled - use streaming mode instead
    console.log('generateImage called - app uses streaming mode only, static generation disabled');
    return `Streaming mode active: ${style} ${prompt}`;
  }

  async processPage(pageContent: string, style: string, signal?: AbortSignal): Promise<{ summary: string; streamContent: string }> {
    try {
      const summary = await this.summarizeText(pageContent, signal);
      const streamContent = await this.generateStream(summary, style, signal);
      return { summary, streamContent };
    } catch (error) {
      console.error('Page processing error:', error);
      throw error;
    }
  }
}

export default CloudflareAIService;