import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">🎬 RecomiendaFilms</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Bienvenido, {user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Bienvenido al motor de recomendación
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Pronto podrás completar tu perfil y recibir recomendaciones personalizadas.
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-primary/90"
          >
            Comenzar Onboarding
          </button>
        </div>
      </main>
    </div>
  );
}
