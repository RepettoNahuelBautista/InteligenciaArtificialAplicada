import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { registerController, loginController, meController, changePasswordController } from './controllers/authController';
import { getGenresController, saveGenrePreferencesController } from './controllers/genreController';
import { getProfileController, updatePersonalInfoController } from './controllers/profileController';
import { searchPeopleController, savePersonPreferencesController, getPersonPreferencesController } from './controllers/personController';
import { searchMoviesController, rateMovieController, getWatchedMoviesController, removeWatchedMovieController } from './controllers/movieController';
import { getMoodsController } from './controllers/moodController';
import { getRecommendationController, getRecommendationHistoryController } from './controllers/recommendationController';
import { getReviewsController, upsertReviewController, getPublicProfileController, getUserReviewsController } from './controllers/reviewController';
import { likeReviewController, unlikeReviewController } from './controllers/reviewLikeController';
import { searchUsersController, followController, unfollowController, getFollowersController, getFollowingController } from './controllers/followController';
import { uploadAvatarController, generateAvatarController } from './controllers/avatarController';
import { narrateController } from './controllers/narrateController';
import { getListsController, getPublicListsController, getListDetailController, createListController, updateListController, deleteListController, addItemController, removeItemController } from './controllers/movieListController';
import { getFeedController } from './controllers/feedController';

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

// Feed route
app.get('/api/v1/feed', authMiddleware, getFeedController);

// Auth routes
app.post('/api/v1/auth/register', registerController);
app.post('/api/v1/auth/login', loginController);
app.get('/api/v1/auth/me', authMiddleware, meController);
app.put('/api/v1/auth/password', authMiddleware, changePasswordController);

// Genre routes
app.get('/api/v1/genres', getGenresController);
app.post('/api/v1/profile/genres', authMiddleware, saveGenrePreferencesController);

// Mood routes
app.get('/api/v1/moods', getMoodsController);

// Recommendation routes
app.post('/api/v1/recommendations', authMiddleware, getRecommendationController);
app.get('/api/v1/recommendations', authMiddleware, getRecommendationHistoryController);
app.post('/api/v1/recommendations/narrate', authMiddleware, narrateController);

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
app.post('/api/v1/reviews/:reviewId/like', authMiddleware, likeReviewController);
app.delete('/api/v1/reviews/:reviewId/like', authMiddleware, unlikeReviewController);

// List routes
app.get('/api/v1/lists', authMiddleware, getListsController);
app.post('/api/v1/lists', authMiddleware, createListController);
app.get('/api/v1/lists/:listId', authMiddleware, getListDetailController);
app.put('/api/v1/lists/:listId', authMiddleware, updateListController);
app.delete('/api/v1/lists/:listId', authMiddleware, deleteListController);
app.post('/api/v1/lists/:listId/items', authMiddleware, addItemController);
app.delete('/api/v1/lists/:listId/items/:tmdbId', authMiddleware, removeItemController);

// Follow list routes (own profile)
app.get('/api/v1/profile/followers', authMiddleware, getFollowersController);
app.get('/api/v1/profile/following', authMiddleware, getFollowingController);
app.post('/api/v1/profile/avatar', authMiddleware, uploadAvatarController);
app.post('/api/v1/profile/avatar/generate', authMiddleware, generateAvatarController);

// User / follow routes — /users/search must be before /users/:userId/*
app.get('/api/v1/users/search', authMiddleware, searchUsersController);
app.get('/api/v1/users/:userId/profile', authMiddleware, getPublicProfileController);
app.get('/api/v1/users/:userId/reviews', authMiddleware, getUserReviewsController);
app.get('/api/v1/users/:userId/lists', authMiddleware, getPublicListsController);
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
