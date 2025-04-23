import React, { useEffect, useState } from "react";
import axios from "axios";

function AccountAppeal() {
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionType, setActionType] = useState("unban");
    const [showModal, setShowModal] = useState(false);
    const [newRfid, setNewRfid] = useState(""); // New state for RFID input

    const roles = localStorage.getItem("userRole");

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (users.length > 0) fetchRequests();
    }, [users]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/auth/users/${roles}`);
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchRequests = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/banRequest/allBanRequests");
            const filtered = response.data.filter(r => !isOlderThan30Days(r.created_at));
            const valid = filtered.filter(r => users.some(u => u.email === r.email));
            setRequests(valid);
        } catch (error) {
            console.error("Error fetching requests:", error);
        }
    };

    const isOlderThan30Days = (date) => {
        const days = (new Date() - new Date(date)) / (1000 * 3600 * 24);
        return days > 30;
    };

    const openApproveModal = (request) => {
        setSelectedRequest(request);
        setActionType("unban");
        setNewRfid(""); // Reset RFID input
        setShowModal(true);
    };

    const handleApprove = async () => {
        const email = selectedRequest.email;
        try {
            let response;

            switch (actionType) {
                case "unban":
                    response = await axios.post(`http://localhost:5000/api/auth/users/unban/${email}`);
                    break;
                case "ban":
                    response = await axios.post(`http://localhost:5000/api/auth/users/ban/${email}`);
                    break;
                case "refund":
                    response = await axios.post(`http://localhost:5000/api/refund/process`, { email });
                    break;
                case "renewal":
                    if (!newRfid.trim()) {
                        alert("Please enter a new RFID ID.");
                        return;
                    }
                    response = await axios.post(`http://localhost:5000/api/subscription/renew`, { email, newRfid });
                    break;
                case "rfid_activation":
                    response = await axios.post(`http://localhost:5000/api/rfid/activate`, { email });
                    break;
                case "rfid_deactivation":
                    response = await axios.post(`http://localhost:5000/api/rfid/deactivate`, { email });
                    break;
                default:
                    alert("Unknown action");
                    return;
            }

            if (response.status === 200) {
                setRequests(prev => prev.filter(r => r.email !== email));
                alert(`${actionType} action for ${email} completed.`);
                setShowModal(false);
            }
        } catch (error) {
            console.error(`Error handling ${actionType}:`, error);
            alert("Failed to complete action.");
        }
    };

    const handleDelete = async (email) => {
        try {
            const response = await axios.delete(`http://localhost:5000/api/banRequest/delete/${email}`);
            if (response.status === 200) {
                setRequests(prev => prev.filter(r => r.email !== email));
                alert(`Request from ${email} deleted.`);
            }
        } catch (error) {
            console.error("Error deleting request:", error);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-6xl w-full">
                <h1 className="text-2xl font-bold mb-4 text-center">User Requests</h1>
                <table className="min-w-full border border-gray-300">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="py-2 px-4 border">Email</th>
                            <th className="py-2 px-4 border">Message</th>
                            <th className="py-2 px-4 border">Date</th>
                            <th className="py-2 px-4 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((req, i) => (
                            <tr key={i} className="border-t">
                                <td className="py-2 px-4 border">{req.email}</td>
                                <td className="py-2 px-4 border">{req.message}</td>
                                <td className="py-2 px-4 border">{new Date(req.created_at).toLocaleString()}</td>
                                <td className="py-2 px-4 border flex gap-2 justify-center">
                                    <button onClick={() => openApproveModal(req)} className="bg-green-500 px-3 py-1 text-white rounded">Approve</button>
                                    <button onClick={() => handleDelete(req.email)} className="bg-red-500 px-3 py-1 text-white rounded">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Select Action for {selectedRequest.email}</h2>
                        <select value={actionType} onChange={(e) => setActionType(e.target.value)} className="w-full p-2 mb-4 border rounded">
                            <option value="unban">Unban</option>
                            <option value="ban">Ban</option>
                            <option value="refund">Refund</option>
                            <option value="renewal">Renewal</option>
                            <option value="rfid_activation">RFID Activation</option>
                            <option value="rfid_deactivation">RFID Deactivation</option>
                        </select>

                        {actionType === "renewal" && (
                            <input
                                type="text"
                                placeholder="Enter new RFID ID"
                                value={newRfid}
                                onChange={(e) => setNewRfid(e.target.value)}
                                className="w-full p-2 mb-4 border rounded"
                            />
                        )}

                        <div className="flex justify-end gap-2">
                            <button className="bg-gray-300 px-3 py-1 rounded" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="bg-blue-600 px-3 py-1 text-white rounded" onClick={handleApprove}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AccountAppeal;
