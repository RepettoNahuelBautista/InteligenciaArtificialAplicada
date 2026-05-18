import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { registerController, loginController, meController } from './controllers/authController';
import { getGenresController, saveGenrePreferencesController } from './controllers/genreController';
import { getProfileController, updatePersonalInfoController } from './controllers/profileController';
import { searchPeopleController, savePersonPreferencesController, getPersonPreferencesController } from './controllers/personController';
import { searchMoviesController, rateMovieController, getWatchedMoviesController, removeWatchedMovieController } from './controllers/movieController';
import { getMoodsController } from './controllers/moodController';
import { getRecommendationController, getRecommendationHistoryController } from './controllers/recommendationController';
import { getReviewsController, upsertReviewController, getPublicProfileController, getUserReviewsController } from './controllers/reviewController';
import { searchUsersController, followController, unfollowController } from './controllers/followController';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3001';
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/v1/auth/register', registerController);
app.post('/api/v1/auth/login', loginController);
app.get('/api/v1/auth/me', authMiddleware, meController);

// Genre routes
app.get('/api/v1/genres', getGenresController);
app.post('/api/v1/profile/genres', authMiddleware, saveGenrePreferencesController);

// Mood routes
app.get('/api/v1/moods', getMoodsController);

// Recommendation routes
app.post('/api/v1/recommendations', authMiddleware, getRecommendationController);
app.get('/api/v1/recommendations', authMiddleware, getRecommendationHistoryController);

// Profile route (complete profile with stats)
app.get('/api/v1/profile', authMiddleware, getProfileController);
app.put('/api/v1/profile/personal', authMiddleware, updatePersonalInfoController);

// Person (directors/actors) routes
app.get('/api/v1/search/people', searchPeopleController);
app.post('/api/v1/profile/people', authMiddleware, savePersonPreferencesController);
app.get('/api/v1/profile/people', authMiddleware, getPersonPreferencesController);

// Review routes
app.get('/api/v1/reviews', authMiddleware, getReviewsController);
app.post('/api/v1/reviews', authMiddleware, upsertReviewController);

// User / follow routes — /users/search must be before /users/:userId/*
app.get('/api/v1/users/search', authMiddleware, searchUsersController);
app.get('/api/v1/users/:userId/profile', authMiddleware, getPublicProfileController);
app.get('/api/v1/users/:userId/reviews', authMiddleware, getUserReviewsController);
app.post('/api/v1/users/:userId/follow', authMiddleware, followController);
app.delete('/api/v1/users/:userId/follow', authMiddleware, unfollowController);

// Movie routes
app.get('/api/v1/search/movies', searchMoviesController);
app.post('/api/v1/profile/watched-movies', authMiddleware, rateMovieController);
app.get('/api/v1/profile/watched-movies', authMiddleware, getWatchedMoviesController);
app.delete('/api/v1/profile/watched-movies/:movieId', authMiddleware, removeWatchedMovieController);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, { 
    environment: process.env.NODE_ENV || 'development',
    corsOrigin,
  });
});

export default app;
