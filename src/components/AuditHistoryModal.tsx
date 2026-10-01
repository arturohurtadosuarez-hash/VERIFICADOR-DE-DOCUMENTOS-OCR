import React, { useState } from 'react';
import { 
  History, 
  X, 
  RotateCcw, 
  Trash2, 
  Save, 
  Calendar, 
  FileCheck, 
  AlertTriangle, 
  HardDrive, 
  Check, 
  Plus,
  Clock,
  Layers
} from 'lucide-react';
import { AuditSnapshot, AuditRecord, AuditKPIs } from '../types';
import confetti from 'canvas-confetti';

interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: AuditSnapshot[];
  currentRecords: AuditRecord[];
  currentKpis: AuditKPIs;
  onSaveSnapshot: (nombreLote: string) => void;
  onRestoreSnapshot: (snapshot: AuditSnapshot) => void;
  onDeleteSnapshot: (id: string) => void;
  onClearAllHistory: () => void;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  currentRecords,
  currentKpis,
  onSaveSnapshot,
  onRestoreSnapshot,
  onDeleteSnapshot,
  onClearAllHistory
}) => {
  const [newBatchName, setNewBatchName] = useState('');
  const [restoredId, setRestoredId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRecords.length === 0) return;
    onSaveSnapshot(newBatchName);
    setNewBatchName('');
  };

  const handleRestore = (snapshot: AuditSnapshot) => {
    onRestoreSnapshot(snapshot);
    setRestoredId(snapshot.id);
    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.7 }
    });
    setTimeout(() => {
      setRestoredId(null);
      onClose();
    }, 600);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header del Modal */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Historial de Auditorías
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  {history.length} / 5 Guardados
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Almacenado localmente en tu navegador. Puedes restaurar cualquier lote anterior a la matriz.
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

        {/* Cuerpo del Modal */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
          
          {/* Formulario para guardar el estado actual */}
          <form onSubmit={handleSave} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5 text-blue-600" />
              Guardar Estado Actual como Nuevo Punto de Control
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={currentRecords.length > 0 ? `Ej: Lote Contable Q3 (${currentRecords.length} docs)` : 'La matriz está vacía'}
                disabled={currentRecords.length === 0}
                value={newBatchName}
                onChange={(e) => setNewBatchName(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={currentRecords.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-xs transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Guardar Lote</span>
              </button>
            </div>
            {currentRecords.length === 0 && (
              <p className="text-[11px] text-amber-600">
                Carga o audita documentos en la matriz para poder crear un nuevo snapshot.
              </p>
            )}
          </form>

          {/* Listado de Snapshots Guardados */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Estados Anteriores Disponibles
              </span>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAllHistory}
                  className="text-[11px] text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Vaciar Todo el Historial</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">No hay auditorías guardadas aún</h4>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Guarda el lote actual con el formulario superior, o exporta un reporte en Excel/PDF para guardar un punto de control automático.
                </p>
              </div>
            ) : (
              history.map((snap) => {
                const isCompliant = snap.pct_cumplimiento >= 80;
                const isBeingRestored = restoredId === snap.id;

                return (
                  <div
                    key={snap.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isBeingRestored 
                        ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20' 
                        : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    
                    {/* Información del Lote */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate max-w-xs" title={snap.nombre_lote}>
                          {snap.nombre_lote}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isCompliant 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {snap.pct_cumplimiento}% Conforme
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{snap.fecha}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FileCheck className="w-3 h-3 text-slate-400" />
                          <span>{snap.total_archivos} PDFs</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <HardDrive className="w-3 h-3 text-slate-400" />
                          <span>{snap.tamano_mb} MB</span>
                        </span>
                        {snap.requieren_intervencion > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-red-600 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{snap.requieren_intervencion} requieren OCR</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleRestore(snap)}
                        disabled={isBeingRestored}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs active:scale-95 cursor-pointer"
                        title="Reemplazar la matriz actual con este estado"
                      >
                        {isBeingRestored ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>¡Restaurado!</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restaurar Matriz</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onDeleteSnapshot(snap.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar este lote del historial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Footer del Modal */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Los datos persisten en localStorage de forma segura
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
