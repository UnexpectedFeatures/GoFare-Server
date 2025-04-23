import React, { useEffect, useState } from "react";
import axios from "axios";

function UserList() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState(""); // 'edit' or 'register'
    const [formData, setFormData] = useState({
        email: "",
        firstName: "",
        middleName: "",
        lastName: ""
    });
    const [newAdminData, setNewAdminData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        role: "user",
        birthday: "",
        age: "",
        gender: "",
        contactNumber: "",
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);

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

    const handleBan = async (userEmail, isBanned) => {
        try {
            const endpoint = isBanned
                ? `http://localhost:5000/api/auth/users/unban/${userEmail}`
                : `http://localhost:5000/api/auth/users/ban/${userEmail}`;
            await axios.post(endpoint);
            setUsers(users.map(user =>
                user.email === userEmail ? { ...user, status: isBanned ? "active" : "banned" } : user
            ));
        } catch (error) {
            console.error("Error banning/unbanning user:", error);
        }
    };

    const handleDelete = async (userEmail) => {
        try {
            await axios.delete(`http://localhost:5000/api/auth/users/delete/${userEmail}`);
            setUsers(users.filter(user => user.email !== userEmail));
            setFilteredUsers(filteredUsers.filter(user => user.email !== userEmail)); // Update filtered users
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const handleEdit = (userEmail) => {
        const user = users.find(user => user.email === userEmail);
        setSelectedUser(user);
        setFormData({
            email: user.email,
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName
        });
        setModalType("edit"); // Set the modal type to 'edit'
        setIsModalOpen(true);
    };

    const handleRegister = () => {
        setModalType("register"); // Set the modal type to 'register'
        setIsModalOpen(true); // Open the register modal
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNewAdminChange = (e) => {
        const { name, value } = e.target;
        setNewAdminData(prev => ({ ...prev, [name]: value }));
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({ email: "", firstName: "", middleName: "", lastName: "" });
        setNewAdminData({ firstName: "", middleName: "", lastName: "", email: "", role: "user", age: "", birthday: "", gender: "", contactNumber: "" });
    };

    const handleSave = async () => {
        try {
            await axios.put(`http://localhost:5000/api/auth/users/update/${formData.email}`, formData);
            setUsers(users.map(user =>
                user.email === formData.email ? { ...user, ...formData } : user
            ));
            setFilteredUsers(filteredUsers.map(user =>
                user.email === formData.email ? { ...user, ...formData } : user
            ));
            handleCloseModal();
        } catch (error) {
            console.error("Error updating user:", error);
        }
    };

    const handleRegisterAdmin = async () => {
        try {
            await axios.post("http://localhost:5000/api/auth/users/register", newAdminData);
            setUsers(prev => [...prev, newAdminData]);
            setFilteredUsers(prev => [...prev, newAdminData]); // Add new admin to filtered list
            handleCloseModal();
        } catch (error) {
            console.error("Error registering admin:", error);
        }
    };

    // Input validation for numeric fields
    const handleAgeInput = (e) => {
        const { value } = e.target;
        if (/^\d{0,3}$/.test(value)) {
            setNewAdminData(prev => ({ ...prev, age: value }));
        }
    };

    const handleContactInput = (e) => {
        const { value } = e.target;
        if (/^\d{0,11}$/.test(value)) { 
            setNewAdminData(prev => ({ ...prev, contactNumber: value }));  
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
                                            <button className="px-4 py-1 rounded bg-red-500 text-white" onClick={() => handleBan(user.email, user.status === "banned")}>
                                                {user.status === "banned" ? "Unban" : "Ban"}
                                            </button>
                                            <button className="px-4 py-1 rounded bg-blue-500 text-white" onClick={() => handleEdit(user.email)}>
                                                Edit
                                            </button>
                                            <button className="px-4 py-1 rounded bg-yellow-500 text-white" onClick={() => handleDelete(user.email)}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 text-center">
                    <div className="inline-flex space-x-4">
                        <button
                            className="px-6 py-2 rounded bg-purple-500 text-white"
                            onClick={handleRegister}
                        >
                            Register New User
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal - Register/Edit User */}
            {isModalOpen && (
                <div className="fixed inset-0 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-xl font-semibold mb-4">
                            {modalType === "edit" ? "Edit User" : "Register New User"}
                        </h2>
                        <div className="space-y-4">
                            {modalType === "edit" ? (
                                <>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        placeholder="First Name"
                                    />
                                    <input
                                        type="text"
                                        name="middleName"
                                        value={formData.middleName}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        placeholder="Middle Name"
                                    />
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        placeholder="Last Name"
                                    />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        readOnly
                                        className="w-full p-2 border border-gray-300 rounded"
                                        placeholder="Email"
                                    />
                                </>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={newAdminData.firstName}
                                        onChange={handleNewAdminChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        placeholder="First Name"
                                    />
                                    <input
                                        type="text"
                                        name="middleName"
                                        value={newAdminData.middleName}
                                        onChange={handleNewAdminChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        placeholder="Middle Name"
                                    />
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={newAdminData.lastName}
                                        onChange={handleNewAdminChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        placeholder="Last Name"
                                    />
                                    <input
                                        type="email"
                                        name="email"
                                        value={newAdminData.email}
                                        onChange={handleNewAdminChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        placeholder="Email"
                                    />
                                </>
                            )}
                        </div>
                        <div className="flex justify-end space-x-4 mt-4">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 bg-gray-500 text-white rounded"
                            >
                                Close
                            </button>
                            <button
                                onClick={modalType === "edit" ? handleSave : handleRegisterAdmin}
                                className="px-4 py-2 bg-purple-500 text-white rounded"
                            >
                                {modalType === "edit" ? "Save" : "Register"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserList;
