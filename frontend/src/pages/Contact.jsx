import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MessageCircle, Send, Loader2,
  LogIn, HeadphonesIcon, Smile, Image as ImageIcon, Paperclip,
  Mic, MicOff, X, Download, StopCircle,
} from 'lucide-react';
import axios from '../utils/api';
import { AuthContext } from '../context/AuthContext';

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

function fmtTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return time;
  if (isYesterday) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

function fmtBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const AttachmentBubble = ({ att, isMe }) => {
  if (att.type === 'image') {
    return (
      <img
        src={att.url}
        alt={att.name || 'image'}
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
    <a
      href={att.url}
      target="_blank"
      rel="noreferrer"
      className={`mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs max-w-[220px] ${
        isMe ? 'bg-blue-700 hover:bg-blue-800 text-blue-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      }`}
    >
      <Paperclip size={13} className="flex-shrink-0" />
      <span className="truncate">{att.name || 'File'}</span>
      {att.size ? <span className="flex-shrink-0 opacity-70">{fmtBytes(att.size)}</span> : null}
      <Download size={11} className="flex-shrink-0" />
    </a>
  );
};

const GuestContactPage = () => (
  <div className="w-full pb-16">
    <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mt-4 mb-2 transition-colors">
      <ArrowLeft size={15} /> Back to Home
    </Link>
    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-10 mb-10 text-center">
      <HeadphonesIcon size={44} className="text-green-600 mx-auto mb-3" />
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Contact Support</h1>
      <p className="text-gray-600 max-w-xl mx-auto">
        Have a question or need help? Reach us by phone, email, or sign in to chat with us live.
      </p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
      <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm flex flex-col items-center text-center gap-3">
        <div className="bg-green-50 p-4 rounded-2xl"><Phone size={26} className="text-green-600" /></div>
        <p className="font-bold text-gray-900">Call Us</p>
        <p className="text-sm text-gray-500">+92 300 1234567</p>
        <p className="text-xs text-gray-400">Mon–Sat 9am–6pm</p>
        <a href="tel:+923001234567" className="mt-1 text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold transition-colors">Call Now</a>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm flex flex-col items-center text-center gap-3">
        <div className="bg-blue-50 p-4 rounded-2xl"><Mail size={26} className="text-blue-600" /></div>
        <p className="font-bold text-gray-900">Email Us</p>
        <p className="text-sm text-gray-500">support@ecpos.pk</p>
        <p className="text-xs text-gray-400">Reply within 24 hours</p>
        <a href="mailto:support@ecpos.pk" className="mt-1 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-colors">Send Email</a>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm flex flex-col items-center text-center gap-3">
        <div className="bg-purple-50 p-4 rounded-2xl"><MessageCircle size={26} className="text-purple-600" /></div>
        <p className="font-bold text-gray-900">Live Chat</p>
        <p className="text-sm text-gray-500">Chat with our support team</p>
        <p className="text-xs text-gray-400">Sign in to start chatting</p>
        <Link to="/login" className="mt-1 flex items-center gap-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-semibold transition-colors">
          <LogIn size={14} /> Sign In to Chat
        </Link>
      </div>
    </div>
  </div>
);

const Contact = () => {
  const { user } = useContext(AuthContext);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);

  const messagesContainerRef = useRef(null);
  const pollRef = useRef(null);
  const convIdRef = useRef(null);
  const sendingRef = useRef(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordChunksRef = useRef([]);
  const recordStreamRef = useRef(null);
  const recordTimerRef = useRef(null);
  const emojiRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current)
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  };

  const fetchMessages = useCallback(async (convId) => {
    try {
      const { data } = await axios.get(`${API}/messages/conversations/${convId}`, { withCredentials: true });
      if (Array.isArray(data)) setMessages(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      setLoading(true);
      try {
        const { data: conv } = await axios.post(`${API}/messages/conversations`, {}, { withCredentials: true });
        setConversation(conv);
        convIdRef.current = conv._id;
        await fetchMessages(conv._id);
      } catch (err) {
        console.error('Chat init error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user, fetchMessages]);

  useEffect(() => {
    if (!convIdRef.current) return;
    pollRef.current = setInterval(() => {
      if (!sendingRef.current) fetchMessages(convIdRef.current);
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [conversation, fetchMessages]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const handleSend = async () => {
    const hasText = text.trim().length > 0;
    const hasAtt = pendingAttachments.length > 0;
    if ((!hasText && !hasAtt) || sending || uploading) return;

    if (!convIdRef.current) {
      try {
        const { data: conv } = await axios.post(`${API}/messages/conversations`, {}, { withCredentials: true });
        setConversation(conv);
        convIdRef.current = conv._id;
      } catch { return; }
    }

    const msgText = text.trim();
    const atts = [...pendingAttachments];
    setText('');
    setPendingAttachments([]);
    setSending(true);
    sendingRef.current = true;

    const optimistic = {
      _id: `opt-${Date.now()}`,
      sender: { _id: user._id, name: user.name, profilePicture: user.profilePicture },
      text: msgText,
      attachments: atts,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const { data } = await axios.post(
        `${API}/messages/conversations/${convIdRef.current}`,
        { text: msgText, attachments: atts },
        { withCredentials: true }
      );
      setMessages((prev) => {
        const replaced = prev.map((m) => (m._id === optimistic._id ? data : m));
        return replaced.some((m) => m._id === data._id) ? replaced : [...prev, data];
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setText(msgText);
      setPendingAttachments(atts);
    } finally {
      setSending(false);
      sendingRef.current = false;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!user) return <GuestContactPage />;

  const canSend = (text.trim() || pendingAttachments.length > 0) && !sending && !uploading && !recording;

  return (
    <div className="w-full pb-16">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mt-4 mb-4 transition-colors">
        <ArrowLeft size={15} /> Back to Home
      </Link>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col" style={{ height: 630 }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg select-none">S</div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Support Team</p>
                <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <a href="tel:+923001234567" className="hover:text-green-600 transition-colors" title="Call Us"><Phone size={18} /></a>
              <a href="mailto:support@ecpos.pk" className="hover:text-green-600 transition-colors" title="Email Us"><Mail size={18} /></a>
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-gray-50 px-5 py-4 flex flex-col gap-3 min-h-0">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={28} className="text-green-500 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 gap-3 py-10">
                <MessageCircle size={40} className="text-gray-200" />
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs">Start a conversation with our support team below.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender?._id === user._id || msg.sender?._id?.toString() === user._id?.toString();
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[78%]">
                      {msg.isDeleted ? (
                        <div className={`px-4 py-2.5 rounded-2xl text-sm italic text-gray-400 border ${isMe ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-200'}`}>
                          This message was deleted
                        </div>
                      ) : (
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'}`}>
                          {msg.text && <p>{msg.text}</p>}
                          {msg.attachments?.map((att, i) => (
                            <AttachmentBubble key={i} att={att} isMe={isMe} />
                          ))}
                        </div>
                      )}
                      <p className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>{fmtTime(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pending attachment previews */}
          {(pendingAttachments.length > 0 || uploading) && (
            <div className="flex flex-wrap gap-2 px-4 py-2 border-t border-gray-100 bg-white flex-shrink-0">
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
                      <Paperclip size={11} />
                      <span className="truncate">{att.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X size={9} />
                  </button>
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
          <div className="border-t border-gray-100 px-4 py-3 bg-white rounded-b-2xl flex-shrink-0">
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
                <div className="absolute bottom-12 left-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 w-[290px]">
                  <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                    {EMOJIS.map((em) => (
                      <button
                        key={em}
                        className="text-xl hover:bg-gray-100 rounded-lg p-1 transition-colors leading-none"
                        onClick={() => { setText((t) => t + em); setShowEmoji(false); }}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="flex items-center text-gray-400 flex-shrink-0">
                  <button
                    onClick={() => setShowEmoji((v) => !v)}
                    className={`p-1.5 rounded-xl transition-colors ${showEmoji ? 'text-yellow-500 bg-yellow-50' : 'hover:bg-gray-100 hover:text-yellow-500'}`}
                    title="Emoji"
                  >
                    <Smile size={18} />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-1.5 rounded-xl hover:bg-gray-100 hover:text-blue-600 transition-colors disabled:opacity-40"
                    title="Image"
                  >
                    <ImageIcon size={18} />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-1.5 rounded-xl hover:bg-gray-100 hover:text-green-600 transition-colors disabled:opacity-40"
                    title="File"
                  >
                    <Paperclip size={18} />
                  </button>
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    disabled={uploading}
                    className={`p-1.5 rounded-xl transition-colors ${recording ? 'text-red-500 bg-red-50' : 'hover:bg-gray-100 hover:text-purple-600'} disabled:opacity-40`}
                    title={recording ? 'Stop recording' : 'Voice message'}
                  >
                    {recording ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                </div>

                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message…"
                  className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400 transition-colors"
                  disabled={sending || recording}
                />
                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
                >
                  {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,audio/*,application/pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1.5">
            <Phone size={12} className="text-green-600" /> +92 300 1234567
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1.5">
            <Mail size={12} className="text-blue-600" /> support@ecpos.pk
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1.5">
            <MessageCircle size={12} className="text-purple-600" /> Mon–Sat 9am–6pm PKT
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
