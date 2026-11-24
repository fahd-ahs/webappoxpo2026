import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import StudyCompanionWorkspace from './ai/StudyCompanionWorkspace';

export default function AIChatbot() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [externalLaunch, setExternalLaunch] = useState(null);

  useEffect(() => {
    const handleExternalOpen = (e) => {
      const detail = e?.detail || {};
      // If user is already inside full AI Companion page, pass launch directly or focus it
      if (location.pathname === '/ai-companion') {
        navigate('/ai-companion', {
          replace: true,
          state: { ...detail, timestamp: Date.now() },
        });
        return;
      }
      setIsOpen(true);
      setExternalLaunch({ ...detail, timestamp: Date.now() });
    };
    window.addEventListener('schoolexpo:open-ai', handleExternalOpen);
    return () => window.removeEventListener('schoolexpo:open-ai', handleExternalOpen);
  }, [location.pathname, navigate]);

  // Close drawer automatically if user navigates to the full AI Companion workspace
  useEffect(() => {
    if (location.pathname === '/ai-companion' && isOpen) {
      setIsOpen(false);
    }
  }, [location.pathname, isOpen]);

  if (!user) return null;

  const isOnFullPage = location.pathname === '/ai-companion';

  return (
    <>
      {/* Floating Button elevated above overlays to prevent click interception */}
      {!isOpen && !isOnFullPage && (
        <motion.button
          type="button"
          data-testid="ai-chatbot-btn"
          aria-label="Open AI Study Companion"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 h-12 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-500 text-white flex items-center gap-2.5 shadow-[0_12px_32px_rgba(99,102,241,0.35)] border border-indigo-300/25 z-[70] pointer-events-auto cursor-pointer transition-all"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Sparkles className="w-4 h-4 text-cyan-200 shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-tight whitespace-nowrap hidden sm:inline">
            AI Companion
          </span>
        </motion.button>
      )}

      {/* Upgraded Slide-Over AI Study Companion Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/55 backdrop-blur-xs z-[80]"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              data-testid="ai-chatbot-drawer"
              className="fixed right-0 top-0 h-screen w-full max-w-lg bg-[#0c1222] border-l border-white/[0.1] z-[90] flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="h-14 px-4 sm:px-5 flex items-center justify-between border-b border-white/[0.08] bg-[#0f1628]/95 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold font-['Outfit'] text-white">
                      Nova · AI Study Companion
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Explain · Hint · Quiz Me · Study Plan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="close-chatbot-btn"
                  aria-label="Close AI Study Companion"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Embedded Multi-Mode Workspace */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <StudyCompanionWorkspace
                  variant="drawer"
                  externalLaunch={externalLaunch}
                  onExpandFullView={({ mode, subject }) => {
                    setIsOpen(false);
                    navigate('/ai-companion', {
                      state: { mode, subject, timestamp: Date.now() },
                    });
                  }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
