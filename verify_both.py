"""Verifica los 2 PDFs: páginas, primera línea, sin solapamientos."""
from pypdf import PdfReader

for name in [
    "docs/manuales/Manual_SMD_Vital_Agente.pdf",
    "docs/manuales/Manual_SMD_Vital_Profesional.pdf",
]:
    print(f"\n=== {name} ===")
    r = PdfReader(name)
    print(f"Total pages: {len(r.pages)}")
    for i, page in enumerate(r.pages):
        text = page.extract_text() or ""
        lines = [l for l in text.split("\n") if l.strip()]
        # Tomar la primera línea con contenido (después del header)
        content = next((l for l in lines if l.strip() and "SMD VITAL" not in l and "Manual" not in l and "Bogotá" not in l and "Página" not in l), "(empty)")
        print(f"  p{i+1}: {content[:90]}")
