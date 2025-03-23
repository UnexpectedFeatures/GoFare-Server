import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const DisasterNews = () => {
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchDisasters() {
    try {
        const response = await fetch('https://api.https://reliefweb.int/disasters?list=Philippines+Disasters&advanced-search=%28C188%29&fbclid=IwY2xjawJF9HdleHRuA2FlbQIxMAABHZnjf6Jj6TChXf_Cs30qII1sbzPVLqb9W0-7ObjAkyBVXOeIaKnHivBr4g_aem_O2VI6DMaQ79x6LCv0rexDw/v1/reports?appname=YOUR_APP_NAME');
        const data = await response.json();
      
        console.log(data); 
        
        const disasterReports = data.data || [];
        setDisasters(disasterReports);
        setLoading(false);
    } catch (error) {
        console.error('Error fetching disasters:', error);
        setLoading(false);
    }
  }

  useEffect(() => {
    fetchDisasters();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-8">
        <h1 className="text-5xl font-black text-red-700 mb-8 ml-19">HEADLINES</h1>

        <div className="flex flex-wrap gap-8 mb-8">

          {/* Search Section */}
          <div className="bg-white shadow-gray-800 rounded-2xl p-6 w-full max-w-md h-fit">
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
              {/* Add options here */}
            </select>

            {/* Area Dropdown */}
            <label className="block text-lg font-semibold text-gray-700 mb-2">Area:</label>
            <select
              className="w-full py-2 px-4 mb-4 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              id="areaOption"
            >
              <option value="">Select Area</option>
              {/* Add options here */}
            </select>

            {/* Disaster Type Dropdown */}
            <label className="block text-lg font-semibold text-gray-700 mb-2">Disaster Type:</label>
            <select
              className="w-full py-2 px-4 mb-4 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              id="disasterOption"
            >
              <option value="">Select Disaster Type</option>
              {/* Add options here */}
            </select>

            {/* Date Dropdown */}
            <label className="block text-lg font-semibold text-gray-700 mb-2">Date:</label>
            <select
              className="w-full py-2 px-4 mb-4 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              id="dateOption"
            >
              <option value="">Select Date</option>
              {/* Add options here */}
            </select>
          </div>

          {/* Disaster News Section */}
          <div className="flex-1 w-full">
            {disasters.length === 0 ? (
              <p>No disasters found.</p>
            ) : (
              disasters.map((disaster, index) => (
                <div key={index} className="bg-white shadow-lg rounded-lg p-6 mb-6 flex flex-col md:flex-row max-w-2xl">
                  <div className="flex-none mb-4 md:mb-0 md:w-1/3">
                    {disaster.image_url ? (
                      <img src={disaster.image_url} alt={disaster.title} className="w-full h-64 object-cover rounded-lg" />
                    ) : (
                      <p>No image available</p>
                    )}
                  </div>
                  <div className="flex-1 md:ml-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{disaster.title}</h2> 
                    <p className="text-sm text-gray-500 mb-1">Status: {disaster.status}</p> 
                    <p className="text-sm text-gray-500 mb-1">Country: {disaster.country}</p> {/* Use 'country' if it's available */}
                    <p className="text-sm text-gray-500 mb-1">Disaster Type: {disaster.disaster_type}</p> {/* Assuming disaster_type is the correct property */}
                    <p className="text-sm text-gray-500 mb-1">Date: {disaster.date}</p> 
                    <p className="text-sm text-gray-700 mt-2">{disaster.body}</p> {/* Assuming 'body' holds the description or details */}

                    <Link
                      to={`/report/${disaster.ID}`} 
                      state={{ disaster }}    
                      className="text-red-500 mt-4 inline-block"
                    >
                      Read Full Report
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisasterNews;
