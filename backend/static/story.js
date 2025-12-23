const storyId = window.STORY_ID;

const storyText = document.getElementById("storyText");
const chaptersEl = document.getElementById("chapters");

const nextBtn = document.getElementById("next");
const dirInput = document.getElementById("dir");

const dlMd = document.getElementById("dlMd");
const dlTxt = document.getElementById("dlTxt");
const dlPdf = document.getElementById("dlPdf");

const genImgBtn = document.getElementById("genImg");
const imgOut = document.getElementById("imgOut");
const imgHint = document.getElementById("imgHint");
const arSel = document.getElementById("ar");

let isBusy = false;

function renderChapters(chapters) {
    chaptersEl.innerHTML = "";
    if (!chapters || !chapters.length) {
        chaptersEl.innerHTML = `<div class="text-xs text-slate-500 dark:text-slate-400">(ยังไม่มี)</div>`;
        return;
    }
    chapters.forEach(ch => {
        const wrap = document.createElement("div");
        wrap.className = "rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950";
        wrap.innerHTML = `
            <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">Chapter ${ch.index}</span>
                <span class="text-sm font-semibold text-slate-900 dark:text-slate-100">${ch.title}</span>
            </div><pre class="mt-3 whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-200"></pre>
    `;
        wrap.querySelector("pre").textContent = ch.text;
        chaptersEl.appendChild(wrap);
    });
}

async function loadStory() {
    const res = await fetch(`/api/story/${storyId}`);
    const data = await res.json();
    if (!res.ok) {
        storyText.textContent = data.error || `Error ${res.status}`;
        return;
    }
    storyText.textContent = data.story.full_text || "";
    renderChapters(data.chapters || []);

    dlMd.href = `/download/${storyId}.md`;
    dlTxt.href = `/download/${storyId}.txt`;
    dlPdf.href = `/download/${storyId}.pdf`;
}

nextBtn.addEventListener("click", async () => {
    if (isBusy) return;
    isBusy = true;
    nextBtn.disabled = true;
    try {
        const res = await fetch("/api/next", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ story_id: storyId, user_direction: dirInput.value }),
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || `Error ${res.status}`);
            return;
        }
        await loadStory();
    } finally {
        nextBtn.disabled = false;
        isBusy = false;
    }
});

genImgBtn.addEventListener("click", async () => {
    if (isBusy) return;
    isBusy = true;
    genImgBtn.disabled = true;

    imgOut.classList.add("hidden");
    imgHint.classList.remove("hidden");
    imgHint.textContent = "กำลังสร้างภาพอนิเมะ...";

    try {
        const res = await fetch("/api/illustrate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ story_id: storyId, aspect_ratio: arSel.value }),
        });
        const data = await res.json();
        if (!res.ok) {
            imgHint.textContent = data.error || `Error ${res.status}`;
            return;
        }
        imgOut.src = data.image_url + `?t=${Date.now()}`;
        imgOut.onload = () => {
            imgHint.classList.add("hidden");
            imgOut.classList.remove("hidden");
        };
    } finally {
        genImgBtn.disabled = false;
        isBusy = false;
    }
});

loadStory();
