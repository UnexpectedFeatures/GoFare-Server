import React, { useState, useRef, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WebSocketAdminClient from "./WebsocketAdminRepository"; // WebSocket client import
import { AuthContext } from "./AuthContext"; // Import AuthContext

function AdminLogin() {
  const { setIsLoggedIn } = useContext(AuthContext); // To set login state globally
  const navigate = useNavigate(); // Used for redirection
  const socketRef = useRef(null); // Ref to manage WebSocket connection
  const [email, setEmail] = useState(""); // State to store email
  const [password, setPassword] = useState(""); // State to store password
  const [error, setError] = useState(""); // State to store any error messages
  const [isLoggedIn, setLoggedIn] = useState(false); // Track login status

  // Check if already logged in and redirect if necessary
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const role = localStorage.getItem("userRole");
    
    if (token && role) {
      navigate("/admin-pannel"); // Redirect to dashboard if logged in
    }
  }, [navigate]); // Only run this effect when the component mounts

  // Handle login action
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError(""); // Reset any error messages
    const socket = socketRef.current;

    // Send login request via WebSocket
    const message = `[Login_Admin] ${JSON.stringify({ email, password })}`;
    socket.send(message);
  };

  // Initialize WebSocket connection and handle login response
  React.useEffect(() => {
    const adminSocket = new WebSocketAdminClient();
    socketRef.current = adminSocket;

    adminSocket.readyPromise.then(() => {
      console.log("✅ WebSocket connected for login");
    }).catch(err => {
      console.error("WebSocket failed to connect:", err);
    });

    adminSocket.onMessage((msg) => {
      console.log("Received message:", msg);

      if (msg.startsWith("[Login_Admin_Response]")) {
        const response = msg.replace("[Login_Admin_Response]", "").trim();
        const parsedResponse = JSON.parse(response);

        if (parsedResponse.status === "Success") {
          setLoggedIn(true); // Set login state to true
          setIsLoggedIn(true); // Update global context state
          localStorage.setItem("userToken", parsedResponse.token); // Store token in localStorage
          localStorage.setItem("userRole", parsedResponse.adminLevel); // Store the admin's role (adminLevel) in localStorage
          localStorage.setItem("username", parsedResponse.username); // Optionally store username
          localStorage.setItem("userEmail", parsedResponse.email); // Optionally store email
          
          navigate("/admin-pannel"); // Redirect to admin panel
          console.log("Login successful!", parsedResponse);
        } else {
          setError(parsedResponse.message || "Login failed");
        }
      }
    });

    return () => {
      adminSocket.close();
    };
  }, []); // Initialize WebSocket connection only once

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold text-center mb-4">Admin Login</h1>

        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border mt-2"
              placeholder="Enter your email"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border mt-2"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-500 text-white rounded mt-4"
          >
            Login
          </button>
        </form>

        {isLoggedIn && (
          <div className="text-green-500 text-center mt-4">
            Welcome back, Admin!
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLogin;
