import React, { useState, useContext } from "react";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { Link } from "react-router-dom";

function AdminTopBar() {
    const navigate = useNavigate();
    const username = localStorage.getItem("username") || "Admin";
    const email = localStorage.getItem("userEmail") || "admin@example.com";
    const { setIsLoggedIn } = useContext(AuthContext);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const roles = localStorage.getItem("userRole")?.toLowerCase();

    const handleLogout = () => {
        console.log("User Role Before Logout:", localStorage.getItem("userRole"));
    
        localStorage.removeItem("userToken");
        localStorage.removeItem("userRole");
    
        setTimeout(() => {
            console.log("Redirecting to /admin-login");
            navigate("/admin-login", { replace: true });
    
            setTimeout(() => setIsLoggedIn(false), 100);
        }, 200);
    };

    return (
        <div>
            {/* Top Bar */}
            <div className="fixed top-0 left-0 w-full bg-gray-900 text-white h-14 flex items-center px-4 shadow-md z-50">
                {/* Burger Icon */}
                <button
                    className="p-2 rounded-full shadow-md text-white"
                    onClick={() => setIsNavOpen(!isNavOpen)}
                >
                    <Menu className="w-8 h-8" />
                </button>

                <div className="text-lg font-semibold ml-4">Admin Dashboard</div>

                <div className="ml-auto flex items-center space-x-4">
                    <div className="text-sm text-gray-300">
                        <p className="font-medium">{username}</p>
                        <p className="text-xs">{email}</p>
                    </div>
                    <div className="text-sm text-gray-300">
                        <p className="font-medium">{'\u00A0'}</p>
                        <p className="font-medium">{roles}</p>
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div
                className={`fixed top-14 left-0 h-full bg-gray-800 text-white transition-all duration-300 ${isNavOpen ? "w-64 opacity-100 pointer-events-auto" : "w-0 opacity-0 pointer-events-none"}`}
            >
                <div className="flex flex-col items-center pt-10 space-y-4">  
                    <Link to="/admin-pannel" className="w-full">
                        <button className="w-full cursor-pointer px-4 py-2 text-left hover:bg-gray-700">
                            ⓘ {isNavOpen && "Admin Info"}
                        </button>
                    </Link>

                    {roles === "Super Admin" && (
                        <Link to="/create-mod" className="w-full">
                            <button className="w-full cursor-pointer px-4 py-2 text-left hover:bg-gray-700">
                                👤 {isNavOpen && "Create Account"}
                            </button>
                        </Link>
                    )}

                    <Link to="/appeal" className="w-full">
                        <button className="w-full cursor-pointer px-4 py-2 text-left hover:bg-gray-700">
                            🔸 {isNavOpen && "Request"}
                        </button>
                    </Link>

                    <Link to="/transit" className="w-full">
                        <button className="w-full cursor-pointer px-4 py-2 text-left hover:bg-gray-700">
                            🔸 {isNavOpen && "Transit"}
                        </button>
                    </Link>
                    
                    {roles === "Super Admin" && (
                        <Link to="/mod-list" className="w-full">
                            <button className="w-full cursor-pointer px-4 py-2 text-left hover:bg-gray-700">
                                🔹 {isNavOpen && "Moderator List"}
                            </button>
                        </Link>
                    )}

                    {roles === "Super Admin" && (
                        <Link to="/admin-archive" className="w-full">
                            <button className="w-full cursor-pointer px-4 py-2 text-left hover:bg-gray-700">
                                🔹 {isNavOpen && "Moderator Archive"}
                            </button>
                        </Link>
                    )}

                    <Link to="/user-list" className="w-full">
                        <button className="w-full cursor-pointer px-4 py-2 text-left hover:bg-gray-700">
                            👥 {isNavOpen && "User List"}
                        </button>
                    </Link>

                    <Link to="/user-archive" className="w-full">
                        <button className="w-full cursor-pointer px-4 py-2 text-left hover:bg-gray-700">
                        👥 {isNavOpen && "User Archive"}
                        </button>
                    </Link>

                    <Link to="/driver-list" className="w-full">
                        <button className="w-full cursor-pointer px-4 py-2 text-left hover:bg-gray-700">
                        👨‍✈️ {isNavOpen && "Driver List"}
                        </button>
                    </Link>

                    <Link to="/driver-archive" className="w-full">
                        <button className="w-full cursor-pointer px-4 py-2 text-left hover:bg-gray-700">
                        👨‍✈️ {isNavOpen && "Driver Archive"}
                        </button>
                    </Link>
                    <button onClick={handleLogout} className="w-full cursor-pointer px-4 py-2 text-left hover:bg-gray-700">
                        🔴 {isNavOpen && "Logout"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AdminTopBar;
