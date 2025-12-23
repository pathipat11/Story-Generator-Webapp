const list = document.getElementById("list");

function fmtDate(s) {
  return s || "";
}

function card(item) {
  const wrap = document.createElement("div");
  wrap.className =
    "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900";

  const top = document.createElement("div");
  top.className = "flex items-start justify-between gap-3";

  const left = document.createElement("div");
  left.innerHTML = `
    <div class="text-sm font-semibold text-slate-900 dark:text-slate-100">${item.title}</div>
    <div class="mt-1 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
      ${fmtDate(item.created_at)}
    </div>
  `;

  const btns = document.createElement("div");
  btns.className = "flex items-center gap-2";

  const open = document.createElement("a");
  open.href = `/story/${item.id}`;
  open.className =
    "rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200";
  open.textContent = "Open";

  const pdf = document.createElement("a");
  pdf.href = `/download/${item.id}.pdf`;
  pdf.className =
    "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900";
  pdf.textContent = "PDF";

  const del = document.createElement("button");
  del.className =
    "rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:bg-slate-950 dark:text-rose-300 dark:hover:bg-rose-900/20";
  del.textContent = "Delete";

  del.addEventListener("click", async () => {
    const ok = confirm(`ลบเรื่องนี้?\n\n${item.title}`);
    if (!ok) return;

    const res = await fetch(`/api/story/${item.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || `Error ${res.status}`);
      return;
    }
    wrap.remove();
  });

  btns.appendChild(open);
  btns.appendChild(pdf);
  btns.appendChild(del);

  top.appendChild(left);
  top.appendChild(btns);

  wrap.appendChild(top);
  return wrap;
}

(async () => {
  const res = await fetch("/api/stories");
  const data = await res.json();
  (data.items || []).forEach((it) => list.appendChild(card(it)));
})();

function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return String(s).replace("T", " ").split(".")[0];

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}
