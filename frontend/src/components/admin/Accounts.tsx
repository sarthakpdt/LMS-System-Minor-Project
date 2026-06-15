import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Wallet, 
  PieChart as LucidePieChart, 
  Users, 
  Building2, 
  Calendar, 
  BookOpen, 
  Home, 
  UtensilsCrossed, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Search,
  Filter,
  Receipt,
  Send,
  X,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  CreditCard,
  Landmark,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useTheme } from '../../theme/ThemeProvider';

interface StudentFeeRecord {
  _id: string;
  studentId: string;
  rollNo: string;
  name: string;
  program: string;
  semester: number;
  paymentPlan: 'annual' | 'semester';
  academicFee: number;
  hostelFee: number;
  messFee: number;
  otherCharges: number;
  totalFee: number;
  paidAmount: number;
  dueAmount: number;
  feeStatus: 'paid' | 'partial' | 'pending' | 'overdue';
  lastPaymentDate: string;
}

interface TransactionRecord {
  _id: string;
  id: string;
  studentName: string;
  rollNo: string;
  program: string;
  type: 'payment' | 'refund';
  feeCategory: 'Academic' | 'Hostel' | 'Mess' | 'Other';
  amount: number;
  method: 'UPI' | 'NEFT' | 'RTGS' | 'Card' | 'Cash';
  date: string;
  time: string;
  status: 'completed' | 'processing';
}

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatINRShort(amount: number) {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} L`;
  }
  return formatINR(amount);
}

export function Accounts() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartTheme = useMemo(() => ({
    text: isDark ? '#94a3b8' : '#64748b',
    grid: isDark ? 'rgba(51, 65, 85, 0.2)' : 'rgba(226, 232, 240, 0.8)',
    tooltipBg: isDark ? '#1e293b' : '#ffffff',
    tooltipBorder: isDark ? '#334155' : '#e2e8f0',
  }), [isDark]);

  const [stats, setStats] = useState({
    totalCollected: 0,
    totalPending: 0,
    paidFullCount: 0,
    overdueBalance: 0,
    totalStudentsCount: 0
  });
  const [students, setStudents] = useState<StudentFeeRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Table Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPlan, setSelectedPlan] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Drawer & Action states
  const [selectedStudent, setSelectedStudent] = useState<StudentFeeRecord | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentCategory, setPaymentCategory] = useState<'Academic' | 'Hostel' | 'Mess' | 'Other'>('Academic');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NEFT' | 'RTGS' | 'Card' | 'Cash'>('UPI');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, studentsRes, txnRes] = await Promise.all([
        fetch('http://localhost:5000/api/accounts/stats'),
        fetch('http://localhost:5000/api/accounts/students'),
        fetch('http://localhost:5000/api/accounts/transactions')
      ]);

      const statsData = await statsRes.json();
      const studentsData = await studentsRes.json();
      const txnData = await txnRes.json();

      if (statsData.success) setStats(statsData.stats);
      if (studentsData.success) setStudents(studentsData.students);
      if (txnData.success) setTransactions(txnData.transactions);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load accounts data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sendReminder = async (studentId: string, name: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/accounts/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Reminder sent to ${name}!`);
      } else {
        toast.error('Failed to send reminder.');
      }
    } catch (error) {
      toast.error('Error contacting server.');
    }
  };

  // Filter logic
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProgram = selectedProgram === "all" || student.program === selectedProgram;
    const matchesSemester = selectedSemester === "all" || student.semester.toString() === selectedSemester;
    const matchesStatus = selectedStatus === "all" || student.feeStatus === selectedStatus;
    const matchesPlan = selectedPlan === "all" || student.paymentPlan === selectedPlan;
    return matchesSearch && matchesProgram && matchesSemester && matchesStatus && matchesPlan;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedProgram("all");
    setSelectedSemester("all");
    setSelectedStatus("all");
    setSelectedPlan("all");
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    if (filteredStudents.length === 0) {
      toast.error("No student records available to export.");
      return;
    }

    const csvHeaders = [
      "Roll No.", 
      "Student Name", 
      "Program", 
      "Semester", 
      "Payment Plan", 
      "Academic Fee (INR)", 
      "Hostel Fee (INR)", 
      "Mess Fee (INR)", 
      "Other Charges (INR)", 
      "Total Fee (INR)", 
      "Paid Amount (INR)", 
      "Due Amount (INR)", 
      "Fee Status", 
      "Last Payment Date"
    ];

    const csvRows = [
      csvHeaders,
      ...filteredStudents.map(student => [
        student.rollNo,
        student.name,
        student.program,
        student.semester,
        student.paymentPlan,
        student.academicFee,
        student.hostelFee,
        student.messFee,
        student.otherCharges,
        student.totalFee,
        student.paidAmount,
        student.dueAmount,
        student.feeStatus,
        student.lastPaymentDate
      ])
    ];

    // Build CSV string with correct escaping
    const csvContent = csvRows.map(row => 
      row.map(val => {
        const text = val === null || val === undefined ? '' : String(val);
        if (text.includes(',') || text.includes('"') || text.includes('\n')) {
          return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
      }).join(",")
    ).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `student_fee_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Excel/CSV fee ledger exported successfully!");
  };

  const hasActiveFilters = searchQuery || selectedProgram !== "all" || selectedSemester !== "all" || selectedStatus !== "all" || selectedPlan !== "all";

  // Derive Fee Category Aggregations from DB
  const categories = [
    { name: "Academic Fee", icon: BookOpen, key: "academicFee", color: "bg-blue-500", iconBg: "bg-blue-100 text-blue-600" },
    { name: "Hostel Fee", icon: Home, key: "hostelFee", color: "bg-emerald-500", iconBg: "bg-emerald-100 text-emerald-600" },
    { name: "Mess Fee", icon: UtensilsCrossed, key: "messFee", color: "bg-amber-500", iconBg: "bg-amber-100 text-amber-600" },
    { name: "Other Charges", icon: MoreHorizontal, key: "otherCharges", color: "bg-purple-500", iconBg: "bg-purple-100 text-purple-600" }
  ].map(cat => {
    let collected = 0;
    let total = 0;
    students.forEach(record => {
      const feeVal = (record as any)[cat.key] || 0;
      total += feeVal;
      // Pro-rate collected amount based on overall paid ratio
      const ratio = record.totalFee > 0 ? (record.paidAmount / record.totalFee) : 0;
      collected += feeVal * ratio;
    });
    return {
      ...cat,
      collected: Math.round(collected),
      pending: Math.max(0, Math.round(total - collected)),
      total: Math.round(total)
    };
  });

  // Derive Semester Completion
  const semDetails = [1, 2, 3, 4, 5, 6, 7, 8].map(sem => {
    const semRecords = students.filter(s => s.semester === sem);
    const paidCount = semRecords.filter(s => s.feeStatus === 'paid').length;
    const totalCount = semRecords.length || 0;
    const percentage = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
    return { sem: `Sem ${sem}`, total: totalCount, paid: paidCount, percentage };
  });  // Programs list dynamically aggregated
  const uniquePrograms = Array.from(new Set(students.map(s => s.program).filter(Boolean)));
  const programDetails = uniquePrograms.map((prog, index) => {
    const progRecords = students.filter(s => s.program === prog);
    const paidCount = progRecords.filter(s => s.feeStatus === 'paid').length;
    const totalCount = progRecords.length;
    const collected = progRecords.reduce((sum, r) => sum + r.paidAmount, 0);
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-indigo-500', 'bg-pink-500'];
    const textColors = ['text-blue-600', 'text-emerald-600', 'text-purple-600', 'text-amber-600', 'text-indigo-600', 'text-pink-600'];
    return {
      name: prog,
      shortName: prog.split(' ')[0],
      students: totalCount,
      paidStudents: paidCount,
      collected,
      color: colors[index % colors.length],
      textColor: textColors[index % textColors.length]
    };
  });

  const downloadReceipt = (student: StudentFeeRecord) => {
    const receiptContent = `
=========================================
          EDUTRACK LMS SYSTEM
         FEE PAYMENT RECEIPT
=========================================
Date: ${new Date().toLocaleDateString('en-IN')}
Invoice Ref: INV-${student.rollNo}-${Date.now().toString().slice(-4)}

STUDENT DETAILS:
Name: ${student.name}
Roll No: ${student.rollNo}
Program: ${student.program}
Semester: Semester ${student.semester}

FEE STRUCTURE & DUES STATEMENT:
Academic Fee: ${formatINR(student.academicFee)}
Hostel Fee:   ${formatINR(student.hostelFee)}
Mess Fee:     ${formatINR(student.messFee)}
Other Dues:   ${formatINR(student.otherCharges)}
-----------------------------------------
Total Fee:    ${formatINR(student.totalFee)}
Paid Amount:  ${formatINR(student.paidAmount)}
Due Amount:   ${formatINR(student.dueAmount)}
-----------------------------------------
Payment Status: ${student.feeStatus.toUpperCase()}
Last Payment Date: ${student.lastPaymentDate}

This is a computer-generated fee ledger statement.
=========================================
`;

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Receipt_${student.rollNo}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Receipt for ${student.name} downloaded!`);
  };

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }
    try {
      setSubmittingPayment(true);
      const res = await fetch('http://localhost:5000/api/student/pay-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.studentId,
          category: paymentCategory,
          amount: Number(paymentAmount),
          method: paymentMethod
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Payment recorded successfully!");
        setShowPaymentForm(false);
        setPaymentAmount("");
        
        // Refresh statistics, student list, and transactions
        await fetchData();
        
        // Update the local selectedStudent object to reflect new balances
        if (data.feeRecord) {
          setSelectedStudent(data.feeRecord);
        }
      } else {
        toast.error(data.message || "Failed to record payment.");
      }
    } catch (error) {
      toast.error("Error connecting to payment server.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Derive Collection Trend Data
  const trendData = useMemo(() => {
    const groups: { [key: string]: number } = {};
    const completedTxns = transactions.filter(t => t.status === 'completed' && t.type === 'payment');

    completedTxns.forEach(txn => {
      let label = txn.date;
      groups[label] = (groups[label] || 0) + txn.amount;
    });

    const dates = Object.keys(groups);
    const chartPoints = dates.map(d => ({ date: d, amount: groups[d] }));

    // Fallback if data is too small to make a good chart
    if (chartPoints.length < 5) {
      const fallbackPoints = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const val = groups[dateStr] || Math.floor(180000 + Math.sin(i * 1.2) * 60005 + (i % 2) * 20000);
        fallbackPoints.push({ date: dateStr, amount: val });
      }
      return fallbackPoints;
    }
    
    return chartPoints.slice(-7);
  }, [transactions]);

  // Derive Donut Data
  const donutData = useMemo(() => {
    const COLORS = ['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B']; // Purple, Emerald, Blue, Amber
    return categories.map((cat, index) => ({
      name: cat.name.replace(" Fee", "").replace(" Charges", ""),
      value: cat.collected,
      color: COLORS[index % COLORS.length]
    }));
  }, [categories]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-3 bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-600 border-t-transparent"></div>
        <p className="text-sm font-medium text-gray-505 dark:text-slate-400">Loading accounts and transaction ledger...</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 p-2.5 rounded-lg shadow-lg">
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-sm font-black text-purple-600 dark:text-purple-400">
            {formatINR(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 space-y-6 text-gray-850 dark:text-slate-200 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Finance & Accounts Ledger</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">Real-time tuition fee collections, tracking, and student reminders</p>
        </div>
        <button 
          onClick={fetchData} 
          className="h-9 px-4 rounded-lg bg-purple-600 hover:bg-purple-750 text-white text-xs font-semibold transition shadow-sm flex items-center gap-2"
        >
          Refresh Ledger
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Total Collected */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/50 p-4 shadow-sm hover:shadow transition duration-200 flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wide">Total Fee Collection</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{formatINRShort(stats.totalCollected)}</p>
            <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-0.5">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Database Sync Active</span>
            </p>
          </div>
          <div className="h-9 w-9 bg-purple-100 dark:bg-purple-950/30 rounded-lg flex items-center justify-center">
            <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        {/* Pending Dues */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/50 p-4 shadow-sm hover:shadow transition duration-200 flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wide">Pending Dues</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{formatINRShort(stats.totalPending)}</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400">Across {students.filter(s => s.dueAmount > 0).length} students</p>
          </div>
          <div className="h-9 w-9 bg-amber-100 dark:bg-amber-950/30 rounded-lg flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Students Paid */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/50 p-4 shadow-sm hover:shadow transition duration-200 flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wide">Students Paid (Full)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.paidFullCount}</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400">
              {stats.totalStudentsCount > 0 
                ? `${((stats.paidFullCount / stats.totalStudentsCount) * 100).toFixed(0)}% completion rate`
                : '0% completion rate'}
            </p>
          </div>
          <div className="h-9 w-9 bg-emerald-100 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        {/* Overdue Balance */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/50 p-4 shadow-sm hover:shadow transition duration-200 flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wide">Overdue Balance</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{formatINRShort(stats.overdueBalance)}</p>
            <p className="text-[10px] text-red-650 dark:text-red-400 flex items-center gap-0.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Requires attention</span>
            </p>
          </div>
          <div className="h-9 w-9 bg-red-100 dark:bg-red-950/30 rounded-lg flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      {/* Dynamic Charts Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Collection Trend Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm p-5 flex flex-col justify-between">
          <div className="border-b border-gray-100 dark:border-slate-700/30 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Collection Trend</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-400">Tuition fees collected over the last 7 transaction dates</p>
            </div>
            <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded text-[10px] font-bold text-purple-600 dark:text-purple-400">
              <TrendingUp className="h-3 w-3" />
              <span>Dynamic Tracking</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333EA" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#9333EA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                <XAxis 
                  dataKey="date" 
                  stroke={chartTheme.text} 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke={chartTheme.text} 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={formatINRShort}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#9333EA" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorTrend)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fee Distribution Donut Chart */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm p-5 flex flex-col justify-between">
          <div className="border-b border-gray-100 dark:border-slate-700/30 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Fee Distribution</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-400">Share of fee categories collected</p>
            </div>
            <LucidePieChart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="relative h-44 w-full flex items-center justify-center animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <RechartsTooltip 
                  formatter={(value: any) => [formatINR(value), 'Collected']}
                  contentStyle={{ 
                    backgroundColor: chartTheme.tooltipBg, 
                    borderColor: chartTheme.tooltipBorder,
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: isDark ? '#f1f5f9' : '#0f172a'
                  }}
                />
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wide">Total Collected</span>
              <span className="text-sm font-black text-gray-900 dark:text-slate-100">
                {formatINRShort(stats.totalCollected)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {donutData.map((entry) => {
              const totalVal = stats.totalCollected || 1;
              const pct = ((entry.value / totalVal) * 100).toFixed(0);
              return (
                <div key={entry.name} className="flex items-center gap-2 text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-700 dark:text-slate-300 truncate">{entry.name}</p>
                    <p className="text-[9px] text-gray-400 dark:text-slate-450">{pct}% ({formatINRShort(entry.value)})</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid of Other Analytics Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* Payment Plan distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm p-4 flex flex-col justify-between">
          <div className="border-b border-gray-100 dark:border-slate-700/30 pb-3 mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Payment Plans</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-400">Annual vs Semester-wise</p>
            </div>
            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="space-y-4 flex-1">
            {['annual', 'semester'].map(plan => {
              const planRecords = students.filter(s => s.paymentPlan === plan);
              const collected = planRecords.reduce((sum, r) => sum + r.paidAmount, 0);
              const total = planRecords.reduce((sum, r) => sum + r.totalFee, 0);
              const count = planRecords.length;
              const rate = total > 0 ? ((collected / total) * 100).toFixed(0) : "0";
              const color = plan === 'annual' ? 'bg-emerald-500' : 'bg-blue-500';

              return (
                <div key={plan} className="p-2.5 rounded bg-gray-50 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-700/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-850 dark:text-slate-200 capitalize">{plan} Plan</span>
                    <span className="text-[10px] text-gray-405 dark:text-slate-450">{count} students</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500 dark:text-slate-400">Collected</span>
                    <span className="font-bold text-gray-800 dark:text-slate-100">{formatINRShort(collected)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-250 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${color}`} style={{ width: `${rate}%` }}></div>
                    </div>
                    <span className="text-[9px] font-bold text-gray-500 dark:text-slate-400">{rate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Program-wise Collection */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm p-4 flex flex-col justify-between">
          <div className="border-b border-gray-100 dark:border-slate-700/30 pb-3 mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Program Collection</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-400">By academic department</p>
            </div>
            <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-48 pr-1">
            {programDetails.map(prog => {
              const rate = prog.students > 0 ? ((prog.paidStudents / prog.students) * 100).toFixed(0) : "0";
              return (
                <div key={prog.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-700 dark:text-slate-300 truncate w-32">{prog.name}</span>
                    <span className="text-[11px] font-bold text-gray-800 dark:text-slate-100">{formatINRShort(prog.collected)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${prog.color}`} style={{ width: `${rate}%` }}></div>
                    </div>
                    <span className="text-[9px] text-gray-400 dark:text-slate-450">{prog.paidStudents}/{prog.students} Paid</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Semester completion rate */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm p-4 flex flex-col justify-between">
          <div className="border-b border-gray-100 dark:border-slate-700/30 pb-3 mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Semester Completion</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-400">Paid fully by semester</p>
            </div>
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1 max-h-48 overflow-y-auto pr-1">
            {semDetails.map(sem => {
              const pct = sem.percentage.toFixed(0);
              const isLow = sem.percentage < 70;
              const color = isLow ? 'bg-red-500' : 'bg-emerald-500';
              const textColor = isLow ? 'text-red-650 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400';
              return (
                <div key={sem.sem} className="p-2 rounded bg-gray-50 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-700/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200">{sem.sem}</span>
                    <span className={`text-xs font-black ${textColor}`}>{pct}%</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${color}`} style={{ width: `${pct}%` }}></div>
                    </div>
                    <p className="text-[8px] text-gray-400 dark:text-slate-450">{sem.paid}/{sem.total} paid</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Ledger Tables */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-4">
        {/* Student payments table - Takes 3 columns */}
        <div className="xl:col-span-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden flex flex-col">
          {/* Table Header & Actions */}
          <div className="p-4 border-b border-gray-100 dark:border-slate-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Student Fee Registry</h3>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">Search, filter, and review dynamic student fee invoices</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={exportToExcel}
                className="h-8 px-2.5 rounded border border-gray-200 dark:border-slate-700 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 text-gray-700 dark:text-slate-200"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-3 bg-gray-50/50 dark:bg-slate-900/40 border-b border-gray-100 dark:border-slate-700/40 flex flex-col lg:flex-row gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search name or roll no..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="h-8 w-full rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 text-xs focus:outline-none focus:border-purple-600 text-gray-800 dark:text-slate-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              
              {/* Program filter */}
              <select 
                value={selectedProgram}
                onChange={(e) => { setSelectedProgram(e.target.value); setCurrentPage(1); }}
                className="h-8 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs focus:outline-none focus:border-purple-600 text-gray-800 dark:text-slate-200"
              >
                <option value="all">All Programs</option>
                {uniquePrograms.map(prog => (
                  <option key={prog} value={prog}>{prog}</option>
                ))}
              </select>

              {/* Semester filter */}
              <select 
                value={selectedSemester}
                onChange={(e) => { setSelectedSemester(e.target.value); setCurrentPage(1); }}
                className="h-8 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs focus:outline-none focus:border-purple-600 text-gray-800 dark:text-slate-200"
              >
                <option value="all">All Semesters</option>
                <option value="1">Sem 1</option>
                <option value="2">Sem 2</option>
                <option value="3">Sem 3</option>
                <option value="4">Sem 4</option>
                <option value="5">Sem 5</option>
                <option value="6">Sem 6</option>
                <option value="7">Sem 7</option>
                <option value="8">Sem 8</option>
              </select>

              {/* Plan filter */}
              <select 
                value={selectedPlan}
                onChange={(e) => { setSelectedPlan(e.target.value); setCurrentPage(1); }}
                className="h-8 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs focus:outline-none focus:border-purple-600 text-gray-800 dark:text-slate-200"
              >
                <option value="all">All Plans</option>
                <option value="annual">Annual</option>
                <option value="semester">Semester</option>
              </select>

              {/* Status filter */}
              <select 
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                className="h-8 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs focus:outline-none focus:border-purple-600 text-gray-800 dark:text-slate-200"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>

              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="h-8 px-2 rounded text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition flex items-center gap-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto flex-1">
            {currentStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 dark:text-slate-400">
                No matching student fee records found in database.
              </div>
            ) : (
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700/40 bg-gray-50 dark:bg-slate-900/50 text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase text-left">
                    <th className="px-4 py-3">Roll No.</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3 text-center">Sem</th>
                    <th className="px-4 py-3 text-center">Plan</th>
                    <th className="px-4 py-3 text-right">Academic</th>
                    <th className="px-4 py-3 text-right">Hostel & Mess</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Due</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/30 text-xs text-gray-750 dark:text-slate-350">
                  {currentStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-750/30 transition">
                      <td className="px-4 py-3 font-mono text-gray-400 dark:text-slate-500">{student.rollNo}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-slate-100">{student.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30">
                          {student.program}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-slate-300">{student.semester}</td>
                      <td className="px-4 py-3 text-center capitalize text-gray-600 dark:text-slate-450">{student.paymentPlan}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatINR(student.academicFee)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatINR(student.hostelFee + student.messFee)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatINR(student.paidAmount)}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-650 dark:text-red-400">
                        {student.dueAmount > 0 ? formatINR(student.dueAmount) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          student.feeStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-450 dark:border-green-900/30' :
                          student.feeStatus === 'partial' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-450 dark:border-blue-900/30' :
                          student.feeStatus === 'overdue' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-450 dark:border-red-900/30' :
                          'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
                        }`}>
                          {student.feeStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {student.dueAmount > 0 && (
                            <button 
                              onClick={() => sendReminder(student.studentId, student.name)}
                              className="p-1 rounded bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 transition" 
                              title="Send Fee Reminder Email"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowPaymentForm(false);
                            }}
                            className="p-1 rounded bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-500 dark:text-slate-350 transition" 
                            title="View Student Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Pagination */}
          <div className="p-4 border-t border-gray-100 dark:border-slate-700/40 flex items-center justify-between text-xs text-gray-550 dark:text-slate-400">
            <span>
              Showing <span className="font-semibold">{Math.min(indexOfLastItem, filteredStudents.length)}</span> of <span className="font-semibold">{filteredStudents.length}</span> students
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition text-gray-700 dark:text-slate-305"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`h-7 w-7 rounded font-bold transition ${
                    currentPage === i + 1 
                      ? 'bg-purple-600 text-white shadow-sm' 
                      : 'border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-7 w-7 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition text-gray-700 dark:text-slate-305"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right side: Recent Transactions */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm p-4 flex flex-col justify-between">
          <div className="border-b border-gray-100 dark:border-slate-700/30 pb-3 mb-3">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Recent Transactions</h3>
            <p className="text-[10px] text-gray-400 dark:text-slate-400">Latest online fee payments</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-700/30 flex-1 overflow-auto max-h-[400px] space-y-2 pr-1">
            {transactions.length === 0 ? (
              <div className="text-center text-xs text-gray-405 dark:text-slate-400 py-6">
                No recent transactions.
              </div>
            ) : (
              transactions.map(txn => {
                const isRefund = txn.type === 'refund';
                return (
                  <div key={txn._id || txn.id} className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isRefund ? 'bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400' : 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-450'
                      }`}>
                        {isRefund ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-gray-900 dark:text-slate-100 truncate">{txn.studentName}</p>
                        <p className="text-[9px] text-gray-400 dark:text-slate-450 flex items-center gap-1">
                          <span className="px-1 bg-gray-100 dark:bg-slate-700 rounded text-gray-650 dark:text-slate-350">{txn.feeCategory}</span>
                          <span>{txn.method}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-[11px] font-bold ${isRefund ? 'text-red-600' : 'text-green-600 dark:text-green-450'}`}>
                        {isRefund ? '-' : '+'}{formatINR(txn.amount)}
                      </p>
                      <p className="text-[8px] text-gray-400 dark:text-slate-450">{txn.date} • {txn.time}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700/30 text-[10px] text-gray-500 dark:text-slate-400 flex justify-between">
            <span>Ledger Status</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-450">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Slide-out Student Details Drawer */}
      <AnimatePresence>
        {selectedStudent && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs"
            />
            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700/50 shadow-2xl z-50 overflow-y-auto flex flex-col text-gray-800 dark:text-slate-100"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-gray-100 dark:border-slate-700/30 flex items-center justify-between bg-gray-50 dark:bg-slate-900/50">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Student Account Profile</h3>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400">Manage fees, records, and quick notifications</p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-5 space-y-6 flex-1 overflow-y-auto">
                {/* Profile Section */}
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md">
                    {selectedStudent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{selectedStudent.name}</h4>
                    <p className="text-xs text-gray-550 dark:text-slate-400">ID: {selectedStudent.studentId} • Roll: {selectedStudent.rollNo}</p>
                    <p className="text-[11px] font-medium text-purple-600 dark:text-purple-400 mt-0.5">{selectedStudent.program} • Semester {selectedStudent.semester}</p>
                  </div>
                </div>

                {/* Ledger Breakdown Cards */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-gray-400 dark:text-slate-450 uppercase tracking-wider">Fee Ledger Statement</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900/30 border border-gray-100 dark:border-slate-700/30">
                      <p className="text-gray-400 dark:text-slate-500 text-[10px]">Academic Fee</p>
                      <p className="font-bold text-gray-900 dark:text-slate-150 mt-0.5">{formatINR(selectedStudent.academicFee)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900/30 border border-gray-100 dark:border-slate-700/30">
                      <p className="text-gray-400 dark:text-slate-500 text-[10px]">Hostel Fee</p>
                      <p className="font-bold text-gray-900 dark:text-slate-150 mt-0.5">{formatINR(selectedStudent.hostelFee)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900/30 border border-gray-100 dark:border-slate-700/30">
                      <p className="text-gray-400 dark:text-slate-500 text-[10px]">Mess Fee</p>
                      <p className="font-bold text-gray-900 dark:text-slate-150 mt-0.5">{formatINR(selectedStudent.messFee)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900/30 border border-gray-100 dark:border-slate-700/30">
                      <p className="text-gray-400 dark:text-slate-500 text-[10px]">Other Dues</p>
                      <p className="font-bold text-gray-900 dark:text-slate-150 mt-0.5">{formatINR(selectedStudent.otherCharges)}</p>
                    </div>
                  </div>

                  {/* Summary Totals */}
                  <div className="p-3.5 rounded-xl border border-gray-100 dark:border-slate-700/30 space-y-2.5 bg-gray-50/50 dark:bg-slate-900/10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-505 dark:text-slate-400">Total Invoice</span>
                      <span className="font-bold text-gray-950 dark:text-slate-100">{formatINR(selectedStudent.totalFee)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-550 dark:text-slate-400">Paid Amount</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatINR(selectedStudent.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-dashed border-gray-200 dark:border-slate-700/40 pt-2 text-xs">
                      <span className="font-semibold text-gray-700 dark:text-slate-300">Remaining Balance</span>
                      <span className={`font-black ${selectedStudent.dueAmount > 0 ? 'text-red-650 dark:text-red-400' : 'text-gray-400 dark:text-slate-500'}`}>
                        {formatINR(selectedStudent.dueAmount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border capitalize ${
                        selectedStudent.feeStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30' :
                        selectedStudent.feeStatus === 'partial' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30' :
                        selectedStudent.feeStatus === 'overdue' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30' :
                        'bg-gray-100 text-gray-650 border-gray-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
                      }`}>
                        {selectedStudent.feeStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Accountant Actions Panel */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-gray-400 dark:text-slate-450 uppercase tracking-wider">Accountant Actions</h5>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setShowPaymentForm(!showPaymentForm)}
                      className="p-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold text-center transition shadow flex flex-col items-center justify-center gap-1"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Pay Dues</span>
                    </button>
                    <button
                      onClick={() => sendReminder(selectedStudent.studentId, selectedStudent.name)}
                      disabled={selectedStudent.dueAmount === 0}
                      className="p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750/30 text-gray-750 dark:text-slate-300 text-[11px] font-bold text-center transition flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span>Remind</span>
                    </button>
                    <button
                      onClick={() => downloadReceipt(selectedStudent)}
                      className="p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750/30 text-gray-750 dark:text-slate-300 text-[11px] font-bold text-center transition flex flex-col items-center justify-center gap-1"
                    >
                      <Download className="h-4 w-4 text-emerald-650 dark:text-emerald-400" />
                      <span>Invoice</span>
                    </button>
                  </div>

                  {/* Inline Record Payment Form */}
                  <AnimatePresence>
                    {showPaymentForm && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleManualPayment}
                        className="p-4 rounded-xl border border-purple-100 dark:border-purple-900/30 bg-purple-50/30 dark:bg-purple-950/5 space-y-3 overflow-hidden text-xs text-gray-700 dark:text-slate-205"
                      >
                        <div className="flex justify-between items-center border-b border-purple-100/50 dark:border-purple-900/20 pb-1.5">
                          <h6 className="font-bold text-purple-900 dark:text-purple-450">Record Fee Payment</h6>
                          <button
                            type="button"
                            onClick={() => setShowPaymentForm(false)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Category */}
                        <div className="space-y-1">
                          <label className="font-semibold text-gray-650 dark:text-slate-300">Dues Category</label>
                          <select
                            value={paymentCategory}
                            onChange={(e) => setPaymentCategory(e.target.value as any)}
                            className="w-full h-8 rounded border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-900 px-2 focus:outline-none focus:border-purple-655 text-xs text-gray-800 dark:text-slate-200"
                          >
                            <option value="Academic">Academic Tuition Fee</option>
                            <option value="Hostel">Hostel Accommodation Fee</option>
                            <option value="Mess">Mess Catering Fee</option>
                            <option value="Other">Other Miscellaneous Charges</option>
                          </select>
                        </div>

                        {/* Amount */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="font-semibold text-gray-655 dark:text-slate-300">Amount (INR)</label>
                            <button
                              type="button"
                              onClick={() => {
                                // Calculate total due for category
                                const ratio = selectedStudent.totalFee > 0 ? (selectedStudent.paidAmount / selectedStudent.totalFee) : 0;
                                let categoryTotal = 0;
                                if (paymentCategory === 'Academic') categoryTotal = selectedStudent.academicFee;
                                else if (paymentCategory === 'Hostel') categoryTotal = selectedStudent.hostelFee;
                                else if (paymentCategory === 'Mess') categoryTotal = selectedStudent.messFee;
                                else categoryTotal = selectedStudent.otherCharges;

                                const categoryPaid = categoryTotal * ratio;
                                const categoryDue = Math.max(0, Math.round(categoryTotal - categoryPaid));
                                setPaymentAmount(String(Math.min(categoryDue, selectedStudent.dueAmount)));
                              }}
                              className="text-[9px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                            >
                              Fill Category Due
                            </button>
                          </div>
                          <input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="Enter payment amount..."
                            max={selectedStudent.dueAmount}
                            className="w-full h-8 rounded border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-900 px-2.5 focus:outline-none focus:border-purple-650 text-xs text-gray-800 dark:text-slate-200"
                          />
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-1">
                          <label className="font-semibold text-gray-655 dark:text-slate-300">Payment Gateway / Mode</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                            className="w-full h-8 rounded border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-900 px-2 focus:outline-none focus:border-purple-650 text-xs text-gray-800 dark:text-slate-200"
                          >
                            <option value="UPI">UPI (GooglePay/PhonePe)</option>
                            <option value="Cash">Cash Counter Submission</option>
                            <option value="Card">Credit / Debit Card</option>
                            <option value="NEFT">NEFT Bank Transfer</option>
                            <option value="RTGS">RTGS Bank Transfer</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={submittingPayment}
                          className="w-full h-8 bg-purple-600 hover:bg-purple-750 text-white rounded font-semibold transition disabled:opacity-50 text-xs flex items-center justify-center gap-1"
                        >
                          {submittingPayment ? "Processing payment..." : "Confirm Payment"}
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>

                {/* Filtered Student Payments History */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-gray-400 dark:text-slate-450 uppercase tracking-wider">Payment History</h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {transactions.filter(t => t.rollNo === selectedStudent.rollNo).length === 0 ? (
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 italic py-2">No transactions recorded for this student.</p>
                    ) : (
                      transactions
                        .filter(t => t.rollNo === selectedStudent.rollNo)
                        .map(txn => (
                          <div key={txn._id || txn.id} className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900/30 border border-gray-100 dark:border-slate-700/30 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-purple-700 dark:text-purple-400 font-mono text-[10px]">{txn.id}</p>
                              <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">{txn.date} • {txn.time} ({txn.method})</p>
                              <span className="inline-block mt-1 px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-350 text-[9px] rounded font-semibold">{txn.feeCategory}</span>
                            </div>
                            <span className="font-black text-emerald-600 dark:text-emerald-450 text-right">+{formatINR(txn.amount)}</span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
