import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Zap, Send, CheckCircle2, AlertCircle, FileText,
  Upload, Download, X, History, Award, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.md', '.png', '.jpg', '.jpeg'];
const MAX_FILE_BYTES = 2 * 1024 * 1024;

function formatBytes(bytes) {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusMeta(status) {
  switch (status) {
    case 'graded':
      return {
        label: 'Graded',
        textClass: 'text-emerald-300',
        icon: CheckCircle2,
      };
    case 'submitted':
      return {
        label: 'Submitted · Awaiting Grade',
        textClass: 'text-amber-300',
        icon: Clock,
      };
    case 'overdue':
      return {
        label: 'Overdue',
        textClass: 'text-rose-300',
        icon: AlertCircle,
      };
    default:
      return {
        label: 'Published · Ready to Submit',
        textClass: 'text-cyan-300',
        icon: FileText,
      };
  }
}

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitContent, setSubmitContent] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [submissionSuccessReceipt, setSubmissionSuccessReceipt] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const fileInputRef = useRef(null);

  const fetchAssignments = async () => {
    try {
      const { data } = await api.get('/assignments');
      setAssignments(data || []);
      return data || [];
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load assignments');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const openAssignmentModal = async (assignment) => {
    setSelectedAssignment(assignment);
    setSubmitContent('');
    setAttachmentFile(null);
    setFileError('');
    setSubmissionSuccessReceipt(null);
    try {
      const { data } = await api.get(`/assignments/${assignment.id}`);
      setSelectedAssignment(data);
    } catch {
      /* keep list version if refresh fails */
    }
  };

  const handleFilePicked = (file) => {
    setFileError('');
    if (!file) return;
    const dotIdx = file.name.lastIndexOf('.');
    const ext = dotIdx >= 0 ? file.name.slice(dotIdx).toLowerCase() : '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError('Unsupported file type. Use PDF, DOC, DOCX, TXT, MD, PNG, or JPG.');
      return;
    }
    if (file.size === 0) {
      setFileError('The selected file is empty.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError('File exceeds the 2 MB maximum size limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      setAttachmentFile({
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
        data_base64: base64,
      });
    };
    reader.onerror = () => {
      setFileError('Could not read file. Please try another file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (assignmentId) => {
    if (!submitContent.trim() && !attachmentFile) {
      toast.error('Please write a response or attach a supported file');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        content: submitContent.trim(),
        ...(attachmentFile ? { attachment: attachmentFile } : {}),
      };
      const { data } = await api.post(`/assignments/${assignmentId}/submit`, payload);
      const updatedList = await fetchAssignments();
      const refreshed = updatedList.find((a) => a.id === assignmentId);
      if (refreshed) {
        setSelectedAssignment(refreshed);
      }
      setSubmissionSuccessReceipt({
        xpEarned: data?.xp_earned?.amount || selectedAssignment?.xp_reward || 50,
        submittedAt: data?.submitted_at || new Date().toISOString(),
        fileName: data?.attachment?.file_name || null,
      });
      setSubmitContent('');
      setAttachmentFile(null);
      toast.success('Assignment submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadSubmissionFile = async (submission) => {
    if (!submission?.attachment?.download_url) return;
    setDownloading(true);
    try {
      const apiPath = submission.attachment.download_url.replace(/^\/api/, '');
      const res = await api.get(apiPath, { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = submission.attachment.file_name || 'submission';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Unable to download file');
    } finally {
      setDownloading(false);
    }
  };

  const counts = useMemo(() => ({
    all: assignments.length,
    posted: assignments.filter((a) => a.user_status === 'posted').length,
    submitted: assignments.filter((a) => a.user_status === 'submitted').length,
    graded: assignments.filter((a) => a.user_status === 'graded').length,
    overdue: assignments.filter((a) => a.user_status === 'overdue').length,
  }), [assignments]);

  const filtered = useMemo(
    () => (activeTab === 'all' ? assignments : assignments.filter((a) => a.user_status === activeTab)),
    [assignments, activeTab]
  );

  const getDaysUntilDue = (dueDate) => {
    const diff = new Date(dueDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

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
      data-testid="assignments-page"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Header & Summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] tracking-tight text-white">
            Assignments
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review instructions, submit coursework, and track grades and teacher feedback.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono tabular-nums">
          <span>
            <strong className="text-cyan-300">{counts.posted}</strong> pending
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong className="text-amber-300">{counts.submitted}</strong> submitted
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong className="text-emerald-300">{counts.graded}</strong> graded
          </span>
        </div>
      </div>

      {/* Interactive Filter Tabs */}
      <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#0f1628] border border-white/[0.08]">
        {[
          { id: 'all', label: `All (${counts.all})` },
          { id: 'posted', label: `Posted (${counts.posted})` },
          { id: 'submitted', label: `Submitted (${counts.submitted})` },
          { id: 'graded', label: `Graded (${counts.graded})` },
          { id: 'overdue', label: `Overdue (${counts.overdue})` },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="studentAsgTab"
                  className="absolute inset-0 rounded-lg bg-[#1d2846] border border-white/[0.1]"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Assignments List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-[#0f1628] border border-white/[0.08] p-12 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">No assignments in this category</p>
          <p className="text-xs text-slate-500 mt-1">Switch filters above to see other coursework.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const daysLeft = getDaysUntilDue(a.due_date);
            const status = a.user_status || 'posted';
            const statusMeta = getStatusMeta(status);
            const StatusIcon = statusMeta.icon;
            const urgency = daysLeft < 1 && !a.submission ? 'text-rose-300' : daysLeft < 3 && !a.submission ? 'text-amber-300' : 'text-slate-400';

            return (
              <motion.button
                key={a.id}
                type="button"
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => openAssignmentModal(a)}
                data-testid={`assignment-card-${a.id}`}
                className="w-full text-left rounded-2xl bg-[#0f1628] hover:bg-[#131d35] border border-white/[0.08] hover:border-indigo-400/25 p-4 sm:p-5 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full mt-2 shrink-0"
                      style={{ background: a.subject_color || '#6366f1' }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base text-white truncate">{a.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                        <span>{a.subject_name}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{a.max_marks} marks</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-indigo-300">+{a.xp_reward} XP</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusMeta.textClass}`}>
                      <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{statusMeta.label}</span>
                    </span>
                    <span className={`text-xs font-mono tabular-nums flex items-center gap-1 ${urgency}`}>
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {a.submission
                        ? `Submitted ${new Date(a.submission.submitted_at).toLocaleDateString()}`
                        : daysLeft > 1
                          ? `${daysLeft}d left`
                          : daysLeft === 1
                            ? 'Due tomorrow'
                            : daysLeft === 0
                              ? 'Due today'
                              : 'Overdue'}
                    </span>
                  </div>
                </div>

                {/* Graded result preview */}
                {a.submission?.status === 'graded' && (
                  <div className="mt-3.5 pt-3 border-t border-white/[0.07] flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-mono tabular-nums font-semibold text-emerald-300">
                      Score: {a.submission.marks_obtained}/{a.max_marks}
                    </span>
                    {a.submission.feedback && (
                      <>
                        <span className="text-slate-600" aria-hidden="true">·</span>
                        <span className="text-slate-300 truncate max-w-xl">
                          Teacher feedback: {a.submission.feedback}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Detail, Submission & Result Modal */}
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
              className="rounded-2xl bg-[#0e1526] border border-white/[0.12] shadow-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              data-testid="assignment-detail-modal"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-white/[0.08] flex items-start justify-between gap-4 bg-[#111930]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span style={{ color: selectedAssignment.subject_color || '#818cf8' }}>
                      {selectedAssignment.subject_name}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedAssignment.teacher_name || 'Class Teacher'}</span>
                  </div>
                  <h2 className="text-xl font-bold font-['Outfit'] text-white mt-0.5">
                    {selectedAssignment.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  aria-label="Close assignment details"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.07] transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Lifecycle Progress Stepper */}
                <LifecycleStepper
                  hasSubmission={Boolean(selectedAssignment.submission)}
                  isGraded={selectedAssignment.submission?.status === 'graded'}
                />

                {/* Instructions & Key Facts */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                      Due {new Date(selectedAssignment.due_date).toLocaleString()}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Max Marks: {selectedAssignment.max_marks}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-indigo-300 inline-flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" aria-hidden="true" />+{selectedAssignment.xp_reward} XP
                    </span>
                  </div>
                  <div className="rounded-xl bg-[#0a1020] border border-white/[0.07] p-4 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {selectedAssignment.description || 'No additional instructions provided.'}
                  </div>
                </div>

                {/* Animated Submission Confirmation State */}
                <AnimatePresence mode="wait">
                  {submissionSuccessReceipt ? (
                    <motion.div
                      key="receipt"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      data-testid="submission-confirmation-view"
                      className="rounded-2xl bg-emerald-500/10 border border-emerald-400/30 p-6 text-center space-y-3"
                    >
                      <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 20 }}
                        className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto"
                      >
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </motion.div>
                      <h3 className="text-lg font-bold font-['Outfit'] text-white">
                        Work Submitted Successfully
                      </h3>
                      <p className="text-xs text-slate-300">
                        Submitted at {new Date(submissionSuccessReceipt.submittedAt).toLocaleString()}
                        {submissionSuccessReceipt.fileName ? ` · Attached: ${submissionSuccessReceipt.fileName}` : ''}
                      </p>
                      <p className="text-sm font-mono font-semibold text-indigo-300">
                        +{submissionSuccessReceipt.xpEarned} XP Earned
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setSubmissionSuccessReceipt(null)}
                          className="px-4 py-2 rounded-xl bg-[#18223d] hover:bg-[#223056] text-xs font-medium text-white transition-colors"
                        >
                          View Submission Status &amp; History
                        </button>
                      </div>
                    </motion.div>
                  ) : selectedAssignment.submission ? (
                    /* Submitted / Graded State */
                    <motion.div
                      key="submitted-state"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-5"
                    >
                      {/* Graded Scorecard */}
                      {selectedAssignment.submission.status === 'graded' ? (
                        <div
                          data-testid="student-grade-result"
                          className="rounded-2xl bg-[#111b33] border border-emerald-400/25 p-5 space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                                <Award className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                                Graded Result
                              </span>
                              <p className="text-xs text-slate-400 mt-1">
                                Evaluated by {selectedAssignment.submission.graded_by_name || selectedAssignment.teacher_name || 'Teacher'} ·{' '}
                                {selectedAssignment.submission.graded_at
                                  ? new Date(selectedAssignment.submission.graded_at).toLocaleString()
                                  : ''}
                              </p>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-3xl font-bold font-mono tabular-nums text-white">
                                {selectedAssignment.submission.marks_obtained}
                                <span className="text-base text-slate-400">/{selectedAssignment.max_marks}</span>
                              </p>
                              <p className="text-xs font-mono tabular-nums text-emerald-300">
                                {Math.round(
                                  (selectedAssignment.submission.marks_obtained /
                                    (selectedAssignment.max_marks || 1)) *
                                    100
                                )}
                                % score
                              </p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-white/[0.08]">
                            <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
                              Teacher Feedback
                            </p>
                            <p className="text-sm text-slate-100 leading-relaxed">
                              {selectedAssignment.submission.feedback || 'No written comments provided.'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div
                          data-testid="student-submitted-status"
                          className="rounded-2xl bg-amber-500/10 border border-amber-400/25 p-4 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-amber-300 shrink-0" aria-hidden="true" />
                            <div>
                              <p className="text-sm font-medium text-white">Submitted · Awaiting Grading</p>
                              <p className="text-xs text-amber-200/80">
                                Received {new Date(selectedAssignment.submission.submitted_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Student's Submitted Response & File */}
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-slate-400">Your Submitted Work</p>
                        {selectedAssignment.submission.content && (
                          <div className="rounded-xl bg-[#0a1020] border border-white/[0.07] p-4 text-sm text-slate-300 whitespace-pre-wrap">
                            {selectedAssignment.submission.content}
                          </div>
                        )}
                        {selectedAssignment.submission.attachment && (
                          <div className="rounded-xl bg-[#131d37] border border-white/[0.08] p-3.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {selectedAssignment.submission.attachment.file_name}
                                </p>
                                <p className="text-xs text-slate-400 font-mono">
                                  {formatBytes(selectedAssignment.submission.attachment.size_bytes)}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => downloadSubmissionFile(selectedAssignment.submission)}
                              disabled={downloading}
                              className="px-3 py-1.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-xs font-medium text-white inline-flex items-center gap-1.5 shrink-0"
                            >
                              <Download className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{downloading ? 'Downloading...' : 'Download'}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Submission History */}
                      <div className="space-y-2.5 pt-2 border-t border-white/[0.07]" data-testid="submission-history">
                        <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                          Submission History
                        </p>
                        <div className="space-y-2">
                          {(selectedAssignment.submission.history || []).map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-start justify-between gap-3 text-xs py-1.5 border-b border-white/[0.04] last:border-b-0"
                            >
                              <div>
                                <span className="font-medium text-slate-200 capitalize">{entry.action}</span>
                                <span className="text-slate-400"> · {entry.actor_name}</span>
                                {entry.note && <p className="text-slate-400 mt-0.5">{entry.note}</p>}
                              </div>
                              <span className="text-slate-500 font-mono tabular-nums shrink-0">
                                {new Date(entry.timestamp).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    /* Submission Composer State */
                    <motion.div
                      key="composer"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-medium text-slate-300">
                            Written Response
                          </label>
                          <span className="text-[11px] font-mono tabular-nums text-slate-500">
                            {submitContent.length} chars
                          </span>
                        </div>
                        <textarea
                          data-testid="assignment-submit-textarea"
                          value={submitContent}
                          onChange={(e) => setSubmitContent(e.target.value)}
                          placeholder="Type your solution, derivations, or notes here..."
                          rows={4}
                          className="w-full bg-[#0a1020] border border-white/[0.12] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-y"
                        />
                      </div>

                      {/* Supported File Dropzone */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Attach Supported File (Optional)
                        </label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          data-testid="assignment-file-input"
                          accept={ALLOWED_EXTENSIONS.join(',')}
                          className="hidden"
                          onChange={(e) => handleFilePicked(e.target.files?.[0])}
                        />

                        {attachmentFile ? (
                          <div className="rounded-xl bg-[#131d37] border border-indigo-400/30 p-3.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">{attachmentFile.file_name}</p>
                                <p className="text-xs text-slate-400 font-mono">
                                  {formatBytes(attachmentFile.size_bytes)} · Ready to upload
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAttachmentFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              aria-label="Remove attached file"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragActive(true);
                            }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragActive(false);
                              handleFilePicked(e.dataTransfer.files?.[0]);
                            }}
                            className={`w-full rounded-xl border border-dashed p-4 text-center transition-colors ${
                              dragActive
                                ? 'border-cyan-400 bg-cyan-500/10'
                                : 'border-white/[0.15] bg-[#0a1020] hover:border-indigo-400/40'
                            }`}
                          >
                            <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1.5" aria-hidden="true" />
                            <p className="text-xs font-medium text-slate-200">
                              Click to attach or drag and drop a file
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              PDF, DOC, DOCX, TXT, MD, PNG, JPG · Max 2 MB
                            </p>
                          </button>
                        )}

                        {fileError && (
                          <p className="text-xs text-rose-400 mt-1.5">{fileError}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        data-testid="assignment-submit-btn"
                        onClick={() => handleSubmit(selectedAssignment.id)}
                        disabled={submitting || (!submitContent.trim() && !attachmentFile)}
                        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" aria-hidden="true" />
                        <span>{submitting ? 'Submitting Work...' : 'Submit Assignment'}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LifecycleStepper({ hasSubmission, isGraded }) {
  const steps = [
    { label: 'Published', active: true },
    { label: 'Submitted', active: hasSubmission },
    { label: 'Graded', active: isGraded },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {steps.map((step, idx) => (
        <div key={step.label} className="space-y-1.5">
          <div className="h-1.5 rounded-full bg-[#1a243e] overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: step.active ? 1 : 0 }}
              transition={{ duration: 0.35, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'left' }}
              className={`h-full rounded-full ${
                isGraded ? 'bg-emerald-400' : step.active ? 'bg-indigo-400' : ''
              }`}
            />
          </div>
          <p className={`text-[11px] font-medium ${step.active ? 'text-slate-200' : 'text-slate-500'}`}>
            {step.label}
          </p>
        </div>
      ))}
    </div>
  );
}
