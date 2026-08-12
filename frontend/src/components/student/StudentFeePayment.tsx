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
  Receipt,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { StudentAccount, Payment } from '../../types/accounts';

type FeeRecord = StudentAccount;
type TransactionRecord = Payment;

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
  const studentId = user?.studentId;

  const [record, setRecord] = useState<FeeRecord | null>(null);
  const [history, setHistory] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestSuccessfulTxn, setLatestSuccessfulTxn] = useState<TransactionRecord | null>(null);

  // Form State
  const [category, setCategory] = useState<'Academic' | 'Hostel' | 'Mess' | 'Other'>('Academic');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'UPI' | 'NEFT' | 'RTGS' | 'Card' | 'Razorpay'>('Razorpay');
  const [paying, setPaying] = useState(false);

  // QR and Verification Workflow States
  const [showUPIWorkflow, setShowUPIWorkflow] = useState(false);
  const [showBankTransferWorkflow, setShowBankTransferWorkflow] = useState(false);
  const [showCardWorkflow, setShowCardWorkflow] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');

  // Card details states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');

  const fetchFeeData = async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }
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

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePayFeeWithParams = async (overrideRef?: string) => {
    if (!record) return;
    const payAmt = Number(amount);
    const ref = overrideRef || referenceNumber || `REF-${Date.now().toString().slice(-6)}`;
    try {
      setPaying(true);
      const res = await fetch('http://localhost:5000/api/student/pay-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: record.studentId,
          category,
          amount: payAmt,
          method,
          referenceNumber: ref
        })
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Payment of ${formatINR(payAmt)} submitted successfully!`, {
          description: `Status: Under Verification • Reference: ${ref}`
        });
        setAmount('');
        setReferenceNumber('');
        setShowUPIWorkflow(false);
        setShowBankTransferWorkflow(false);
        setShowCardWorkflow(false);
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

  const handleRazorpayPayment = async () => {
    if (!record) return;
    const payAmt = Number(amount);
    try {
      setPaying(true);
      
      const res = await fetch('http://localhost:5000/api/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: record.studentId,
          amount: payAmt,
          feeCategory: category
        })
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || 'Failed to initialize payment gateway.');
        return;
      }
      
      const { order, key_id } = data;
      
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'EduTrack LMS',
        description: `${category} Fee Payment`,
        order_id: order.id,
        handler: async function (response: any) {
          const verifyToastId = toast.loading('Verifying payment signature...');
          try {
            setPaying(true);
            const verifyRes = await fetch('http://localhost:5000/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              setLatestSuccessfulTxn(verifyData.transaction);
              toast.success(`Payment of ${formatINR(payAmt)} successful and verified!`, {
                id: verifyToastId,
                description: `Transaction ID: ${verifyData.transaction.id}`,
                action: {
                  label: 'Download Receipt',
                  onClick: () => generatePDFReceipt(verifyData.transaction)
                }
              });
              // Auto-download receipt
              generatePDFReceipt(verifyData.transaction);
              setAmount('');
              fetchFeeData(); // Refresh history
            } else {
              toast.error(verifyData.message || 'Signature verification failed.', { id: verifyToastId });
            }
          } catch (err) {
            console.error(err);
            toast.error('Error verifying payment.', { id: verifyToastId });
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: record.name,
          email: user?.email || '',
        },
        theme: {
          color: '#4f46e5'
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
            toast.info('Payment window closed.');
          }
        }
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error('Failed to contact payment server.');
    } finally {
      setPaying(false);
    }
  };

  const generatePDFReceipt = (txn: TransactionRecord) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header Banner
      doc.setFillColor(79, 70, 229); // Indigo-600
      doc.rect(0, 0, 210, 40, 'F');

      // College Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('EDUTRACK ENGINEERING COLLEGE', 15, 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Academic Fee Payment Receipt', 15, 28);
      doc.text('ERP Finance & Accounts Division', 15, 33);

      // Receipt details column 1
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('RECEIPT INFORMATION', 15, 52);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Receipt Number: REC-${txn.id.slice(-6).toUpperCase()}`, 15, 60);
      doc.text(`Transaction ID: ${txn.id}`, 15, 66);
      doc.text(`Date & Time: ${txn.date} ${txn.time}`, 15, 72);
      doc.text(`Payment Method: ${txn.method}`, 15, 78);

      const displayStatus = txn.status === 'completed' || txn.status === 'Paid' ? 'PAID' : 
                            txn.status === 'Rejected' ? 'REJECTED' : 'UNDER VERIFICATION';
      doc.setFont('helvetica', 'bold');
      doc.text(`Status: ${displayStatus}`, 15, 84);

      // Student details column 2
      doc.setFont('helvetica', 'bold');
      doc.text('STUDENT INFORMATION', 120, 52);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Student Name: ${txn.studentName}`, 120, 60);
      doc.text(`Roll Number: ${txn.rollNo}`, 120, 66);
      doc.text(`Program: ${txn.program}`, 120, 72);
      doc.text(`UTR / Reference: ${txn.referenceNumber || '-'}`, 120, 78);

      // Line separator
      doc.setDrawColor(220, 220, 220);
      doc.line(15, 92, 195, 92);

      // Table Header
      doc.setFillColor(243, 244, 246); // Gray-100
      doc.rect(15, 100, 180, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Fee Category Description', 18, 105);
      doc.text('Amount (INR)', 160, 105);

      // Table Row
      doc.setFont('helvetica', 'normal');
      doc.text(`${txn.feeCategory} Fee Payment`, 18, 115);
      doc.text(formatINR(txn.amount), 160, 115);

      // Table Footer
      doc.line(15, 122, 195, 122);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Amount Received', 18, 130);
      doc.text(formatINR(txn.amount), 160, 130);

      // Verification Watermark if status is verification pending
      if (displayStatus === 'UNDER VERIFICATION') {
        doc.setTextColor(245, 158, 11, 0.15); // amber-500 with low opacity
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('VERIFICATION PENDING', 40, 150, { angle: 25 });
      }

      // Notes
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('Notes:', 15, 160);
      doc.text('1. This receipt is automatically generated and serves as confirmation of payment submission.', 15, 165);
      doc.text('2. Payments are subject to verification by the administration. Status will update in your portal.', 15, 169);
      doc.text('3. For any discrepancies, please contact the college finance counter with the Transaction ID.', 15, 173);

      // Signatures
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.line(140, 205, 195, 205);
      doc.text('Authorized Accounts Officer', 142, 210);
      doc.text('EduTrack ERP Finance', 142, 214);

      // Save PDF
      const dateObj = txn.createdAt ? new Date(txn.createdAt) : new Date();
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      const formattedDateForFile = `${day}-${month}-${year}`;
      doc.save(`Receipt_${txn.rollNo}_${formattedDateForFile}.pdf`);
      toast.success('Professional PDF Receipt downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF receipt.');
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
      {latestSuccessfulTxn && (
        <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-500 text-white rounded-full">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-emerald-300 text-sm sm:text-base">Payment Verified Successfully!</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Your payment of <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatINR(latestSuccessfulTxn.amount)}</span> for <span className="font-semibold">{latestSuccessfulTxn.feeCategory} Fee</span> has been processed. Transaction ID: <span className="font-mono font-bold">{latestSuccessfulTxn.id}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => generatePDFReceipt(latestSuccessfulTxn)}
              className="flex-1 sm:flex-initial h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 text-xs"
            >
              <Receipt className="h-4 w-4" />
              <span>Download Receipt</span>
            </button>
            <button
              onClick={() => setLatestSuccessfulTxn(null)}
              className="p-2 text-gray-400 hover:text-gray-650 hover:bg-gray-105 dark:hover:bg-slate-800 rounded-lg transition animate-none"
              title="Dismiss"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

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

          {record.scholarship && record.scholarship.amount > 0 && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-350">
              <span className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Scholarship Applied: <strong>{record.scholarship.name}</strong></span>
              </span>
              <span className="font-black text-sm">-{formatINR(record.scholarship.amount)}</span>
            </div>
          )}

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

            {showUPIWorkflow ? (
              <div className="space-y-4 text-xs bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
                  <span className="font-bold text-gray-800 dark:text-slate-200">UPI QR Code Payment</span>
                  <span className="text-[10px] text-gray-400">Scan &amp; Pay</span>
                </div>
                <div className="flex flex-col items-center justify-center space-y-2 py-2">
                  {/* Dynamic QR Code */}
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=college@upi&pn=EduTrack%20LMS&am=${amount}&tn=Fee%20Payment`)}`}
                    alt="UPI QR Code"
                    className="w-36 h-36 border border-gray-200 rounded p-1 bg-white"
                  />
                  <div className="text-center">
                    <p className="font-bold text-base text-gray-900 dark:text-slate-100">{formatINR(Number(amount))}</p>
                    <p className="text-[10px] text-gray-400">UPI ID: <span className="font-mono text-gray-700 dark:text-slate-300 font-semibold">college@upi</span></p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300 rounded text-[11px] leading-relaxed">
                    <p><strong>Student Name:</strong> {record.name}</p>
                    <p><strong>Roll Number:</strong> {record.rollNo}</p>
                    <p><strong>Payment Reference:</strong> REF-{Date.now().toString().slice(-6)}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-600 dark:text-slate-300">Enter UPI Transaction Reference Number (12 Digits)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 123456789012"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="w-full h-9 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:border-indigo-600 text-gray-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowUPIWorkflow(false);
                        setReferenceNumber('');
                      }}
                      className="flex-1 h-9 rounded border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 font-semibold transition text-center text-gray-700 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      disabled={paying}
                      onClick={async () => {
                        if (!referenceNumber.trim()) {
                          toast.error('Please enter the UPI Transaction Reference Number.');
                          return;
                        }
                        await handlePayFeeWithParams();
                      }}
                      className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold transition"
                    >
                      {paying ? 'Submitting...' : 'I Have Paid'}
                    </button>
                  </div>
                </div>
              </div>
            ) : showBankTransferWorkflow ? (
              <div className="space-y-4 text-xs bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
                  <span className="font-bold text-gray-800 dark:text-slate-200">NEFT / RTGS Transfer Details</span>
                  <span className="text-[10px] text-gray-400">Official Bank Account</span>
                </div>
                <div className="p-2.5 bg-gray-100 dark:bg-slate-800 rounded space-y-1.5 font-mono text-[11px] text-gray-700 dark:text-slate-300">
                  <p><strong>Beneficiary:</strong> EduTrack Engineering College</p>
                  <p><strong>Bank Name:</strong> State Bank of India</p>
                  <p><strong>Account No:</strong> 123456789012</p>
                  <p><strong>IFSC Code:</strong> SBIN0001234</p>
                  <p><strong>Branch:</strong> IIT Campus, New Delhi</p>
                </div>
                <div className="space-y-3">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300 rounded text-[11px]">
                    <p><strong>Amount to Transfer:</strong> {formatINR(Number(amount))}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-600 dark:text-slate-300">Enter Bank UTR / Reference ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. UTRN123456789"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="w-full h-9 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:border-indigo-600 text-gray-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowBankTransferWorkflow(false);
                        setReferenceNumber('');
                      }}
                      className="flex-1 h-9 rounded border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 font-semibold transition text-center text-gray-700 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      disabled={paying}
                      onClick={async () => {
                        if (!referenceNumber.trim()) {
                          toast.error('Please enter the Bank UTR Reference.');
                          return;
                        }
                        await handlePayFeeWithParams();
                      }}
                      className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold transition"
                    >
                      {paying ? 'Submitting...' : 'I Have Paid'}
                    </button>
                  </div>
                </div>
              </div>
            ) : showCardWorkflow ? (
              <div className="space-y-4 text-xs bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
                  <span className="font-bold text-gray-800 dark:text-slate-200">Credit / Debit Card payment</span>
                  <span className="text-[10px] text-gray-400">Secure Checkout</span>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-600 dark:text-slate-300">Cardholder Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter full name on card..."
                      className="w-full h-9 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:border-indigo-600 text-gray-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-600 dark:text-slate-300">Card Number</label>
                    <input 
                      type="text" 
                      maxLength={19}
                      placeholder="xxxx xxxx xxxx xxxx"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                      className="w-full h-9 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:border-indigo-600 text-gray-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-600 dark:text-slate-300">Expiry Date</label>
                      <input 
                        type="text" 
                        maxLength={5}
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full h-9 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:border-indigo-600 text-gray-800 dark:text-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-600 dark:text-slate-300">CVV</label>
                      <input 
                        type="password" 
                        maxLength={3}
                        placeholder="***"
                        value={cardCVV}
                        onChange={(e) => setCardCVV(e.target.value)}
                        className="w-full h-9 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:border-indigo-600 text-gray-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowCardWorkflow(false);
                      }}
                      className="flex-1 h-9 rounded border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 font-semibold transition text-center text-gray-700 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      disabled={paying}
                      onClick={async () => {
                        if (!cardNumber || !cardExpiry || !cardCVV) {
                          toast.error('Please fill in all card details.');
                          return;
                        }
                        await handlePayFeeWithParams('Online Card Gateway Payment');
                      }}
                      className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold transition"
                    >
                      {paying ? 'Processing...' : `Pay ${formatINR(Number(amount))}`}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const payAmt = Number(amount);
                  if (!amount || payAmt <= 0) {
                    toast.error('Please enter a valid amount.');
                    return;
                  }
                  if (payAmt > record.dueAmount) {
                    toast.error(`Amount exceeds current total due of ${formatINR(record.dueAmount)}`);
                    return;
                  }
                  if (method === 'Razorpay') {
                    handleRazorpayPayment();
                  } else if (method === 'UPI') {
                    setShowUPIWorkflow(true);
                  } else if (method === 'NEFT' || method === 'RTGS') {
                    setShowBankTransferWorkflow(true);
                  } else if (method === 'Card') {
                    setShowCardWorkflow(true);
                  }
                }} 
                className="space-y-4 text-xs"
              >
                {/* Category Selector */}
                <div className="space-y-1">
                  <label className="font-semibold text-gray-600 dark:text-slate-300">Fee Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full h-9 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 focus:outline-none focus:border-indigo-600 text-gray-850 dark:text-slate-200"
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
                    <label className="font-semibold text-gray-600 dark:text-slate-300">Payment Amount (INR)</label>
                    <button 
                      type="button"
                      onClick={() => setAmount(String(getCategoryDue()))}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Pay Category Due ({formatINR(getCategoryDue())})
                    </button>
                  </div>
                  <input 
                    type="number"
                    placeholder="Enter amount to pay..."
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-9 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:border-indigo-600 text-gray-850 dark:text-slate-200"
                    max={record.dueAmount}
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-1">
                  <label className="font-semibold text-gray-600 dark:text-slate-300">Payment Gateway / Method</label>
                  <select 
                    value={method} 
                    onChange={(e) => setMethod(e.target.value as any)}
                    className="w-full h-9 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 focus:outline-none focus:border-indigo-600 text-gray-850 dark:text-slate-200"
                  >
                    <option value="Razorpay">Online Payment (Instant Gateway via Razorpay)</option>
                    <option value="UPI">UPI (Manual - GooglePay, PhonePe, Paytm)</option>
                    <option value="Card">Debit / Credit Card (Manual Approval)</option>
                    <option value="NEFT">NEFT Bank Transfer (Manual Approval)</option>
                    <option value="RTGS">RTGS Bank Transfer (Manual Approval)</option>
                  </select>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit"
                  disabled={paying}
                  className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
                >
                  <span>{method === 'Razorpay' ? 'Pay Now' : 'Proceed to Payment'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Transaction History ledger */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-md p-6">
          <div className="border-b border-gray-100 dark:border-slate-700 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <Receipt className="h-5 w-5 text-indigo-600" />
                <span>Personal Transaction History</span>
              </h2>
              <p className="text-[10px] text-gray-400 dark:text-slate-400">Your recent payments and bank statements</p>
            </div>
            <button 
              onClick={() => {
                if (history.length > 0) {
                  generatePDFReceipt(history[0]);
                } else {
                  toast.error("No transactions available to generate receipt.");
                }
              }}
              className="h-8 px-2.5 rounded border border-gray-200 dark:border-slate-700 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition text-gray-700 dark:text-slate-300"
            >
              Download Latest Receipt
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
                  <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase">
                    <th className="px-4 py-3">Transaction ID</th>
                    <th className="px-4 py-3">Reference / UTR</th>
                    <th className="px-4 py-3">Date &amp; Time</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Payment Method</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                  {history.map(txn => {
                    const isRefund = txn.type === 'refund';
                    
                    // Dynamic status icon and styling
                    let StatusIcon = HelpCircle;
                    let statusColor = "text-gray-500 bg-gray-100 dark:bg-slate-700/50";
                    
                    if (txn.status === 'Paid' || txn.status === 'completed') {
                      StatusIcon = CheckCircle;
                      statusColor = "text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400";
                    } else if (txn.status === 'Under Verification' || txn.status === 'processing' || txn.status === 'Payment Submitted') {
                      StatusIcon = Clock;
                      statusColor = "text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400";
                    } else if (txn.status === 'Rejected') {
                      StatusIcon = XCircle;
                      statusColor = "text-red-650 bg-red-50 dark:bg-red-950/20 dark:text-red-400";
                    }

                    return (
                      <tr key={txn._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition text-gray-850 dark:text-slate-300">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{txn.id}</td>
                        <td className="px-4 py-3 font-mono text-gray-655 dark:text-slate-450">{txn.referenceNumber || '-'}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{txn.date} • {txn.time}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300">
                            {txn.feeCategory}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-655 dark:text-slate-350 flex items-center gap-1 mt-1.5 border-none">
                          {txn.method === 'UPI' ? <Smartphone className="h-3.5 w-3.5" /> : <Landmark className="h-3.5 w-3.5" />}
                          <span>{txn.method}</span>
                        </td>
                        <td className={`px-4 py-3 text-right font-bold ${isRefund ? 'text-red-650' : 'text-emerald-600 dark:text-emerald-450'}`}>
                          {isRefund ? '-' : '+'}{formatINR(txn.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
                            <StatusIcon className="h-3 w-3" />
                            <span>{txn.status}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => generatePDFReceipt(txn)}
                            className="p-1 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-indigo-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-400 transition inline-flex items-center gap-1 text-[10px]"
                            title="Download PDF Receipt"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                            <span>PDF</span>
                          </button>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-6 space-y-6 text-gray-900 dark:text-slate-100 transition-colors duration-250">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Student Fee Portal</h1>
            <p className="text-xs text-gray-500 dark:text-slate-450">View statement of accounts and submit secure academic fee payments</p>
          </div>
        </div>

        {content}
      </div>
    );
  }
