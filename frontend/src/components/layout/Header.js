import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bell, Search, Zap, X, Menu, Sparkles, BookOpen,
  ClipboardCheck, User, LogOut, LayoutDashboard, BarChart3,
  Brain, Calendar, Headphones, CheckSquare, Trophy, CreditCard, MessageSquare, Compass
} from 'lucide-react';
import api from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

const STUDENT_QUICK_LINKS = [
  { label: 'Dashboard', hint: 'Academic overview & schedule', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Learning Compass', hint: 'Subject maps, mastery & insights', path: '/learning-compass', icon: Compass },
  { label: 'AI Study Companion', hint: 'Explain, hints, quizzes & study plans', path: '/ai-companion', icon: Sparkles },
  { label: 'Assignments', hint: 'Submissions & due dates', path: '/assignments', icon: BookOpen },
  { label: 'Timed DPP Quizzes', hint: 'Daily practice sets', path: '/dpp', icon: Brain },
  { label: 'Results & Analytics', hint: 'Exam scores & subject averages', path: '/results', icon: BarChart3 },
  { label: 'Attendance', hint: 'Semester attendance log', path: '/attendance', icon: ClipboardCheck },
  { label: 'Curriculum Timeline', hint: 'Syllabus chapters & topics', path: '/timeline', icon: Calendar },
  { label: 'Studycast Audio', hint: 'Subject revision episodes', path: '/studycast', icon: Headphones },
  { label: 'Todo List', hint: 'Daily study goals (+5 XP)', path: '/todos', icon: CheckSquare },
  { label: 'Class Leaderboard', hint: 'XP rankings & streaks', path: '/leaderboard', icon: Trophy },
  { label: 'Subject Chat', hint: 'Peer study channels', path: '/chat', icon: MessageSquare },
  { label: 'Fee Invoices', hint: 'Payments & PDF receipts', path: '/payments', icon: CreditCard },
  { label: 'Profile & XP Log', hint: 'Account & achievement history', path: '/profile', icon: User },
];

const TEACHER_QUICK_LINKS = [
  { label: 'Teacher Dashboard', hint: 'Class averages & overview', path: '/teacher/dashboard', icon: LayoutDashboard },
  { label: 'AI Study Companion', hint: 'Explain, hints, quizzes & study plans', path: '/ai-companion', icon: Sparkles },
  { label: 'Manage Assignments', hint: 'Create & grade coursework', path: '/teacher/assignments', icon: BookOpen },
  { label: 'Class Attendance', hint: 'Mark daily student roster', path: '/teacher/attendance', icon: ClipboardCheck },
  { label: 'Student Analytics', hint: 'Academic performance view', path: '/dashboard', icon: BarChart3 },
  { label: 'Leaderboard', hint: 'Top student XP rankings', path: '/leaderboard', icon: Trophy },
  { label: 'Profile', hint: 'Account settings', path: '/profile', icon: User },
];

export default function Header({ onOpenMobileMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [assignments, setAssignments] = useState([]);
  const searchInputRef = useRef(null);
  const searchBoxRef = useRef(null);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      } catch { /* ignore */ }
    };
    const fetchAssignments = async () => {
      try {
        const { data } = await api.get('/assignments');
        setAssignments(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch { /* ignore */ }
    };
    fetchNotifs();
    fetchAssignments();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const baseLinks = user?.role === 'teacher' ? TEACHER_QUICK_LINKS : STUDENT_QUICK_LINKS;

    const aiAction = {
      id: 'ai-action',
      label: q ? `Ask AI Companion: "${searchQuery.trim()}"` : 'Open AI Study Companion',
      hint: 'Gemini study assistant',
      icon: Sparkles,
      action: () => {
        window.dispatchEvent(
          new CustomEvent('schoolexpo:open-ai', {
            detail: q ? { prompt: searchQuery.trim() } : {},
          })
        );
      },
    };

    const pageItems = baseLinks
      .filter((item) => !q || item.label.toLowerCase().includes(q) || item.hint.toLowerCase().includes(q))
      .slice(0, 5)
      .map((item) => ({
        id: `page-${item.path}`,
        label: item.label,
        hint: item.hint,
        icon: item.icon,
        action: () => navigate(item.path),
      }));

    const assignmentItems = assignments
      .filter((a) => !q || a.title?.toLowerCase().includes(q) || a.subject_name?.toLowerCase().includes(q))
      .slice(0, 3)
      .map((a) => ({
        id: `asg-${a.id}`,
        label: a.title,
        hint: `${a.subject_name} · Assignment`,
        icon: BookOpen,
        action: () => navigate(user?.role === 'teacher' ? '/teacher/assignments' : '/assignments'),
      }));

    return q ? [...pageItems, ...assignmentItems, aiAction] : [aiAction, ...pageItems];
  }, [searchQuery, user?.role, assignments, navigate]);

  const executeResult = (item) => {
    if (!item) return;
    item.action();
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleSearchKeyDown = (e) => {
    if (!searchOpen) setSearchOpen(true);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, searchResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % Math.max(1, searchResults.length));
    } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
      e.preventDefault();
      executeResult(searchResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch { /* ignore */ }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'xp':
        return <Zap className="w-3.5 h-3.5 text-indigo-400" />;
      case 'assignment':
        return <BookOpen className="w-3.5 h-3.5 text-cyan-400" />;
      case 'attendance':
        return <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const handleNotifClick = (n) => {
    setShowNotifs(false);
    if (n.type === 'assignment') {
      navigate(user?.role === 'teacher' ? '/teacher/assignments' : '/assignments');
    } else if (n.type === 'attendance') {
      navigate(user?.role === 'teacher' ? '/teacher/attendance' : '/attendance');
    } else if (n.type === 'xp') {
      navigate('/leaderboard');
    }
  };

  return (
    <header
      data-testid="app-header"
      className="h-16 flex items-center justify-between gap-3 px-4 sm:px-6 sticky top-0 z-30 bg-[#080c17]/85 backdrop-blur-xl border-b border-white/[0.08]"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Functional Quick-Jump Search */}
        <div ref={searchBoxRef} className="relative max-w-md w-full">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            data-testid="header-search"
            type="text"
            value={searchQuery}
            onFocus={() => {
              setSearchOpen(true);
              setSelectedIndex(0);
            }}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
              setSelectedIndex(0);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Jump to page, assignment, or ask AI..."
            aria-label="Quick search workspace"
            className="w-full bg-[#0f1628] border border-white/[0.09] rounded-xl pl-10 pr-16 py-2 text-sm text-white placeholder:text-slate-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/45 focus:border-indigo-400/40 transition-colors"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-white/[0.05] border border-white/[0.08] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            ⌘K
          </kbd>

          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.14 }}
                className="absolute left-0 right-0 top-12 rounded-xl bg-[#0f1628] border border-white/[0.12] shadow-2xl overflow-hidden z-50 py-1.5"
              >
                {searchResults.map((item, idx) => {
                  const Icon = item.icon;
                  const active = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => executeResult(item)}
                      className={`w-full px-3.5 py-2.5 flex items-center gap-3 text-left transition-colors ${
                        active ? 'bg-indigo-500/15 text-white' : 'text-slate-300 hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-indigo-400" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        <p className="text-[11px] text-slate-400 truncate">{item.hint}</p>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* AI Study Companion Quick Button */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('schoolexpo:open-ai'))}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/12 border border-indigo-400/25 hover:bg-indigo-500/20 text-xs font-medium text-indigo-200 transition-colors whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
          <span>Ask AI</span>
        </button>

        {/* XP Counter Button */}
        {user?.xp_profile && (
          <button
            type="button"
            data-testid="xp-badge"
            onClick={() => navigate('/leaderboard')}
            title="View Class Leaderboard"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f1628] border border-white/[0.09] hover:border-indigo-400/35 transition-colors whitespace-nowrap shrink-0"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
            <span className="text-xs font-mono font-semibold tabular-nums text-indigo-300">
              {(user.xp_profile.total_xp || 0).toLocaleString()} XP
            </span>
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            data-testid="notifications-btn"
            aria-label="Toggle notifications"
            onClick={() => {
              setShowNotifs((prev) => !prev);
              setShowProfileMenu(false);
            }}
            className="relative p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
          >
            <Bell className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-bold font-mono flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifs(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  data-testid="notifications-panel"
                  className="absolute right-0 top-13 w-80 max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto rounded-2xl p-4 shadow-2xl z-50 bg-[#0f1628] border border-white/[0.12]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-white">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          data-testid="mark-all-read-btn"
                          onClick={markAllRead}
                          className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowNotifs(false)}
                        aria-label="Close notifications"
                        className="p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-40" />
                      <p className="text-slate-400 text-sm">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {notifications.slice(0, 10).map((n, i) => (
                        <button
                          key={n.id || i}
                          type="button"
                          onClick={() => handleNotifClick(n)}
                          className={`w-full text-left p-3 rounded-xl transition-colors hover:bg-white/[0.06] flex items-start gap-2.5 border ${
                            !n.is_read
                              ? 'bg-indigo-500/10 border-indigo-400/25'
                              : 'bg-transparent border-transparent'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#161f36] flex items-center justify-center flex-shrink-0 mt-0.5">
                            {getNotifIcon(n.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-white truncate">{n.title}</p>
                              {!n.is_read && (
                                <span className="text-[10px] font-mono text-cyan-400 shrink-0">New</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 leading-snug">{n.message}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar & Profile Menu */}
        <div className="relative">
          <button
            type="button"
            data-testid="user-avatar"
            aria-label="Open account menu"
            onClick={() => {
              setShowProfileMenu((prev) => !prev);
              setShowNotifs(false);
            }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-sm font-bold text-white hover:opacity-95 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 top-12 w-56 rounded-2xl p-2 bg-[#0f1628] border border-white/[0.12] shadow-2xl z-50"
                >
                  <div className="px-3 py-2 border-b border-white/[0.08] mb-1">
                    <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-sm text-slate-200 hover:bg-white/[0.06] flex items-center gap-2.5 transition-colors"
                  >
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>Profile & XP History</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-sm text-rose-300 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
