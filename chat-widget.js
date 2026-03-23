/**
 * AI Canlı Destek — arayüz (API: server.js /api/chat)
 */
(function () {
  "use strict";

  var API_BASE =
    (typeof window !== "undefined" && window.__CHAT_API__) ||
    "http://127.0.0.1:5001";

  var history = [];
  var open = false;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function renderMessages() {
    var box = $("chat-messages");
    if (!box) return;
    if (history.length === 0) {
      box.innerHTML =
        '<p class="text-xs text-slate-500 text-center py-6 px-2 leading-relaxed">Merhaba! Oto Market\'te yedek parça ve aksesuarlar hakkında sorularınızı yazabilirsiniz.</p>';
      return;
    }
    box.innerHTML = history
      .map(function (m) {
        var isUser = m.role === "user";
        return (
          '<div class="flex ' +
          (isUser ? "justify-end" : "justify-start") +
          ' mb-3">' +
          '<div class="max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ' +
          (isUser
            ? "bg-cyan-600/90 text-white rounded-br-md"
            : "bg-white/10 text-slate-100 border border-white/10 rounded-bl-md") +
          '">' +
          escapeHtml(m.content).replace(/\n/g, "<br/>") +
          "</div></div>"
        );
      })
      .join("");
    box.scrollTop = box.scrollHeight;
  }

  function setTyping(on) {
    var el = $("chat-typing");
    if (!el) return;
    el.classList.toggle("hidden", !on);
    if (on) {
      var box = $("chat-messages");
      if (box) box.scrollTop = box.scrollHeight;
    }
  }

  function setError(msg) {
    var el = $("chat-error");
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.classList.remove("hidden");
    } else {
      el.textContent = "";
      el.classList.add("hidden");
    }
  }

  function sendMessage(text) {
    text = (text || "").trim();
    if (!text) return;

    setError("");
    history.push({ role: "user", content: text });
    renderMessages();

    var input = $("chat-input");
    if (input) input.value = "";

    setTyping(true);

    fetch(API_BASE.replace(/\/$/, "") + "/api/chat", {
      method: "POST",
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, data: data };
        });
      })
      .then(function (res) {
        setTyping(false);
        if (res.ok && res.data && res.data.ok && res.data.reply) {
          history.push({ role: "assistant", content: res.data.reply });
          renderMessages();
        } else {
          var err =
            (res.data && res.data.error) || "Yanıt alınamadı. Sunucuyu kontrol edin.";
          setError(err);
          history.pop();
          renderMessages();
          if (input) input.value = text;
        }
      })
      .catch(function () {
        setTyping(false);
        setError(
          "Bağlantı kurulamadı. `npm run chat` ile sunucunun çalıştığından emin olun (" +
            API_BASE +
            ")."
        );
        history.pop();
        renderMessages();
        if (input) input.value = text;
      });
  }

  function togglePanel() {
    open = !open;
    var panel = $("chat-panel");
    var fab = $("chat-fab");
    if (panel) panel.classList.toggle("hidden", !open);
    if (fab) fab.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      var inp = $("chat-input");
      if (inp) setTimeout(function () { inp.focus(); }, 200);
    }
  }

  function init() {
    var fab = $("chat-fab");
    var closeBtn = $("chat-close");
    var form = $("chat-form");

    if (fab) fab.addEventListener("click", togglePanel);
    if (closeBtn) closeBtn.addEventListener("click", togglePanel);

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var inp = $("chat-input");
        if (inp) sendMessage(inp.value);
      });
    }

    renderMessages();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
