import DaydreamService from '../src/services/daydreamService.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// For ES modules in Node.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function (req, res) {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { action, streamId, params, prompt } = req.body;

    if (action === 'create-stream') {
      // Create a new stream
      const stream = await DaydreamService.createStream();
      
      // Store stream info temporarily (in production, use a database or Redis)
      const streamData = {
        id: stream.id,
        playbackId: stream.output_playback_id,
        whipUrl: stream.whip_url,
        createdAt: new Date().toISOString(),
        params: DaydreamService.getDefaultParams(req.body.prompt || '') // Use provided prompt or default to empty string
      };
      
      // Save to a temporary file for session persistence (in production, use proper storage)
      const streamsFile = join(__dirname, '../temp', 'streams.json');
      let streams = {};
      try {
        const data = readFileSync(streamsFile, 'utf8');
        streams = JSON.parse(data);
      } catch (e) {
        // File doesn't exist yet
      }
      
      streams[stream.id] = streamData;
      // Ensure temp directory exists
      const fs = await import('fs');
      const tempDir = join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      fs.writeFileSync(streamsFile, JSON.stringify(streams, null, 2));

      res.json({
        success: true,
        streamId: stream.id,
        playbackId: stream.output_playback_id,
        whipUrl: stream.whip_url,
        outputUrl: DaydreamService.getOutputUrl(stream.output_playback_id)
      });

    } else if (action === 'update-params') {
      if (!streamId || !params) {
        res.status(400).json({ error: 'streamId and params required' });
        return;
      }

      // Update stream parameters
      await DaydreamService.updateStreamParams(streamId, params);

      // Update stored params
      const streamsFile = join(__dirname, '../temp', 'streams.json');
      let streams = {};
      try {
        const data = readFileSync(streamsFile, 'utf8');
        streams = JSON.parse(data);
      } catch (e) {
        res.status(404).json({ error: 'Stream not found' });
        return;
      }

      if (streams[streamId]) {
        streams[streamId].params = params;
        const fs = await import('fs');
        fs.writeFileSync(streamsFile, JSON.stringify(streams, null, 2));
        
        res.json({ success: true, message: 'Parameters updated' });
      } else {
        res.status(404).json({ error: 'Stream not found' });
      }

    } else if (action === 'get-stream') {
      if (!streamId) {
        res.status(400).json({ error: 'streamId required' });
        return;
      }

      const streamsFile = join(__dirname, '../temp', 'streams.json');
      let streams = {};
      try {
        const data = readFileSync(streamsFile, 'utf8');
        streams = JSON.parse(data);
      } catch (e) {
        streams = {};
      }

      const streamData = streams[streamId];
      if (streamData) {
        res.json({
          success: true,
          streamId: streamData.id,
          playbackId: streamData.playbackId,
          whipUrl: streamData.whipUrl,
          outputUrl: DaydreamService.getOutputUrl(streamData.playbackId),
          params: streamData.params
        });
      } else {
        res.status(404).json({ error: 'Stream not found' });
      }

    } else {
      res.status(400).json({ error: 'Invalid action. Use: create-stream, update-params, or get-stream' });
    }

  } catch (error) {
    console.error('Daydream API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Export for Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};