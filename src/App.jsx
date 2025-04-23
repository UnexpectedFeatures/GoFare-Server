


import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";
import { AuthProvider } from "./AuthContext";
import Topbar from "./Topbar";
import Footer from "./Footer";
import AdminLogin from "./AdminLogin";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import AdminPannel from './AdminPannel';
import AdminNavBar from './AdminNavBar';
import ErrorBoundary from './ErrorBoundary';
import ModList from './ModList';
import AdminArchive from "./AdminArchive";
import CreateMod from './CreateMod';
import UserList from "./UserList";
import UserArchive from "./UserArchive";
import BanRequest from "./BanRequest";
import AccountAppeal from "./AccountAppeal";

function Layout() {
  const location = useLocation();

  // Define all admin-related routes
  const adminRoutes = ["/admin-pannel", "/appeal", "/user-list", "/mod-list", "/admin-archive", "/user-archive", "/create-mod"];

  // Check if the current route is in the admin section but NOT admin-login
  const isAdminSection = adminRoutes.includes(location.pathname);
  const shouldShowTopbar = location.pathname !== "/admin-login" && !isAdminSection;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Show Topbar if not in admin section or admin-login */}
      {shouldShowTopbar && <Topbar />}

      {/* Show AdminNavBar only on admin-related pages (excluding admin-login) */}
      {isAdminSection && <AdminNavBar />}

      <main className={`flex-grow mt-16 sm:mt-20 md:mt-24 lg:mt-28 ${isAdminSection ? 'mb-20' : ''}`}>

        <Routes>
          <Route path="/" element={<Navigate to="/admin-login" />} />
          <Route path="/admin-login" element={<ProtectedAdminLogin />} />
          <Route path="/user-list" element={<UserList />} />
          <Route path="/user-archive" element={<UserArchive />} />
          <Route path="/appeal" element={<AccountAppeal />} />
          <Route path="/mod-list" element={<ModList />} />
          <Route path="/admin-archive" element={<AdminArchive />} />
          <Route path="/ban-request" element={<BanRequest />} />
          <Route path="/create-mod" element={<CreateMod />} />
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
  const userRole = localStorage.getItem("userRole")?.toLowerCase();

  if (!isLoggedIn) {
    // Redirect to admin-login if it's an admin page
    return adminOnly ? <Navigate to="/admin-login" replace /> : <Navigate to="/login" replace />;
  }

  if (adminOnly) {
    if (userRole === "admin" || userRole === "moderator") {
      return <Component />;
    }
    // Logged-in users without admin/moderator role go to user panel
    return <Navigate to="/user-pannel" replace />;
  }

  return <Component />;
};


export default App;
