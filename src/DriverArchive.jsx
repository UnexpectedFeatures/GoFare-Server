import React, { useEffect, useState, useRef } from "react";
import WebSocketAdminClient from "./WebsocketAdminRepository";

function DriverArchive() {
    const socketRef = useRef(null);
    const [drivers, setDrivers] = useState([]);
    const [filteredDrivers, setFilteredDrivers] = useState([]);
    const [isSocketReady, setIsSocketReady] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const driverSocket = new WebSocketAdminClient();
        socketRef.current = driverSocket;

        driverSocket.readyPromise.then(() => {
            setIsSocketReady(true);
            driverSocket.send("[Fetch_Drivers_Archive]");
        }).catch(err => {
            console.error("WebSocket failed to connect:", err);
        });

        driverSocket.onMessage((msg) => {
            console.log("WebSocket message:", msg);

            if (msg.startsWith("[Drivers_Archive]")) {
                const cleanedMsg = msg.replace("[Drivers_Archive]", "").trim();

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
            } else if (msg.startsWith("[Retrieve_Driver_Response]")) {
                console.log("Retrieve response:", msg);
                setIsSocketReady(true);
                driverSocket.send("[Fetch_Drivers_Archive]");
                return;
            } else {
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
    

    const handleRetrieve = (driverId) => {
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not ready");
        }

        const message = `[Retrieve_Driver] ${JSON.stringify({ userId: driverId })}`;
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
                    <table className="table-auto w-full border border-collapse">
                        <thead>
                            <tr className="bg-gray-200 whitespace-nowrap">
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
                                <tr key={driver.id || driver.email || index} className="whitespace-nowrap">
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
                                                className="px-2 py-1 rounded bg-green-500 text-white"
                                                onClick={() => handleRetrieve(driver.id)}
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

export default DriverArchive;
