import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import axios from "axios"; // Make sure axios is imported

function UserPanel() {
    const [activeSection, setActiveSection] = useState("home");
    const [phoneError, setPhoneError] = useState(""); // To handle phone validation errors

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

    // New: Define handleChange function to update state
    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser((prevUser) => ({
        ...prevUser,
        [name]: value,
        }));
    };

    useEffect(() => {
        const fetchUser = async () => {
        try {
            // Make sure your endpoint is correct
            const email = localStorage.getItem("userEmail");
            const response = await axios.get(
            `http://localhost:5000/api/auth/users/info/${email}`
            );
            console.log(email);
            console.log("Fetched user from API:", response.data);

            const fetchedUser = response.data;
            setUser({
            username: fetchedUser.username || "",
            role: fetchedUser.role || "",
            email: fetchedUser.email || "",
            // Use the API field 'last_login'; if it doesn't exist, fallback to "Never"
            lastLogin: fetchedUser.last_login || "Never",
            phone: fetchedUser.phone || "",
            birthday: fetchedUser.birthday || "",
            gender: fetchedUser.gender || "",
            // Map the database field 'home_address' to 'address'
            address: fetchedUser.home_address || "",
            });
        } catch (error) {
            console.error("Error fetching user:", error);
        }
        };

        fetchUser();
    }, []);

    const validatePhone = (phone) => {
        // Phone format is fixed: 09xxxxxxxxx
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
        // Use error.response, not res
        console.error("Error updating profile:", error.response ? error.response.data : error.message);
        alert("Failed to update profile.");
        }
    };
  

    return (
        <div className="min-h-screen p-6 bg-gray-100">
            <div className="flex max-w-6xl mx-auto">
                {/* Sidebar */}
                <div className="w-1/4 bg-white shadow-lg rounded-lg p-6 mr-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">User Panel</h1>
                <div>
                    <button
                    className={`w-full text-left py-2 px-4 mb-2 rounded ${
                        activeSection === "home" ? "bg-gray-200" : "bg-gray-100"
                    }`}
                    onClick={() => setActiveSection("home")}
                    >
                    Home
                    </button>
                    <button
                    className={`w-full text-left py-2 px-4 mb-2 rounded ${
                        activeSection === "personalInfo" ? "bg-gray-200" : "bg-gray-100"
                    }`}
                    onClick={() => setActiveSection("personalInfo")}
                    >
                    Personal Info
                    </button>
                </div>
                </div>

                {/* Main Content */}
                <div className="w-3/4 bg-white shadow-lg rounded-lg p-6">
                {/* Render active section */}
                {activeSection === "home" && (
                    <div>
                    <h2 className="text-xl font-semibold">Home</h2>
                    <p>
                        <strong>Username:</strong> {user.username}
                    </p>
                    <p>
                        <strong>Role:</strong> {user.role}
                    </p>
                    <p>
                        <strong>Email:</strong> {user.email}
                    </p>
                    <p>
                        <strong>Last Login:</strong> {user.lastLogin}
                    </p>
                    </div>
                )}

                {activeSection === "personalInfo" && (
                    <div>
                    <h2 className="text-xl font-semibold">Personal Info</h2>
                    <div>
                        <h3 className="text-lg font-semibold">Basic Info</h3>
                        <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Profile Picture
                        </label>
                        <button className="text-blue-500">
                            Add a profile picture
                        </button>
                        </div>
                        <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Name
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={user.username}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                        />
                        </div>
                        <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Birthday
                        </label>
                        <input
                            type="date"
                            name="birthday"
                            value={user.birthday}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                        />
                        </div>
                        <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Gender
                        </label>
                        <select
                            name="gender"
                            value={user.gender}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                        >
                            <option value="Not provided">Not provided</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                        </div>

                        <h3 className="text-lg font-semibold">Contact Info</h3>
                        <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Phone
                        </label>
                        <input
                            type="text"
                            name="phone"
                            value={user.phone}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                            placeholder="09-xxxxxxxxx"
                        />
                        {phoneError && (
                            <p className="text-red-500 text-sm">{phoneError}</p>
                        )}
                        </div>

                        <h3 className="text-lg font-semibold">Addresses</h3>
                        <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Home Address
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={user.address}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                        />
                        </div>

                        <button
                        onClick={handleSaveChanges}
                        className="bg-blue-500 text-white py-2 px-4 rounded"
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
