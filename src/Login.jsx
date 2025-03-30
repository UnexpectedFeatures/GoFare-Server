import { useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react"; // Icons for show/hide
import { AuthContext } from "./AuthContext";  

function Login() {
    const { setIsLoggedIn } = useContext(AuthContext);
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false); // Toggle state for password visibility
    const [errorMessage, setErrorMessage] = useState(""); 
    const navigate = useNavigate();

    const validateEmail = (email) => {
        // Basic email format check
        const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!emailRegex.test(email)) {
            return "Only Gmail addresses (@gmail.com) are allowed.";
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        
        if (!isLogin) {
            const emailError = validateEmail(email);
            if (emailError) {
                setErrorMessage(emailError);
                return;
            }

            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
            if (!passwordRegex.test(password)) {
                setErrorMessage("Password must be 8-16 characters long and include at least one letter and one number.");
                return;
            }
        }
    
        try {
            const endpoint = isLogin ? "login" : "register";
            const payload = isLogin ? { email, password } : { username, email, password };
    
            const res = await axios.post(`http://localhost:5000/api/auth/${endpoint}`, payload);
    
            console.log("Response:", res.data);
    
            if (res.data.token) {
                if (res.data.status === "banned") {
                    navigate("/ban-request");
                    return;
                }
    
                localStorage.setItem("userToken", res.data.token);
                localStorage.setItem("userEmail", email);
                localStorage.setItem("userRole", res.data.role);
                localStorage.setItem("userName", username);
                localStorage.setItem("userPhone", res.data.phone);
                localStorage.setItem("userBirthday", res.data.birthday);
                localStorage.setItem("userGender", res.data.gender);
                localStorage.setItem("userHomeAddress", res.data.home_address);
                localStorage.setItem("lastLogin", res.data.lastLogin);
    
                setIsLoggedIn(true);
                navigate("/user-pannel");
            }
        } catch (error) {
            console.error("Error:", error.response?.data);
            setErrorMessage(error.response?.data?.message || "Something went wrong");
        }
    };
    
    useEffect(() => {
        setErrorMessage(""); // Clear error when switching between login and signup
    }, [isLogin]);
    
    return (
        <div className="h-[calc(100vh-100px)] flex items-center justify-center bg-gray-100">
            <div className="relative w-96 p-8 bg-white shadow-lg rounded-lg">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h2 className="text-3xl font-semibold text-center text-gray-700 mb-6">
                        {isLogin ? "Login" : "Sign Up"}
                    </h2>
                </motion.div>

                <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
                    {!isLogin && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <label className="block text-gray-700">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your username"
                                required
                            />
                        </motion.div>
                    )}

                    <div>
                        <label className="block text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-gray-700">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 pr-10"
                                placeholder="Enter your password"
                                required
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-2 flex items-center text-gray-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

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
                    {isLogin && (
                        <div className="text-center mt-2">
                            <button 
                                type="button"
                                className="text-blue-500 text-sm underline hover:text-blue-700 transition"
                                onClick={() => navigate("/forgot-password")}
                            >
                                Forgot password?
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
                    >
                        {isLogin ? "Login" : "Sign Up"}
                    </button>
                </motion.form>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="text-center mt-4 text-gray-600">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setErrorMessage("");  // Clear error when switching modes
                        }}
                        className="text-blue-500 ml-1 underline hover:text-blue-700 transition"
                    >
                        {isLogin ? "Sign Up" : "Login"}
                    </button>

                </motion.div>
            </div>
        </div>
    );
}

export default Login;
