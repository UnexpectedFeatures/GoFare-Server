import React, { useEffect, useState } from "react";
import axios from "axios";

function AccountAppeal() {
    const [banRequests, setBanRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const roles = localStorage.getItem("userRole");
    // Fetch users list from the backend
    const fetchUsers = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/auth/users/${roles}`); // Endpoint for users
            setUsers(response.data);  // Store users in state
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    // Fetch ban requests from the backend
    const fetchBanRequests = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/banRequest/allBanRequests");
            console.log("Fetched ban requests from API:", response.data);

            // Filter out the requests older than 30 days
            const filteredRequests = response.data.filter(request => !isOlderThan30Days(request.created_at));

            // Check if user exists before keeping the ban request
            const validRequests = filteredRequests.filter(request => {
                return users.some(user => user.email === request.email); // Check if user exists
            });

            setBanRequests(validRequests); // Update the state with valid requests
        } catch (error) {
            console.error("Error fetching ban requests:", error);
        }
    };

    useEffect(() => {
        fetchUsers();  // Fetch users when component mounts
    }, []);

    useEffect(() => {
        if (users.length > 0) {
            fetchBanRequests();  // Fetch ban requests after users are loaded
        }
    }, [users]); // Re-fetch ban requests when users data changes

    const handleApprove = async (email) => {
        try {
            const response = await axios.post(`http://localhost:5000/api/auth/users/unban/${email}`);
            
            if (response.status === 200) {
                setBanRequests(banRequests.filter(request => request.email !== email));
                alert(`User with email ${email} has been unbanned.`);
            }
        } catch (error) {
            console.error("Error unbanning user:", error);
            alert("Error unbanning the user.");
        }
    };

    const handleDelete = async (email) => {
        try {
            const response = await axios.delete(`http://localhost:5000/api/banRequest/delete/${email}`);
            if (response.status === 200) {
                setBanRequests(banRequests.filter(request => request.email !== email));
                alert(`Ban request from ${email} has been deleted.`);
            }
        } catch (error) {
            console.error("Error deleting ban request:", error);
            alert("Error deleting the ban request.");
        }
    };

    const isOlderThan30Days = (date) => {
        const requestDate = new Date(date);
        const currentDate = new Date();
        const diffTime = currentDate - requestDate;
        const diffDays = diffTime / (1000 * 3600 * 24); // Convert milliseconds to days
        return diffDays > 30;
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-6xl w-full">
                <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                    Ban Request List
                </h1>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="py-2 px-4 border">Email</th>
                                <th className="py-2 px-4 border">Message</th>
                                <th className="py-2 px-4 border">Requested At</th>
                                <th className="py-2 px-4 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {banRequests.map((request, index) => (
                                <tr key={request.email || index} className="border-t">
                                    <td className="py-2 px-4 border">{request.email}</td>
                                    <td className="py-2 px-4 border">{request.message}</td>
                                    <td className="py-2 px-4 border">{new Date(request.created_at).toLocaleString()}</td>
                                    <td className="py-2 px-4 border flex justify-center space-x-2">
                                        <button
                                            className="px-4 py-1 rounded cursor-pointer bg-green-500 text-white"
                                            onClick={() => handleApprove(request.email)}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            className="px-4 py-1 rounded cursor-pointer bg-red-500 text-white"
                                            onClick={() => handleDelete(request.email)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AccountAppeal;
