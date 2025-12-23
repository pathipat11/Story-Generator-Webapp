function v(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element id="${id}"`);
  return el.value;
}
function checked(id) { return document.getElementById(id).checked; }

const charsWrap = document.getElementById("chars");
const addCharBtn = document.getElementById("addChar");
const genBtn = document.getElementById("gen");
const statusEl = document.getElementById("status");

const genOutlineBtn = document.getElementById("genOutline");
const outlineEl = document.getElementById("outline");

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

function clearChars() { charsWrap.innerHTML = ""; }

function applyPreset(key) {
  const presets = {
    bedtime: {
      genre: "bedtime", tone: "warm", age: "kids", length: "short",
      setting: "ห้องนอนอุ่นๆในคืนฝนพรำ", theme: "ความกล้าหาญเล็กๆก่อนนอน",
      chars: [
        ["น้องพลอย", "ขี้กลัวนิดๆ แต่ใจดี"],
        ["น้องหมี", "ตุ๊กตาหมีพูดได้ ชอบปลอบใจ"]
      ],
      idea: "เด็กคนหนึ่งกลัวเสียงฟ้าร้อง แล้วได้เรียนรู้วิธีทำให้ใจสงบ"
    },
    adventure: {
      genre: "adventure", tone: "funny", age: "preteens", length: "medium",
      setting: "เกาะลึกลับกลางทะเล", theme: "มิตรภาพและการแก้ปัญหา",
      chars: [
        ["มะลิ", "ใจดี ช่างสงสัย กล้าหาญนิดๆ"],
        ["ต้นน้ำ", "เพื่อนสนิท อารมณ์ดี ชอบช่วยคน"]
      ],
      idea: "ทีมเพื่อนออกตามหาของวิเศษในเกาะลึกลับ แต่ต้องผ่านด่านปริศนา"
    },
    mystery: {
      genre: "detective", tone: "mystery", age: "teens", length: "medium",
      setting: "โรงเรียนเก่าแก่ที่มีข่าวลือ", theme: "ความจริงสำคัญกว่าความเชื่อ",
      chars: [
        ["เรย์", "ช่างสังเกต ชอบตั้งคำถาม"],
        ["มิน", "สายเทค ช่วยหาหลักฐาน"]
      ],
      idea: "เกิดเหตุของหายลึกลับในโรงเรียน ทุกคนสงสัยผี แต่จริงๆมีคนอยู่เบื้องหลัง"
    },
    slice: {
      genre: "slice", tone: "warm", age: "adult", length: "short",
      setting: "คาเฟ่เล็กๆริมถนน", theme: "การเริ่มต้นใหม่",
      chars: [
        ["ฟ้า", "เจ้าของคาเฟ่ที่กำลังท้อ"],
        ["ปั้น", "ลูกค้าที่มาพร้อมคำพูดให้กำลังใจ"]
      ],
      idea: "วันธรรมดาในคาเฟ่ที่เปลี่ยนชีวิตคนหนึ่งให้กลับมามีหวัง"
    }
  };

  const p = presets[key];
  if (!p) return;

  document.getElementById("genre").value = p.genre;
  document.getElementById("tone").value = p.tone;
  document.getElementById("age").value = p.age;
  document.getElementById("length").value = p.length;
  document.getElementById("setting").value = p.setting;
  document.getElementById("theme").value = p.theme;
  document.getElementById("idea").value = p.idea;

  clearChars();
  p.chars.forEach(([n, t]) => addCharRow(n, t));

  outlineEl.value = ""; // reset outline when preset changes
}

addCharBtn.addEventListener("click", () => addCharRow("", ""));

// preset buttons
document.querySelectorAll(".preset").forEach(btn => {
  btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
});

// defaults
addCharRow("มะลิ", "ใจดี ช่างสงสัย กล้าหาญนิดๆ");
addCharRow("ต้นน้ำ", "เพื่อนสนิท อารมณ์ดี ชอบช่วยคน");

genOutlineBtn.addEventListener("click", async () => {
  if (isBusy) return;
  isBusy = true;
  genOutlineBtn.disabled = true;
  statusEl.textContent = "Generating outline...";

  const payload = {
    idea: v("idea"),
    genre: v("genre"),
    tone: v("tone"),
    age: v("age"),
    length: v("length"),
    setting: v("setting"),
    theme: v("theme"),
    characters: getCharacters(),
  };

  try {
    const res = await fetch("/api/outline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      statusEl.textContent = data.error || `Error ${res.status}`;
      return;
    }
    outlineEl.value = data.outline || "";
    statusEl.textContent = "Outline ready ✓ (แก้ไขได้)";
  } catch (e) {
    statusEl.textContent = "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้";
  } finally {
    genOutlineBtn.disabled = false;
    isBusy = false;
  }
});

genBtn.addEventListener("click", async () => {
  if (isBusy) return;
  isBusy = true;
  genBtn.disabled = true;
  statusEl.textContent = "Generating story...";

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
    outline: (outlineEl.value || "").trim(),
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
