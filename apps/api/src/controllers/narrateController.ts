import { Request, Response } from 'express';
import { config } from 'dotenv';
import { resolve } from 'path';
import { logger } from '../utils/logger';

config({ path: resolve(process.cwd(), '.env.local'), override: true });

const DEFAULT_VOICE = 'es-AR-ElenaNeural';

async function getAzureToken(subscriptionKey: string, region: string): Promise<string> {
  const tokenUrl = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': subscriptionKey },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    throw new Error(`Azure TTS token error: ${res.status}`);
  }
  return res.text();
}

const XML_ESCAPES: Record<string, string> = {
  '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
};

function escapeXml(text: string): string {
  return text.replace(/[<>&'"]/g, (c) => XML_ESCAPES[c] ?? c);
}

export async function narrateController(req: Request, res: Response): Promise<void> {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ success: false, error: { message: 'text is required' } });
    return;
  }

  const subscriptionKey = process.env.AZURE_TTS_KEY;
  const region = process.env.AZURE_TTS_REGION;
  if (!subscriptionKey || !region) {
    res.status(503).json({ success: false, error: { message: 'Narración no disponible (TTS no configurado)' } });
    return;
  }

  const voice = process.env.AZURE_TTS_VOICE || DEFAULT_VOICE;
  const lang = voice.split('-').slice(0, 2).join('-'); // "es-AR-ElenaNeural" → "es-AR"

  try {
    logger.info('Generating narration via Azure TTS', { userId: req.userId, voice, chars: text.length });

    const token = await getAzureToken(subscriptionKey, region);

    const ssml = `<speak version='1.0' xml:lang='${lang}'><voice name='${voice}'>${escapeXml(text.trim().slice(0, 500))}</voice></speak>`;

    const ttsUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const response = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
      },
      body: Buffer.from(ssml, 'utf-8'),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      logger.error('Azure TTS error', { status: response.status, body });
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
