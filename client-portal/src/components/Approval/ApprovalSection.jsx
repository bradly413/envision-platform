import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { track } from '../../lib/api';

export default function ApprovalSection({ portalId, clientName, content = {} }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const [status, setStatus] = useState('pending');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  const handleApprove = async () => {
    await track.event(portalId, 'approve', { timestamp: new Date().toISOString() });
    setStatus('approved');
    setSubmitted(true);
    setShowModal(true);
  };

  const handleRevision = async () => {
    if (!showRevisionForm) { setShowRevisionForm(true); return; }
    await track.event(portalId, 'revision_requested', { comment, timestamp: new Date().toISOString() });
    setStatus('revision');
    setSubmitted(true);
  };

  return (
    <>
      {/* Approval Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#0D0D0D', borderRadius: 24, padding: '64px 52px', maxWidth: 540, width: '100%', textAlign: 'center', border: '1px solid #1F2937', boxShadow: '0 40px 80px rgba(0,0,0,.6)' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                style={{ width: 72, height: 72, borderRadius: '50%', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', fontSize: 28 }}
              >
                ✦
              </motion.div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#F9FAFB', margin: '0 0 16px', lineHeight: 1.3 }}>
                Thank you for approving the Envision Creative proposal.
              </h2>
              <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.8, marginBottom: 40 }}>
                An account representative will be reaching out to you shortly to kick off your project and align on next steps.
              </p>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: '13px 40px', background: '#F9FAFB', color: '#111827', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '.02em' }}
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section ref={ref} data-section="approval" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 32px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9 }} style={{ maxWidth: 560, width: '100%' }}>
          {!submitted ? (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 24 }}>Your decision</div>
              <h2 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, color: '#F9FAFB', margin: '0 0 16px' }}>
                {content.headline || 'What do you think?'}
              </h2>
              <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.7, marginBottom: 40 }}>
                Your feedback shapes the final deliverable. Approve to move forward, or let us know what you would like refined.
              </p>

              <AnimatePresence>
                {showRevisionForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden', marginBottom: 16 }}
                  >
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Tell us what you would like changed or refined..."
                      rows={4}
                      autoFocus
                      style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 10, border: '1px solid #374151', background: '#1A1A1A', color: '#F9FAFB', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'vertical' }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleApprove}
                  style={{ flex: 1, padding: 16, borderRadius: 10, border: 'none', background: '#F9FAFB', color: '#111827', fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '.01em' }}
                >
                  {content.buttonText || 'Approve Proposal ✓'}
                </button>
                <button
                  onClick={handleRevision}
                  style={{ flex: 1, padding: 16, borderRadius: 10, border: '1px solid #374151', background: showRevisionForm ? '#1A1A1A' : 'none', color: showRevisionForm ? '#EF4444' : '#9CA3AF', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
                >
                  {showRevisionForm ? 'Submit Feedback' : 'Not Approved'}
                </button>
              </div>
              {showRevisionForm && (
                <button onClick={() => setShowRevisionForm(false)} style={{ marginTop: 10, fontSize: 12, color: '#4B5563', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Cancel
                </button>
              )}
            </>
          ) : status === 'approved' ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', fontSize: 24 }}>✦</div>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: '#F9FAFB', margin: '0 0 16px' }}>Proposal approved.</h2>
              <p style={{ fontSize: 16, color: '#6B7280' }}>An account rep will be in touch shortly to kick off your project.</p>
            </motion.div>
          ) : (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
              <div style={{ fontSize: 48, marginBottom: 24 }}>↩</div>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: '#F9FAFB', margin: '0 0 16px' }}>Noted.</h2>
              <p style={{ fontSize: 16, color: '#6B7280' }}>Your feedback has been sent. We will review and come back with revisions.</p>
              {comment && (
                <div style={{ marginTop: 24, padding: '16px 20px', background: '#1A1A1A', borderRadius: 12, border: '1px solid #374151', textAlign: 'left' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280', marginBottom: 8 }}>Your notes</div>
                  <div style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.7 }}>{comment}</div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </section>
    </>
  );
}
