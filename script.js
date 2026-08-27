const SUPABASE_URL = "https://rbzbvbfgselsyrkxvwbj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_IqBG4JndPA3wgsji3ovftg_5VQ2ULIa";

const form = document.getElementById("lead-form");
const status = document.getElementById("lead-status");

document.querySelectorAll("[data-lead-intent]").forEach((el) => {
  el.addEventListener("click", () => {
    const messageField = form.querySelector('textarea[name="message"]');
    if (messageField && !messageField.value) messageField.value = el.dataset.leadIntent;
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());

  if (data.website) {
    // Champ piège rempli par un robot : on fait semblant que ça a marché, sans rien envoyer.
    status.textContent = "Merci ! On revient vers vous très vite.";
    status.style.color = "#a7f3d0";
    form.reset();
    return;
  }

  const submitBtn = form.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  status.textContent = "Envoi en cours...";
  status.style.color = "rgba(255,255,255,0.85)";

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        team_size: data.team_size || null,
        message: data.message || null,
      }),
    });
    if (!res.ok) throw new Error("request_failed");
    status.textContent = "Merci ! On revient vers vous très vite.";
    status.style.color = "#a7f3d0";
    form.reset();
  } catch (err) {
    status.textContent = "Une erreur est survenue. Réessayez ou écrivez-nous directement.";
    status.style.color = "#fecaca";
  } finally {
    submitBtn.disabled = false;
  }
});

const revealEls = document.querySelectorAll(".reveal");
if (revealEls.length) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("in-view"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  }
}

// Les 40 pastilles de la section « 40 opportunités → 4 priorités ».
// Générées ici plutôt qu'écrites à la main : 40 <span> dans le HTML seraient
// du bruit pour un lecteur d'écran comme pour quelqu'un qui relit la page.
(function drawFunnelDots() {
  const grid = document.querySelector(".funnel-dots");
  if (!grid) return;
  const PRIORITY_POSITIONS = new Set([3, 11, 22, 34]);
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 40; i++) {
    const dot = document.createElement("span");
    if (PRIORITY_POSITIONS.has(i)) dot.className = "is-prio";
    fragment.appendChild(dot);
  }
  grid.appendChild(fragment);
})();
