import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";
import { AuthProvider } from "./AuthContext";
import Setting from "./Setting";
import Profile from "./Profile";
import Topbar from "./Topbar";
import Footer from "./Footer";
import Login from "./Login";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import News from "./News";
import Home from "./Home";
import AboutUs from "./AboutUs";
import AdminLogin from "./AdminLogin";
import UserPannel from "./UserPannel";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import AdminPannel from './AdminPannel';
import AdminNavBar from './AdminNavBar';
import ErrorBoundary from './ErrorBoundary';
import ModList from './ModList';
import EventPannel from './EventPannel';
import CreateMod from './CreateMod';
import UserList from "./UserList";
import EventList from './EventList';
import BanRequest from "./BanRequest";
import AccountAppeal from "./AccountAppeal";
import ChangePass from "./ChangePass";

function Layout() {
  const location = useLocation();

  // Define all admin-related routes
  const adminRoutes = ["/admin-pannel", "/appeal", "/user-list", "/mod-list", "/event-pannel", "/event-list", "/create-mod"];

  // Check if the current route is in the admin section but NOT admin-login
  const isAdminSection = adminRoutes.includes(location.pathname);
  const shouldShowTopbar = location.pathname !== "/admin-login" && !isAdminSection;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Show Topbar if not in admin section or admin-login */}
      {shouldShowTopbar && <Topbar />}

      {/* Show AdminNavBar only on admin-related pages (excluding admin-login) */}
      {isAdminSection && <AdminNavBar />}

      <main className="flex-grow mt-16 sm:mt-20 md:mt-24 lg:mt-28">
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/admin-login" element={<ProtectedAdminLogin />} />
          <Route path="/login" element={<ProtectedLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/setting" element={<Setting />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-pass" element={<ChangePass />} />
          <Route path="/news" element={<News />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/user-list" element={<UserList />} />
          <Route path="/appeal" element={<AccountAppeal />} />
          <Route path="/mod-list" element={<ModList />} />
          <Route path="/event-pannel" element={<EventPannel />} />
          <Route path="/ban-request" element={<BanRequest />} />
          <Route path="/event-list" element={<EventList />} />
          <Route path="/create-mod" element={<CreateMod />} />
          <Route path="/user-pannel" element={<ProtectedRoute component={UserPannel} />} />
          <Route path="/admin-pannel" element={<ProtectedRoute component={AdminPannel} adminOnly={true} />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <Router>
            <Layout />
          </Router>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}

const ProtectedLogin = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const userRole = localStorage.getItem("userRole")?.toLowerCase();

  if (!isLoggedIn) {
    return <Login />;
  }

  // Redirect admins to /admin-pannel, others to /user-pannel
  return <Navigate to={userRole === "admin" ? "/admin-pannel" : "/user-pannel"} />;
};

const ProtectedAdminLogin = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const userRole = localStorage.getItem("userRole")?.toLowerCase();

  if (isLoggedIn && (userRole === "admin" || userRole === "moderator")) {
    return <Navigate to="/admin-pannel" />;
  }

  return <AdminLogin />;
};

const ProtectedRoute = ({ component: Component, adminOnly = false }) => {
  const { isLoggedIn } = useContext(AuthContext);
  const userRole = localStorage.getItem("userRole");

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly) {
    if (!userRole) {
      return null;
    }

    if (userRole.toLowerCase() === "admin" || userRole.toLowerCase() === "moderator") {
      return <Component />;
    }

    return <Navigate to="/user-pannel" replace />;
  }

  return <Component />;
};

export default App;
