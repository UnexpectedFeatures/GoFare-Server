import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import { useTheme } from "./ThemeContext";
function Setting() {
    const isDarkMode = useTheme();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen">
            <div className={`max-w-md mx-auto p-6 rounded-lg shadow-md ${isDarkMode ? "bg-gray-700 text-white" : "bg-white"}`}>
                <h2 className="text-3xl font-semibold text-center mb-6">Settings</h2>
                <button
                    onClick={() => navigate("/change-pass")}
                    className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                >
                    Change Password
                </button>        
                <button
                    onClick={() => navigate("/profile")}
                    className="mt-3 w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 mb-4"
                >
                    Update Profile
                </button>
            </div>
        </div>
  );
}

export default Setting;
