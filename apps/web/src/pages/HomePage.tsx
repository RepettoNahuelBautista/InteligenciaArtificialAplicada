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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">🎬 RecomiendaFilms</h1>
          <div className="flex items-center gap-4">
            <span className="text-indigo-100">
              Hola, {user?.displayName ?? user?.email?.split('@')[0] ?? 'Usuario'}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4">
            Bienvenido a RecomiendaFilms
          </h2>
          <p className="text-2xl text-indigo-100">
            Tu motor de recomendación inteligente de películas y series
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Onboarding Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 hover:bg-white/20 transition cursor-pointer" onClick={() => navigate('/onboarding')}>
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-white mb-3">Mis Preferencias</h3>
            <p className="text-indigo-100 mb-6">
              Selecciona tus géneros, directores y actores favoritos para que podamos darte recomendaciones más personalizadas.
            </p>
            <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-semibold w-full">
              Actualizar
            </button>
          </div>

          {/* Profile Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 hover:bg-white/20 transition cursor-pointer" onClick={() => navigate('/profile')}>
            <div className="text-5xl mb-4">👤</div>
            <h3 className="text-2xl font-bold text-white mb-3">Ver Mi Perfil</h3>
            <p className="text-indigo-100 mb-6">
              Revisa tus preferencias, películas vistas y estadísticas personales.
            </p>
            <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-semibold w-full">
              Ver Perfil
            </button>
          </div>

          {/* Recommendations Card (Coming Soon) */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 hover:bg-white/20 transition cursor-pointer" onClick={() => navigate('/recommendation')}>
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-2xl font-bold text-white mb-3">Obtener Recomendación</h3>
            <p className="text-indigo-100 mb-6">
              Recibe una recomendación personalizada basada en tu perfil y estado de ánimo actual.
            </p>
            <button className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition font-semibold w-full">
              Solicitar Recomendación
            </button>
          </div>

          {/* History Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 hover:bg-white/20 transition cursor-pointer" onClick={() => navigate('/history')}>
            <div className="text-5xl mb-4">📜</div>
            <h3 className="text-2xl font-bold text-white mb-3">Historial</h3>
            <p className="text-indigo-100 mb-6">
              Ve todas tus recomendaciones previas y vuelve a visitarlas cuando quieras.
            </p>
            <button className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition font-semibold w-full">
              Ver Historial
            </button>
          </div>

          {/* Reviews Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 hover:bg-white/20 transition cursor-pointer" onClick={() => navigate('/reviews')}>
            <div className="text-5xl mb-4">⭐</div>
            <h3 className="text-2xl font-bold text-white mb-3">Reseñas</h3>
            <p className="text-indigo-100 mb-6">
              Buscá una película o serie, leé lo que opinan otros usuarios y dejá tu propia reseña.
            </p>
            <button className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition font-semibold w-full">
              Ver Reseñas
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
