import React, { useEffect, useState, useRef } from "react";
import WebSocketAdminClient from "./WebsocketAdminRepository";

function UserArchive() {
    const socketRef = useRef(null);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isSocketReady, setIsSocketReady] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const userSocket = new WebSocketAdminClient();
        socketRef.current = userSocket;
    
        userSocket.readyPromise.then(() => {
            setIsSocketReady(true);
            console.log("Socket is ready. Sending [Fetch_Archived_Users]");
            userSocket.send("[Fetch_Archived_Users]");

            userSocket.send("[Fetch_Archived_Users]");
        }).catch(err => {
            console.error("WebSocket failed to connect:", err);
        });
    
        userSocket.onMessage((msg) => {
            console.log("WebSocket message:", msg);
    
            if (msg.startsWith("[Users_Archive]")) {
                const cleanedMsg = msg.replace("[Users_Archive]", "").trim();
    
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
            else if (msg.startsWith("[Retrieve_User_Response]")) {
                console.log("Retrieve response:", msg);
                setIsSocketReady(true);
                userSocket.send("[Fetch_Archived_Users]");
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
                (user.age !== undefined && user.age !== null ? user.age.toString().toLowerCase().includes(lowerSearch) : false) ||
                (user.contactNumber || "").toLowerCase().includes(lowerSearch) ||
                (typeof user.enabled === "boolean" ? (user.enabled ? "active" : "banned").includes(lowerSearch) : false)
            );
        });
    
        setFilteredUsers(filtered);
    }, [users, searchTerm]);
    

    const handleRetrieve = (id) => {
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not ready");
        }

        const message = `[Retrieve_User] ${JSON.stringify({ userId: id })}`;
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
                                                className="px-2 py-1 rounded bg-green-500 text-white"
                                                onClick={() => handleRetrieve(user.id)}
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

export default UserArchive;
