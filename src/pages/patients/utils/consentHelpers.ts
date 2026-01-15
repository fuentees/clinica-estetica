export const formatTemplateContent = (content: string, vars: Record<string, string>) => {
  let formatted = content;
  Object.entries(vars).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    formatted = formatted.replace(regex, value);
  });
  return formatted;
};

export const generateConsentSignLink = (patientId: string, procedure: string) => {
  const origin = window.location.origin;
  return `${origin}/sign?p=${patientId}&proc=${encodeURIComponent(procedure)}`;
};

export const generateQrCodeUrl = (link: string) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`;
};

export const CONSENT_PRINT_STYLES = `
  @media print {
    body * { visibility: hidden; }
    #consent-content, #consent-content * { visibility: visible; }
    #consent-content { 
      position: absolute; left: 0; top: 0; width: 100%; 
      padding: 0; margin: 0; visibility: visible !important; 
    }
    .overflow-y-auto { overflow: visible !important; height: auto !important; }
    .no-print { display: none !important; }
    .modal-overlay { background: white !important; }
    .rounded-[3rem], .border-[8px] { border: none !important; border-radius: 0 !important; }
  }
`;