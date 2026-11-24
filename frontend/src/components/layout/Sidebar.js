import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, Calendar, BarChart3, ClipboardCheck,
  Brain, CheckSquare, Trophy, User, ChevronLeft, ChevronRight,
  GraduationCap, PenTool, LogOut, Headphones, CreditCard, MessageSquare, X, Sparkles, Compass
} from 'lucide-react';

const studentNavItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/learning-compass', icon: Compass, label: 'Learning Compass' },
  { path: '/ai-companion', icon: Sparkles, label: 'AI Companion' },
  { path: '/assignments', icon: BookOpen, label: 'Assignments' },
  { path: '/timeline', icon: Calendar, label: 'Timeline' },
  { path: '/results', icon: BarChart3, label: 'Results' },
  { path: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { path: '/dpp', icon: Brain, label: 'DPP' },
  { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { path: '/studycast', icon: Headphones, label: 'Studycast' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/payments', icon: CreditCard, label: 'Payments' },
  { path: '/todos', icon: CheckSquare, label: 'Todo List' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const teacherNavItems = [
  { path: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/ai-companion', icon: Sparkles, label: 'AI Companion' },
  { path: '/teacher/assignments', icon: PenTool, label: 'Assignments' },
  { path: '/teacher/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { path: '/dashboard', icon: BarChart3, label: 'Analytics' },
  { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { path: '/profile', icon: User, label: 'Profile' },
];

function SidebarContent({ collapsed, mobile, onCloseMobile }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = user?.role === 'teacher' ? teacherNavItems : studentNavItems;
  const isCompact = collapsed && !mobile;

  return (
    <>
      {/* Brand Row */}
      <div className="flex items-center justify-between gap-3 px-4 h-16 border-b border-white/[0.08] shrink-0">
        <button
          type="button"
          onClick={() => {
            navigate(user?.role === 'teacher' ? '/teacher/dashboard' : '/dashboard');
            onCloseMobile?.();
          }}
          className="flex items-center gap-3 text-left min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_rgba(99,102,241,0.28)]">
            <GraduationCap className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          {!isCompact && (
            <span className="text-lg font-bold font-['Outfit'] tracking-tight whitespace-nowrap gradient-text">
              SchoolExpo
            </span>
          )}
        </button>

        {mobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav aria-label="Workspace navigation" className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onCloseMobile?.()}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              title={isCompact ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 group relative ${
                isActive
                  ? 'bg-indigo-500/12 text-white'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId={mobile ? 'mobileSidebarActive' : 'sidebarActive'}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-indigo-400 to-cyan-400 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <item.icon
                className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150 ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-300'
                }`}
                aria-hidden="true"
              />
              {!isCompact && (
                <span className="text-[13px] font-medium whitespace-nowrap truncate">
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile & Logout Section */}
      <div className="p-3 border-t border-white/[0.08] space-y-1.5 shrink-0">
        {!isCompact && user && (
          <button
            type="button"
            onClick={() => {
              navigate('/profile');
              onCloseMobile?.();
            }}
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-white/[0.05] transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 capitalize truncate">
                {user.role}{user.class_name ? ` · ${user.class_name}` : ''}
              </p>
            </div>
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            onCloseMobile?.();
            logout();
          }}
          data-testid="logout-btn"
          title={isCompact ? 'Logout' : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors duration-150 group"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" aria-hidden="true" />
          {!isCompact && <span className="text-[13px] font-medium">Logout</span>}
        </button>
      </div>
    </>
  );
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  return (
    <>
      {/* Desktop Rail */}
      <motion.aside
        data-testid="sidebar"
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex fixed left-0 top-0 h-screen z-40 flex-col bg-[#0c1222] border-r border-white/[0.08]"
      >
        <SidebarContent collapsed={collapsed} mobile={false} />

        {/* Collapse Toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          data-testid="sidebar-toggle"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3.5 top-20 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-[#131c31] hover:bg-[#1b2742] transition-colors border border-white/[0.12] shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </motion.aside>

      {/* Mobile Slide-Over Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden fixed left-0 top-0 h-screen w-[272px] z-[60] flex flex-col bg-[#0c1222] border-r border-white/[0.1] shadow-2xl"
            >
              <SidebarContent
                collapsed={false}
                mobile={true}
                onCloseMobile={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
