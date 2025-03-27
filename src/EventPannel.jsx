import { useState } from "react";

export default function EventPannel() {
    const [eventData, setEventData] = useState({
        title: "",
        description: "",
        date: "",
        startTime: "",
        endTime: "",
        image: null,
        location: "" // Change location to a string
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEventData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEventData((prev) => ({ ...prev, image: file }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append("title", eventData.title);
        formData.append("description", eventData.description);
        formData.append("date", eventData.date);
        formData.append("startTime", eventData.startTime);
        formData.append("endTime", eventData.endTime);
        formData.append("location", eventData.location); // Send location as a string
        if (eventData.image) {
            formData.append("image", eventData.image);
        }

        try {
            const response = await fetch("http://localhost:5000/api/events/createEvent", {
                method: "POST",
                body: formData,
            });
    
            if (response.ok) {
                alert("Event created successfully!");
                setEventData({
                    title: "",
                    description: "",
                    date: "",
                    startTime: "",
                    endTime: "",
                    image: null,
                    location: "" // Reset location to empty string
                });
            } else {
                alert("Failed to create event.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error creating event.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 mt-7">
            <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-center">Create New Event</h2>
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                    <div className="mb-4">
                        <label className="block font-semibold">Event Title:</label>
                        <input 
                            type="text"
                            name="title"
                            value={eventData.title}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded mt-1"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block font-semibold">Description:</label>
                        <textarea
                            name="description"
                            value={eventData.description}
                            onChange={handleChange}
                            required
                            rows="4"
                            className="w-full p-2 border rounded mt-1"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block font-semibold">Event Date:</label>
                        <input 
                            type="date"
                            name="date"
                            value={eventData.date}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded mt-1"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block font-semibold">Start Time:</label>
                        <input 
                            type="time"
                            name="startTime"
                            value={eventData.startTime}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded mt-1"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block font-semibold">End Time:</label>
                        <input 
                            type="time"
                            name="endTime"
                            value={eventData.endTime}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded mt-1"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block font-semibold">Upload Image:</label>
                        <input 
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full p-2 border rounded mt-1"
                        />
                    </div>
                    
                    {/* Location input field */}
                    <div className="mb-4">
                        <label className="block font-semibold">Event Location (Address):</label>
                        <input 
                            type="text"
                            name="location"
                            value={eventData.location}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded mt-1"
                            placeholder="Enter the event location"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
                    >
                        Create Event
                    </button>
                </form>
            </div>
        </div>
    );
}
