import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

function AdminPannel() {
  const [user, setUser] = useState({
    username: "",
    role: "",
    email: "",
    lastLogin: "Never",
  });
  const [errorMessage, setErrorMessage] = useState(""); // Define errorMessage state

  useEffect(() => {
    try {
      const username = localStorage.getItem("username") || "Guest";
      const role = localStorage.getItem("userRole") || "Unknown";
      const email = localStorage.getItem("userEmail") || "Not provided";
      const lastLogin = localStorage.getItem("lastLogin");

      // Check if lastLogin is valid before formatting
      const formattedLastLogin =
        lastLogin && !isNaN(new Date(lastLogin))
          ? formatDistanceToNow(new Date(lastLogin), { addSuffix: true })
          : "Never";

      setUser({
        username,
        role,
        email,
        lastLogin: formattedLastLogin,
      });
    } catch (error) {
      setErrorMessage("Failed to retrieve user data.");
      console.error("Error retrieving user data from localStorage:", error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 w-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-xl rounded-lg p-6 w-full max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-2xl font-bold text-red-600">Disaster Risk Dashboard</h1>
        </div>

        {/* User Info */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-xl font-bold">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user.username}</h2>
            <p className="text-gray-500">Role: {user.role}</p>
            <p className="text-gray-500">Email: {user.email}</p>
            <p className="text-gray-500">Last Login: {user.lastLogin}</p>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mt-6 p-4 bg-red-100 text-red-600 border border-red-300 rounded-lg">
            <p>{errorMessage}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default AdminPannel;
