import React from 'react';

const Donation = () => {
  return (
    <div className="flex justify-center items-center min-h-screen pb-20">
      <div className="w-full max-w-2xl shadow-2xl rounded-xl bg-white p-8">
        <div className="text-center mb-6">
          <svg className="mx-auto mb-4 text-red-500 w-16 h-16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v18M3 12h18" />
          </svg>
          <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Disaster Relief Donation</h2>
          <p className="text-lg text-gray-600 mb-6">
            Your generous donation will help victims of natural disasters. Together, we can rebuild lives and provide hope.
          </p>
        </div>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">Bank Details for Donations:</h3>
        <div className="space-y-6 text-left text-gray-700 mb-6">
          <div>
            <p><strong>BDO (Banco de Oro)</strong></p>
            <p><strong>Account Name:</strong> GMA Disaster Relief Fund</p>
            <p><strong>Account Number:</strong> 123-456-7890</p>
            <p><strong>SWIFT Code:</strong> BNORPHMM</p>
            <a href="https://www.bdo.com.ph" target="_blank" rel="noopener noreferrer">
              <button className="mt-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg w-full hover:bg-blue-700">
                Donate via BDO
              </button>
            </a>
          </div>

          <div>
            <p><strong>Metrobank</strong></p>
            <p><strong>Account Name:</strong> GMA Disaster Relief Fund</p>
            <p><strong>Account Number:</strong> 987-654-3210</p>
            <p><strong>SWIFT Code:</strong> MBTCPHMM</p>
            <a href="https://www.metrobank.com.ph" target="_blank" rel="noopener noreferrer">
              <button className="mt-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg w-full hover:bg-blue-700">
                Donate via Metrobank
              </button>
            </a>
          </div>

          <div>
            <p><strong>Bank of the Philippine Islands (BPI)</strong></p>
            <p><strong>Account Name:</strong> GMA Disaster Relief Fund</p>
            <p><strong>Account Number:</strong> 555-666-7777</p>
            <p><strong>SWIFT Code:</strong> BOPIPHMM</p>
            <a href="https://www.bpi.com.ph" target="_blank" rel="noopener noreferrer">
              <button className="mt-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg w-full hover:bg-blue-700">
                Donate via BPI
              </button>
            </a>
          </div>

          <div>
            <p><strong>Land Bank of the Philippines</strong></p>
            <p><strong>Account Name:</strong> GMA Disaster Relief Fund</p>
            <p><strong>Account Number:</strong> 112-233-4455</p>
            <p><strong>SWIFT Code:</strong> LANAPHMM</p>
            <a href="https://www.landbank.com" target="_blank" rel="noopener noreferrer">
              <button className="mt-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg w-full hover:bg-blue-700">
                Donate via Land Bank
              </button>
            </a>
          </div>

          <div>
            <p><strong>UnionBank of the Philippines</strong></p>
            <p><strong>Account Name:</strong> GMA Disaster Relief Fund</p>
            <p><strong>Account Number:</strong> 778-899-0000</p>
            <p><strong>SWIFT Code:</strong> UBPHPHMM</p>
            <a href="https://www.unionbankph.com" target="_blank" rel="noopener noreferrer">
              <button className="mt-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg w-full hover:bg-blue-700">
                Donate via UnionBank
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Donation;
