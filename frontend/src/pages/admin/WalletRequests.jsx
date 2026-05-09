import { useState, useEffect, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Wallet, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import axios from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected'];

const WalletRequests = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');

  const [modal, setModal] = useState(null); // { type: 'approve'|'reject', requestId, userName, amount }
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async (status) => {
    setLoading(true);
    try {
      const params = status !== 'all' ? `?status=${status}` : '';
      const { data } = await axios.get(`/api/wallet${params}`, { withCredentials: true });
      setRequests(data);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') fetchRequests(statusFilter);
  }, [user, statusFilter]);

  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  const openModal = (type, req) => {
    setModal({ type, requestId: req._id, userName: req.user?.name, amount: req.amount });
    setNote('');
  };

  const handleAction = async () => {
    if (!modal) return;
    setSubmitting(true);
    try {
      const endpoint = `/api/wallet/${modal.requestId}/${modal.type}`;
      await axios.put(endpoint, { adminNote: note }, { withCredentials: true });
      setModal(null);
      fetchRequests(statusFilter);
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = requests.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.user?.name?.toLowerCase().includes(q) ||
      r.user?.email?.toLowerCase().includes(q) ||
      r.transactionRef?.toLowerCase().includes(q)
    );
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Wallet size={26} className="text-green-600" />
        <h1 className="text-2xl font-extrabold text-gray-900">Wallet Top-Up Requests</h1>
        {pendingCount > 0 && (
          <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount} pending</span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors ${
                statusFilter === s ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, ref…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-green-600 font-semibold">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Wallet size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Bank / Ref</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((req) => (
                  <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-sm text-gray-900">{req.user?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{req.user?.email}</p>
                      <p className="text-xs text-green-600 mt-0.5">Bal: Rs {(req.user?.walletBalance || 0).toFixed(0)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-extrabold text-gray-900">Rs {req.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4">
                      {req.bankName && <p className="text-xs font-semibold text-gray-600">{req.bankName}</p>}
                      <p className="text-xs font-mono text-gray-500 break-all">{req.transactionRef}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleDateString()}<br />
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                        req.status === 'approved' ? 'bg-green-100 text-green-700' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {req.status === 'approved' && <CheckCircle size={11} />}
                        {req.status === 'rejected' && <XCircle size={11} />}
                        {req.status === 'pending' && <Clock size={11} />}
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                      {req.adminNote && <p className="text-xs text-gray-400 mt-1 italic max-w-[120px] truncate">{req.adminNote}</p>}
                    </td>
                    <td className="px-5 py-4">
                      {req.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal('approve', req)}
                            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button
                            onClick={() => openModal('reject', req)}
                            className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve / Reject Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className={`text-lg font-extrabold mb-1 ${modal.type === 'approve' ? 'text-green-700' : 'text-red-600'}`}>
              {modal.type === 'approve' ? '✓ Approve Request' : '✕ Reject Request'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {modal.type === 'approve'
                ? `This will credit Rs ${modal.amount?.toLocaleString()} to ${modal.userName}'s wallet immediately.`
                : `This will mark the request as rejected. No wallet credit will occur.`}
            </p>
            <label className="text-xs text-gray-500 mb-1 block">
              Admin Note {modal.type === 'reject' ? '(required)' : '(optional)'}
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={modal.type === 'approve' ? 'e.g. Verified — credited' : 'e.g. Transaction not found'}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500 mb-4 resize-none"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={submitting || (modal.type === 'reject' && !note.trim())}
                className={`px-5 py-2 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-50 ${
                  modal.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {submitting ? 'Processing…' : modal.type === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletRequests;
