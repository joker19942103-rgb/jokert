import { useAuth } from "@getmocha/users-service/react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Play, Trophy, Users, Shield } from "lucide-react";

export default function Home() {
  const { user, isPending, redirectToLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && user) {
      navigate("/dashboard");
    }
  }, [user, isPending, navigate]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      {/* Header */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h1 className="text-2xl font-bold">KS TV MatchScore</h1>
          </div>
          <button
            onClick={redirectToLogin}
            className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 px-6 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Увійти
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
            Професійне футбольне табло
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300">
            Створіть ідеальне табло для ваших спортивних трансляцій!
          </p>
          <button
            onClick={redirectToLogin}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black px-12 py-4 rounded-lg text-xl font-bold transition-all duration-200 transform hover:scale-105 shadow-2xl"
          >
            Почати зараз
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-16">Можливості платформи</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
            <Play className="h-12 w-12 text-green-400 mb-4" />
            <h3 className="text-xl font-semibold mb-4">Табло у реальному часі</h3>
            <p className="text-gray-300">
              Оновлення рахунку та таймера в реальному часі для ваших глядачів
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
            <Trophy className="h-12 w-12 text-yellow-400 mb-4" />
            <h3 className="text-xl font-semibold mb-4">OBS інтеграція</h3>
            <p className="text-gray-300">
              Унікальні посилання для кожного матчу для використання в OBS Studio
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
            <Users className="h-12 w-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-4">Персоналізація</h3>
            <p className="text-gray-300">
              Завантажуйте логотипи команд та обирайте між різними дизайнами
            </p>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-md mx-auto bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="text-center">
            <Shield className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Доступ до платформи</h3>
            <div className="text-4xl font-bold mb-2">300/150 ₴</div>
            <p className="text-gray-300 mb-8">Місячний платіж</p>
            
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                300/150 ₴ – при самостійному користуванні / при співпраці з нами
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                Професійне футбольне табло,
                OBS посилання для кожного матчу
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                Сучасний дизайну, завантаження логотипів команд
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                За інформацією звертайтесь в наш instagram:@karpiuksporttv
              </li>
            </ul>
            
            <button
              onClick={redirectToLogin}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black py-3 rounded-lg font-bold transition-all duration-200 transform hover:scale-105"
            >
              Розпочати
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-white/20">
        <div className="text-center text-gray-400">
          <p>&copy; 2024 KS TV MatchScore. Всі права захищені.</p>
        </div>
      </footer>
    </div>
  );
}
