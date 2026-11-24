import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Headphones, Play, Pause, SkipBack, SkipForward, Volume2,
  Search, Filter, Clock, ChevronRight, X
} from 'lucide-react';

const containerV = { animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } };
const cardV = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } } };

export default function Studycast() {
  const { user } = useAuth();
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [playing, setPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/studycast');
        setEpisodes(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
    return () => { if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); };
  }, []);

  const subjects = [...new Set(episodes.map(e => e.subject_name))];
  const filtered = episodes.filter(e => {
    if (subjectFilter && e.subject_name !== subjectFilter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const continueListening = episodes.filter(e => e.progress && e.progress.percentage > 0 && e.progress.percentage < 100);

  const playEpisode = (ep) => {
    setPlaying(ep);
    setCurrentTime(ep.progress?.current_time || 0);
    setIsPlaying(true);
    // Simulate audio playback with interval
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    let time = ep.progress?.current_time || 0;
    progressIntervalRef.current = setInterval(() => {
      time += playbackRate;
      if (time >= ep.duration_seconds) {
        clearInterval(progressIntervalRef.current);
        setIsPlaying(false);
        time = ep.duration_seconds;
      }
      setCurrentTime(time);
    }, 1000);
  };

  const togglePlay = () => {
    if (isPlaying) {
      clearInterval(progressIntervalRef.current);
      setIsPlaying(false);
      // Save progress
      if (playing) {
        api.post(`/studycast/${playing.id}/progress`, { current_time: currentTime, duration: playing.duration_seconds }).catch(() => {});
      }
    } else if (playing) {
      let time = currentTime;
      progressIntervalRef.current = setInterval(() => {
        time += playbackRate;
        if (time >= playing.duration_seconds) {
          clearInterval(progressIntervalRef.current);
          setIsPlaying(false);
          time = playing.duration_seconds;
        }
        setCurrentTime(time);
      }, 1000);
      setIsPlaying(true);
    }
  };

  const skip = (seconds) => {
    const newTime = Math.max(0, Math.min(currentTime + seconds, playing?.duration_seconds || 0));
    setCurrentTime(newTime);
  };

  const seekTo = (e) => {
    if (!playing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const newTime = pct * playing.duration_seconds;
    setCurrentTime(newTime);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) return <StudycastSkeleton />;

  return (
    <motion.div data-testid="studycast-page" variants={containerV} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <motion.div variants={cardV} className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-['Outfit']">Studycast</h1>
            <p className="text-[var(--text-muted)] text-sm">{episodes.length} episodes available</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              data-testid="studycast-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search episodes..."
              className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-56"
            />
          </div>
          <select
            data-testid="studycast-filter"
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </motion.div>

      {/* Continue Listening */}
      {continueListening.length > 0 && (
        <motion.div variants={cardV}>
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">Continue Listening</h2>
          {continueListening.map(ep => (
            <div
              key={ep.id}
              onClick={() => playEpisode(ep)}
              data-testid={`continue-${ep.id}`}
              className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:border-indigo-500/20 transition-all group"
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${ep.thumbnail_color}20` }}>
                <Headphones className="w-6 h-6" style={{ color: ep.thumbnail_color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate group-hover:text-indigo-400 transition-colors">{ep.title}</p>
                <p className="text-xs text-[var(--text-muted)]">{ep.subject_name} · {ep.instructor} · {ep.duration_label}</p>
                <div className="h-1.5 bg-[var(--surface-3)] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full" style={{ width: `${ep.progress?.percentage || 0}%` }} />
                </div>
              </div>
              <div className="text-xs text-indigo-400 font-mono">{Math.round(ep.progress?.percentage || 0)}%</div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-indigo-400 transition-colors" />
            </div>
          ))}
        </motion.div>
      )}

      {/* All Episodes Grid */}
      <motion.div variants={cardV}>
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">All Episodes</h2>
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Headphones className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-30" />
            <p className="text-[var(--text-muted)]">No episodes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((ep, i) => (
              <motion.div
                key={ep.id}
                variants={cardV}
                whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(99,102,241,0.15)' }}
                onClick={() => playEpisode(ep)}
                data-testid={`episode-${ep.id}`}
                className="glass-card p-4 cursor-pointer hover:border-indigo-500/20 transition-all group"
              >
                <div className="w-full h-28 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${ep.thumbnail_color}15, ${ep.thumbnail_color}30)` }}>
                  <Headphones className="w-10 h-10 opacity-40" style={{ color: ep.thumbnail_color }} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <p className="text-sm font-semibold truncate group-hover:text-indigo-400 transition-colors">{ep.title}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{ep.subject_name} · {ep.duration_label}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{ep.instructor}</p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Sticky Mini Player */}
      <AnimatePresence>
        {playing && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            data-testid="studycast-player"
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-subtle)]"
            style={{ background: 'rgba(10, 14, 26, 0.95)', backdropFilter: 'blur(20px)' }}
          >
            <div className="max-w-screen-xl mx-auto px-6 py-3">
              {/* Progress bar */}
              <div className="h-1 bg-[var(--surface-3)] rounded-full mb-3 cursor-pointer group" onClick={seekTo} data-testid="player-progress">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full relative"
                  style={{ width: `${playing.duration_seconds > 0 ? (currentTime / playing.duration_seconds) * 100 : 0}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              </div>
              <div className="flex items-center gap-4">
                {/* Track Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: `${playing.thumbnail_color}20` }}>
                    {isPlaying ? (
                      <div className="flex items-end gap-0.5 h-5">
                        {[1,2,3,4,5].map(i => <div key={i} className="waveform-bar" style={{ animationDelay: `${i*0.1}s` }} />)}
                      </div>
                    ) : (
                      <Headphones className="w-4 h-4" style={{ color: playing.thumbnail_color }} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{playing.title}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{playing.instructor}</p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  <button onClick={() => skip(-10)} className="p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors" data-testid="player-rewind">
                    <SkipBack className="w-4 h-4 text-[var(--text-secondary)]" />
                  </button>
                  <button
                    onClick={togglePlay}
                    data-testid="player-play-pause"
                    className="w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-400 flex items-center justify-center transition-colors shadow-lg shadow-indigo-500/25"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
                  </button>
                  <button onClick={() => skip(10)} className="p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors" data-testid="player-forward">
                    <SkipForward className="w-4 h-4 text-[var(--text-secondary)]" />
                  </button>
                </div>

                {/* Time + Speed */}
                <div className="hidden md:flex items-center gap-4">
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    {formatTime(currentTime)} / {formatTime(playing.duration_seconds)}
                  </span>
                  <select
                    value={playbackRate}
                    onChange={e => setPlaybackRate(Number(e.target.value))}
                    data-testid="player-speed"
                    className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                  >
                    {[0.75, 1, 1.25, 1.5, 2].map(r => <option key={r} value={r}>{r}x</option>)}
                  </select>
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <input
                      type="range" min="0" max="1" step="0.1" value={volume}
                      onChange={e => setVolume(Number(e.target.value))}
                      className="w-16 accent-indigo-500"
                    />
                  </div>
                </div>

                <button onClick={() => { clearInterval(progressIntervalRef.current); setPlaying(null); setIsPlaying(false); }} className="p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
                  <X className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StudycastSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 rounded-xl bg-[var(--surface-1)] shimmer-bg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="glass-card shimmer-bg rounded-2xl" style={{ height: 220 }} />
        ))}
      </div>
    </div>
  );
}
