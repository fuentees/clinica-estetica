import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { supabase } from '../../../lib/supabase';
import QRCode from 'qrcode';

interface PaymentQRCodeProps {
  paymentId: string;
  onClose: () => void;
}

export function PaymentQRCode({ paymentId, onClose }: PaymentQRCodeProps) {
  const [qrCode, setQRCode] = useState<string>('');
  const [copyText, setCopyText] = useState('Copiar');

  useEffect(() => {
    async function generateQRCode() {
      try {
        const { data: payment } = await supabase
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .single();

        if (payment) {
          const pixData = {
            paymentId: payment.id,
            amount: payment.amount,
            description: `Pagamento #${payment.id}`,
          };

          const qrCodeData = await QRCode.toDataURL(JSON.stringify(pixData));
          setQRCode(qrCodeData);
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }

    generateQRCode();
  }, [paymentId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentId);
    setCopyText('Copiado!');
    setTimeout(() => setCopyText('Copiar'), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">QR Code PIX</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-center">
            {qrCode && (
              <img
                src={qrCode}
                alt="QR Code PIX"
                className="w-64 h-64"
              />
            )}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Escaneie o QR Code acima com seu aplicativo de pagamento
            </p>
            <Button size="sm" onClick={handleCopy}>
              {copyText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}