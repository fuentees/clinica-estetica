import jsPDF from "jspdf";

// ============================================================================
// 1. TEXTO JURÍDICO
// ============================================================================
const TERMO_JURIDICO_COMPLETO = `
TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO & DECLARAÇÃO DE SAÚDE

1. IDENTIFICAÇÃO E VERACIDADE: O(A) paciente declara que todas as informações fornecidas são verdadeiras.
2. CONSENTIMENTO INFORMADO: Declaro ter recebido informações sobre riscos e benefícios.
3. RESULTADOS: Declaro estar ciente de que a estética não é uma ciência exata.
4. LGPD: Autorizo o armazenamento de dados e imagens para fins de prontuário clínico.
`;

interface PatientData {
  id?: string;
  nome?: string;
  first_name?: string;
  last_name?: string;
  cpf?: string;
  date_of_birth?: string;
  [key: string]: any;
}

// ✅ Exportação direta na função para evitar erro "Cannot find name"
export const generateAnamnesisPdf = (
  patientData: PatientData, 
  anamnesisData: any,       
  signatureBase64: string | null
) => {
  const doc = new jsPDF();
  const marginLeft = 20;
  const pageWidth = 210;
  const contentWidth = pageWidth - (marginLeft * 2);
  let cursorY = 20;

  // --- CONFIGURAÇÃO DE ESTILO ---
  const colorPrimary = [180, 50, 80]; 
  const colorDark = [40, 40, 40];

  // --- HELPERS ---
  const checkPageBreak = (needed: number) => {
    if (cursorY + needed > 280) {
      doc.addPage();
      cursorY = 20;
    }
  };

  const formatVal = (v: any) => {
    if (v === true || v === "true") return "SIM";
    if (v === false || v === "false") return "NÃO";
    return v ? String(v).toUpperCase() : "---";
  };

  // --- CONSTRUÇÃO ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.text("PRONTUÁRIO E TERMO DE CONSENTIMENTO", marginLeft, cursorY);
  
  cursorY += 15;
  doc.setFontSize(10);
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);

  // Dados do Paciente
  const nomeCompleto = patientData.first_name 
    ? `${patientData.first_name} ${patientData.last_name || ''}` 
    : patientData.nome || "PACIENTE NÃO IDENTIFICADO";

  doc.text(`PACIENTE: ${nomeCompleto.toUpperCase()}`, marginLeft, cursorY);
  cursorY += 7;
  doc.text(`CPF: ${patientData.cpf || '---'}`, marginLeft, cursorY);
  cursorY += 15;

  // Seção de Anamnese
  doc.setFont("helvetica", "bold");
  doc.text("RESUMO DA ANAMNESE:", marginLeft, cursorY);
  cursorY += 7;
  doc.setFont("helvetica", "normal");
  
  const queixas = Array.isArray(anamnesisData.queixa_principal) 
    ? anamnesisData.queixa_principal.join(", ") 
    : "NÃO INFORMADO";
    
  doc.text(`QUEIXAS: ${queixas.toUpperCase()}`, marginLeft, cursorY);
  cursorY += 10;

  // Termo Jurídico
  checkPageBreak(60);
  doc.setFont("helvetica", "bold");
  doc.text("DECLARAÇÃO JURÍDICA:", marginLeft, cursorY);
  cursorY += 7;
  doc.setFontSize(8);
  const splitText = doc.splitTextToSize(TERMO_JURIDICO_COMPLETO.trim(), contentWidth);
  doc.text(splitText, marginLeft, cursorY);
  cursorY += (splitText.length * 4) + 10;

  // Assinatura
  checkPageBreak(50);
  if (signatureBase64) {
    doc.addImage(signatureBase64, "PNG", marginLeft, cursorY, 50, 20);
    cursorY += 22;
  } else {
    doc.setTextColor(200, 0, 0);
    doc.text("ASSINATURA PENDENTE", marginLeft, cursorY);
    cursorY += 10;
  }

  doc.setDrawColor(200);
  doc.line(marginLeft, cursorY, marginLeft + 80, cursorY);
  cursorY += 5;
  doc.setTextColor(0);
  doc.text(nomeCompleto.toUpperCase(), marginLeft, cursorY);

  // Salvar
  doc.save(`Prontuario_${nomeCompleto.replace(/\s/g, '_')}.pdf`);
};