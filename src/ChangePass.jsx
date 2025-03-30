import React, { useState } from "react";
import axios from "axios";
import { useTheme } from "./ThemeContext";

function ChangePass() {
    const { darkMode } = useTheme();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!oldPassword || !newPassword || !confirmPassword) {
            setErrorMessage("All fields are required.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage("New password and confirm password must match.");
            return;
        }

        try {
            const email = localStorage.getItem("userEmail"); // Get logged-in user's email
            const response = await axios.patch(
                `http://localhost:5000/api/auth/change-pass/${email}`,
                {
                    oldPassword,
                    newPassword
                }
            );

            if (response.status === 200) {
                setSuccessMessage("Password changed successfully!");
                setErrorMessage("");
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
            }
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Failed to change password."
            );
            setSuccessMessage("");
        }
    };

    return (
        <div className={`max-w-md mx-auto p-6 rounded-lg shadow-md mb-30 ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-700"}`}>
            <h2 className="text-3xl font-semibold text-center mb-6">Change Password</h2>

            {errorMessage && <p className="text-red-500 text-center">{errorMessage}</p>}
            {successMessage && <p className="text-green-500 text-center">{successMessage}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Old Password</label>
                    <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full px-4 py-2 border rounded-md"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium">New Password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border rounded-md"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Confirm New Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border rounded-md"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                >
                    Change Password
                </button>
            </form>
        </div>
    );
}

export default ChangePass;
