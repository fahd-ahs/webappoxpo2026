import { useState, useEffect } from 'react';
import { Check, Clock, Flame, BookOpen, Calendar, Plus, Headphones, Play, Pause } from 'lucide-react';

const SCHEDULE_ITEMS = [
  { time: '09:00', end: '09:45', subject: 'Mathematics', room: 'Room 201', color: '#6366f1', active: true },
  { time: '09:45', end: '10:30', subject: 'Physics', room: 'Lab 1', color: '#22d3ee', active: false },
  { time: '11:00', end: '11:45', subject: 'Chemistry', room: 'Lab 2', color: '#10b981', active: false },
];

const DEADLINE_ITEMS = [
  { id: 'd1', title: 'Sets & Relations Practice', subject: 'Mathematics', due: '3d', xp: 50, color: '#6366f1', status: 'Graded · 18/20' },
  { id: 'd2', title: 'Kinematics Numerical Problems', subject: 'Physics', due: '5d', xp: 75, color: '#22d3ee', status: 'Due in 5 days' },
  { id: 'd3', title: 'Trigonometry Assignment', subject: 'Mathematics', due: '7d', xp: 60, color: '#6366f1', status: 'Due in 7 days' },
  { id: 'd4', title: 'Atomic Structure Worksheet', subject: 'Chemistry', due: '1d', xp: 40, color: '#10b981', status: 'Submitted' },
];

const INITIAL_GOALS = [
  { id: 'g1', text: 'Review Trigonometry Identities', subject: 'Mathematics', done: false },
  { id: 'g2', text: 'Solve Kinematics DPP (5 MCQs)', subject: 'Physics', done: true },
  { id: 'g3', text: 'Bohr Atomic Model Revision', subject: 'Chemistry', done: false },
];

const SUBJECT_FILTERS = ['All', 'Mathematics', 'Physics', 'Chemistry'];

function formatSeconds(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function HeroPlannerPreview() {
  const [subject, setSubject] = useState('All');
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [newTask, setNewTask] = useState('');
  const [playingAudio, setPlayingAudio] = useState(false);
  const [audioSeconds, setAudioSeconds] = useState(495);
  const [playbackSpeed, setPlaybackSpeed] = useState('1x');

  useEffect(() => {
    if (!playingAudio) return undefined;
    const stepMs = playbackSpeed === '1.5x' ? 667 : playbackSpeed === '1.25x' ? 800 : 1000;
    const timer = setInterval(() => {
      setAudioSeconds((prev) => (prev >= 1320 ? 0 : prev + 1));
    }, stepMs);
    return () => clearInterval(timer);
  }, [playingAudio, playbackSpeed]);

  const toggleGoal = (id) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, done: !g.done } : g)));
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    const trimmed = newTask.trim();
    if (!trimmed) return;
    setGoals((prev) => [
      { id: `custom-${Date.now()}`, text: trimmed, subject: subject === 'All' ? 'General' : subject, done: false },
      ...prev.slice(0, 3),
    ]);
    setNewTask('');
  };

  const completedGoals = goals.filter((g) => g.done).length;
  const goalPct = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;
  const bonusXp = goals.filter((g) => g.done && g.id !== 'g2').length * 5;
  const currentXp = 2450 + bonusXp;
  const xpRatio = Math.min(1, (currentXp - 2000) / (3500 - 2000));

  const filteredSchedule =
    subject === 'All' ? SCHEDULE_ITEMS : SCHEDULE_ITEMS.filter((s) => s.subject === subject);
  const filteredDeadlines =
    subject === 'All' ? DEADLINE_ITEMS.slice(0, 3) : DEADLINE_ITEMS.filter((d) => d.subject === subject);

  const cycleSpeed = () => {
    setPlaybackSpeed((prev) => (prev === '1x' ? '1.25x' : prev === '1.25x' ? '1.5x' : '1x'));
  };

  return (
    <div
      className="bg-[#111318] border border-white/[0.09] rounded-xl shadow-[0_24px_70px_rgba(0,0,0,0.6)] overflow-hidden"
      aria-label="Interactive Student Planner Preview"
    >
      {/* Window Top Bar */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-white/[0.07] bg-[#14171e] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-white/60">
          <span className="font-medium text-white">Aarav Patel</span>
          <span aria-hidden="true" className="text-white/25">·</span>
          <span className="font-mono tabular-nums">Class 11-A</span>
          <span aria-hidden="true" className="text-white/25 hidden sm:inline">·</span>
          <span className="text-white/45 hidden sm:inline">Interactive Preview</span>
        </div>

        <div
          className="flex items-center gap-1 p-0.5 rounded-lg bg-[#0b0c10] border border-white/[0.06]"
          role="tablist"
          aria-label="Filter preview by subject"
        >
          {SUBJECT_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={subject === item}
              onClick={() => setSubject(item)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 ${
                subject === item
                  ? 'bg-[#6366f1] text-white'
                  : 'text-white/55 hover:text-white'
              }`}
            >
              {item === 'Mathematics' ? 'Math' : item === 'Chemistry' ? 'Chem' : item}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Body */}
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left 7 Cols: Schedule + Interactive Daily Tasks */}
        <div className="md:col-span-7 space-y-5">
          {/* Today's Schedule */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs font-medium text-white/55 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#818cf8]" aria-hidden="true" />
                <span>Today's Schedule</span>
              </h2>
              <span className="text-[11px] font-mono tabular-nums text-white/45">Mon · {filteredSchedule.length} classes</span>
            </div>
            <div className="divide-y divide-white/[0.05] border border-white/[0.06] rounded-lg bg-[#0b0d12]">
              {filteredSchedule.map((slot) => (
                <div key={slot.time} className="px-3 py-2.5 flex items-center gap-3">
                  <span className="text-xs font-mono tabular-nums text-white/45 w-11 shrink-0">
                    {slot.time}
                  </span>
                  <span
                    className="w-1 h-5 rounded-full shrink-0"
                    style={{ backgroundColor: slot.color }}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white truncate">{slot.subject}</p>
                      {slot.active && (
                        <span className="text-[11px] font-mono text-[#22d3ee] shrink-0">Next</span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/45 font-mono tabular-nums">
                      {slot.time} – {slot.end} · {slot.room}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Daily Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs font-medium text-white/55">Daily Tasks</h2>
              <span className="text-[11px] font-mono tabular-nums text-[#22d3ee]">{goalPct}% completed</span>
            </div>

            <form onSubmit={handleAddGoal} className="flex items-center gap-2 mb-2.5">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a quick study task..."
                aria-label="Add a quick study task"
                maxLength={52}
                className="flex-1 min-w-0 bg-[#0b0d12] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
              />
              <button
                type="submit"
                aria-label="Add task"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-medium text-white transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add</span>
              </button>
            </form>

            <div className="space-y-1.5">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-white/[0.06] bg-[#0b0d12] hover:border-white/[0.15] transition-colors duration-150 flex items-center gap-3 group"
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                      goal.done
                        ? 'bg-[#6366f1] text-white'
                        : 'border border-white/25 group-hover:border-[#818cf8]'
                    }`}
                  >
                    {goal.done && <Check className="w-3 h-3" strokeWidth={3} />}
                  </span>
                  <span
                    className={`text-xs sm:text-sm flex-1 truncate ${
                      goal.done ? 'line-through text-white/40' : 'text-white/90'
                    }`}
                  >
                    {goal.text}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-white/45 shrink-0">
                    +5 XP
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: XP Progress, Attendance & Upcoming Deadlines */}
        <div className="md:col-span-5 flex flex-col justify-between gap-4">
          {/* Progress Snapshot */}
          <div className="p-3.5 rounded-lg border border-white/[0.06] bg-[#0b0d12] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50">Academic XP</p>
                <p className="text-xl font-bold font-mono tabular-nums text-white mt-0.5">
                  {currentXp.toLocaleString()} XP
                </p>
                <p className="text-[11px] text-[#818cf8]">Level 5 · Master</p>
              </div>
              <div className="relative w-14 h-14 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60" aria-hidden="true">
                  <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 24}
                    strokeDashoffset={2 * Math.PI * 24 * (1 - xpRatio)}
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-mono tabular-nums text-white/80">
                  {Math.round(xpRatio * 100)}%
                </span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs gap-2">
              <span className="text-white/55 flex items-center gap-1.5 whitespace-nowrap">
                <Flame className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                <span>14-day streak</span>
              </span>
              <span className="font-mono tabular-nums text-emerald-400 whitespace-nowrap">88.5% · On track</span>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="p-3.5 rounded-lg border border-white/[0.06] bg-[#0b0d12] flex-1">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs font-medium text-white/55 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#22d3ee]" aria-hidden="true" />
                <span>Upcoming Deadlines</span>
              </h2>
            </div>
            <div className="space-y-2.5">
              {filteredDeadlines.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2 min-w-0">
                    <span
                      className="w-1 h-7 rounded-full mt-0.5 shrink-0"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{item.title}</p>
                      <p className="text-[11px] text-white/45 truncate">
                        {item.subject} · {item.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono tabular-nums text-white/60 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-white/35" aria-hidden="true" />
                      {item.due}
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-[#818cf8]">+{item.xp} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Studycast Mini-Bar */}
      <div className="px-4 sm:px-5 py-3 border-t border-white/[0.07] bg-[#0d1016] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setPlayingAudio((prev) => !prev)}
            aria-label={playingAudio ? 'Pause Studycast preview' : 'Play Studycast preview'}
            className="w-8 h-8 rounded-lg bg-[#6366f1] hover:bg-[#5558e6] text-white flex items-center justify-center shrink-0 transition-colors"
          >
            {playingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-[#22d3ee] shrink-0" aria-hidden="true" />
              <span className="truncate">Studycast · Calculus 101: Limits & Continuity</span>
            </p>
            <p className="text-[11px] text-white/45 truncate">
              Dr. Sunita Rao · Resume saved progress
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-mono tabular-nums text-white/55 hidden sm:inline">
            {formatSeconds(audioSeconds)} / 22:00
          </span>
          <button
            type="button"
            onClick={cycleSpeed}
            aria-label="Change playback speed"
            className="px-2 py-1 rounded-md border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.07] text-[11px] font-mono tabular-nums text-white/75 transition-colors whitespace-nowrap"
          >
            {playbackSpeed}
          </button>
        </div>
      </div>
    </div>
  );
}
