import React from "react";
import { ClinicalRecord } from "../types/clinical";

interface PrintableViewProps {
  patientName: string;
  records: ClinicalRecord[];
}

export function PrintableView({ patientName, records }: PrintableViewProps) {
  return (
    <div id="printable-content" className="hidden p-8 bg-white text-black">
      <h1 className="text-2xl font-bold mb-4 border-b border-black pb-2">
        Prontuário Médico - {patientName}
      </h1>
      <div className="space-y-6">
        {records.filter(r => !r.deleted_at).map(r => (
          <div key={r.id} className="border-b border-gray-300 pb-4 mb-4">
            <div className="flex justify-between items-center mb-2">
                <p className="font-bold text-lg">{new Date(r.date).toLocaleDateString()} - {r.subject}</p>
                <span className="text-xs text-gray-500">Prof: {r.profiles?.first_name}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{r.description}</p>
            
            {r.attachments.usedProducts && r.attachments.usedProducts.length > 0 && (
                <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                   <strong>Rastreabilidade:</strong> {r.attachments.usedProducts.map(p => `${p.name} (L: ${p.batch})`).join(', ')}
                </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-8 pt-8 border-t-2 border-black text-center text-xs">
          <p>Documento gerado eletronicamente pelo Sistema VILAGI.</p>
          <p>{new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}