import './styles/globals.css';
import { AuthProvider } from './hooks/useAuth';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { OnboardingFlow } from './components/Onboarding/OnboardingFlow';
import { ProfilePage } from './pages/ProfilePage';
import { RecommendationPage } from './pages/RecommendationPage';
import { HistoryPage } from './pages/HistoryPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { UserSearchPage } from './pages/UserSearchPage';
import { MovieListsPage } from './pages/MovieListsPage';
import { MovieListDetailPage } from './pages/MovieListDetailPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingFlow /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/recommendation" element={<ProtectedRoute><RecommendationPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
          <Route path="/users/search" element={<ProtectedRoute><UserSearchPage /></ProtectedRoute>} />
          <Route path="/users/:userId" element={<ProtectedRoute><PublicProfilePage /></ProtectedRoute>} />
          <Route path="/lists" element={<ProtectedRoute><MovieListsPage /></ProtectedRoute>} />
          <Route path="/lists/:listId" element={<ProtectedRoute><MovieListDetailPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
