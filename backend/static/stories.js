const list = document.getElementById("list");

function card(item) {
    const div = document.createElement("a");
    div.href = `/story/${item.id}`;
    div.className = "block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800";
    div.innerHTML = `
    <div class="text-sm font-semibold">${item.title}</div>
    <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">${item.created_at}</div>
  `;
    return div;
}

(async () => {
    const res = await fetch("/api/stories");
    const data = await res.json();
    (data.items || []).forEach(it => list.appendChild(card(it)));
})();
