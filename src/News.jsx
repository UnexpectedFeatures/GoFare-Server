import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "./ThemeContext"; 

const DisasterNews = () => {
  const { darkMode } = useTheme();
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDisasterType, setSelectedDisasterType] = useState("");
  const [filteredStatuses, setFilteredStatuses] = useState([]);
  const [filteredDates, setFilteredDates] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchDisasters = async () => {
      try {
        const response = await fetch(
          "https://api.reliefweb.int/v1/disasters?appname=YOUR_APP_NAME&filter[field]=country&filter[value]=PHL&sort[]=date:desc&fields[include][]=name&fields[include][]=glide&fields[include][]=status&fields[include][]=type&fields[include][]=country&fields[include][]=date&fields[include][]=description"
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const disastersWithDetails = await Promise.all(
          data.data.map(async (disaster) => {
            const { trimmedName, extractedDate } = splitDisasterName(disaster.fields.name);

            return {
              id: disaster.id,
              name: trimmedName,
              date: extractedDate || "Unknown",
              glide: disaster.fields.glide || "N/A",
              status: capitalizeFirstLetter(disaster.fields.status || "Unknown"),
              disasterType: disaster.fields.type?.[0]?.name || "Unknown",
              affectedArea: disaster.fields.country?.[0]?.name || "Unknown",
              description: disaster.fields.description || "No description available", // Add description field
            };
          })
        );

        setDisasters(disastersWithDetails);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDisasters();
  }, []);

  const splitDisasterName = (name) => {
    if (!name) return { trimmedName: "Unknown", extractedDate: "Unknown" };
    const parts = name.split(" - ");
    return { trimmedName: parts[0], extractedDate: parts[1] || "Unknown" };
  };

  const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      closeDialog();
    }
  };

  const renderDescriptionWithLinks = (description) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return description.split(urlRegex).map((part, index) =>
      urlRegex.test(part) ? (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500">
          {part}
        </a>
      ) : (
        part
      )
    );
  };

  const handleFilterChange = (event, type) => {
    const value = event.target.value;
  
    if (type === "search") {
      setSearchQuery(value);
    } else if (type === "disasterType") {
      setSelectedDisasterType(value);
      setSelectedStatus("");
      setSelectedDate("");
  
      if (value) {
        const filtered = disasters.filter(d => d.disasterType === value);
        setFilteredStatuses([...new Set(filtered.map(d => d.status))]);
        setFilteredDates([...new Set(filtered.map(d => d.date))]);
      } else {
        setFilteredStatuses([]);
        setFilteredDates([]);
      }
    } else if (type === "status") {
      setSelectedStatus(value);
    } else if (type === "date") {
      setSelectedDate(value);
    }
  };

  const filteredDisasters = disasters.filter((disaster) => {
    return (
      disaster.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedDisasterType ? disaster.disasterType === selectedDisasterType : true) &&
      (selectedStatus ? disaster.status === selectedStatus : true) &&
      (selectedDate ? disaster.date === selectedDate : true)
    );
  });

  const openDialog = (disaster) => {
    setSelectedDisaster(disaster);
    setIsDialogOpen(true);
    document.body.style.overflow = 'hidden'; // Disable scroll
  };
  
  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedDisaster(null);
    document.body.style.overflow = 'auto'; // Re-enable scroll
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="container mx-auto p-8 sm:mt-[-140px]">
          <h1 className="text-5xl font-black text-red-700 mb-8 ml-16">HEADLINES</h1>
          <div className="flex flex-col md:flex-row">
            {/* Search Section */}
            <div className={`${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-700"} shadow-gray-800 rounded-2xl p-6 w-full lg:w-1/3 h-fit`}>
              <h2 className="text-3xl font-black mb-4">SEARCH</h2>

              <input
                className="text-gray-700 w-full py-2 px-4 mb-4 border border-gray-300 rounded-lg bg-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Typhoon Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {/* Disaster Type Dropdown */}
              <label className="block text-lg font-semibold text-gray-700 mb-2">Disaster Type:</label>
              <select 
                className="w-full py-2 px-4 mb-4 border border-gray-300 rounded-lg text-gray-500 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                value={selectedDisasterType} onChange={(e) => handleFilterChange(e, "disasterType")}
              >
                <option value="">Select Disaster Type</option>
                {[...new Set(disasters.map(d => d.disasterType))].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              {/* Status Dropdown */}
              {selectedDisasterType && (
                <>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">Status:</label>
                  <select
                    className="text-gray-700 w-full py-2 px-4 mb-4 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={selectedStatus}
                    onChange={(e) => handleFilterChange(e, "status")}
                    disabled={!selectedDisasterType}
                  >
                    <option value="">Select Status</option>
                    {filteredStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>

                  {/* Date Dropdown */}
                  <label className="block text-lg font-semibold text-gray-700 mb-2">Date:</label>
                  <select
                    className="text-gray-700 w-full py-2 px-4 mb-4 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={selectedDate}
                    onChange={(e) => handleFilterChange(e, "date")}
                    disabled={!selectedDisasterType}
                  >
                    <option value="">Select Date</option>
                    {filteredDates.map((date) => (
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>
                </>
              )}
            </div>

            {/* Disaster News List */}
            <div className="md:w-3/4 p-4">
              <div className={`w-full ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-700" } rounded-2xl p-4`}>
                <h1 className={`text-3xl font-semibold mb-3 text-center ${darkMode ? "text-white" : "text-gray-600"}`}>Disaster News in the Philippines</h1>
                {filteredDisasters.length === 0 ? (
                  <div className="text-gray-500 text-center p-4">No disaster reports available.</div>
                ) : (
                  <ul>
                    {filteredDisasters.map((disaster) => (
                      <li key={disaster.id} className={`mb-10 p-4 rounded-lg shadow-md  hover:shadow-lg transition ${darkMode ? "bg-gray-800 text-white shadow-white" : "text-gray-700 bg-white shadow-gray-600"}`}>
                        <h3 className="text-xl font-bold">{disaster.name}</h3>
                        <p className="mt-2"><strong>Status:</strong> {disaster.status}</p>
                        <p className="mt-2"><strong>Disaster Type:</strong> {disaster.disasterType}</p>
                        <p className="mt-2"><strong>Date:</strong> {disaster.date}</p>
                        <button
                          className="mt-4 text-blue-500 hover:text-blue-700"
                          onClick={() => openDialog(disaster)}
                        >
                          View Full Report
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dialog */}
      {isDialogOpen && selectedDisaster && (
        <div
          className="fixed inset-0 flex justify-center items-center bg-black/40 z-50"
          onClick={handleOverlayClick}
        >
          <div className="bg-white p-8 rounded-lg w-96 sm:w-200 overflow-y-auto max-h-[80vh]">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{selectedDisaster.name}</h2>
            <p className="text-gray-700 mb-4">
              {renderDescriptionWithLinks(selectedDisaster.description)}
            </p>
            <button
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
              onClick={closeDialog}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisasterNews;
