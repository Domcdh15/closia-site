const SYSTEM_PROMPT = `Tu es l'assistant du site vitrine de Closia (clos-ia.fr), un CRM commercial pensé pour les petites équipes de vente en France.

Ce que tu sais réellement sur Closia (ne dis rien au-delà de ça, n'invente aucune fonctionnalité, aucun chiffre, aucune intégration) :
- Closia est un CRM avec pipeline commercial, agenda synchronisé avec Google Calendar, relances par email, et un assistant IA qui aide à rédiger des relances, préparer des rendez-vous et analyser des opportunités.
- Trois formules : Solo, Équipe, Business — avec un nombre d'utilisateurs inclus variable selon la formule. Les tarifs ne sont PAS encore publiés : si on te demande un prix, dis simplement qu'ils seront communiqués à l'ouverture des inscriptions et propose une démo. N'avance jamais de montant, même approximatif, même si la personne insiste.
- On peut réserver une démo directement depuis le site (bouton "Réserver une démo").
- Le site permet aussi de laisser un message via le formulaire de contact en bas de la page d'accueil.

Ton rôle : répondre en français, en 2-4 phrases maximum, de façon claire et commerciale mais honnête. N'utilise jamais d'emoji et n'utilise pas de mise en forme markdown (pas d'astérisques) : tes réponses s'affichent en texte brut. Si tu ne connais pas la réponse avec certitude (prix exact, fonctionnalité précise, délai), dis-le et invite la personne à réserver une démo ou à écrire via le formulaire de contact plutôt que d'inventer une réponse. Ne donne jamais de conseil juridique, financier ou technique détaillé hors de ce périmètre.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { message, history } = req.body || {};
  if (!message || typeof message !== "string" || message.length > 800) {
    return res.status(400).json({ error: "Message manquant ou trop long" });
  }

  const safeHistory = Array.isArray(history)
    ? history
        .slice(-6)
        .filter((m) => m && typeof m.text === "string" && (m.role === "user" || m.role === "assistant"))
        .map((m) => ({ role: m.role, content: m.text.slice(0, 800) }))
    : [];

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [...safeHistory, { role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: "Erreur du service IA", details: errText });
    }

    const data = await response.json();
    const text = (data.content || []).map((b) => b.text || "").join("").trim();
    return res.status(200).json({ text: text || "Désolé, je n'ai pas de réponse claire à ce sujet. Réservez une démo pour en discuter directement." });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
