import React, { useEffect, useState } from "react";
import axios from "axios";

function AdminArchive() {
    const [admins, setAdmins] = useState([]); 

    useEffect(() => {
        const fetchAdmins = async () => {
            try {
                const role = localStorage.getItem("userRole")?.toLowerCase();
                const response = await axios.get(`http://localhost:5000/api/auth/admins/${role}`); // Change mods to admins
                setAdmins(response.data);
            } catch (error) {
                console.error("Error fetching admins:", error);
            }
        };
        fetchAdmins();
    }, []);

    const handleRetrieve = async (adminEmail) => {

    }
    const handleDelete = async (adminEmail) => {
        try {
            await axios.delete(`http://localhost:5000/api/auth/admins/delete/${adminEmail}`); // Change mods to admins
            setAdmins(admins.filter(admin => admin.email !== adminEmail));
        } catch (error) {
            console.error("Error deleting admin:", error);
        }
    };


    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-6xl w-full">
                <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                    Admin Panel - Admin Management
                </h1>
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
                            {admins.map((admin, index) => (
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
                                                className="px-4 py-1 rounded bg-yellow-500 text-white"
                                                onClick={() => handleDelete(admin.email)}
                                            >
                                                Delete
                                            </button>
                                            <button
                                                className="px-4 py-1 rounded bg-green-500 text-white"
                                                onClick={() => handleRetrieve(admin.email)}
                                            >
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

export default AdminArchive;
