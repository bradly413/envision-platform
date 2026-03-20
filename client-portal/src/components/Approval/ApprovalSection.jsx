import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { track } from '../../lib/api';

export default function ApprovalSection({ portalId, clientName }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const [status, setStatus] = useState('pending'); // pending | approved | revision
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleApprove = async () => {
    await track.event(portalId, 'approve', { timestamp: new Date() });
    setStatus('approved'); setSubmitted(true);
  };

  const handleRevision = async () => {
    await track.event(portalId, 'revision_requested', { comment, timestamp: new Date() });
    setStatus('revision'); setSubmitted(true);
  };

  return (
    <section ref={ref} data-section="approval" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 32px', textAlign: 'center' }}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9 }} style={{ maxWidth: 560 }}>
        {!submitted ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 24 }}>Your decision</div>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, color: '#F9FAFB', margin: '0 0 16px' }}>What do you think?</h2>
            <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.7, marginBottom: 40 }}>
              Your feedback shapes the final deliverable. Approve to move forward, or let us know what you'd like refined.
            </p>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Optional notes or feedback..." rows={3}
              style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 10, border: '1px solid #374151', background: '#1A1A1A', color: '#F9FAFB', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', marginBottom: 16, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleApprove} style={{ flex: 1, padding: 16, borderRadius: 10, border: 'none', background: '#F9FAFB', color: '#111827', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Approve ✓
              </button>
              <button onClick={handleRevision} style={{ flex: 1, padding: 16, borderRadius: 10, border: '1px solid #374151', background: 'none', color: '#9CA3AF', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                Request changes
              </button>
            </div>
          </>
        ) : status === 'approved' ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>✓</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#F9FAFB', margin: '0 0 16px' }}>You're approved.</h2>
            <p style={{ fontSize: 16, color: '#6B7280' }}>We'll be in touch shortly with your final files and next steps.</p>
          </motion.div>
        ) : (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>↩</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#F9FAFB', margin: '0 0 16px' }}>Got it.</h2>
            <p style={{ fontSize: 16, color: '#6B7280' }}>Your feedback has been sent. We'll review and come back with revisions.</p>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
