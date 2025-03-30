import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";
import { useTheme } from "./ThemeContext";

function UserPanel() {
    const { darkMode } = useTheme();
    console.log("Dark Mode:", darkMode);
    
    const [activeSection, setActiveSection] = useState("home");
    const [phoneError, setPhoneError] = useState("");

    const [user, setUser] = useState({
        username: "",
        role: "",   
        email: "",
        lastLogin: "Never",
        phone: "",
        birthday: "",
        gender: "",
        address: "",
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const email = localStorage.getItem("userEmail");
                const response = await axios.get(
                    `http://localhost:5000/api/auth/users/info/${email}`
                );
                console.log("Fetched user from API:", response.data);

                const fetchedUser = response.data;
                setUser({
                    username: fetchedUser.username || "",
                    role: fetchedUser.role || "",
                    email: fetchedUser.email || "",
                    lastLogin: fetchedUser.last_login || "Never",
                    phone: fetchedUser.phone || "",
                    birthday: fetchedUser.birthday || "",
                    gender: fetchedUser.gender || "",
                    address: fetchedUser.home_address || "",
                });
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        };

        fetchUser();
    }, []);

    const validatePhone = (phone) => {
        const phoneRegex = /^09\d{9}$/;
        if (!phoneRegex.test(phone)) {
            setPhoneError("Phone number must be in the format 09xxxxxxxxx");
            return false;
        }
        setPhoneError("");
        return true;
    };

    const handleSaveChanges = async () => {
        if (!validatePhone(user.phone)) {
            return;
        }
    
        console.log("Sending data:", user);
    
        try {
            const response = await axios.patch(
                `http://localhost:5000/api/auth/updateUser/${user.email}`,
                {
                    username: user.username,
                    phone: user.phone,
                    birthday: user.birthday,
                    gender: user.gender,
                    home_address: user.address,
                }
            );
    
            if (response.status === 200) {
                alert("Profile updated successfully!");
            }
        } catch (error) {
            console.error("Error updating profile:", error.response ? error.response.data : error.message);
            alert("Failed to update profile.");
        }
    };
  
    return (
        <div className="min-h-screen p-6">
            <div className="flex max-w-6xl mx-auto">
                {/* Sidebar */}
                <div className={`w-1/4 shadow-lg h-[200px] rounded-lg p-6 mr-6 transition-all ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-700"} `}>
                    <h1 className="text-2xl font-bold mb-6">User Panel</h1>
                    <div>
                        <button
                            className={`w-full text-left py-2 px-4 mb-2 rounded transition-all 
                                ${activeSection === "home" ? (darkMode ? "bg-gray-300 text-black" : "bg-gray-600 text-white") : (darkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700")}
                            `}
                            onClick={() => setActiveSection("home")}
                        >
                            Home
                        </button>
                        <button
                            className={`w-full text-left py-2 px-4 mb-2 rounded transition-all
                                ${activeSection === "personalInfo" ? (darkMode ? "bg-gray-300 text-black" : "bg-gray-600 text-white") : (darkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700")}
                            `}
                            onClick={() => setActiveSection("personalInfo")}
                        >
                            Personal Info
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className={`w-3/4 shadow-lg rounded-lg px-6 pt-6 pb-5 transition-all ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
                {/* Render active section */}
                    {activeSection === "home" && (
                        <div>
                            <h2 className="text-xl font-semibold">Home</h2>
                            <p><strong>Username:</strong> {user.username}</p>
                            <p><strong>Role:</strong> {user.role}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Last Login:</strong> {user.lastLogin}</p>
                        </div>
                    )}

                    {activeSection === "personalInfo" && (
                        <div>
                            <h2 className="text-xl font-semibold">Personal Info</h2>
                            <div>
                                <h3 className="text-lg font-semibold">Basic Info</h3>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium">Profile Picture</label>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium">Name</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={user.username}
                                        onChange={(e) => setUser({ ...user, username: e.target.value })}
                                        className={`w-full border p-2 rounded ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100"}`}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium">Birthday</label>
                                    <input
                                        type="date"
                                        name="birthday"
                                        value={user.birthday}
                                        onChange={(e) => setUser({ ...user, birthday: e.target.value })}
                                        className={`w-full border p-2 rounded ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100"}`}
                                    />
                                </div>

                                <h3 className="text-lg font-semibold">Contact Info</h3>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium">Phone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={user.phone}
                                        onChange={(e) => setUser({ ...user, phone: e.target.value })}
                                        className={`w-full border p-2 rounded ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100"}`}
                                        placeholder="09xxxxxxxxx"
                                    />
                                    {phoneError && <p className="text-red-500 text-sm">{phoneError}</p>}
                                </div>

                                <h3 className="text-lg font-semibold">Address</h3>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium">Home Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={user.address}
                                        onChange={(e) => setUser({ ...user, address: e.target.value })}
                                        className={`w-full border p-2 rounded ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100"}`}
                                    />
                                </div>

                                <button
                                    onClick={handleSaveChanges}
                                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserPanel;
