import { useState, useEffect, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import {
  ArrowLeft, Star, Trash2, Search, X, MessageSquare,
  Package, User, ChevronDown, ChevronUp, Filter,
} from 'lucide-react';

const API = '/api/products';

const StarRow = ({ rating, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star
        key={s}
        size={size}
        className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
      />
    ))}
  </div>
);

const Avatar = ({ name }) => {
  const colors = ['bg-violet-500','bg-blue-500','bg-green-500','bg-amber-500','bg-rose-500','bg-cyan-500','bg-pink-500'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
};

const StatCard = ({ label, value, sub, color, bg }) => (
  <div className={`${bg} rounded-2xl px-5 py-4 flex flex-col gap-1`}>
    <p className="text-xs font-semibold text-gray-500">{label}</p>
    <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400">{sub}</p>}
  </div>
);

const RATINGS = ['All', '5', '4', '3', '2', '1'];

export default function ReviewsManage() {
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState({});

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/reviews`, { withCredentials: true });
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(
        `${API}/${deleteTarget.productId}/reviews/${deleteTarget._id}`,
        { withCredentials: true }
      );
      setReviews(prev => prev.filter(r => r._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    let result = [...reviews];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.productName?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q)
      );
    }
    if (ratingFilter !== 'All') {
      result = result.filter(r => r.rating === Number(ratingFilter));
    }
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortBy === 'oldest') result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sortBy === 'high') result.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'low') result.sort((a, b) => a.rating - b.rating);
    return result;
  }, [reviews, search, ratingFilter, sortBy]);

  // Stats
  const total = reviews.length;
  const avg = total > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : '0.0';
  const fiveStar = reviews.filter(r => r.rating === 5).length;
  const oneStar  = reviews.filter(r => r.rating <= 2).length;

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="w-full px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors">
          <ArrowLeft size={16} /> Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <MessageSquare size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reviews &amp; Comments</h1>
            <p className="text-sm text-gray-500">{total} review{total !== 1 ? 's' : ''} across all products</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Reviews"   value={total}     color="text-gray-900"   bg="bg-white border border-gray-100 shadow-sm" />
        <StatCard label="Average Rating"  value={`★ ${avg}`} color="text-amber-500" bg="bg-amber-50" sub={`out of 5 stars`} />
        <StatCard label="5-Star Reviews"  value={fiveStar}  color="text-green-600"  bg="bg-green-50" sub={`${total > 0 ? ((fiveStar/total)*100).toFixed(0) : 0}% of total`} />
        <StatCard label="Poor (1-2 Star)" value={oneStar}   color="text-red-500"    bg="bg-red-50"   sub={`${total > 0 ? ((oneStar/total)*100).toFixed(0) : 0}% of total`} />
      </div>

      {/* Rating distribution bar */}
      {total > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">Rating Breakdown</p>
          <div className="flex flex-col gap-2">
            {[5,4,3,2,1].map(star => {
              const count = reviews.filter(r => r.rating === star).length;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-14 flex-shrink-0">
                    <span className="text-xs font-semibold text-gray-600">{star}</span>
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by reviewer, product or comment…"
            className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Rating filter pills */}
        <div className="flex items-center gap-1 flex-wrap">
          <Filter size={13} className="text-gray-400 mr-1" />
          {RATINGS.map(r => (
            <button
              key={r}
              onClick={() => setRatingFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                ratingFilter === r
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-amber-300'
              }`}
            >
              {r === 'All' ? 'All' : `${r} ★`}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 bg-white"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="high">Highest rating</option>
          <option value="low">Lowest rating</option>
        </select>
      </div>

      {/* Results count */}
      {search || ratingFilter !== 'All' ? (
        <p className="text-xs text-gray-500 mb-3">
          Showing {filtered.length} of {total} review{total !== 1 ? 's' : ''}
          {ratingFilter !== 'All' && <span> · {ratingFilter}-star only</span>}
        </p>
      ) : null}

      {/* Reviews list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-green-600 font-semibold">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mr-3" />
          Loading reviews…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={28} className="text-gray-300" />
          </div>
          <p className="text-lg font-semibold text-gray-700 mb-1">No reviews found</p>
          <p className="text-sm text-gray-400">
            {search || ratingFilter !== 'All' ? 'Try adjusting your filters.' : 'No customers have reviewed products yet.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(review => {
            const isLong = review.comment?.length > 160;
            const isExpanded = expanded[review._id];
            const displayComment = isLong && !isExpanded
              ? review.comment.slice(0, 160) + '…'
              : review.comment;

            return (
              <div key={review._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {/* Product thumbnail */}
                  <div className="flex-shrink-0">
                    {review.productImage ? (
                      <img
                        src={review.productImage}
                        alt={review.productName}
                        className="w-14 h-14 object-cover rounded-xl border border-gray-100"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Package size={22} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top row: product + rating + delete */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <Link
                          to={`/product/${review.productSlug || review.productId}`}
                          target="_blank"
                          className="text-xs font-semibold text-green-600 hover:underline truncate block max-w-[260px]"
                        >
                          {review.productName}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarRow rating={review.rating} size={13} />
                          <span className="text-xs font-bold text-gray-700">{review.rating}.0</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteTarget(review)}
                        className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                        title="Delete review"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Reviewer + date */}
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar name={review.name} />
                      <div>
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{review.name}</p>
                        <p className="text-xs text-gray-400">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Comment */}
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {displayComment}
                    </p>
                    {isLong && (
                      <button
                        onClick={() => setExpanded(prev => ({ ...prev, [review._id]: !isExpanded }))}
                        className="flex items-center gap-1 text-xs text-green-600 hover:underline mt-1 font-medium"
                      >
                        {isExpanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Review?</h3>
                <p className="text-sm text-gray-500">By {deleteTarget.name}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-5">
              <div className="flex items-center gap-2 mb-1">
                <StarRow rating={deleteTarget.rating} size={12} />
                <span className="text-xs font-semibold text-gray-700">{deleteTarget.productName}</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{deleteTarget.comment}</p>
            </div>

            <p className="text-sm text-gray-600 mb-5">
              This review will be permanently removed from the product. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deleting…</> : 'Delete Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
