import React from 'react';
import { 
  X, 
  FileText, 
  Shield, 
  Hash, 
  Info, 
  Image as ImageIcon, 
  Type, 
  AlertCircle,
  CheckCircle2,
  Terminal,
  Lock,
  Calendar
} from 'lucide-react';
import { AuditRecord } from '../types';

interface PageDetailModalProps {
  record: AuditRecord | null;
  onClose: () => void;
}

export const PageDetailModal: React.FC<PageDetailModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 truncate max-w-md" title={record.archivo}>
                  {record.archivo}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  record.conforme_ocr 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {record.estado_general}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {record.ruta_o_origen}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          
          {/* Tarjeta de Diagnóstico y Causa Raíz */}
          <div className={`p-4 rounded-xl border ${
            record.conforme_ocr ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
          }`}>
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-1.5">
              {record.conforme_ocr ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              Diagnóstico Forense de la Capa de Texto
            </h4>
            <p className="text-slate-800 text-xs mb-2 leading-relaxed">
              {record.causa_raiz}
            </p>
            <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-lg border border-slate-200/80">
              <span className="font-semibold text-slate-900">Plan de Acción Recomendado:</span>
              <span className="text-blue-800 font-medium">{record.accion_requerida}</span>
            </div>
          </div>

          {/* Grilla de Métricas Técnicas y Checksums */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Metadatos ISO / XMP */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Metadatos ISO Extraídos
              </h5>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                  <span className="text-slate-400">Título:</span>
                  <span className="font-medium text-slate-800 text-right truncate max-w-[200px]">{record.metadatos_iso.titulo || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                  <span className="text-slate-400">Autor:</span>
                  <span className="font-medium text-slate-800 text-right">{record.metadatos_iso.autor || 'Desconocido'}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                  <span className="text-slate-400">Software Creador:</span>
                  <span className="font-medium text-slate-800 text-right">{record.metadatos_iso.software_creador || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                  <span className="text-slate-400">Productor PDF:</span>
                  <span className="font-medium text-slate-800 text-right">{record.metadatos_iso.productor_pdf || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Versión PDF:</span>
                  <span className="font-medium text-slate-800 font-mono">{record.metadatos_iso.version_formato || 'PDF 1.4'}</span>
                </div>
              </div>
            </div>

            {/* Hashes y Criptografía */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-purple-600" />
                Huellas Criptográficas
              </h5>
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">SHA-256 Checksum:</span>
                  <div className="p-1.5 bg-white rounded border border-slate-200 font-mono text-[11px] text-slate-800 break-all select-all">
                    {record.sha256}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">MD5 Checksum:</span>
                  <div className="p-1.5 bg-white rounded border border-slate-200 font-mono text-[11px] text-slate-800 break-all select-all">
                    {record.md5}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-500">Encriptación / Permisos:</span>
                  <span className={`font-semibold ${record.encriptado ? 'text-red-600' : 'text-emerald-700'}`}>
                    {record.encriptado ? 'Bloqueado con Contraseña' : 'Sin Restricciones'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Desglose Página por Página */}
          <div>
            <h5 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-blue-600" />
              Auditoría Individual de Páginas ({record.detalle_paginas.length} págs)
            </h5>

            {record.detalle_paginas.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No hay páginas procesables (el documento puede estar protegido por contraseña o corrupto).
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] font-semibold text-slate-600 uppercase border-b border-slate-200">
                      <th className="py-2.5 px-3 text-center">Pág</th>
                      <th className="py-2.5 px-3">Estado de Capa</th>
                      <th className="py-2.5 px-3 text-center">Caracteres</th>
                      <th className="py-2.5 px-3 text-center">Densidad (c/in²)</th>
                      <th className="py-2.5 px-3 text-center">Imágenes</th>
                      <th className="py-2.5 px-3 text-center">Dimensiones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {record.detalle_paginas.map((p) => {
                      const isImageOnly = p.estado === 'SOLO_IMAGEN_SIN_OCR';
                      const isLowDensity = p.estado === 'TEXTO_DEFICIENTE_CON_IMAGEN' || p.estado === 'BAJA_DENSIDAD_TEXTUAL';

                      return (
                        <tr key={p.pagina} className={isImageOnly ? 'bg-red-50/40' : isLowDensity ? 'bg-amber-50/30' : ''}>
                          <td className="py-2 px-3 text-center font-bold text-slate-800">
                            {p.pagina}
                          </td>
                          <td className="py-2 px-3">
                            {isImageOnly ? (
                              <span className="text-red-700 font-semibold flex items-center gap-1">
                                <ImageIcon className="w-3 h-3 text-red-500" />
                                Solo Imagen (Sin OCR)
                              </span>
                            ) : isLowDensity ? (
                              <span className="text-amber-700 font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-amber-500" />
                                Densidad Deficiente
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Texto Válido
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center font-mono">
                            {p.caracteres}
                          </td>
                          <td className="py-2 px-3 text-center font-mono">
                            <span className={p.densidad_sq_in < 1.2 ? 'text-red-600 font-bold' : 'text-slate-800'}>
                              {p.densidad_sq_in}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            {p.imagenes}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">
                            {p.dimensiones_in} in
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Snippet de Remediación OCR sugerido */}
          <div className="p-4 rounded-xl bg-slate-900 text-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                Comando CLI Sugerido para Remediación (OCRmyPDF / Tesseract)
              </span>
              <span className="text-[10px] text-slate-400">Bash / Terminal</span>
            </div>
            <pre className="bg-slate-950 p-2.5 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto select-all">
              {`ocrmypdf --skip-text --deskew --clean -l spa "${record.archivo}" "remediado_${record.archivo}"`}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors"
          >
            Cerrar Ficha Técnica
          </button>
        </div>

      </div>
    </div>
  );
};
