import React, { useEffect, useState, useRef } from "react";
import WebSocketAdminClient from "./WebsocketAdminRepository";

function AdminArchive() {
    const socketRef = useRef(null);
    const [admins, setAdmins] = useState([]);
    const [filteredAdmins, setFilteredAdmins] = useState([]);
    const [isSocketReady, setIsSocketReady] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // WebSocket connection and initial fetch
    useEffect(() => {
        const adminSocket = new WebSocketAdminClient();
        socketRef.current = adminSocket;

        // Wait for WebSocket to be ready
        adminSocket.readyPromise
            .then(() => {
                setIsSocketReady(true);
                adminSocket.send("[Fetch_Admins_Archive]");
            })
            .catch((err) => {
                console.error("WebSocket failed to connect:", err);
            });

        // Handle incoming messages
        adminSocket.onMessage((msg) => {
            console.log("WebSocket message received:", msg);

            // Handle archive data
            if (msg.startsWith("[Admins_Archive]")) {
                const cleanedMsg = msg.replace("[Admins_Archive]", "").trim();
                try {
                    const parsed = JSON.parse(cleanedMsg);
                    if (Array.isArray(parsed)) {
                        setAdmins(parsed);
                        setFilteredAdmins(parsed);
                    } else {
                        console.warn("Invalid admin data received:", parsed);
                    }
                } catch (err) {
                    console.warn("Error parsing JSON:", err);
                }
            }

            // Handle retrieve confirmation
            else if (msg.startsWith("[Retrieve_Admin_Response]")) {
                console.log("Retrieve response:", msg);
                // Re-fetch the updated archive list
                adminSocket.send("[Fetch_Admins_Archive]");
            }

            // Unexpected messages
            else {
                console.warn("Unexpected message format:", msg);
            }
        });

        return () => {
            adminSocket.close();
        };
    }, []);

    // Filter admin list based on search term
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredAdmins(admins);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = admins.filter((admin) =>
                admin.email?.toLowerCase().includes(lowerTerm) ||
                admin.firstName?.toLowerCase().includes(lowerTerm) ||
                admin.lastName?.toLowerCase().includes(lowerTerm)
            );
            setFilteredAdmins(filtered);
        }
    }, [admins, searchTerm]);

    // Retrieve admin from archive
    const handleRetrieve = (adminId) => {
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket is not ready");
            return;
        }

        const message = `[Retrieve_Admin] ${JSON.stringify({ userId: adminId })}`;
        socket.send(message);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-6xl mx-auto w-full">
                <h1 className="text-2xl font-bold text-center mb-4">Admin Panel - Archived Admins</h1>

                <input
                    type="text"
                    placeholder="Search Admins"
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
                            {filteredAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-4 text-gray-500">
                                        No archived admins found.
                                    </td>
                                </tr>
                            ) : (
                                filteredAdmins.map((admin, index) => (
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
                                                    className="px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600"
                                                    onClick={() => handleRetrieve(admin.id)}
                                                >
                                                    Retrieve
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AdminArchive;
