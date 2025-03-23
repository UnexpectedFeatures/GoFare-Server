import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";
import { AuthProvider } from "./AuthContext";
import Setting from "./Setting";
import Profile from "./Profile";
import Topbar from "./Topbar";
import Footer from "./Footer";
import Login from "./Login";
import News from "./News";
import UserPannel from "./UserPannel";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Topbar />
            <main className="flex-grow"> 
              <Routes>
                <Route path="/" element={<Navigate to="/home" />} />
                <Route path="/home" element={<ProtectedLogin />} />
                <Route path="/setting" element={<Setting />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/news" element={<News />} />
                <Route path="/user-pannel" element={<ProtectedRoute component={UserPannel} />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

const ProtectedLogin = () => {
  const { isLoggedIn } = useContext(AuthContext);
  return isLoggedIn ? <Navigate to="/user-pannel" /> : <Login />;
};

const ProtectedRoute = ({ component: Component }) => {
  const { isLoggedIn } = useContext(AuthContext);
  return isLoggedIn ? <Component /> : <Navigate to="/home" />;
};

export default App;
