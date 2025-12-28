export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'cash';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Payment {
  id: string;
  appointment_id: string;
  amount: number;
  payment_method: PaymentMethod;
  installments: number;
  status: PaymentStatus;
  due_date: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentInstallment {
  id: string;
  payment_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}