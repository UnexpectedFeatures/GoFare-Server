import { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isResetSuccessful, setIsResetSuccessful] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
  
    try {
      const res = await axios.patch(
        `http://localhost:5000/api/auth/reset-password/${token}`,
        { newPassword },
        { headers: { "Content-Type": "application/json" } }
      );
  
      setMessage(res.data.message);
      setIsResetSuccessful(true); // Prevents further edits
    } catch (error) {
      console.error("Error resetting password:", error.response || error); 
      setMessage(error.response?.data?.message || "Something went wrong");
    }
  };
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        {isResetSuccessful ? (
          <div className="text-green-600 text-center">
            <h2 className="text-xl font-bold mb-4">Password Reset Successful</h2>
            <p>You can now log in with your new password.</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">Reset Password</h2>
            {message && <p className="text-green-600 mb-2">{message}</p>}
            <form onSubmit={handleSubmit}>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border rounded mb-4"
                required
              />
              <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
                Reset Password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;