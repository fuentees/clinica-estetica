import { useState, useEffect } from 'react';
import { X, Copy, CheckCircle2, QrCode, Loader2, Info } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { supabase } from '../../../lib/supabase';
import QRCode from 'qrcode';

interface PaymentQRCodeProps {
  paymentId: string;
  onClose: () => void;
}

export function PaymentQRCode({ paymentId, onClose }: PaymentQRCodeProps) {
  const [qrCode, setQRCode] = useState<string>('');
  const [copyText, setCopyText] = useState('Copiar Código PIX');
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  useEffect(() => {
    async function generateQRCode() {
      try {
        setLoading(true);
        const { data: payment, error } = await supabase
          .from('payments')
          .select('id, amount')
          .eq('id', paymentId)
          .single();

        if (error) throw error;

        if (payment) {
          setPaymentAmount(payment.amount);
          
          // Simulação de payload PIX (Aqui você integraria com sua API de Pagamentos real)
          const pixPayload = `PIX-STATIC-PAYLOAD-FOR-PAYMENT-${payment.id}-AMOUNT-${payment.amount}`;
          
          const qrCodeData = await QRCode.toDataURL(pixPayload, {
            width: 400,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });
          setQRCode(qrCodeData);
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
      } finally {
        setLoading(false);
      }
    }

    generateQRCode();
  }, [paymentId]);

  const handleCopy = () => {
    // Em um cenário real, você copiaria a linha digitável do PIX (EMV)
    navigator.clipboard.writeText(`PIX-PAYLOAD-SAMPLE-${paymentId}`);
    setCopyText('Copiado!');
    setTimeout(() => setCopyText('Copiar Código PIX'), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-300">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
              <QrCode size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Pagamento PIX</h2>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Instantâneo e Seguro</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-8 space-y-6 text-center">
          {/* QR CODE CONTAINER */}
          <div className="relative flex justify-center bg-white p-4 rounded-[2rem] border-2 border-gray-50 shadow-inner group">
            {loading ? (
              <div className="w-64 h-64 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            ) : (
              <>
                <img
                  src={qrCode}
                  alt="QR Code PIX"
                  className="w-64 h-64 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-[2px] pointer-events-none">
                   <div className="bg-white p-2 rounded-full shadow-lg">
                      <CheckCircle2 className="text-emerald-500" size={32}/>
                   </div>
                </div>
              </>
            )}
          </div>

          {/* INFO VALOR */}
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Valor a pagar</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white italic tracking-tighter">
              R$ {paymentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* AÇÕES */}
          <div className="space-y-3">
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
              Abra o app do seu banco e escolha a opção <br/>
              <span className="font-bold text-gray-700 dark:text-gray-300 italic">"Pagar via QR Code"</span>
            </p>
            
            <Button 
              onClick={handleCopy}
              className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {copyText === 'Copiado!' ? <CheckCircle2 size={16} className="text-emerald-400"/> : <Copy size={16}/>}
              {copyText}
            </Button>
            
            <div className="flex items-center gap-2 justify-center py-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              <Info size={12} className="text-blue-500" />
              O pagamento é confirmado na hora
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}