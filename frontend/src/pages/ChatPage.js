import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatAPI, complaintAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSocket, joinComplaintRoom, leaveComplaintRoom, emitTyping } from '../utils/socket';

export default function ChatPage() {
  const { complaintId } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  // Fetch complaints list for sidebar
  useEffect(() => {
    complaintAPI.getAll({ limit: 50 })
      .then(({ data }) => {
        const withChat = data.complaints;
        setComplaints(withChat);
        // Auto-select from URL param or first complaint
        if (complaintId) {
          const found = withChat.find(c => c._id === complaintId);
          if (found) selectComplaint(found);
        } else if (withChat.length > 0) {
          selectComplaint(withChat[0]);
        }
      })
      .catch(() => addToast('Failed to load conversations', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const selectComplaint = useCallback(async (c) => {
    if (activeComplaint?._id === c._id) return;
    // Leave old room
    if (activeComplaint) leaveComplaintRoom(activeComplaint._id);
    setActiveComplaint(c);
    setMessages([]);
    try {
      const { data } = await chatAPI.getMessages(c._id);
      setMessages(data.messages);
      setTimeout(scrollToBottom, 100);
    } catch { addToast('Failed to load messages', 'error'); }
    // Join new socket room
    joinComplaintRoom(c._id);
    // Update URL
    navigate(`/chat/${c._id}`, { replace: true });
  }, [activeComplaint, navigate]);

  // Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewMsg = (msg) => {
      if (msg.complaint === activeComplaint?._id || msg.complaint?._id === activeComplaint?._id) {
        setMessages(prev => {
          const exists = prev.some(m => m._id === msg._id);
          if (exists) return prev;
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 50);
      }
    };

    const onTyping = ({ name, isTyping }) => {
      if (isTyping) { setTypingUser(name); setIsTyping(true); }
      else { setIsTyping(false); setTypingUser(''); }
    };

    socket.on('newMessage', onNewMsg);
    socket.on('userTyping', onTyping);
    return () => { socket.off('newMessage', onNewMsg); socket.off('userTyping', onTyping); };
  }, [activeComplaint?._id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    // Typing indicator
    emitTyping(activeComplaint?._id, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(activeComplaint?._id, false), 1500);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !activeComplaint || sending) return;
    setSending(true);
    emitTyping(activeComplaint._id, false);
    try {
      await chatAPI.send({ complaintId: activeComplaint._id, message: text });
      setInput('');
      // Optimistic update
      setMessages(prev => [...prev, {
        _id: Date.now(),
        sender: { _id: user._id, name: user.name },
        message: text,
        createdAt: new Date().toISOString(),
        senderRole: user.role,
      }]);
      setTimeout(scrollToBottom, 50);
    } catch (e) { addToast(e.response?.data?.message || 'Failed to send', 'error'); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const statusBadge = (s) => <span className={`badge badge-${s}`} style={{ fontSize: 10 }}>{s === 'inprogress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}</span>;

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="chat-layout">
      {/* Sidebar list */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          💬 Conversations
          <span style={{ marginLeft: 6, fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>({complaints.length})</span>
        </div>
        <div className="chat-list">
          {complaints.length === 0 ? (
            <div className="empty-state"><p>No complaints yet.</p></div>
          ) : complaints.map(c => (
            <div key={c._id} className={`chat-item ${activeComplaint?._id === c._id ? 'active' : ''}`} onClick={() => selectComplaint(c)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{c.complaintId}</span>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>{new Date(c.updatedAt).toLocaleDateString('en-IN')}</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {statusBadge(c.status)}
                <span className={`badge badge-${c.priority}`} style={{ fontSize: 10 }}>{c.priority}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat main */}
      <div className="chat-main">
        {activeComplaint ? (
          <>
            {/* Chat header */}
            <div className="chat-header">
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{activeComplaint.complaintId} – {activeComplaint.title}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  {activeComplaint.assignedTo ? (
                    <>
                      <span className="online-dot" style={{ marginRight: 5 }} />
                      {user.role === 'user' ? `Agent: ${activeComplaint.assignedTo.name}` : `User: ${activeComplaint.submittedBy?.name}`}
                    </>
                  ) : (
                    <span style={{ color: '#F59E0B' }}>⏳ Awaiting agent assignment</span>
                  )}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/complaints/${activeComplaint._id}`)}>View Complaint →</button>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
                  <p style={{ fontSize: 13 }}>No messages yet. Start the conversation!</p>
                </div>
              ) : messages.map((msg, i) => {
                const isMe = msg.sender?._id === user._id || msg.sender === user._id;
                return (
                  <div key={msg._id || i} className={`msg ${isMe ? 'mine' : 'theirs'}`}>
                    {!isMe && (
                      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2, fontWeight: 600 }}>
                        {msg.sender?.name} · {msg.senderRole}
                      </div>
                    )}
                    <div className="msg-bubble">{msg.message}</div>
                    <span className="msg-time">{formatTime(msg.createdAt)}</span>
                  </div>
                );
              })}
              {isTyping && (
                <div className="msg theirs">
                  <div className="msg-bubble" style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '10px 16px' }}>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{typingUser} is typing</span>
                    <span style={{ display: 'inline-flex', gap: 3 }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#94A3B8', animation: `bounce .8s ${i * .15}s infinite` }} />
                      ))}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-row">
              <input
                className="chat-input"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message… (Enter to send)"
                disabled={sending}
              />
              <button className="send-btn" onClick={sendMessage} disabled={sending || !input.trim()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#94A3B8' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            <p style={{ fontSize: 14 }}>Select a complaint to start chatting</p>
          </div>
        )}
      </div>
      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }`}</style>
    </div>
  );
}
