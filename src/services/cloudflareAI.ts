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
   */
  async generateStream(prompt: string, style: string, signal?: AbortSignal): Promise<string> {
    const daydreamApiKey = import.meta.env.VITE_DAYDREAM_API_KEY as string;
    
    if (!daydreamApiKey) {
      console.error('Daydream API key not set in environment variables');
      throw new Error('Streaming generation failed: API key missing');
    }

    try {
      // For now, return a placeholder or call Daydream API
      // This should be implemented based on Daydream API documentation
      // For text streaming, we might get a response stream or URL
      const response = await fetch('https://api.daydream.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${daydreamApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `${style} ${prompt}`,
          model: 'text-davinci-003', // or appropriate Daydream model
          max_tokens: 150,
          temperature: 0.7
        }),
        signal
      });

      if (!response.ok) {
        throw new Error(`Daydream streaming failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.text || data.result || 'Unable to generate stream';
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled
        throw error;
      }
      console.error('Streaming generation error:', error);
      throw new Error(`Streaming generation failed: ${error.message}`);
    }
  }

  /**
   * Generate static image using Daydream API.
   */
  async generateImage(prompt: string, style: string, signal?: AbortSignal): Promise<string> {
    // For static images, use the same generateStream method but treat it as static
    return this.generateStream(prompt, style, signal);
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