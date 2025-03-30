import { Link, useLocation, useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "./AuthContext.jsx";

function Topbar() {
  const { darkMode, setDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const handleLogout = () => {
    const lastRole = localStorage.getItem("userRole");

    console.log("User Role Before Logout:", lastRole);
  
    localStorage.clear();
    setDarkMode(false);
    setIsLoggedIn(false);
    setIsMenuOpen(false);
  
    setTimeout(() => {
      console.log("Redirecting to /login"); 
      navigate("/login");
    }, 100); // Delay
  };
  

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  return (
    <div className="w-full">
      <nav 
        className={`p-4 w-screen grid grid-cols-1 items-center text-3xl font-bold ${darkMode ? "text-white bg-gray-700" : "text-gray-700"}`} 
        style={{
          boxShadow: darkMode ? '0px 4px 10px rgba(255, 255, 255, 0.5)' : '0px 4px 10px rgba(0, 0, 0, 0.2)'
        }}
      >
       <ul className={`gap-1 font-archivo flex flex-col sm:flex-row sm:gap-10 justify-center items-center `}>
        
          <li>
            <Link
              to="/"
              >
              <h2 className="text-red-500 text-3xl font-archivo flex sm:text-6xl"> 
                <span className="text-red-800">SAVE.</span>PH
              </h2> 
            </Link>
          </li>
          <li className="text-2xl font-archivo flex sm:text-4xl">
            <Link 
              to="/" 
              className={`hover:text-blue-500 hover:underline transition ${location.pathname === "/" ? "text-blue-500 underline" : ""}`}
            >
              Home
            </Link>
          </li>
          {isLoggedIn && (
            <li className="text-2xl font-archivo flex sm:text-4xl">
            <Link 
              to="/user-pannel" 
              className={`hover:text-blue-500 hover:underline transition ${location.pathname === "/user-pannel" ? "text-blue-500 underline" : ""}`}
            >
              User
            </Link>
          </li>
          )}
          <li className="text-2xl font-archivo flex sm:text-4xl">
            <Link 
              to="/news" 
              className={`${darkMode ? "text-white" : "text-black"}hover:text-blue-500 hover:underline transition ${location.pathname === "/news" ? "text-blue-500 underline" : ""}`}
            >
              News
            </Link>
          </li>
          <li className="text-2xl font-archivo flex sm:text-4xl">
            <Link 
              to="/about" 
              className={`hover:text-blue-500 hover:underline transition ${location.pathname === "/about" ? "text-blue-500 underline" : ""}`}
            >
              About Us
            </Link>
          </li>

          {isLoggedIn && (
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="p-2 rounded-full shadow-md max-h-14 w-11 cursor-pointer border-b-2 dark:bg-white hover:bg-gray-300 dark:hover:bg-white transition"
            >
              {darkMode ? <Sun className="w-7 h-7 text-amber-300" /> : <Moon className="w-7 h-7 text-gray-900" />}
            </button>
          )}

          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="p-2 rounded-full shadow-md border-b-2 max-h-14 hover:bg-gray-300 transition-all duration-300 flex items-center justify-center cursor-pointer"
            >
              <img src="../src/img/account.png" className={`w-8 h-8 rounded-full ${darkMode ? "invert-100" : "invert-0"}`} alt="User Menu" />
            </button>

            {isMenuOpen && (
              <div className="absolute left-[-78px] sm:right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2 z-50 font-sans">
                {isLoggedIn ? (
                  <>
                    <button 
                      onClick={() => navigate("/profile")} 
                      className="block w-full text-left px-4 py-2 text-sm font-sans hover:bg-gray-200 transition"
                    >
                      Profile
                    </button>
                    <button 
                      onClick={() => navigate("/setting")} 
                      className="block w-full text-left px-4 py-2 text-sm font-sans hover:bg-gray-200 transition"
                    >
                      Settings
                    </button>
                    <button 
                      onClick={handleLogout} 
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 font-sans hover:bg-gray-200 transition"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => navigate("/login")} 
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-200 transition"
                  >
                    Login
                  </button>
                )}
              </div>
            )}
          </div>
        </ul>
      </nav>
    </div>
  );
}

export default Topbar;
