import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { motion } from 'framer-motion';
import {
  CreditCard, Download, Clock, CheckCircle, AlertTriangle,
  XCircle, FileText, ChevronRight, IndianRupee
} from 'lucide-react';

const containerV = { animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } };
const cardV = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } } };

const statusConfig = {
  PAID: { color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle, label: 'Paid' },
  UNPAID: { color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: Clock, label: 'Unpaid' },
  PARTIAL: { color: '#6366f1', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', icon: AlertTriangle, label: 'Partial' },
  OVERDUE: { color: '#f43f5e', bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', icon: XCircle, label: 'Overdue' },
};

export default function Payments() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: d } = await api.get('/payments/invoices');
        setData(d);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const downloadPDF = async (invoiceId) => {
    setDownloading(invoiceId);
    try {
      const response = await api.get(`/payments/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    finally { setDownloading(null); }
  };

  if (loading) return <PaymentsSkeleton />;

  const { invoices = [], summary = {} } = data || {};

  return (
    <motion.div data-testid="payments-page" variants={containerV} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <motion.div variants={cardV}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-['Outfit']">Payments</h1>
        </div>
        <p className="text-[var(--text-muted)] text-sm mt-1">Manage your fee payments and invoices</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={cardV} whileHover={{ y: -3 }} className="glass-card p-5 hover:border-rose-500/20">
          <p className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider">Total Due</p>
          <p className="text-2xl font-bold font-mono text-rose-400" data-testid="total-due">
            <IndianRupee className="w-5 h-5 inline -mt-1" />{(summary.total_due || 0).toLocaleString('en-IN')}
          </p>
        </motion.div>
        <motion.div variants={cardV} whileHover={{ y: -3 }} className="glass-card p-5 hover:border-emerald-500/20">
          <p className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider">Total Paid</p>
          <p className="text-2xl font-bold font-mono text-emerald-400" data-testid="total-paid">
            <IndianRupee className="w-5 h-5 inline -mt-1" />{(summary.total_paid || 0).toLocaleString('en-IN')}
          </p>
        </motion.div>
        <motion.div variants={cardV} whileHover={{ y: -3 }} className="glass-card p-5 hover:border-indigo-500/20">
          <p className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider">Next Due Date</p>
          <p className="text-2xl font-bold font-mono text-indigo-400" data-testid="next-due">
            {summary.next_due_date || 'None'}
          </p>
        </motion.div>
      </div>

      {/* Invoice List */}
      <motion.div variants={cardV}>
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">Invoices</h2>
        {invoices.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FileText className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-30" />
            <p className="text-[var(--text-muted)]">No invoices found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv, i) => {
              const sc = statusConfig[inv.status] || statusConfig.UNPAID;
              const StatusIcon = sc.icon;
              return (
                <motion.div
                  key={inv.id}
                  variants={cardV}
                  whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(99,102,241,0.1)' }}
                  data-testid={`invoice-${inv.id}`}
                  className="glass-card p-4 hover:border-indigo-500/20 transition-all cursor-pointer"
                  onClick={() => setSelectedInvoice(selectedInvoice?.id === inv.id ? null : inv)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${sc.bg} flex items-center justify-center flex-shrink-0`}>
                      <StatusIcon className={`w-5 h-5 ${sc.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{inv.category}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${sc.bg} ${sc.text} ${sc.border} border font-medium`}>
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{inv.invoice_number} · Due: {inv.due_date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold font-mono">
                        <IndianRupee className="w-4 h-4 inline -mt-0.5" />{inv.total_amount?.toLocaleString('en-IN')}
                      </p>
                      {inv.status === 'PARTIAL' && (
                        <p className="text-[10px] text-indigo-400">Paid: Rs.{inv.amount_paid?.toLocaleString('en-IN')}</p>
                      )}
                    </div>
                    <ChevronRight className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${selectedInvoice?.id === inv.id ? 'rotate-90' : ''}`} />
                  </div>

                  {/* Expandable Detail */}
                  {selectedInvoice?.id === inv.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-4 pt-4 border-t border-[var(--border-subtle)]"
                    >
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div><span className="text-[var(--text-muted)]">Subtotal:</span> <span className="font-mono">Rs.{inv.subtotal?.toLocaleString('en-IN')}</span></div>
                        <div><span className="text-[var(--text-muted)]">CGST (9%):</span> <span className="font-mono">Rs.{inv.cgst?.toLocaleString('en-IN')}</span></div>
                        <div><span className="text-[var(--text-muted)]">SGST (9%):</span> <span className="font-mono">Rs.{inv.sgst?.toLocaleString('en-IN')}</span></div>
                        <div><span className="text-[var(--text-muted)]">Total:</span> <span className="font-mono font-bold">Rs.{inv.total_amount?.toLocaleString('en-IN')}</span></div>
                      </div>
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={(e) => { e.stopPropagation(); downloadPDF(inv.id); }}
                          data-testid={`download-pdf-${inv.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-2)] rounded-xl text-sm hover:bg-[var(--surface-3)] transition-colors border border-[var(--border-subtle)]"
                          disabled={downloading === inv.id}
                        >
                          <Download className={`w-4 h-4 ${downloading === inv.id ? 'animate-spin' : ''}`} />
                          {downloading === inv.id ? 'Generating...' : 'Download PDF'}
                        </motion.button>
                        {inv.status !== 'PAID' && (
                          <motion.button
                            whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(99,102,241,0.4)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white transition-colors"
                          >
                            <CreditCard className="w-4 h-4" />
                            Pay Now
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function PaymentsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 rounded-xl bg-[var(--surface-1)] shimmer-bg" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="glass-card shimmer-bg h-24 rounded-2xl" />)}
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <div key={i} className="glass-card shimmer-bg h-20 rounded-2xl" />)}
      </div>
    </div>
  );
}
