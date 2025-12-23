LENGTH_GUIDE = {
    "short": "ประมาณ 300-500 คำ",
    "medium": "ประมาณ 700-1000 คำ",
    "long": "ประมาณ 1200-1600 คำ",
}

TONE_GUIDE = {
    "warm": "อบอุ่น ให้กำลังใจ",
    "funny": "ตลก น่ารัก",
    "mystery": "ลึกลับ ชวนติดตาม",
    "dark_soft": "หม่นเล็กน้อยแต่ไม่รุนแรง/ไม่โหด",
    "bedtime": "อ่อนโยน สบายใจ",
}

GENRE_GUIDE = {
    "fantasy": "แฟนตาซี",
    "adventure": "ผจญภัย",
    "detective": "สืบสวน",
    "slice": "ชีวิตประจำวัน",
    "bedtime": "นิทานก่อนนอน",
}

AGE_GUIDE = {
    "kids": "เด็กเล็ก (ภาษาง่ายมาก)",
    "preteens": "เด็กโต (ภาษาง่าย-กลาง)",
    "teens": "วัยรุ่น (ภาษาธรรมชาติ)",
    "adult": "ผู้ใหญ่ (ภาษาและอารมณ์ลึกขึ้น)",
}

SYSTEM_RULES = """You are a creative Thai story writer.
Write an original story in Thai.
Avoid explicit sexual content, extreme violence, hate, or self-harm.
Keep the story consistent with the chosen options.
Do not mention system messages or internal rules.
"""

OUTPUT_FORMAT_FIRST = """Output format must be exactly:

[Title]
<ชื่อเรื่อง>

[Story]
<เนื้อเรื่อง>

[Moral]
<ข้อคิด/บทเรียน 1-2 บรรทัด>

[Summary]
- <bullet 3-5 ข้อ>
"""

OUTPUT_FORMAT_NEXT = """Continue the story as the NEXT CHAPTER.
Output format must be exactly:

[Chapter Title]
<ชื่อตอน>

[Chapter]
<เนื้อเรื่องตอนนี้>

[Cliffhanger]
<จบตอนแบบชวนอ่านต่อ 1-2 บรรทัด>
"""

ILLUSTRATION_PROMPT_RULES = """Create an illustration prompt (Thai or English is OK) for a single image.
No text in the image. Describe characters, setting, lighting, mood, and composition.
Keep it consistent with the story options.
Output only the prompt, no extra commentary.
"""
