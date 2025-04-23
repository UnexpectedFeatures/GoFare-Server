import React, { useEffect, useState } from "react";
import axios from "axios";

function UserList() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const role = localStorage.getItem("userRole")?.toLowerCase();
                const response = await axios.get(`http://localhost:5000/api/auth/users/${role}`);
                setUsers(response.data);
                setFilteredUsers(response.data); // Initially, show all users
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredUsers(users); // Show all users if searchTerm is empty
        } else {
            const filtered = users.filter(user => {
                return (
                    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
                );
            });
            setFilteredUsers(filtered); // Apply filtering
        }
    }, [users, searchTerm]);

    const handleRetrieve = async (userEmail) => {
        
    }
    const handleDelete = async (userEmail) => {
        try {
            await axios.delete(`http://localhost:5000/api/auth/users/delete/${userEmail}`);
            setUsers(users.filter(user => user.email !== userEmail));
            setFilteredUsers(filteredUsers.filter(user => user.email !== userEmail)); // Update filtered users
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-6xl w-full">
                <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                    Admin Panel - User Management
                </h1>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by email or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} // This will trigger search as the user types
                        className="p-2 w-full border border-gray-300 rounded"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="py-2 px-4 border">ID</th>
                                <th className="py-2 px-4 border">First Name</th>
                                <th className="py-2 px-4 border">Middle Name</th>
                                <th className="py-2 px-4 border">Last Name</th>
                                <th className="py-2 px-4 border">Email</th>
                                <th className="py-2 px-4 border">Birthday</th>
                                <th className="py-2 px-4 border">Age</th>
                                <th className="py-2 px-4 border">Gender</th>
                                <th className="py-2 px-4 border">Contact</th>
                                <th className="py-2 px-4 border">Created At</th>
                                <th className="py-2 px-4 border">Updated At</th>
                                <th className="py-2 px-4 border">Status</th>
                                <th className="py-2 px-4 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user, index) => (
                                <tr key={user.id || user.email || index} className="border-t">
                                    <td className="py-2 px-4 border">{user.id}</td>
                                    <td className="py-2 px-4 border">{user.firstName}</td>
                                    <td className="py-2 px-4 border">{user.middleName}</td>
                                    <td className="py-2 px-4 border">{user.lastName}</td>
                                    <td className="py-2 px-4 border">{user.email}</td>
                                    <td className="py-2 px-4 border">{user.birthday}</td>
                                    <td className="py-2 px-4 border">{user.age}</td>
                                    <td className="py-2 px-4 border">{user.gender}</td>
                                    <td className="py-2 px-4 border">{user.contactNumber}</td>
                                    <td className="py-2 px-4 border">{user.createdAt}</td>
                                    <td className="py-2 px-4 border">{user.updatedAt}</td>
                                    <td className="py-2 px-4 border">{user.status}</td>
                                    <td className="py-2 px-4 border">
                                        <div className="flex flex-row gap-1.5">
                                            <button className="px-4 py-1 rounded bg-yellow-500 text-white" onClick={() => handleDelete(user.email)}>
                                                Delete
                                            </button>
                                            <button className="px-4 py-1 rounded bg-green-500 text-white" onClick={() => handleRetrieve(user.email)}>
                                                Retrieve
                                            </button>
                                        </div>
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

export default UserList;
