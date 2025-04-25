import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./AuthContext.jsx";

function Footer() {
  const { isLoggedIn } = useContext(AuthContext);

  return (
    <footer className="bg-gray-900 text-white py-8 px-6">
      <hr className="border-gray-700" />
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm mt-5">
        
        {/* GoFare Description */}
        <div>
          <h2 className="text-lg font-bold">GoFare</h2>
          <p className="mt-2 text-gray-400">
            Your trusted companion for convenient and reliable transportation across the Philippines—whether by e-Jeep, Bus, or Train.
          </p>
        </div>

        {/* Navigation Links */}
        <div>
          <h3 className="text-lg font-bold">Explore</h3>
          <ul className="mt-2 space-y-2">
            <li><Link to="/routes" className="text-gray-400 hover:text-white">Routes</Link></li>
            <li><Link to="/fares" className="text-gray-400 hover:text-white">Fare Rates</Link></li>
            <li><Link to="/stations" className="text-gray-400 hover:text-white">Stations</Link></li>
            <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact Us</Link></li>
          </ul>
        </div>

        {/* Contact or Signup Section */}
        <div>
          <h3 className="text-lg font-bold">Stay Connected</h3>
          <p className="mt-2 text-gray-400">
            <Link 
              to={isLoggedIn ? "#" : "/login"} 
              className={`text-blue-500 hover:text-blue-700 ${isLoggedIn ? "pointer-events-none text-gray-400" : ""}`}
            >
              {isLoggedIn ? "You're subscribed" : "Sign up"}
            </Link> 
            {" "}to get updates on routes, traffic alerts, and service announcements.
          </p>
          <p className="mt-2 text-gray-400">
            Email: support@gofare.ph
          </p>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="text-center text-gray-500 text-xs mt-6 border-t border-gray-700 pt-4">
        © {new Date().getFullYear()} GoFare. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
