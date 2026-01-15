// src/pages/patients/utils/printStyles.ts
export const printStyles = `
  @media print {
    body * { visibility: hidden; }
    #printable-content, #printable-content * { visibility: visible; }
    #printable-content { position: absolute; left: 0; top: 0; width: 100%; }
    .no-print { display: none !important; }
  }
`;