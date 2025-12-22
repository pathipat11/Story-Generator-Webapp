import re
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field

from google.genai.errors import ClientError, ServerError

from gemini_client import generate_text
from prompts import (
    SYSTEM_RULES,
    OUTPUT_FORMAT_FIRST,
    OUTPUT_FORMAT_NEXT,
    ILLUSTRATION_PROMPT_RULES,
    LENGTH_GUIDE, TONE_GUIDE, GENRE_GUIDE, AGE_GUIDE
)
import storage
from pdf_utils import text_to_pdf_bytes

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

DEFAULT_MODEL = "gemini-2.5-flash"

storage.init_db()

class Character(BaseModel):
    name: str
    traits: str = ""

class StoryBody(BaseModel):
    idea: str = Field(..., description="Free text plot / requirements")
    genre: str = "fantasy"
    tone: str = "warm"
    length: str = "short"
    age: str = "kids"

    setting: str = "หมู่บ้านเล็กๆใกล้ป่า"
    theme: str = "มิตรภาพและความพยายาม"

    characters: List[Character] = Field(default_factory=list)
    relationships: str = ""  # free text
    want_illustration_prompt: bool = True

class NextBody(BaseModel):
    story_id: int
    user_direction: str = ""  # ผู้ใช้สั่งเพิ่มสำหรับตอนถัดไป (optional)

def _safe_map(d: Dict[str, str], key: str, default: str) -> str:
    return d.get(key, default)

def _extract_title(full_text: str) -> str:
    # หา [Title] ... บรรทัดถัดไป
    m = re.search(r"\[Title\]\s*\n(.+)", full_text)
    if m:
        return m.group(1).strip()[:120]
    return "Untitled Story"

def _parse_next_chapter(text: str):
    # [Chapter Title] ... [Chapter] ... [Cliffhanger] ...
    title = ""
    chapter = text.strip()
    m = re.search(r"\[Chapter Title\]\s*\n(.+)", text)
    if m:
        title = m.group(1).strip()
    return title or "Next Chapter", chapter

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/generate")
def generate_story(body: StoryBody):
    idea = (body.idea or "").strip()
    if not idea:
        return JSONResponse({"error": "กรุณาพิมพ์ไอเดียหรือพล็อตที่ต้องการก่อนครับ"}, status_code=400)

    genre = _safe_map(GENRE_GUIDE, body.genre, "แฟนตาซี")
    tone = _safe_map(TONE_GUIDE, body.tone, "อบอุ่น ให้กำลังใจ")
    length = _safe_map(LENGTH_GUIDE, body.length, "ประมาณ 300-500 คำ")
    age = _safe_map(AGE_GUIDE, body.age, "เด็กเล็ก (ภาษาง่ายมาก)")

    chars = body.characters or []
    if not chars:
        chars = [Character(name="มะลิ", traits="ใจดี ช่างสงสัย กล้าหาญนิดๆ")]

    char_block = "\n".join([f"- {c.name}: {c.traits}".strip() for c in chars])

    options_for_store: Dict[str, Any] = {
        "genre": genre,
        "tone": tone,
        "age": age,
        "length": length,
        "setting": body.setting,
        "theme": body.theme,
        "characters": [c.model_dump() for c in chars],
        "relationships": body.relationships.strip(),
    }

    prompt = f"""{SYSTEM_RULES}
{OUTPUT_FORMAT_FIRST}

[Options]
Genre: {genre}
Tone: {tone}
Target age: {age}
Length: {length}

Setting: {body.setting}
Theme / Moral direction: {body.theme}

Characters:
{char_block}

Relationships (if any):
{body.relationships.strip() or "(none)"}

[User idea]
{idea}
"""

    try:
        full_text = generate_text(DEFAULT_MODEL, prompt)
        title = _extract_title(full_text)

        illustration_prompt: Optional[str] = None
        if body.want_illustration_prompt:
            iprompt = f"""{ILLUSTRATION_PROMPT_RULES}

[Story Title]
{title}

[Story Context]
Genre: {genre}
Tone: {tone}
Setting: {body.setting}
Characters:
{char_block}

User idea:
{idea}
"""
            illustration_prompt = generate_text(DEFAULT_MODEL, iprompt)

        story_id = storage.create_story(options_for_store, title, full_text, illustration_prompt)

        # chapter 1 = เนื้อเรื่องหลักที่สร้างครั้งแรก
        storage.add_chapter(story_id, 1, "Chapter 1", full_text)

        return {
            "story_id": story_id,
            "title": title,
            "text": full_text,
            "illustration_prompt": illustration_prompt,
        }

    except ClientError as e:
        msg = str(e)
        if "429" in msg or "RESOURCE_EXHAUSTED" in msg:
            return JSONResponse({"error": "429 Rate limit: รอสักครู่แล้วลองใหม่ครับ"}, status_code=429)
        return JSONResponse({"error": f"Gemini ClientError: {msg}"}, status_code=400)
    except ServerError as e:
        return JSONResponse({"error": f"Gemini ServerError: {str(e)}"}, status_code=502)
    except Exception as e:
        return JSONResponse({"error": f"Server error: {repr(e)}"}, status_code=500)

@app.post("/next")
def next_chapter(body: NextBody):
    story = storage.get_story(body.story_id)
    if not story:
        return JSONResponse({"error": "ไม่พบ story_id นี้"}, status_code=404)

    chapters = storage.list_chapters(body.story_id)
    next_index = (chapters[-1]["index"] + 1) if chapters else 2

    user_dir = (body.user_direction or "").strip()

    prompt = f"""{SYSTEM_RULES}
{OUTPUT_FORMAT_NEXT}

[Story so far]
{story["full_text"]}

[Existing chapters count]
{len(chapters)}

[User direction for next chapter]
{user_dir or "(none)"}
"""
    try:
        text = generate_text(DEFAULT_MODEL, prompt)
        ch_title, ch_text = _parse_next_chapter(text)
        storage.add_chapter(body.story_id, next_index, ch_title, ch_text)
        return {"chapter_index": next_index, "chapter_title": ch_title, "chapter_text": ch_text}
    except Exception as e:
        s = str(e)
        if "429" in s or "RESOURCE_EXHAUSTED" in s:
            return JSONResponse({"error": "429 Rate limit: รอสักครู่แล้วลองใหม่ครับ"}, status_code=429)
        return JSONResponse({"error": f"{type(e).__name__}: {s}"}, status_code=500)

@app.get("/story/{story_id}")
def get_story(story_id: int):
    story = storage.get_story(story_id)
    if not story:
        return JSONResponse({"error": "not found"}, status_code=404)
    chapters = storage.list_chapters(story_id)
    return {"story": story, "chapters": chapters}

@app.get("/download/{story_id}.{ext}")
def download(story_id: int, ext: str):
    story = storage.get_story(story_id)
    if not story:
        return JSONResponse({"error": "not found"}, status_code=404)

    chapters = storage.list_chapters(story_id)
    md = storage.story_markdown(story, chapters)

    filename_base = re.sub(r"[^a-zA-Z0-9ก-๙ _-]+", "", story["title"]).strip() or f"story_{story_id}"
    filename_base = filename_base[:80]

    if ext == "md":
        return Response(
            content=md.encode("utf-8"),
            media_type="text/markdown; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{filename_base}.md"'},
        )

    if ext == "txt":
        txt = md.replace("# ", "").replace("## ", "").replace("### ", "")
        return Response(
            content=txt.encode("utf-8"),
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{filename_base}.txt"'},
        )

    if ext == "pdf":
        pdf_bytes = text_to_pdf_bytes(story["title"], md)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename_base}.pdf"'},
        )

    return JSONResponse({"error": "ext must be md|txt|pdf"}, status_code=400)
