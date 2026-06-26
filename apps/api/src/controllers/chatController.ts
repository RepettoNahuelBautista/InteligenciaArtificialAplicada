import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';
import { resolve } from 'path';
import { logger } from '../utils/logger';

config({ path: resolve(process.cwd(), '.env.local'), override: true });

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_INSTRUCTION = `Sos un asistente especializado ÚNICAMENTE en películas y series.
Solo podés responder preguntas relacionadas con cine, series de televisión, actores, actrices, directores, guionistas, géneros cinematográficos, reseñas, rankings, premios como los Oscars o los Emmy, plataformas de streaming, o cualquier otro tema del mundo audiovisual.
Si el usuario pregunta sobre cualquier otro tema que no esté relacionado con películas o series, respondé EXACTAMENTE con este mensaje, sin agregar nada más: "Lo siento, solo estoy diseñado para ayudarte con temas relacionados a series y películas."
Respondé siempre en español argentino, de forma amigable y conversacional. Podés usar Markdown para estructurar tus respuestas.`;

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export async function chatController(req: Request, res: Response): Promise<void> {
  const { message, history = [] } = req.body as { message: string; history: ChatMessage[] };

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ success: false, error: { message: 'message is required' } });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ success: false, error: { message: 'Chat no disponible' } });
    return;
  }

  try {
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: { temperature: 0.9, maxOutputTokens: 1024 },
    });

    const chatHistory = (history as ChatMessage[]).map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    const chat = model.startChat({ history: chatHistory });

    const result = await Promise.race([
      chat.sendMessage(message.trim()),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 30000)
      ),
    ]);

    const text = result.response.text();
    logger.info('Chat response generated', { userId: req.userId, chars: text.length });

    res.json({ success: true, data: { text } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    logger.error('chatController error', { err });
    if (msg === 'timeout') {
      res.status(504).json({ success: false, error: { message: 'La IA tardó demasiado, intentá de nuevo.' } });
    } else {
      res.status(500).json({ success: false, error: { message: 'Error al generar respuesta' } });
    }
  }
}
