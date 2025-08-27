import { useAuth } from "@getmocha/users-service/react";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Trophy, Clock, Palette } from "lucide-react";

export default function CreateMatch() {
  const { user: mochaUser, isPending } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    team1_name: "",
    team2_name: "",
    timer_duration: 2700, // 45 minutes default
    design_theme: "classic" as "classic" | "dark"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isPending && !mochaUser) {
      navigate("/");
    }
  }, [mochaUser, isPending, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        navigate(`/match/${data.data.id}`);
      } else {
        setError(data.message || "Помилка створення матчу");
      }
    } catch (error) {
      console.error("Error creating match:", error);
      setError("Помилка створення матчу");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} хв`;
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      {/* Header */}
      <nav className="border-b border-white/20 bg-black/20 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 hover:text-yellow-400 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Назад до панелі</span>
            </Link>
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h1 className="text-2xl font-bold">Створити нове табло</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-600/20 border border-red-400 rounded-lg p-4 text-red-200">
                  {error}
                </div>
              )}

              {/* Team Names */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Назва команди 1 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.team1_name}
                    onChange={(e) => setFormData({ ...formData, team1_name: e.target.value })}
                    className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Наприклад: Прикарпаття"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Назва команди 2 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.team2_name}
                    onChange={(e) => setFormData({ ...formData, team2_name: e.target.value })}
                    className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Наприклад: Буковина"
                  />
                </div>
              </div>

              {/* Timer Duration */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Тривалість тайму
                </label>
                <select
                  value={formData.timer_duration}
                  onChange={(e) => setFormData({ ...formData, timer_duration: parseInt(e.target.value) })}
                  className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={900} className="bg-gray-800">15 хв</option>
                  <option value={1200} className="bg-gray-800">20 хв</option>
                  <option value={1800} className="bg-gray-800">30 хв</option>
                  <option value={2700} className="bg-gray-800">45 хв</option>
                  <option value={3600} className="bg-gray-800">60 хв</option>
                </select>
                <p className="text-sm text-gray-400 mt-1">
                  Обрано: {formatTime(formData.timer_duration)}
                </p>
              </div>

              {/* Design Theme */}
              <div>
                <label className="block text-sm font-medium mb-4">
                  <Palette className="inline h-4 w-4 mr-1" />
                  Дизайн табло
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, design_theme: "classic" })}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      formData.design_theme === "classic"
                        ? "border-green-400 bg-green-400/20"
                        : "border-white/30 bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-lg p-4 mb-3">
                      <div className="text-center">
                        <div className="text-yellow-400 font-bold text-lg">⚽ КЛАСИЧНЕ</div>
                        <div className="text-white text-sm mt-2">Зелений фон • Білий текст</div>
                      </div>
                    </div>
                    <h3 className="font-semibold">Класичне табло</h3>
                    <p className="text-sm text-gray-400">ТВ-стиль, зелений фон</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, design_theme: "dark" })}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      formData.design_theme === "dark"
                        ? "border-purple-400 bg-purple-400/20"
                        : "border-white/30 bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg p-4 mb-3">
                      <div className="text-center">
                        <div className="text-orange-400 font-bold text-lg">⚡ ТЕМНЕ</div>
                        <div className="text-green-400 text-sm mt-2">Чорний фон • Неонові акценти</div>
                      </div>
                    </div>
                    <h3 className="font-semibold">Темне табло</h3>
                    <p className="text-sm text-gray-400">Неонові акценти, чорний фон</p>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !formData.team1_name || !formData.team2_name}
                className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
              >
                {loading ? "Створюємо..." : "Створити табло"}
              </button>
            </form>
          </div>

          {/* Info */}
          <div className="mt-8 bg-blue-600/20 border border-blue-400 rounded-xl p-6">
            <h3 className="font-semibold mb-2">💡 Корисно знати:</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Після створення ви зможете завантажити логотипи команд</li>
              <li>• Табло отримає унікальне OBS-посилання для трансляцій</li>
              <li>• Рахунок та таймер можна змінювати в реальному часі</li>
              <li>• Дизайн можна буде змінити пізніше в налаштуваннях</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
