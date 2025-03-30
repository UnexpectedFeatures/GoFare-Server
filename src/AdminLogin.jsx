import { useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { AuthContext } from "./AuthContext";

function AdminLogin() {
    const { setIsLoggedIn } = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");
        try {
            const res = await axios.post("http://localhost:5000/api/admin/adminLogin", { email, password });
            console.log("Response:", res.data);

            if (res.data.token) {
                if (res.data.status === "banned") {
                    setErrorMessage("Your account has been banned.");
                    return;
                }
                
                if (res.data.role.toLowerCase() === "admin" || res.data.role.toLowerCase() === "moderator") {
                    setSuccessMessage("Login successful!");
                    localStorage.setItem("userToken", res.data.token);
                    localStorage.setItem("userEmail", email);
                    localStorage.setItem("userRole", res.data.role.toLowerCase());
                    localStorage.setItem("username", res.data.username);
                    localStorage.setItem("lastLogin", res.data.lastLogin);
                    
                    setIsLoggedIn(true);
                    setTimeout(() => {
                        navigate("/admin-pannel");
                    }, 500); // Delay to allow success message to be shown
                } else {
                    setErrorMessage("Admin authorization only!");
                }
            }
        } catch (error) {
            console.error("Error:", error.response?.data);
            setErrorMessage(error.response?.data?.message || "Something went wrong");
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

                <motion.form initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
                    <div>
                        <label className="block text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            placeholder="admin@example.com"
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
