import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import axios from '../../utils/api';
import {
  Search, MessageCircle, Phone, Video, MoreHorizontal,
  Send, Smile, Image as ImageIcon, Paperclip, Mic, MicOff,
  CornerUpLeft, Forward, Trash2, ArrowLeft, X, Download,
  Loader2, StopCircle,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const API = '/api';

const EMOJIS = [
  '😀','😂','😍','🥰','😊','😎','🤔','😅','😭','😤',
  '🤣','😇','🙄','😴','🤗','👍','👎','👋','🙌','👏',
  '🤝','💪','❤️','🧡','💛','💚','💙','💜','🎉','🔥',
  '✨','💯','⭐','🙏','💀','😈','👀','💔','🍕','🍔',
  '🎵','🎬','📱','💻','📷','💰','💎','🎁','🎂','🌟',
  '😆','😋','🤩','😏','😒','😔','😟','😕','🙁','😣',
  '😖','😫','😩','🥺','😢','😱','😨','😰','😥','🤭',
  '🫡','🫠','🥳','🤓','🧐','🤡','👻','💩','🤖','👾',
];

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}
const AVATAR_COLORS = ['bg-blue-500','bg-purple-500','bg-pink-500','bg-orange-500','bg-teal-500','bg-rose-500'];
function getAvatarColor(name = '') {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function fmtTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return time;
  if (isYesterday) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

function fmtShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.floor((now - d) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear()) {
    return `Yesterday, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function fmtBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const Avatar = ({ user, size = 10, showDot = false }) => {
  const colorClass = getAvatarColor(user?.name || '');
  const sizeClass = `w-${size} h-${size}`;
  return (
    <div className={`relative flex-shrink-0 ${sizeClass}`}>
      {user?.profilePicture ? (
        <img src={user.profilePicture} alt={user.name} className={`${sizeClass} rounded-full object-cover`} />
      ) : (
        <div className={`${sizeClass} rounded-full ${colorClass} flex items-center justify-center text-white font-bold select-none`} style={{ fontSize: size <= 8 ? '0.65rem' : size <= 10 ? '0.75rem' : '0.9rem' }}>
          {getInitials(user?.name)}
        </div>
      )}
      {showDot && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />}
    </div>
  );
};

const AttachmentBubble = ({ att, isMe }) => {
  if (att.type === 'image') {
    return (
      <img src={att.url} alt={att.name || 'image'}
        className="max-w-[220px] rounded-xl cursor-pointer mt-1 border border-white/20"
        onClick={() => window.open(att.url, '_blank')}
      />
    );
  }
  if (att.type === 'voice') {
    return (
      <div className={`mt-1 rounded-xl overflow-hidden max-w-[240px] ${isMe ? 'bg-blue-700' : 'bg-gray-100'}`}>
        <audio controls className="w-full" style={{ height: 36 }}>
          <source src={att.url} />
        </audio>
      </div>
    );
  }
  return (
    <a href={att.url} target="_blank" rel="noreferrer"
      className={`mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs max-w-[220px] ${isMe ? 'bg-blue-700 hover:bg-blue-800 text-blue-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
    >
      <Paperclip size={13} className="flex-shrink-0" />
      <span className="truncate">{att.name || 'File'}</span>
      {att.size ? <span className="opacity-70 flex-shrink-0">{fmtBytes(att.size)}</span> : null}
      <Download size={11} className="flex-shrink-0" />
    </a>
  );
};

const Messages = () => {
  const { user } = useContext(AuthContext);

  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState(null);

  // Rich input state
  const [showEmoji, setShowEmoji] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);

  const messagesEndRef = useRef(null);
  const convPollRef = useRef(null);
  const msgPollRef = useRef(null);
  const selectedConvRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordChunksRef = useRef([]);
  const recordStreamRef = useRef(null);
  const recordTimerRef = useRef(null);
  const emojiRef = useRef(null);

  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  useEffect(() => { selectedConvRef.current = selectedConv; }, [selectedConv]);

  // Close emoji on outside click
  useEffect(() => {
    const handler = (e) => { if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/messages/conversations`, { withCredentials: true });
      setConversations(data);
    } catch { /* silent */ } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    convPollRef.current = setInterval(fetchConversations, 10000);
    return () => clearInterval(convPollRef.current);
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (convId) => {
    try {
      const { data } = await axios.get(`${API}/messages/conversations/${convId}`, { withCredentials: true });
      setMessages(data);
      setConversations((prev) => prev.map((c) => (c._id === convId ? { ...c, adminUnread: 0 } : c)));
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!selectedConv) return;
    setLoadingMsgs(true);
    fetchMessages(selectedConv._id).finally(() => setLoadingMsgs(false));
    clearInterval(msgPollRef.current);
    msgPollRef.current = setInterval(() => {
      if (selectedConvRef.current) fetchMessages(selectedConvRef.current._id);
    }, 3000);
    return () => clearInterval(msgPollRef.current);
  }, [selectedConv, fetchMessages]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── File upload ────────────────────────────────────────────────────────────
  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const { data } = await axios.post(`${API}/upload/message`, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPendingAttachments((prev) => [...prev, data]);
    } catch {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    Array.from(e.target.files || []).forEach(uploadFile);
    e.target.value = '';
  };

  // ── Voice recording ────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordStreamRef.current = stream;
      recordChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const mr = new MediaRecorder(stream, { mimeType });
      mr.ondataavailable = (e) => { if (e.data.size > 0) recordChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(recordChunksRef.current, { type: mimeType });
        const ext = mimeType.includes('webm') ? 'webm' : 'ogg';
        await uploadFile(new File([blob], `voice-${Date.now()}.${ext}`, { type: mimeType }));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordSecs(0);
      recordTimerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } catch {
      alert('Microphone access denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      clearInterval(recordTimerRef.current);
      setRecording(false);
      setRecordSecs(0);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      recordStreamRef.current?.getTracks().forEach((t) => t.stop());
      clearInterval(recordTimerRef.current);
      setRecording(false);
      setRecordSecs(0);
    }
  };

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const hasText = text.trim().length > 0;
    const hasAtt = pendingAttachments.length > 0;
    if ((!hasText && !hasAtt) || !selectedConv || sending || uploading) return;

    const msgText = text.trim();
    const atts = [...pendingAttachments];
    setText('');
    setPendingAttachments([]);
    setSending(true);

    const optimistic = {
      _id: `opt-${Date.now()}`,
      sender: { _id: user._id, name: user.name, profilePicture: user.profilePicture, role: user.role },
      senderRole: user.role,
      text: msgText,
      attachments: atts,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const { data } = await axios.post(
        `${API}/messages/conversations/${selectedConv._id}`,
        { text: msgText, attachments: atts },
        { withCredentials: true }
      );
      setMessages((prev) => prev.map((m) => (m._id === optimistic._id ? data : m)));
      const preview = msgText || (atts[0]?.type === 'voice' ? '🎤 Voice message' : atts[0]?.type === 'image' ? '📷 Photo' : `📎 ${atts[0]?.name || 'File'}`);
      setConversations((prev) =>
        prev.map((c) => c._id === selectedConv._id ? { ...c, lastMessage: preview, lastMessageAt: new Date().toISOString() } : c)
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setText(msgText);
      setPendingAttachments(atts);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId) => {
    try {
      const { data } = await axios.delete(`${API}/messages/${msgId}`, { withCredentials: true });
      setMessages((prev) => prev.map((m) => (m._id === msgId ? { ...m, isDeleted: true, text: data.text } : m)));
    } catch { /* silent */ }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const filteredConvs = conversations.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || (c.user?.name?.toLowerCase() || '').includes(q) || (c.user?.email?.toLowerCase() || '').includes(q);
    if (!matchesSearch) return false;
    if (filter === 'unread') return c.adminUnread > 0;
    if (filter === 'read') return c.adminUnread === 0;
    return true;
  });

  const unreadCount = conversations.reduce((acc, c) => acc + (c.adminUnread || 0), 0);
  const canSend = (text.trim() || pendingAttachments.length > 0) && !sending && !uploading && !recording;

  return (
    <div className="flex h-screen bg-[#f5f6fa] overflow-hidden">
      {/* Conversation list */}
      <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Link to="/admin" className="text-gray-400 hover:text-gray-700 transition-colors"><ArrowLeft size={18} /></Link>
            <h1 className="text-base font-bold text-gray-900 flex-1">Messages</h1>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">{unreadCount}</span>
            )}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-gray-100 border-0 outline-none focus:bg-gray-200 transition-colors"
            />
          </div>
        </div>

        <div className="flex border-b border-gray-100 px-2">
          {['all','read','unread'].map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 ${filter === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >{tab}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs px-4">{search ? 'No conversations match.' : 'No conversations yet.'}</div>
          ) : filteredConvs.map((conv) => {
            const isSelected = selectedConv?._id === conv._id;
            return (
              <button key={conv._id} onClick={() => setSelectedConv(conv)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
              >
                <Avatar user={conv.user} size={10} showDot />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>{conv.user?.name || 'Unknown'}</span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{fmtShort(conv.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate max-w-[150px]">{conv.lastMessage || 'No messages yet'}</p>
                    {conv.adminUnread > 0 && (
                      <span className="ml-1 flex-shrink-0 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {conv.adminUnread > 9 ? '9+' : conv.adminUnread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {!selectedConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <MessageCircle size={32} className="text-gray-300" />
            </div>
            <div>
              <p className="font-semibold text-gray-500 mb-1">Select a conversation</p>
              <p className="text-xs text-gray-400">Choose from the left panel to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-gray-200 px-5 py-3.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <Avatar user={selectedConv.user} size={10} showDot />
                <div>
                  <p className="font-bold text-gray-900 text-sm">{selectedConv.user?.name}</p>
                  <p className="text-xs text-green-500 font-medium">Active now</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <button className="hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100" title="Call"><Phone size={18} /></button>
                <button className="hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100" title="Video"><Video size={18} /></button>
                <button className="hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100" title="More"><MoreHorizontal size={18} /></button>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4 flex flex-col gap-2 min-h-0">
              {loadingMsgs ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 gap-2 py-16">
                  <MessageCircle size={36} className="text-gray-200" />
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs">Send the first message to start the conversation.</p>
                </div>
              ) : messages.map((msg) => {
                const isMe = msg.sender?._id === user._id || msg.sender?._id?.toString() === user._id?.toString();
                const isHovered = hoveredMsg === msg._id;

                if (msg.isDeleted) {
                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                      {!isMe && <Avatar user={selectedConv.user} size={7} />}
                      <div>
                        <div className="px-4 py-2.5 rounded-2xl text-xs italic text-gray-400 border border-gray-200 bg-white">This message was deleted</div>
                        <p className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>{fmtTime(msg.createdAt)}</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg._id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 group`}
                    onMouseEnter={() => setHoveredMsg(msg._id)}
                    onMouseLeave={() => setHoveredMsg(null)}
                  >
                    {!isMe && <Avatar user={selectedConv.user} size={7} />}
                    <div className={`flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {isHovered && (
                        <div className={`flex items-center gap-0.5 ${isMe ? 'mr-1' : 'ml-1'}`}>
                          <button className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm" title="Reply"><CornerUpLeft size={13} /></button>
                          <button className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm" title="Forward"><Forward size={13} /></button>
                          <button
                            onClick={() => handleDelete(msg._id)}
                            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
                            title="Delete"
                          ><Trash2 size={13} /></button>
                        </div>
                      )}
                      <div className="max-w-sm">
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'}`}>
                          {msg.text && <p>{msg.text}</p>}
                          {msg.attachments?.map((att, i) => (
                            <AttachmentBubble key={i} att={att} isMe={isMe} />
                          ))}
                        </div>
                        <p className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>{fmtTime(msg.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Pending attachment previews */}
            {(pendingAttachments.length > 0 || uploading) && (
              <div className="flex flex-wrap gap-2 px-5 py-2 border-t border-gray-100 bg-white flex-shrink-0">
                {pendingAttachments.map((att, i) => (
                  <div key={i} className="relative">
                    {att.type === 'image' ? (
                      <img src={att.url} alt={att.name} className="w-14 h-14 object-cover rounded-lg border border-gray-200" />
                    ) : att.type === 'voice' ? (
                      <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 rounded-lg px-3 py-2 text-xs font-medium border border-purple-100">
                        <Mic size={12} /> Voice
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-gray-100 text-gray-600 rounded-lg px-3 py-2 text-xs max-w-[120px]">
                        <Paperclip size={11} /><span className="truncate">{att.name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
                    ><X size={9} /></button>
                  </div>
                ))}
                {uploading && (
                  <div className="flex items-center justify-center w-14 h-14 rounded-lg border border-dashed border-gray-300 bg-gray-50">
                    <Loader2 size={16} className="text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
            )}

            {/* Input area */}
            <div className="bg-white border-t border-gray-200 px-5 py-3 flex-shrink-0">
              {/* Recording bar */}
              {recording && (
                <div className="flex items-center gap-3 mb-2 px-3 py-2 bg-red-50 rounded-xl border border-red-100">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                  <span className="text-sm font-medium text-red-600 flex-1">
                    {Math.floor(recordSecs / 60).toString().padStart(2, '0')}:{(recordSecs % 60).toString().padStart(2, '0')}
                  </span>
                  <button onClick={cancelRecording} className="text-xs text-gray-400 hover:text-red-500 px-2">Cancel</button>
                  <button onClick={stopRecording} className="flex items-center gap-1 text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg font-semibold">
                    <StopCircle size={12} /> Done
                  </button>
                </div>
              )}

              {/* Emoji picker */}
              <div className="relative" ref={emojiRef}>
                {showEmoji && (
                  <div className="absolute bottom-12 left-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 w-[300px]">
                    <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                      {EMOJIS.map((em) => (
                        <button key={em} className="text-xl hover:bg-gray-100 rounded-lg p-1 transition-colors leading-none"
                          onClick={() => { setText((t) => t + em); setShowEmoji(false); }}>
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-gray-400">
                    <button
                      onClick={() => setShowEmoji((v) => !v)}
                      className={`p-1.5 rounded-lg transition-colors ${showEmoji ? 'text-yellow-500 bg-yellow-50' : 'hover:bg-gray-100 hover:text-yellow-500'}`}
                      title="Emoji"
                    ><Smile size={18} /></button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="p-1.5 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors disabled:opacity-40"
                      title="Image"
                    ><ImageIcon size={18} /></button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="p-1.5 rounded-lg hover:bg-gray-100 hover:text-green-600 transition-colors disabled:opacity-40"
                      title="File"
                    ><Paperclip size={18} /></button>
                    <button
                      onClick={recording ? stopRecording : startRecording}
                      disabled={uploading}
                      className={`p-1.5 rounded-lg transition-colors ${recording ? 'text-red-500 bg-red-50' : 'hover:bg-gray-100 hover:text-purple-600'} disabled:opacity-40`}
                      title={recording ? 'Stop' : 'Voice message'}
                    >{recording ? <MicOff size={18} /> : <Mic size={18} />}</button>
                  </div>

                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message…"
                    className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400 transition-colors bg-gray-50"
                    disabled={sending || recording}
                  />

                  <button
                    onClick={handleSend}
                    disabled={!canSend}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
                  >
                    <Send size={15} /> Send
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,audio/*,application/pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default Messages;
