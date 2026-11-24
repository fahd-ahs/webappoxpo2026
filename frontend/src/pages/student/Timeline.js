import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown, ChevronRight, CheckCircle, Clock, Circle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';

const statusConfig = {
  completed: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  ongoing: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  upcoming: { icon: Circle, color: 'text-white/30', bg: 'bg-white/[0.04]' },
};

export default function Timeline() {
  const [chapters, setChapters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState('all');
  const [expandedChapters, setExpandedChapters] = useState({});

  useEffect(() => {
    const fetch = async () => {
      try {
        const [chapData, subjData] = await Promise.all([
          api.get('/timeline'),
          api.get('/subjects'),
        ]);
        setChapters(chapData.data);
        setSubjects(subjData.data);
        // Expand ongoing chapters by default
        const expanded = {};
        chapData.data.forEach(ch => { if (ch.status === 'ongoing') expanded[ch.id] = true; });
        setExpandedChapters(expanded);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const toggleChapter = (id) => {
    setExpandedChapters(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = activeSubject === 'all' ? chapters : chapters.filter(ch => ch.subject_id === activeSubject);

  if (loading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="glass-card h-24 shimmer-bg rounded-xl" />)}</div>;
  }

  return (
    <motion.div
      data-testid="timeline-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold font-['Outfit'] tracking-tight">Curriculum Timeline</h1>
        <p className="text-white/40 text-sm mt-1">Track your learning progress across subjects</p>
      </div>

      {/* Subject Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveSubject('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeSubject === 'all' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'bg-white/[0.04] text-white/40 border border-transparent'}`}
        >
          All Subjects
        </button>
        {subjects.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSubject(s.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeSubject === s.id ? 'border' : 'bg-white/[0.04] text-white/40 border border-transparent'}`}
            style={activeSubject === s.id ? { background: `${s.color}20`, color: s.color, borderColor: `${s.color}40` } : {}}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Chapters */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Calendar className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No chapters found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ch) => {
            const expanded = expandedChapters[ch.id];
            const StatusIcon = statusConfig[ch.status]?.icon || Circle;
            const statusColor = statusConfig[ch.status]?.color || 'text-white/30';
            const subject = subjects.find(s => s.id === ch.subject_id);

            return (
              <motion.div
                key={ch.id}
                layout
                className="glass-card overflow-hidden"
              >
                <button
                  onClick={() => toggleChapter(ch.id)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                  data-testid={`chapter-${ch.id}`}
                >
                  {expanded ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
                  <div className="w-1.5 h-8 rounded-full" style={{ background: subject?.color || '#6366f1' }} />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{ch.name}</p>
                    <p className="text-xs text-white/40">{ch.subject_name} &middot; {ch.topics?.length || 0} topics</p>
                  </div>
                  <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                  <div className="w-24">
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${ch.progress || 0}%` }} />
                    </div>
                    <p className="text-[10px] text-white/30 mt-1 text-right font-mono">{ch.progress || 0}%</p>
                  </div>
                </button>

                {expanded && ch.topics && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 pb-4 pl-12 space-y-1.5"
                  >
                    {ch.topics.map((topic, i) => {
                      const TIcon = statusConfig[topic.status]?.icon || Circle;
                      const tColor = statusConfig[topic.status]?.color || 'text-white/30';
                      return (
                        <div key={topic.id || i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                          <TIcon className={`w-4 h-4 ${tColor} flex-shrink-0`} />
                          <span className="text-sm text-white/70">{topic.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusConfig[topic.status]?.bg} ${tColor}`}>
                            {topic.status}
                          </span>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
