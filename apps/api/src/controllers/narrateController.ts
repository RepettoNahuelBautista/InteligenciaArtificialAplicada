import { Request, Response } from 'express';
import { logger } from '../utils/logger';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1/text-to-speech';
// Valentina — Spanish multilingual voice, good for Argentine Spanish
const DEFAULT_VOICE_ID = 'XrExE9yKIg1WjnnlVkGX';

export async function narrateController(req: Request, res: Response): Promise<void> {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ success: false, error: { message: 'text is required' } });
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    res.status(503).json({ success: false, error: { message: 'Narración no disponible (TTS no configurado)' } });
    return;
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;

  try {
    logger.info('Generating narration via ElevenLabs', { userId: req.userId, voiceId, chars: text.length });

    const response = await fetch(`${ELEVENLABS_BASE}/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: text.trim().slice(0, 500),
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      logger.error('ElevenLabs TTS error', { status: response.status, body });
      res.status(502).json({ success: false, error: { message: `Error generando narración (${response.status})` } });
      return;
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    res.setHeader('Cache-Control', 'no-store');
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    logger.error('narrateController error', { err });
    res.status(500).json({ success: false, error: { message: 'Error generando narración' } });
  }
}
