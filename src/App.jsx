import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";
import { AuthProvider } from "./AuthContext";
import Setting from "./Setting";
import Profile from "./Profile";
import Topbar from "./Topbar";
import Footer from "./Footer";
import Login from "./Login";
import News from "./News";
import Home from "./Home";
import AdminLogin from "./AdminLogin";
import UserPannel from "./UserPannel";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import AdminPannel from './AdminPannel';
import ErrorBoundary from './ErrorBoundary';


function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <Router>
            <div className="flex flex-col min-h-screen">
              <Topbar />
              <main className="flex-grow"> 
                <Routes>
                    <Route path="/" element={<Navigate to="/home" />} />
                    <Route path="/home" element={<Home />} /> 
                    <Route path="/admin-login" element={<AdminLogin />} />
                    <Route path="/login" element={<ProtectedLogin />} />
                    <Route path="/setting" element={<Setting />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/user-pannel" element={<ProtectedRoute component={UserPannel} />} />
                    <Route path="/admin-pannel" element={<ProtectedRoute component={ AdminPannel } adminOnly={true} />} />
                  
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}

const ProtectedLogin = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const userRole = localStorage.getItem("userRole")?.toLowerCase(); // Ensure case-insensitive check

  if (!isLoggedIn) {
    return <Login />;
  }

  <Navigate to="/user-pannel" />;
};


const ProtectedRoute = ({ component: Component, adminOnly = false }) => {
  const { isLoggedIn } = useContext(AuthContext);
  const userRole = localStorage.getItem("userRole")?.toLowerCase(); // Ensure case-insensitive check

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && (userRole !== "admin" && userRole !== "moderator")) {
    return <Navigate to="/user-pannel" />; // Redirect non-admins to User Panel
  }

  return <Component />;
};

export default App;
