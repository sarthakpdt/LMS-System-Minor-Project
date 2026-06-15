export interface StudentAccount {
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
  scholarship?: Scholarship;
}

export interface Payment {
  _id: string;
  id: string; // TXNXXXXXXXX
  studentName: string;
  rollNo: string;
  program: string;
  type: 'payment' | 'refund';
  feeCategory: 'Academic' | 'Hostel' | 'Mess' | 'Other';
  amount: number;
  method: 'UPI' | 'NEFT' | 'RTGS' | 'Card' | 'Cash';
  date: string;
  time: string;
  status: 'Pending' | 'Payment Submitted' | 'Under Verification' | 'Paid' | 'Rejected' | 'completed' | 'processing';
  referenceNumber?: string;
  createdAt?: string;
}

export interface Receipt {
  receiptNumber: string;
  studentName: string;
  rollNo: string;
  amountPaid: number;
  paymentMethod: string;
  date: string;
  transactionId: string;
  collegeName: string;
}

export interface Scholarship {
  id: string;
  name: string;
  amount: number;
  type: 'merit' | 'need-based' | 'sports' | 'other';
  status: 'active' | 'applied' | 'inactive';
}
