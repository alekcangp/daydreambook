
interface StreamResponse {
  id: string;
  output_playback_id: string;
  whip_url: string;
}

interface StreamParams {
  model_id?: string;
  pipeline?: string;
  params: {
    model_id?: string;
    prompt?: string;
    prompt_interpolation_method?: string;
    normalize_prompt_weights?: boolean;
    normalize_seed_weights?: boolean;
    negative_prompt?: string;
    num_inference_steps?: number;
    seed?: number;
    t_index_list?: number[];
    controlnets?: Array<{
      conditioning_scale: number;
      control_guidance_end: number;
      control_guidance_start: number;
      enabled: boolean;
      model_id: string;
      preprocessor: string;
      preprocessor_params?: Record<string, any>;
    }>;
  };
}

const PIPELINE_ID = "pip_qpUgXycjWF6YMeSL";
const DAYDREAM_API_KEY = import.meta.env.VITE_DAYDREAM_API_KEY || "YOUR_API_KEY_HERE";

export class DaydreamService {
  private apiBaseUrl = "https://api.daydream.live/";

  async createStream(): Promise<StreamResponse> {
    try {
      const response = await fetch(`${this.apiBaseUrl}v1/streams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DAYDREAM_API_KEY}`
        },
        body: JSON.stringify({
          pipeline_id: PIPELINE_ID
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create stream: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        output_playback_id: data.output_playback_id,
        whip_url: data.whip_url
      };
    } catch (error: any) {
      console.error('Stream creation error:', error);
      throw new Error(`Stream creation failed: ${error.message}`);
    }
  }

  async updateStreamParams(streamId: string, params: StreamParams): Promise<void> {
    // Validate API key
    if (!DAYDREAM_API_KEY || DAYDREAM_API_KEY === "YOUR_API_KEY_HERE") {
      const errorMsg = 'Daydream API key is not configured. Please set VITE_DAYDREAM_API_KEY in your .env file with a valid API key from https://app.daydream.live/beta/api-key';
      console.error('🚫 API KEY ERROR:', errorMsg);
      throw new Error(errorMsg);
    }

    // Validate stream ID
    if (!streamId || typeof streamId !== 'string' || streamId.length < 5) {
      const errorMsg = `Invalid stream ID: "${streamId}". Stream ID should be a string like "str_xxx"`;
      console.error('🚫 STREAM ID ERROR:', errorMsg);
      throw new Error(errorMsg);
    }

    // Validate parameters
    if (!params || !params.params || !params.params.prompt) {
      const errorMsg = 'Invalid parameters: prompt is required in params.params';
      console.error('🚫 PARAMETERS ERROR:', errorMsg, params);
      throw new Error(errorMsg);
    }

    try {
      console.log('🔄 Updating Daydream stream parameters:');
      console.log('   Stream ID:', streamId);
      console.log('   Prompt:', params.params.prompt);

      const endpoint = `${this.apiBaseUrl}beta/streams/${streamId}/prompts`;
      console.log('   Endpoint:', endpoint);
      console.log('   API Key configured:', DAYDREAM_API_KEY ? `${DAYDREAM_API_KEY.substring(0, 10)}...` : 'No');

      // Fix: Use the correct API format that Daydream expects (without text field)
      const requestBody = {
        model_id: params.model_id,
        pipeline: params.pipeline,
        params: {
          // Include all inner parameters (prompt is included here)
          ...params.params
        }
      };

      console.log('   Request body (includes prompt, excludes text field):', JSON.stringify(requestBody, null, 2));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DAYDREAM_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 API Response Status:', response.status);
      console.log('📡 API Response Status Text:', response.statusText);

      if (!response.ok) {
        let errorText = 'No response body';
        try {
          errorText = await response.text();
          console.log('📡 API Error Response Body:', errorText);
        } catch (e) {
          console.error('Failed to read error response:', e);
        }

        // Specific error messages for common issues
        if (response.status === 401) {
          throw new Error(`Authentication failed (401). Please verify your Daydream API key is correct and active. Current key starts with: ${DAYDREAM_API_KEY.substring(0, 8)}...`);
        } else if (response.status === 404) {
          throw new Error(`Stream not found (404). The stream ID "${streamId}" may be invalid or expired. Try creating a new stream.`);
        } else if (response.status === 400) {
          throw new Error(`Bad Request (400). The parameters format may be incorrect. Response: ${errorText}`);
        } else if (response.status === 429) {
          throw new Error(`Rate Limited (429). Too many requests. Please wait before trying again.`);
        } else if (response.status >= 500) {
          throw new Error(`Server Error (${response.status}). The Daydream API service may be experiencing issues. Response: ${errorText}`);
        } else {
          throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
        }
      }

      // Try to parse response body
      let responseData = null;
      try {
        const responseText = await response.text();
        if (responseText.trim()) {
          responseData = JSON.parse(responseText);
          console.log('✅ Parameters updated successfully. API Response:', responseData);
        } else {
          console.log('✅ Parameters updated successfully (empty response body)');
        }
      } catch (e) {
        console.log('✅ Parameters updated successfully (non-JSON response)');
      }

    } catch (error: any) {
      console.error('💥 Detailed error during parameter update:');
      console.error('   Message:', error.message);
      console.error('   Name:', error.name);
      console.error('   Stack:', error.stack);

      // Don't wrap network errors to preserve original message
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Network error: ${error.message}. Please check your internet connection and try again.`);
      }

      throw error;
    }
  }

  getOutputUrl(playbackId: string): string {
    return `https://lvpr.tv/?v=${playbackId}&lowLatency=force`;
  }

  // Default parameters for book reading context - matches official API spec
  getDefaultParams(prompt: string): StreamParams {
    console.log('Creating default params with prompt:', prompt);

    return {
      model_id: "streamdiffusion",
      pipeline: "live-video-to-video",
      params: {
        model_id: "stabilityai/sd-turbo",
        prompt: prompt,
        prompt_interpolation_method: "slerp",
        normalize_prompt_weights: true,
        normalize_seed_weights: true,
        negative_prompt: "blurry, low quality, flat, 2d",
        num_inference_steps: 50,
        seed: 42,
        t_index_list: [0, 8, 17],
        controlnets: [
          {
            conditioning_scale: 0,
            control_guidance_end: 1,
            control_guidance_start: 0,
            enabled: true,
            model_id: "thibaud/controlnet-sd21-openpose-diffusers",
            preprocessor: "pose_tensorrt",
            preprocessor_params: {}
          },
          {
            conditioning_scale: 0,
            control_guidance_end: 1,
            control_guidance_start: 0,
            enabled: true,
            model_id: "thibaud/controlnet-sd21-hed-diffusers",
            preprocessor: "soft_edge",
            preprocessor_params: {}
          },
          {
            conditioning_scale: 0,
            control_guidance_end: 1,
            control_guidance_start: 0,
            enabled: true,
            model_id: "thibaud/controlnet-sd21-canny-diffusers",
            preprocessor: "canny",
            preprocessor_params: {
              high_threshold: 200,
              low_threshold: 100
            }
          },
          {
            conditioning_scale: 0,
            control_guidance_end: 1,
            control_guidance_start: 0,
            enabled: true,
            model_id: "thibaud/controlnet-sd21-depth-diffusers",
            preprocessor: "depth_tensorrt",
            preprocessor_params: {}
          },
          {
            conditioning_scale: 0,
            control_guidance_end: 1,
            control_guidance_start: 0,
            enabled: true,
            model_id: "thibaud/controlnet-sd21-color-diffusers",
            preprocessor: "passthrough",
            preprocessor_params: {}
          }
        ]
      }
    };
  }

  // Create enhanced prompt using summary text
  createSummaryPrompt(artStyle: string, summary: string): string {
    if (!summary || !summary.trim()) {
      return `${artStyle} style artwork`;
    }

    return `Artwork of ${artStyle} style: ${summary}, highly detailed, digital art, vibrant colors, professional quality`;
  }
}

export default new DaydreamService();