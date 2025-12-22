import json
import sqlite3
from datetime import datetime
from typing import Any, Dict, List, Optional

DB_PATH = "stories.db"

def _conn():
    return sqlite3.connect(DB_PATH)

def init_db():
    with _conn() as con:
        cur = con.cursor()
        cur.execute("""
        CREATE TABLE IF NOT EXISTS stories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            options_json TEXT NOT NULL,
            title TEXT NOT NULL,
            full_text TEXT NOT NULL,
            illustration_prompt TEXT
        )
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS chapters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            story_id INTEGER NOT NULL,
            chapter_index INTEGER NOT NULL,
            chapter_title TEXT NOT NULL,
            chapter_text TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(story_id) REFERENCES stories(id)
        )
        """)
        con.commit()

def create_story(options: Dict[str, Any], title: str, full_text: str, illustration_prompt: Optional[str]) -> int:
    now = datetime.utcnow().isoformat()
    with _conn() as con:
        cur = con.cursor()
        cur.execute(
            "INSERT INTO stories(created_at, options_json, title, full_text, illustration_prompt) VALUES(?,?,?,?,?)",
            (now, json.dumps(options, ensure_ascii=False), title, full_text, illustration_prompt)
        )
        con.commit()
        return int(cur.lastrowid)

def add_chapter(story_id: int, chapter_index: int, chapter_title: str, chapter_text: str) -> int:
    now = datetime.utcnow().isoformat()
    with _conn() as con:
        cur = con.cursor()
        cur.execute(
            "INSERT INTO chapters(story_id, chapter_index, chapter_title, chapter_text, created_at) VALUES(?,?,?,?,?)",
            (story_id, chapter_index, chapter_title, chapter_text, now)
        )
        con.commit()
        return int(cur.lastrowid)

def get_story(story_id: int) -> Optional[Dict[str, Any]]:
    with _conn() as con:
        cur = con.cursor()
        cur.execute("SELECT id, created_at, options_json, title, full_text, illustration_prompt FROM stories WHERE id=?", (story_id,))
        row = cur.fetchone()
        if not row:
            return None
        return {
            "id": row[0],
            "created_at": row[1],
            "options": json.loads(row[2]),
            "title": row[3],
            "full_text": row[4],
            "illustration_prompt": row[5],
        }

def list_chapters(story_id: int) -> List[Dict[str, Any]]:
    with _conn() as con:
        cur = con.cursor()
        cur.execute(
            "SELECT chapter_index, chapter_title, chapter_text, created_at FROM chapters WHERE story_id=? ORDER BY chapter_index ASC",
            (story_id,)
        )
        rows = cur.fetchall()
        return [
            {"index": r[0], "title": r[1], "text": r[2], "created_at": r[3]}
            for r in rows
        ]

def story_markdown(story: Dict[str, Any], chapters: List[Dict[str, Any]]) -> str:
    opts = story["options"]
    lines = []
    lines.append(f"# {story['title']}\n")
    lines.append("## Options\n")
    for k, v in opts.items():
        lines.append(f"- **{k}**: {v}")
    lines.append("\n---\n")
    lines.append(story["full_text"].strip())
    if story.get("illustration_prompt"):
        lines.append("\n---\n")
        lines.append("## Illustration Prompt\n")
        lines.append(story["illustration_prompt"].strip())

    if chapters:
        lines.append("\n---\n")
        lines.append("## Chapters\n")
        for ch in chapters:
            lines.append(f"\n### Chapter {ch['index']}: {ch['title']}\n")
            lines.append(ch["text"].strip())
    return "\n".join(lines)
