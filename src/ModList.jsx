import React, { useEffect, useState, useRef } from "react"; // <-- include useRef
import WebSocketAdminClient from "./WebsocketAdminRepository";

function ModList() {
    const [emailError, setEmailError] = useState("");
    const socketRef = useRef(null);
    const [admins, setAdmins] = useState([]);
    const [filteredAdmins, setFilteredAdmins] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        firstName: "",
        middleName: "",
        lastName: ""
    });
    const [isSocketReady, setIsSocketReady] = useState(false);
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
        const adminSocket = new WebSocketAdminClient();
        socketRef.current = adminSocket;
    
        adminSocket.readyPromise.then(() => {
            setIsSocketReady(true); // ✅ Socket is now ready to use
            adminSocket.send("[Fetch_Admins]");
        }).catch(err => {
            console.error("WebSocket failed to connect:", err);
        });
        
        
    
        adminSocket.onMessage((msg) => {
            console.log("WebSocket message:", msg);
        
            // Check if message starts with "[Admins_Data]" and remove it
            if (msg.startsWith("[Admins_Data]")) {
                const cleanedMsg = msg.replace("[Admins_Data]", "").trim(); // Remove the prefix
                
                let parsed;
                try {
                    parsed = JSON.parse(cleanedMsg); // Now parse the JSON data
                } catch (err) {
                    console.warn("Non-JSON message received:", msg);
                    return;
                }
        
                // Assuming the parsed message has the correct format
                if (parsed) {
                    setAdmins(parsed);
                    setFilteredAdmins(parsed);
                }
                else {
                    console.log("Invalid admin data received:", parsed);
                }
            }
            else if (msg.startsWith("[Suspend_Admin_Response]")) {
                console.log("Suspend response:", msg);
                setIsSocketReady(true);
                adminSocket.send("[Fetch_Admins]");
                return;
            }
            else if (msg.startsWith("[Update_Admin_Response]")) {
                console.log("Update response:", msg);
                setIsSocketReady(true);
                adminSocket.send("[Fetch_Admins]");
                return;
            }
            else if (msg.startsWith("[Delete_Admin_Response]")) {
                const response = msg.replace("[Delete_Admin_Response] ", "");
                console.log("Delete response:", response);
                adminSocket.send("[Fetch_Admins]");
                return;
            }
            else if (msg.startsWith("[Insert_Admin_Response]")) {
                console.log("Insert response:", msg);
                setIsSocketReady(true);
                adminSocket.send("[Fetch_Admins]");
                return;
            }
            else {
                console.warn("Unexpected message format:", msg);
            }
        });
        
    
        return () => {
            adminSocket.close();
        };
    }, []);
    
    

    // Filter on searchTerm
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

    const handleBan = (admin) => {
        const updatedAdmin = {
            userId: admin.id,
            enabled: !admin.enabled
        };
    
        // Optimistically update the UI (locally) before WebSocket response
        const updatedAdmins = admins.map(a => 
            a.id === admin.id ? { ...a, enabled: !admin.enabled } : a
        );
    
        setAdmins(updatedAdmins);
        setFilteredAdmins(updatedAdmins);
    
        socketRef.current.send("[Suspend_Admin] " + JSON.stringify(updatedAdmin));
    };

    const handleEdit = (adminId) => {
        const admin = admins.find(admin => admin.id === adminId);
        if (admin) {
            setSelectedAdmin(admin);
            setFormData({
                id: admin.id,
                email: admin.email,
                firstName: admin.firstName,
                middleName: admin.middleName,
                lastName: admin.lastName
            });
            setIsModalOpen(true);
        }
    };

    const handleRegisterAdmin = (e) => {
        e.preventDefault();
    
        const email = newAdminData.email;
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    
        if (!gmailRegex.test(email)) {
            setEmailError("Only @gmail.com emails are allowed.");
            return;
        }
    
        if (!newAdminData.password) {
            alert("Password is required.");
            return;
        }
    
        setEmailError(""); // clear error if valid
    
        const socket = socketRef.current;
        const message = `[Insert_Admin] ${JSON.stringify({ data: newAdminData })}`;
    
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not connected.");
        }
    
        socket.send(message);
        setIsRegisterModalOpen(false);
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
        setFormData({ id: "", email: "", firstName: "", middleName: "", lastName: "" });
    };

    const handleSave = (e) => {
        e.preventDefault();
        e.persist(); // Prevent React from nullifying the event
    
        if (!isSocketReady) {
            console.warn("Socket not ready. Retrying...");
            setTimeout(() => handleSave(e), 300);
            return;
        }
    
        if (!selectedAdmin?.id) {
            console.warn("Missing admin ID for update.");
            return;
        }
    
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not connected.");
        }
    
        console.log("Form data being sent:", formData);
    
        socket.send("[Update_Admin] " + JSON.stringify({
            userId: selectedAdmin.id,
            updatedData: {
                email: formData.email,
                firstName: formData.firstName,
                middleName: formData.middleName,
                lastName: formData.lastName,
            }
        }));
    
        setIsModalOpen(false);
    };
    

    const handleDelete = (adminId) => {
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not ready");
        }
        
        const message = `[Delete_Admin] ${JSON.stringify({ userId: adminId })}`;
        socket.send(message);
    };
    
    
    

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-6xl mx-auto w-full">
                <h1 className="text-2xl font-bold text-center mb-4">Admin Panel - Admin Management</h1>

                <input
                    type="text"
                    placeholder="Search Admins"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border mb-4"
                />

                <div className="w-full overflow-x-auto">
                    <table className="table-auto w-full border border-collapse">
                        <thead>
                            <tr className="bg-gray-200 whitespace-nowrap">
                                <th className="py-2 px-4 border">ID</th>
                                <th className="py-2 px-4 border">First</th>
                                <th className="py-2 px-4 border">Middle</th>
                                <th className="py-2 px-4 border">Last</th>
                                <th className="py-2 px-4 border">Email</th>
                                <th className="py-2 px-4 border">Role</th>
                                <th className="py-2 px-4 border">Status</th>
                                <th className="py-2 px-4 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAdmins.map((admin, index) => (
                                <tr key={admin.id || admin.email || index} className="whitespace-nowrap">
                                    <td className="py-2 px-4 border">{admin.id}</td>
                                    <td className="py-2 px-4 border">{admin.firstName}</td>
                                    <td className="py-2 px-4 border">{admin.middleName}</td>
                                    <td className="py-2 px-4 border">{admin.lastName}</td>
                                    <td className="py-2 px-4 border">{admin.email}</td>
                                    <td className="py-2 px-4 border">{admin.adminLevel}</td>
                                    <td className="py-2 px-4 border">
                                        {admin.enabled ? "active" : "banned"}
                                    </td>
                                    <td className="py-2 px-4 border">
                                        <div className="flex gap-1 whitespace-nowrap">
                                            <button
                                                className={`px-2 py-1 rounded text-white ${admin.enabled ? "bg-red-500" : "bg-green-500"}`}
                                                onClick={() => handleBan(admin)}
                                            >
                                                {admin.enabled ? "Ban" : "Unban"}
                                            </button>
                                            <button
                                                className="px-2 py-1 rounded bg-blue-500 text-white"
                                                onClick={() => handleEdit(admin.id)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="px-2 py-1 rounded bg-yellow-500 text-white"
                                                onClick={() => handleDelete(admin.id)}
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



                <div className="text-center mt-4">
                    <button
                        className="px-6 py-2 rounded bg-purple-500 text-white"
                        onClick={() => setIsRegisterModalOpen(true)}
                    >
                        Register New Admin
                    </button>
                </div>
            </div>

            {/* Edit Modal */}
            {isModalOpen && (
                    <div className="fixed inset-0 flex justify-center items-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
                    + <div className="bg-white p-6 rounded-lg w-full max-w-6xl mx-auto">
                        <h2 className="text-xl font-semibold mb-4">Edit Admin</h2>
                        <form onSubmit={handleSave}>
                            {["email", "firstName", "middleName", "lastName"].map((field) => (
                                <label key={field} className="block mb-2 capitalize">
                                    {field.replace("Name", " Name")}
                                    <input
                                        type={field === "email" ? "email" : "text"}
                                        name={field}
                                        value={formData[field]}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded"
                                        required={field !== "middleName"}
                                        pattern={field === "email" ? "^[\\w.+\\-]+@gmail\\.com$" : undefined}
                                        title={field === "email" ? "Only Gmail addresses are allowed." : undefined}
                                    />
                                </label>
                            ))}

                            <div className="flex justify-between mt-4">
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-gray-500 text-white rounded"
                                    onClick={handleCloseModal}
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* Register Modal */}
            {isRegisterModalOpen && (
                <div className="fixed inset-0 flex justify-center items-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-xl font-semibold mb-4">Register New Admin</h2>
                        <form onSubmit={handleRegisterAdmin}>
                            {/* Your input fields here */}

                            {["firstName", "middleName", "lastName", "email"].map((field) => (
                                <div key={field} className="mb-4">
                                    <label className="block mb-1 capitalize" htmlFor={field}>
                                        {field}
                                    </label>
                                    <input
                                        id={field}
                                        type={field === "email" ? "email" : "text"}
                                        name={field}
                                        value={newAdminData[field]}
                                        onChange={handleNewAdminChange}
                                        className="w-full p-2 border rounded"
                                        required={field !== "middleName"}
                                    />
                                </div>
                            ))}

                            {emailError && (
                                <p className="text-red-500 text-sm mt-2 text-center">{emailError}</p>
                            )}

                            <div className="flex justify-between mt-6">
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                    onClick={() => {
                                        setEmailError("");
                                        setIsRegisterModalOpen(false);
                                    }}
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                    Register
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ModList;
