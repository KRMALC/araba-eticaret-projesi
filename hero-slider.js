/**
 * Hero kampanya slider — otomatik geçiş, oklar, noktalar
 */
(function () {
  "use strict";

  var HERO_SLIDES = [
    {
      image:
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1920&q=85&fit=crop",
      title: "BMW M Serisi Parçalarında %20 İndirim!",
      subtitle:
        "Performans ve orijinallik bir arada — frenden egzoza seçili ürünlerde kampanya.",
    },
    {
      image:
        "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1920&q=85&fit=crop",
      title: "Mercedes-Benz Orijinal Aksesuarlarıyla Aracını Kişiselleştir.",
      subtitle:
        "İç mekân aydınlatması, bagaj çözümleri ve daha fazlası — stokta sınırlı.",
    },
    {
      image: "XC90-clarkson-1.jpg",
      title: "Volvo Güvenlik ve Konfor Paketleri",
      subtitle:
        "Kış lastiği setleri ve güvenlik aksesuarlarında sezon indirimi.",
    },
  ];

  var AUTO_MS = 5000;
  var current = 0;
  var timer = null;
  var root = null;

  function $(id) {
    return document.getElementById(id);
  }

  function showSlide(index) {
    if (!root) return;
    var n = HERO_SLIDES.length;
    current = ((index % n) + n) % n;

    var slides = root.querySelectorAll("[data-hero-slide]");
    var dots = root.querySelectorAll("[data-hero-dot]");

    slides.forEach(function (el, i) {
      var active = i === current;
      el.classList.toggle("opacity-100", active);
      el.classList.toggle("opacity-0", !active);
      el.classList.toggle("z-[2]", active);
      el.classList.toggle("z-[1]", !active);
      el.classList.toggle("pointer-events-none", !active);
      el.setAttribute("aria-hidden", active ? "false" : "true");
    });

    dots.forEach(function (btn, i) {
      var on = i === current;
      btn.classList.toggle("bg-amber-400", on);
      btn.classList.toggle("w-8", on);
      btn.classList.toggle("bg-slate-500/80", !on);
      btn.classList.toggle("w-2.5", !on);
      btn.setAttribute("aria-current", on ? "true" : "false");
    });
  }

  function next() {
    showSlide(current + 1);
  }

  function prev() {
    showSlide(current - 1);
  }

  function stopAuto() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startAuto() {
    stopAuto();
    timer = setInterval(next, AUTO_MS);
  }

  function build() {
    root = $("hero-slider");
    if (!root) return;

    var track = $("hero-track");
    if (!track) return;

    track.innerHTML = HERO_SLIDES.map(function (slide, i) {
      return (
        '<div class="hero-slide absolute inset-0 transition-opacity duration-700 ease-out opacity-0 z-[1]" data-hero-slide="' +
        i +
        '" aria-hidden="true">' +
        '<img src="' +
        slide.image +
        '" alt="" class="absolute inset-0 w-full h-full object-cover object-center" loading="' +
        (i === 0 ? "eager" : "lazy") +
        '" />' +
        '<div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/25 pointer-events-none"></div>' +
        '<div class="absolute inset-0 z-10 flex flex-col justify-end p-5 sm:p-8 md:p-12 max-w-4xl">' +
        '<span class="text-xs sm:text-sm font-semibold uppercase tracking-widest text-amber-400/95 mb-2">Kampanya</span>' +
        '<h2 class="text-xl sm:text-2xl md:text-4xl font-bold text-white tracking-tight leading-tight drop-shadow-lg">' +
        escapeHtml(slide.title) +
        "</h2>" +
        '<p class="mt-2 sm:mt-3 text-sm sm:text-base md:text-lg text-slate-200/95 max-w-2xl leading-relaxed drop-shadow-md">' +
        escapeHtml(slide.subtitle) +
        "</p>" +
        "</div>" +
        "</div>"
      );
    }).join("");

    var dotsWrap = $("hero-dots");
    if (dotsWrap) {
      dotsWrap.innerHTML = HERO_SLIDES.map(function (_, i) {
        return (
          '<button type="button" data-hero-dot="' +
          i +
          '" class="h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950 ' +
          (i === 0 ? "w-8 bg-amber-400" : "w-2.5 bg-slate-500/80") +
          '" aria-label="Slayt ' +
          (i + 1) +
          '" ' +
          (i === 0 ? 'aria-current="true"' : "") +
          "></button>"
        );
      }).join("");
    }

    var btnPrev = $("hero-prev");
    var btnNext = $("hero-next");
    if (btnPrev) {
      btnPrev.addEventListener("click", function () {
        prev();
        startAuto();
      });
    }
    if (btnNext) {
      btnNext.addEventListener("click", function () {
        next();
        startAuto();
      });
    }

    root.querySelectorAll("[data-hero-dot]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.getAttribute("data-hero-dot"), 10);
        if (!isNaN(idx)) {
          showSlide(idx);
          startAuto();
        }
      });
    });

    root.addEventListener("mouseenter", stopAuto);
    root.addEventListener("mouseleave", startAuto);
    root.addEventListener("focusin", stopAuto);
    root.addEventListener("focusout", function (e) {
      if (!root.contains(e.relatedTarget)) startAuto();
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopAuto();
      else startAuto();
    });

    showSlide(0);
    startAuto();
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
