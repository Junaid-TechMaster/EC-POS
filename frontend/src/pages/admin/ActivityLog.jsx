import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/api';
import { ArrowLeft, Activity, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const ACTION_COLORS = {
  LOGIN: 'bg-green-100 text-green-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
  CREATE_PRODUCT: 'bg-blue-100 text-blue-700',
  UPDATE_PRODUCT: 'bg-yellow-100 text-yellow-700',
  DELETE_PRODUCT: 'bg-red-100 text-red-700',
  POS_SALE: 'bg-purple-100 text-purple-700',
};

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, pageSize: 50 });
      if (entityFilter) params.set('entity', entityFilter);
      if (actionFilter) params.set('action', actionFilter);
      const { data } = await axios.get(`/api/activity?${params}`, { withCredentials: true });
      setLogs(data.logs || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(1); }, [entityFilter, actionFilter]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <Activity size={22} className="text-green-600" />
        <h1 className="text-xl font-bold text-gray-900">Activity Log</h1>
        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full ml-auto">{total.toLocaleString()} entries</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500">
          <option value="">All entities</option>
          <option value="user">User</option>
          <option value="product">Product</option>
          <option value="pos_sale">POS Sale</option>
          <option value="order">Order</option>
        </select>
        <input value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} placeholder="Filter by action..." className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 flex-1 max-w-xs" />
        <button onClick={() => fetchLogs(page)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title="Refresh">
          <RefreshCw size={15} className="text-gray-500" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No activity logs yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Action</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Entity</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Details</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Time</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden md:table-cell">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{log.userName}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{log.entity || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{log.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button onClick={() => fetchLogs(page - 1)} disabled={page <= 1} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => fetchLogs(page + 1)} disabled={page >= pages} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
