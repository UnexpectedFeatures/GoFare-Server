import React, { useEffect, useState } from 'react';
import { motion } from "framer-motion";
//-----------------------------------This is the Dialog/Modal---------------------------------------

const Dialog = ({ isOpen, onClose, content }) => { 
  const dialogRef = React.useRef(null);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.showModal();
      document.body.style.overflow = 'hidden'; 
    } else {
      dialogRef.current.close();
      document.body.style.overflow = 'auto';
    }
  }, [isOpen]);

  const handleOutsideClick = (e) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="p-4 w-4/5 max-w-3xl bg-white rounded-lg shadow-xl border-2 ml-[50vh] mt-4"
      onClick={handleOutsideClick}
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-2xl font-semibold text-gray-600 hover:text-gray-900"
      >
        <i className="fa-solid fa-xmark"></i>
      </button>
      <h2 className="text-2xl font-semibold mb-4">Disaster Report Details</h2>
      <div className="text-sm text-gray-700 space-y-4">
        <p className="mb-2"><strong className="text-lg font-medium">Report Body:</strong></p>
        <div
          className="content-body"
          dangerouslySetInnerHTML={{ __html: content }} // This will render HTML content if available
        ></div>
      </div>
      <div className="mt-6">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
        >
          Close
        </button>
      </div>
    </dialog>
  );
};


//-----------------------------------This is the outside---------------------------------------

const DisasterNews = () => {
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState('');

  // Function to fetch the full details of a specific disaster
  const fetchDisasterDetails = async (disasterId) => {
    try {
      const response = await fetch(`https://api.reliefweb.int/v1/reports/${disasterId}?appname=YOUR_APP_NAME`);
      if (!response.ok) {
        throw new Error(`Failed to fetch details for disaster ID ${disasterId}`);
      }
      const data = await response.json();
      console.log(JSON.stringify(data.data[0]), null, 2);
      return data.data[0]; // Return the full disaster report details
    } catch (error) {
      console.error('Error fetching disaster details:', error);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleViewFullReport = async (disasterId) => {
    const fullDetails = await fetchDisasterDetails(disasterId);
    if (fullDetails) {
      setDialogContent(
        fullDetails.fields.body ||
        fullDetails.fields.summary ||
        'No detailed body available for this report.'
      );
      setIsDialogOpen(true); // Open the dialog
    }
  };

  useEffect(() => {
    const fetchDisasters = async () => {
      try {
        const response = await fetch('https://api.reliefweb.int/v1/reports?appname=REPLACE-WITH-A-DOMAIN-OR-APP-NAME&query[value]=disaster&filter[field]=country&filter[value]=PHL&limit=30');
        if (!response.ok) {         
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log(JSON.stringify(data.data[0]));
        setDisasters(data.data); // Store the disaster list
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchDisasters();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto p-8">
          <h1 className="text-5xl font-black text-red-700 mb-8 ml-16">HEADLINES</h1>
          
          <div className="flex gap-8 mb-8">
            {/* Search Section */}
            <div className="bg-white shadow-gray-800 rounded-2xl p-6 w-full lg:w-1/3 h-fit">
              <h2 className="text-3xl font-black mb-4">SEARCH</h2>
              
              {/* Typhoon Name Input */}
              <input
                className="w-full py-2 px-4 mb-4 border border-gray-300 rounded-lg bg-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Typhoon Name"
              />
              
              {/* Status Dropdown */}
              <label className="block text-lg font-semibold text-gray-700 mb-2">Status:</label>
              <select
                className="w-full py-2 px-4 mb-4 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                id="statusOption"
              >
                <option value="">Select Status</option>
              </select>
              
              {/* Area Dropdown */}
              <label className="block text-lg font-semibold text-gray-700 mb-2">Area:</label>
              <select
                className="w-full py-2 px-4 mb-4 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                id="areaOption"
              >
                <option value="">Select Area</option>
              </select>
              
              {/* Disaster Type Dropdown */}
              <label className="block text-lg font-semibold text-gray-700 mb-2">Disaster Type:</label>
              <select
                className="w-full py-2 px-4 mb-4 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                id="disasterOption"
              >
                <option value="">Select Disaster Type</option>
              </select>
              
              {/* Date Dropdown */}
              <label className="block text-lg font-semibold text-gray-700 mb-2">Date:</label>
              <select
                className="w-full py-2 px-4 mb-4 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                id="dateOption"
              >
                <option value="">Select Date</option>
              </select>
            </div>

            {/* Disaster News List */}
            <div className="w-full lg:w-2/3 bg-white rounded-2xl p-4">
              <h1 className="text-3xl font-semibold mb-3 text-center text-gray-600">Disaster News in the Philippines</h1>

              <ul>
                {disasters.map((disaster) => (
                  <li key={disaster.id} className="mb-10 p-4 bg-white rounded-lg shadow-gray-600 shadow-md hover:shadow-lg transition">
                    <h3 className="text-xl font-bold text-gray-800">{disaster.fields.title}</h3>
                    
                    {/* Check if disaster_type exists and is an array within fields */}
                    <p className="text-sm text-gray-700">
                      <strong>Status:</strong> 
                      {disaster.disaster_type && disaster.disaster_type.length > 0 
                        ? disaster.disaster_type.map((type, index) => (
                            <span key={index}>{type.name}{index < disaster.disaster_type.length - 1 && ', '}</span>
                          )) 
                        : 'N/A'}
                    </p>

                    <p className="text-sm text-gray-700"><strong>Status:</strong> {disaster.fields.status || 'N/A'}</p>
                    <p className="text-sm text-gray-700"><strong>Source:</strong> {disaster.fields.source || 'N/A'}</p>
                    <p className="text-sm text-gray-700"><strong>Date:</strong> {disaster.fields.include || 'N/A'}</p>

                    {/* Button to fetch and view the full report details */}
                    <button
                      onClick={() => handleViewFullReport(disaster.id)}
                      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-500 transition"
                    >
                      View Full Report
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Dialog to show disaster details */}
          <Dialog isOpen={isDialogOpen} onClose={handleDialogClose} content={dialogContent} />
        </div>
      </motion.div>
    </div>
  );
};

export default DisasterNews;
