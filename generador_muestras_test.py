#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador de archivos PDF sintéticos para pruebas de la Suite de Auditoría OCR.
Crea 4 tipos de documentos con diferentes condiciones forenses:
1. Conforme_Nativo.pdf (Capa de texto perfecta)
2. Escaneado_Sin_OCR.pdf (Solo imagen rasterizada sin texto)
3. Mixto_Parcial.pdf (Página con texto + página solo imagen)
4. Encriptado_Clave.pdf (Protegido con contraseña)
"""

import os
from pathlib import Path
try:
    import fitz  # PyMuPDF
except ImportError:
    print("Por favor instala PyMuPDF: pip install PyMuPDF")
    exit(1)

def crear_muestras():
    output_dir = Path("./muestras_pdf_test")
    output_dir.mkdir(exist_ok=True)

    # 1. Conforme Nativo
    doc1 = fitz.open()
    page1 = doc1.new_page(width=595, height=842) # A4
    text_content = """CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES
Entre las partes debidamente identificadas, se conviene celebrar el presente instrumento.
Cláusula Primera: Objeto del Contrato. El prestador se compromete a realizar las labores de auditoría.
Cláusula Segunda: Confidencialidad y protección de datos conforme a la legislación vigente.
Este documento cuenta con una capa de texto nativa perfecta, con alta densidad de caracteres y metadatos completos.
""" * 5
    page1.insert_text((50, 72), text_content, fontsize=10)
    doc1.set_metadata({
        "title": "Contrato de Prestación de Servicios",
        "author": "Departamento Jurídico",
        "creator": "Sistema Notarial v4.2",
        "producer": "PyMuPDF Test Suite"
    })
    doc1.save(output_dir / "01_Conforme_Nativo.pdf")
    doc1.close()

    # 2. Escaneado Sin OCR (Simulación de documento de solo imagen)
    doc2 = fitz.open()
    page2 = doc2.new_page(width=595, height=842)
    # Generar un pixmap blanco con dibujo simulando texto manuscrito escaneado
    pix = fitz.Pixmap(fitz.csRGB, (0, 0, 500, 700), False)
    pix.clear_with(245) # Fondo gris papel escaneado
    page2.insert_image(fitz.Rect(40, 40, 540, 790), pixmap=pix)
    doc2.save(output_dir / "02_Escaneado_Sin_OCR.pdf")
    doc2.close()

    # 3. Mixto Parcial
    doc3 = fitz.open()
    p1 = doc3.new_page(width=595, height=842)
    p1.insert_text((50, 100), "PÁGINA 1: Carátula oficial con texto digital nativo y firmas electrónicas válidas.", fontsize=12)
    p2 = doc3.new_page(width=595, height=842)
    pix2 = fitz.Pixmap(fitz.csRGB, (0, 0, 400, 600), False)
    pix2.clear_with(230)
    p2.insert_image(fitz.Rect(50, 50, 500, 750), pixmap=pix2)
    doc3.save(output_dir / "03_Expediente_Mixto_Parcial.pdf")
    doc3.close()

    # 4. Encriptado con clave
    doc4 = fitz.open()
    p = doc4.new_page(width=595, height=842)
    p.insert_text((50, 100), "DOCUMENTO CONFIDENCIAL BLOQUEADO", fontsize=14)
    doc4.save(
        output_dir / "04_Encriptado_Con_Clave.pdf",
        encryption=fitz.PDF_ENCRYPT_AES_256,
        user_pw="clave123",
        owner_pw="admin123"
    )
    doc4.close()

    print(f"✅ Muestras de prueba generadas exitosamente en: {output_dir.resolve()}")

if __name__ == "__main__":
    crear_muestras()
