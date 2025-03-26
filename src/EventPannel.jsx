import { useState } from "react";

export default function CreateEvent() {
    const [eventData, setEventData] = useState({
        title: "",
        description: "",
        date: "",
        image: null
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEventData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
    
        if (file) {
            e.target.value = ""; // Reset input to allow re-selecting the same file
            setEventData((prev) => ({ ...prev, image: file }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append("title", eventData.title);
        formData.append("description", eventData.description);
        formData.append("date", eventData.date);
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
                setEventData({ title: "", description: "", date: "", image: null });
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
                        <label className="block font-semibold">Upload Image:</label>
                        <input 
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full p-2 border rounded mt-1"
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
