const out = document.getElementById("out");
const imgPrompt = document.getElementById("imgPrompt");
const chaptersEl = document.getElementById("chapters");

const genBtn = document.getElementById("gen");
const nextBtn = document.getElementById("next");

const dlMd = document.getElementById("dlMd");
const dlTxt = document.getElementById("dlTxt");
const dlPdf = document.getElementById("dlPdf");

const storyBadge = document.getElementById("storyBadge");

const charsWrap = document.getElementById("chars");
const addCharBtn = document.getElementById("addChar");

let storyId = null;
let isBusy = false;

function v(id) { return document.getElementById(id).value; }
function checked(id) { return document.getElementById(id).checked; }

function setStoryId(id) {
    storyId = id;
    storyBadge.textContent = `story_id: ${id ?? "-"}`;
    const ok = !!storyId;
    nextBtn.disabled = !ok;
    dlMd.disabled = !ok;
    dlTxt.disabled = !ok;
    dlPdf.disabled = !ok;
}

function addCharRow(name = "", traits = "") {
    const row = document.createElement("div");
    row.className = "char";

    const nameBox = document.createElement("div");
    const traitsBox = document.createElement("div");

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Name";
    const nameInput = document.createElement("input");
    nameInput.value = name;

    const traitsLabel = document.createElement("label");
    traitsLabel.textContent = "Traits";
    const traitsInput = document.createElement("input");
    traitsInput.value = traits;

    nameBox.appendChild(nameLabel);
    nameBox.appendChild(nameInput);

    traitsBox.appendChild(traitsLabel);
    traitsBox.appendChild(traitsInput);

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "Remove";
    delBtn.addEventListener("click", () => row.remove());

    row.appendChild(nameBox);
    row.appendChild(traitsBox);
    row.appendChild(delBtn);

    charsWrap.appendChild(row);
}

function getCharacters() {
    const rows = [...charsWrap.querySelectorAll(".char")];
    const chars = rows.map(r => {
        const inputs = r.querySelectorAll("input");
        return {
            name: (inputs[0].value || "").trim(),
            traits: (inputs[1].value || "").trim()
        };
    }).filter(c => c.name);
    return chars;
}

function renderChapters(chapters) {
    if (!chapters || !chapters.length) {
        chaptersEl.textContent = "(ยังไม่มี)";
        return;
    }
    chaptersEl.innerHTML = "";
    chapters.forEach(ch => {
        const div = document.createElement("div");
        div.style.marginBottom = "10px";
        div.innerHTML = `<div class="badge">Chapter ${ch.index}</div> <b>${escapeHtml(ch.title)}</b>`;
        const pre = document.createElement("div");
        pre.style.whiteSpace = "pre-wrap";
        pre.style.marginTop = "6px";
        pre.textContent = ch.text;
        div.appendChild(pre);
        chaptersEl.appendChild(div);
    });
}

function escapeHtml(s) {
    return (s || "").replace(/[&<>"']/g, m => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
}

async function generate() {
    if (isBusy) return;
    isBusy = true;
    genBtn.disabled = true;
    nextBtn.disabled = true;

    out.textContent = "Generating...";
    imgPrompt.textContent = "(กำลังสร้าง...)";
    chaptersEl.textContent = "(กำลังโหลด...)";

    const payload = {
        genre: v("genre"),
        tone: v("tone"),
        age: v("age"),
        length: v("length"),
        setting: v("setting"),
        theme: v("theme"),
        relationships: v("rels"),
        characters: getCharacters(),
        want_illustration_prompt: checked("wantImgPrompt"),
        idea: v("idea"),
    };

    try {
        const res = await fetch("/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!res.ok) {
            out.textContent = data.error || `Error ${res.status}`;
            imgPrompt.textContent = "(ยังไม่มี)";
            renderChapters([]);
            return;
        }

        setStoryId(data.story_id);
        out.textContent = data.text || "";
        imgPrompt.textContent = data.illustration_prompt || "(ยังไม่มี)";

        // reload story/chapters
        await loadStory();
    } catch (e) {
        out.textContent = "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้";
    } finally {
        genBtn.disabled = false;
        nextBtn.disabled = !storyId;
        isBusy = false;
    }
}

async function loadStory() {
    if (!storyId) return;
    const res = await fetch(`/story/${storyId}`);
    const data = await res.json();
    if (res.ok) {
        renderChapters(data.chapters || []);
    }
}

async function nextChapter() {
    if (!storyId || isBusy) return;
    isBusy = true;
    nextBtn.disabled = true;
    chaptersEl.textContent = "(กำลังสร้างตอนถัดไป...)";

    try {
        const res = await fetch("/next", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                story_id: storyId,
                user_direction: v("dir"),
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            chaptersEl.textContent = data.error || `Error ${res.status}`;
            return;
        }
        await loadStory();
    } finally {
        nextBtn.disabled = false;
        isBusy = false;
    }
}

function download(ext) {
    if (!storyId) return;
    window.location.href = `/download/${storyId}.${ext}`;
}

genBtn.addEventListener("click", generate);
nextBtn.addEventListener("click", nextChapter);

dlMd.addEventListener("click", () => download("md"));
dlTxt.addEventListener("click", () => download("txt"));
dlPdf.addEventListener("click", () => download("pdf"));

addCharBtn.addEventListener("click", () => addCharRow("", ""));

// default characters
addCharRow("มะลิ", "ใจดี ช่างสงสัย กล้าหาญนิดๆ");
addCharRow("ต้นน้ำ", "เพื่อนสนิท อารมณ์ดี ชอบช่วยคน");
setStoryId(null);
