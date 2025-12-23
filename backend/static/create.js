function v(id) { return document.getElementById(id).value; }
function checked(id) { return document.getElementById(id).checked; }

const charsWrap = document.getElementById("chars");
const addCharBtn = document.getElementById("addChar");
const genBtn = document.getElementById("gen");
const statusEl = document.getElementById("status");

let isBusy = false;

function addCharRow(name = "", traits = "") {
    const card = document.createElement("div");
    card.className = "rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950";
    card.innerHTML = `
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label class="text-xs font-medium text-slate-600 dark:text-slate-300">Name</label>
        <input class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900" value="${name}">
      </div>
      <div>
        <label class="text-xs font-medium text-slate-600 dark:text-slate-300">Traits</label>
        <input class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900" value="${traits}">
      </div>
    </div>
    <div class="mt-3 flex justify-end">
      <button class="del rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">Remove</button>
    </div>
  `;
    card.querySelector(".del").addEventListener("click", () => card.remove());
    charsWrap.appendChild(card);
}

function getCharacters() {
    return [...charsWrap.children].map(card => {
        const inputs = card.querySelectorAll("input");
        return { name: (inputs[0].value || "").trim(), traits: (inputs[1].value || "").trim() };
    }).filter(c => c.name);
}

addCharBtn.addEventListener("click", () => addCharRow("", ""));
addCharRow("มะลิ", "ใจดี ช่างสงสัย กล้าหาญนิดๆ");
addCharRow("ต้นน้ำ", "เพื่อนสนิท อารมณ์ดี ชอบช่วยคน");

genBtn.addEventListener("click", async () => {
    if (isBusy) return;
    isBusy = true;
    genBtn.disabled = true;
    statusEl.textContent = "Generating...";

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
        const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
            statusEl.textContent = data.error || `Error ${res.status}`;
            return;
        }
        window.location.href = `/story/${data.story_id}`;
    } catch (e) {
        statusEl.textContent = "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้";
    } finally {
        genBtn.disabled = false;
        isBusy = false;
    }
});
