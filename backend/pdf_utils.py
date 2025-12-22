from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

def text_to_pdf_bytes(title: str, text: str) -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4

    x = 40
    y = height - 50

    c.setFont("Helvetica-Bold", 16)
    c.drawString(x, y, title[:90])
    y -= 28

    c.setFont("Helvetica", 11)

    # wrap แบบง่าย
    for paragraph in text.split("\n"):
        line = paragraph.strip()
        if not line:
            y -= 10
            continue

        words = line.split(" ")
        cur = ""
        for w in words:
            test = (cur + " " + w).strip()
            if c.stringWidth(test, "Helvetica", 11) < (width - 80):
                cur = test
            else:
                c.drawString(x, y, cur)
                y -= 14
                cur = w
                if y < 60:
                    c.showPage()
                    y = height - 50
                    c.setFont("Helvetica", 11)

        if cur:
            c.drawString(x, y, cur)
            y -= 14
            if y < 60:
                c.showPage()
                y = height - 50
                c.setFont("Helvetica", 11)

    c.save()
    return buf.getvalue()
