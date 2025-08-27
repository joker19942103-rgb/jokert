import { useAuth } from "@getmocha/users-service/react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { 
  ArrowLeft, Play, Pause, RotateCcw, Plus, Minus, ExternalLink, 
  Eye, EyeOff, Clock, Settings, Users, Trophy, Timer
} from "lucide-react";

interface Match {
  id: number;
  team1_name: string;
  team2_name: string;
  team1_logo_url: string | null;
  team2_logo_url: string | null;
  team1_score: number;
  team2_score: number;
  timer_duration: number;
  current_time: number;
  is_timer_running: boolean;
  current_half: number;
  design_theme: string;
  is_visible: boolean;
  half_time_offset: number;
}

export default function MatchControl() {
  const { user: mochaUser, isPending } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'score' | 'timer' | 'teams' | 'settings'>('score');

  useEffect(() => {
    if (!isPending && !mochaUser) {
      navigate("/");
      return;
    }

    if (id) {
      fetchMatch();
    }
  }, [mochaUser, isPending, navigate, id]);

  useEffect(() => {
    // Poll server for timer updates when timer is running
    let pollingInterval: NodeJS.Timeout | null = null;
    
    if (match?.is_timer_running) {
      pollingInterval = setInterval(() => {
        fetchMatch();
      }, 1000);
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [match?.is_timer_running]);

  const fetchMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${id}`);
      const data = await response.json();
      if (data.success) {
        setMatch(data.data);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error fetching match:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const updateScore = async (team1Score: number, team2Score: number) => {
    try {
      await fetch(`/api/matches/${id}/score`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team1_score: team1Score, team2_score: team2Score }),
      });
      
      setMatch(prev => prev ? { ...prev, team1_score: team1Score, team2_score: team2Score } : null);
    } catch (error) {
      console.error("Error updating score:", error);
    }
  };

  const updateTimer = async (currentTime: number, isRunning: boolean) => {
    try {
      await fetch(`/api/matches/${id}/timer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_time: currentTime, is_timer_running: isRunning }),
      });
    } catch (error) {
      console.error("Error updating timer:", error);
    }
  };

  const updateVisibility = async (isVisible: boolean) => {
    try {
      await fetch(`/api/matches/${id}/visibility`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_visible: isVisible }),
      });
      
      setMatch(prev => prev ? { ...prev, is_visible: isVisible } : null);
    } catch (error) {
      console.error("Error updating visibility:", error);
    }
  };

  const updateTeamInfo = async (team: 'team1' | 'team2', name: string, logoUrl: string) => {
    try {
      const field1 = team === 'team1' ? 'team1_name' : 'team2_name';
      const field2 = team === 'team1' ? 'team1_logo_url' : 'team2_logo_url';
      
      await fetch(`/api/matches/${id}/team`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          [field1]: name,
          [field2]: logoUrl || null
        }),
      });
      
      setMatch(prev => prev ? { 
        ...prev, 
        [field1]: name,
        [field2]: logoUrl || null 
      } : null);
    } catch (error) {
      console.error("Error updating team info:", error);
    }
  };

  const switchHalf = async (half: number) => {
    try {
      let newTime = 0;
      let halfTimeOffset = 0;
      
      if (half === 2 && match) {
        halfTimeOffset = match.timer_duration;
      }
      
      await fetch(`/api/matches/${id}/half`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          current_half: half, 
          current_time: newTime,
          half_time_offset: halfTimeOffset,
          is_timer_running: false 
        }),
      });
      
      setMatch(prev => prev ? { 
        ...prev, 
        current_half: half, 
        current_time: newTime,
        half_time_offset: halfTimeOffset,
        is_timer_running: false 
      } : null);
    } catch (error) {
      console.error("Error switching half:", error);
    }
  };

  const toggleTimer = () => {
    if (!match) return;
    
    const newRunning = !match.is_timer_running;
    updateTimer(match.current_time, newRunning);
    // Server will handle the actual timer updates
  };

  const resetTimer = () => {
    if (!match) return;
    
    updateTimer(0, false);
    // Server will stop the timer and reset time
  };

  const adjustTimer = (delta: number) => {
    if (!match) return;
    
    const newTime = Math.max(0, Math.min(match.timer_duration, match.current_time + delta));
    updateTimer(newTime, match.is_timer_running);
    // Server will adjust the timer time
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDisplayTime = (match: Match): number => {
    if (match.current_half === 2) {
      return match.current_time + (match.half_time_offset || match.timer_duration);
    }
    return match.current_time;
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-semibold mb-4">Матч не знайдено</h1>
          <Link
            to="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
          >
            Повернутися до панелі
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <nav className="border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 hover:text-orange-400 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Назад до панелі</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="bg-red-600 px-3 py-1 rounded-md">
                  <span className="text-white font-bold text-sm">📺 KS TV</span>
                </div>
                <h1 className="text-2xl font-bold">Професійне табло</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`px-3 py-1 rounded-md text-sm font-semibold ${
                match.is_visible 
                  ? 'bg-green-600 text-white' 
                  : 'bg-red-600 text-white'
              }`}>
                {match.is_visible ? '🟢 В ЕФІРІ' : '🔴 НЕ В ЕФІРІ'}
              </div>
              <button
                onClick={() => updateVisibility(!match.is_visible)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-semibold ${
                  match.is_visible 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {match.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{match.is_visible ? 'Приховати' : 'Показати'}</span>
              </button>
              <a
                href={`${window.location.origin}/scoreboard?match_id=${match.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                <ExternalLink className="h-4 w-4" />
                <span>OBS Browser Source</span>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Live Preview of Professional Scoreboard */}
        <div className="mb-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2">
            <span>🎬</span>
            <span>Попередній перегляд табло</span>
          </h3>
          
          {/* Preview container */}
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
            <div className="relative inline-block">
              {/* Professional TV Scoreboard Preview */}
              <div className="flex items-center bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-full border-2 border-white/20 shadow-2xl overflow-hidden">
                {/* Timer section */}
                <div className="bg-orange-500 px-4 py-2 flex items-center">
                  <div className={`text-black font-bold text-xl font-mono ${
                    match.is_timer_running ? 'animate-pulse' : ''
                  }`}>
                    {formatTime(getDisplayTime(match))}
                  </div>
                </div>

                {/* Team 1 section */}
                <div className="flex items-center space-x-3 px-4 py-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30 overflow-hidden">
                    {match.team1_logo_url ? (
                      <img 
                        src={match.team1_logo_url} 
                        alt={match.team1_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-xs">
                        {match.team1_name.slice(0, 3).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-white font-bold text-lg tracking-wide">
                    {match.team1_name.slice(0, 3).toUpperCase()}
                  </div>
                </div>

                {/* Score section */}
                <div className="flex items-center space-x-1 px-3">
                  <div className="bg-white text-black font-bold text-xl px-3 py-1 rounded">
                    {match.team1_score}
                  </div>
                  <div className="text-white font-bold text-lg">-</div>
                  <div className="bg-white text-black font-bold text-xl px-3 py-1 rounded">
                    {match.team2_score}
                  </div>
                </div>

                {/* Team 2 section */}
                <div className="flex items-center space-x-3 px-4 py-2">
                  <div className="text-white font-bold text-lg tracking-wide">
                    {match.team2_name.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30 overflow-hidden">
                    {match.team2_logo_url ? (
                      <img 
                        src={match.team2_logo_url} 
                        alt={match.team2_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-xs">
                        {match.team2_name.slice(0, 3).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Half indicator */}
                <div className="bg-blue-600 px-3 py-2">
                  <div className="text-white font-bold text-sm">
                    {match.current_half === 1 ? '1T' : '2T'}
                  </div>
                </div>
              </div>

              {/* KS TV branding below scoreboard */}
              <div className="absolute -bottom-6 left-0 bg-red-600 px-3 py-1 rounded-md shadow-lg">
                <div className="text-white font-bold text-xs tracking-wider">
                  📺 KS TV
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Control Tabs */}
        <div className="flex space-x-2 mb-8 bg-black/20 p-2 rounded-xl backdrop-blur-lg border border-white/10">
          {[
            { id: 'score', label: 'Рахунок', icon: Trophy },
            { id: 'timer', label: 'Таймер', icon: Timer },
            { id: 'teams', label: 'Команди', icon: Users },
            { id: 'settings', label: 'Налаштування', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.id 
                  ? 'bg-orange-600 text-white shadow-lg scale-105' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Score Control */}
          {activeTab === 'score' && (
            <>
              <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 mx-auto mb-4">
                    {match.team1_logo_url ? (
                      <img src={match.team1_logo_url} alt={match.team1_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-2xl">{match.team1_name.charAt(0)}</span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{match.team1_name}</h3>
                  <div className="text-6xl font-bold text-orange-400 mb-6 font-mono">{match.team1_score}</div>
                </div>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => updateScore(Math.max(0, match.team1_score - 1), match.team2_score)}
                    className="bg-red-600 hover:bg-red-700 p-4 rounded-xl transition-colors shadow-lg hover:shadow-xl"
                  >
                    <Minus className="h-8 w-8" />
                  </button>
                  <button
                    onClick={() => updateScore(match.team1_score + 1, match.team2_score)}
                    className="bg-green-600 hover:bg-green-700 p-4 rounded-xl transition-colors shadow-lg hover:shadow-xl"
                  >
                    <Plus className="h-8 w-8" />
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 mx-auto mb-4">
                    {match.team2_logo_url ? (
                      <img src={match.team2_logo_url} alt={match.team2_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-2xl">{match.team2_name.charAt(0)}</span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{match.team2_name}</h3>
                  <div className="text-6xl font-bold text-orange-400 mb-6 font-mono">{match.team2_score}</div>
                </div>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => updateScore(match.team1_score, Math.max(0, match.team2_score - 1))}
                    className="bg-red-600 hover:bg-red-700 p-4 rounded-xl transition-colors shadow-lg hover:shadow-xl"
                  >
                    <Minus className="h-8 w-8" />
                  </button>
                  <button
                    onClick={() => updateScore(match.team1_score, match.team2_score + 1)}
                    className="bg-green-600 hover:bg-green-700 p-4 rounded-xl transition-colors shadow-lg hover:shadow-xl"
                  >
                    <Plus className="h-8 w-8" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Timer Control */}
          {activeTab === 'timer' && (
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-gray-900/70 to-black/70 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
                <h3 className="text-2xl font-bold mb-8 text-center flex items-center justify-center space-x-2">
                  <Timer className="h-6 w-6 text-orange-500" />
                  <span>Керування таймером</span>
                </h3>
                
                <div className="text-center mb-10">
                  <div className="bg-orange-500 inline-block px-6 py-3 rounded-xl mb-4">
                    <div className="text-black font-bold text-5xl font-mono">
                      {formatTime(getDisplayTime(match))}
                    </div>
                  </div>
                  <div className="text-xl text-gray-300">
                    з {Math.floor(match.timer_duration / 60)} хвилин • {match.current_half === 1 ? 'Перший тайм' : 'Другий тайм'}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <button
                    onClick={toggleTimer}
                    className={`flex items-center justify-center space-x-3 py-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl ${
                      match.is_timer_running 
                        ? 'bg-red-600 hover:bg-red-700 scale-105' 
                        : 'bg-green-600 hover:bg-green-700 hover:scale-105'
                    }`}
                  >
                    {match.is_timer_running ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    <span>{match.is_timer_running ? 'ПАУЗА' : 'СТАРТ'}</span>
                  </button>
                  
                  <button
                    onClick={resetTimer}
                    className="flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 py-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <RotateCcw className="h-6 w-6" />
                    <span>СКИНУТИ</span>
                  </button>

                  <button
                    onClick={() => switchHalf(match.current_half === 1 ? 2 : 1)}
                    className="flex items-center justify-center space-x-3 bg-purple-600 hover:bg-purple-700 py-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Clock className="h-6 w-6" />
                    <span>{match.current_half === 1 ? '2-Й ТАЙМ' : '1-Й ТАЙМ'}</span>
                  </button>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => adjustTimer(-60)}
                    className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition-colors font-semibold"
                  >
                    -1 хв
                  </button>
                  <button
                    onClick={() => adjustTimer(-10)}
                    className="bg-red-500/70 hover:bg-red-600 px-6 py-3 rounded-lg transition-colors font-semibold"
                  >
                    -10 сек
                  </button>
                  <button
                    onClick={() => adjustTimer(10)}
                    className="bg-green-500/70 hover:bg-green-600 px-6 py-3 rounded-lg transition-colors font-semibold"
                  >
                    +10 сек
                  </button>
                  <button
                    onClick={() => adjustTimer(60)}
                    className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-colors font-semibold"
                  >
                    +1 хв
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Teams Control */}
          {activeTab === 'teams' && (
            <>
              <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
                <h3 className="text-2xl font-bold mb-6 text-center flex items-center justify-center space-x-2">
                  <span>⚽</span>
                  <span>Команда 1</span>
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-300">Назва команди</label>
                    <input
                      type="text"
                      value={match.team1_name}
                      onChange={(e) => updateTeamInfo('team1', e.target.value, match.team1_logo_url || '')}
                      className="w-full bg-black/30 border border-white/30 rounded-xl px-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-300">URL логотипу</label>
                    <input
                      type="url"
                      value={match.team1_logo_url || ''}
                      onChange={(e) => updateTeamInfo('team1', match.team1_name, e.target.value)}
                      className="w-full bg-black/30 border border-white/30 rounded-xl px-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 mx-auto shadow-xl">
                      {match.team1_logo_url ? (
                        <img src={match.team1_logo_url} alt={match.team1_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-2xl">{match.team1_name.charAt(0)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900/50 to-blue-900/50 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
                <h3 className="text-2xl font-bold mb-6 text-center flex items-center justify-center space-x-2">
                  <span>⚽</span>
                  <span>Команда 2</span>
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-300">Назва команди</label>
                    <input
                      type="text"
                      value={match.team2_name}
                      onChange={(e) => updateTeamInfo('team2', e.target.value, match.team2_logo_url || '')}
                      className="w-full bg-black/30 border border-white/30 rounded-xl px-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-300">URL логотипу</label>
                    <input
                      type="url"
                      value={match.team2_logo_url || ''}
                      onChange={(e) => updateTeamInfo('team2', match.team2_name, e.target.value)}
                      className="w-full bg-black/30 border border-white/30 rounded-xl px-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 mx-auto shadow-xl">
                      {match.team2_logo_url ? (
                        <img src={match.team2_logo_url} alt={match.team2_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-2xl">{match.team2_name.charAt(0)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-gray-900/70 to-black/70 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
                <h3 className="text-2xl font-bold mb-8 text-center flex items-center justify-center space-x-2">
                  <Settings className="h-6 w-6 text-orange-500" />
                  <span>Налаштування професійного табло</span>
                </h3>
                
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-300">Тривалість тайму</label>
                    <select
                      value={match.timer_duration}
                      onChange={(e) => {
                        const duration = parseInt(e.target.value);
                        fetch(`/api/matches/${id}/settings`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ timer_duration: duration }),
                        });
                        setMatch(prev => prev ? { ...prev, timer_duration: duration } : null);
                      }}
                      className="w-full bg-black/30 border border-white/30 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                    >
                      <option value={900} className="bg-gray-800">15 хвилин</option>
                      <option value={1800} className="bg-gray-800">30 хвилин</option>
                      <option value={2700} className="bg-gray-800">45 хвилин</option>
                      <option value={3600} className="bg-gray-800">60 хвилин</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-300">Статус трансляції</label>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => updateVisibility(true)}
                        className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all font-semibold ${
                          match.is_visible ? 'bg-green-600 scale-105 shadow-lg' : 'bg-gray-600 hover:bg-green-600'
                        }`}
                      >
                        <Eye className="h-5 w-5" />
                        <span>В ЕФІРІ</span>
                      </button>
                      <button
                        onClick={() => updateVisibility(false)}
                        className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all font-semibold ${
                          !match.is_visible ? 'bg-red-600 scale-105 shadow-lg' : 'bg-gray-600 hover:bg-red-600'
                        }`}
                      >
                        <EyeOff className="h-5 w-5" />
                        <span>НЕ В ЕФІРІ</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <button
                    onClick={() => updateScore(0, 0)}
                    className="bg-yellow-600 hover:bg-yellow-700 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Скинути рахунок (0:0)
                  </button>
                  <button
                    onClick={() => {
                      resetTimer();
                      switchHalf(1);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Новий тайм
                  </button>
                  <button
                    onClick={() => {
                      updateScore(0, 0);
                      resetTimer();
                      switchHalf(1);
                    }}
                    className="bg-orange-600 hover:bg-orange-700 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Новий матч
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
