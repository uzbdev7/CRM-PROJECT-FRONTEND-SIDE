// src/App.jsx
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth }        from "./context/AuthContext.jsx";
import LoginPage          from "./pages/LoginPage.jsx";
import AdminDashboard     from "./pages/admin/AdminDashboard.jsx";
import TeacherDashboard   from "./pages/teacher/TeacherDashboard.jsx";
import StudentDashboard   from "./pages/student/StudentDashboard.jsx";
import { Spinner }        from "./components/ui/index.jsx";
import { ADMIN_ROLES }    from "./utils/constants.js";

function RoleRedirect({ user }) {
  if (ADMIN_ROLES.includes(user.role)) return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "TEACHER")         return <Navigate to="/teacher/dashboard" replace />;
  if (user.role === "STUDENT")         return <Navigate to="/student/dashboard" replace />;
  return <Navigate to="/unknown" replace />;
}

function GuestRoute({ user, children }) {
  if (user) return <RoleRedirect user={user} />;
  return children;
}

// ← loading qo'shildi
function PrivateRoute({ user, loading, allowedRoles, children }) {
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, login, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (loggedInUser) => {
    login(loggedInUser);
    if (ADMIN_ROLES.includes(loggedInUser.role))  navigate("/admin/dashboard",   { replace: true });
    else if (loggedInUser.role === "TEACHER")      navigate("/teacher/dashboard", { replace: true });
    else if (loggedInUser.role === "STUDENT")      navigate("/student/dashboard", { replace: true });
    else                                            navigate("/unknown",           { replace: true });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#07091A",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <Routes>
      {/* Default */}
      <Route path="/" element={
        user ? <RoleRedirect user={user} /> : <Navigate to="/login" replace />
      } />

      {/* Login */}
      <Route path="/login" element={
        <GuestRoute user={user}>
          <LoginPage onLogin={handleLogin} />
        </GuestRoute>
      } />

      {/* Admin */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/:tab" element={
        <PrivateRoute user={user} loading={loading} allowedRoles={ADMIN_ROLES}>
          <AdminDashboard user={user} onLogout={logout} />
        </PrivateRoute>
      } />

      {/* Teacher */}
      <Route path="/teacher/*" element={
        <PrivateRoute user={user} loading={loading} allowedRoles={["TEACHER"]}>
          <TeacherDashboard user={user} onLogout={logout} />
        </PrivateRoute>
      } />

      {/* Student */}
      <Route path="/student/*" element={
        <PrivateRoute user={user} loading={loading} allowedRoles={["STUDENT"]}>
          <StudentDashboard user={user} onLogout={logout} />
        </PrivateRoute>
      } />

      {/* Unknown role */}
      <Route path="/unknown" element={
        <div style={{
          minHeight: "100vh", background: "#07091A", color: "#E2E8F0",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16,
        }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Noma'lum rol: {user?.role}</div>
          <button onClick={logout} style={{
            padding: "10px 24px", borderRadius: 10,
            background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)",
            color: "#F87171", cursor: "pointer", fontSize: 14, fontFamily: "inherit",
          }}>Chiqish</button>
        </div>
      } />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}