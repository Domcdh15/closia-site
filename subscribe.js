const SUPABASE_URL = "https://rbzbvbfgselsyrkxvwbj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_IqBG4JndPA3wgsji3ovftg_5VQ2ULIa";

const PLAN_LABELS = { solo: "Solo", equipe: "Équipe", business: "Business" };

const planCards = document.querySelectorAll(".plan-card");
const seatsField = document.getElementById("seats-field");
const seatsInput = document.getElementById("seats");
const seatsHint = document.getElementById("seats-hint");
const summaryPlan = document.getElementById("summary-plan");
const summarySeats = document.getElementById("summary-seats");
const summaryTotal = document.getElementById("summary-total");

let selectedPlan = null;

function selectPlan(card) {
  planCards.forEach((c) => c.classList.remove("selected"));
  card.classList.add("selected");
  selectedPlan = {
    key: card.dataset.plan,
    price: Number(card.dataset.price),
    seatsIncluded: Number(card.dataset.seatsIncluded),
    overage: Number(card.dataset.overage),
  };

  if (selectedPlan.key === "solo") {
    seatsField.classList.remove("visible");
    seatsInput.value = 1;
  } else {
    seatsField.classList.add("visible");
    seatsInput.min = 1;
    if (Number(seatsInput.value) < 1) seatsInput.value = selectedPlan.seatsIncluded;
    seatsHint.textContent = `${selectedPlan.seatsIncluded} utilisateur${selectedPlan.seatsIncluded > 1 ? "s" : ""} inclus, puis ${selectedPlan.overage}€/utilisateur supplémentaire.`;
  }

  updateSummary();
}

function updateSummary() {
  if (!selectedPlan) return;
  const seats = Math.max(1, Number(seatsInput.value) || 1);
  const extra = Math.max(0, seats - selectedPlan.seatsIncluded);
  const total = selectedPlan.price + extra * selectedPlan.overage;

  summaryPlan.textContent = PLAN_LABELS[selectedPlan.key];
  summarySeats.textContent = selectedPlan.key === "solo"
    ? "1 (inclus)"
    : `${seats}${extra > 0 ? ` (${selectedPlan.seatsIncluded} inclus + ${extra} en plus)` : " (inclus)"}`;
  summaryTotal.textContent = `${total}€ / mois`;
}

planCards.forEach((card) => card.addEventListener("click", () => selectPlan(card)));
seatsInput.addEventListener("input", updateSummary);

// Présélection depuis ?plan=solo|equipe|business (lien depuis les cartes tarifs de index.html)
const params = new URLSearchParams(window.location.search);
const preselect = params.get("plan");
const initialCard = [...planCards].find((c) => c.dataset.plan === preselect) || planCards[1];
selectPlan(initialCard);

const form = document.getElementById("subscribe-form");
const status = document.getElementById("sub-status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const submitBtn = form.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  status.textContent = "Envoi en cours...";
  status.style.color = "var(--text-dim)";

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/subscription_requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        plan: selectedPlan.key,
        seats: Math.max(1, Number(seatsInput.value) || 1),
        company_name: data.company_name,
        billing_siret_or_vat: data.billing_siret_or_vat || null,
        billing_address: data.billing_address,
        billing_postal_code: data.billing_postal_code,
        billing_city: data.billing_city,
        billing_country: data.billing_country,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone || null,
        payment_method: data.payment_method,
        message: data.message || null,
      }),
    });
    if (!res.ok) throw new Error("request_failed");
    form.style.display = "none";
    status.textContent = "Merci ! Votre demande est enregistrée — nous revenons vers vous sous 24h avec votre accès et votre facture.";
    status.style.color = "#16a34a";
    status.style.fontSize = "15px";
    status.style.fontWeight = "600";
  } catch (err) {
    status.textContent = "Une erreur est survenue. Réessayez ou écrivez-nous directement.";
    status.style.color = "var(--gold-deep)";
  } finally {
    submitBtn.disabled = false;
  }
});
