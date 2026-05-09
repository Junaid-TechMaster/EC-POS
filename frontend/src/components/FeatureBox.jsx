import { Link } from 'react-router-dom';

const FeatureBox = ({
  icon,
  title,
  description,
  to = '/',
  iconBg = 'bg-gray-100',
  iconColor = 'text-gray-600',
  cardBg = 'bg-white',
  cardBorder = 'border-gray-100',
}) => (
  <Link
    to={to}
    className={`group flex flex-col items-center text-center gap-4 ${cardBg} border ${cardBorder} rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1.5 hover:scale-[1.03] transition-all duration-200 cursor-pointer`}
  >
    <div
      className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor} group-hover:scale-110 transition-transform duration-200`}
    >
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-gray-900 text-sm">{title}</h4>
      <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{description}</p>
    </div>
  </Link>
);

export default FeatureBox;
