/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { UploadDropzone } from './components/UploadDropzone';
import { ThresholdTuner } from './components/ThresholdTuner';
import { AuditTable } from './components/AuditTable';
import { PageDetailModal } from './components/PageDetailModal';
import { PythonHub } from './components/PythonHub';
import { INITIAL_AUDIT_SAMPLES } from './utils/mockSamples';
import { calculateKPIs } from './utils/pdfInspectorClient';
import { exportAuditToExcel, exportAuditToPdf, downloadTextFile } from './utils/exportUtils';
import { AuditRecord, AuditSnapshot } from './types';
import { Download, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Trash2, RotateCcw, FolderOpen, History, BookmarkPlus } from 'lucide-react';
import { AuditHistoryModal } from './components/AuditHistoryModal';
import { getAuditHistory, saveAuditSnapshot, deleteAuditSnapshot, clearAllAuditHistory } from './utils/historyStorage';
import { useToast } from './context/ToastContext';

export default function App() {
  const toast = useToast();
  const [records, setRecords] = useState<AuditRecord[]>(INITIAL_AUDIT_SAMPLES);
  const [activeTab, setActiveTab] = useState<'auditor' | 'python_suite'>('auditor');
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  // Historial de auditorías (localStorage)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<AuditSnapshot[]>(() => getAuditHistory());

  // Umbrales de auditoría configurables
  const [minCharsSqInch, setMinCharsSqInch] = useState<number>(1.2);
  const [minCharsPage, setMinCharsPage] = useState<number>(80);

  // KPIs calculados
  const kpis = useMemo(() => calculateKPIs(records), [records]);

  // Manejo de Historial
  const handleSaveSnapshot = (nombreLote: string) => {
    if (records.length === 0) return;
    const updated = saveAuditSnapshot(nombreLote, records, kpis);
    setHistory(updated);
    toast.info(
      'Lote Guardado en Historial',
      `Punto de control "${nombreLote || 'Lote Guardado'}" almacenado localmente.`
    );
  };

  const handleRestoreSnapshot = (snapshot: AuditSnapshot) => {
    setRecords(snapshot.records);
    setSelectedRecord(null);
    toast.success(
      'Lote Restaurado con Éxito',
      `Se recuperó "${snapshot.nombre_lote}" con ${snapshot.total_archivos} documentos.`
    );
  };

  const handleDeleteSnapshot = (id: string) => {
    const updated = deleteAuditSnapshot(id);
    setHistory(updated);
    toast.warning('Punto de control eliminado del historial');
  };

  const handleClearAllHistory = () => {
    clearAllAuditHistory();
    setHistory([]);
    toast.info('Historial vaciado por completo');
  };

  // Limpiar toda la matriz
  const handleClearMatrix = () => {
    setRecords([]);
    setSelectedRecord(null);
    toast.info('Matriz Vaciada', 'Se eliminaron todos los documentos de la sesión.');
  };

  // Eliminar solo registros seleccionados
  const handleDeleteSelected = (idsToDelete: string[]) => {
    const toDeleteSet = new Set(idsToDelete);
    setRecords(prev => prev.filter(r => !toDeleteSet.has(r.id)));
    if (selectedRecord && toDeleteSet.has(selectedRecord.id)) {
      setSelectedRecord(null);
    }
    toast.warning(
      'Registros Eliminados',
      `Se removieron ${idsToDelete.length} archivo(s) de la matriz de inspección.`
    );
  };

  // Manejador de nuevos archivos inspeccionados por el usuario
  const handleFilesAudited = (newRecords: AuditRecord[]) => {
    setRecords(prev => {
      // Filtrar repetidos por nombre o reemplazar
      const existingNames = new Set(newRecords.map(r => r.archivo));
      const filteredPrev = prev.filter(r => !existingNames.has(r.archivo));
      return [...newRecords, ...filteredPrev];
    });
  };

  // Restaurar lote demo
  const handleResetSamples = () => {
    setRecords(INITIAL_AUDIT_SAMPLES);
  };

  // Recalcular matriz según nuevos umbrales
  const handleApplyReevaluation = () => {
    setRecords(prev => {
      return prev.map(record => {
        if (record.encriptado || record.estado_general === 'ERROR_CORRUPTO') {
          return record;
        }

        let deficientPages = 0;
        let validPages = 0;
        let imageOnlyPages = 0;

        const updatedPages = record.detalle_paginas.map(p => {
          if (p.caracteres === 0 && p.imagenes > 0) {
            imageOnlyPages++;
            return { ...p, estado: 'SOLO_IMAGEN_SIN_OCR' as const };
          }
          if (p.caracteres === 0 && p.imagenes === 0) {
            return { ...p, estado: 'PAGINA_EN_BLANCO' as const };
          }
          if (p.caracteres < minCharsPage || p.densidad_sq_in < minCharsSqInch) {
            deficientPages++;
            return { ...p, estado: 'TEXTO_DEFICIENTE_CON_IMAGEN' as const };
          }
          validPages++;
          return { ...p, estado: 'TEXTO_VALIDO' as const };
        });

        const totalPages = record.total_paginas || 1;
        let estado = record.estado_general;
        let conforme = record.conforme_ocr;
        let causa = record.causa_raiz;
        let accion = record.accion_requerida;

        if (imageOnlyPages === totalPages) {
          estado = 'REQUIERE_OCR_TOTAL';
          conforme = false;
          causa = `Documento escaneado al 100%: ${totalPages} página(s) contienen solo imágenes rasterizadas sin capa OCR.`;
          accion = 'Procesar con motor OCR (Tesseract / Cloud Vision) completo.';
        } else if (imageOnlyPages > 0 || deficientPages > totalPages * 0.3) {
          estado = 'REQUIERE_OCR_PARCIAL';
          conforme = false;
          causa = `Documento mixto: ${imageOnlyPages} pág(s) son imágenes puras y ${deficientPages} están bajo umbral (${minCharsSqInch} c/in²).`;
          accion = 'Re-OCRizar páginas identificadas o re-escanear anexos.';
        } else if (record.promedio_densidad_chars_sq_in < minCharsSqInch) {
          estado = 'TEXTO_INSUFICIENTE';
          conforme = false;
          causa = `Densidad promedio (${record.promedio_densidad_chars_sq_in} c/in²) inferior al umbral mínimo (${minCharsSqInch} c/in²).`;
          accion = 'Inspeccionar manualmente y aplicar OCR de alta precisión.';
        } else {
          estado = 'CONFORME_OCR';
          conforme = true;
          causa = `Capa de texto íntegra y legible. Densidad (${record.promedio_densidad_chars_sq_in} c/in²) superior al umbral (${minCharsSqInch} c/in²).`;
          accion = 'Ninguna. Apto para indexación y búsqueda documental.';
        }

        return {
          ...record,
          estado_general: estado,
          conforme_ocr: conforme,
          causa_raiz: causa,
          accion_requerida: accion,
          paginas_con_texto_valido: validPages,
          paginas_solo_imagen_sin_ocr: imageOnlyPages,
          paginas_texto_deficiente: deficientPages,
          detalle_paginas: updatedPages
        };
      });
    });

    toast.success(
      'Reevaluación de Umbrales Finalizada',
      `Matriz recalculada con umbrales: ${minCharsSqInch} c/in² y ${minCharsPage} chars/pág en ${records.length} documentos.`
    );
  };

  // Exportar Excel
  const handleExportExcel = async () => {
    try {
      await exportAuditToExcel(records, kpis);
      if (records.length > 0) {
        const snapName = `Reporte Excel (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
        const updated = saveAuditSnapshot(snapName, records, kpis);
        setHistory(updated);
      }
      toast.success(
        'Exportación Excel Finalizada',
        `Libro de auditoría (.xlsx) con 3 hojas corporativas descargado exitosamente.`
      );
    } catch (err) {
      toast.error('Error al exportar Excel', String(err));
    }
  };

  // Exportar PDF
  const handleExportPdf = () => {
    try {
      exportAuditToPdf(records, kpis);
      if (records.length > 0) {
        const snapName = `Dictamen PDF (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
        const updated = saveAuditSnapshot(snapName, records, kpis);
        setHistory(updated);
      }
      toast.success(
        'Dictamen PDF Emitido',
        `Informe formal de auditoría ISO 32000-1 descargado con éxito.`
      );
    } catch (err) {
      toast.error('Error al generar PDF', String(err));
    }
  };

  // Descargar Log Técnico auditoria_ocr_log.log
  const handleDownloadLog = () => {
    const timestamp = new Date().toISOString();
    let logLines = [
      `================================================================================`,
      `LOG DE AUDITORÍA FORENSE OCR - GENERADO: ${timestamp}`,
      `MOTOR: PyMuPDF 1.23.26 / Python AuditOCR Engine`,
      `UMBRALES APLICADOS: ${minCharsSqInch} c/in² | ${minCharsPage} chars/pág`,
      `TOTAL ARCHIVOS ANALIZADOS: ${kpis.total_pdfs} | % CUMPLIMIENTO: ${kpis.pct_cumplimiento}%`,
      `================================================================================`,
      ``
    ];

    records.forEach(r => {
      const statusIcon = r.conforme_ocr ? '[INFO]' : '[WARNING]';
      logLines.push(`${r.fecha_inspeccion} ${statusIcon} [Auditor] Archivo: "${r.archivo}"`);
      logLines.push(`    SHA-256: ${r.sha256}`);
      logLines.push(`    MD5:     ${r.md5}`);
      logLines.push(`    Páginas: ${r.total_paginas} | Págs Sin OCR: ${r.paginas_solo_imagen_sin_ocr} | Densidad: ${r.promedio_densidad_chars_sq_in} c/in²`);
      logLines.push(`    Estado:  ${r.estado_general}`);
      logLines.push(`    Causa:   ${r.causa_raiz}`);
      logLines.push(`    Acción:  ${r.accion_requerida}`);
      if (r.encriptado) {
        logLines.push(`    [SECURITY] Documento protegido con clave de cifrado.`);
      }
      logLines.push(``);
    });

    downloadTextFile('auditoria_ocr_log.log', logLines.join('\n'), 'text/plain');
    toast.info(
      'Log Técnico Descargado',
      'auditoria_ocr_log.log guardado con los eventos y hashes de la sesión.'
    );
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      
      {/* Header Corporativo */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        onResetSamples={handleResetSamples}
        onClearMatrix={handleClearMatrix}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        hasRecords={records.length > 0}
        pctCompliance={kpis.pct_cumplimiento}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {activeTab === 'auditor' ? (
          <>
            {/* KPI Cards */}
            <KpiCards kpis={kpis} />

            {/* Zona de Carga Masiva y Drag & Drop */}
            <UploadDropzone
              onFilesAudited={handleFilesAudited}
              onLoadDemoBatch={handleResetSamples}
              minCharsPage={minCharsPage}
              minCharsSqInch={minCharsSqInch}
            />

            {/* Calibrador de Umbrales */}
            <ThresholdTuner
              minCharsSqInch={minCharsSqInch}
              setMinCharsSqInch={setMinCharsSqInch}
              minCharsPage={minCharsPage}
              setMinCharsPage={setMinCharsPage}
              onApplyReevaluation={handleApplyReevaluation}
            />

            {/* Matriz y Tabla de Auditoría Ordenada por Severidad */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    Matriz de Inspección y Hallazgos Forenses
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                      {records.length} {records.length === 1 ? 'archivo' : 'archivos'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Prioriza automáticamente los documentos que requieren intervención / OCRización urgente
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    title="Abrir historial de auditorías y restaurar lotes anteriores"
                  >
                    <History className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Historial ({history.length})</span>
                  </button>

                  {records.length > 0 && (
                    <button
                      onClick={handleClearMatrix}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      title="Eliminar todos los registros de la matriz de auditoría"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>Limpiar Matriz</span>
                    </button>
                  )}

                  <button
                    onClick={handleDownloadLog}
                    disabled={records.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium shadow-xs transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Descargar Log (.log)</span>
                  </button>
                </div>
              </div>

              {records.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    La matriz de auditoría está vacía
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    No hay documentos analizados actualmente. Arrastra archivos PDF en la zona superior o carga el lote de demostración para iniciar la inspección.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={handleResetSamples}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Cargar Lote de Demostración</span>
                    </button>
                  </div>
                </div>
              ) : (
                <AuditTable
                  records={records}
                  onSelectRecord={(rec) => setSelectedRecord(rec)}
                  onDeleteSelected={handleDeleteSelected}
                />
              )}
            </div>
          </>
        ) : (
          /* Pestaña: Arquitectura y Código Python */
          <PythonHub />
        )}

      </main>

      {/* Modal de Ficha Técnica / Desglose por Página */}
      <PageDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />

      {/* Modal de Historial de Auditorías */}
      <AuditHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        currentRecords={records}
        currentKpis={kpis}
        onSaveSnapshot={handleSaveSnapshot}
        onRestoreSnapshot={handleRestoreSnapshot}
        onDeleteSnapshot={handleDeleteSnapshot}
        onClearAllHistory={handleClearAllHistory}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">AuditOCR Engine</span>
            <span>— Validación Conforme a ISO 32000-1 y directrices de Preservación Digital</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Python 3.11 • PyMuPDF (fitz) • Pandas • OpenPyXL • ReportLab • Google Drive API
          </div>
        </div>
      </footer>

    </div>
  );
}
