import { useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { AuthContext } from "./AuthContext";  // ✅ Import AuthContext

function Login() {
    const { setIsLoggedIn } = useContext(AuthContext); // ✅ Use AuthContext
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState(""); // Added errorMessage state
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(""); 
        try {
            const endpoint = isLogin ? "login" : "register";
            const payload = isLogin ? { email, password } : { username, email, password };
    
            const res = await axios.post(`http://localhost:5000/api/auth/${endpoint}`, payload);
    
            console.log("Response:", res.data); 
    
            if (res.data.token) {
                if (res.data.status === "banned") {
                    alert("Your account has been banned.");
                    return;
                }
    
                alert(isLogin ? "Login successful!" : "Signup successful!");
                localStorage.setItem("userToken", res.data.token);
                localStorage.setItem("userEmail", email);
                localStorage.setItem("userRole", res.data.role);
                localStorage.setItem("username", res.data.username);
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
            alert("Error: " + (error.response?.data?.message || "Something went wrong"));
        }
    };
    
    

    return (
        <div className="h-[calc(100vh-100px)] flex items-center justify-center bg-gray-100">
            <div className="relative w-96 p-8 bg-white shadow-lg rounded-lg">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h2 className="text-3xl font-semibold text-center text-gray-700 mb-6">
                        {isLogin ? "Login" : "Sign Up"}
                    </h2>
                </motion.div>

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
                        {isLogin ? "Login" : "Sign Up"}
                    </button>
                </motion.form>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="text-center mt-4 text-gray-600">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
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
