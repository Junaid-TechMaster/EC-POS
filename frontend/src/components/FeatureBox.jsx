// frontend/src/components/FeatureBox.jsx
const FeatureBox = ({ icon, title, description }) => {
  return (
    <div className="border border-gray-200 rounded-xl p-6 flex flex-col gap-3 hover:shadow-md transition-shadow bg-white">
      <div className="text-gray-700">
        {icon}
      </div>
      <h4 className="font-bold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
};

export default FeatureBox;