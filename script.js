const SUPABASE_URL = "https://rbzbvbfgselsyrkxvwbj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_IqBG4JndPA3wgsji3ovftg_5VQ2ULIa";

const form = document.getElementById("lead-form");
const status = document.getElementById("lead-status");

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
        company: data.company || null,
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
