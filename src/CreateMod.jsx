import { useState } from "react";
import { Eye, EyeOff } from "lucide-react"; // Icons for show/hide

export default function CreateMod() {
    const [modData, setModData] = useState({
        username: "",
        email: "",
        password: ""
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setModData({ ...modData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:5000/api/auth/create-mod", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(modData),
            });

            if (response.ok) {
                alert("Moderator account created successfully!");
                setModData({ username: "", email: "", password: "" });
            } else {
                const errorData = await response.json();
                alert(errorData.message || "Failed to create moderator.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error creating moderator.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-xl font-bold mb-4 text-center">Create Moderator Account</h1>
                <form onSubmit={handleSubmit} autoComplete="off">
                    {/* Username Input */}
                    <label className="block mb-2">
                        Username:
                        <input 
                            type="text"
                            name="username"
                            value={modData.username}
                            onChange={handleChange}
                            required
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                            className="w-full p-2 border rounded"
                        />
                    </label>

                    {/* Email Input */}
                    <label className="block mb-2">
                        Email:
                        <input 
                            type="email"
                            name="email"
                            value={modData.email}
                            onChange={handleChange}
                            required
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                            className="w-full p-2 border rounded"
                        />
                    </label>

                    {/* Password Input with Show/Hide Toggle */}
                    <label className="block mb-2 relative">
                        Password:
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={modData.password}
                                onChange={handleChange}
                                required
                                autoComplete="new-password" // Prevents autofill
                                autoCorrect="off"
                                spellCheck="false"
                                className="w-full p-2 border rounded pr-10"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-2 flex items-center text-gray-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </label>

                    <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                        Create Moderator
                    </button>
                </form>
            </div>
        </div>
    );
}
