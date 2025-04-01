  import React, { useEffect, useState } from "react";
  import { motion } from "framer-motion";
  import axios from "axios";
  import { formatDistanceToNow } from "date-fns";
  import { useTheme } from "./ThemeContext";

  function UserPanel() {
    const { darkMode } = useTheme();
    const [user, setUser] = useState({ username: "", role: "", email: "", last_login: "Never" });
    const [disasterNews] = useState([]);
    const [videos, setVideos] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");

    // Use the email from localStorage
    useEffect(() => {
      const emails = localStorage.getItem("userEmail") || "Not provided";
      const fetchUserInfo = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/auth/getUserInfo/${emails}`);
          
          // Make sure response is logged inside the try block
          console.log("Response from API:", response);
      
          const { username, role, email, last_login } = response.data;
      
          const formattedLastLogin = last_login
            ? formatDistanceToNow(new Date(last_login), { addSuffix: true })
            : "Never";
      
          setUser({
            username,
            role,
            email,
            last_login: formattedLastLogin,
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
          setErrorMessage("Error fetching user data");
        }
      };
      

      fetchUserInfo();

      // Example of how you might fetch videos/media
      const fetchMedia = () => {
        setVideos([
          { id: 1, title: "Earthquake Aftermath", url: "https://www.youtube.com/embed/l4uuDGDON0w" },
          { id: 2, title: "Flood Warnings", url: "https://www.youtube.com/embed/RNbbTt6C8n4" },
        ]);
      };

      fetchMedia();
    }, []); // Empty dependency array ensures this runs once on component mount

    return (
      <div className={`min-h-screen flex flex-col items-center p-6 w-screen overflow-hidden transition-colors duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`shadow-lg rounded-lg p-6 w-full max-w-4xl mx-auto transition-colors duration-300 ${darkMode ? "bg-gray-800" : "bg-white"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4 border-gray-500">
            <h1 className="text-2xl font-bold text-red-600">Disaster Risk Dashboard</h1>
          </div>

          {/* User Info */}
          <div className="mt-4 flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold transition-colors duration-300 ${darkMode ? "bg-gray-700 text-white" : "bg-gray-300 text-gray-700"}`}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user.username}</h2>
              <p className="text-gray-400">Role: {user.role}</p>
              <p className="text-gray-400">Email: {user.email}</p>
              <p className="text-gray-400">Last Login: {user.last_login}</p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-6 p-4 bg-red-100 text-red-600 border border-red-300 rounded-lg">
              <p>{errorMessage}</p>
            </div>
          )}

          {/* News Section */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold">Latest Disaster News</h2>
            <div className="mt-3 space-y-3">
              {disasterNews.length > 0 ? (
                disasterNews.map((news, index) => (
                  <motion.div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 transition-all duration-300 ${darkMode ? "bg-gray-700 border-red-500 text-white" : "bg-gray-50 border-red-500 text-gray-900"}`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <h3 className="font-bold text-red-600">{news.Name}</h3>
                    <p className="text-sm">{news.info}</p>
                  </motion.div>
                ))
              ) : (
                <p className="text-gray-400">No disaster news available.</p>
              )}
            </div>
          </div>

          {/* Media Section */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold">Disaster Media</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {videos.map((video) => (
                <motion.div
                  key={video.id}
                  className={`p-4 rounded-lg transition-all duration-300 ${darkMode ? "bg-gray-700 text-white" : "bg-gray-50 text-gray-900"}`}
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="font-bold text-blue-500">{video.title}</h3>
                  <iframe
                    width="100%"
                    height="250"
                    src={video.url}
                    title={video.title}
                    frameBorder="0"
                    allowFullScreen
                    className="rounded-md w-full"
                  ></iframe>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  export default UserPanel;
