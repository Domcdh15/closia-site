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
  // La base attend un nom complet obligatoire ; le formulaire demande
  // prénom et nom séparément, plus lisibles à saisir.
  data.name = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();

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
        first_name: data.first_name || null,
        last_name: data.last_name || null,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        team_size: data.team_size || null,
        industry: data.industry || null,
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
        // Apparition symétrique : la section se révèle en entrant dans
        // l'écran et se retire en le quittant, dans les deux sens.
        // On garde donc l'observation active au lieu de s'arrêter au
        // premier passage.
        entries.forEach((entry) => {
          entry.target.classList.toggle("in-view", entry.isIntersecting);
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

// Visite du produit : la barre latérale de Closia, cliquable.
// Sans JavaScript, tous les panneaux restent affichés — on ne cache
// jamais l'information derrière un script.
(function tourProduit() {
  const nav = document.querySelector(".tour-nav");
  if (!nav) return;
  const onglets = [...nav.querySelectorAll(".tour-item")];
  const panneaux = [...document.querySelectorAll(".tour-panel")];

  function choisir(cle) {
    onglets.forEach((o) => {
      const actif = o.dataset.tour === cle;
      o.classList.toggle("is-active", actif);
      o.setAttribute("aria-selected", actif ? "true" : "false");
    });
    panneaux.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === cle));
  }

  nav.addEventListener("click", (e) => {
    const onglet = e.target.closest(".tour-item");
    if (onglet) choisir(onglet.dataset.tour);
  });

  // Flèches haut/bas comme dans une vraie barre latérale.
  nav.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const i = onglets.findIndex((o) => o.classList.contains("is-active"));
    const suivant = onglets[(i + (e.key === "ArrowDown" ? 1 : -1) + onglets.length) % onglets.length];
    e.preventDefault();
    choisir(suivant.dataset.tour);
    suivant.focus();
  });
})();

// La barre latérale de la simulation reste calée sous l'en-tête pendant tout le
// défilement de la section. Sa hauteur est mesurée à l'exécution plutôt que
// codée en dur : l'en-tête change de hauteur selon la largeur de l'écran, et un
// nombre figé finirait toujours par être faux quelque part.
const enTete = document.querySelector(".nav");
if (enTete) {
  const calerBarreLaterale = () =>
    document.documentElement.style.setProperty("--tour-top", `${enTete.offsetHeight + 16}px`);
  calerBarreLaterale();
  window.addEventListener("resize", calerBarreLaterale);
}
