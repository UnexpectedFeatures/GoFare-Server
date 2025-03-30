import { useState, useEffect } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, AlertTriangle, Check, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeContext"; 


const disasters = [
  {
    type: "Earthquake",
    description: "Sudden shaking of the ground caused by movements in the Earth's crust.",
    response: "If trapped, tap on a pipe or wall to help rescuers locate you.",
    tips: [
      "Drop to the ground, take cover under sturdy furniture, and hold on.",
      "Stay away from windows, exterior walls, and heavy furniture that could fall.",
      "If outdoors, move to an open area away from buildings, trees, and power lines.",
      "After shaking stops, check yourself and others for injuries before helping."
    ]
  },
  {
    type: "Flood",
    description: "Overflow of water that submerges normally dry land.",
    response: "Move to higher ground immediately and avoid walking or driving through floodwaters.",
    tips: [
      "Evacuate if instructed by authorities.",
      "Avoid contact with floodwater as it may be contaminated.",
      "Do not attempt to cross flowing streams on foot.",
      "Turn off utilities if instructed to do so."
    ]
  },
  {
    type: "Volcanic Eruption",
    description: "Eruption of molten rock, ash, and gases from a volcano.",
    response: "Stay indoors with windows and doors closed to avoid inhaling ash.",
    tips: [
      "Follow evacuation orders if issued.",
      "Wear masks and goggles to protect from ashfall.",
      "Avoid river valleys and low-lying areas.",
      "Prepare emergency supplies, including food, water, and masks."
    ]
  },
  {
    type: "Typhoon",
    description: "A powerful tropical storm with strong winds and heavy rainfall.",
    response: "Stay indoors and away from windows. Evacuate if instructed.",
    tips: [
      "Secure outdoor objects that could become projectiles.",
      "Stock up on emergency supplies.",
      "Avoid low-lying areas prone to flooding.",
      "Listen to weather updates and warnings."
    ]
  }
];

function Home() {
  const { darkMode } = useTheme();
  const [index, setIndex] = useState(0);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/events/getEvents");
        setEvents(response.data);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, []);

  const nextTip = () => setIndex((prev) => (prev + 1) % disasters.length);
  const prevTip = () => setIndex((prev) => (prev - 1 + disasters.length) % disasters.length);
  const setTip = (i) => setIndex(i);

  const getBackgroundColor = (type) => {
    switch (type) {
      case "Earthquake":
        return "bg-yellow-500"; 
      case "Flood":
        return "bg-green-500"; 
      case "Typhoon":
        return "bg-blue-500"; 
      case "Volcanic Eruption":
        return "bg-red-500";
      default:
        return "bg-gray-500"; 
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4">
      <h1 className="text-4xl font-bold flex">Disaster Safety Tips</h1>
      <p className="text-gray-500 font-medium mt-1">
        *Learn how to protect yourself and your loved ones during various natural disasters.*
      </p>

      <div className="relative mt-6">
        {/* Navigation Arrows */}
        <button onClick={prevTip} className="absolute -left-10 sm:-left-12 top-1/2 transform -translate-y-1/2 bg-gray-300 p-2 sm:p-3 rounded-full shadow-md">
          <ChevronLeft className="w-5 h-5" />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={disasters[index].type}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`w-[400px] h-[400px] sm:w-[700px] bg-white shadow-lg rounded-lg flex overflow-hidden`}
          >
            {/* Disaster Image & Info */}
            <div className={`w-1/2 p-6 text-white flex flex-col justify-between ${getBackgroundColor(disasters[index].type)}`}>
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">{disasters[index].type}</h2>
                </div>
                <p className="text-sm mb-4">{disasters[index].description}</p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Shield className="w-4 h-4" /> Emergency Response
                </div>
                <p className="text-sm mt-2">{disasters[index].response}</p>
              </div>
            </div>

            {/* Safety Tips */}
            <div className={`w-1/2 p-6 flex flex-col justify-between ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-700"}`}>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" /> Safety Tips
              </h3>
              <ul className="mt-4 space-y-2">
                {disasters[index].tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-yellow-500" /> {tip}
                  </li>
                ))}
              </ul>
            </div>

          </motion.div>
        </AnimatePresence>

        <button onClick={nextTip} className="absolute -right-10 sm:-right-12 top-1/2 transform -translate-y-1/2 bg-gray-300 p-2 sm:p-3 rounded-full shadow-md">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Dots Navigation */}
      <div className="mt-4 flex gap-2">
        {disasters.map((_, i) => (
          <button key={i} onClick={() => setTip(i)} className={`w-3 h-3 rounded-full ${index === i ? "bg-gray-700" : "bg-gray-400"}`} />
        ))}
      </div>

      {/* Events Section */}

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-center mb-6">Upcoming Events</h2>

        {events.length === 0 ? (
          <div className={`${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-700"} p-6 rounded-lg shadow-md text-center`}>
            <p className="text-gray-500">No events available.</p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-gray-50 rounded-lg shadow-lg overflow-hidden w-full sm:w-80 md:w-96 lg:w-2/5 flex flex-col relative">

                {/* Image Container */}
                {event.image && (
                  <div className="w-full h-40 bg-gray-200 flex justify-center items-center overflow-hidden">
                    <img 
                      src={`http://localhost:5000${event.image}`} 
                      alt={event.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Info Container */}
                <div className={`p-4 flex-1 ${darkMode ? "bg-gray-700 text-white" : "bg-gray-50 text-gray-800"}`}>

                  {/* Location at Top */}
                  {event.location && (
                    <div className="text-sm mb-2">
                      <strong>Location:</strong> {event.location}
                    </div>
                  )}

                  <h3 className="text-lg font-semibold">{event.title}</h3>
                  <p className={`text-sm ${darkMode ? "text-white/70" : "text-gray-600"}`}>
                    {new Date(event.date).toLocaleDateString("en-US", { 
                      year: "numeric", 
                      month: "long", 
                      day: "numeric" 
                    })}
                  </p>
                  <p className="mt-2">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
