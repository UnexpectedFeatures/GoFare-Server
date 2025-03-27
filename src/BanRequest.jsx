import { useState } from "react";
import axios from "axios";

function BanRequest() {
    const [email, setEmail] = useState(""); // Add email state
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validate email format (simple check)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            setError("Please provide a valid email address.");
            return;
        }

        try {
            const response = await axios.post("http://localhost:5000/api/banRequest/ban-request", { email, message });
            setSuccess("Your request has been submitted successfully.");
        } catch (error) {
            setError("Failed to submit your request. Please try again later.");
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] flex items-center justify-center bg-gray-100">
            <div className="relative w-96 p-8 bg-white shadow-lg rounded-lg">
                <h2 className="text-3xl font-semibold text-center text-gray-700 mb-6">Request to Unban</h2>
                <form onSubmit={handleRequestSubmit} className="space-y-4">
                    {/* Email Input */}
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    
                    {/* Message Textarea */}
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please describe why you believe you should be unbanned."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        rows="4"
                        required
                    ></textarea>

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
                    >
                        Submit Request
                    </button>
                </form>

                {/* Error or Success Message */}
                {error && <div className="text-red-500 mt-4">{error}</div>}
                {success && <div className="text-green-500 mt-4">{success}</div>}
            </div>
        </div>
    );
}

export default BanRequest;
