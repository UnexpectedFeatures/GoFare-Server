import React, { useEffect, useState } from "react";
import axios from "axios";
function AdminList() {
    const [admins, setAdmins] = useState([]);
    const [filteredAdmins, setFilteredAdmins] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        firstName: "",
        middleName: "",
        lastName: ""
    });
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [newAdminData, setNewAdminData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        role: "admin"
    });
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchAdmins = async () => {
            try {
                const role = localStorage.getItem("userRole")?.toLowerCase();
                const response = await axios.get(`http://localhost:5000/api/auth/admins/${role}`);
                setAdmins(response.data);
                setFilteredAdmins(response.data);
            } catch (error) {
                console.error("Error fetching admins:", error);
            }
        };
        fetchAdmins();
    }, []);

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredAdmins(admins);
        } else {
            const filtered = admins.filter(admin =>
                admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                admin.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                admin.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredAdmins(filtered);
        }
    }, [admins, searchTerm]);

    const handleBan = async (adminEmail, isBanned) => {
        try {
            const endpoint = isBanned
                ? `http://localhost:5000/api/auth/admins/unban/${adminEmail}`
                : `http://localhost:5000/api/auth/admins/ban/${adminEmail}`;

            await axios.post(endpoint);

            setAdmins(admins.map(admin =>
                admin.email === adminEmail ? { ...admin, status: isBanned ? "active" : "banned" } : admin
            ));
        } catch (error) {
            console.error("Error banning/unbanning admin:", error);
        }
    };

    const handleDelete = async (adminEmail) => {
        try {
            await axios.delete(`http://localhost:5000/api/auth/admins/delete/${adminEmail}`);
            setAdmins(admins.filter(admin => admin.email !== adminEmail));
        } catch (error) {
            console.error("Error deleting admin:", error);
        }
    };

    const handleEdit = (adminEmail) => {
        const admin = admins.find(admin => admin.email === adminEmail);
        setSelectedAdmin(admin);
        setFormData({
            email: admin.email,
            firstName: admin.firstName,
            middleName: admin.middleName,
            lastName: admin.lastName
        });
        setIsModalOpen(true);
    };

    const handleRegisterAdmin = async () => {
        try {
            await axios.post("http://localhost:3003/api/auth/admins/register", newAdminData);
            setAdmins([...admins, newAdminData]);
            setIsRegisterModalOpen(false);
        } catch (error) {
            console.error("Error registering admin:", error);
        }
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
    };

    const handleSave = async () => {
        try {
            await axios.put(`http://localhost:5000/api/auth/admins/update/${formData.email}`, formData);
            setAdmins(admins.map(admin =>
                admin.email === formData.email ? { ...admin, ...formData } : admin
            ));
            handleCloseModal();
        } catch (error) {
            console.error("Error updating admin:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-6xl mx-auto w-full">
                <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                    Admin Panel - Admin Management
                </h1>
                
                {/* Search Bar */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search Admins"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
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
                                <th className="py-2 px-4 border">Status</th>
                                <th className="py-2 px-4 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAdmins.map((admin, index) => (
                                <tr key={admin.id || admin.email || index} className="border-t">
                                    <td className="py-2 px-4 border">{admin.id}</td>
                                    <td className="py-2 px-4 border">{admin.firstName}</td>
                                    <td className="py-2 px-4 border">{admin.middleName}</td>
                                    <td className="py-2 px-4 border">{admin.lastName}</td>
                                    <td className="py-2 px-4 border">{admin.email}</td>
                                    <td className="py-2 px-4 border">{admin.enabled}</td>
                                    <td className="py-2 px-4 border">
                                        <div className="flex space-x-2">
                                            <button
                                                className={`px-4 py-1 rounded cursor-pointer ${admin.status === "banned" ? "bg-green-500" : "bg-red-500"} text-white`}
                                                onClick={() => handleBan(admin.email, admin.status === "banned")}
                                            >
                                                {admin.status === "banned" ? "Unban" : "Ban"}
                                            </button>
                                            <button
                                                className="px-4 py-1 rounded bg-blue-500 text-white"
                                                onClick={() => handleEdit(admin.email)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="px-4 py-1 rounded bg-yellow-500 text-white"
                                                onClick={() => handleDelete(admin.email)}
                                            >
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
                            onClick={() => setIsRegisterModalOpen(true)}
                        >
                            Register New Admin
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Admin Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-xl font-semibold mb-4">Edit Admin</h2>
                        <div className="space-y-4">
                            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" placeholder="First Name" />
                            <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" placeholder="Middle Name" />
                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" placeholder="Last Name" />
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" disabled />
                        </div>
                        <div className="flex justify-end space-x-4 mt-4">
                            <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-500 text-white rounded">
                                Cancel
                            </button>
                            <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Register New Admin Modal */}
            {isRegisterModalOpen && (
                <div className="fixed inset-0 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-xl font-semibold mb-4">Register New Admin</h2>
                        <div className="space-y-4">
                            <input type="text" name="firstName" value={newAdminData.firstName} onChange={handleNewAdminChange} className="w-full p-2 border border-gray-300 rounded" placeholder="First Name" />
                            <input type="text" name="middleName" value={newAdminData.middleName} onChange={handleNewAdminChange} className="w-full p-2 border border-gray-300 rounded" placeholder="Middle Name" />
                            <input type="text" name="lastName" value={newAdminData.lastName} onChange={handleNewAdminChange} className="w-full p-2 border border-gray-300 rounded" placeholder="Last Name" />
                            <input type="email" name="email" value={newAdminData.email} onChange={handleNewAdminChange} className="w-full p-2 border border-gray-300 rounded" placeholder="Email" />
                            <select name="role" value={newAdminData.role} onChange={handleNewAdminChange} className="w-full p-2 border border-gray-300 rounded">
                                <option value="admin">Admin</option>
                                <option value="superadmin">Super Admin</option>
                            </select>
                        </div>
                        <div className="flex justify-end space-x-4 mt-4">
                            <button onClick={() => setIsRegisterModalOpen(false)} className="px-4 py-2 bg-gray-500 text-white rounded">
                                Cancel
                            </button>
                            <button onClick={handleRegisterAdmin} className="px-4 py-2 bg-green-500 text-white rounded">
                                Register
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


export default AdminList;
