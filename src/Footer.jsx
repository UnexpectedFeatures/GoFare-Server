import { useTheme } from "./ThemeContext.jsx";
import { Link } from "react-router-dom";

function Footer() {
    const { darkMode } = useTheme();
    
    return (
        <div className="mt-auto bg-gray-900 text-white py-6">
            <footer className="container mx-auto text-center px-4">
                <h2 className="text-2xl font-bold">SAVE.PH</h2>
                <p className="text-sm mt-2 opacity-80">Your trusted platform for disaster risk awareness and response.</p>
                
                <div className="flex justify-center space-x-6 mt-4">
                    <Link to="/about" className="hover:text-blue-400 transition">About</Link>
                    <Link to="/news" className="hover:text-blue-400 transition">News</Link>
                </div>

                <p className="text-xs mt-6 opacity-50">&copy; {new Date().getFullYear()} SAVE.PH. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default Footer;
