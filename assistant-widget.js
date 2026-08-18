(function () {
  const state = { open: false, sending: false, messages: [] };

  const root = document.createElement("div");
  root.innerHTML = `
    <button id="cw-toggle" aria-label="Assistant Closia" class="cw-toggle">
      <svg id="cw-icon-open" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"/></svg>
      <svg id="cw-icon-close" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
    <div id="cw-panel" class="cw-panel" hidden>
      <div class="cw-header">
        <span>Assistant Closia</span>
        <button id="cw-close" aria-label="Fermer" class="cw-close">&times;</button>
      </div>
      <div id="cw-messages" class="cw-messages">
        <div class="cw-msg cw-msg-assistant">Bonjour ! Une question sur Closia (fonctionnalités, tarifs, démo) ? Je suis là pour vous aider.</div>
      </div>
      <form id="cw-form" class="cw-form">
        <input id="cw-input" type="text" placeholder="Posez votre question..." autocomplete="off" maxlength="800" />
        <button type="submit" id="cw-send" aria-label="Envoyer">→</button>
      </form>
    </div>
  `;
  document.body.appendChild(root);

  const toggleBtn = document.getElementById("cw-toggle");
  const closeBtn = document.getElementById("cw-close");
  const panel = document.getElementById("cw-panel");
  const iconOpen = document.getElementById("cw-icon-open");
  const iconClose = document.getElementById("cw-icon-close");
  const messagesEl = document.getElementById("cw-messages");
  const form = document.getElementById("cw-form");
  const input = document.getElementById("cw-input");

  function setOpen(open) {
    state.open = open;
    panel.hidden = !open;
    panel.classList.toggle("cw-open", open);
    iconOpen.style.display = open ? "none" : "block";
    iconClose.style.display = open ? "block" : "none";
    if (open) input.focus();
  }

  toggleBtn.addEventListener("click", () => setOpen(!state.open));
  closeBtn.addEventListener("click", () => setOpen(false));

  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = `cw-msg cw-msg-${role}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question || state.sending) return;
    input.value = "";
    addMessage("user", question);
    state.messages.push({ role: "user", text: question });
    state.sending = true;
    const thinking = addMessage("assistant", "…");
    thinking.classList.add("cw-thinking");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, history: state.messages.slice(0, -1) }),
      });
      const data = await res.json();
      thinking.remove();
      const answer = res.ok ? data.text : "Une erreur est survenue. Réessayez ou écrivez-nous via le formulaire de contact.";
      addMessage("assistant", answer);
      state.messages.push({ role: "assistant", text: answer });
    } catch (err) {
      thinking.remove();
      addMessage("assistant", "Une erreur est survenue. Réessayez ou écrivez-nous via le formulaire de contact.");
    } finally {
      state.sending = false;
    }
  });
})();
