import React, { useEffect, useState, useRef } from "react";
import WebSocketAdminClient from "./WebsocketAdminRepository";

function VehicleTransit() {
    const socketRef = useRef(null);
    const [trainData, setTrainData] = useState([]);

    useEffect(() => {
        const userSocket = new WebSocketAdminClient();
        socketRef.current = userSocket;

        let intervalId;

        userSocket.readyPromise
            .then(() => {
                console.log("WebSocket connected.");

                // Initial request
                userSocket.send("[Vehicle_Location]");

                // Repeat every 5 seconds
                intervalId = setInterval(() => {
                    userSocket.send("[Vehicle_Location]");
                    console.log("Sent [Vehicle_Location] request");
                }, 5000);
            })
            .catch((err) => {
                console.error("WebSocket failed to connect:", err);
            });

        userSocket.onMessage((msg) => {
            if (msg.startsWith("[Train_Data]")) {
                const jsonString = msg.replace("[Train_Data] ", "").trim();
                const data = JSON.parse(jsonString);

                if (data?.status === "SUCCESS" && data.data) {
                    const vehicles = Array.isArray(data.data) ? data.data : [data.data];
                    setTrainData(vehicles);
                } else {
                    setTrainData([]);
                }
            }
        });

        return () => {
            clearInterval(intervalId); // Clear polling interval
            if (userSocket.readyState === WebSocket.OPEN) {
                userSocket.close();
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
                                trainData.map((train, index) => (
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
