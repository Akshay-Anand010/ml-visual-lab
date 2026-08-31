const KEY = "mlvl-theme";

export function initTheme() {
  const saved = localStorage.getItem(KEY);
  const theme = saved === "light" || saved === "dark" ? saved : "dark";
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.textContent = theme === "light" ? "Dark mode" : "Light mode";
    btn.onclick = () => {
      const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(KEY, next);
      btn.textContent = next === "light" ? "Dark mode" : "Light mode";
      window.dispatchEvent(new CustomEvent("mlvl-theme", { detail: next }));
    };
  }
}

export function initNav() {
  const bar = document.querySelector(".topbar");
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("siteNav");
  if (!bar || !toggle) return;

  const setOpen = (open) => {
    bar.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  toggle.addEventListener("click", () => setOpen(!bar.classList.contains("nav-open")));
  nav?.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  window.addEventListener("hashchange", () => setOpen(false));
}
