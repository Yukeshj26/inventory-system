import React, { useState } from 'react';
import { QrCode, RefreshCcw, MapPin, User } from 'lucide-react';

const Scanner = () => {
  const [scannedData, setScannedData] = useState(null);

  // Mock function to simulate a scan result
  const handleSimulateScan = () => {
    setScannedData({
      id: "AST-9021",
      name: "MacBook Pro M2",
      currentLocation: "CS Lab 1",
      custodian: "Dr. Aris"
    });
  };

  return (
    <div className="max-w-md mx-auto space-y-6 text-center">
      <h1 className="text-2xl font-bold">Field Verification</h1>
      
      {/* Scanner Viewport */}
      <div className="aspect-square bg-black rounded-3xl relative overflow-hidden flex items-center justify-center border-4 border-white shadow-xl">
        <div className="absolute inset-0 border-[2px] border-blue-500 opacity-50 animate-pulse m-12 rounded-lg"></div>
        <QrCode size={80} className="text-white opacity-20" />
        <button 
          onClick={handleSimulateScan}
          className="absolute bottom-4 bg-white text-black px-4 py-2 rounded-full text-xs font-bold"
        >
          [Tap to Simulate Scan]
        </button>
      </div>

      {/* Scan Results Card */}
      {scannedData && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-left animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">{scannedData.name}</h2>
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{scannedData.id}</span>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3 text-gray-600 text-sm">
              <MapPin size={16} /> <span>Current: {scannedData.currentLocation}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-600 text-sm">
              <User size={16} /> <span>Custodian: {scannedData.custodian}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="bg-blue-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2">
              <RefreshCcw size={16} /> <span>Update Location</span>
            </button>
            <button className="bg-gray-100 text-gray-800 py-3 rounded-xl font-bold text-sm">
              Report Damage
            </button>
          </div>
        </div>
      )}

      <p className="text-gray-400 text-xs px-8">
        Scanning automatically logs your GPS location and timestamp to the Blockchain Audit Trail.
      </p>
    </div>
  );
};

export default Scanner;