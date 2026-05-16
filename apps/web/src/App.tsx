import './styles/globals.css';
import { AuthProvider } from './hooks/useAuth';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { OnboardingFlow } from './components/Onboarding/OnboardingFlow';
import { ProfilePage } from './pages/ProfilePage';
import { RecommendationPage } from './pages/RecommendationPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/onboarding" element={<OnboardingFlow />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/recommendation" element={<RecommendationPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
