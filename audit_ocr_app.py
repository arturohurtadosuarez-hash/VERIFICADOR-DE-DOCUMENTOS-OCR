#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
========================================================================================
SISTEMA INTEGRAL DE AUDITORÍA E INSPECCIÓN TÉCNICA DE CAPA OCR EN DOCUMENTOS PDF
========================================================================================
Módulos:
  - DriveConnector: Conectividad y descarga multi-fuente con Google Drive API.
  - PDFInspector: Motor de análisis profundo con PyMuPDF (fitz), cálculo de densidad
                  textual (chars/sq in), detección de imágenes huérfanas y hashes.
  - AuditReporter: Generación de logs técnicos, planillas Excel estilizadas y reportes PDF.
  - Streamlit UI & CLI: Tablero visual interactivo y modo consola para automatizaciones.
========================================================================================
"""

import os
import sys
import io
import time
import math
import hashlib
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

# Dependencias clave
try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from openpyxl import Workbook
    from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
    from openpyxl.utils.dataframe import dataframe_to_rows
except ImportError:
    Workbook = None

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
except ImportError:
    SimpleDocTemplate = None

# ==============================================================================
# CONFIGURACIÓN DEL SISTEMA DE LOGS DE AUDITORÍA
# ==============================================================================
LOG_FILENAME = "auditoria_ocr_log.log"

def setup_logger(log_file: str = LOG_FILENAME) -> logging.Logger:
    """Configura el logger técnico para registrar eventos y fallos sin romper el escaneo."""
    logger = logging.getLogger("AuditOCR")
    logger.setLevel(logging.INFO)
    
    # Evitar duplicar handlers en re-ejecuciones de Streamlit
    if not logger.handlers:
        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_formatter = logging.Formatter(
            "%(asctime)s [%(levelname)s] [Auditor] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

        console_handler = logging.StreamHandler(sys.stdout)
        console_formatter = logging.Formatter("[%(levelname)s] %(message)s")
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)
        
    return logger

logger = setup_logger()

# ==============================================================================
# CLASE 1: DriveConnector (Integración Multi-Fuente con Google Drive)
# ==============================================================================
class DriveConnector:
    """
    Gestiona la autenticación y exploración de repositorios documentales en Google Drive
    utilizando la API oficial (google-api-python-client).
    Soporta credenciales de Service Account o flujo OAuth2 de usuario.
    """

    SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

    def __init__(self, credentials_path: Optional[str] = None, is_service_account: bool = False):
        self.credentials_path = credentials_path
        self.is_service_account = is_service_account
        self.service = None
        self._authenticate()

    def _authenticate(self):
        """Inicializa el cliente de Google Drive."""
        if not self.credentials_path or not os.path.exists(self.credentials_path):
            logger.info("DriveConnector instanciado sin credenciales activas (modo local/demo).")
            return

        try:
            from googleapiclient.discovery import build
            if self.is_service_account:
                from google.oauth2 import service_account
                creds = service_account.Credentials.from_service_account_file(
                    self.credentials_path, scopes=self.SCOPES
                )
            else:
                from google_auth_oauthlib.flow import InstalledAppFlow
                from google.auth.transport.requests import Request
                import pickle
                token_file = 'token_drive.pickle'
                creds = None
                if os.path.exists(token_file):
                    with open(token_file, 'rb') as token:
                        creds = pickle.load(token)
                if not creds or not creds.valid:
                    if creds and creds.expired and creds.refresh_token:
                        creds.refresh(Request())
                    else:
                        flow = InstalledAppFlow.from_client_secrets_file(self.credentials_path, self.SCOPES)
                        creds = flow.run_local_server(port=0)
                    with open(token_file, 'wb') as token:
                        pickle.dump(creds, token)

            self.service = build('drive', 'v3', credentials=creds)
            logger.info("Autenticación con Google Drive API completada con éxito.")
        except Exception as e:
            logger.error(f"Error al autenticar con Google Drive API: {e}")
            self.service = None

    def list_pdf_files(self, folder_id: Optional[str] = None, max_results: int = 100) -> List[Dict[str, Any]]:
        """
        Lista archivos PDF en Google Drive con soporte para filtros de carpeta y paginación.
        """
        if not self.service:
            logger.warning("No hay sesión activa en Google Drive.")
            return []

        query = "mimeType = 'application/pdf' and trashed = false"
        if folder_id:
            query += f" and '{folder_id}' in parents"

        pdf_files = []
        page_token = None
        try:
            while True:
                results = self.service.files().list(
                    q=query,
                    pageSize=min(max_results - len(pdf_files), 100),
                    fields="nextPageToken, files(id, name, size, modifiedTime, md5Checksum)",
                    pageToken=page_token
                ).execute()

                items = results.get('files', [])
                pdf_files.extend(items)
                page_token = results.get('nextPageToken')

                if not page_token or len(pdf_files) >= max_results:
                    break

            logger.info(f"Google Drive: Se encontraron {len(pdf_files)} archivos PDF.")
            return pdf_files
        except Exception as e:
            logger.error(f"Error consultando archivos en Google Drive: {e}")
            return []

    def download_file_to_bytes(self, file_id: str) -> Optional[io.BytesIO]:
        """Descarga el contenido de un archivo PDF de Google Drive a memoria."""
        if not self.service:
            return None
        try:
            from googleapiclient.http import MediaIoBaseDownload
            request = self.service.files().get_media(fileId=file_id)
            file_stream = io.BytesIO()
            downloader = MediaIoBaseDownload(file_stream, request)
            done = False
            while not done:
                _, done = downloader.next_chunk()
            file_stream.seek(0)
            return file_stream
        except Exception as e:
            logger.error(f"Error descargando archivo ID {file_id} de Drive: {e}")
            return None


# ==============================================================================
# CLASE 2: PDFInspector (Motor de Verificación e Inspección Profunda)
# ==============================================================================
class PDFInspector:
    """
    Motor forense para la auditoría de documentos PDF mediante PyMuPDF (fitz).
    Calcula hashes criptográficos, extrae metadatos ISO, audita capa de texto,
    mide densidad por pulgada cuadrada y detecta imágenes huérfanas sin OCR.
    """

    # Umbrales estándar de auditoría técnica
    DEFAULT_MIN_CHARS_PER_PAGE = 80          # Mínimo de caracteres esperados en una página útil
    DEFAULT_MIN_CHARS_PER_SQ_INCH = 1.2      # Umbral de legibilidad por pulgada cuadrada (A4 ~93.5 sq in -> ~112 chars)

    def __init__(self, min_chars_per_page: int = DEFAULT_MIN_CHARS_PER_PAGE,
                 min_chars_per_sq_inch: float = DEFAULT_MIN_CHARS_PER_SQ_INCH):
        self.min_chars_per_page = min_chars_per_page
        self.min_chars_per_sq_inch = min_chars_per_sq_inch
        if fitz is None:
            logger.critical("PyMuPDF no está instalado. Ejecute: pip install PyMuPDF")

    @staticmethod
    def calculate_hashes(file_path_or_stream, chunk_size: int = 65536) -> Tuple[str, str]:
        """
        Calcula de forma eficiente (streaming) los hashes MD5 y SHA-256 para evitar
        desbordamientos de memoria en PDFs de gran tamaño.
        """
        md5_hash = hashlib.md5()
        sha256_hash = hashlib.sha256()

        if isinstance(file_path_or_stream, (str, Path)):
            with open(file_path_or_stream, 'rb') as f:
                for chunk in iter(lambda: f.read(chunk_size), b''):
                    md5_hash.update(chunk)
                    sha256_hash.update(chunk)
        elif hasattr(file_path_or_stream, 'read'):
            pos = file_path_or_stream.tell() if hasattr(file_path_or_stream, 'tell') else 0
            file_path_or_stream.seek(0)
            for chunk in iter(lambda: file_path_or_stream.read(chunk_size), b''):
                md5_hash.update(chunk)
                sha256_hash.update(chunk)
            file_path_or_stream.seek(pos)
        else:
            data = bytes(file_path_or_stream)
            md5_hash.update(data)
            sha256_hash.update(data)

        return md5_hash.hexdigest(), sha256_hash.hexdigest()

    def inspect_pdf(self, source_path_or_bytes, filename: str = "document.pdf") -> Dict[str, Any]:
        """
        Realiza la inspección exhaustiva de un archivo PDF individual.
        Retorna un diccionario detallado con diagnóstico técnico y causa raíz.
        """
        if fitz is None:
            raise RuntimeError("PyMuPDF (fitz) requerido para la inspección.")

        result = {
            "archivo": filename,
            "ruta_o_origen": str(source_path_or_bytes) if isinstance(source_path_or_bytes, (str, Path)) else "Memoria / Drive",
            "tamano_bytes": 0,
            "tamano_mb": 0.0,
            "md5": "",
            "sha256": "",
            "estado_general": "DESCONOCIDO",
            "conforme_ocr": False,
            "causa_raiz": "N/A",
            "accion_requerida": "Ninguna",
            "total_paginas": 0,
            "paginas_con_texto_valido": 0,
            "paginas_solo_imagen_sin_ocr": 0,
            "paginas_texto_deficiente": 0,
            "paginas_en_blanco": 0,
            "total_caracteres": 0,
            "promedio_chars_por_pagina": 0.0,
            "promedio_densidad_chars_sq_in": 0.0,
            "total_imagenes_embebidas": 0,
            "encriptado": False,
            "permisos_lectura_extraer": True,
            "metadatos_iso": {},
            "detalle_paginas": [],
            "error_tecnico": None
        }

        try:
            # 1. Cálculo de Hashes y Tamaño
            md5_val, sha256_val = self.calculate_hashes(source_path_or_bytes)
            result["md5"] = md5_val
            result["sha256"] = sha256_val

            if isinstance(source_path_or_bytes, (str, Path)):
                size_bytes = os.path.getsize(source_path_or_bytes)
                result["tamano_bytes"] = size_bytes
                result["tamano_mb"] = round(size_bytes / (1024 * 1024), 3)
                doc = fitz.open(source_path_or_bytes)
            else:
                if hasattr(source_path_or_bytes, 'getvalue'):
                    data = source_path_or_bytes.getvalue()
                elif hasattr(source_path_or_bytes, 'read'):
                    source_path_or_bytes.seek(0)
                    data = source_path_or_bytes.read()
                else:
                    data = source_path_or_bytes
                result["tamano_bytes"] = len(data)
                result["tamano_mb"] = round(len(data) / (1024 * 1024), 3)
                doc = fitz.open(stream=data, filetype="pdf")

            # 2. Verificación de Seguridad y Encriptación
            if doc.is_encrypted:
                result["encriptado"] = True
                # Intentar autenticar con contraseña vacía (muchos PDFs están protegidos solo contra edición)
                auth_success = doc.authenticate("")
                if not auth_success:
                    result["estado_general"] = "BLOQUEADO / ENCRIPTADO"
                    result["causa_raiz"] = "Documento protegido con contraseña de usuario o clave de cifrado."
                    result["accion_requerida"] = "Desproteger o proveer clave de descifrado previo al OCR."
                    logger.warning(f"[{filename}] PDF protegido con contraseña no accesible.")
                    doc.close()
                    return result

            # Extraer permisos técnicos
            perms = doc.permissions
            # bit 4: permitir extracción de contenido de texto y gráficos
            result["permisos_lectura_extraer"] = bool(perms & fitz.PDF_PERM_ACCESSIBILITY) if perms else True

            # 3. Metadatos ISO / XMP
            raw_meta = doc.metadata or {}
            result["metadatos_iso"] = {
                "titulo": raw_meta.get("title", "").strip() or "Sin título",
                "autor": raw_meta.get("author", "").strip() or "Desconocido",
                "software_creador": raw_meta.get("creator", "").strip() or "N/A",
                "productor_pdf": raw_meta.get("producer", "").strip() or "N/A",
                "fecha_creacion": raw_meta.get("creationDate", ""),
                "fecha_modificacion": raw_meta.get("modDate", ""),
                "version_formato": raw_meta.get("format", "PDF")
            }

            # 4. Inspección profunda página a página
            num_pages = len(doc)
            result["total_paginas"] = num_pages

            if num_pages == 0:
                result["estado_general"] = "PDF_VACIO"
                result["causa_raiz"] = "El documento no contiene páginas procesables."
                result["accion_requerida"] = "Verificar integridad del archivo de origen."
                doc.close()
                return result

            total_chars = 0
            total_sq_inches = 0.0
            total_images_in_doc = 0

            for page_index in range(num_pages):
                page = doc[page_index]
                text = page.get_text("text") or ""
                clean_text = text.strip()
                char_count = len(clean_text)
                total_chars += char_count

                # Dimensiones físicas de la página (puntos a pulgadas cuadradas: 72 puntos = 1 pulgada)
                rect = page.rect
                width_in = rect.width / 72.0
                height_in = rect.height / 72.0
                sq_inches = max(width_in * height_in, 1.0)
                total_sq_inches += sq_inches

                density = char_count / sq_inches

                # Análisis de imágenes embebidas
                image_list = page.get_images(full=True)
                img_count = len(image_list)
                total_images_in_doc += img_count

                # Clasificación de la página
                page_status = "TEXTO_VALIDO"
                if char_count == 0 and img_count > 0:
                    page_status = "SOLO_IMAGEN_SIN_OCR"
                    result["paginas_solo_imagen_sin_ocr"] += 1
                elif char_count == 0 and img_count == 0:
                    page_status = "PAGINA_EN_BLANCO"
                    result["paginas_en_blanco"] += 1
                elif char_count < self.min_chars_per_page or density < self.min_chars_per_sq_inch:
                    # Si tiene imágenes y poco texto, muy probablemente sea un encabezado o membrete
                    if img_count > 0:
                        page_status = "TEXTO_DEFICIENTE_CON_IMAGEN"
                    else:
                        page_status = "BAJA_DENSIDAD_TEXTUAL"
                    result["paginas_texto_deficiente"] += 1
                else:
                    result["paginas_con_texto_valido"] += 1

                result["detalle_paginas"].append({
                    "pagina": page_index + 1,
                    "caracteres": char_count,
                    "densidad_sq_in": round(density, 2),
                    "imagenes": img_count,
                    "dimensiones_in": f"{round(width_in, 1)}x{round(height_in, 1)}",
                    "estado": page_status
                })

            result["total_caracteres"] = total_chars
            result["total_imagenes_embebidas"] = total_images_in_doc
            result["promedio_chars_por_pagina"] = round(total_chars / num_pages, 1)
            result["promedio_densidad_chars_sq_in"] = round(total_chars / total_sq_inches, 2) if total_sq_inches > 0 else 0.0

            # 5. Diagnóstico de Cumplimiento OCR y Causa Raíz
            if result["paginas_solo_imagen_sin_ocr"] == num_pages:
                result["estado_general"] = "REQUIERE_OCR_TOTAL"
                result["conforme_ocr"] = False
                result["causa_raiz"] = "Documento escaneado al 100%: Solo contiene imágenes sin capa de texto subyacente."
                result["accion_requerida"] = "Procesar con motor OCR (Tesseract / Cloud Vision) completo."
            elif result["paginas_solo_imagen_sin_ocr"] > 0 or result["paginas_texto_deficiente"] > (num_pages * 0.3):
                result["estado_general"] = "REQUIERE_OCR_PARCIAL"
                result["conforme_ocr"] = False
                reasons = []
                if result["paginas_solo_imagen_sin_ocr"] > 0:
                    reasons.append(f"{result['paginas_solo_imagen_sin_ocr']} página(s) son imágenes puras sin texto")
                if result["paginas_texto_deficiente"] > 0:
                    reasons.append(f"{result['paginas_texto_deficiente']} página(s) tienen densidad textual bajo el umbral ({self.min_chars_per_sq_inch} c/in²)")
                result["causa_raiz"] = "Documento mixto: " + "; ".join(reasons) + "."
                result["accion_requerida"] = "Re-OCRizar páginas identificadas o re-escanear anexos."
            elif result["total_caracteres"] < (self.min_chars_per_page * num_pages * 0.5):
                result["estado_general"] = "TEXTO_INSUFICIENTE"
                result["conforme_ocr"] = False
                result["causa_raiz"] = f"Densidad promedio global deficiente ({result['promedio_densidad_chars_sq_in']} c/in²). Posible OCR fallido o corrupto."
                result["accion_requerida"] = "Inspeccionar manualmente y aplicar OCR de alta precisión."
            else:
                result["estado_general"] = "CONFORME_OCR"
                result["conforme_ocr"] = True
                result["causa_raiz"] = "Capa de texto íntegra y legible. Supera los umbrales de densidad ISO."
                result["accion_requerida"] = "Ninguna. Apto para indexación y búsqueda documental."

            doc.close()
            logger.info(f"[{filename}] Auditoría completada: {result['estado_general']} ({result['total_paginas']} págs).")
            return result

        except Exception as e:
            error_msg = f"Error crítico al inspeccionar {filename}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            result["estado_general"] = "ERROR_CORRUPTO"
            result["conforme_ocr"] = False
            result["causa_raiz"] = f"Archivo corrupto o formato no compatible: {str(e)}"
            result["accion_requerida"] = "Verificar origen del archivo o reparar cabecera PDF."
            result["error_tecnico"] = str(e)
            return result

    def scan_directory(self, folder_path: str, recursive: bool = True) -> List[Dict[str, Any]]:
        """
        Escanea recursivamente una ruta local o carpeta compartida de red (SMB/NFS)
        analizando cada PDF encontrado mediante pathlib / os.walk.
        """
        base_path = Path(folder_path)
        if not base_path.exists() or not base_path.is_dir():
            logger.error(f"La ruta especificada no existe o no es un directorio: {folder_path}")
            return []

        pattern = "**/*.pdf" if recursive else "*.pdf"
        pdf_paths = [p for p in base_path.glob(pattern) if p.is_file() and not p.name.startswith("._")]
        logger.info(f"Iniciando escaneo de {len(pdf_paths)} archivos PDF en: {folder_path}")

        results = []
        for p in pdf_paths:
            try:
                res = self.inspect_pdf(p, filename=p.name)
                results.append(res)
            except Exception as e:
                logger.error(f"Fallo imprevisto procesando {p.name}: {e}")
                results.append({
                    "archivo": p.name,
                    "ruta_o_origen": str(p),
                    "estado_general": "ERROR_DESCONOCIDO",
                    "conforme_ocr": False,
                    "causa_raiz": str(e),
                    "accion_requerida": "Revisar log técnico.",
                    "total_paginas": 0
                })

        return results


# ==============================================================================
# CLASE 3: AuditReporter (Generación de Entregables, Excel y Reporte PDF)
# ==============================================================================
class AuditReporter:
    """
    Compila los resultados de auditoría, detecta duplicados por checksums
    y genera entregables ejecutivos en formatos Excel (.xlsx) y PDF formal.
    """

    @staticmethod
    def identify_duplicates(audit_results: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Identifica archivos duplicados agrupados por su checksum SHA-256."""
        hashes = {}
        for item in audit_results:
            sha = item.get("sha256")
            name = item.get("archivo")
            if sha and sha != "":
                hashes.setdefault(sha, []).append(name)
        
        duplicates = {sha: files for sha, files in hashes.items() if len(files) > 1}
        return duplicates

    @staticmethod
    def generate_kpis(audit_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calcula los indicadores clave de desempeño (KPIs) de la auditoría."""
        total = len(audit_results)
        if total == 0:
            return {
                "total_pdfs": 0, "total_mb": 0.0, "conformes": 0, "pct_cumplimiento": 0.0,
                "requieren_ocr_total": 0, "requieren_ocr_parcial": 0, "bloqueados": 0,
                "total_paginas": 0, "paginas_sin_ocr": 0, "total_duplicados": 0
            }

        conformes = sum(1 for r in audit_results if r.get("conforme_ocr") is True)
        ocr_total = sum(1 for r in audit_results if r.get("estado_general") == "REQUIERE_OCR_TOTAL")
        ocr_parcial = sum(1 for r in audit_results if r.get("estado_general") == "REQUIERE_OCR_PARCIAL")
        bloqueados = sum(1 for r in audit_results if r.get("estado_general") in ["BLOQUEADO / ENCRIPTADO", "ERROR_CORRUPTO"])
        total_mb = sum(r.get("tamano_mb", 0.0) for r in audit_results)
        total_pags = sum(r.get("total_paginas", 0) for r in audit_results)
        pags_sin_ocr = sum(r.get("paginas_solo_imagen_sin_ocr", 0) for r in audit_results)
        
        dups = AuditReporter.identify_duplicates(audit_results)
        total_dup_files = sum(len(f) for f in dups.values())

        return {
            "total_pdfs": total,
            "total_mb": round(total_mb, 2),
            "conformes": conformes,
            "pct_cumplimiento": round((conformes / total) * 100, 1),
            "requieren_ocr_total": ocr_total,
            "requieren_ocr_parcial": ocr_parcial,
            "bloqueados": bloqueados,
            "total_paginas": total_pags,
            "paginas_sin_ocr": pags_sin_ocr,
            "total_duplicados_grupos": len(dups),
            "total_duplicados_archivos": total_dup_files
        }

    @staticmethod
    def to_dataframe(audit_results: List[Dict[str, Any]]) -> "pd.DataFrame":
        """Convierte los resultados en un DataFrame optimizado y ordenado por prioridad de intervención."""
        if pd is None:
            raise RuntimeError("pandas no está disponible.")

        flat_data = []
        for r in audit_results:
            meta = r.get("metadatos_iso", {})
            flat_data.append({
                "Prioridad": 1 if not r.get("conforme_ocr") else 2,
                "Archivo": r.get("archivo"),
                "Estado General": r.get("estado_general"),
                "Cumple OCR": "SÍ" if r.get("conforme_ocr") else "NO",
                "Causa Raíz Diagnóstica": r.get("causa_raiz"),
                "Acción Requerida": r.get("accion_requerida"),
                "Páginas": r.get("total_paginas"),
                "Págs Solo Imagen (Sin OCR)": r.get("paginas_solo_imagen_sin_ocr"),
                "Págs Densidad Deficiente": r.get("paginas_texto_deficiente"),
                "Caracteres Totales": r.get("total_caracteres"),
                "Densidad (c/in²)": r.get("promedio_densidad_chars_sq_in"),
                "Tamaño (MB)": r.get("tamano_mb"),
                "Imágenes Embebidas": r.get("total_imagenes_embebidas"),
                "Encriptado": "SÍ" if r.get("encriptado") else "NO",
                "SHA-256": r.get("sha256"),
                "MD5": r.get("md5"),
                "Software Creador": meta.get("software_creador", ""),
                "Productor PDF": meta.get("productor_pdf", ""),
                "Ruta / Origen": r.get("ruta_o_origen")
            })

        df = pd.DataFrame(flat_data)
        # Priorizar primero los que NO cumplen OCR y que requieren intervención urgente
        if not df.empty and "Prioridad" in df.columns:
            df = df.sort_values(by=["Prioridad", "Págs Solo Imagen (Sin OCR)"], ascending=[True, False]).drop(columns=["Prioridad"])
        return df

    @classmethod
    def export_excel(cls, audit_results: List[Dict[str, Any]], output_path: str = "reporte_auditoria_ocr.xlsx") -> str:
        """
        Genera un archivo Excel profesional con hoja de resumen ejecutivo y hoja de detalle,
        aplicando estilos corporativos y formato condicional según el estado de cada PDF.
        """
        if Workbook is None or pd is None:
            raise RuntimeError("openpyxl y pandas son necesarios para exportar a Excel.")

        kpis = cls.generate_kpis(audit_results)
        df_detail = cls.to_dataframe(audit_results)

        wb = Workbook()
        # Hoja 1: Resumen Ejecutivo
        ws_kpi = wb.active
        ws_kpi.title = "Resumen Ejecutivo"
        ws_kpi.views.sheetView[0].showGridLines = True

        # Estilos
        navy_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
        white_bold = Font(name="Calibri", size=14, bold=True, color="FFFFFF")
        title_font = Font(name="Calibri", size=16, bold=True, color="0F172A")
        sub_font = Font(name="Calibri", size=10, italic=True, color="475569")
        bold_font = Font(name="Calibri", size=11, bold=True)
        thin_border = Border(
            left=Side(style='thin', color="CBD5E1"),
            right=Side(style='thin', color="CBD5E1"),
            top=Side(style='thin', color="CBD5E1"),
            bottom=Side(style='thin', color="CBD5E1")
        )

        # Encabezado
        ws_kpi.merge_cells("A1:E1")
        ws_kpi["A1"] = "INFORME CONSOLIDADO DE AUDITORÍA OCR Y CALIDAD DOCUMENTAL"
        ws_kpi["A1"].font = title_font
        ws_kpi["A2"] = f"Generado el: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Norma ISO 32000-1 / Densidad Textual"
        ws_kpi["A2"].font = sub_font

        # Tabla de Métricas
        metrics = [
            ("Total de Archivos PDF Auditados", kpis["total_pdfs"]),
            ("Volumen Total Analizado (MB)", f"{kpis['total_mb']} MB"),
            ("Índice Global de Cumplimiento OCR", f"{kpis['pct_cumplimiento']}%"),
            ("Archivos Conformes (OCR Válido)", kpis["conformes"]),
            ("Archivos con Intervención Crítica (Requieren OCR Total)", kpis["requieren_ocr_total"]),
            ("Archivos con Intervención Parcial (Páginas Mixtas)", kpis["requieren_ocr_parcial"]),
            ("Archivos Bloqueados / Encriptados / Corruptos", kpis["bloqueados"]),
            ("Total de Páginas Inspeccionadas", kpis["total_paginas"]),
            ("Total de Páginas Huérfanas (Solo Imagen sin OCR)", kpis["paginas_sin_ocr"]),
            ("Grupos de Archivos Duplicados Identificados (por SHA-256)", kpis["total_duplicados_grupos"])
        ]

        ws_kpi["A4"] = "Indicador Clave de Auditoría (KPI)"
        ws_kpi["B4"] = "Valor Registrado"
        ws_kpi["A4"].fill = navy_fill
        ws_kpi["B4"].fill = navy_fill
        ws_kpi["A4"].font = Font(color="FFFFFF", bold=True)
        ws_kpi["B4"].font = Font(color="FFFFFF", bold=True)

        for i, (label, val) in enumerate(metrics, start=5):
            ws_kpi[f"A{i}"] = label
            ws_kpi[f"B{i}"] = val
            ws_kpi[f"A{i}"].border = thin_border
            ws_kpi[f"B{i}"].border = thin_border
            ws_kpi[f"A{i}"].font = bold_font

        ws_kpi.column_dimensions["A"].width = 52
        ws_kpi.column_dimensions["B"].width = 24

        # Hoja 2: Detalle Técnico
        ws_detail = wb.create_sheet(title="Detalle de Auditoría")
        ws_detail.views.sheetView[0].showGridLines = True

        header_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
        header_font = Font(color="FFFFFF", bold=True, size=10)

        # Fills condicionales
        red_fill = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid")      # Requiere OCR Total
        amber_fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")    # Requiere OCR Parcial
        green_fill = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid")    # Conforme
        gray_fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")     # Error / Bloqueado

        for r_idx, row in enumerate(dataframe_to_rows(df_detail, index=False, header=True), 1):
            ws_detail.append(row)
            for c_idx in range(1, len(row) + 1):
                cell = ws_detail.cell(row=r_idx, column=c_idx)
                cell.border = thin_border
                if r_idx == 1:
                    cell.fill = header_fill
                    cell.font = header_font
                    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
                else:
                    estado = str(ws_detail.cell(row=r_idx, column=2).value or "")
                    if "REQUIERE_OCR_TOTAL" in estado:
                        cell.fill = red_fill
                    elif "REQUIERE_OCR_PARCIAL" in estado or "TEXTO_INSUFICIENTE" in estado:
                        cell.fill = amber_fill
                    elif "CONFORME_OCR" in estado:
                        cell.fill = green_fill
                    elif "BLOQUEADO" in estado or "ERROR" in estado:
                        cell.fill = gray_fill

        # Autoajuste de columnas
        for col in ws_detail.columns:
            max_len = max(len(str(cell.value or "")) for cell in col)
            col_letter = col[0].column_letter
            ws_detail.column_dimensions[col_letter].width = min(max(max_len + 3, 12), 48)

        # Congelar paneles y habilitar auto-filtro
        ws_detail.freeze_panes = "C2"
        ws_detail.auto_filter.ref = f"A1:R{len(df_detail) + 1}"

        # Hoja 3: Plan de Remediación para No Conformes
        non_compliant_files = [r for r in audit_results if not r.get("conforme_ocr")]
        if non_compliant_files:
            ws_rem = wb.create_sheet(title="Plan de Remediación")
            ws_rem.views.sheetView[0].showGridLines = True
            
            rem_title = ws_rem.cell(row=1, column=1, value="PLAN DE REMEDIACIÓN Y COMANDOS DE ACCIÓN CORRECTIVA")
            rem_title.font = Font(name="Calibri", size=13, bold=True, color="FFFFFF")
            rem_title.fill = PatternFill(start_color="DC2626", end_color="DC2626", fill_type="solid")
            ws_rem.merge_cells("A1:E1")
            ws_rem.row_dimensions[1].height = 28

            rem_headers = ["N°", "Archivo No Conforme", "Estado General", "Páginas Afectadas", "Comando Sugerido (OCRmyPDF)"]
            ws_rem.append(rem_headers)
            ws_rem.row_dimensions[2].height = 22
            for col_i in range(1, 6):
                c = ws_rem.cell(row=2, column=col_i)
                c.fill = header_fill
                c.font = header_font
                c.alignment = Alignment(horizontal="center", vertical="center")
                c.border = thin_border

            for idx_nc, r_nc in enumerate(non_compliant_files, 1):
                cmd_suggested = f'ocrmypdf --skip-text --deskew -l spa "{r_nc.get("archivo")}" "remediado_{r_nc.get("archivo")}"'
                ws_rem.append([
                    idx_nc,
                    r_nc.get("archivo"),
                    r_nc.get("estado_general"),
                    f'{r_nc.get("paginas_solo_imagen_sin_ocr", 0)} de {r_nc.get("total_paginas", 0)} págs',
                    cmd_suggested
                ])
                curr_row = idx_nc + 2
                ws_rem.row_dimensions[curr_row].height = 20
                for col_i in range(1, 6):
                    c = ws_rem.cell(row=curr_row, column=col_i)
                    c.border = thin_border
                    if col_i == 1:
                        c.alignment = Alignment(horizontal="center")
                    elif col_i == 5:
                        c.font = Font(name="Consolas", size=9, color="047857")

            ws_rem.column_dimensions["A"].width = 6
            ws_rem.column_dimensions["B"].width = 38
            ws_rem.column_dimensions["C"].width = 24
            ws_rem.column_dimensions["D"].width = 18
            ws_rem.column_dimensions["E"].width = 65

        wb.save(output_path)
        logger.info(f"Reporte Excel generado con éxito en: {output_path}")
        return output_path

    @classmethod
    def export_pdf_report(cls, audit_results: List[Dict[str, Any]], output_pdf_path: str = "reporte_auditoria_consolidado.pdf") -> str:
        """
        Genera un informe formal en PDF de alta calidad corporativa utilizando ReportLab
        con numeración 'Página X de Y', tarjeta de scorecard, tabla estilizada y sellos.
        """
        if SimpleDocTemplate is None:
            raise RuntimeError("ReportLab es necesario para generar el reporte PDF.")

        from reportlab.pdfgen import canvas

        class NumberedCanvas(canvas.Canvas):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self._saved_page_states = []

            def showPage(self):
                self._saved_page_states.append(dict(self.__dict__))
                self._startPage()

            def save(self):
                num_pages = len(self._saved_page_states)
                for state in self._saved_page_states:
                    self.__dict__.update(state)
                    self.draw_page_number(num_pages)
                    super().showPage()
                super().save()

            def draw_page_number(self, page_count):
                self.saveState()
                self.setFont("Helvetica", 7)
                self.setFillColor(colors.HexColor("#94A3B8"))
                # Línea superior de cabecera en páginas posteriores
                if self._pageNumber > 1:
                    self.setStrokeColor(colors.HexColor("#E2E8F0"))
                    self.setLineWidth(0.5)
                    self.line(36, 756, 576, 756)
                    self.drawString(36, 762, "AuditOCR Enterprise • Dictamen Técnico de Inspección Digital")
                # Pie de página en todas las páginas
                self.setStrokeColor(colors.HexColor("#CBD5E1"))
                self.setLineWidth(0.5)
                self.line(36, 42, 576, 42)
                self.drawString(36, 30, "Documento Confidencial • Conforme a Norma Internacional ISO 32000-1")
                self.drawRightString(576, 30, f"Página {self._pageNumber} de {page_count}")
                self.restoreState()

        kpis = cls.generate_kpis(audit_results)
        doc = SimpleDocTemplate(
            output_pdf_path,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=44,
            bottomMargin=48
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#0F172A"),
            fontName="Helvetica-Bold",
            spaceAfter=3
        )
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Normal'],
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#64748B"),
            spaceAfter=12
        )
        section_style = ParagraphStyle(
            'SectionStyle',
            parent=styles['Heading2'],
            fontSize=10.5,
            leading=14,
            textColor=colors.HexColor("#0F172A"),
            fontName="Helvetica-Bold",
            spaceBefore=10,
            spaceAfter=5
        )
        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['Normal'],
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor("#334155")
        )

        elements = []

        # Título
        elements.append(Paragraph("DICTAMEN OFICIAL DE AUDITORÍA FORENSE OCR", title_style))
        elements.append(Paragraph(f"Norma ISO 32000-1 | Emisión: {datetime.now().strftime('%d/%m/%Y %H:%M')} | Custodia y Calidad Digital", subtitle_style))

        # Tabla de KPIs / Scorecard
        is_healthy = kpis["pct_cumplimiento"] >= 80
        status_text = "CONFORME ISO" if is_healthy else "ATENCIÓN REQUERIDA"
        status_color = colors.HexColor("#166534") if is_healthy else colors.HexColor("#991B1B")

        kpi_data = [
            ["MÉTRICA DE AUDITORÍA", "VALOR REGISTRADO", "MÉTRICA DE AUDITORÍA", "VALOR REGISTRADO"],
            ["Total PDFs Inspeccionados", f"{kpis['total_pdfs']} archivos", "Volumen Total Analizado", f"{kpis['total_mb']} MB"],
            ["Índice Cumplimiento OCR", f"{kpis['pct_cumplimiento']}%", "Total Páginas Inspeccionadas", f"{kpis['total_paginas']} págs"],
            ["Documentos Conformes", f"{kpis['conformes']} aptos", "Páginas Solo Imagen (Huérfanas)", f"{kpis['paginas_sin_ocr']} págs"],
            ["Requieren OCR Total", f"{kpis['requieren_ocr_total']} críticos", "Dictamen Técnico Global", status_text]
        ]

        t_kpi = Table(kpi_data, colWidths=[2.2 * inch, 1.4 * inch, 2.1 * inch, 1.5 * inch])
        t_kpi.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0F172A")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (1, 1), (1, -1), 'CENTER'),
            ('ALIGN', (3, 1), (3, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#F8FAFC"), colors.white]),
            ('TEXTCOLOR', (3, 4), (3, 4), status_color),
            ('FONTNAME', (3, 4), (3, 4), 'Helvetica-Bold')
        ]))
        elements.append(t_kpi)
        elements.append(Spacer(1, 12))

        # Hallazgos Críticos (Archivos que requieren intervención)
        elements.append(Paragraph("DOCUMENTOS QUE REQUIEREN INTERVENCIÓN / OCRización URGENTE", section_style))

        non_compliant = [r for r in audit_results if not r.get("conforme_ocr")]
        if not non_compliant:
            elements.append(Paragraph("<b>CERTIFICACIÓN DE CONFORMIDAD:</b> Todos los archivos analizados superan el 100% de los requerimientos de legibilidad y densidad textual establecidos por la norma ISO 32000-1.", body_style))
        else:
            table_rows = [["N°", "Archivo", "Estado", "Págs", "Sin OCR", "Causa Raíz Diagnóstica & Acción"]]
            for idx, r in enumerate(non_compliant[:30], 1):
                table_rows.append([
                    str(idx),
                    Paragraph(f"<b>{r.get('archivo', '')[:30]}</b>", body_style),
                    Paragraph(f"<font color='#B91C1C'><b>{r.get('estado_general', '').replace('REQUIERE_', '')}</b></font>", body_style),
                    str(r.get("total_paginas", 0)),
                    str(r.get("paginas_solo_imagen_sin_ocr", 0)),
                    Paragraph(f"{r.get('causa_raiz', '')}<br/><font color='#1D4ED8'><b>Acción:</b> {r.get('accion_requerida', '')}</font>", body_style)
                ])

            t_issues = Table(table_rows, colWidths=[0.3 * inch, 1.8 * inch, 1.2 * inch, 0.5 * inch, 0.6 * inch, 2.8 * inch])
            t_issues.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 7),
                ('ALIGN', (0, 0), (0, -1), 'CENTER'),
                ('ALIGN', (3, 0), (4, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#FFF5F5"), colors.white]),
                ('VALIGN', (0, 0), (-1, -1), 'TOP')
            ]))
            elements.append(t_issues)

        # Sello de Auditoría
        elements.append(Spacer(1, 18))
        sign_block = [
            ["__________________________________________", "__________________________________________"],
            ["Auditor Líder de Preservación Digital", "Supervisor de Calidad y Sistemas Documentales"],
            ["Firma Digital y Certificado Criptográfico SHA-256", "Fecha de Validación y Depósito Legal"]
        ]
        t_sign = Table(sign_block, colWidths=[3.6 * inch, 3.6 * inch])
        t_sign.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTSIZE', (0, 0), (-1, -1), 7.5),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor("#64748B")),
        ]))
        elements.append(KeepTogether(t_sign))

        doc.build(elements, canvasmaker=NumberedCanvas)
        logger.info(f"Reporte formal PDF emitido en: {output_pdf_path}")
        return output_pdf_path


# ==============================================================================
# CLASE 4: Interfaz Streamlit (Dashboard Visual Interactivo)
# ==============================================================================
def run_streamlit_dashboard():
    """Ejecuta la interfaz web interactiva con Streamlit."""
    import streamlit as st

    st.set_page_config(
        page_title="AuditOCR - Inspección Forense de PDFs",
        page_icon="🔍",
        layout="wide"
    )

    st.markdown("""
        <style>
            .metric-card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 16px;
                text-align: center;
            }
            .stDataFrame { border-radius: 8px; }
        </style>
    """, unsafe_allow_html=True)

    st.title("🔍 Sistema de Auditoría e Inspección Técnica OCR")
    st.caption("Verificación forense de capa de texto, densidad tipográfica (c/in²), páginas huérfanas y metadatos ISO.")

    # Sidebar - Configuración
    with st.sidebar:
        st.header("⚙️ Parámetros de Inspección")
        source_mode = st.radio(
            "Origen de Datos:",
            ["Directorio Local / Red", "Archivos Subidos (Upload)", "Google Drive API"]
        )

        min_chars_sq_in = st.slider(
            "Umbral Mínimo Densidad (caracteres / in²):",
            min_value=0.5, max_value=5.0, value=1.2, step=0.1,
            help="Un folio A4 promedio tiene 93.5 in². 1.2 c/in² equivale a ~112 caracteres por página."
        )

        min_chars_page = st.number_input(
            "Mínimo Caracteres por Página:",
            min_value=10, max_value=500, value=80, step=10
        )

        st.divider()
        st.markdown("### 📋 Conexión Google Drive")
        drive_creds = st.file_uploader("Subir service_account.json (Opcional):", type=["json"])
        drive_folder_id = st.text_input("Folder ID de Drive (Opcional):", placeholder="1A2B3C4D...")

    inspector = PDFInspector(min_chars_per_page=min_chars_page, min_chars_per_sq_inch=min_chars_sq_in)
    audit_results = []

    # Ejecución según modo
    if source_mode == "Directorio Local / Red":
        local_path = st.text_input("Ruta local o volumen de red (SMB/NFS):", value=".")
        col_btn, _ = st.columns([1, 4])
        with col_btn:
            run_scan = st.button("🚀 Iniciar Auditoría Local", use_container_width=True)
        if run_scan:
            with st.spinner("Inspeccionando archivos PDF recursivamente..."):
                audit_results = inspector.scan_directory(local_path)
                st.session_state["audit_results"] = audit_results

    elif source_mode == "Archivos Subidos (Upload)":
        uploaded_files = st.file_uploader("Arrastra uno o varios archivos PDF:", type=["pdf"], accept_multiple_files=True)
        if uploaded_files:
            if st.button("🚀 Analizar Archivos Cargados"):
                with st.spinner("Auditando capa OCR en memoria..."):
                    results = []
                    for up_file in uploaded_files:
                        res = inspector.inspect_pdf(up_file.getvalue(), filename=up_file.name)
                        results.append(res)
                    audit_results = results
                    st.session_state["audit_results"] = audit_results

    elif source_mode == "Google Drive API":
        st.info("Para conectar con Google Drive cargue sus credenciales de Service Account en el panel lateral.")
        if st.button("🔗 Conectar y Explorar Drive"):
            if not drive_creds:
                st.error("Debe cargar un archivo de credenciales JSON válido de Google Drive.")
            else:
                import tempfile
                with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as tmp:
                    tmp.write(drive_creds.getvalue())
                    tmp_path = tmp.name
                connector = DriveConnector(credentials_path=tmp_path, is_service_account=True)
                drive_files = connector.list_pdf_files(folder_id=drive_folder_id or None, max_results=30)
                st.write(f"Se encontraron {len(drive_files)} archivos en Google Drive.")
                results = []
                prog = st.progress(0)
                for idx, df_file in enumerate(drive_files):
                    stream = connector.download_file_to_bytes(df_file['id'])
                    if stream:
                        res = inspector.inspect_pdf(stream, filename=df_file['name'])
                        results.append(res)
                    prog.progress((idx + 1) / len(drive_files))
                audit_results = results
                st.session_state["audit_results"] = audit_results

    # Si hay resultados en sesión, renderizar Dashboard
    cached_results = st.session_state.get("audit_results", audit_results)

    if cached_results:
        kpis = AuditReporter.generate_kpis(cached_results)
        df = AuditReporter.to_dataframe(cached_results)

        st.divider()

        # Métricas principales (KPIs)
        kpi_col1, kpi_col2, kpi_col3, kpi_col4, kpi_col5 = st.columns(5)
        kpi_col1.metric("Total PDFs", kpis["total_pdfs"])
        kpi_col2.metric("Cumplimiento OCR", f"{kpis['pct_cumplimiento']}%")
        kpi_col3.metric("Requieren Intervención", kpis["requieren_ocr_total"] + kpis["requieren_ocr_parcial"])
        kpi_col4.metric("Volumen Analizado", f"{kpis['total_mb']} MB")
        kpi_col5.metric("Págs Huérfanas (Sin OCR)", kpis["paginas_sin_ocr"])

        col_hdr1, col_hdr2 = st.columns([4, 1.2])
        with col_hdr1:
            st.subheader("📋 Matriz de Auditoría e Inspección")
            st.caption("Ordenada por prioridad: Primero los documentos que requieren OCRización con diagnóstico de causa raíz.")
        with col_hdr2:
            if st.button("🗑️ Limpiar Matriz", use_container_width=True, help="Vaciar la matriz de auditoría de la sesión actual"):
                st.session_state["audit_results"] = []
                st.rerun()

        # Filtros rápidos
        filter_status = st.multiselect(
            "Filtrar por Estado:",
            options=df["Estado General"].unique(),
            default=df["Estado General"].unique()
        )
        filtered_df = df[df["Estado General"].isin(filter_status)]

        st.dataframe(filtered_df, use_container_width=True, height=360)

        # Botones de Descarga de Entregables
        st.subheader("📥 Exportación de Entregables de Auditoría")
        exp_col1, exp_col2, exp_col3 = st.columns(3)

        with exp_col1:
            excel_path = "auditoria_ocr_reporte.xlsx"
            AuditReporter.export_excel(cached_results, excel_path)
            with open(excel_path, "rb") as f:
                st.download_button(
                    label="📊 Descargar Matriz Completa en Excel (.xlsx)",
                    data=f,
                    file_name=f"Auditoria_OCR_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx",
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    use_container_width=True
                )

        with exp_col2:
            pdf_path = "reporte_auditoria_consolidado.pdf"
            AuditReporter.export_pdf_report(cached_results, pdf_path)
            with open(pdf_path, "rb") as f:
                st.download_button(
                    label="📄 Descargar Dictamen Formal en PDF (.pdf)",
                    data=f,
                    file_name=f"Dictamen_Auditoria_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf",
                    mime="application/pdf",
                    use_container_width=True
                )

        with exp_col3:
            if os.path.exists(LOG_FILENAME):
                with open(LOG_FILENAME, "rb") as f:
                    st.download_button(
                        label="📝 Descargar Log Técnico (auditoria_ocr_log.log)",
                        data=f,
                        file_name=LOG_FILENAME,
                        mime="text/plain",
                        use_container_width=True
                    )


# ==============================================================================
# MODO CLI / LÍNEA DE COMANDOS (Para ejecución headless o en servidores)
# ==============================================================================
def run_cli_mode():
    """Ejecuta la auditoría en modo batch desde la terminal sin interfaz gráfica."""
    import argparse
    parser = argparse.ArgumentParser(description="AuditOCR: Auditoría e Inspección Forense de PDFs")
    parser.add_argument("--source", type=str, default=".", help="Ruta de directorio local a inspeccionar.")
    parser.add_argument("--output_excel", type=str, default="auditoria_reporte.xlsx", help="Ruta de salida para Excel.")
    parser.add_argument("--output_pdf", type=str, default="auditoria_reporte.pdf", help="Ruta de salida para informe PDF.")
    parser.add_argument("--min_density", type=float, default=1.2, help="Densidad mínima caracteres/pulgada cuadrada.")
    parser.add_argument("--min_chars", type=int, default=80, help="Mínimo de caracteres esperados por página.")
    args = parser.parse_args()

    print("\n" + "="*70)
    print(" 🔍 SUITE DE AUDITORÍA E INSPECCIÓN FORENSE OCR - MODO BATCH CLI")
    print("="*70)
    print(f"Directorio objetivo: {args.source}")
    print(f"Umbral de densidad: {args.min_density} c/in² | Mínimo chars/pág: {args.min_chars}")

    inspector = PDFInspector(min_chars_per_page=args.min_chars, min_chars_per_sq_inch=args.min_density)
    results = inspector.scan_directory(args.source)

    if not results:
        print("⚠️ No se encontraron archivos PDF o el directorio está vacío.")
        sys.exit(0)

    kpis = AuditReporter.generate_kpis(results)
    print("\n--- RESUMEN DE INDICADORES (KPIs) ---")
    print(f"Total PDFs Analizados:       {kpis['total_pdfs']}")
    print(f"Volumen Procesado:           {kpis['total_mb']} MB")
    print(f"Índice de Cumplimiento OCR:  {kpis['pct_cumplimiento']}%")
    print(f"Requieren OCR Total:         {kpis['requieren_ocr_total']}")
    print(f"Requieren OCR Parcial:       {kpis['requieren_ocr_parcial']}")
    print(f"Páginas Huérfanas (Sin OCR): {kpis['paginas_sin_ocr']}")
    print(f"Duplicados Identificados:    {kpis['total_duplicados_archivos']} en {kpis['total_duplicados_grupos']} grupos.")

    # Generación de reportes
    AuditReporter.export_excel(results, args.output_excel)
    AuditReporter.export_pdf_report(results, args.output_pdf)
    print(f"\n✅ Excel exportado: {args.output_excel}")
    print(f"✅ PDF exportado:   {args.output_pdf}")
    print(f"✅ Log técnico:     {LOG_FILENAME}\n")


# ==============================================================================
# PUNTO DE ENTRADA PRINCIPAL
# ==============================================================================
if __name__ == "__main__":
    # Si se ejecuta con `streamlit run audit_ocr_app.py`, corre la interfaz web
    # Si se pasan banderas CLI como `--source`, se activa el modo por consola
    if len(sys.argv) > 1 and ("--source" in sys.argv or "--cli" in sys.argv or "--help" in sys.argv):
        run_cli_mode()
    else:
        try:
            import streamlit as st
            run_streamlit_dashboard()
        except ImportError:
            print("Streamlit no detectado en el entorno. Ejecutando en modo consola (CLI)...")
            run_cli_mode()
