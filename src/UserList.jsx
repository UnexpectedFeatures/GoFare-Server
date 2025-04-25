import React, { useEffect, useState, useRef } from "react";
import WebSocketAdminClient from "./WebsocketAdminRepository";

function UserList() {
    const socketRef = useRef(null);
    const [emailError, setEmailError] = useState("");
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
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
        enabled: "",

    });
    const [isSocketReady, setIsSocketReady] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [newUserData, setNewUserData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        address: "",
        gender: "",
        birthday: "",
        age: "",
        contactNumber: "",
        enabled: "",
    });
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const userSocket = new WebSocketAdminClient();
        socketRef.current = userSocket;
    
        userSocket.readyPromise.then(() => {
            setIsSocketReady(true);
            console.log("Socket is ready. Sending [Fetch_Users]");
            userSocket.send("[Fetch_Users]");

            userSocket.send("[Fetch_Users]");
        }).catch(err => {
            console.error("WebSocket failed to connect:", err);
        });
    
        userSocket.onMessage((msg) => {
            console.log("WebSocket message:", msg);
    
            if (msg.startsWith("[Users_Data]")) {
                const cleanedMsg = msg.replace("[Users_Data]", "").trim();
    
                let parsed;
                try {
                    parsed = JSON.parse(cleanedMsg);
                } catch (err) {
                    console.warn("Non-JSON message received:", msg);
                    return;
                }
    
                if (parsed) {
                    setUsers(parsed);
                    setFilteredUsers(parsed);
                } else {
                    console.log("Invalid user data received:", parsed);
                }
            }
            else if (msg.startsWith("[Suspend_User_Response]")) {
                console.log("Suspend response:", msg);
                setIsSocketReady(true);
                userSocket.send("[Fetch_Users]");
                return;
            }
            else if (msg.startsWith("[Update_User_Response]")) {
                console.log("Update response:", msg);
                setIsSocketReady(true);
                userSocket.send("[Fetch_Users]");
                return;
            }
            else if (msg.startsWith("[Delete_User_Response]")) {
                const response = msg.replace("[Delete_User_Response] ", "");
                console.log("Delete response:", response);
                userSocket.send("[Fetch_Users]");
                return;
            }
            else if (msg.startsWith("[Insert_User_Response]")) {
                console.log("Insert response:", msg);
                setIsSocketReady(true);
                userSocket.send("[Fetch_Users]");
                return;
            }
            else {
                console.warn("Unexpected message format:", msg);
            }
        });
    
        return () => {
            userSocket.close();
        };
    }, []);
    
    useEffect(() => {
        if (!searchTerm) {
            setFilteredUsers(users);
            return;
        }
    
        const lowerSearch = searchTerm.toLowerCase();
    
        const filtered = users.filter(user => {
            return (
                (user.id || "").toLowerCase().includes(lowerSearch) ||
                (user.firstName || "").toLowerCase().includes(lowerSearch) ||
                (user.lastName || "").toLowerCase().includes(lowerSearch) ||
                (user.email || "").toLowerCase().includes(lowerSearch) ||
                (user.address || "").toLowerCase().includes(lowerSearch) ||
                (user.gender || "").toLowerCase().includes(lowerSearch) ||
                (user.birthday || "").toLowerCase().includes(lowerSearch) ||
                (user.age?.toString() || "").toLowerCase().includes(lowerSearch) ||
                (user.contactNumber || "").toLowerCase().includes(lowerSearch) ||
                (user.enabled?.toString().toLowerCase() || "").includes(lowerSearch)
            );
        });
    
        setFilteredUsers(filtered);
    }, [users, searchTerm]);
    
    
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
            setNewUserData(prev => ({ ...prev, age: value }));
        }
    };
    
    const handleContactInput = (e) => {
        const { value } = e.target;
        if (/^\d{0,11}$/.test(value)) { // Ensures the input is up to 11 digits
            setNewUserData(prev => ({ ...prev, contactNumber: value }));
        }
    };
    
    const handleBan = (userId) => {
        const updatedUser = {
            userId: userId,
            enabled: !users.find(u => u.id === userId).enabled // Toggle the 'enabled' state
        };
    
        const updatedUsers = users.map(u =>
            u.id === userId ? { ...u, enabled: !u.enabled } : u
        );
    
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
    
        socketRef.current.send("[Suspend_User] " + JSON.stringify(updatedUser));
    };
    
    const handleEdit = (userId) => {
        const user = users.find(user => user.id === userId);
        if (user) {
            setSelectedUser(user);
            setFormData({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                gender: user.gender,
                address: user.address,
                birthday: user.birthday,
                age: user.age,
                contactNumber: user.contactNumber,
            });
            setIsModalOpen(true);
        }
    };
    
    const handleNumericKeyDown = (e) => {
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
        if (
            !/[0-9]/.test(e.key) && 
            !allowedKeys.includes(e.key)
        ) {
            e.preventDefault();
        }
    };
    
    const handleRegisterUser = (e) => {
        e.preventDefault();
    
        const { email, contactNumber, age } = newUserData;
    
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailRegex.test(email)) {
            setEmailError("Only @gmail.com emails are allowed.");
            return;
        }
    
        const contactRegex = /^09\d{9}$/;
        if (!contactRegex.test(contactNumber)) {
            setEmailError("Contact number must start with '09' and be exactly 11 digits.");
            return;
        }
    
        const ageRegex = /^\d{1,3}$/;
        if (!ageRegex.test(age)) {
            setEmailError("Age must be a numeric value with up to 3 digits.");
            return;
        }
    
        setEmailError("");
    
        const socket = socketRef.current;
        const message = `[Insert_User] ${JSON.stringify({ data: newUserData })}`;
    
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
    
    const handleNewUserChange = (e) => {
        const { name, value } = e.target;
        setNewUserData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({ id: "", email: "", firstName: "", middleName: "", lastName: "", birthday: "", age: "", gender: "", contactNumber: "", address: ""});
    };
    
    const handleSave = (e) => {
        e.preventDefault();
        e.persist();
    
        if (!isSocketReady) {
            console.warn("Socket not ready. Retrying...");
            setTimeout(() => handleSave(e), 300);
            return;
        }
    
        if (!selectedUser?.id) {
            console.warn("Missing user ID for update.");
            return;
        }
    
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not connected.");
        }
    
        console.log("Form data being sent:", formData);
    
        socket.send("[Update_User] " + JSON.stringify({
            userId: selectedUser.id,
            updatedData: {
                email: formData.email,
                firstName: formData.firstName,
                middleName: formData.middleName,
                lastName: formData.lastName,
                birthday: formData.birthday, 
                age: formData.age, 
                gender: formData.gender, 
                contactNumber: formData.contactNumber, 
                address: formData.address
            }
        }));
    
        setIsModalOpen(false);
    };
    const handleDelete = (userId) => {
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not ready");
        }
    
        const message = `[Delete_User] ${JSON.stringify({ userId: userId })}`;
        socket.send(message);
    };
    
    

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-6xl mx-auto w-full">
                <h1 className="text-2xl font-bold text-center mb-4">User Panel - User Management</h1>
    
                <input
                    type="text"
                    placeholder="Search Users"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border mb-4"
                />
    
                <div className="w-full overflow-x-auto">
                    <table className="table-auto min-w-[1200px] border border-collapse">
                        <thead>
                            <tr className="bg-gray-200 whitespace-nowrap">
                                <th className="py-2 px-4 border">First Name</th>
                                <th className="py-2 px-4 border">Middle Name</th>
                                <th className="py-2 px-4 border">Last Name</th>
                                <th className="py-2 px-4 border">Email</th>
                                <th className="py-2 px-4 border">Address</th>
                                <th className="py-2 px-4 border">Gender</th>
                                <th className="py-2 px-4 border">Birthday</th>
                                <th className="py-2 px-4 border">Age</th>
                                <th className="py-2 px-4 border">Contact No.</th>
                                <th className="py-2 px-4 border">Status</th>
                                <th className="py-2 px-4 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id || user.email} className="whitespace-nowrap">
                                    <td className="py-2 px-4 border">{user.firstName}</td>
                                    <td className="py-2 px-4 border">{user.middleName}</td>
                                    <td className="py-2 px-4 border">{user.lastName}</td>
                                    <td className="py-2 px-4 border">{user.email}</td>
                                    <td className="py-2 px-4 border">{user.address}</td>
                                    <td className="py-2 px-4 border">{user.gender}</td>
                                    <td className="py-2 px-4 border">{user.birthday}</td>
                                    <td className="py-2 px-4 border">{user.age}</td>
                                    <td className="py-2 px-4 border">{user.contactNumber}</td>
                                    <td className="py-2 px-4 border">{user.enabled ? "Active" : "Banned"}</td>
                                    <td className="py-2 px-4 border">
                                        <div className="flex gap-1 whitespace-nowrap">
                                            <button
                                                className={`px-2 py-1 rounded text-white ${user.enabled ? "bg-red-500" : "bg-green-500"}`}
                                                onClick={() => handleBan(user.id)}
                                            >
                                                {user.enabled ? "Ban" : "Unban"}
                                            </button>
                                            <button
                                                className="px-2 py-1 rounded bg-blue-500 text-white"
                                                onClick={() => handleEdit(user.id)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="px-2 py-1 rounded bg-yellow-500 text-white"
                                                onClick={() => handleDelete(user.id)}
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
                        Register New User
                    </button>
                </div>
            </div>
    
            {/* Edit Modal */}
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
                            ].map((field) => (
                                <label key={field} className="block">

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
                                    ) : (
                                        <input
                                            type={
                                                field === "email"
                                                    ? "email"
                                                    : field === "age" ||
                                                    field === "contactNumber"
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
    
            
            {isRegisterModalOpen && (
                <div
                    className="fixed inset-0 flex justify-center items-center z-50"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
                >
                    <div className="bg-white p-6 rounded-lg w-96 shadow-lg overflow-y-auto max-h-[90vh]">
                    <h2 className="text-xl font-semibold mb-4 text-center">Register New User</h2>
                    <form onSubmit={handleRegisterUser}>
                        {[
                        "firstName",
                        "middleName",
                        "lastName",
                        "email",
                        "address",
                        "gender",
                        "age",
                        "contactNumber",
                        "birthday" // Add birthday here
                        ].map((field) => {
                        const label =
                            field === "gender"
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
                                value={newUserData[field]}
                                onChange={handleNewUserChange}
                                className="w-full p-2 border rounded"
                                required
                                >
                                <option value="" disabled>Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                                </select>
                            ) : field === "birthday" ? (
                                <input
                                id={field}
                                type={inputType}
                                name={field}
                                value={newUserData[field]} // Handle birthday change
                                onChange={handleNewUserChange}
                                placeholder="e.g., June 1, 2005"
                                className="w-full p-2 border rounded"
                                required
                                />
                            ) : (
                                <input
                                id={field}
                                type={inputType}
                                name={field}
                                value={newUserData[field]}
                                onChange={
                                    field === "age"
                                    ? handleAgeInput
                                    : field === "contactNumber"
                                    ? handleContactInput
                                    : handleNewUserChange
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

export default UserList;
