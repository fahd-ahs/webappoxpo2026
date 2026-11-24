import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { motion } from 'framer-motion';
import { ClipboardCheck, Users, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function TeacherAttendance() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [presentIds, setPresentIds] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/attendance/class?date=${date}`);
      setStudents(data.students || []);
      const present = new Set(data.students?.filter(s => s.is_present === true).map(s => s.id) || []);
      setPresentIds(present);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const toggleStudent = (id) => {
    setPresentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const markAll = (present) => {
    if (present) {
      setPresentIds(new Set(students.map(s => s.id)));
    } else {
      setPresentIds(new Set());
    }
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      await api.post('/attendance/mark', {
        student_ids: students.map(s => s.id),
        date,
        present_ids: Array.from(presentIds),
      });
      toast.success('Attendance saved!');
    } catch (err) { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="glass-card h-16 shimmer-bg rounded-xl" />)}</div>;
  }

  const presentCount = presentIds.size;
  const absentCount = students.length - presentCount;

  return (
    <motion.div
      data-testid="teacher-attendance"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Outfit'] tracking-tight">Mark Attendance</h1>
          <p className="text-white/40 text-sm mt-1">{students.length} students in class</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          data-testid="attendance-date-input"
          className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold font-mono text-white">{students.length}</p>
          <p className="text-xs text-white/40">Total</p>
        </div>
        <div className="glass-card p-4 text-center bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-2xl font-bold font-mono text-emerald-400">{presentCount}</p>
          <p className="text-xs text-white/40">Present</p>
        </div>
        <div className="glass-card p-4 text-center bg-red-500/5 border border-red-500/20">
          <p className="text-2xl font-bold font-mono text-red-400">{absentCount}</p>
          <p className="text-xs text-white/40">Absent</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button onClick={() => markAll(true)} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-all">Mark All Present</button>
        <button onClick={() => markAll(false)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-all">Mark All Absent</button>
      </div>

      {/* Student List */}
      <div className="glass-card divide-y divide-white/[0.04]">
        {students.map(s => (
          <button
            key={s.id}
            onClick={() => toggleStudent(s.id)}
            data-testid={`attendance-toggle-${s.id}`}
            className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              presentIds.has(s.id) ? 'bg-emerald-500/20' : 'bg-red-500/20'
            }`}>
              {presentIds.has(s.id) ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-white/30">{s.roll_number} &middot; {s.class_name}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              presentIds.has(s.id) ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
            }`}>
              {presentIds.has(s.id) ? 'Present' : 'Absent'}
            </span>
          </button>
        ))}
      </div>

      {/* Save Button */}
      <button
        data-testid="save-attendance-btn"
        onClick={saveAttendance}
        disabled={saving}
        className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium  disabled:opacity-50 transition-all"
      >
        {saving ? 'Saving...' : 'Save Attendance'}
      </button>
    </motion.div>
  );
}
