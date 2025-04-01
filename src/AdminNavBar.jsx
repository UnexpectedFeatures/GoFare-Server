import React, { useState, useContext } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
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
    
            // Delay setting isLoggedIn to prevent interfering with ProtectedLogin
            setTimeout(() => setIsLoggedIn(false), 100);
        }, 200);
    };

    return (
        <div>
            {/* Top Bar */}
            <div className="fixed top-0 left-0 w-full bg-gray-900 text-white h-14 flex items-center px-4 shadow-md z-50">
                <div className="text-lg font-semibold">Admin Dashboard</div>
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
            <div className={`fixed top-14 left-0 h-full bg-gray-800 text-white transition-all duration-300 ${isNavOpen ? "w-64" : "w-16"}`}>
                <button
                    className="absolute top-5 right-[-15px] bg-gray-800 p-2 rounded-full shadow-md text-white"
                    onClick={() => setIsNavOpen(!isNavOpen)}
                >
                    {isNavOpen ? <ChevronLeft /> : <ChevronRight />}
                </button>

                <div className="flex flex-col items-center pt-10 space-y-4">  
                      
                    {roles === "admin" && (
                        <Link to="/event-pannel" className="w-full">
                            <button className="w-full cursor-pointer px-4 py-2 text-left hover:bg-gray-700">
                                📅 {isNavOpen && "Create Events"}
                            </button>
                        </Link>
                    )}

                    <Link to="/event-list" className="w-full">
                        <button className="w-full cursor-pointer px-4 py-2 text-left hover:bg-gray-700">
                            📅 {isNavOpen && "Events"}
                        </button>
                    </Link>

                    <Link to="/create-mod" className="w-full">
                        <button className="w-full cursor-pointer px-4 py-2 text-left hover:bg-gray-700">
                            👤 {isNavOpen && "Create Account"}
                        </button>
                    </Link>

                    {roles === "admin" && (
                        <Link to="/mod-list" className="w-full">
                            <button className="w-full cursor-pointer px-4 py-2 text-left hover:bg-gray-700">
                                🔹 {isNavOpen && "Moderator List"}
                            </button>
                        </Link>
                    )}
                    
                    
                    <Link to="/appeal" className="w-full">
                        <button className="w-full cursor-pointer px-4 py-2 text-left hover:bg-gray-700">
                            🔸 {isNavOpen && "Account Appeal"}
                        </button>
                    </Link>

                    <Link to="/user-list" className="w-full">
                        <button className="w-full cursor-pointer px-4 py-2 text-left hover:bg-gray-700">
                            👥 {isNavOpen && "User List"}
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
