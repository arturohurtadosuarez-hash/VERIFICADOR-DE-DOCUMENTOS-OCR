import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuditRecord, AuditKPIs } from '../types';

/**
 * ==============================================================================
 * EXPORTACIÓN A EXCEL (.XLSX) PROFESIONAL Y CORPORATIVA CON EXCELJS
 * ==============================================================================
 */
export async function exportAuditToExcel(records: AuditRecord[], kpis: AuditKPIs): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AuditOCR Enterprise Suite';
  workbook.lastModifiedBy = 'Auditor Líder de Preservación Digital';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Paleta de colores corporativa
  const PALETTE = {
    NAVY_DARK: '0F172A',     // Header principal
    NAVY_LIGHT: '1E293B',    // Subtítulos y secciones
    SLATE_GRAY: '475569',    // Texto secundario
    BORDER_LIGHT: 'CBD5E1',  // Bordes sutiles
    BORDER_DARK: '94A3B8',
    BG_ZEBRA: 'F8FAFC',
    // Fills condicionales para estados
    RED_BG: 'FEE2E2',
    RED_TEXT: '991B1B',
    AMBER_BG: 'FEF3C7',
    AMBER_TEXT: '92400E',
    GREEN_BG: 'DCFCE7',
    GREEN_TEXT: '166534',
    GRAY_BG: 'F1F5F9',
    GRAY_TEXT: '334155'
  };

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: PALETTE.BORDER_LIGHT } },
    left: { style: 'thin', color: { argb: PALETTE.BORDER_LIGHT } },
    bottom: { style: 'thin', color: { argb: PALETTE.BORDER_LIGHT } },
    right: { style: 'thin', color: { argb: PALETTE.BORDER_LIGHT } }
  };

  // ----------------------------------------------------------------------------
  // HOJA 1: RESUMEN EJECUTIVO & SCORECARD
  // ----------------------------------------------------------------------------
  const wsKpi = workbook.addWorksheet('Resumen Ejecutivo', {
    views: [{ showGridLines: true }]
  });

  // Título Principal
  wsKpi.mergeCells('A1:G1');
  const titleCell = wsKpi.getCell('A1');
  titleCell.value = 'INFORME EJECUTIVO DE AUDITORÍA FORENSE OCR Y CALIDAD DOCUMENTAL';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.NAVY_DARK } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsKpi.getRow(1).height = 40;

  // Subtítulo y Metadatos
  wsKpi.mergeCells('A2:G2');
  const subCell = wsKpi.getCell('A2');
  subCell.value = `Expediente de Calidad ISO 32000-1 | Fecha de Dictamen: ${new Date().toLocaleString()} | Motor: PyMuPDF 1.23.26`;
  subCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'E2E8F0' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.NAVY_LIGHT } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsKpi.getRow(2).height = 20;

  // Separador
  wsKpi.addRow([]);

  // Cuadrícula de KPIs Principales (Tarjetas estilizadas)
  const isHealthy = kpis.pct_cumplimiento >= 80;
  
  // Encabezado de KPIs
  wsKpi.mergeCells('A4:D4');
  const kpiTitle = wsKpi.getCell('A4');
  kpiTitle.value = '1. INDICADORES CLAVE DE RENDIMIENTO (KPIS)';
  kpiTitle.font = { name: 'Calibri', size: 11, bold: true, color: { argb: PALETTE.NAVY_DARK } };

  // Fila de encabezado de tabla de KPIs
  const kpiHeaderRow = wsKpi.addRow([
    'Indicador de Auditoría',
    'Valor Registrado',
    'Unidad / Referencia',
    'Evaluación Técnica'
  ]);
  kpiHeaderRow.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  kpiHeaderRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.NAVY_LIGHT } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });
  kpiHeaderRow.height = 24;

  const kpiData = [
    ['Total de Archivos PDF Inspeccionados', kpis.total_pdfs, 'Documentos', '100% Lote auditado'],
    ['Índice Global de Cumplimiento OCR', `${kpis.pct_cumplimiento}%`, 'Porcentaje', isHealthy ? 'Nivel Conforme' : 'Atención Requerida'],
    ['Documentos Conformes (Texto Apto)', kpis.conformes, 'Archivos', 'Aptos para búsqueda'],
    ['Archivos con Intervención Crítica (OCR Total)', kpis.requieren_ocr_total, 'Archivos', kpis.requieren_ocr_total > 0 ? 'ALTA PRIORIDAD' : 'Ninguno'],
    ['Archivos con Intervención Parcial (Mixtos)', kpis.requieren_ocr_parcial, 'Archivos', kpis.requieren_ocr_parcial > 0 ? 'Páginas Huérfanas' : 'Ninguno'],
    ['Archivos Bloqueados o Encriptados con Clave', kpis.bloqueados, 'Archivos', kpis.bloqueados > 0 ? 'Requieren Desbloqueo' : 'Sin Cifrado'],
    ['Volumen Total de Almacenamiento Auditado', `${kpis.total_mb} MB`, 'Megabytes', 'Espacio analizado'],
    ['Total de Páginas Físicas Inspeccionadas', kpis.total_paginas, 'Folios', 'Superficie documental'],
    ['Páginas Huérfanas (Solo Imagen Sin OCR)', kpis.paginas_sin_ocr, 'Páginas', kpis.paginas_sin_ocr > 0 ? 'Requieren Reconocimiento' : 'Cero huérfanas'],
    ['Grupos de Archivos Duplicados (Mismo SHA-256)', kpis.total_duplicados_grupos, 'Grupos', `${kpis.total_duplicados_archivos} copias idénticas`]
  ];

  kpiData.forEach((row, idx) => {
    const r = wsKpi.addRow(row);
    r.height = 20;
    const isEven = idx % 2 === 0;
    r.eachCell((cell, colNum) => {
      cell.border = thinBorder;
      cell.font = { name: 'Calibri', size: 10 };
      if (isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.BG_ZEBRA } };
      }
      if (colNum === 1) {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.NAVY_LIGHT } };
      } else if (colNum === 2) {
        cell.alignment = { horizontal: 'center' };
        cell.font = { name: 'Calibri', size: 10, bold: true };
      } else if (colNum === 3) {
        cell.alignment = { horizontal: 'center' };
        cell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: PALETTE.SLATE_GRAY } };
      } else if (colNum === 4) {
        cell.alignment = { horizontal: 'center' };
        if (cell.value === 'ALTA PRIORIDAD') {
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: PALETTE.RED_TEXT } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.RED_BG } };
        } else if (cell.value === 'Nivel Conforme' || cell.value === 'Aptos para búsqueda') {
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: PALETTE.GREEN_TEXT } };
        }
      }
    });
  });

  // Dictamen Oficial de Cumplimiento
  wsKpi.addRow([]);
  const verdictHeader = wsKpi.addRow(['2. DICTAMEN OFICIAL DE CUMPLIMIENTO']);
  verdictHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: PALETTE.NAVY_DARK } };

  wsKpi.mergeCells('A18:D20');
  const verdictCell = wsKpi.getCell('A18');
  if (kpis.pct_cumplimiento === 100) {
    verdictCell.value = 'CERTIFICACIÓN DE CONFORMIDAD: El 100% de los documentos inspeccionados cuentan con capa de texto legible que supera los estándares de densidad textual ISO 32000-1. El repositorio está certificado para indexación forense, minería de texto y custodia digital.';
    verdictCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.GREEN_BG } };
    verdictCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.GREEN_TEXT } };
  } else {
    verdictCell.value = `NO CONFORMIDAD DETECTADA (${kpis.pct_cumplimiento}% Cumplimiento): Se han identificado ${kpis.requieren_ocr_total + kpis.requieren_ocr_parcial} documento(s) que requieren intervención técnica urgente. Los archivos señalados en la hoja 'Plan de Remediación' carecen de capa de texto o contienen páginas huérfanas de imagen escaneada que impiden la búsqueda y el cumplimiento regulatorio.`;
    verdictCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.RED_BG } };
    verdictCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.RED_TEXT } };
  }
  verdictCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  verdictCell.border = thinBorder;

  // Ajustar anchos Hoja 1
  wsKpi.getColumn(1).width = 48;
  wsKpi.getColumn(2).width = 22;
  wsKpi.getColumn(3).width = 20;
  wsKpi.getColumn(4).width = 28;

  // ----------------------------------------------------------------------------
  // HOJA 2: MATRIZ DE AUDITORÍA DETALLADA
  // ----------------------------------------------------------------------------
  const wsDetail = workbook.addWorksheet('Matriz de Auditoría', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 2, showGridLines: true }]
  });

  // Título de la tabla
  wsDetail.mergeCells('A1:R1');
  const matTitle = wsDetail.getCell('A1');
  matTitle.value = 'MATRIZ TÉCNICA FORENSE DE INSPECCIÓN OCR (ORDENADA POR SEVERIDAD)';
  matTitle.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFF' } };
  matTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.NAVY_DARK } };
  matTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  wsDetail.getRow(1).height = 28;

  // Encabezados
  const headers = [
    'N°',
    'Prioridad',
    'Estado General',
    'Cumple OCR',
    'Nombre del Archivo',
    'Págs',
    'Págs Sin OCR',
    'Págs Deficientes',
    'Densidad (c/in²)',
    'Caracteres Totales',
    'Tamaño (MB)',
    'Causa Raíz Diagnóstica',
    'Acción Requerida',
    'Checksum SHA-256',
    'Checksum MD5',
    'Software Creador',
    'Encriptado',
    'Ruta / Origen'
  ];

  const headerRow = wsDetail.addRow(headers);
  headerRow.height = 26;
  headerRow.eachCell((cell, colNum) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.NAVY_LIGHT } };
    cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = thinBorder;
  });

  // Habilitar auto-filtro en los encabezados
  wsDetail.autoFilter = {
    from: 'A2',
    to: `R${records.length + 2}`
  };

  // Ordenar: primero los que requieren OCR urgente
  const sortedRecords = [...records].sort((a, b) => {
    if (a.conforme_ocr === b.conforme_ocr) {
      return b.paginas_solo_imagen_sin_ocr - a.paginas_solo_imagen_sin_ocr;
    }
    return a.conforme_ocr ? 1 : -1;
  });

  sortedRecords.forEach((r, idx) => {
    const isUrgent = !r.conforme_ocr;
    const row = wsDetail.addRow([
      idx + 1,
      isUrgent ? 'ALTA: INTERVENCIÓN' : 'CONFORME',
      r.estado_general,
      r.conforme_ocr ? 'SÍ' : 'NO',
      r.archivo,
      r.total_paginas,
      r.paginas_solo_imagen_sin_ocr,
      r.paginas_texto_deficiente,
      r.promedio_densidad_chars_sq_in,
      r.total_caracteres,
      r.tamano_mb,
      r.causa_raiz,
      r.accion_requerida,
      r.sha256,
      r.md5,
      r.metadatos_iso?.software_creador || 'N/A',
      r.encriptado ? 'SÍ' : 'NO',
      r.ruta_o_origen
    ]);

    row.height = 22;
    const isEven = idx % 2 === 0;

    row.eachCell((cell, colNum) => {
      cell.border = thinBorder;
      cell.font = { name: 'Calibri', size: 9 };
      if (isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.BG_ZEBRA } };
      }

      // Estilo por columna
      if (colNum === 1) {
        cell.alignment = { horizontal: 'center' };
      } else if (colNum === 2) {
        cell.alignment = { horizontal: 'center' };
        if (cell.value === 'ALTA: INTERVENCIÓN') {
          cell.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: PALETTE.RED_TEXT } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.RED_BG } };
        } else {
          cell.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: PALETTE.GREEN_TEXT } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.GREEN_BG } };
        }
      } else if (colNum === 3) {
        // Estado general
        cell.alignment = { horizontal: 'center' };
        if (String(cell.value).includes('REQUIERE_OCR_TOTAL')) {
          cell.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: PALETTE.RED_TEXT } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.RED_BG } };
        } else if (String(cell.value).includes('REQUIERE_OCR_PARCIAL') || String(cell.value).includes('TEXTO_INSUFICIENTE')) {
          cell.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: PALETTE.AMBER_TEXT } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.AMBER_BG } };
        } else if (String(cell.value).includes('CONFORME_OCR')) {
          cell.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: PALETTE.GREEN_TEXT } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.GREEN_BG } };
        }
      } else if (colNum === 4) {
        cell.alignment = { horizontal: 'center' };
        cell.font = { name: 'Calibri', size: 9, bold: true };
      } else if (colNum === 5) {
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: PALETTE.NAVY_DARK } };
      } else if (colNum >= 6 && colNum <= 11) {
        cell.alignment = { horizontal: 'right' };
        if (colNum === 7 && Number(cell.value) > 0) {
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: PALETTE.RED_TEXT } };
        }
      } else if (colNum === 14 || colNum === 15) {
        cell.font = { name: 'Consolas', size: 8, color: { argb: PALETTE.SLATE_GRAY } };
      }
    });
  });

  // Ajuste automático de anchos de columna
  const colWidths = [6, 18, 24, 12, 34, 8, 12, 14, 14, 16, 12, 42, 36, 32, 24, 20, 12, 28];
  colWidths.forEach((w, i) => {
    wsDetail.getColumn(i + 1).width = w;
  });

  // ----------------------------------------------------------------------------
  // HOJA 3: PLAN DE REMEDIACIÓN Y NO CONFORMES
  // ----------------------------------------------------------------------------
  const nonCompliant = records.filter(r => !r.conforme_ocr);
  if (nonCompliant.length > 0) {
    const wsRemediation = workbook.addWorksheet('Plan de Remediación', {
      views: [{ showGridLines: true }]
    });

    wsRemediation.mergeCells('A1:F1');
    const remTitle = wsRemediation.getCell('A1');
    remTitle.value = 'CATÁLOGO DE DOCUMENTOS NO CONFORMES Y COMANDOS DE REMEDIACIÓN OCR';
    remTitle.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFF' } };
    remTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DC2626' } };
    remTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    wsRemediation.getRow(1).height = 30;

    const remHeaders = wsRemediation.addRow([
      'N°',
      'Archivo No Conforme',
      'Estado',
      'Págs Afectadas',
      'Causa Raíz Diagnóstica',
      'Comando Sugerido de Remediación (OCRmyPDF)'
    ]);
    remHeaders.height = 24;
    remHeaders.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.NAVY_LIGHT } };
      cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = thinBorder;
    });

    nonCompliant.forEach((r, idx) => {
      const cmd = `ocrmypdf --skip-text --deskew -l spa "${r.archivo}" "remediado_${r.archivo}"`;
      const row = wsRemediation.addRow([
        idx + 1,
        r.archivo,
        r.estado_general,
        `${r.paginas_solo_imagen_sin_ocr} de ${r.total_paginas} págs`,
        r.causa_raiz,
        cmd
      ]);
      row.height = 22;
      row.eachCell((cell, colNum) => {
        cell.border = thinBorder;
        cell.font = { name: 'Calibri', size: 9 };
        if (colNum === 1) cell.alignment = { horizontal: 'center' };
        if (colNum === 6) {
          cell.font = { name: 'Consolas', size: 8, color: { argb: '059669' } };
        }
      });
    });

    wsRemediation.getColumn(1).width = 6;
    wsRemediation.getColumn(2).width = 34;
    wsRemediation.getColumn(3).width = 24;
    wsRemediation.getColumn(4).width = 16;
    wsRemediation.getColumn(5).width = 46;
    wsRemediation.getColumn(6).width = 56;
  }

  // Descarga del archivo Excel
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Auditoria_OCR_Certificada_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * ==============================================================================
 * EXPORTACIÓN A PDF EJECUTIVO CON JSPDF & JSPDF-AUTOTABLE
 * ==============================================================================
 */
export function exportAuditToPdf(records: AuditRecord[], kpis: AuditKPIs): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const isHealthy = kpis.pct_cumplimiento >= 80;

  // 1. BANNER INSTITUCIONAL SUPERIOR
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Acento de color superior (Barra azul eléctrico)
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('DICTAMEN OFICIAL DE AUDITORÍA FORENSE OCR', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Norma Internacional ISO 32000-1 | Validez y Preservación Digital | Emisión: ${new Date().toLocaleString()}`, 14, 21);

  // Insignia de Certificación en la esquina derecha del banner
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(pageWidth - 62, 7, 48, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(isHealthy ? 74 : 248, isHealthy ? 222 : 113, isHealthy ? 128 : 113);
  doc.text(isHealthy ? 'CONFORME ISO' : 'NO CONFORME', pageWidth - 58, 13);
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(`Índice: ${kpis.pct_cumplimiento}% legibilidad`, pageWidth - 58, 18);

  let currentY = 36;

  // 2. SECCIÓN: RESUMEN DE INDICADORES (KPIS EN TARJETAS ELEGANTES)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. RESUMEN EJECUTIVO DE RENDIMIENTO (SCORECARD)', 14, currentY);

  currentY += 4;

  const cardWidth = (pageWidth - 28 - 12) / 4; // 4 tarjetas
  const cardHeight = 18;

  const cardsData = [
    { title: 'TOTAL ANALIZADO', val: `${kpis.total_pdfs} PDFs`, sub: `${kpis.total_mb} MB en lote`, color: [15, 23, 42] },
    { title: 'ÍNDICE OCR', val: `${kpis.pct_cumplimiento}%`, sub: isHealthy ? 'Apto preservación' : 'Bajo umbral ISO', color: isHealthy ? [22, 101, 52] : [185, 28, 28] },
    { title: 'REQUIEREN OCR', val: `${kpis.requieren_ocr_total + kpis.requieren_ocr_parcial}`, sub: `${kpis.requieren_ocr_total} críticos | ${kpis.requieren_ocr_parcial} mixtos`, color: [220, 38, 38] },
    { title: 'PÁGS HUÉRFANAS', val: `${kpis.paginas_sin_ocr}`, sub: 'Solo imagen sin OCR', color: [194, 65, 12] }
  ];

  cardsData.forEach((c, i) => {
    const x = 14 + i * (cardWidth + 4);
    // Fondo de tarjeta
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Título de la tarjeta
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(c.title, x + 3.5, currentY + 5);

    // Valor principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(c.val, x + 3.5, currentY + 11.5);

    // Subtítulo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text(c.sub, x + 3.5, currentY + 15.5);
  });

  currentY += cardHeight + 8;

  // 3. SECCIÓN: MATRIZ DE AUDITORÍA DETALLADA CON AUTOTABLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. MATRIZ DE EVALUACIÓN TÉCNICA Y DIAGNÓSTICO DE CAUSA RAÍZ', 14, currentY);

  currentY += 3;

  // Priorizar primero los que no cumplen
  const sorted = [...records].sort((a, b) => {
    if (a.conforme_ocr === b.conforme_ocr) {
      return b.paginas_solo_imagen_sin_ocr - a.paginas_solo_imagen_sin_ocr;
    }
    return a.conforme_ocr ? 1 : -1;
  });

  const tableRows = sorted.map((r, i) => {
    const estadoLabel = r.estado_general
      .replace('REQUIERE_OCR_TOTAL', 'OCR TOTAL')
      .replace('REQUIERE_OCR_PARCIAL', 'OCR PARCIAL')
      .replace('TEXTO_INSUFICIENTE', 'BAJA DENSIDAD')
      .replace('BLOQUEADO / ENCRIPTADO', 'CIFRADO')
      .replace('CONFORME_OCR', 'CONFORME');

    return [
      (i + 1).toString(),
      r.archivo,
      estadoLabel,
      r.total_paginas.toString(),
      r.paginas_solo_imagen_sin_ocr.toString(),
      `${r.promedio_densidad_chars_sq_in} c/in²`,
      r.causa_raiz,
      `${r.tamano_mb} MB`
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['N°', 'Documento', 'Estado', 'Págs', 'Huérfanas', 'Densidad', 'Diagnóstico Causa Raíz', 'Tamaño']],
    body: tableRows,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 6.5,
      cellPadding: 2,
      textColor: [51, 65, 85], // slate-700
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontSize: 6.8,
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 'auto' },
      7: { cellWidth: 14, halign: 'right' }
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const row = sorted[data.row.index];
        // Colorear celda de estado
        if (data.column.index === 2) {
          if (row.estado_general === 'REQUIERE_OCR_TOTAL') {
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fillColor = [254, 226, 226];
          } else if (row.estado_general === 'REQUIERE_OCR_PARCIAL' || row.estado_general === 'TEXTO_INSUFICIENTE') {
            data.cell.styles.textColor = [180, 83, 9];
            data.cell.styles.fillColor = [254, 243, 199];
          } else if (row.estado_general === 'CONFORME_OCR') {
            data.cell.styles.textColor = [22, 101, 52];
            data.cell.styles.fillColor = [220, 252, 231];
          }
        }
        // Resaltar páginas huérfanas en rojo si > 0
        if (data.column.index === 4 && row.paginas_solo_imagen_sin_ocr > 0) {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 28 }
  });

  // 4. PIE DE PÁGINA CORPORATIVO CON NUMERACIÓN "PÁGINA X DE Y"
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);

    // Línea separadora de pie
    doc.setDrawColor(203, 213, 225);
    doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

    // Texto de confidencialidad
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('AuditOCR Enterprise • Dictamen Técnico de Inspección Digital • Confidencial y Privado', 14, pageHeight - 10);

    // Número de página
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - 32, pageHeight - 10);
  }

  // Descarga del archivo PDF
  const filename = `Dictamen_Auditoria_OCR_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * ==============================================================================
 * DESCARGA DE LOGS Y ARCHIVOS DE TEXTO
 * ==============================================================================
 */
export function downloadTextFile(filename: string, content: string, mime: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
