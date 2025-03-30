import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function CreateMod() {
    const [modData, setModData] = useState({
        username: "",
        email: "",
        password: "",
        phone: "",
        gender: "Male",
        birthday: "",
        address: "",
        role: "moderator",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setModData({ ...modData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log("🔹 Data being sent:", JSON.stringify(modData, null, 2)); // ✅ Log request payload

        try {
            const response = await fetch("http://localhost:5000/api/admin/create-mod", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(modData),
            });

            const result = await response.json();
            console.log("🔹 Server Response:", result); // ✅ Log what the backend returns

            if (response.ok) {
                alert("Moderator account created successfully!");
            } else {
                alert(result.message || "Failed to create moderator.");
            }
        } catch (error) {
            console.error("🔹 Error:", error);
            alert("Error creating moderator.");
        }
    };

    
    

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 pt-20 pb-20">
           <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-xl font-bold mb-4 text-center">Create Moderator Account</h1>
                <form onSubmit={handleSubmit} autoComplete="off">
                    {/* Username */}
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
                    
                    {/* Email */}
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
                    
                    {/* Phone */}
                    <label className="block mb-2">
                        Phone:
                        <input 
                            type="tel"
                            name="phone"
                            value={modData.phone}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded"
                        />
                    </label>
                    
                    {/* Gender */}
                    <label className="block mb-2">
                        Gender:
                        <select 
                            name="gender"
                            value={modData.gender}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded"
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </label>
                    
                    {/* Birthday */}
                    <label className="block mb-2">
                        Birthday:
                        <input 
                            type="date"
                            name="birthday"
                            value={modData.birthday}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded"
                        />
                    </label>
                    
                    {/* Address */}
                    <label className="block mb-2">
                        Address:
                        <textarea 
                            name="address"
                            value={modData.address}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded"
                        />
                    </label>
                    
                    {/* Password */}
                    <label className="block mb-2 relative">
                        Password:
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={modData.password}
                                onChange={handleChange}
                                required
                                autoComplete="new-password"
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
                    
                    {/* Submit Button */}
                    <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                        Create Moderator
                    </button>
                </form>
            </div>
        </div>
    );
}
