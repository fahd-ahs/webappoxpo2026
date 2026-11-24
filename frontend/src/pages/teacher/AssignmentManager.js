import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Send, CheckCircle2, Clock, Users, FileText, Download,
  Sparkles, X, BookOpen, AlertCircle, Edit3, Layers
} from 'lucide-react';
import { toast } from 'sonner';

function getDefaultDueDateInput() {
  const d = new Date(Date.now() + 7 * 86400000);
  d.setHours(17, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatBytes(bytes) {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AssignmentManager() {
  const [classes, setClasses] = useState([]);
  const [activeClass, setActiveClass] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [publishingId, setPublishingId] = useState(null);
  const [recentlyPublishedBanner, setRecentlyPublishedBanner] = useState(null);

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [subFilter, setSubFilter] = useState('all');
  const [activeSubmissionId, setActiveSubmissionId] = useState(null);

  const [form, setForm] = useState({
    subject_id: '',
    title: '',
    description: '',
    due_date: getDefaultDueDateInput(),
    max_marks: 20,
    xp_reward: 50,
  });

  const loadWorkspace = useCallback(async (targetClass) => {
    try {
      const [clsRes, subjRes] = await Promise.all([
        api.get('/teacher/classes'),
        api.get('/subjects'),
      ]);
      const classList = clsRes.data || [];
      setClasses(classList);
      setSubjects(subjRes.data || []);

      const resolvedClass = targetClass || classList[0]?.class_name || '11-A';
      setActiveClass(resolvedClass);

      const asgRes = await api.get(`/assignments?class_name=${encodeURIComponent(resolvedClass)}`);
      setAssignments(asgRes.data || []);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load classroom workspace');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace('');
  }, [loadWorkspace]);

  const handleSelectClass = async (className) => {
    setActiveClass(className);
    setSelectedAssignment(null);
    try {
      const { data } = await api.get(`/assignments?class_name=${encodeURIComponent(className)}`);
      setAssignments(data || []);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not load class assignments');
    }
  };

  const activeClassMeta = useMemo(
    () => classes.find((c) => c.class_name === activeClass) || classes[0] || null,
    [classes, activeClass]
  );

  const filteredAssignments = useMemo(() => {
    if (statusFilter === 'all') return assignments;
    if (statusFilter === 'needs_grading') return assignments.filter((a) => (a.pending_count || 0) > 0);
    return assignments.filter((a) => (a.status || 'published') === statusFilter);
  }, [assignments, statusFilter]);

  const stats = useMemo(() => {
    const published = assignments.filter((a) => (a.status || 'published') === 'published').length;
    const drafts = assignments.filter((a) => a.status === 'draft').length;
    const pendingGrading = assignments.reduce((sum, a) => sum + (a.pending_count || 0), 0);
    const totalGraded = assignments.reduce((sum, a) => sum + (a.graded_count || 0), 0);
    return { published, drafts, pendingGrading, totalGraded };
  }, [assignments]);

  const createAssignment = async (publishStatus = 'published') => {
    if (!form.title.trim()) {
      toast.error('Please enter an assignment title');
      return;
    }
    if (!form.subject_id) {
      toast.error('Please select a subject');
      return;
    }
    const parsedMax = Number(form.max_marks);
    if (!Number.isFinite(parsedMax) || parsedMax < 1 || parsedMax > 1000) {
      toast.error('Maximum marks must be between 1 and 1000');
      return;
    }
    const parsedXp = form.xp_reward === '' ? 0 : Number(form.xp_reward);
    if (!Number.isFinite(parsedXp) || parsedXp < 0 || parsedXp > 1000) {
      toast.error('XP reward must be between 0 and 1000');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        max_marks: Math.round(parsedMax),
        xp_reward: Math.round(parsedXp),
        class_name: activeClass || '11-A',
        due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
        status: publishStatus,
      };
      const { data } = await api.post('/assignments', payload);
      setAssignments((prev) => [data, ...prev]);
      setShowCreate(false);
      setForm({
        subject_id: '',
        title: '',
        description: '',
        due_date: getDefaultDueDateInput(),
        max_marks: 20,
        xp_reward: 50,
      });
      if (publishStatus === 'published') {
        setRecentlyPublishedBanner({
          title: data.title,
          className: data.class_name,
          subject: data.subject_name,
        });
        toast.success(`Assignment published to Class ${data.class_name}`);
      } else {
        toast.success('Assignment saved as draft');
      }
      loadWorkspace(activeClass);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  const publishDraft = async (assignmentId) => {
    setPublishingId(assignmentId);
    try {
      const { data } = await api.post(`/assignments/${assignmentId}/publish`);
      setAssignments((prev) => prev.map((a) => (a.id === assignmentId ? data : a)));
      setRecentlyPublishedBanner({
        title: data.title,
        className: data.class_name,
        subject: data.subject_name,
      });
      toast.success(`Published "${data.title}" to Class ${data.class_name}`);
      loadWorkspace(activeClass);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to publish assignment');
    } finally {
      setPublishingId(null);
    }
  };

  const viewSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionsLoading(true);
    setSubFilter('all');
    try {
      const { data } = await api.get(`/assignments/${assignment.id}/submissions`);
      const list = data || [];
      setSubmissions(list);
      setActiveSubmissionId(list[0]?.id || null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load submissions');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleGradeSuccess = async (updatedSubmission) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === updatedSubmission.id ? updatedSubmission : s))
    );
    await loadWorkspace(activeClass);
    if (selectedAssignment) {
      try {
        const { data } = await api.get(`/assignments/${selectedAssignment.id}`);
        setSelectedAssignment(data);
      } catch {
        /* ignore */
      }
    }
  };

  const filteredSubmissions = useMemo(() => {
    if (subFilter === 'pending') return submissions.filter((s) => s.status !== 'graded');
    if (subFilter === 'graded') return submissions.filter((s) => s.status === 'graded');
    return submissions;
  }, [submissions, subFilter]);

  const activeSubmission = useMemo(
    () =>
      filteredSubmissions.find((s) => s.id === activeSubmissionId) ||
      filteredSubmissions[0] ||
      null,
    [filteredSubmissions, activeSubmissionId]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card h-24 shimmer-bg rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      data-testid="assignment-manager"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Header & Class Context */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-cyan-300 mb-1">Teacher Classroom Workspace</p>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] tracking-tight text-white">
            Assignment Manager
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Open an assigned class, publish coursework, and review student submissions.
          </p>
        </div>

        <button
          type="button"
          data-testid="create-assignment-btn"
          onClick={() => setShowCreate((v) => !v)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium inline-flex items-center gap-2 transition-colors self-start lg:self-auto shadow-[0_6px_20px_rgba(79,70,229,0.28)]"
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showCreate ? 'Close Editor' : 'New Assignment'}</span>
        </button>
      </div>

      {/* Assigned Classes Bar */}
      <div className="rounded-2xl bg-[#0f1628] border border-white/[0.08] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs text-slate-400 font-medium mr-1">Assigned Class:</span>
          {classes.map((cls) => {
            const isSelected = cls.class_name === activeClass;
            return (
              <button
                key={cls.class_name}
                type="button"
                data-testid={`class-tab-${cls.class_name}`}
                onClick={() => handleSelectClass(cls.class_name)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium inline-flex items-center gap-2 transition-all border ${
                  isSelected
                    ? 'bg-indigo-500/20 border-indigo-400/40 text-white'
                    : 'bg-[#141d35] border-white/[0.07] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                <span>Class {cls.class_name}</span>
                <span className="text-slate-400 font-mono tabular-nums">· {cls.student_count} students</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs text-slate-400 font-mono tabular-nums">
          <div>
            <span className="text-white font-semibold">{stats.published}</span> published
          </div>
          {stats.drafts > 0 && (
            <div>
              <span className="text-slate-200 font-semibold">{stats.drafts}</span> drafts
            </div>
          )}
          <div>
            <span className={stats.pendingGrading > 0 ? 'text-amber-300 font-semibold' : 'text-white font-semibold'}>
              {stats.pendingGrading}
            </span>{' '}
            needs grading
          </div>
          <div>
            <span className="text-emerald-300 font-semibold">{stats.totalGraded}</span> graded
          </div>
        </div>
      </div>

      {/* Publish Confirmation Banner */}
      <AnimatePresence>
        {recentlyPublishedBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            data-testid="publish-confirmation-banner"
            className="rounded-2xl bg-emerald-500/10 border border-emerald-400/30 px-4 py-3.5 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-emerald-100 truncate">
                  Published &ldquo;{recentlyPublishedBanner.title}&rdquo; to Class {recentlyPublishedBanner.className}
                </p>
                <p className="text-xs text-emerald-300/80">
                  {recentlyPublishedBanner.subject} · Students in Class {recentlyPublishedBanner.className} can now view instructions and submit work.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRecentlyPublishedBanner(null)}
              aria-label="Dismiss notification"
              className="p-1.5 rounded-lg text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-500/15"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Assignment Panel */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl bg-[#111930] border border-indigo-400/25 p-5 sm:p-6 space-y-4"
            data-testid="create-assignment-form"
          >
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <div>
                <h2 className="text-base font-semibold font-['Outfit'] text-white">
                  Create Assignment for Class {activeClassMeta?.class_name || activeClass}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Add clear instructions, choose subject & due date, then publish immediately or save as draft.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Subject *</label>
                <select
                  data-testid="assignment-subject-select"
                  value={form.subject_id}
                  onChange={(e) => setForm((p) => ({ ...p, subject_id: e.target.value }))}
                  className="w-full bg-[#0a1020] border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Assignment Title *</label>
                <input
                  data-testid="assignment-title-input"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Rotational Motion Problem Set 2"
                  className="w-full bg-[#0a1020] border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Instructions & Requirements</label>
              <textarea
                data-testid="assignment-desc-input"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Write step-by-step instructions, textbook references, or accepted submission formats..."
                rows={3}
                className="w-full bg-[#0a1020] border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Due Date & Time</label>
                <input
                  data-testid="assignment-due-date"
                  type="datetime-local"
                  value={form.due_date}
                  onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
                  className="w-full bg-[#0a1020] border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Maximum Marks</label>
                <input
                  data-testid="assignment-marks-input"
                  type="number"
                  min={1}
                  max={1000}
                  value={form.max_marks}
                  onChange={(e) => setForm((p) => ({ ...p, max_marks: e.target.value }))}
                  className="w-full bg-[#0a1020] border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">XP Reward</label>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={form.xp_reward}
                  onChange={(e) => setForm((p) => ({ ...p, xp_reward: e.target.value }))}
                  className="w-full bg-[#0a1020] border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-white/[0.07]">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-sm text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="save-draft-assignment-btn"
                disabled={creating}
                onClick={() => createAssignment('draft')}
                className="px-4 py-2 rounded-xl bg-[#19233d] hover:bg-[#223052] border border-white/[0.1] text-sm font-medium text-slate-200 transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                type="button"
                data-testid="submit-new-assignment-btn"
                disabled={creating}
                onClick={() => createAssignment('published')}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium inline-flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{creating ? 'Publishing...' : 'Publish Assignment'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#0f1628] border border-white/[0.08]">
          {[
            { id: 'all', label: `All (${assignments.length})` },
            { id: 'published', label: `Published (${stats.published})` },
            { id: 'needs_grading', label: `Needs Grading (${stats.pendingGrading})` },
            { id: 'draft', label: `Drafts (${stats.drafts})` },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="teacherAsgTab"
                    className="absolute inset-0 rounded-lg bg-[#1d2846] border border-white/[0.1]"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Assignment List */}
      {filteredAssignments.length === 0 ? (
        <div className="rounded-2xl bg-[#0f1628] border border-white/[0.08] p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">No assignments match this filter</p>
          <p className="text-xs text-slate-500 mt-1">Create a new assignment for Class {activeClass} to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((a) => {
            const isDraft = a.status === 'draft';
            const totalStudents = a.total_students || activeClassMeta?.student_count || 10;
            const subCount = a.submission_count || 0;
            const pendingCount = a.pending_count || 0;
            const gradedCount = a.graded_count || 0;

            return (
              <motion.div
                key={a.id}
                layout
                data-testid={`teacher-assignment-row-${a.id}`}
                className="rounded-2xl bg-[#0f1628] hover:bg-[#121b31] border border-white/[0.08] p-4 sm:p-5 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full mt-2 shrink-0"
                      style={{ background: a.subject_color || '#6366f1' }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-base font-semibold text-white truncate">{a.title}</h3>
                        {isDraft ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300">
                            <Edit3 className="w-3 h-3 text-slate-400" aria-hidden="true" />
                            Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                            Published
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                        <span>{a.subject_name}</span>
                        <span aria-hidden="true">·</span>
                        <span>Class {a.class_name}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{a.max_marks} marks</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-indigo-300">+{a.xp_reward} XP</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:justify-end shrink-0">
                    <div className="text-xs text-slate-400 font-mono tabular-nums flex items-center gap-1.5 mr-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                      <span>Due {new Date(a.due_date).toLocaleDateString()}</span>
                    </div>

                    {!isDraft && (
                      <div className="text-xs font-mono tabular-nums text-slate-300 px-2.5 py-1.5 rounded-lg bg-[#16203a] border border-white/[0.06]">
                        {subCount}/{totalStudents} submitted
                        {pendingCount > 0 && (
                          <span className="text-amber-300 ml-1.5">· {pendingCount} pending</span>
                        )}
                        {pendingCount === 0 && gradedCount > 0 && (
                          <span className="text-emerald-300 ml-1.5">· {gradedCount} graded</span>
                        )}
                      </div>
                    )}

                    {isDraft ? (
                      <button
                        type="button"
                        data-testid={`publish-draft-${a.id}`}
                        disabled={publishingId === a.id}
                        onClick={() => publishDraft(a.id)}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{publishingId === a.id ? 'Publishing...' : 'Publish Now'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => viewSubmissions(a)}
                        data-testid={`view-submissions-${a.id}`}
                        className="px-3.5 py-2 rounded-xl bg-[#18223d] hover:bg-[#223056] border border-white/[0.1] text-xs font-medium text-white inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
                        <span>Review &amp; Grade</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Submission Review & Grading Workspace Modal */}
      <AnimatePresence>
        {selectedAssignment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-5"
            onClick={() => setSelectedAssignment(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl bg-[#0e1526] border border-white/[0.12] shadow-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              data-testid="submissions-modal"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-white/[0.08] flex items-start justify-between gap-4 bg-[#111930]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span style={{ color: selectedAssignment.subject_color || '#818cf8' }}>
                      {selectedAssignment.subject_name}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Class {selectedAssignment.class_name}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">Max {selectedAssignment.max_marks} marks</span>
                  </div>
                  <h2 className="text-lg font-bold font-['Outfit'] text-white truncate mt-0.5">
                    {selectedAssignment.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  aria-label="Close grading workspace"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.07] transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              {submissionsLoading ? (
                <div className="p-8 space-y-3">
                  <div className="h-16 rounded-xl shimmer-bg" />
                  <div className="h-32 rounded-xl shimmer-bg" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-300">No student submissions yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Submissions from Class {selectedAssignment.class_name} will appear here as soon as students submit.
                  </p>
                </div>
              ) : (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
                  {/* Left Roster */}
                  <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-white/[0.08] flex flex-col min-h-0 max-h-60 md:max-h-none">
                    <div className="p-3 border-b border-white/[0.07] flex items-center gap-1 bg-[#0b1120]">
                      {[
                        { id: 'all', label: `All (${submissions.length})` },
                        { id: 'pending', label: `Pending (${submissions.filter((s) => s.status !== 'graded').length})` },
                        { id: 'graded', label: `Graded (${submissions.filter((s) => s.status === 'graded').length})` },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSubFilter(tab.id)}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-colors ${
                            subFilter === tab.id
                              ? 'bg-[#1c2745] text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                      {filteredSubmissions.map((sub) => {
                        const isSelected = activeSubmission?.id === sub.id;
                        const isGraded = sub.status === 'graded';
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            data-testid={`submission-row-${sub.id}`}
                            onClick={() => setActiveSubmissionId(sub.id)}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                              isSelected
                                ? 'bg-indigo-500/15 border-indigo-400/40'
                                : 'bg-[#11192e]/60 border-transparent hover:bg-[#16203a]'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                              {sub.student_name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{sub.student_name}</p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {sub.student_roll_number ? `Roll ${sub.student_roll_number} · ` : ''}
                                {new Date(sub.submitted_at).toLocaleDateString()}
                              </p>
                            </div>
                            {isGraded ? (
                              <span className="text-xs font-mono tabular-nums font-semibold text-emerald-300 shrink-0">
                                {sub.marks_obtained}/{selectedAssignment.max_marks}
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-amber-300 shrink-0">
                                Pending
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Inspector & Grading Panel */}
                  <div className="md:col-span-7 overflow-y-auto p-5">
                    {activeSubmission ? (
                      <SubmissionGradingPanel
                        key={activeSubmission.id}
                        assignment={selectedAssignment}
                        submission={activeSubmission}
                        onGradeSuccess={handleGradeSuccess}
                      />
                    ) : (
                      <div className="py-12 text-center text-sm text-slate-400">
                        Select a submission to inspect and grade.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SubmissionGradingPanel({ assignment, submission, onGradeSuccess }) {
  const maxMarks = assignment.max_marks || 10;
  const [marks, setMarks] = useState(
    submission.marks_obtained !== undefined && submission.marks_obtained !== null
      ? String(submission.marks_obtained)
      : ''
  );
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [editingGrade, setEditingGrade] = useState(submission.status !== 'graded');
  const [saving, setSaving] = useState(false);
  const [gradeConfirmation, setGradeConfirmation] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const numericMarks = Number(marks);
  const isValidMarks =
    marks !== '' && Number.isFinite(numericMarks) && numericMarks >= 0 && numericMarks <= maxMarks;
  const percentage = isValidMarks ? Math.round((numericMarks / maxMarks) * 100) : null;

  const submitGrade = async (e) => {
    e.preventDefault();
    if (!isValidMarks) {
      toast.error(`Enter marks between 0 and ${maxMarks}`);
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post(
        `/assignments/${assignment.id}/grade/${submission.id}`,
        { marks_obtained: numericMarks, feedback: feedback.trim() }
      );
      setGradeConfirmation(true);
      setEditingGrade(false);
      toast.success(`Grade published for ${submission.student_name}`);
      if (data?.submission) {
        await onGradeSuccess(data.submission);
      }
      setTimeout(() => setGradeConfirmation(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to publish grade');
    } finally {
      setSaving(false);
    }
  };

  const downloadAttachment = async () => {
    if (!submission.attachment?.download_url) return;
    setDownloading(true);
    try {
      const apiPath = submission.attachment.download_url.replace(/^\/api/, '');
      const res = await api.get(apiPath, { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = submission.attachment.file_name || 'submission-file';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download attached file');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5" data-testid={`grading-panel-${submission.id}`}>
      {/* Student Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/[0.07]">
        <div>
          <h3 className="text-base font-semibold text-white">{submission.student_name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {submission.student_roll_number ? `Roll ${submission.student_roll_number} · ` : ''}
            Submitted {new Date(submission.submitted_at).toLocaleString()}
          </p>
        </div>

        {submission.status === 'graded' ? (
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              Graded
            </span>
            <p className="text-lg font-bold font-mono tabular-nums text-white">
              {submission.marks_obtained}/{maxMarks}
            </p>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-400" aria-hidden="true" />
            Pending Review
          </span>
        )}
      </div>

      {/* Student Written Response */}
      <div>
        <p className="text-xs font-medium text-slate-400 mb-2">Student Response</p>
        <div className="rounded-xl bg-[#0a1020] border border-white/[0.08] p-4 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
          {submission.content || 'No written text provided (see attached file).'}
        </div>
      </div>

      {/* Attachment Download Card */}
      {submission.attachment && (
        <div className="rounded-xl bg-[#131d37] border border-white/[0.09] p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/15 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-cyan-300" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{submission.attachment.file_name}</p>
              <p className="text-xs text-slate-400 font-mono">
                {formatBytes(submission.attachment.size_bytes)} · {submission.attachment.mime_type}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={downloadAttachment}
            disabled={downloading}
            data-testid="teacher-download-attachment-btn"
            className="px-3 py-1.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-xs font-medium text-white inline-flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{downloading ? 'Downloading...' : 'Download'}</span>
          </button>
        </div>
      )}

      {/* Animated Publish Confirmation */}
      <AnimatePresence>
        {gradeConfirmation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-emerald-500/15 border border-emerald-400/30 p-3 flex items-center gap-2.5 text-xs font-medium text-emerald-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Grade published and saved. {submission.student_name} can now view marks and feedback.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grading Form or Graded Summary */}
      {!editingGrade && submission.status === 'graded' ? (
        <div className="rounded-xl bg-[#111b33] border border-emerald-400/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-emerald-300">Published Evaluation</p>
            <button
              type="button"
              onClick={() => setEditingGrade(true)}
              className="text-xs text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" aria-hidden="true" />
              <span>Edit Grade</span>
            </button>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">
            {submission.feedback || 'No written feedback added.'}
          </p>
          <p className="text-[11px] text-slate-400">
            Graded by {submission.graded_by_name || 'Teacher'} on {new Date(submission.graded_at).toLocaleString()}
          </p>
        </div>
      ) : (
        <form onSubmit={submitGrade} className="space-y-4 pt-2 border-t border-white/[0.07]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Marks Awarded (0 – {maxMarks}) *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  max={maxMarks}
                  data-testid="grade-marks-input"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  placeholder={`0 - ${maxMarks}`}
                  className="w-32 bg-[#0a1020] border border-white/[0.12] rounded-xl px-3.5 py-2 text-sm font-mono tabular-nums text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <div className="flex items-center gap-1.5">
                  {[0.7, 0.85, 1].map((ratio) => {
                    const preset = Math.round(maxMarks * ratio);
                    return (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setMarks(String(preset))}
                        className="px-2.5 py-1.5 rounded-lg bg-[#16203a] hover:bg-[#1e2c4f] text-[11px] font-mono tabular-nums text-slate-300 transition-colors"
                      >
                        {preset}/{maxMarks}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {percentage !== null && (
              <div className="text-right font-mono tabular-nums">
                <span className={`text-sm font-semibold ${percentage >= 80 ? 'text-emerald-300' : percentage >= 60 ? 'text-amber-300' : 'text-rose-300'}`}>
                  {percentage}%
                </span>
                {percentage >= 80 && (
                  <p className="text-[11px] text-indigo-300 inline-flex items-center gap-1 ml-2">
                    <Sparkles className="w-3 h-3" aria-hidden="true" /> +30 Bonus XP
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Teacher Feedback
            </label>
            <textarea
              data-testid="grade-feedback-input"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Write constructive feedback on strengths, accuracy, and next steps..."
              rows={3}
              className="w-full bg-[#0a1020] border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5">
            {submission.status === 'graded' && (
              <button
                type="button"
                onClick={() => setEditingGrade(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] text-xs font-medium text-slate-300"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              data-testid="publish-grade-btn"
              disabled={!isValidMarks || saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium inline-flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>{saving ? 'Publishing Grade...' : submission.status === 'graded' ? 'Update Grade' : 'Publish Grade'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
