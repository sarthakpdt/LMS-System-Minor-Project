import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  CheckCircle, XCircle, Clock, User, Mail, Phone,
  GraduationCap, Calendar, Search, Filter, HelpCircle, UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const DEPT_LABELS: Record<string, string> = {
  CS: 'Computer Science', IT: 'Information Technology',
  ECE: 'Electronics & Comm.', EE: 'Electrical Eng.',
  ME: 'Mechanical Eng.', CE: 'Civil Eng.',
  CH: 'Chemical Eng.', BT: 'Biotechnology',
  MBA: 'MBA', MCA: 'MCA',
  Other: 'Other'
};

export function StudentApprovals() {
  const { user } = useAuth();
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  
  // Dialog modal states
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    studentId: string;
    studentName: string;
    actionType: 'approve' | 'reject';
    reason?: string;
  } | null>(null);

  useEffect(() => {
    loadPendingStudents();
  }, []);

  const loadPendingStudents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/students/pending', {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const list = (data.data || []).map((s: any) => ({ ...s, id: s._id }));
        setPendingStudents(list);
      } else {
        toast.error('Unable to load pending students', { description: data.message });
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error while fetching pending students');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSubmit = async (studentId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/students/${studentId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminId: user.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Student approved!', {
          description: 'The student can now login and access the platform.',
        });
        loadPendingStudents();
      } else {
        toast.error('Approval failed', { description: data.message });
      }
    } catch (err) {
      console.error(err);
      toast.error('Approval failed', { description: 'Network or server error' });
    } finally {
      setLoading(false);
      setConfirmModal(null);
    }
  };

  const handleRejectSubmit = async (studentId: string, reason: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/students/${studentId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminId: user.id, reason: reason || 'Rejected via admin panel' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Student rejected', {
          description: 'The student registration has been rejected.',
        });
        loadPendingStudents();
      } else {
        toast.error('Rejection failed', { description: data.message });
      }
    } catch (err) {
      console.error(err);
      toast.error('Rejection failed', { description: 'Network or server error' });
    } finally {
      setLoading(false);
      setConfirmModal(null);
    }
  };

  const filteredStudents = pendingStudents.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.studentId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || student.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const uniqueDepartments = Array.from(new Set(pendingStudents.map(s => s.department)));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 22 } },
    exit: { opacity: 0, scale: 0.95, y: -15, transition: { duration: 0.2 } }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 relative">
      {/* Page Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-[1rem] flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              Student Approvals
              <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-black px-3 py-1 rounded-full border border-purple-200/50 dark:border-purple-800/30">
                {pendingStudents.length} Pending
              </span>
            </h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-16">
            Review and verify student registrations before granting access to institutional portals.
          </p>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row items-center gap-4 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all text-gray-900 dark:text-white"
          />
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full md:w-48 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all text-gray-900 dark:text-white font-medium"
          >
            <option value="ALL">All Departments</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>{DEPT_LABELS[dept] || dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student List Section */}
      <AnimatePresence mode="popLayout">
        {filteredStudents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-gray-200/80 dark:border-slate-700/50 shadow-xs hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="w-20 h-20 bg-purple-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-5 border border-purple-100 dark:border-slate-800">
              <Clock className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">All Caught Up!</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
              There are no pending registrations matching your criteria. Outstanding requests will appear here.
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filteredStudents.map((student) => (
              <motion.div
                key={student.id}
                variants={cardVariants}
                exit="exit"
                layoutId={student.id}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200/80 dark:border-slate-700/50 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Card Top */}
                <div className="p-6 border-b border-gray-100 dark:border-slate-700/50 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 dark:from-purple-950/20 dark:to-indigo-950/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black shadow-md border border-purple-400/20 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                      {student.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white truncate">{student.name}</h4>
                      <p className="text-xs font-mono text-purple-600 dark:text-purple-400 mt-0.5">{student.studentId}</p>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="p-6 space-y-4 flex-1">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Department</span>
                      <span className="font-semibold text-gray-800 dark:text-slate-300">
                        {DEPT_LABELS[student.department] || student.department}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Semester</span>
                      <span className="font-semibold text-gray-800 dark:text-slate-300">Semester {student.semester}</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-gray-50 dark:border-slate-700/30">
                    <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-slate-400">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{student.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-slate-400">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{student.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900/30 border-t border-gray-100 dark:border-slate-700/50 flex gap-3">
                  <button
                    onClick={() => setConfirmModal({
                      show: true,
                      studentId: student.id,
                      studentName: student.name,
                      actionType: 'approve'
                    })}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => setConfirmModal({
                      show: true,
                      studentId: student.id,
                      studentName: student.name,
                      actionType: 'reject',
                      reason: ''
                    })}
                    className="flex-1 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog Modal */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-gray-200/80 dark:border-slate-700/50 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4 text-purple-600 dark:text-purple-400">
                <HelpCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Decision</h3>
              </div>

              <p className="text-sm text-gray-600 dark:text-slate-300">
                Are you sure you want to {confirmModal.actionType} registration request from{' '}
                <strong>{confirmModal.studentName}</strong>?
              </p>

              {confirmModal.actionType === 'reject' && (
                <div className="mt-4">
                  <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    Rejection Reason
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter reason for rejection..."
                    value={confirmModal.reason || ''}
                    onChange={(e) => setConfirmModal(prev => prev ? { ...prev, reason: e.target.value } : null)}
                    className="w-full p-3 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-all text-gray-900 dark:text-white resize-none"
                  />
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-900 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmModal.actionType === 'approve') {
                      handleApproveSubmit(confirmModal.studentId);
                    } else {
                      handleRejectSubmit(confirmModal.studentId, confirmModal.reason || '');
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${
                    confirmModal.actionType === 'approve'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}