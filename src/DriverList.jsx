import React, { useEffect, useState, useRef } from "react";
import WebSocketAdminClient from "./WebsocketAdminRepository";

function DriverList() {
    const socketRef = useRef(null);
    const [emailError, setEmailError] = useState("");
    const [drivers, setDrivers] = useState([]);
    const [filteredDrivers, setFilteredDrivers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        firstName: "",
        middleName: "",
        lastName: "",
        address: "",
        gender: "",
        birthday: "",
        age: "",
        contactNumber: "",
        vehicleType: "",
        driverNo: "",

    });
    const [isSocketReady, setIsSocketReady] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [newDriverData, setNewDriverData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        address: "",
        gender: "",
        birthday: "",
        age: "",
        contactNumber: "",
        vehicleType: "",
        driverNo: "",
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
            const lowerSearch = searchTerm.toLowerCase();
    
            const filtered = drivers.filter(driver =>
                (driver.id?.toLowerCase() || "").includes(lowerSearch) ||
                (driver.firstName?.toLowerCase() || "").includes(lowerSearch) ||
                (driver.lastName?.toLowerCase() || "").includes(lowerSearch) ||
                (driver.email?.toLowerCase() || "").includes(lowerSearch) ||
                (driver.address?.toLowerCase() || "").includes(lowerSearch) ||
                (driver.gender?.toLowerCase() || "").includes(lowerSearch) ||
                (driver.birthday?.toLowerCase() || "").includes(lowerSearch) ||
                (driver.age?.toString().toLowerCase() || "").includes(lowerSearch) ||
                (driver.contactNumber?.toLowerCase() || "").includes(lowerSearch) ||
                (driver.vehicleType?.toLowerCase() || "").includes(lowerSearch) ||
                (driver.driverNo?.toString().toLowerCase() || "").includes(lowerSearch)
            );
                  
            setFilteredDrivers(filtered);
        }
    }, [drivers, searchTerm]);
    

    const handleEditAgeInput = (e) => {
        const { value } = e.target;
        if (/^\d{0,3}$/.test(value)) {
            setFormData((prev) => ({ ...prev, age: value }));
        }
    };
    
    const handleEditContactInput = (e) => {
        const { value } = e.target;
        if (/^\d{0,11}$/.test(value)) {
            setFormData((prev) => ({ ...prev, contactNumber: value }));
        }
    };
    
    const handleAgeInput = (e) => {
        const { value } = e.target;
        if (/^\d{0,3}$/.test(value)) { // Allows a number with 1-3 digits (0-999)
            setNewDriverData(prev => ({ ...prev, age: value }));
        }
    };
    
    const handleContactInput = (e) => {
        const { value } = e.target;
        if (/^\d{0,11}$/.test(value)) { // Ensures the input is up to 11 digits
            setNewDriverData(prev => ({ ...prev, contactNumber: value }));
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
                lastName: driver.lastName,
                address: driver.address,
                gender: driver.gender,
                birthday: driver.birthday,
                age: driver.age,
                contactNumber: driver.contactNumber,
                vehicleType: driver.vehicleType,
                driverNo: driver.driverNo,
            });
            setIsModalOpen(true);
        }
    };

    const handleNumericKeyDown = (e) => {
        // Allow: backspace, delete, arrows, tab
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
        if (
            !/[0-9]/.test(e.key) && 
            !allowedKeys.includes(e.key)
        ) {
            e.preventDefault();
        }
    };

    const handleRegisterDriver = (e) => {
        e.preventDefault();
    
        const { email, contactNumber, age } = newDriverData;
    
        // Email validation: only gmail allowed
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailRegex.test(email)) {
            setEmailError("Only @gmail.com emails are allowed.");
            return;
        }
    
        const contactRegex = /^09\d{9}$/; // Only allows '09' followed by 9 digits, total 11 numbers
        if (!contactRegex.test(contactNumber)) {
            setEmailError("Contact number must start with '09' and be exactly 11 digits.");
            return;
        }
    
        const ageRegex = /^\d{1,3}$/; // Only allows 1 to 3 digits, no letters or symbols
        if (!ageRegex.test(age)) {
            setEmailError("Age must be a numeric value with up to 3 digits.");
            return;
        }
    
        setEmailError(""); // Clear all errors if everything is valid
    
        // Ensure WebSocket is connected before sending
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.error("WebSocket not connected.");
        }
    
        // Sending message to WebSocket
        const message = `[Insert_Driver] ${JSON.stringify({ data: newDriverData })}`;
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
        setFormData({ id: "", email: "", firstName: "", middleName: "", lastName: "", birthday: "", age: "", gender: "", address: "", contactNumber: "", vehicleType: "", driverNo: "" });
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
                birthday: formData.birthday,
                age: formData.age,
                gender: formData.gender,
                address: formData.address,
                contactNumber: formData.contactNumber,
                vehicleType: formData.vehicleType,
                driverNo: formData.driverNo
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
                    <table className="table-auto min-w-[1200px] border border-collapse">
                        <thead>
                            <tr className="bg-gray-200 whitespace-nowrap">
                                <th className="py-2 px-4 border">ID</th>
                                <th className="py-2 px-4 border">Driver No</th>
                                <th className="py-2 px-4 border">First Name</th>
                                <th className="py-2 px-4 border">Middle Name</th>
                                <th className="py-2 px-4 border">Last Name</th>
                                <th className="py-2 px-4 border">Email</th>
                                <th className="py-2 px-4 border">Address</th>
                                <th className="py-2 px-4 border">Gender</th>
                                <th className="py-2 px-4 border">Birthday</th>
                                <th className="py-2 px-4 border">Age</th>
                                <th className="py-2 px-4 border">Contact No.</th>
                                <th className="py-2 px-4 border">Vehicle Type</th>
                                <th className="py-2 px-4 border">Status</th>
                                <th className="py-2 px-4 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDrivers.map((driver, index) => (
                                <tr key={driver.driverNo || driver.email || index} className="whitespace-nowrap">
                                    <td className="py-2 px-4 border">{driver.id}</td>
                                    <td className="py-2 px-4 border">{driver.driverNo}</td>
                                    <td className="py-2 px-4 border">{driver.firstName}</td>
                                    <td className="py-2 px-4 border">{driver.middleName}</td>
                                    <td className="py-2 px-4 border">{driver.lastName}</td>
                                    <td className="py-2 px-4 border">{driver.email}</td>
                                    <td className="py-2 px-4 border">{driver.address}</td>
                                    <td className="py-2 px-4 border">{driver.gender}</td>
                                    <td className="py-2 px-4 border">{driver.birthday}</td>
                                    <td className="py-2 px-4 border">{driver.age}</td>
                                    <td className="py-2 px-4 border">{driver.contactNumber}</td>
                                    <td className="py-2 px-4 border">{driver.vehicleType}</td>
                                    <td className="py-2 px-4 border">{driver.enabled ? "Active" : "Banned"}</td>
                                    <td className="py-2 px-4 border">
                                        <div className="flex gap-1 whitespace-nowrap">
                                            <button
                                                className={`px-2 py-1 rounded text-white ${driver.enabled ? "bg-red-500" : "bg-green-500"}`}
                                                onClick={() => handleBan(driver.id)}
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

            
            {isModalOpen && (
                <div
                    className="fixed inset-0 flex justify-center items-center z-50"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
                >
                    <div className="bg-white p-6 rounded-lg w-96 shadow-lg overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-semibold mb-4">Edit Admin</h2>
                        <form onSubmit={handleSave} className="grid grid-cols-1 gap-4">
                            {[
                                "firstName",
                                "middleName",
                                "lastName",
                                "email",
                                "address",
                                "gender",
                                "birthday",
                                "age",
                                "contactNumber",
                                "vehicleType",
                                "driverNo"
                            ].map((field) => (
                                <label key={field} className="block">
                                    <span className="capitalize">
                                        {field === "driverNo"
                                            ? "Driver Number"
                                            : field.replace(/([A-Z])/g, " $1")}
                                    </span>

                                    {field === "gender" ? (
                                        <select
                                            name={field}
                                            value={formData[field]}
                                            onChange={handleChange}
                                            className="w-full p-2 border rounded mt-1"
                                            required
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    ) : field === "vehicleType" ? (
                                        <select
                                            name={field}
                                            value={formData[field]}
                                            onChange={handleChange}
                                            className="w-full p-2 border rounded mt-1"
                                            required
                                        >
                                            <option value="">Select Vehicle Type</option>
                                            <option value="Jeep">Jeep</option>
                                            <option value="Bus">Bus</option>
                                            <option value="Train">Train</option>
                                        </select>
                                    ) : (
                                        <input
                                            type={
                                                field === "email"
                                                    ? "email"
                                                    : field === "age" ||
                                                    field === "contactNumber" ||
                                                    field === "driverNo"
                                                    ? "tel"
                                                    : "text"
                                            }
                                            name={field}
                                            value={formData[field]}
                                            onChange={
                                                field === "age"
                                                    ? handleEditAgeInput
                                                    : field === "contactNumber"
                                                    ? handleEditContactInput
                                                    : handleChange
                                            }
                                            className="w-full p-2 border rounded mt-1"
                                            required={field !== "middleName"}
                                            pattern={
                                                field === "email"
                                                    ? "^[\\w.+\\-]+@gmail\\.com$"
                                                    : field === "contactNumber"
                                                    ? "09\\d{9}"
                                                    : field === "age"
                                                    ? "\\d{1,3}"
                                                    : undefined
                                            }
                                            maxLength={
                                                field === "contactNumber"
                                                    ? 11
                                                    : field === "age"
                                                    ? 3
                                                    : undefined
                                            }
                                            title={
                                                field === "email"
                                                    ? "Only Gmail addresses are allowed."
                                                    : field === "contactNumber"
                                                    ? "Must start with '09' and be exactly 11 digits"
                                                    : field === "age"
                                                    ? "Up to 3-digit number only"
                                                    : undefined
                                            }
                                        />
                                    )}
                                </label>
                            ))}

                            <div className="col-span-full flex justify-between mt-4">
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                    onClick={handleCloseModal}
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
                    <div className="bg-white p-6 rounded-lg w-96 shadow-lg overflow-y-auto max-h-[90vh]">
                    <h2 className="text-xl font-semibold mb-4 text-center">Register New Driver</h2>
                    <form onSubmit={handleRegisterDriver}>
                        {[
                        "firstName",
                        "middleName",
                        "lastName",
                        "email",
                        "address",
                        "gender",
                        "age",
                        "contactNumber",
                        "vehicleType",
                        "driverNo",
                        "birthday" // Add birthday here
                        ].map((field) => {
                        const label =
                            field === "driverNo"
                            ? "Driver Number"
                            : field === "gender"
                            ? "Gender"
                            : field === "birthday"
                            ? "Birthday" // Label for the new birthday field
                            : field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

                        let inputType = "text";
                        if (field === "email") inputType = "email";
                        else if (field === "age" || field === "contactNumber") inputType = "tel";

                        return (
                            <div key={field} className="mb-4">
                            <label className="block mb-1 capitalize" htmlFor={field}>
                                {label}
                            </label>
                            {field === "gender" ? (
                                <select
                                id={field}
                                name={field}
                                value={newDriverData[field]}
                                onChange={handleNewDriverChange}
                                className="w-full p-2 border rounded"
                                required
                                >
                                <option value="" disabled>Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                                </select>
                            ) : field === "vehicleType" ? (
                                <select
                                name={field}
                                value={newDriverData[field]} // Ensure you're passing correct value to the database
                                onChange={handleNewDriverChange} // Handle the change
                                className="w-full p-2 border rounded mt-1"
                                required
                                >
                                <option value="">Select Vehicle Type</option>
                                <option value="Jeep">Jeep</option>
                                <option value="Bus">Bus</option>
                                <option value="Train">Train</option>
                                </select>
                            ) : field === "birthday" ? (
                                <input
                                id={field}
                                type={inputType}
                                name={field}
                                value={newDriverData[field]} // Handle birthday change
                                onChange={handleNewDriverChange}
                                placeholder="e.g., June 1, 2005"
                                className="w-full p-2 border rounded"
                                required
                                />
                            ) : (
                                <input
                                id={field}
                                type={inputType}
                                name={field}
                                value={newDriverData[field]}
                                onChange={
                                    field === "age"
                                    ? handleAgeInput
                                    : field === "contactNumber"
                                    ? handleContactInput
                                    : handleNewDriverChange
                                }
                                onKeyDown={
                                    field === "age" || field === "contactNumber" ? handleNumericKeyDown : undefined
                                }
                                className="w-full p-2 border rounded"
                                required={field !== "middleName"}
                                maxLength={field === "contactNumber" ? 11 : field === "age" ? 3 : undefined}
                                pattern={
                                    field === "contactNumber"
                                    ? "09\\d{9}"
                                    : field === "age"
                                    ? "\\d{1,3}"
                                    : undefined
                                }
                                title={
                                    field === "contactNumber"
                                    ? "Must start with '09' and be exactly 11 digits"
                                    : field === "age"
                                    ? "Up to 3-digit number only"
                                    : undefined
                                }
                                />
                            )}
                            </div>
                        );
                        })}

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

export default DriverList;
