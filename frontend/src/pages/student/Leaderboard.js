import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { motion } from 'framer-motion';
import { Trophy, Zap, Flame, Medal, ChevronUp, ChevronDown, Minus } from 'lucide-react';

export default function Leaderboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: d } = await api.get('/leaderboard');
        setData(d);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) {
    return <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="glass-card h-16 shimmer-bg rounded-xl" />)}</div>;
  }

  const leaderboard = data?.leaderboard || [];
  const currentUser = data?.current_user;
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const podiumColors = ['from-amber-400 to-yellow-500', 'from-gray-300 to-gray-400', 'from-amber-600 to-amber-700'];
  const podiumLabels = ['1st', '2nd', '3rd'];
  const podiumHeights = ['h-32', 'h-24', 'h-20'];

  return (
    <motion.div
      data-testid="leaderboard-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold font-['Outfit'] tracking-tight">Leaderboard</h1>
        <p className="text-white/40 text-sm mt-1">Top performers ranked by XP</p>
      </div>

      {/* Podium */}
      {top3.length >= 3 && (
        <div className="glass-card p-8">
          <div className="flex items-end justify-center gap-4 mb-6">
            {/* 2nd place */}
            <PodiumCard
              student={top3[1]}
              rank={2}
              color={podiumColors[1]}
              height={podiumHeights[1]}
              isCurrentUser={top3[1].user_id === user?.id}
            />
            {/* 1st place */}
            <PodiumCard
              student={top3[0]}
              rank={1}
              color={podiumColors[0]}
              height={podiumHeights[0]}
              isCurrentUser={top3[0].user_id === user?.id}
            />
            {/* 3rd place */}
            <PodiumCard
              student={top3[2]}
              rank={3}
              color={podiumColors[2]}
              height={podiumHeights[2]}
              isCurrentUser={top3[2].user_id === user?.id}
            />
          </div>
        </div>
      )}

      {/* Current User Rank */}
      {currentUser && currentUser.rank > 3 && (
        <div className="glass-card p-4 border border-indigo-500/20 bg-indigo-500/5">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold font-mono text-indigo-400 w-8">#{currentUser.rank}</span>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-sm">
              {currentUser.name?.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{currentUser.name} <span className="text-xs text-indigo-400">(You)</span></p>
              <p className="text-xs text-white/40">Level {currentUser.level} - {currentUser.level_title}</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-indigo-400 flex items-center gap-1"><Zap className="w-4 h-4" /> {currentUser.total_xp}</p>
              {currentUser.streak > 0 && (
                <p className="text-xs text-amber-400 flex items-center gap-1"><Flame className="w-3 h-3" /> {currentUser.streak}d streak</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rest of leaderboard */}
      <div className="glass-card divide-y divide-white/[0.04]">
        {rest.map((s) => (
          <motion.div
            key={s.user_id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors ${
              s.user_id === user?.id ? 'bg-indigo-500/5' : ''
            }`}
            data-testid={`leaderboard-row-${s.rank}`}
          >
            <span className="text-sm font-bold font-mono text-white/40 w-8">#{s.rank}</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/30 to-cyan-400/30 flex items-center justify-center text-sm font-bold">
              {s.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {s.name}
                {s.user_id === user?.id && <span className="text-xs text-indigo-400 ml-1">(You)</span>}
              </p>
              <p className="text-xs text-white/30">{s.class_name} &middot; Level {s.level} - {s.level_title}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-mono text-sm font-bold text-white/80">{s.total_xp} XP</p>
              {s.streak > 0 && (
                <p className="text-xs text-amber-400/70 flex items-center justify-end gap-1"><Flame className="w-3 h-3" /> {s.streak}d</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function PodiumCard({ student, rank, color, height, isCurrentUser }) {
  const medals = { 1: '1st', 2: '2nd', 3: '3rd' };
  const sizes = { 1: 'w-16 h-16 text-lg', 2: 'w-14 h-14 text-base', 3: 'w-14 h-14 text-base' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.15 }}
      className="flex flex-col items-center"
      data-testid={`podium-${rank}`}
    >
      <div className={`${sizes[rank]} rounded-full bg-gradient-to-br ${color} flex items-center justify-center font-bold mb-2 ${isCurrentUser ? 'ring-2 ring-indigo-400' : ''}`}>
        {student.name?.charAt(0)}
      </div>
      <p className="text-sm font-medium text-center truncate max-w-[100px]">{student.name}</p>
      <p className="text-xs font-mono text-white/50">{student.total_xp} XP</p>
      <div className={`w-24 ${height} mt-3 rounded-t-lg bg-gradient-to-t ${color} flex items-center justify-center`}>
        <span className="text-xl font-bold text-white/90">{medals[rank]}</span>
      </div>
    </motion.div>
  );
}
