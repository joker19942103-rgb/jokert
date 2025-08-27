import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

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

export default function Scoreboard() {
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get("match_id");
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) {
      setError("Match ID required");
      setLoading(false);
      return;
    }

    fetchMatch();
    const interval = setInterval(fetchMatch, 1000);
    return () => clearInterval(interval);
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}`);
      const data = await response.json();

      if (data.success) {
        setMatch(data.data);
      } else {
        setError("Match not found");
      }
    } catch (error) {
      console.error("Error fetching match:", error);
      setError("Error loading scoreboard");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getDisplayTime = (match: Match): number => {
    if (match.current_half === 2) {
      return match.current_time + (match.half_time_offset || match.timer_duration);
    }
    return match.current_time;
  };

  if (loading) {
    return <div className="min-h-screen bg-transparent"></div>;
  }

  if (error || !match || !match.is_visible) {
    return <div className="min-h-screen bg-transparent"></div>;
  }

  return (
    <div className="fixed top-6 left-6 z-50">
      <div className="relative">
        <div className="flex items-center bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-full border-2 border-white/20 shadow-2xl overflow-hidden">
          {/* Timer */}
          <div className="bg-yellow-500 w-20 h-12 flex items-center justify-center">
            <div
              className={`text-black font-bold text-xl font-mono ${
                match.is_timer_running ? "animate-pulse" : ""
              }`}
            >
              {formatTime(getDisplayTime(match))}
            </div>
          </div>

          {/* Team 1 */}
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

          {/* Score */}
          <div className="flex items-center space-x-1 px-3">
            <div className="bg-white text-black font-bold text-xl px-3 py-1 rounded">
              {match.team1_score}
            </div>
            <div className="text-white font-bold text-lg">-</div>
            <div className="bg-white text-black font-bold text-xl px-3 py-1 rounded">
              {match.team2_score}
            </div>
          </div>

          {/* Team 2 */}
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

          {/* Half indicator replaced with your KS TV logo */}
          <div className="bg-yellow-500 w-20 h-12 flex items-center justify-center">
            <img
              src="https://i.ibb.co/FqgtH9xv/IMG-1751-1.png"
              alt="KS TV Logo"
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
