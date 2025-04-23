import React, { useEffect, useState, useRef } from "react";
import WebSocketAdminClient from "./WebsocketAdminRepository";

function ModList() {
    const socketRef = useRef(null);
    const [emailError, setEmailError] = useState("");
    const [drivers, setDrivers] = useState([]);
    const [filteredDrivers, setFilteredDrivers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        firstName: "",
        middleName: "",
        lastName: ""
    });
    const [isSocketReady, setIsSocketReady] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [newDriverData, setNewDriverData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        role: "driver"
    });
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const driverSocket = new WebSocketAdminClient();
        socketRef.current = driverSocket;

        driverSocket.readyPromise.then(() => {
            setIsSocketReady(true);
            driverSocket.send("[Fetch_Drivers]");
        }).catch(err => {
            console.error("WebSocket failed to connect:", err);
        });

        driverSocket.onMessage((msg) => {
            console.log("WebSocket message:", msg);

            if (msg.startsWith("[Drivers_Data]")) {
                const cleanedMsg = msg.replace("[Drivers_Data]", "").trim();

                let parsed;
                try {
                    parsed = JSON.parse(cleanedMsg);
                } catch (err) {
                    console.warn("Non-JSON message received:", msg);
                    return;
                }

                if (parsed) {
                    setDrivers(parsed);
                    setFilteredDrivers(parsed);
                } else {
                    console.log("Invalid driver data received:", parsed);
                }
            }
            else if (msg.startsWith("[Suspend_Driver_Response]")) {
                console.log("Suspend response:", msg);
                setIsSocketReady(true);
                driverSocket.send("[Fetch_Drivers]");
                return;
            }
            else if (msg.startsWith("[Update_Driver_Response]")) {
                console.log("Update response:", msg);
                setIsSocketReady(true);
                driverSocket.send("[Fetch_Drivers]");
                return;
            }
            else if (msg.startsWith("[Delete_Driver_Response]")) {
                const response = msg.replace("[Delete_Driver_Response] ", "");
                console.log("Delete response:", response);
                driverSocket.send("[Fetch_Drivers]");
                return;
            }
            else if (msg.startsWith("[Insert_Driver_Response]")) {
                console.log("Insert response:", msg);
                setIsSocketReady(true);
                driverSocket.send("[Fetch_Drivers]");
                return;
            }
            else {
                console.warn("Unexpected message format:", msg);
            }
        });

        return () => {
            driverSocket.close();
        };
    }, []);

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredDrivers(drivers);
        } else {
            const filtered = drivers.filter(driver =>
                driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                driver.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                driver.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredDrivers(filtered);
        }
    }, [drivers, searchTerm]);

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
    
    const handleBan = (driver) => {
        const updatedDriver = {
            userId: driver.id,
            enabled: !driver.enabled
        };

        const updatedDrivers = drivers.map(d =>
            d.id === driver.id ? { ...d, enabled: !driver.enabled } : d
        );

        setDrivers(updatedDrivers);
        setFilteredDrivers(updatedDrivers);

        socketRef.current.send("[Suspend_Driver] " + JSON.stringify(updatedDriver));
    };

    const handleEdit = (driverId) => {
        const driver = drivers.find(driver => driver.id === driverId);
        if (driver) {
            setSelectedDriver(driver);
            setFormData({
                id: driver.id,
                email: driver.email,
                firstName: driver.firstName,
                middleName: driver.middleName,
                lastName: driver.lastName
            });
            setIsModalOpen(true);
        }
    };

    const handleRegisterDriver = (e) => {
        e.preventDefault();
    
        const email = newDriverData.email;
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    
        if (!gmailRegex.test(email)) {
            setEmailError("Only @gmail.com emails are allowed.");
            return;
        }
    
        setEmailError(""); // clear error if valid
    
        const socket = socketRef.current;
        const message = `[Insert_Driver] ${JSON.stringify({ data: newDriverData })}`;
    
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

    const handleNewDriverChange = (e) => {
        const { name, value } = e.target;
        setNewDriverData(prev => ({ ...prev, [name]: value }));
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({ id: "", email: "", firstName: "", middleName: "", lastName: "" });
    };

    const handleSave = (e) => {
        e.preventDefault();
        e.persist();

        if (!isSocketReady) {
            console.warn("Socket not ready. Retrying...");
            setTimeout(() => handleSave(e), 300);
            return;
        }

        if (!selectedDriver?.id) {
            console.warn("Missing driver ID for update.");
            return;
        }

        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not connected.");
        }

        console.log("Form data being sent:", formData);

        socket.send("[Update_Driver] " + JSON.stringify({
            userId: selectedDriver.id,
            updatedData: {
                email: formData.email,
                firstName: formData.firstName,
                middleName: formData.middleName,
                lastName: formData.lastName,
            }
        }));

        setIsModalOpen(false);
    };

    const handleDelete = (driverId) => {
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not ready");
        }

        const message = `[Delete_Driver] ${JSON.stringify({ userId: driverId })}`;
        socket.send(message);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-6xl mx-auto w-full">
                <h1 className="text-2xl font-bold text-center mb-4">Driver Panel - Driver Management</h1>

                <input
                    type="text"
                    placeholder="Search Drivers"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border mb-4"
                />

                <div className="w-full overflow-x-auto">
                    <table className="table-auto min-w-[1000px] border border-collapse">
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
                            {filteredDrivers.map((driver, index) => (
                                <tr key={driver.id || driver.email || index} className="whitespace-nowrap">
                                    <td className="py-2 px-4 border">{driver.id}</td>
                                    <td className="py-2 px-4 border">{driver.firstName}</td>
                                    <td className="py-2 px-4 border">{driver.middleName}</td>
                                    <td className="py-2 px-4 border">{driver.lastName}</td>
                                    <td className="py-2 px-4 border">{driver.email}</td>
                                    <td className="py-2 px-4 border">{driver.adminLevel}</td>
                                    <td className="py-2 px-4 border">{driver.enabled ? "active" : "banned"}</td>
                                    <td className="py-2 px-4 border">
                                        <div className="flex gap-1 whitespace-nowrap">
                                            <button
                                                className={`px-2 py-1 rounded text-white ${driver.enabled ? "bg-red-500" : "bg-green-500"}`}
                                                onClick={() => handleBan(driver)}
                                            >
                                                {driver.enabled ? "Ban" : "Unban"}
                                            </button>
                                            <button
                                                className="px-2 py-1 rounded bg-blue-500 text-white"
                                                onClick={() => handleEdit(driver.id)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="px-2 py-1 rounded bg-yellow-500 text-white"
                                                onClick={() => handleDelete(driver.id)}
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
                        Register New Driver
                    </button>
                </div>
            </div>

            {/* Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex justify-center items-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-xl font-semibold mb-4">Edit Driver</h2>
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
                <div
                    className="fixed inset-0 flex justify-center items-center z-50"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
                >
                    <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Register New Driver</h2>
                        <form onSubmit={handleRegisterDriver}>
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
                                        value={newDriverData[field]}
                                        onChange={handleNewDriverChange}
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
