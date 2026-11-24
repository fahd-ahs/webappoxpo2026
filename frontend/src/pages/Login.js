import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { GraduationCap, Eye, EyeOff, ArrowRight, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroPlannerPreview from '../components/landing/HeroPlannerPreview';
import FeatureShowcase from '../components/landing/FeatureShowcase';
import ProductPreviewTabs from '../components/landing/ProductPreviewTabs';
import RoleWorkflowSection from '../components/landing/RoleWorkflowSection';
import signinVisual from '../assets/images/signin_obsidian_study.jpg';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);

  const signInSectionRef = useRef(null);
  const emailInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((item) => item.msg || JSON.stringify(item)).join(' ')
            : 'Invalid email or password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const scrollToSignIn = (focusEmail = true) => {
    signInSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (focusEmail) {
      setTimeout(() => {
        emailInputRef.current?.focus({ preventScroll: true });
      }, 450);
    }
  };

  const fillDemo = (role, scroll = false) => {
    setError('');
    if (role === 'student') {
      setEmail('aarav@schoolexpo.com');
      setPassword('student123');
    } else if (role === 'teacher') {
      setEmail('arun@schoolexpo.com');
      setPassword('teacher123');
    }
    if (scroll) {
      scrollToSignIn(false);
    }
  };

  const scrollToFeatures = () => {
    document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div id="top" className="min-h-screen bg-[#0a0a0a] text-white selection:bg-indigo-500/30">
      <LandingNavbar onStartPlanning={scrollToSignIn} />

      <main>
        {/* Hero Section */}
        <section className="relative pt-12 pb-20 lg:pt-16 lg:pb-24 overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(99,102,241,0.12),transparent)]"
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Value Proposition & CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-5 space-y-6"
              >
                <p className="text-xs font-mono tracking-wider text-white/50">
                  School Expo Project · Student Planner
                </p>

                <h1 className="text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.08] font-semibold font-['Outfit'] tracking-tight text-white [text-wrap:balance]">
                  Plan every subject, deadline, and study streak in one place.
                </h1>

                <p className="text-base text-white/65 leading-relaxed max-w-lg">
                  SchoolExpo brings your daily class schedule, assignments, timed DPP quizzes, exam analytics, and Studycast audio into one calm workspace built for students and teachers.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => scrollToSignIn(true)}
                    data-testid="hero-start-planning-btn"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#6366f1] hover:bg-[#5558e6] text-white text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  >
                    <span>Start Planning</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={scrollToFeatures}
                    data-testid="hero-explore-features-btn"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.07] text-white/85 hover:text-white text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    <span>Explore Features</span>
                    <ArrowDown className="w-4 h-4 text-white/55" aria-hidden="true" />
                  </button>
                </div>

                {/* Unboxed Key Facts Strip */}
                <div className="pt-4 border-t border-white/[0.07] grid grid-cols-3 gap-4 max-w-md">
                  <div>
                    <p className="text-lg font-semibold font-mono tabular-nums text-white">5</p>
                    <p className="text-xs text-white/50">Core Subjects</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold font-mono tabular-nums text-white">3 Sets</p>
                    <p className="text-xs text-white/50">Timed DPP Quizzes</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold font-mono tabular-nums text-white">12</p>
                    <p className="text-xs text-white/50">Study Modules</p>
                  </div>
                </div>
              </motion.div>

              {/* Right Column: Interactive Student Planner Preview */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-7"
              >
                <HeroPlannerPreview />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature Showcase */}
        <FeatureShowcase />

        {/* Interactive Product Preview */}
        <ProductPreviewTabs />

        {/* Student & Teacher Workflows */}
        <RoleWorkflowSection onDemoSelect={(role) => fillDemo(role, true)} />

        {/* Closing CTA + Embedded Split Sign-In Portal */}
        <section
          id="signin"
          ref={signInSectionRef}
          className="py-20 lg:py-28 border-t border-white/[0.06] scroll-mt-16"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-white/[0.1] bg-[#111318] overflow-hidden shadow-[0_28px_80px_rgba(0,0,0,0.65)] grid grid-cols-1 lg:grid-cols-12 items-stretch">
              {/* Left Atmospheric Dark Obsidian Editorial Panel */}
              <div className="lg:col-span-6 relative min-h-[340px] lg:min-h-[540px] flex flex-col justify-between p-7 sm:p-10 bg-[#0b0d12] border-b lg:border-b-0 lg:border-r border-white/[0.08] overflow-hidden">
                {!imgError && (
                  <img
                    src={signinVisual}
                    alt="Minimalist dark slate academic study desk with notebook and subtle indigo rim lighting"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                  />
                )}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#080a0f] via-[#080a0f]/75 to-[#080a0f]/35"
                />

                {/* Top Editorial Lockup */}
                <div className="relative z-10 flex items-center gap-2.5 text-sm font-semibold font-['Outfit'] tracking-tight text-white">
                  <span className="w-8 h-8 rounded-lg bg-[#6366f1] flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-white" aria-hidden="true" />
                  </span>
                  <span>SchoolExpo</span>
                </div>

                {/* Bottom Value Statement & Demo Reference */}
                <div className="relative z-10 space-y-5 mt-12">
                  <div>
                    <p className="text-xs font-mono tracking-wider text-[#22d3ee] mb-2">
                      Try SchoolExpo Now
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-semibold font-['Outfit'] tracking-tight text-white [text-wrap:balance]">
                      Start organizing your academic week today.
                    </h2>
                    <p className="mt-2.5 text-sm text-white/70 leading-relaxed max-w-md">
                      Sign in with your SchoolExpo credentials or load a demo student or teacher account in one click to explore the full planner.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/[0.12] space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/55">Student Demo</span>
                      <span className="font-mono text-white/85">aarav@schoolexpo.com</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/55">Teacher Demo</span>
                      <span className="font-mono text-white/85">arun@schoolexpo.com</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Working Sign-In Form Panel */}
              <div className="lg:col-span-6 p-7 sm:p-10 lg:p-12 flex flex-col justify-center bg-[#111318]">
                <div className="max-w-sm w-full mx-auto">
                  <div className="mb-7">
                    <h3 className="text-2xl font-semibold font-['Outfit'] tracking-tight text-white">
                      Welcome back
                    </h3>
                    <p className="mt-1.5 text-sm text-white/55">
                      Sign in to access your student or teacher workspace.
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div
                      data-testid="login-error"
                      role="alert"
                      className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm"
                    >
                      {error}
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="login-email" className="block text-xs font-medium text-white/70 mb-1.5">
                        Email
                      </label>
                      <input
                        id="login-email"
                        ref={emailInputRef}
                        data-testid="login-email-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@schoolexpo.com"
                        required
                        className="w-full bg-[#0a0c10] border border-white/[0.11] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/40 transition-colors"
                      />
                    </div>

                    <div>
                      <label htmlFor="login-password" className="block text-xs font-medium text-white/70 mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="login-password"
                          data-testid="login-password-input"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          className="w-full bg-[#0a0c10] border border-white/[0.11] rounded-lg px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/40 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white/80 p-1"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      data-testid="login-submit-btn"
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#6366f1] hover:bg-[#5558e6] text-white text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                  </form>

                  {/* Quick Demo Access */}
                  <div className="mt-7 pt-5 border-t border-white/[0.08]">
                    <p className="text-xs text-white/45 text-center mb-3">Quick Demo Access</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        data-testid="demo-student-btn"
                        onClick={() => fillDemo('student', false)}
                        className="py-2.5 px-3 rounded-lg bg-white/[0.04] border border-white/[0.09] text-xs sm:text-sm font-medium text-white/80 hover:text-white hover:bg-white/[0.08] transition-colors"
                      >
                        Student
                      </button>
                      <button
                        type="button"
                        data-testid="demo-teacher-btn"
                        onClick={() => fillDemo('teacher', false)}
                        className="py-2.5 px-3 rounded-lg bg-white/[0.04] border border-white/[0.09] text-xs sm:text-sm font-medium text-white/80 hover:text-white hover:bg-white/[0.08] transition-colors"
                      >
                        Teacher
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-white/[0.07] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/45">
          <div className="flex items-center gap-2 font-['Outfit'] font-semibold text-white/80">
            <GraduationCap className="w-4 h-4 text-[#818cf8]" aria-hidden="true" />
            <span>SchoolExpo</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#preview" className="hover:text-white transition-colors">Preview</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#signin" className="hover:text-white transition-colors">Sign In</a>
          </div>

          <p>Student Planner · School Expo Project</p>
        </div>
      </footer>
    </div>
  );
}
