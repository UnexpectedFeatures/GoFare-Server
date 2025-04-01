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
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setModData({ ...modData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(""); // Clear previous errors

        // Check if the email ends with @gmail.com
        if (!modData.email.endsWith("@gmail.com")) {
            setErrorMessage("Only @gmail.com emails are allowed.");
            window.scrollTo(0, 0); // Scroll to the top of the page
            return;
        }

        if (!/^09\d{9}$/.test(modData.phone)) {
            setErrorMessage("Phone number must start with 09 and be 11 digits long.");
            window.scrollTo(0, 0); // Scroll to the top of the page
            return;
        }

        // Password validation (at least 8 characters, contains letters, numbers, and symbols)
        const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordPattern.test(modData.password)) {
            setErrorMessage("Password must be at least 8 characters long and contain letters, numbers, and symbols.");
            window.scrollTo(0, 0); // Scroll to the top of the page
            return;
        }

        console.log("🔹 Data being sent:", JSON.stringify(modData, null, 2));

        try {
            const response = await fetch("http://localhost:5000/api/admin/create-mod", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(modData),
            });

            const result = await response.json();
            console.log("🔹 Server Response:", result);

            if (response.ok) {
                alert("Moderator account created successfully!");
                
                // Clear form fields by resetting state
                setModData({
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
            } else {
                setErrorMessage(result.message || "Failed to create moderator.");
                window.scrollTo(0, 0); // Scroll to the top of the page
            }
        } catch (error) {
            console.error("🔹 Error:", error);
            setErrorMessage("Server error. Please try again later.");
            window.scrollTo(0, 0); // Scroll to the top of the page
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 pt-20 pb-20">
            <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-xl font-bold mb-4 text-center">Create Moderator Account</h1>

                {errorMessage && (
                    <p className="text-red-500 text-center mb-4">{errorMessage}</p>
                )}

                <form onSubmit={handleSubmit} autoComplete="off">
                    <label className="block mb-2">
                        Username:
                        <input
                            type="text"
                            name="username"
                            value={modData.username}
                            onChange={handleChange}
                            required
                            autoComplete="off"
                            className="w-full p-2 border rounded"
                        />
                    </label>

                    <label className="block mb-2">
                        Email:
                        <input
                            type="email"
                            name="email"
                            value={modData.email}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded"
                        />
                    </label>

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

                    <label className="block mb-2 relative">
                        Password:
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={modData.password}
                                onChange={handleChange}
                                required
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
