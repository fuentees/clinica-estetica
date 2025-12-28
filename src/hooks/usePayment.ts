import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { stripe } from '../lib/stripe';
import type { Payment } from '../types/payment';

export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
  });
}

export function useCreatePayment() {
  return useMutation({
    mutationFn: async ({ amount, paymentMethod, appointmentId }: {
      amount: number;
      paymentMethod: string;
      appointmentId: string;
    }) => {
      if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
        const stripeInstance = await stripe;
        if (!stripeInstance) throw new Error('Stripe not initialized');

        // Create payment intent
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, paymentMethod }),
        });

        const { clientSecret } = await response.json();

        // Confirm payment
        const result = await stripeInstance.confirmCardPayment(clientSecret);
        if (result.error) throw result.error;
      }

      // Record payment in database
      const { data, error } = await supabase
        .from('payments')
        .insert({
          appointment_id: appointmentId,
          amount,
          payment_method: paymentMethod,
          status: 'pending',
          due_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}