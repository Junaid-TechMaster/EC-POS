import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SectionHeader = ({ title, viewAllLink, onPrev, onNext }) => {
  return (
    <div className="flex justify-between items-center mb-6 mt-16">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
      <div className="flex items-center gap-2">
        {viewAllLink ? (
          <Link to={viewAllLink} className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors">
            View All
          </Link>
        ) : (
          <button className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors">
            View All
          </button>
        )}
        <button onClick={onPrev} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-md text-gray-600 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <button onClick={onNext} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-md text-gray-600 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default SectionHeader;
