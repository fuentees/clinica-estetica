export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'cash' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';

export interface Payment {
  id: string;
  appointment_id: string;
  patient_id: string; // Adicionado para facilitar relatórios por paciente sem precisar do appointment
  amount: number;
  discount_amount?: number; // Adicionado: Útil para promoções e fechamentos de pacotes
  final_amount: number; // Valor após descontos
  payment_method: PaymentMethod;
  installments: number;
  status: PaymentStatus;
  due_date: string;
  paid_at: string | null;
  transaction_id?: string; // Adicionado: Para vincular ao comprovante do banco/maquininha
  notes?: string;
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

/**
 * Interface para facilitar o Dashboard Financeiro
 */
export interface FinancialSummary {
  total_revenue: number;
  total_paid: number;
  total_pending: number;
  total_overdue: number;
  period: {
    start: string;
    end: string;
  };
}