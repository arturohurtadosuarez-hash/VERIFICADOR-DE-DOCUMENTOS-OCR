import React, { useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle, 
  Lock, 
  HelpCircle,
  Copy, 
  Check, 
  ChevronRight, 
  Filter, 
  Search, 
  Layers, 
  Trash2, 
  CheckSquare,
  X
} from 'lucide-react';
import { AuditRecord, GeneralStatus } from '../types';

interface AuditTableProps {
  records: AuditRecord[];
  onSelectRecord: (record: AuditRecord) => void;
  onDeleteSelected?: (ids: string[]) => void;
}

export const AuditTable: React.FC<AuditTableProps> = ({ 
  records, 
  onSelectRecord,
  onDeleteSelected 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [onlyNonCompliant, setOnlyNonCompliant] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Filtrado en tiempo real por nombre de archivo o estado general
  const filteredRecords = records
    .filter(r => {
      const term = searchTerm.toLowerCase().trim();
      
      let matchSearch = true;
      if (term) {
        const matchName = r.archivo.toLowerCase().includes(term);
        const matchStatusText = r.estado_general.toLowerCase().includes(term);
        const matchConforme = (term === 'conforme' || term === 'cumple') && r.conforme_ocr;
        const matchNoConforme = (term === 'no conforme' || term === 'critico') && !r.conforme_ocr;
        const matchOcrTotal = (term === 'ocr total' || term === 'total') && r.estado_general === 'REQUIERE_OCR_TOTAL';
        const matchOcrParcial = (term === 'ocr parcial' || term === 'parcial' || term === 'mixto') && (r.estado_general === 'REQUIERE_OCR_PARCIAL' || r.estado_general === 'TEXTO_INSUFICIENTE');
        const matchBloqueado = (term === 'bloqueado' || term === 'cifrado' || term === 'clave' || term === 'password') && r.estado_general.includes('BLOQUEADO');
        const matchCause = r.causa_raiz.toLowerCase().includes(term);
        const matchSha = r.sha256.toLowerCase().includes(term);

        matchSearch = matchName || matchStatusText || matchConforme || matchNoConforme || matchOcrTotal || matchOcrParcial || matchBloqueado || matchCause || matchSha;
      }
      
      const matchStatus = selectedStatus === 'ALL' || r.estado_general === selectedStatus;
      const matchCompliance = onlyNonCompliant ? !r.conforme_ocr : true;

      return matchSearch && matchStatus && matchCompliance;
    })
    .sort((a, b) => {
      const priorityOrder: Record<GeneralStatus, number> = {
        'REQUIERE_OCR_TOTAL': 1,
        'REQUIERE_OCR_PARCIAL': 2,
        'TEXTO_INSUFICIENTE': 3,
        'BLOQUEADO / ENCRIPTADO': 4,
        'ERROR_CORRUPTO': 5,
        'CONFORME_OCR': 6
      };
      const pA = priorityOrder[a.estado_general] || 99;
      const pB = priorityOrder[b.estado_general] || 99;

      if (pA !== pB) return pA - pB;
      return b.paginas_solo_imagen_sin_ocr - a.paginas_solo_imagen_sin_ocr;
    });

  // Manejo de Selección Múltiple
  const isAllSelected = filteredRecords.length > 0 && filteredRecords.every(r => selectedIds.has(r.id));
  const isSomeSelected = filteredRecords.some(r => selectedIds.has(r.id)) && !isAllSelected;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredRecords.forEach(r => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredRecords.forEach(r => next.add(r.id));
        return next;
      });
    }
  };

  const handleDelete = () => {
    if (onDeleteSelected && selectedIds.size > 0) {
      onDeleteSelected(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const getStatusBadge = (status: GeneralStatus, isDuplicate?: boolean) => {
    switch (status) {
      case 'CONFORME_OCR':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              CONFORME OCR
            </span>
            {isDuplicate && (
              <span className="text-[10px] text-purple-600 font-medium px-1">Duplicado Exacto</span>
            )}
          </div>
        );
      case 'REQUIERE_OCR_TOTAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            REQUIERE OCR TOTAL
          </span>
        );
      case 'REQUIERE_OCR_PARCIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            OCR PARCIAL / MIXTO
          </span>
        );
      case 'TEXTO_INSUFICIENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
            DENSIDAD DEFICIENTE
          </span>
        );
      case 'BLOQUEADO / ENCRIPTADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            BLOQUEADO / CIFRADO
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <HelpCircle className="w-3.5 h-3.5" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      
      {/* Barra de Filtros y Búsqueda en la Cabecera de la Matriz */}
      <div className="p-4 border-b border-slate-200/80 bg-slate-50/70 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Buscador Principal en Tiempo Real */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar en tiempo real por nombre de archivo o estado general (ej: Conforme, OCR Total, Mixto)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs font-medium transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtros de estado desplegables */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtrar:</span>
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="REQUIERE_OCR_TOTAL">Requiere OCR Total</option>
              <option value="REQUIERE_OCR_PARCIAL">Requiere OCR Parcial</option>
              <option value="TEXTO_INSUFICIENTE">Densidad Deficiente</option>
              <option value="CONFORME_OCR">Conformes OCR</option>
              <option value="BLOQUEADO / ENCRIPTADO">Bloqueados / Cifrados</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 select-none shadow-2xs">
              <input
                type="checkbox"
                checked={onlyNonCompliant}
                onChange={(e) => setOnlyNonCompliant(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span className="text-red-700 font-semibold">Solo No Conformes</span>
            </label>
          </div>

        </div>

        {/* Píldoras de Filtro Rápido con Conteo y Feedback en Tiempo Real */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-200/60 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Atajos de Estado:</span>

            <button
              type="button"
              onClick={() => { setSelectedStatus('ALL'); setSearchTerm(''); }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                selectedStatus === 'ALL' && !searchTerm
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todos ({records.length})
            </button>

            <button
              type="button"
              onClick={() => { setSelectedStatus('REQUIERE_OCR_TOTAL'); setSearchTerm(''); }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                selectedStatus === 'REQUIERE_OCR_TOTAL'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
            >
              Requiere OCR Total
            </button>

            <button
              type="button"
              onClick={() => { setSelectedStatus('REQUIERE_OCR_PARCIAL'); setSearchTerm(''); }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                selectedStatus === 'REQUIERE_OCR_PARCIAL'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              OCR Parcial / Mixto
            </button>

            <button
              type="button"
              onClick={() => { setSelectedStatus('CONFORME_OCR'); setSearchTerm(''); }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                selectedStatus === 'CONFORME_OCR'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Conforme OCR
            </button>
          </div>

          {/* Indicador de Coincidencias en Tiempo Real */}
          <div className="text-[11px] text-slate-500 font-medium">
            {searchTerm ? (
              <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-semibold">
                {filteredRecords.length} {filteredRecords.length === 1 ? 'coincidencia encontrada' : 'coincidencias encontradas'}
              </span>
            ) : (
              <span>Mostrando {filteredRecords.length} de {records.length}</span>
            )}
          </div>
        </div>

      </div>

      {/* BARRA DE ACCIÓN PARA SELECCIÓN MÚLTIPLE */}
      {selectedIds.size > 0 && (
        <div className="bg-red-50 border-b border-red-200/80 px-4 py-2.5 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-red-600" />
            <span className="font-bold text-red-950 bg-red-200/80 px-2 py-0.5 rounded-full text-[11px]">
              {selectedIds.size} {selectedIds.size === 1 ? 'seleccionado' : 'seleccionados'}
            </span>
            <span className="text-red-800 hidden md:inline">
              ¿Deseas remover de la matriz los archivos seleccionados?
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-red-100 rounded text-xs font-medium transition-colors"
            >
              Cancelar selección
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar seleccionados ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabla Principal */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/80 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              
              {/* Checkbox de Selección Múltiple en Encabezado */}
              <th className="py-3 px-3 text-center w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={el => {
                    if (el) el.indeterminate = isSomeSelected;
                  }}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                  title="Seleccionar / deseleccionar todos los visibles"
                />
              </th>

              <th className="py-3 px-4">Prioridad / Estado</th>
              <th className="py-3 px-4">Archivo & Checksum</th>
              <th className="py-3 px-4 text-center">Páginas</th>
              <th className="py-3 px-4 text-center">Págs Sin OCR</th>
              <th className="py-3 px-4 text-center">Densidad</th>
              <th className="py-3 px-4">Diagnóstico Causa Raíz & Remediación</th>
              <th className="py-3 px-4 text-center">Tamaño</th>
              <th className="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  No se encontraron archivos que coincidan con los criterios de búsqueda.
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => {
                const isUrgent = !r.conforme_ocr;
                const isSelected = selectedIds.has(r.id);

                return (
                  <tr 
                    key={r.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected 
                        ? 'bg-blue-50/60 ring-1 ring-blue-500/20' 
                        : isUrgent 
                          ? 'bg-red-50/20' 
                          : ''
                    }`}
                  >
                    {/* Checkbox individual */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(r.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                      />
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(r.estado_general, r.es_duplicado)}
                    </td>

                    {/* Archivo & Hashes */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="truncate max-w-[220px]" title={r.archivo}>{r.archivo}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>SHA: {r.sha256.substring(0, 10)}...</span>
                        <button
                          onClick={() => copyToClipboard(r.sha256, r.id)}
                          title="Copiar SHA-256 completo"
                          className="hover:text-slate-700 transition-colors p-0.5"
                        >
                          {copiedHash === r.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Total Páginas */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="font-medium text-slate-800">{r.total_paginas}</span>
                    </td>

                    {/* Páginas Huérfanas (Sin OCR) */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {r.paginas_solo_imagen_sin_ocr > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-bold text-red-700 bg-red-100">
                          {r.paginas_solo_imagen_sin_ocr}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    {/* Densidad (chars/sq in) */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`font-semibold ${
                        r.promedio_densidad_chars_sq_in < 1.2 
                          ? 'text-red-600' 
                          : 'text-emerald-700'
                      }`}>
                        {r.promedio_densidad_chars_sq_in}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-0.5">c/in²</span>
                    </td>

                    {/* Causa Raíz Diagnóstica */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-slate-700 leading-snug line-clamp-2" title={r.causa_raiz}>
                        {r.causa_raiz}
                      </p>
                      <div className="text-[10px] text-blue-700 font-medium mt-0.5 flex items-center gap-1">
                        <span>Acción:</span>
                        <span className="truncate">{r.accion_requerida}</span>
                      </div>
                    </td>

                    {/* Tamaño */}
                    <td className="py-3 px-4 text-center whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {r.tamano_mb} MB
                    </td>

                    {/* Botón Acción Inspección */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectRecord(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-xs transition-colors"
                      >
                        <span>Forense</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pie de tabla con conteo */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
        <span>
          Mostrando {filteredRecords.length} de {records.length} documentos auditados
          {selectedIds.size > 0 && ` (${selectedIds.size} seleccionados)`}
        </span>
        <span className="text-[11px] text-slate-400">Ordenado por severidad de intervención</span>
      </div>

    </div>
  );
};
