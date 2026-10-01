# Guía de Instalación, Configuración y Despliegue: Suite de Auditoría OCR

Este documento detalla los pasos para desplegar, ejecutar y automatizar el software de **Auditoría e Inspección OCR de Archivos PDF** tanto en entornos locales (Windows, macOS, Linux) como en servidores de producción / cloud.

---

## 1. Requisitos Previos del Sistema

- **Python 3.9, 3.10, 3.11 o 3.12** instalado.
- Gestor de paquetes `pip` y soporte para entornos virtuales `venv`.
- Dependencias de sistema para PyMuPDF (en distribuciones Linux mínimas como Ubuntu Server):
  ```bash
  sudo apt-get update && sudo apt-get install -y build-essential python3-dev
  ```

---

## 2. Instalación Paso a Paso

### Paso 1: Clonar o descargar los archivos
Ubica los archivos en un directorio de trabajo:
```bash
mkdir auditoria_ocr && cd auditoria_ocr
# Copia aquí audit_ocr_app.py y requirements.txt
```

### Paso 2: Crear y activar entorno virtual
Es una buena práctica aislar las dependencias:
```bash
# En Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# En Windows (PowerShell):
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Paso 3: Instalar dependencias
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 3. Modos de Ejecución

### Modo A: Dashboard Interactivo Web (Streamlit)
Ideal para analistas, auditores y operadores que requieren visualización gráfica, carga drag-and-drop y exploración interactiva de causas raíz:
```bash
streamlit run audit_ocr_app.py
```
El navegador se abrirá automáticamente en `http://localhost:8501`.

### Modo B: Línea de Comandos / Servidor (CLI Batch)
Ideal para ejecución desatendida en servidores, cron jobs o tuberías de ingesta documental:
```bash
# Escaneo de un directorio con generación automática de Excel y PDF
python audit_ocr_app.py --source /ruta/hacia/documentos \
                        --output_excel /reportes/auditoria_2026.xlsx \
                        --output_pdf /reportes/dictamen_2026.pdf \
                        --min_density 1.2 \
                        --min_chars 80
```

---

## 4. Configuración de Credenciales de Google Drive API

Para auditar carpetas compartidas o repositorios alojados en Google Drive, sigue estos pasos:

### Opción 1: Cuenta de Servicio (Recomendada para Servidores y Empresas)
1. Ingresa a la consola de Google Cloud: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Crea un proyecto nuevo (ej. `Auditoria-Documental-OCR`).
3. En el menú de navegación, ve a **APIs & Services > Library** (Biblioteca).
4. Busca **Google Drive API** y presiona **Enable** (Habilitar).
5. Ve a **APIs & Services > Credentials** (Credenciales).
6. Presiona **Create Credentials > Service Account** (Cuenta de servicio).
   - Asigna un nombre (ej. `ocr-auditor-sa`).
   - Copia la dirección de correo generada (ej. `ocr-auditor-sa@tu-proyecto.iam.gserviceaccount.com`).
7. Entra a la cuenta de servicio creada, pestaña **Keys** (Claves) > **Add Key** > **Create new key** > Formato **JSON**.
8. Descarga el archivo y renómbralo a `service_account.json` en la carpeta del proyecto.
9. **IMPORTANTE:** Ve a Google Drive, haz clic derecho sobre la carpeta que deseas auditar > **Compartir** > y agrega el correo de la cuenta de servicio con rol de **Lector**. Copia el `Folder ID` de la URL de Drive (la cadena alfanumérica tras `/folders/`).

### Opción 2: Flujo OAuth2 de Usuario (Para uso personal)
1. En **Credentials**, presiona **Create Credentials > OAuth client ID** (Aplicación de escritorio).
2. Descarga el archivo JSON y guárdalo como `credentials.json`.
3. Al ejecutar la app por primera vez, se abrirá el navegador para otorgar permiso de solo lectura (`drive.readonly`) y se creará el token de refresco local `token_drive.pickle`.

---

## 5. Integración Opcional con Motores de OCR (Remediación)

Cuando el auditor clasifica un archivo como `REQUIERE_OCR_TOTAL` o `REQUIERE_OCR_PARCIAL`, puedes alimentar automáticamente un motor de remediación como:

### A) Tesseract OCR con OCRmyPDF (Open Source Local)
```bash
# Instalación en Ubuntu/Debian:
sudo apt-get install -y ocrmypdf tesseract-ocr tesseract-ocr-spa

# Comando de remediación automática sobre un PDF no conforme:
ocrmypdf --skip-text -l spa documento_escaneado.pdf documento_remediado.pdf
```

### B) Google Cloud Vision API o Gemini 2.0 Flash
```python
# Ejemplo de pipeline de extracción inteligente para páginas complejas:
from google import genai

client = genai.Client()
# Convertir página a imagen y consultar modelo de visión multimodal
# response = client.models.generate_content(
#     model='gemini-2.5-flash',
#     contents=[imagen_bytes, "Transcribe fielmente todo el texto del documento conservando tablas."]
# )
```

---

## 6. Monitoreo y Log Técnico

El archivo `auditoria_ocr_log.log` se crea en el directorio de ejecución y registra:
- Timestamps de inicio y fin de cada documento.
- Trazas de excepción de archivos corruptos o encriptados sin bloquear el escaneo del resto del lote.
- Identificación de colisiones criptográficas SHA-256 (duplicados exactos).
- Métricas de rendimiento de lectura.
