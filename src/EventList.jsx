import { useEffect, useState } from "react";

export default function EventList() {
    const [events, setEvents] = useState([]);

    // Fetch all events
    const fetchEvents = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/events/allEvents");
            if (response.ok) {
                const data = await response.json();
                setEvents(data);
            } else {
                console.error("Failed to fetch events");
            }
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    };

    // Toggle event status (Activate/Deactivate)
    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === "active" ? "inactive" : "active";

        try {
            const response = await fetch(`http://localhost:5000/api/events/updateStatus/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                setEvents(prevEvents => 
                    prevEvents.map(event => 
                        event.id === id ? { ...event, status: newStatus } : event
                    )
                );
            } else {
                console.error("Failed to update status");
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    // Delete an event
    const deleteEvent = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this event?");
        if (!confirmDelete) return;

        try {
            const response = await fetch(`http://localhost:5000/api/events/delete/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
            } else {
                console.error("Failed to delete event");
            }
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    };

    // Format date function
    const formatDate = (dateString) => {
        const options = { year: "numeric", month: "long", day: "numeric" };
        return new Date(dateString).toLocaleDateString("en-US", options);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="max-w-4xl w-full mx-auto p-6 bg-white shadow-lg rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-center">Event List</h2>

                {events.length === 0 ? (
                    <p className="text-center text-gray-500">No events found.</p>
                ) : (
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border border-gray-300 p-2">Title</th>
                                <th className="border border-gray-300 p-2">Date</th>
                                <th className="border border-gray-300 p-2">Status</th>
                                <th className="border border-gray-300 p-2">Activate/Deactivate</th>
                                <th className="border border-gray-300 p-2">Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map(event => (
                                <tr key={event.id} className="text-center">
                                    <td className="border border-gray-300 p-2">{event.title}</td>
                                    <td className="border border-gray-300 p-2">{formatDate(event.date)}</td>
                                    <td className={`border border-gray-300 p-2 ${event.status === "active" ? "text-green-500" : "text-red-500"}`}>
                                        {event.status}
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <button 
                                            onClick={() => toggleStatus(event.id, event.status)}
                                            className={`px-3 py-1 rounded text-white ${event.status === "active" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
                                        >
                                            {event.status === "active" ? "Deactivate" : "Activate"}
                                        </button>
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <button 
                                            onClick={() => deleteEvent(event.id)}
                                            className="px-3 py-1 rounded text-white bg-gray-500 hover:bg-gray-600"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
