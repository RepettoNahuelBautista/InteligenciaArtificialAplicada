import { config } from 'dotenv';
import { resolve } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

config({ path: resolve(process.cwd(), '.env.local'), override: true });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || '10000', 10);
const MAX_RETRIES = parseInt(process.env.RECOMMENDATION_MAX_RETRIES || '3', 10);

export interface RecommendationPromptContext {
  genres: string[];
  directors: string[];
  actors: string[];
  likedMovies: string[];
  dislikedMovies: string[];
  mood: string;
  contentType: 'movie' | 'tv' | null;
  duration: 'short' | 'normal' | 'long' | null;
  year: 'classic' | 'recent' | 'new' | null;
}

export interface LLMRecommendation {
  title: string;
  year: number;
  genre: string;
  explanation: string;
  contentType: 'movie' | 'tv';
}

const MOOD_DESCRIPTIONS: Record<string, string> = {
  mystery: 'intriga y suspenso',
  relax: 'algo tranquilo y relajante para desconectar',
  emotional: 'algo emocionante que pueda generar lágrimas',
  laugh: 'comedia y humor',
  action: 'adrenalina y acción intensa',
  romantic: 'romance y relaciones amorosas',
  horror: 'terror y suspenso perturbador',
  inspiring: 'motivación e inspiración',
};

const DURATION_DESCRIPTIONS: Record<string, string> = {
  short: 'duración corta (menos de 90 minutos)',
  normal: 'duración normal (entre 90 y 120 minutos)',
  long: 'duración larga (más de 120 minutos)',
};

const YEAR_DESCRIPTIONS: Record<string, string> = {
  classic: 'anterior al año 2000',
  recent: 'entre 2000 y 2015',
  new: 'del año 2016 en adelante',
};


class GeminiService {
  private client: GoogleGenerativeAI;

  constructor() {
    if (!GEMINI_API_KEY) {
      logger.warn('GEMINI_API_KEY not set');
    }
    this.client = new GoogleGenerativeAI(GEMINI_API_KEY);
  }

  private buildPrompt(ctx: RecommendationPromptContext, exclude: string[]): string {
    const parts: string[] = [];

    parts.push('Sos un experto en cine y series. Tu tarea es recomendar UNA sola película o serie real que exista en TMDB.');
    parts.push('Respondé SOLO en formato JSON válido, sin texto adicional.');
    parts.push('');
    parts.push('=== PERFIL DEL USUARIO ===');

    if (ctx.genres.length > 0) {
      parts.push(`Géneros favoritos: ${ctx.genres.join(', ')}`);
    }
    if (ctx.directors.length > 0) {
      parts.push(`Directores favoritos: ${ctx.directors.join(', ')}`);
    }
    if (ctx.actors.length > 0) {
      parts.push(`Actores favoritos: ${ctx.actors.join(', ')}`);
    }
    if (ctx.likedMovies.length > 0) {
      parts.push(`Películas/series que le gustaron: ${ctx.likedMovies.join(', ')}`);
    }
    if (ctx.dislikedMovies.length > 0) {
      parts.push(`Películas/series que NO le gustaron: ${ctx.dislikedMovies.join(', ')}`);
    }

    parts.push('');
    parts.push('=== CONTEXTO ACTUAL ===');
    parts.push(`Estado de ánimo: quiere ${MOOD_DESCRIPTIONS[ctx.mood] || ctx.mood}`);

    if (ctx.contentType === 'movie') parts.push('Tipo: solo películas (no series)');
    else if (ctx.contentType === 'tv') parts.push('Tipo: solo series (no películas)');
    else parts.push('Tipo: película o serie, lo que mejor encaje');

    if (ctx.duration) parts.push(`Duración preferida: ${DURATION_DESCRIPTIONS[ctx.duration]}`);
    if (ctx.year) parts.push(`Época: ${YEAR_DESCRIPTIONS[ctx.year]}`);

    if (exclude.length > 0) {
      parts.push('');
      parts.push(`NO recomiendes ninguna de estas (ya fueron sugeridas o no existen): ${exclude.join(', ')}`);
    }

    parts.push('');
    parts.push('=== REGLAS IMPORTANTES ===');
    parts.push('- Recomendá SOLO títulos que realmente existen y se pueden encontrar en TMDB');
    parts.push('- La explicación debe ser personalizada mencionando al menos un gusto específico del usuario');
    parts.push('- La explicación debe estar en español argentino, en segunda persona (vos)');
    parts.push('- El campo contentType debe ser exactamente "movie" o "tv"');
    parts.push('- El año debe ser un número entero');
    parts.push('- El campo genre debe ser el género principal en español (ej: "Thriller", "Drama", "Comedia")');
    parts.push('');
    parts.push('=== FORMATO DE RESPUESTA ===');
    parts.push('Respondé ÚNICAMENTE con este JSON, sin markdown, sin texto adicional, sin envolver en otro objeto:');
    parts.push('{"title":"TÍTULO EXACTO","year":AÑO,"genre":"GÉNERO","contentType":"movie","explanation":"EXPLICACIÓN EN ESPAÑOL"}');

    return parts.join('\n');
  }

  private extractJson(raw: string): string {
    // Strip code fences wherever they appear
    const cleaned = raw.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, '$1').trim();

    // Try the whole string first
    try { JSON.parse(cleaned); return cleaned; } catch { /* continue */ }

    // Walk every '{' and try each balanced candidate — returns first that parses
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] !== '{') continue;
      let depth = 0;
      for (let j = i; j < cleaned.length; j++) {
        if (cleaned[j] === '{') depth++;
        else if (cleaned[j] === '}') {
          depth--;
          if (depth === 0) {
            const candidate = cleaned.slice(i, j + 1);
            try { JSON.parse(candidate); return candidate; } catch { break; }
          }
        }
      }
    }

    return cleaned;
  }

  private isQuotaError(err: unknown): boolean {
    if (!(err instanceof Error)) return false;
    const msg = err.message.toLowerCase();
    return (
      msg.includes('resource_exhausted') ||
      msg.includes('quota') ||
      msg.includes('rate limit') ||
      msg.includes('429') ||
      msg.includes('too many requests')
    );
  }

  private async callModel(modelName: string, ctx: RecommendationPromptContext, exclude: string[]): Promise<LLMRecommendation> {
    const model = this.client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.8,
        maxOutputTokens: 2048,
      },
    });

    const prompt = this.buildPrompt(ctx, exclude);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new AppError('LLM_TIMEOUT', 504, 'Gemini API timeout', true)), LLM_TIMEOUT_MS)
    );

    let result;
    try {
      result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise,
      ]);
    } catch (err) {
      if (err instanceof AppError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('Gemini SDK error', { model: modelName, error: msg });
      throw new AppError('LLM_API_ERROR', 502, `Error del modelo (${modelName}): ${msg.slice(0, 200)}`, true);
    }

    const raw = result.response.text();
    logger.debug('Gemini raw response', { raw, model: modelName });

    const text = this.extractJson(raw);

    let parsed: LLMRecommendation;
    try {
      const json = JSON.parse(text);
      parsed = (json.recommendation ?? json.result ?? json) as LLMRecommendation;
    } catch {
      logger.error('Gemini non-JSON response', { model: modelName, raw, extracted: text });
      throw new AppError('LLM_PARSE_ERROR', 502, 'Invalid JSON from Gemini', true);
    }

    if (!parsed.title || !parsed.year || !parsed.explanation || !parsed.contentType) {
      throw new AppError('LLM_INVALID_RESPONSE', 502, 'Incomplete response from Gemini', true);
    }

    if (!parsed.genre) {
      parsed.genre = 'Drama';
    }

    logger.info('Gemini recommendation generated', { title: parsed.title, year: parsed.year, model: modelName });
    return parsed;
  }

  async getRecommendation(
    ctx: RecommendationPromptContext,
    exclude: string[] = []
  ): Promise<LLMRecommendation> {
    try {
      return await this.callModel('gemini-2.5-flash', ctx, exclude);
    } catch (err) {
      if (this.isQuotaError(err)) {
        logger.warn('gemini-2.5-flash quota exceeded, falling back to gemini-2.5-flash-lite');
        return await this.callModel('gemini-2.5-flash-lite', ctx, exclude);
      }
      throw err;
    }
  }
}

export const geminiService = new GeminiService();
