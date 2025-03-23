import React from 'react';
import { useLocation } from 'react-router-dom';

const FullReport = () => {
  const location = useLocation();
  const { disaster } = location.state || {}; // Get the disaster data from the state

  if (!disaster) {
    return <div className="text-center py-10">No report data found.</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-8">
        <h1 className="text-5xl font-black text-red-700 mb-8">{disaster.Name}</h1>

        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-3xl font-bold mb-4">{disaster.Name}</h2>
          <p className="text-lg text-gray-700 mb-4">{disaster.info}</p>
          <p className="text-sm text-gray-500 mb-1">Status: {disaster.Status}</p>
          <p className="text-sm text-gray-500 mb-1">Country: {disaster.Region}</p>
          <p className="text-sm text-gray-500 mb-1">Disaster Type: {disaster.Disaster_Type}</p>
          <p className="text-sm text-gray-500 mb-1">Date: {disaster.Date}</p>
          {disaster.Image_Path && (
            <img
              src={disaster.Image_Path}
              alt={disaster.Name}
              className="w-full h-64 object-cover rounded-lg mt-4"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FullReport;
