import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "./AuthContext";

// Import the WebSocketAdminClient
import WebSocketAdminClient from "./WebsocketAdminRepository";

function AdminLogin() {
    const { setIsLoggedIn } = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSocketReady, setIsSocketReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // New state for loading
    const navigate = useNavigate();

    // WebSocket connection setup using WebSocketAdminClient
    const socketRef = useRef(null);  // <-- useRef to hold the socket reference

    useEffect(() => {
        // Initialize the WebSocket connection using your custom WebSocketAdminClient
        socketRef.current = new WebSocketAdminClient();

        socketRef.current.onopen = () => {
            setIsSocketReady(true);
            setIsLoading(false); // Stop loading once connected
            console.log("WebSocket is connected.");
        };

        socketRef.current.onmessage = (e) => {
            const response = JSON.parse(e.data.replace("[Login_Admin_Response]", "").trim());

            // Handle the login responses
            switch (response.status) {
                case "Success":
                    localStorage.setItem("userToken", response.token);
                    localStorage.setItem("userEmail", email);
                    localStorage.setItem("userRole", response.adminLevel);
                    setIsLoggedIn(true);
                    setSuccessMessage("Login successful!");
                    setTimeout(() => {
                        navigate("/admin-pannel");
                    }, 500);
                    break;
                case "Not_Found":
                    setErrorMessage("Admin account not found.");
                    break;
                case "Account_Suspended":
                    setErrorMessage("Your account has been suspended.");
                    break;
                case "Invalid_Password":
                    setErrorMessage("Invalid password.");
                    break;
                default:
                    setErrorMessage("Something went wrong, please try again.");
                    break;
            }
        };

        socketRef.current.onerror = (error) => {
            console.error("WebSocket error:", error);
            setErrorMessage("WebSocket connection error.");
        };

        socketRef.current.onclose = () => {
            setIsSocketReady(false);
            setIsLoading(false); // Stop loading when WebSocket closes
            console.log("WebSocket connection closed.");
        };

        return () => {
            socketRef.current.close();
        };
    }, [email]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        // Validate if fields are empty
        if (!email || !password) {
            setErrorMessage("Email and password cannot be empty.");
            return;
        }

        // Validate if email ends with @gmail.com
        if (!email.endsWith("@gmail.com")) {
            setErrorMessage("Only @gmail.com emails are allowed.");
            return;
        }

        // Send login request via WebSocket if the connection is ready
        if (isSocketReady) {
            setIsLoading(true); // Start loading when the request is sent
            const loginPayload = JSON.stringify({ email, password });
            socketRef.current.send(`[Login_Admin]${loginPayload}`);
        } else {
            setErrorMessage("WebSocket connection is not established.");
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] flex items-center justify-center bg-gray-100 text-black">
            <div className="relative w-96 p-8 bg-white shadow-lg rounded-lg">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h2 className="text-3xl font-semibold text-center text-gray-700 mb-6">Admin Login</h2>
                </motion.div>

                {/* Success message */}
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-green-500 text-center mb-4"
                    >
                        {successMessage}
                    </motion.div>
                )}

                {/* Error message */}
                {errorMessage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-red-500 text-center mb-4"
                    >
                        {errorMessage}
                    </motion.div>
                )}

                {/* Loading message */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-blue-500 text-center mb-4"
                    >
                        Connecting...
                    </motion.div>
                )}

                <motion.form initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
                    <div>
                        <label className="block text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            placeholder="admin@gmail.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        type="submit" // Ensure it's of type submit
                        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
                    >
                        Login
                    </button>
                </motion.form>
            </div>
        </div>
    );
}

export default AdminLogin;
