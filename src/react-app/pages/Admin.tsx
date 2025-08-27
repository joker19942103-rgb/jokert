import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Users, CreditCard, Trophy, Shield, CheckCircle, Trash2, UserCheck, UserX, LogOut } from "lucide-react";

interface AppUser {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  is_payment_confirmed: boolean;
  created_at: string;
}

interface Payment {
  id: number;
  user_id: number;
  amount: number;
  status: string;
  user_name: string;
  user_email: string;
  created_at: string;
}

interface Match {
  id: number;
  user_id: number;
  team1_name: string;
  team2_name: string;
  team1_score: number;
  team2_score: number;
  user_name: string;
  user_email: string;
  created_at: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'matches'>('users');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [navigate]);

  const checkAdminAccess = async () => {
    try {
      // Check if admin is authenticated
      const response = await fetch("/api/admin/check");
      if (!response.ok) {
        navigate("/admin/login");
        return;
      }
      
      setAdminAuthenticated(true);
      fetchAllData();
    } catch (error) {
      console.error("Admin access check failed:", error);
      navigate("/admin/login");
    }
  };

  const fetchAllData = async () => {
    try {
      const [usersRes, paymentsRes, matchesRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/payments"),
        fetch("/api/admin/matches")
      ]);

      const [usersData, paymentsData, matchesData] = await Promise.all([
        usersRes.json(),
        paymentsRes.json(),
        matchesRes.json()
      ]);

      if (usersData.success) setUsers(usersData.data);
      if (paymentsData.success) setPayments(paymentsData.data);
      if (matchesData.success) setMatches(matchesData.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (paymentId: number) => {
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/confirm`, {
        method: "PUT",
      });
      
      if (response.ok) {
        fetchAllData(); // Refresh data
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
    }
  };

  const deleteMatch = async (matchId: number) => {
    if (!confirm("Ви впевнені, що хочете видалити це табло?")) return;
    
    try {
      const response = await fetch(`/api/admin/matches/${matchId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        fetchAllData(); // Refresh data
      }
    } catch (error) {
      console.error("Error deleting match:", error);
    }
  };

  const toggleUserStatus = async (userId: number, activate: boolean) => {
    const action = activate ? "активувати" : "деактивувати";
    if (!confirm(`Ви впевнені, що хочете ${action} цього користувача?`)) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activate }),
      });
      
      if (response.ok) {
        fetchAllData(); // Refresh data
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      navigate("/admin/login");
    } catch (error) {
      console.error("Error logging out:", error);
      navigate("/admin/login");
    }
  };

  if (loading || !adminAuthenticated) {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center space-x-2 hover:text-yellow-400 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>На головну</span>
              </Link>
              <Shield className="h-8 w-8 text-red-400" />
              <h1 className="text-2xl font-bold">Адміністрування</h1>
            </div>
            <button
              onClick={handleAdminLogout}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Вийти</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'users' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Користувачі ({users.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'payments' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <CreditCard className="h-5 w-5" />
            <span>Платежі ({payments.filter(p => p.status === 'pending').length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'matches' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <Trophy className="h-5 w-5" />
            <span>Матчі ({matches.length})</span>
          </button>
        </div>

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold mb-6">Управління платежами</h2>
            
            {payments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Немає платежів</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="bg-white/10 rounded-lg p-4 flex items-center justify-between border border-white/20"
                  >
                    <div>
                      <div className="font-semibold">{payment.user_name}</div>
                      <div className="text-sm text-gray-300">{payment.user_email}</div>
                      <div className="text-sm text-gray-400">
                        {payment.amount} ₴ • {new Date(payment.created_at).toLocaleDateString('uk-UA')}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        payment.status === 'pending' 
                          ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-400' 
                          : payment.status === 'confirmed'
                          ? 'bg-green-600/20 text-green-400 border border-green-400'
                          : 'bg-red-600/20 text-red-400 border border-red-400'
                      }`}>
                        {payment.status === 'pending' ? 'Очікує' : 
                         payment.status === 'confirmed' ? 'Підтверджено' : 'Відхилено'}
                      </span>
                      
                      {payment.status === 'pending' && (
                        <button
                          onClick={() => confirmPayment(payment.id)}
                          className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Підтвердити</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold mb-6">Користувачі системи</h2>
            
            {users.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Немає користувачів</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white/10 rounded-lg p-4 flex items-center justify-between border border-white/20"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{user.name}</span>
                        {user.is_admin && (
                          <span className="bg-red-600/20 text-red-400 border border-red-400 px-2 py-1 rounded text-xs">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-300">{user.email}</div>
                      <div className="text-sm text-gray-400">
                        Зареєстрований: {new Date(user.created_at).toLocaleDateString('uk-UA')}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.is_payment_confirmed 
                          ? 'bg-green-600/20 text-green-400 border border-green-400' 
                          : 'bg-yellow-600/20 text-yellow-400 border border-yellow-400'
                      }`}>
                        {user.is_payment_confirmed ? 'Активний' : 'Неактивний'}
                      </span>
                      
                      {user.is_payment_confirmed ? (
                        <button
                          onClick={() => toggleUserStatus(user.id, false)}
                          className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          <UserX className="h-4 w-4" />
                          <span>Деактивувати</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleUserStatus(user.id, true)}
                          className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          <UserCheck className="h-4 w-4" />
                          <span>Активувати</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold mb-6">Активні матчі</h2>
            
            {matches.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Немає активних матчів</p>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-white/10 rounded-lg p-4 flex items-center justify-between border border-white/20"
                  >
                    <div>
                      <div className="font-semibold text-lg">
                        {match.team1_name} {match.team1_score}:{match.team2_score} {match.team2_name}
                      </div>
                      <div className="text-sm text-gray-300">
                        Створив: {match.user_name} ({match.user_email})
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(match.created_at).toLocaleDateString('uk-UA')}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <a
                        href={`${window.location.origin}/scoreboard?match_id=${match.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Переглянути
                      </a>
                      
                      <button
                        onClick={() => deleteMatch(match.id)}
                        className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Видалити</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
