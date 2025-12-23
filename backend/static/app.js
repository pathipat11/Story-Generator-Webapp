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

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

let storyId = null;
let isBusy = false;

function v(id) { return document.getElementById(id).value; }
function checked(id) { return document.getElementById(id).checked; }

function setStoryId(id) {
    storyId = id;
    storyBadge.textContent = `story_id: ${id ?? "-"}`;
    storyBadge.classList.toggle("hidden", !id);

    const ok = !!storyId;
    nextBtn.disabled = !ok;
    dlMd.disabled = !ok;
    dlTxt.disabled = !ok;
    dlPdf.disabled = !ok;
}

function applyThemeIcon() {
    const isDark = document.documentElement.classList.contains("dark");
    themeIcon.textContent = isDark ? "☀️" : "🌙";
}

themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    applyThemeIcon();
});

applyThemeIcon();

function addCharRow(name = "", traits = "") {
    const card = document.createElement("div");
    card.className = "rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950";

    const grid = document.createElement("div");
    grid.className = "grid grid-cols-1 gap-3 sm:grid-cols-2";

    const nameWrap = document.createElement("div");
    const traitsWrap = document.createElement("div");

    const nameLabel = document.createElement("label");
    nameLabel.className = "text-xs font-medium text-slate-600 dark:text-slate-300";
    nameLabel.textContent = "Name";

    const nameInput = document.createElement("input");
    nameInput.value = name;
    nameInput.className =
        "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-slate-700";

    const traitsLabel = document.createElement("label");
    traitsLabel.className = "text-xs font-medium text-slate-600 dark:text-slate-300";
    traitsLabel.textContent = "Traits";

    const traitsInput = document.createElement("input");
    traitsInput.value = traits;
    traitsInput.className =
        "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-slate-700";

    nameWrap.appendChild(nameLabel);
    nameWrap.appendChild(nameInput);

    traitsWrap.appendChild(traitsLabel);
    traitsWrap.appendChild(traitsInput);

    grid.appendChild(nameWrap);
    grid.appendChild(traitsWrap);

    const footer = document.createElement("div");
    footer.className = "mt-3 flex justify-end";

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "Remove";
    delBtn.className =
        "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";
    delBtn.addEventListener("click", () => card.remove());

    footer.appendChild(delBtn);

    card.appendChild(grid);
    card.appendChild(footer);
    charsWrap.appendChild(card);
}

function getCharacters() {
    const cards = [...charsWrap.children];
    const chars = cards.map(card => {
        const inputs = card.querySelectorAll("input");
        const name = (inputs[0]?.value || "").trim();
        const traits = (inputs[1]?.value || "").trim();
        return { name, traits };
    }).filter(c => c.name);
    return chars;
}

function renderChapters(chapters) {
    chaptersEl.innerHTML = "";
    if (!chapters || !chapters.length) {
        chaptersEl.innerHTML = `<div class="text-xs text-slate-500 dark:text-slate-400">(ยังไม่มี)</div>`;
        return;
    }

    chapters.forEach(ch => {
        const wrap = document.createElement("div");
        wrap.className = "rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950";

        const head = document.createElement("div");
        head.className = "flex flex-wrap items-center gap-2";

        const badge = document.createElement("span");
        badge.className = "inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300";
        badge.textContent = `Chapter ${ch.index}`;

        const title = document.createElement("span");
        title.className = "text-sm font-semibold text-slate-900 dark:text-slate-100";
        title.textContent = ch.title;

        head.appendChild(badge);
        head.appendChild(title);

        const body = document.createElement("pre");
        body.className = "mt-3 whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-200";
        body.textContent = ch.text;

        wrap.appendChild(head);
        wrap.appendChild(body);
        chaptersEl.appendChild(wrap);
    });
}

async function loadStory() {
    if (!storyId) return;
    const res = await fetch(`/story/${storyId}`);
    const data = await res.json();
    if (res.ok) {
        renderChapters(data.chapters || []);
    }
}

async function generate() {
    if (isBusy) return;
    isBusy = true;
    genBtn.disabled = true;
    nextBtn.disabled = true;

    out.textContent = "Generating...";
    imgPrompt.textContent = "(กำลังสร้าง...)";
    chaptersEl.innerHTML = `<div class="text-xs text-slate-500 dark:text-slate-400">(กำลังโหลด...)</div>`;

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
        await loadStory();
    } catch (e) {
        out.textContent = "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้";
    } finally {
        genBtn.disabled = false;
        nextBtn.disabled = !storyId;
        isBusy = false;
    }
}

async function nextChapter() {
    if (!storyId || isBusy) return;
    isBusy = true;
    nextBtn.disabled = true;
    chaptersEl.innerHTML = `<div class="text-xs text-slate-500 dark:text-slate-400">(กำลังสร้างตอนถัดไป...)</div>`;

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
            chaptersEl.innerHTML = `<div class="text-sm text-rose-500">${data.error || `Error ${res.status}`}</div>`;
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

// defaults
addCharRow("มะลิ", "ใจดี ช่างสงสัย กล้าหาญนิดๆ");
addCharRow("ต้นน้ำ", "เพื่อนสนิท อารมณ์ดี ชอบช่วยคน");
setStoryId(null);
