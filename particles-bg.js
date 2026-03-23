/**
 * Arka plan parçacıkları — Canvas, fare etkileşimi, düşük CPU
 */
(function () {
  "use strict";

  var canvas = document.getElementById("particle-canvas");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d", { alpha: true });
  var mouse = { x: 0, y: 0, in: false };
  var particles = [];
  var w = 0;
  var h = 0;
  var dpr = 1;
  var raf = 0;
  var running = false;

  var CONNECT = 110;
  var MOUSE_R = 180;
  var MOUSE_FORCE = 0.85;
  var PARTICLE_COUNT = 0;

  function reducedMotion() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  }

  function Particle() {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * 0.35;
    this.vy = (Math.random() - 0.5) * 0.35;
    this.r = Math.random() * 1.4 + 0.6;
    this.phase = Math.random() * Math.PI * 2;
  }

  Particle.prototype.step = function (dt) {
    this.phase += 0.008;
    this.vx += Math.sin(this.phase) * 0.0008;
    this.vy += Math.cos(this.phase * 0.7) * 0.0008;

    if (mouse.in) {
      var dx = this.x - mouse.x;
      var dy = this.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist < MOUSE_R) {
        var push = ((MOUSE_R - dist) / MOUSE_R) * MOUSE_FORCE;
        this.vx += (dx / dist) * push * 0.12;
        this.vy += (dy / dist) * push * 0.12;
      } else if (dist < MOUSE_R * 2.2) {
        var pull = 0.015 * (1 - dist / (MOUSE_R * 2.2));
        this.vx -= (dx / dist) * pull;
        this.vy -= (dy / dist) * pull;
      }
    }

    this.vx *= 0.988;
    this.vy *= 0.988;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < -20) this.x = w + 20;
    if (this.x > w + 20) this.x = -20;
    if (this.y < -20) this.y = h + 20;
    if (this.y > h + 20) this.y = -20;
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var target = Math.floor((w * h) / 18000);
    PARTICLE_COUNT = Math.max(36, Math.min(88, target));

    if (particles.length < PARTICLE_COUNT) {
      while (particles.length < PARTICLE_COUNT) particles.push(new Particle());
    } else {
      particles.length = PARTICLE_COUNT;
      for (var i = 0; i < PARTICLE_COUNT; i++) {
        if (!particles[i]) particles[i] = new Particle();
        else {
          particles[i].x = Math.random() * w;
          particles[i].y = Math.random() * h;
        }
      }
    }
  }

  function drawBg() {
    var g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#0a0a0a");
    g.addColorStop(0.45, "#0a0f18");
    g.addColorStop(1, "#0c1528");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function draw() {
    drawBg();

    var i;
    var j;
    var p;
    var q;
    var dx;
    var dy;
    var dist;
    var alpha;

    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      for (j = i + 1; j < particles.length; j++) {
        q = particles[j];
        dx = p.x - q.x;
        dy = p.y - q.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT) {
          alpha = (1 - dist / CONNECT) * 0.22;
          ctx.strokeStyle = "rgba(96, 165, 250, " + alpha + ")";
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }

    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(56, 189, 248, 0.5)";
      ctx.fillStyle = "rgba(224, 242, 254, " + (0.45 + p.r * 0.06) + ")";
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function loop() {
    if (!running) return;
    var dt = 1.4;
    var k;
    for (k = 0; k < particles.length; k++) {
      particles[k].step(dt);
    }
    draw();
    raf = requestAnimationFrame(loop);
  }

  function onMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.in = true;
  }

  function onLeave() {
    mouse.in = false;
  }

  function start() {
    if (reducedMotion()) {
      resize();
      drawBg();
      return;
    }
    resize();
    running = true;
    loop();
  }

  function stop() {
    running = false;
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  window.addEventListener("resize", function () {
    if (reducedMotion()) {
      resize();
      drawBg();
      return;
    }
    resize();
  });

  document.addEventListener("mousemove", onMove, { passive: true });
  document.addEventListener("mouseleave", onLeave);
  document.documentElement.addEventListener("mouseleave", onLeave);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
