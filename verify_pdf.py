from pypdf import PdfReader
r = PdfReader("docs/manuales/Manual_SMD_Vital_Agentes_y_Profesionales.pdf")
print("Total pages:", len(r.pages))
print()
# Look at content of pages 3-6 to see what's there
for i in [2, 3, 4, 5, 6, 9, 10, 11, 12, 19]:  # 0-indexed
    if i < len(r.pages):
        text = r.pages[i].extract_text() or ""
        lines = [l for l in text.split("\n") if l.strip()]
        print(f"=== Page {i+1} ===")
        for l in lines[2:8]:  # skip header
            print(f"  {l[:80]}")
        print()
