import { useTheme } from "./ThemeContext.jsx";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./AuthContext.jsx";

function Footer() {
  const { isLoggedIn } = useContext(AuthContext);
  
    return (
      <footer className="bg-gray-900 text-white py-8 px-6 ">
        <hr className="text-gray-700"></hr>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm mt-5">
          {/* SAVE.PH Description */}
          <div>
            <h2 className="text-lg font-bold">SAVE.PH</h2>
            <p className="mt-2 text-gray-400">
              Dedicated to providing life-saving information and resources to help Filipinos prepare for and respond to natural disasters.
            </p>
          </div>
  
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold">Quick Links</h3>
            <ul className="mt-2 space-y-2">
              <li><Link to="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
              <li><Link to="/home" className="text-gray-400 hover:text-white">Safety Resources</Link></li>
            </ul>
          </div>
  
          {/* Subscription Section */}
          <div>
            <h3 className="text-lg font-bold">Connect With Us</h3>
            <p className="mt-2 text-gray-400">
              <Link 
                to={isLoggedIn ? "#" : "/login"} // Prevent navigation if logged in
                className={`text-blue-500 cursor-pointer hover:text-blue-700 ${isLoggedIn ? "pointer-events-none text-gray-400" : ""}`}
              >
                Sign-up
              </Link> 
              { " " } 
              to receive disaster alerts and updates.
            </p>
            <p className="mt-2 text-gray-400">
              @disasterrisk00@gmail.com
            </p>
          </div>
        </div>
  
        {/* Copyright Section */}
        <div className="text-center text-gray-500 text-xs mt-6 border-t border-gray-700 pt-4">
          © 2023 SAVE.PH. All rights reserved.
        </div>
      </footer>
    );
  };
  
  export default Footer;
  
