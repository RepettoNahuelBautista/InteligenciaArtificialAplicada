import './styles/globals.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './hooks/useAuth';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
import { AppLayout } from './components/AppLayout';

/** Wraps a page in auth guard + sidebar layout. */
function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<AuthPage />} />
              <Route path="/home"             element={<Protected><HomePage /></Protected>} />
              <Route path="/onboarding"       element={<Protected><OnboardingFlow /></Protected>} />
              <Route path="/profile"          element={<Protected><ProfilePage /></Protected>} />
              <Route path="/recommendation"   element={<Protected><RecommendationPage /></Protected>} />
              <Route path="/history"          element={<Protected><HistoryPage /></Protected>} />
              <Route path="/reviews"          element={<Protected><ReviewsPage /></Protected>} />
              <Route path="/users/search"     element={<Protected><UserSearchPage /></Protected>} />
              <Route path="/users/:userId"    element={<Protected><PublicProfilePage /></Protected>} />
              <Route path="/lists"            element={<Protected><MovieListsPage /></Protected>} />
              <Route path="/lists/:listId"    element={<Protected><MovieListDetailPage /></Protected>} />
              <Route path="*"                 element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
