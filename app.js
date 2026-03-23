(function () {
  "use strict";

  const STORAGE_KEY = "oto-market-cart-v1";
  const SKELETON_MS = 380;

  const categoryFilterMap = {
    Otomobil: "Araç Satış",
    "Yedek Parça": "Yedek Parça",
    Aksesuar: "Aksesuar",
  };

  let state = {
    brand: "",
    categoryUi: "",
    searchQuery: "",
    cart: loadCart(),
  };

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
  }

  function formatPrice(n) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(n);
  }

  function categoryLabel(cat) {
    if (cat === "Araç Satış") return "Otomobil";
    return cat;
  }

  function getFilteredProducts() {
    let list = PRODUCTS.slice();
    if (state.brand) {
      list = list.filter((p) => p.brand === state.brand);
    }
    if (state.categoryUi) {
      const cat = categoryFilterMap[state.categoryUi];
      if (cat) list = list.filter((p) => p.category === cat);
    }
    const q = (state.searchQuery || "").trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          categoryLabel(p.category).toLowerCase().includes(q)
        );
      });
    }
    return list;
  }

  function cartItemCount() {
    return state.cart.reduce((s, i) => s + i.qty, 0);
  }

  function cartTotal() {
    return state.cart.reduce((s, i) => {
      const p = PRODUCTS.find((x) => x.id === i.id);
      return s + (p ? p.price * i.qty : 0);
    }, 0);
  }

  function showToast(message) {
    const wrap = document.getElementById("toast");
    const text = document.getElementById("toast-text");
    if (!wrap || !text) return;
    text.textContent = message || "Sepete eklendi";
    wrap.classList.remove("hidden");
    requestAnimationFrame(() => {
      wrap.classList.remove("opacity-0", "translate-y-2");
      wrap.classList.add("opacity-100", "translate-y-0");
    });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      wrap.classList.add("opacity-0", "translate-y-2");
      wrap.classList.remove("opacity-100", "translate-y-0");
      setTimeout(() => wrap.classList.add("hidden"), 280);
    }, 2200);
  }

  function addToCart(productId, opts) {
    const openCartAfter = opts && opts.openCart;
    const existing = state.cart.find((c) => c.id === productId);
    if (existing) existing.qty += 1;
    else state.cart.push({ id: productId, qty: 1 });
    saveCart();
    renderCartBadge();
    renderCartPanel();
    const p = PRODUCTS.find((x) => x.id === productId);
    showToast(p ? `"${p.title}" sepete eklendi` : "Sepete eklendi");
    if (openCartAfter) openCart();
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter((c) => c.id !== productId);
    saveCart();
    renderCartBadge();
    renderCartPanel();
  }

  function updateQty(productId, delta) {
    const item = state.cart.find((c) => c.id === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty < 1) removeFromCart(productId);
    else {
      saveCart();
      renderCartBadge();
      renderCartPanel();
    }
  }

  function renderCartBadge() {
    const el = document.getElementById("cart-count");
    if (!el) return;
    const n = cartItemCount();
    el.textContent = n > 99 ? "99+" : String(n);
    el.classList.toggle("hidden", n === 0);
  }

  function renderCartPanel() {
    const body = document.getElementById("cart-panel-body");
    const totalEl = document.getElementById("cart-total");
    if (!body || !totalEl) return;

    if (state.cart.length === 0) {
      body.innerHTML =
        '<p class="text-slate-400 text-sm py-8 text-center">Sepetiniz boş.</p>';
      totalEl.textContent = formatPrice(0);
      return;
    }

    body.innerHTML = state.cart
      .map((item) => {
        const p = PRODUCTS.find((x) => x.id === item.id);
        if (!p) return "";
        return `
        <div class="flex gap-3 py-3 border-b border-slate-700/80 last:border-0" data-cart-row="${p.id}">
          <img src="${p.image}" alt="" class="w-16 h-16 object-cover rounded-lg shrink-0 bg-slate-800" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-100 truncate">${escapeHtml(p.title)}</p>
            <p class="text-xs text-slate-500 mt-0.5">${escapeHtml(p.brand)}</p>
            <div class="flex items-center justify-between mt-2 gap-2">
              <span class="text-amber-400 text-sm font-semibold">${formatPrice(p.price)}</span>
              <div class="flex items-center gap-1">
                <button type="button" class="qty-btn w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-lg leading-none" data-action="dec" data-id="${p.id}">−</button>
                <span class="w-8 text-center text-sm text-slate-300">${item.qty}</span>
                <button type="button" class="qty-btn w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-lg leading-none" data-action="inc" data-id="${p.id}">+</button>
                <button type="button" class="ml-2 text-slate-500 hover:text-red-400 p-1" data-action="remove" data-id="${p.id}" aria-label="Kaldır">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>`;
      })
      .join("");

    totalEl.textContent = formatPrice(cartTotal());

    body.querySelectorAll(".qty-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const action = btn.getAttribute("data-action");
        if (action === "inc") updateQty(id, 1);
        else if (action === "dec") updateQty(id, -1);
      });
    });
    body.querySelectorAll('[data-action="remove"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        removeFromCart(btn.getAttribute("data-id"));
      });
    });
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function renderSkeletonGrid() {
    const grid = document.getElementById("product-grid");
    if (!grid) return;
    const n = 6;
    grid.innerHTML = Array.from({ length: n })
      .map(
        () => `
      <div class="rounded-xl border border-white/10 bg-slate-900/30 backdrop-blur-xl overflow-hidden animate-pulse">
        <div class="aspect-[4/3] bg-slate-800/70"></div>
        <div class="p-4 space-y-3">
          <div class="h-2 bg-slate-700/60 rounded w-1/3"></div>
          <div class="h-4 bg-slate-700/60 rounded w-3/4"></div>
          <div class="h-3 bg-slate-700/50 rounded w-full"></div>
          <div class="h-3 bg-slate-700/50 rounded w-5/6"></div>
          <div class="flex gap-2 pt-2">
            <div class="h-9 flex-1 bg-slate-700/50 rounded-lg"></div>
            <div class="h-9 flex-1 bg-slate-700/50 rounded-lg"></div>
          </div>
        </div>
      </div>`
      )
      .join("");
  }

  function renderProductGrid() {
    const grid = document.getElementById("product-grid");
    if (!grid) return;
    const items = getFilteredProducts();

    if (items.length === 0) {
      grid.innerHTML =
        '<p class="col-span-full text-center text-slate-400 py-16">Bu filtrelere veya aramaya uygun ürün bulunamadı.</p>';
      return;
    }

    grid.innerHTML = items
      .map(
        (p) => `
      <article class="group rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-xl overflow-hidden hover:border-amber-500/35 hover:shadow-lg hover:shadow-cyan-950/20 ring-1 ring-white/5 transition-all duration-300 flex flex-col">
        <div class="aspect-[4/3] overflow-hidden bg-slate-950/50">
          <img src="${p.image}" alt="${escapeHtml(p.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        </div>
        <div class="p-4 flex flex-col flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="text-xs font-medium px-2 py-0.5 rounded bg-slate-700/80 text-amber-400/90">${escapeHtml(p.brand)}</span>
            <span class="text-xs text-slate-500">${escapeHtml(categoryLabel(p.category))}</span>
          </div>
          <h3 class="font-semibold text-slate-100 text-lg leading-snug line-clamp-2">${escapeHtml(p.title)}</h3>
          <p class="text-slate-400 text-sm mt-2 line-clamp-2 flex-1">${escapeHtml(p.description)}</p>
          <div class="mt-4 pt-3 border-t border-slate-700/60 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xl font-bold text-amber-400">${formatPrice(p.price)}</span>
            </div>
            <div class="flex gap-2">
              <button type="button" class="detail-btn flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg border border-white/15 bg-white/5 text-slate-200 text-sm font-medium hover:bg-white/10 transition-colors" data-id="${p.id}">
                Detay
              </button>
              <button type="button" class="add-cart-btn flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm transition-colors" data-id="${p.id}">
                Sepete Ekle
              </button>
            </div>
          </div>
        </div>
      </article>`
      )
      .join("");

    grid.querySelectorAll(".add-cart-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        addToCart(btn.getAttribute("data-id"), { openCart: false });
      });
    });
    grid.querySelectorAll(".detail-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        openProductModal(btn.getAttribute("data-id"));
      });
    });
  }

  function openProductModal(productId) {
    const p = PRODUCTS.find((x) => x.id === productId);
    if (!p) return;
    const titleEl = document.getElementById("product-modal-title");
    const body = document.getElementById("product-modal-body");
    const backdrop = document.getElementById("product-modal-backdrop");
    const modal = document.getElementById("product-modal");
    if (!body || !backdrop || !modal) return;
    if (titleEl) titleEl.textContent = p.title;
    body.innerHTML = `
      <div class="rounded-xl overflow-hidden border border-white/10 bg-slate-900/50 mb-4">
        <img src="${p.image}" alt="${escapeHtml(p.title)}" class="w-full h-44 object-cover" />
      </div>
      <p class="text-xs text-slate-500 mb-1">${escapeHtml(p.brand)} · ${escapeHtml(categoryLabel(p.category))}</p>
      <p class="text-sm text-slate-300 leading-relaxed mb-4">${escapeHtml(p.description)}</p>
      <p class="text-2xl font-bold text-amber-400 mb-4">${formatPrice(p.price)}</p>
      <button type="button" class="modal-add-cart w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold py-3 text-sm" data-id="${p.id}">
        Sepete ekle
      </button>
    `;
    const addBtn = body.querySelector(".modal-add-cart");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        addToCart(p.id, { openCart: false });
        closeProductModal();
      });
    }
    backdrop.classList.remove("hidden");
    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  }

  function closeProductModal() {
    const backdrop = document.getElementById("product-modal-backdrop");
    const modal = document.getElementById("product-modal");
    if (backdrop) backdrop.classList.add("hidden");
    if (modal) modal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  }

  function bindProductModal() {
    const backdrop = document.getElementById("product-modal-backdrop");
    const closeBtn = document.getElementById("product-modal-close");
    if (closeBtn) closeBtn.addEventListener("click", closeProductModal);
    if (backdrop) backdrop.addEventListener("click", closeProductModal);
  }

  function syncFilterUI() {
    const brandSel = document.getElementById("filter-brand");
    const catSel = document.getElementById("filter-category");
    const searchInput = document.getElementById("product-search");
    if (brandSel) brandSel.value = state.brand || "";
    if (catSel) catSel.value = state.categoryUi || "";
    if (searchInput) searchInput.value = state.searchQuery || "";
  }

  function bindFilters() {
    const brandSel = document.getElementById("filter-brand");
    const catSel = document.getElementById("filter-category");
    const resetBtn = document.getElementById("filter-reset");

    if (brandSel) {
      brandSel.addEventListener("change", () => {
        state.brand = brandSel.value;
        renderProductGrid();
      });
    }
    if (catSel) {
      catSel.addEventListener("change", () => {
        state.categoryUi = catSel.value;
        renderProductGrid();
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        state.brand = "";
        state.categoryUi = "";
        state.searchQuery = "";
        syncFilterUI();
        renderProductGrid();
      });
    }
  }

  function bindSearch() {
    const input = document.getElementById("product-search");
    if (!input) return;
    let t;
    input.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        state.searchQuery = input.value;
        renderProductGrid();
      }, 200);
    });
  }

  function openCart() {
    const backdrop = document.getElementById("cart-backdrop");
    const panel = document.getElementById("cart-panel");
    if (backdrop) backdrop.classList.remove("hidden");
    if (panel) {
      panel.classList.remove("translate-x-full");
      panel.setAttribute("aria-hidden", "false");
    }
    document.body.classList.add("overflow-hidden");
    renderCartPanel();
  }

  function closeCart() {
    const backdrop = document.getElementById("cart-backdrop");
    const panel = document.getElementById("cart-panel");
    if (backdrop) backdrop.classList.add("hidden");
    if (panel) {
      panel.classList.add("translate-x-full");
      panel.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("overflow-hidden");
  }

  function bindCartToggle() {
    const openBtn = document.getElementById("cart-open");
    const closeBtn = document.getElementById("cart-close");
    const backdrop = document.getElementById("cart-backdrop");

    if (openBtn) openBtn.addEventListener("click", openCart);
    if (closeBtn) closeBtn.addEventListener("click", closeCart);
    if (backdrop) backdrop.addEventListener("click", closeCart);

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      closeCart();
      closeProductModal();
    });
  }

  function setFooterYear() {
    const el = document.getElementById("footer-year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function init() {
    setFooterYear();
    bindFilters();
    bindSearch();
    bindCartToggle();
    bindProductModal();
    syncFilterUI();
    renderSkeletonGrid();
    renderCartBadge();
    renderCartPanel();

    const prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = prefersReduced ? 0 : SKELETON_MS;
    setTimeout(() => {
      renderProductGrid();
    }, delay);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
