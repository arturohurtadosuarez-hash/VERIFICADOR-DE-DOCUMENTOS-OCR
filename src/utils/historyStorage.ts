import { AuditSnapshot, AuditRecord, AuditKPIs } from '../types';

const STORAGE_KEY = 'audit_ocr_history_v1';
const MAX_SNAPSHOTS = 5;

/**
 * Obtiene el listado de snapshots almacenados en localStorage (máximo 5).
 */
export function getAuditHistory(): AuditSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_SNAPSHOTS) : [];
  } catch (err) {
    console.error('Error leyendo historial de auditorías de localStorage:', err);
    return [];
  }
}

/**
 * Guarda un nuevo snapshot en el historial (manteniendo los últimos 5 más recientes).
 */
export function saveAuditSnapshot(
  nombreLote: string,
  records: AuditRecord[],
  kpis: AuditKPIs
): AuditSnapshot[] {
  try {
    const history = getAuditHistory();
    const newSnapshot: AuditSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nombre_lote: nombreLote.trim() || `Lote ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      fecha: new Date().toLocaleString(),
      total_archivos: records.length,
      pct_cumplimiento: kpis.pct_cumplimiento,
      requieren_intervencion: kpis.requieren_ocr_total + kpis.requieren_ocr_parcial,
      tamano_mb: kpis.total_mb,
      records: JSON.parse(JSON.stringify(records)) // Copia profunda
    };

    // Agregar al inicio y conservar únicamente los últimos 5
    const updated = [newSnapshot, ...history.filter(h => h.id !== newSnapshot.id)].slice(0, MAX_SNAPSHOTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error guardando snapshot en localStorage:', err);
    return getAuditHistory();
  }
}

/**
 * Elimina un snapshot específico por su ID.
 */
export function deleteAuditSnapshot(id: string): AuditSnapshot[] {
  try {
    const history = getAuditHistory();
    const updated = history.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error eliminando snapshot:', err);
    return getAuditHistory();
  }
}

/**
 * Vacía todo el historial de auditorías almacenado.
 */
export function clearAllAuditHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error limpiando historial:', err);
  }
}
