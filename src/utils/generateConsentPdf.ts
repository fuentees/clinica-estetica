import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const generateConsentPdf = async (
  clinicData: any,
  patientData: any,
  termData: {
    content: string;
    signature: string | null;
    signedAt: string;
    title: string;
    ip?: string;
    hash?: string;
  }
) => {
  const doc = new jsPDF();
  
  // --- CONFIGURAÇÕES VISUAIS ---
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = 20;

  // 1. CABEÇALHO (Logo e Dados da Clínica)
  if (clinicData?.logo_url) {
    try {
      const img = new Image();
      img.src = clinicData.logo_url;
      // Espera carregar (simples) ou usa direto se já estiver em cache
      doc.addImage(img, "PNG", margin, yPos, 25, 25);
    } catch (e) {
      console.warn("Erro ao carregar logo", e);
    }
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(clinicData?.name || "Clínica", pageWidth / 2, yPos + 10, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(clinicData?.address || "", pageWidth / 2, yPos + 16, { align: "center" });
  doc.text(`Tel: ${clinicData?.phone || ""}`, pageWidth / 2, yPos + 21, { align: "center" });

  yPos += 40;

  // 2. TÍTULO DO DOCUMENTO
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(termData.title.toUpperCase(), pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // 3. IDENTIFICAÇÃO DO PACIENTE
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Paciente: ${patientData.name}`, margin, yPos);
  doc.text(`CPF: ${patientData.cpf || "Não informado"}`, margin + 100, yPos);
  yPos += 10;

  // 4. CONTEÚDO DO TERMO (Texto Justificado)
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Quebra o texto para caber na página
  const splitText = doc.splitTextToSize(termData.content, contentWidth);
  
  // Se o texto for muito grande, cria novas páginas
  if (yPos + splitText.length * 5 > pageHeight - 60) {
      doc.text(splitText, margin, yPos);
      doc.addPage();
      yPos = 20; 
  } else {
      doc.text(splitText, margin, yPos);
      yPos += (splitText.length * 5) + 20;
  }

  // Se estiver muito no final da página, pula para a próxima para a assinatura não ficar cortada
  if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 40;
  }

  // 5. ÁREA DE ASSINATURA
  yPos += 10;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("Documento assinado digitalmente", pageWidth / 2, yPos, { align: "center" });
  yPos += 5;

  if (termData.signature) {
    try {
      doc.addImage(termData.signature, "PNG", (pageWidth / 2) - 30, yPos, 60, 30);
      yPos += 30;
    } catch (e) {
      doc.text("[Erro na imagem da assinatura]", pageWidth / 2, yPos + 10, { align: "center" });
      yPos += 20;
    }
  } else {
      yPos += 30; // Espaço vazio se não tiver img
  }

  doc.setLineWidth(0.2);
  doc.line((pageWidth / 2) - 40, yPos, (pageWidth / 2) + 40, yPos);
  yPos += 5;
  
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(patientData.name, pageWidth / 2, yPos, { align: "center" });
  
  // 6. RODAPÉ DE AUDITORIA (Jurídico)
  const auditY = pageHeight - 20;
  doc.setFontSize(7);
  doc.setTextColor(150);
  
  const dateStr = format(new Date(termData.signedAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  
  doc.text(`Hash de Integridade: ${termData.hash || "N/A"}`, margin, auditY);
  doc.text(`Data da Assinatura: ${dateStr}`, margin, auditY + 4);
  doc.text(`Endereço IP: ${termData.ip || "Não registrado"}`, margin, auditY + 8);
  doc.text("Gerado pelo Sistema Seguro da Clínica", pageWidth - margin, auditY + 8, { align: "right" });

  // Salva o arquivo
  doc.save(`Termo_${patientData.name.split(' ')[0]}_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
};