import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, GraduationCap, Zap, Flame, Award, Shield, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/profile');
        setProfile(data);
        setForm({ name: data.name || '', phone: data.phone || '', address: data.address || '' });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    try {
      await api.patch('/profile', form);
      setProfile(prev => ({ ...prev, ...form }));
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) { toast.error('Failed to update profile'); }
  };

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="glass-card h-32 shimmer-bg rounded-xl" />)}</div>;
  }

  const xp = profile?.xp_profile || { total_xp: 0, level: 1, streak: 0, level_title: 'Newcomer' };

  return (
    <motion.div
      data-testid="profile-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-3xl"
    >
      <h1 className="text-2xl font-bold font-['Outfit'] tracking-tight">Profile</h1>

      {/* Profile Card */}
      <div className="glass-card p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
            {profile?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{profile?.name}</h2>
            <p className="text-white/40 text-sm capitalize">{profile?.role}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="flex items-center gap-1 text-sm text-indigo-400">
                <Zap className="w-4 h-4" /> {xp.total_xp} XP
              </span>
              <span className="flex items-center gap-1 text-sm text-amber-400">
                <Flame className="w-4 h-4" /> {xp.streak} day streak
              </span>
              <span className="flex items-center gap-1 text-sm text-cyan-400">
                <Award className="w-4 h-4" /> Level {xp.level} - {xp.level_title}
              </span>
            </div>
          </div>
          <button
            data-testid="edit-profile-btn"
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 rounded-lg bg-white/[0.04] text-sm text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-sm text-white/60 mb-2">Personal Information</h3>
        {editing ? (
          <div className="space-y-3">
            <InputField label="Name" value={form.name} onChange={(v) => setForm(p => ({ ...p, name: v }))} icon={<User className="w-4 h-4" />} testId="profile-name-input" />
            <InputField label="Phone" value={form.phone} onChange={(v) => setForm(p => ({ ...p, phone: v }))} icon={<Phone className="w-4 h-4" />} testId="profile-phone-input" />
            <InputField label="Address" value={form.address} onChange={(v) => setForm(p => ({ ...p, address: v }))} icon={<MapPin className="w-4 h-4" />} testId="profile-address-input" />
            <button
              data-testid="save-profile-btn"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium  transition-all"
            >
              Save Changes
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={profile?.email} />
            <InfoRow icon={<User className="w-4 h-4" />} label="Name" value={profile?.name} />
            <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={profile?.phone || 'Not set'} />
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Address" value={profile?.address || 'Not set'} />
            <InfoRow icon={<GraduationCap className="w-4 h-4" />} label="Class" value={profile?.class_name || 'N/A'} />
            <InfoRow icon={<Shield className="w-4 h-4" />} label="Roll Number" value={profile?.roll_number || 'N/A'} />
          </div>
        )}
      </div>

      {/* XP History */}
      {(profile?.xp_history || []).length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-sm text-white/60 mb-4">Recent XP Activity</h3>
          <div className="space-y-2">
            {(profile?.xp_history || []).slice(0, 10).map((e, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02]">
                <Zap className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm">{e.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  <p className="text-xs text-white/30 font-mono">{new Date(e.created_at).toLocaleString()}</p>
                </div>
                <span className="text-sm font-mono font-bold text-emerald-400">+{e.amount} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-white/30">{icon}</span>
      <span className="text-sm text-white/40 w-28">{label}</span>
      <span className="text-sm text-white/80">{value}</span>
    </div>
  );
}

function InputField({ label, value, onChange, icon, testId }) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">{icon}</span>
        <input
          data-testid={testId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
      </div>
    </div>
  );
}
