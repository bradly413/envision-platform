import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { portalAi } from '../../lib/api';

const QUICK_ACTIONS = [
  'Summarize the brand strategy',
  'Explain the color choices',
  'What are the next steps?',
];

export default function PortalChatWidget({ portalId }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const data = await portalAi.chat(portalId, msg, conversationId);
      setConversationId(data.conversationId);
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply, model: data.model }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I couldn\'t process that request. Please try again.', error: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 52, height: 52, borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.1)',
          background: open ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.9)',
          backdropFilter: 'blur(12px)',
          color: '#E2E8F0', fontSize: 20, cursor: 'pointer',
          display: 'grid', placeItems: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? '✕' : '💬'}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', bottom: 88, right: 24, zIndex: 9998,
              width: 380, maxHeight: 520,
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(10,10,18,0.95)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 16px 64px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: '#10B981' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>Brand Assistant</span>
              <span style={{ fontSize: 10, color: '#64748B', marginLeft: 'auto' }}>AI</span>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{
              flex: 1, overflowY: 'auto', padding: 16,
              display: 'flex', flexDirection: 'column', gap: 12,
              minHeight: 200, maxHeight: 340,
            }}>
              {messages.length === 0 && !loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
                  <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
                    Ask me anything about your brand deliverables.
                  </p>
                  {QUICK_ACTIONS.map((action) => (
                    <button key={action} onClick={() => send(action)}
                      style={{
                        textAlign: 'left', padding: '10px 14px', borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.03)',
                        color: '#CBD5E1', fontSize: 12, cursor: 'pointer',
                        lineHeight: 1.4,
                      }}>
                      {action}
                    </button>
                  ))}
                </div>
              ) : null}

              {messages.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: 14,
                    background: msg.role === 'user'
                      ? 'rgba(37,99,235,0.2)'
                      : msg.error
                        ? 'rgba(239,68,68,0.1)'
                        : 'rgba(255,255,255,0.04)',
                    border: msg.role === 'user'
                      ? '1px solid rgba(59,130,246,0.2)'
                      : '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <p style={{
                      fontSize: 13, lineHeight: 1.65, margin: 0,
                      color: msg.error ? '#FCA5A5' : '#E2E8F0',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}

              {loading ? (
                <div style={{ alignSelf: 'flex-start' }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: 14,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <motion.div
                      style={{ display: 'flex', gap: 4 }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 6, height: 6, borderRadius: 999,
                          background: '#64748B',
                        }} />
                      ))}
                    </motion.div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Input */}
            <div style={{
              padding: '12px 14px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', gap: 8,
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask about your brand..."
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#F8FAFC', fontSize: 13, outline: 'none',
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                style={{
                  width: 38, height: 38, borderRadius: 12,
                  border: 'none',
                  background: !input.trim() || loading ? '#334155' : '#2563EB',
                  color: '#F8FAFC', fontSize: 14, fontWeight: 700,
                  cursor: !input.trim() || loading ? 'default' : 'pointer',
                  display: 'grid', placeItems: 'center',
                }}
              >↑</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
