import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";


function UserPanel() {
  const [user, setUser] = useState({ username: "", role: "", email: "", lastLogin: "Never" });
  const [disasterNews, setDisasterNews] = useState([]);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const username = localStorage.getItem("username") || "Guest";
    const role = localStorage.getItem("userRole") || "Unknown";
    const email = localStorage.getItem("userEmail") || "Not provided";
    const lastLogin = localStorage.getItem("lastLogin");

    
    setUser({
      username,
      role,
      email,
      lastLogin: lastLogin ? formatDistanceToNow(new Date(lastLogin), { addSuffix: true }) : "Never",
    });

    const fetchDisasterNews = async () => {
      try {
        const response = await axios.get("https://data.humdata.org/api/3/action/datastore_search", {
          params: { resource_id: "YOUR_CORRECT_RESOURCE_ID", limit: 5 },
        });

        if (response.data.success) {
          setDisasterNews(response.data.result.records || []);
        } else {
          console.error("Error fetching disaster news: API did not return success.");
        }
      } catch (error) {
        console.error("Error fetching disaster data:", error);
      }
    };

    const fetchMedia = () => {
      setVideos([
        { id: 1, title: "Earthquake Aftermath", url: "https://www.youtube.com/embed/l4uuDGDON0w" },
        { id: 2, title: "Flood Warnings", url: "https://www.youtube.com/embed/RNbbTt6C8n4" },
      ]);
    };

    fetchDisasterNews();
    fetchMedia();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6 w-screen overflow-hidden">
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

        {/* News Section */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-700">Latest Disaster News</h2>
          <div className="mt-3 space-y-3">
            {disasterNews.length > 0 ? (
              disasterNews.map((news, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg border-l-4 border-red-500">
                  <h3 className="font-bold text-red-600">{news.Name}</h3>
                  <p className="text-sm text-gray-600">{news.info}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No disaster news available.</p>
            )}
          </div>
        </div>

        {/* Media Section */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-700">Disaster Media</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {/* Videos */}
            {videos.map((video) => (
              <div key={video.id} className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-bold text-blue-600">{video.title}</h3>
                <iframe
                  width="100%"
                  height="250"
                  src={video.url}
                  title={video.title}
                  frameBorder="0"
                  allowFullScreen
                  className="rounded-md w-full"
                ></iframe>
              </div>
            ))}
            
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default UserPanel;
