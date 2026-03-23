/**
 * Profil / giriş / kayıt — Flask API (aynı köken, çerez oturumu)
 */
(function () {
  "use strict";

  var API = "";

  function $(id) {
    return document.getElementById(id);
  }

  function showMsg(elId, text, isErr) {
    var el = $(elId);
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("hidden", !text);
    el.classList.toggle("text-red-400", !!isErr);
    el.classList.toggle("text-emerald-400", !isErr && !!text);
  }

  function api(path, opts) {
    opts = opts || {};
    opts.credentials = "same-origin";
    opts.headers = opts.headers || {};
    if (
      opts.body &&
      typeof opts.body === "object" &&
      !(opts.body instanceof FormData)
    ) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(opts.body);
    }
    return fetch(API + path, opts)
      .then(function (r) {
        return r.text().then(function (t) {
          var data = {};
          try {
            data = t ? JSON.parse(t) : {};
          } catch (e) {
            data = { error: t || "Sunucu yanıtı okunamadı." };
          }
          return { ok: r.ok, status: r.status, data: data };
        });
      })
      .catch(function () {
        return {
          ok: false,
          status: 0,
          data: {
            error:
              "Bağlantı kurulamadı. Sunucuyu başlatın: py app.py (http://127.0.0.1:5000)",
          },
        };
      });
  }

  var currentUser = null;

  function setUserLabel() {
    var btn = $("profile-open");
    if (!btn) return;
    var label = btn.querySelector("[data-profile-label]");
    if (!label) return;
    if (currentUser) {
      var n =
        currentUser.first_name ||
        (currentUser.email && currentUser.email.split("@")[0]) ||
        "Hesap";
      label.textContent = n;
    } else {
      label.textContent = "Profilim";
    }
  }

  function showView(name) {
    var profile = $("auth-view-profile");
    var authBox = $("auth-view-auth");
    var login = $("auth-view-login");
    var register = $("auth-view-register");
    var forgot = $("auth-view-forgot");
    var reset = $("auth-view-reset");
    var tabLogin = $("auth-tab-login");
    var tabRegister = $("auth-tab-register");

    if (profile) profile.classList.add("hidden");
    if (authBox) authBox.classList.add("hidden");
    if (forgot) forgot.classList.add("hidden");
    if (reset) reset.classList.add("hidden");

    if (name === "profile") {
      if (profile) profile.classList.remove("hidden");
      return;
    }
    if (name === "forgot") {
      if (forgot) forgot.classList.remove("hidden");
      return;
    }
    if (name === "reset") {
      if (reset) reset.classList.remove("hidden");
      return;
    }

    if (authBox) authBox.classList.remove("hidden");
    if (name === "login") {
      if (login) login.classList.remove("hidden");
      if (register) register.classList.add("hidden");
      if (tabLogin) {
        tabLogin.className =
          "flex-1 rounded-md py-2 text-sm font-medium bg-amber-500/20 text-amber-300";
      }
      if (tabRegister) {
        tabRegister.className =
          "flex-1 rounded-md py-2 text-sm font-medium text-slate-400 hover:text-slate-200";
      }
    }
    if (name === "register") {
      if (register) register.classList.remove("hidden");
      if (login) login.classList.add("hidden");
      if (tabRegister) {
        tabRegister.className =
          "flex-1 rounded-md py-2 text-sm font-medium bg-amber-500/20 text-amber-300";
      }
      if (tabLogin) {
        tabLogin.className =
          "flex-1 rounded-md py-2 text-sm font-medium text-slate-400 hover:text-slate-200";
      }
    }
  }

  function openModal() {
    var bd = $("auth-backdrop");
    var md = $("auth-modal");
    if (bd) bd.classList.remove("hidden");
    if (md) {
      md.classList.remove("hidden");
      md.setAttribute("aria-hidden", "false");
    }
    document.body.classList.add("overflow-hidden");
  }

  function closeModal() {
    var bd = $("auth-backdrop");
    var md = $("auth-modal");
    if (bd) bd.classList.add("hidden");
    if (md) {
      md.classList.add("hidden");
      md.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("overflow-hidden");
    ["auth-msg-login", "auth-msg-register", "auth-msg-forgot", "auth-msg-reset"].forEach(
      function (id) {
        showMsg(id, "", false);
      }
    );
  }

  function refreshMe() {
    return api("/api/me", { method: "GET" }).then(function (res) {
      if (res.ok && res.data && res.data.user) {
        currentUser = res.data.user;
      } else {
        currentUser = null;
      }
      setUserLabel();
      return currentUser;
    });
  }

  function openProfileFlow() {
    openModal();
    return refreshMe().then(function (u) {
      if (u) {
        fillProfile(u);
        showView("profile");
      } else {
        showView("login");
      }
    });
  }

  function fillProfile(u) {
    var n = $("profile-display-name");
    var e = $("profile-display-email");
    var p = $("profile-display-phone");
    if (n) n.textContent = (u.first_name || "") + " " + (u.last_name || "");
    if (e) e.textContent = u.email || "—";
    if (p) p.textContent = u.phone || "—";
  }

  function bindForm(formId, handler) {
    var f = $(formId);
    if (!f) return;
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      handler(f, ev);
    });
  }

  function init() {
    refreshMe();

    var po = $("profile-open");
    if (po) po.addEventListener("click", openProfileFlow);

    $("auth-close") &&
      $("auth-close").addEventListener("click", closeModal);
    $("auth-backdrop") &&
      $("auth-backdrop").addEventListener("click", closeModal);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        var md = $("auth-modal");
        if (md && !md.classList.contains("hidden")) closeModal();
      }
    });

    $("auth-tab-login") &&
      $("auth-tab-login").addEventListener("click", function () {
        showView("login");
        showMsg("auth-msg-login", "", false);
        showMsg("auth-msg-register", "", false);
      });
    $("auth-tab-register") &&
      $("auth-tab-register").addEventListener("click", function () {
        showView("register");
        showMsg("auth-msg-login", "", false);
        showMsg("auth-msg-register", "", false);
      });
    $("auth-goto-register") &&
      $("auth-goto-register").addEventListener("click", function (e) {
        e.preventDefault();
        showView("register");
      });
    $("auth-goto-login") &&
      $("auth-goto-login").addEventListener("click", function (e) {
        e.preventDefault();
        showView("login");
      });
    $("auth-goto-forgot") &&
      $("auth-goto-forgot").addEventListener("click", function (e) {
        e.preventDefault();
        showView("forgot");
      });
    $("auth-back-to-login") &&
      $("auth-back-to-login").addEventListener("click", function (e) {
        e.preventDefault();
        showView("login");
      });
    $("auth-back-from-reset") &&
      $("auth-back-from-reset").addEventListener("click", function (e) {
        e.preventDefault();
        showView("login");
      });

    bindForm("form-login", function (form) {
      showMsg("auth-msg-login", "", false);
      var fd = new FormData(form);
      api("/api/login", {
        method: "POST",
        body: {
          email: fd.get("email"),
          password: fd.get("password"),
        },
      }).then(function (res) {
        if (res.ok && res.data.ok) {
          currentUser = res.data.user;
          setUserLabel();
          fillProfile(currentUser);
          showView("profile");
          form.reset();
          showMsg("auth-msg-login", "Giriş başarılı.", false);
        } else {
          showMsg(
            "auth-msg-login",
            (res.data && res.data.error) || "Giriş başarısız.",
            true
          );
        }
      });
    });

    bindForm("form-register", function (form) {
      showMsg("auth-msg-register", "", false);
      var fd = new FormData(form);
      var pw = fd.get("password");
      var pw2 = fd.get("password_confirm");
      if (pw !== pw2) {
        showMsg("auth-msg-register", "Şifreler eşleşmiyor.", true);
        return;
      }
      api("/api/register", {
        method: "POST",
        body: {
          first_name: fd.get("first_name"),
          last_name: fd.get("last_name"),
          email: fd.get("email"),
          phone: fd.get("phone") || "",
          password: pw,
        },
      }).then(function (res) {
        if (res.ok && res.data.ok) {
          currentUser = res.data.user;
          setUserLabel();
          fillProfile(currentUser);
          showView("profile");
          form.reset();
          showMsg("auth-msg-register", "Hesabınız oluşturuldu.", false);
        } else {
          showMsg(
            "auth-msg-register",
            (res.data && res.data.error) || "Kayıt başarısız.",
            true
          );
        }
      });
    });

    bindForm("form-forgot", function (form) {
      showMsg("auth-msg-forgot", "", false);
      var fd = new FormData(form);
      api("/api/forgot-password", {
        method: "POST",
        body: { email: fd.get("email") },
      }).then(function (res) {
        var d = res.data || {};
        if (res.ok && d.ok) {
          var msg = d.message || "İşlem tamam.";
          if (d.reset_token_shown) {
            msg +=
              " Token: " +
              d.reset_token_shown.substring(0, 24) +
              "…";
            $("reset-token").value = d.reset_token_shown;
            showView("reset");
            showMsg(
              "auth-msg-reset",
              d.reset_note_shown || "Yeni şifrenizi girin.",
              false
            );
          } else {
            showMsg("auth-msg-forgot", msg, false);
          }
        } else {
          showMsg(
            "auth-msg-forgot",
            (d && d.error) || "İşlem başarısız.",
            true
          );
        }
      });
    });

    bindForm("form-reset", function (form) {
      showMsg("auth-msg-reset", "", false);
      var fd = new FormData(form);
      var pw = fd.get("new_password");
      if (pw !== fd.get("new_password_confirm")) {
        showMsg("auth-msg-reset", "Şifreler eşleşmiyor.", true);
        return;
      }
      api("/api/reset-password", {
        method: "POST",
        body: {
          token: fd.get("token"),
          new_password: pw,
        },
      }).then(function (res) {
        var d = res.data || {};
        if (res.ok && d.ok) {
          form.reset();
          return refreshMe().then(function () {
            if (currentUser) {
              fillProfile(currentUser);
              showView("profile");
            }
            showMsg("auth-msg-reset", d.message || "Şifre güncellendi.", false);
          });
        }
        showMsg(
          "auth-msg-reset",
          (d && d.error) || "Sıfırlama başarısız.",
          true
        );
      });
    });

    $("profile-logout") &&
      $("profile-logout").addEventListener("click", function () {
        api("/api/logout", { method: "POST" }).then(function () {
          currentUser = null;
          setUserLabel();
          showView("login");
          closeModal();
        });
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
