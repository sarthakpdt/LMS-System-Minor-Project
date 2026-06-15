import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CreditCard, 
  Wallet, 
  Calendar, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Smartphone,
  Landmark,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';

interface FeeRecord {
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

export function StudentFeePayment({ embedMode = false }: { embedMode?: boolean }) {
  const { user } = useAuth();
  // Fallback student ID for testing if not set
  const studentId = user?.studentId || 'STU002';

  const [record, setRecord] = useState<FeeRecord | null>(null);
  const [history, setHistory] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [category, setCategory] = useState<'Academic' | 'Hostel' | 'Mess' | 'Other'>('Academic');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'UPI' | 'NEFT' | 'RTGS' | 'Card'>('UPI');
  const [paying, setPaying] = useState(false);

  const fetchFeeData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/accounts/student/${studentId}`);
      const data = await res.json();
      if (data.success) {
        setRecord(data.record);
      } else {
        toast.error('Could not load fee records.');
      }

      // Fetch transaction history for this student specifically
      const txnRes = await fetch(`http://localhost:5000/api/accounts/student/${studentId}/payments`);
      const txnData = await txnRes.json();
      if (txnData.success) {
        setHistory(txnData.transactions);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load accounts data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeData();
  }, [studentId]);

  const handlePayFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    const payAmt = Number(amount);
    if (!amount || payAmt <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    if (payAmt > record.dueAmount) {
      toast.error(`Amount exceeds current total due of ${formatINR(record.dueAmount)}`);
      return;
    }

    try {
      setPaying(true);
      const res = await fetch('http://localhost:5000/api/student/pay-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: record.studentId,
          category,
          amount: payAmt,
          method
        })
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Payment of ${formatINR(payAmt)} processed successfully!`, {
          description: `Transaction ID: ${data.transaction.id}`
        });
        setAmount('');
        fetchFeeData(); // Refresh info
      } else {
        toast.error(data.message || 'Payment failed.');
      }
    } catch (err) {
      toast.error('Error submitting payment.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
        <p className="text-sm font-medium text-gray-500">Loading student fee records...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No fee records found for student ID: {studentId}</p>
      </div>
    );
  }

  // Calculate dynamic default amount based on selected category dues
  const getCategoryDue = () => {
    const totalPaidRatio = record.totalFee > 0 ? (record.paidAmount / record.totalFee) : 0;
    let categoryTotal = 0;
    if (category === 'Academic') categoryTotal = record.academicFee;
    else if (category === 'Hostel') categoryTotal = record.hostelFee;
    else if (category === 'Mess') categoryTotal = record.messFee;
    else categoryTotal = record.otherCharges;

    const categoryPaid = categoryTotal * totalPaidRatio;
    return Math.max(0, Math.round(categoryTotal - categoryPaid));
  };

  const content = (
    <>
      {/* Overview Dashboard Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Fee Invoice Summary Card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-800">Fee Statement Summary</h2>
              <p className="text-[10px] text-gray-400">Roll No: {record.rollNo} • Program: {record.program}</p>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
              record.feeStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
              record.feeStatus === 'partial' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              record.feeStatus === 'overdue' ? 'bg-red-50 text-red-700 border-red-200' :
              'bg-gray-100 text-gray-600 border-gray-200'
            }`}>
              {record.feeStatus}
            </span>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded border border-gray-100">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Academic Fee</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{formatINR(record.academicFee)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded border border-gray-100">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Hostel Fee</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{formatINR(record.hostelFee)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded border border-gray-100">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Mess Fee</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{formatINR(record.messFee)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded border border-gray-100">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Other Charges</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{formatINR(record.otherCharges)}</p>
            </div>
          </div>

          {/* Big Totals */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div>
              <p className="text-[10px] text-gray-400">Total Invoice</p>
              <p className="text-lg font-black text-gray-900">{formatINR(record.totalFee)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Amount Paid</p>
              <p className="text-lg font-black text-emerald-600">{formatINR(record.paidAmount)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Total Due</p>
              <p className={`text-lg font-black ${record.dueAmount > 0 ? 'text-red-600 animate-pulse' : 'text-gray-400'}`}>
                {formatINR(record.dueAmount)}
              </p>
            </div>
          </div>

          {/* Payment Plan & Progress Info */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span>Payment Plan: <span className="font-semibold text-gray-700 capitalize">{record.paymentPlan}</span></span>
            </div>
            <span>Last payment synced: <span className="font-semibold text-gray-700">{record.lastPaymentDate}</span></span>
          </div>
        </div>

        {/* Payment Submission Portal */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6">
          <div className="border-b border-gray-100 pb-3 mb-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              <span>Make Fee Payment</span>
            </h2>
            <p className="text-[10px] text-gray-400">Select payment details to proceed</p>
          </div>

          {record.dueAmount === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-gray-500 gap-2">
              <ShieldCheck className="h-10 w-10 text-emerald-500" />
              <p className="font-semibold text-emerald-600">All Fees Paid</p>
              <p>Your ledger shows zero dues. Keep up the good work!</p>
            </div>
          ) : (
            <form onSubmit={handlePayFee} className="space-y-4 text-xs">
              {/* Category Selector */}
              <div className="space-y-1">
                <label className="font-semibold text-gray-600">Fee Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full h-9 rounded border border-gray-200 bg-white px-2 focus:outline-none focus:border-indigo-600"
                >
                  <option value="Academic">Academic Tuition Fee</option>
                  <option value="Hostel">Hostel Accommodation Fee</option>
                  <option value="Mess">Mess Catering Fee</option>
                  <option value="Other">Other Miscellaneous Charges</option>
                </select>
              </div>

              {/* Amount input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-gray-600">Payment Amount (INR)</label>
                  <button 
                    type="button"
                    onClick={() => setAmount(String(getCategoryDue()))}
                    className="text-[10px] font-bold text-indigo-600 hover:underline"
                  >
                    Pay Category Due ({formatINR(getCategoryDue())})
                  </button>
                </div>
                <input 
                  type="number"
                  placeholder="Enter amount to pay..."
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-9 rounded border border-gray-200 bg-white px-3 focus:outline-none focus:border-indigo-600"
                  max={record.dueAmount}
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <label className="font-semibold text-gray-600">Payment Gateway / Method</label>
                <select 
                  value={method} 
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="w-full h-9 rounded border border-gray-200 bg-white px-2 focus:outline-none focus:border-indigo-600"
                >
                  <option value="UPI">UPI (GooglePay, PhonePe, Paytm)</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="NEFT">NEFT Bank Transfer</option>
                  <option value="RTGS">RTGS Bank Transfer</option>
                </select>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={paying}
                className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
              >
                {paying ? (
                  <span>Processing Secure Payment...</span>
                ) : (
                  <>
                    <span>Submit Payment</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Transaction History ledger */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6">
        <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
              <Receipt className="h-5 w-5 text-indigo-600" />
              <span>Personal Transaction History</span>
            </h2>
            <p className="text-[10px] text-gray-400">Your recent payments and bank statements</p>
          </div>
          <button 
            onClick={() => toast.success('Downloading fee payment slip...')}
            className="h-8 px-2.5 rounded border border-gray-200 text-xs font-semibold hover:bg-gray-50 transition"
          >
            Download Slip
          </button>
        </div>

        <div className="overflow-x-auto">
          {history.length === 0 ? (
            <div className="text-center text-xs text-gray-400 py-6">
              No recent payments recorded on this account.
            </div>
          ) : (
            <table className="w-full text-xs text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase">
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map(txn => {
                  const isRefund = txn.type === 'refund';
                  return (
                    <tr key={txn._id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600">{txn.id}</td>
                      <td className="px-4 py-3 text-gray-500">{txn.date} • {txn.time}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          {txn.feeCategory}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-600 flex items-center gap-1">
                        {txn.method === 'UPI' ? <Smartphone className="h-3.5 w-3.5" /> : <Landmark className="h-3.5 w-3.5" />}
                        <span>{txn.method}</span>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${isRefund ? 'text-red-600' : 'text-emerald-600'}`}>
                        {isRefund ? '-' : '+'}{formatINR(txn.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                          <CheckCircle className="h-3 w-3 text-emerald-500" />
                          <span>{txn.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );

  if (embedMode) {
    return <div className="space-y-6">{content}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Fee Portal</h1>
        <p className="text-xs text-gray-500">View statement of accounts and submit secure academic fee payments</p>
      </div>

      {content}
    </div>
  );
}
