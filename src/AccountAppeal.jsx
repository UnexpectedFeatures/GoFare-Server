import React, { useEffect, useState, useRef } from "react";
import WebSocketAdminClient from "./WebsocketAdminRepository";

function ModList() {
    const socketRef = useRef(null);
    const [refunds, setRefunds] = useState([]);
    const [isSocketReady, setIsSocketReady] = useState(false);
    const [activeCommand, setActiveCommand] = useState("Fetch_Refunds_Unapproved");

    useEffect(() => {
        const userSocket = new WebSocketAdminClient();
        socketRef.current = userSocket;

        userSocket.readyPromise.then(() => {
            setIsSocketReady(true);
            console.log("Socket is ready. Sending initial fetch.");
            userSocket.send(`[Fetch_Refunds_Unapproved]`);
        }).catch(err => {
            console.error("WebSocket failed to connect:", err);
        });

        userSocket.onMessage((msg) => {
            console.log("WebSocket message:", msg);

            const expectedResponses = {
                "[Fetch_Refunds_Unapproved_Response]": "Fetch_Refunds_Unapproved",
                "[Fetch_Refunds_Approved_Response]": "Fetch_Refunds_Approved",
                "[Fetch_Refunds_Rejected_Response]": "Fetch_Refunds_Rejected"
            };

            for (const prefix in expectedResponses) {
                if (msg.startsWith(prefix)) {
                    const cleanedMsg = msg.replace(prefix, "").trim();

                    try {
                        const parsed = JSON.parse(cleanedMsg);
                        if (parsed && parsed.refunds) {
                            const statusMap = {
                                "Fetch_Refunds_Unapproved": "unapproved",
                                "Fetch_Refunds_Approved": "approved",
                                "Fetch_Refunds_Rejected": "rejected",
                            };

                            const filtered = parsed.refunds.filter(refund =>
                                refund.status?.toLowerCase() === statusMap[activeCommand].toLowerCase()
                            );

                            setRefunds(filtered);
                        } else {
                            console.warn("Invalid refund data structure");
                        }
                    } catch (err) {
                        console.warn("Failed to parse JSON:", err);
                    }
                    return;
                }
            }

            console.warn("Unexpected message format:", msg);
        });

        return () => {
            userSocket.close();
        };
    }, [activeCommand]);

    const formatTimestamp = (timestamp) => {
        if (!timestamp || typeof timestamp !== "object") return "N/A";
        const millis = timestamp._seconds * 1000 + Math.floor(timestamp._nanoseconds / 1e6);
        return new Date(millis).toLocaleString();
    };

    const handleApprove = (refund) => {
        const socket = socketRef.current;
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(`[Approve_Refund] ${JSON.stringify({
                userId: refund.userId,
                transactionId: refund.transactionId
            })}`);
        }
    };

    const handleReject = (refund) => {
        const socket = socketRef.current;
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(`[Reject_Refund] ${JSON.stringify({
                userId: refund.userId,
                transactionId: refund.transactionId
            })}`);
        }
    };

    const handleFetch = (command) => {
        const socket = socketRef.current;
        if (socket && socket.readyState === WebSocket.OPEN) {
            setActiveCommand(command);
            socket.send(`[${command}]`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-6xl mx-auto w-full">
                <h1 className="text-2xl font-bold text-center mb-4">Refund Requests</h1>

                <div className="flex justify-center gap-4 mb-6">
                    <button
                        onClick={() => handleFetch("Fetch_Refunds_Unapproved")}
                        className={`px-4 py-2 rounded ${activeCommand === "Fetch_Refunds_Unapproved" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                    >
                        Unapproved
                    </button>
                    <button
                        onClick={() => handleFetch("Fetch_Refunds_Approved")}
                        className={`px-4 py-2 rounded ${activeCommand === "Fetch_Refunds_Approved" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                    >
                        Approved
                    </button>
                    <button
                        onClick={() => handleFetch("Fetch_Refunds_Rejected")}
                        className={`px-4 py-2 rounded ${activeCommand === "Fetch_Refunds_Rejected" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                    >
                        Rejected
                    </button>
                </div>

                <div className="w-full overflow-x-auto">
                    <table className="table-auto w-full border border-collapse">
                        <thead>
                            <tr className="bg-gray-200 text-left">
                                <th className="py-2 px-4 border">Status</th>
                                <th className="py-2 px-4 border">Reason</th>
                                <th className="py-2 px-4 border">Total Amount</th>
                                <th className="py-2 px-4 border">Requested At</th>
                                <th className="py-2 px-4 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {refunds.map((refund, index) => (
                                <tr key={index} className="whitespace-nowrap">
                                    <td className="py-2 px-4 border">{refund.status}</td>
                                    <td className="py-2 px-4 border">{refund.reason}</td>
                                    <td className="py-2 px-4 border">₱{refund.totalAmount}</td>
                                    <td className="py-2 px-4 border">{formatTimestamp(refund.requestedAt)}</td>
                                    <td className="py-2 px-4 border">
                                        {activeCommand === "Fetch_Refunds_Unapproved" ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApprove(refund)}
                                                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(refund)}
                                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500 italic">No actions</span>
                                        )}
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

export default ModList;
