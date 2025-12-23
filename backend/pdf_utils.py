from io import BytesIO
from pathlib import Path
from typing import List

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


# ---------------------------
# Font setup (Thai)
# ---------------------------
_FONT_READY = False

def _ensure_fonts():
    """Register Thai fonts once."""
    global _FONT_READY
    if _FONT_READY:
        return

    # pdf_utils.py อยู่ใน backend/ ดังนั้น fonts/ อยู่ข้างๆกัน
    base_dir = Path(__file__).resolve().parent
    fonts_dir = base_dir / "fonts"

    regular_path = fonts_dir / "NotoSansThai-Regular.ttf"
    bold_path = fonts_dir / "NotoSansThai-Bold.ttf"

    if not regular_path.exists() or not bold_path.exists():
        raise FileNotFoundError(
            "Missing Thai font files. Please put:\n"
            f"- {regular_path}\n"
            f"- {bold_path}\n"
        )

    pdfmetrics.registerFont(TTFont("NotoThai", str(regular_path)))
    pdfmetrics.registerFont(TTFont("NotoThai-Bold", str(bold_path)))
    _FONT_READY = True


# ---------------------------
# Wrapping helpers
# ---------------------------
def _wrap_line(c: canvas.Canvas, text: str, font_name: str, font_size: int, max_width: float) -> List[str]:
    """
    Wrap 1 line to multiple lines.
    - If has spaces -> wrap by words
    - If no spaces (Thai) -> wrap by characters
    """
    text = (text or "").rstrip()
    if not text:
        return [""]

    # ถ้ามีช่องว่าง ใช้ word wrap
    if " " in text:
        words = text.split(" ")
        lines = []
        cur = ""
        for w in words:
            test = (cur + " " + w).strip()
            if c.stringWidth(test, font_name, font_size) <= max_width:
                cur = test
            else:
                if cur:
                    lines.append(cur)
                # ถ้าคำยาวเกิน max_width ให้ตัดเป็นตัวอักษร
                if c.stringWidth(w, font_name, font_size) > max_width:
                    lines.extend(_wrap_line(c, w, font_name, font_size, max_width))
                    cur = ""
                else:
                    cur = w
        if cur:
            lines.append(cur)
        return lines

    # ไม่มีช่องว่าง (ไทย) -> ตัดตามตัวอักษร
    lines = []
    cur = ""
    for ch in text:
        test = cur + ch
        if c.stringWidth(test, font_name, font_size) <= max_width:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = ch
    if cur:
        lines.append(cur)
    return lines


def text_to_pdf_bytes(title: str, text: str) -> bytes:
    _ensure_fonts()

    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4

    margin_x = 40
    top_y = height - 50
    bottom_y = 60
    line_h = 15

    max_width = width - (margin_x * 2)

    # Title
    y = top_y
    c.setFont("NotoThai-Bold", 16)
    for tline in _wrap_line(c, (title or "").strip(), "NotoThai-Bold", 16, max_width):
        c.drawString(margin_x, y, tline)
        y -= 22
        if y < bottom_y:
            c.showPage()
            y = top_y
            c.setFont("NotoThai-Bold", 16)

    y -= 6  # spacing

    # Body
    c.setFont("NotoThai", 11)

    for paragraph in (text or "").split("\n"):
        line = paragraph.rstrip()

        # empty line
        if not line.strip():
            y -= 10
            if y < bottom_y:
                c.showPage()
                y = top_y
                c.setFont("NotoThai", 11)
            continue

        wrapped = _wrap_line(c, line, "NotoThai", 11, max_width)
        for wline in wrapped:
            c.drawString(margin_x, y, wline)
            y -= line_h
            if y < bottom_y:
                c.showPage()
                y = top_y
                c.setFont("NotoThai", 11)

    c.save()
    return buf.getvalue()
