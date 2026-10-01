export interface PageDetail {
  pagina: number;
  caracteres: number;
  densidad_sq_in: number;
  imagenes: number;
  dimensiones_in: string;
  estado: 'TEXTO_VALIDO' | 'SOLO_IMAGEN_SIN_OCR' | 'TEXTO_DEFICIENTE_CON_IMAGEN' | 'BAJA_DENSIDAD_TEXTUAL' | 'PAGINA_EN_BLANCO';
}

export interface ISOMetadata {
  titulo: string;
  autor: string;
  software_creador: string;
  productor_pdf: string;
  fecha_creacion: string;
  fecha_modificacion: string;
  version_formato: string;
}

export type GeneralStatus = 
  | 'CONFORME_OCR'
  | 'REQUIERE_OCR_TOTAL'
  | 'REQUIERE_OCR_PARCIAL'
  | 'TEXTO_INSUFICIENTE'
  | 'BLOQUEADO / ENCRIPTADO'
  | 'ERROR_CORRUPTO';

export interface AuditRecord {
  id: string;
  archivo: string;
  ruta_o_origen: string;
  tamano_bytes: number;
  tamano_mb: number;
  md5: string;
  sha256: string;
  estado_general: GeneralStatus;
  conforme_ocr: boolean;
  causa_raiz: string;
  accion_requerida: string;
  total_paginas: number;
  paginas_con_texto_valido: number;
  paginas_solo_imagen_sin_ocr: number;
  paginas_texto_deficiente: number;
  paginas_en_blanco: number;
  total_caracteres: number;
  promedio_chars_por_pagina: number;
  promedio_densidad_chars_sq_in: number;
  total_imagenes_embebidas: number;
  encriptado: boolean;
  permisos_lectura_extraer: boolean;
  metadatos_iso: ISOMetadata;
  detalle_paginas: PageDetail[];
  error_tecnico?: string | null;
  es_duplicado?: boolean;
  duplicado_con?: string[];
  fecha_inspeccion: string;
}

export interface AuditKPIs {
  total_pdfs: number;
  total_mb: number;
  conformes: number;
  pct_cumplimiento: number;
  requieren_ocr_total: number;
  requieren_ocr_parcial: number;
  bloqueados: number;
  total_paginas: number;
  paginas_sin_ocr: number;
  total_duplicados_grupos: number;
  total_duplicados_archivos: number;
}

export interface AuditSnapshot {
  id: string;
  nombre_lote: string;
  fecha: string;
  total_archivos: number;
  pct_cumplimiento: number;
  requieren_intervencion: number;
  tamano_mb: number;
  records: AuditRecord[];
}

