// frontend/src/components/SectionHeader.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SectionHeader = ({ title }) => {
  return (
    <div className="flex justify-between items-center mb-6 mt-16">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
      <div className="flex items-center gap-2">
        <button className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors">
          View All
        </button>
        <button className="bg-gray-100 hover:bg-gray-200 p-2 rounded-md text-gray-600 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <button className="bg-gray-100 hover:bg-gray-200 p-2 rounded-md text-gray-600 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default SectionHeader;