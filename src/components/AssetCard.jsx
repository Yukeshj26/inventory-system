const AssetCard = ({ asset }) => {
  const statusColor = {
    'Available': 'bg-green-100 text-green-700',
    'In Use': 'bg-blue-100 text-blue-700',
    'Repair': 'bg-red-100 text-red-700'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-gray-800">{asset.name}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[asset.status]}`}>
          {asset.status}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-1">ID: <span className="font-mono">{asset.id}</span></p>
      <p className="text-sm text-gray-500 mb-4">Location: {asset.location}</p>
      
      <div className="flex space-x-2">
        <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
          View Details
        </button>
        <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
          <QrCode size={18} />
        </button>
      </div>
    </div>
  );
};
export default AssetCard;