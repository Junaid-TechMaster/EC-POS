// frontend/src/components/BlogCard.jsx
const BlogCard = ({ title, excerpt, date, category }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden group cursor-pointer border border-transparent hover:border-gray-200 hover:shadow-lg transition-all">
      {/* Blog Image Placeholder */}
      <div className="w-full h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
        <span className="text-gray-500 font-medium group-hover:scale-110 transition-transform duration-500">[ Blog Image ]</span>
      </div>
      <div className="p-6">
        <div className="flex gap-4 text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wider">
          <span>{date}</span>
          <span className="text-green-500">{category}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{excerpt}</p>
      </div>
    </div>
  );
};

export default BlogCard;