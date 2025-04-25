import React, { useEffect, useState, useRef } from "react";
import WebSocketAdminClient from "./WebsocketAdminRepository";

function VehicleTransit() {
    const socketRef = useRef(null);
    const [trainData, setTrainData] = useState([]);  // Renamed for clarity

    // Handle WebSocket connection and message receiving
    useEffect(() => {
        const userSocket = new WebSocketAdminClient();
        socketRef.current = userSocket;

        // Wait for the connection to be established
        userSocket.readyPromise
            .then(() => {
                console.log("WebSocket connected.");
                userSocket.send("[Vehicle_Location]");  // Send message once connected
            })
            .catch((err) => {
                console.error("WebSocket failed to connect:", err);
            });

        // Handle incoming messages
        userSocket.onMessage((msg) => {
            console.log("Received message:", msg);

            if (msg.startsWith("[Vehicle_Location]")) {
                const data = JSON.parse(msg.replace("[Vehicle_Location] ", ""));
                console.log("Parsed data:", data);

                if (data?.status === "SUCCESS" && data.data) {
                    console.log("Data received:", data.data);

                    // Check if data.data is an array, otherwise wrap it into an array
                    const trainData = Array.isArray(data.data) ? data.data : [data.data];

                    // Update the trainData state
                    setTrainData(trainData);
                    console.log("trainData updated:", trainData);  // Debugging log for state update
                } else {
                    console.warn("No train data or unexpected format");
                    setTrainData([]);  // Clear trainData if data is invalid
                }
            }
        });

        // Cleanup on unmount
        return () => {
            if (userSocket.readyState === WebSocket.OPEN) {
                userSocket.close();
                console.log("WebSocket closed.");
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-7xl mx-auto w-full">
                <h1 className="text-2xl font-bold text-center mb-4">Vehicle Transit</h1>

                <div className="w-full overflow-x-auto">
                    <table className="table-auto min-w-[1200px] border border-collapse">
                        <thead>
                            <tr className="bg-gray-200 whitespace-nowrap">
                                <th className="py-2 px-4 border">Display Date</th>
                                <th className="py-2 px-4 border">Display Time</th>
                                <th className="py-2 px-4 border">Last Updated</th>
                                <th className="py-2 px-4 border">Route ID</th>
                                <th className="py-2 px-4 border">Route Name</th>
                                <th className="py-2 px-4 border">Status</th>
                                <th className="py-2 px-4 border">Stop ID</th>
                                <th className="py-2 px-4 border">Stop Index</th>
                                <th className="py-2 px-4 border">Stop Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trainData.length > 0 ? (
                                trainData.map((train) => (
                                    <tr key={index} className="text-center">
                                        <td className="py-2 px-4 border">{train.displayDate || "—"}</td>
                                        <td className="py-2 px-4 border">{train.displayTime || "—"}</td>
                                        <td className="py-2 px-4 border">{train.lastUpdated || "—"}</td>
                                        <td className="py-2 px-4 border">{train.routeId || "—"}</td>
                                        <td className="py-2 px-4 border">{train.routeName || "—"}</td>
                                        <td className="py-2 px-4 border">{train.status === "Active" ? "Active" : "Inactive"}</td>
                                        <td className="py-2 px-4 border">{train.stopId || "—"}</td>
                                        <td className="py-2 px-4 border">{train.stopIndex || "—"}</td>
                                        <td className="py-2 px-4 border">{train.stopName || "—"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="py-4 text-center text-gray-500">
                                        No data available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default VehicleTransit;
