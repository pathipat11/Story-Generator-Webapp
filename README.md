# Story Generator Web App

A full-stack **AI-powered story creation web application** built with **FastAPI**, **Google Gemini API**, and **Tailwind CSS**.
Users can design stories by choosing genres, tones, target age, characters, and themes, then generate outlines, full stories, next chapters, illustrations, and downloadable files.

---

## ✨ Features

### 📖 Story Creation

* Create stories by specifying:

  * Genre (Fantasy, Adventure, Detective, Slice of Life, Bedtime, etc.)
  * Tone (Warm, Funny, Mystery, Soft-Dark)
  * Target age (Kids → Adult)
  * Length (Short / Medium / Long)
  * Setting & moral/theme
  * Characters & relationships
  * Free-text story idea

### 🧠 AI-Powered Generation (Gemini)

* **Generate Outline** – AI creates a structured story outline before writing
* **Generate Story** – Produces a full story following strict output rules
* **Next Chapter** – Continue the story chapter by chapter
* **Illustration Prompt** – Optional anime-style illustration prompt generation
* **Anime Illustration** – Generate anime-style images using Gemini Image API

### 📂 Story Management

* View all created stories
* Open a story in a dedicated page
* Delete stories
* Continue stories later

### 📥 Download Options

* Export stories as:

  * **PDF** (Thai-language supported with embedded fonts)
  * **TXT**
  * **Markdown**

### 🌙 UI & UX

* Clean modern UI with **Tailwind CSS**
* Dark / Light mode toggle (saved in localStorage)
* Responsive layout (desktop & mobile friendly)

---

## 🛠 Tech Stack

### Backend

* **Python 3.10+**
* **FastAPI** – API & server
* **Google Gemini API** – Text & image generation
* **SQLite** – Story & chapter storage
* **ReportLab** – PDF generation (Thai font support)

### Frontend

* **Jinja2 Templates**
* **Vanilla JavaScript**
* **Tailwind CSS (CDN)**

---

## 📁 Project Structure

```
backend/
├─ app.py                # FastAPI application
├─ storage.py            # SQLite data layer
├─ gemini_client.py      # Gemini API wrapper
├─ prompts.py            # Prompt & style rules
├─ pdf_utils.py          # PDF generation (Thai supported)
├─ fonts/                # Thai fonts (Noto Sans Thai)
├─ static/
│  ├─ create.js
│  ├─ stories.js
│  └─ generated/         # Generated images
├─ templates/
│  ├─ base.html
│  ├─ home.html
│  ├─ create.html
│  ├─ stories.html
│  └─ story.html
└─ requirements.txt
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Story-Generator-Webapp.git
cd Story-Generator-Webapp
```

### 2. Create virtual environment

```bash
python -m venv .venv
source .venv/bin/activate  # macOS / Linux
.venv\Scripts\activate     # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment variables

Create a `.env` file:

```env
GEMINI_API_KEY=your_google_gemini_api_key
```

### 5. Run the app

```bash
uvicorn app:app --reload
```

Open: **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## 📸 Screens & Pages

* **Home** – Introduction & navigation
* **Create** – Story builder + outline generator
* **Stories** – List of all generated stories
* **Story Detail** – Read, continue, illustrate, and download

---

## 🎯 Use Cases

* Learning & demo project for AI integration
* Internship / portfolio project
* Creative writing assistant
* Story planning & prototyping tool

---

## ⚠️ Notes

* PDF generation supports **Thai language** via embedded fonts
* Gemini API rate limits apply
* Image generation may take longer than text generation

---

## 📜 License

This project is for **educational and demonstration purposes**.
You may adapt and extend it for your own use.

---

## 🙌 Acknowledgements

* Google Gemini API
* FastAPI
* Tailwind CSS
* ReportLab

---

Happy storytelling ✨📚
