import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import DashboardPage from "@/react-app/pages/Dashboard";
import CreateMatchPage from "@/react-app/pages/CreateMatch";
import MatchControlPage from "@/react-app/pages/MatchControl";
import PaymentPage from "@/react-app/pages/Payment";
import AdminPage from "@/react-app/pages/Admin";
import AdminLoginPage from "@/react-app/pages/AdminLogin";
import ScoreboardPage from "@/react-app/pages/Scoreboard";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/create-match" element={<CreateMatchPage />} />
          <Route path="/match/:id" element={<MatchControlPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/scoreboard" element={<ScoreboardPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
