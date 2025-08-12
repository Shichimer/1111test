// GPT-5 Thinking — Local Standalone (Canvas + Vanilla JS, noindex v2, centered hero)
(() => {
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d', { alpha: true });

  // UI elements
  const btnMode = document.getElementById('modeBtn');
  const btnPalette = document.getElementById('paletteBtn');
  const btnPause = document.getElementById('pauseBtn');
  const btnSave = document.getElementById('saveBtn');
  const rangeDensity = document.getElementById('density');
  const rangeSpeed = document.getElementById('speed');
  const rangeScale = document.getElementById('scale');
  const densityVal = document.getElementById('densityVal');
  const speedVal = document.getElementById('speedVal');
  const scaleVal = document.getElementById('scaleVal');
  const hudToggle = document.getElementById('hudToggle');
  const desc = document.getElementById('desc');

  // State
  let paused = false;
  let paletteIndex = 0;
  let modeIndex = 0;
  let density = 1800;
  let speed = 0.9;
  let scale = 0.0016;
  let showHUD = true;
  let saving = false;
  let dpr = 1;
  let time = 0;
  const maxParticles = 5000;
  const pointer = { x: 0, y: 0, down: false, hasInteracted: false };

  // Particles
  const particles = new Array(maxParticles).fill(0).map(() => ({
    x: 0, y: 0, px: 0, py: 0, life: 0, seed: Math.random(),
  }));

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0b0b10";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // respawn to screen
    for (let i = 0; i < maxParticles; i++) {
      particles[i].x = Math.random() * w;
      particles[i].y = Math.random() * h;
      particles[i].px = particles[i].x;
      particles[i].py = particles[i].y;
      particles[i].life = Math.random() * 200 + 100;
    }
  }

  // Palettes
  const palettes = [
    (t) => `hsl(${(200 + t * 80) % 360} 80% ${40 + 30 * Math.sin(t * 2 * Math.PI)}%)`, // Aurora
    (t) => `hsl(${(300 + t * 120) % 360} 95% ${60 + 30 * Math.sin(t * 6.28)}%)`,       // Neon
    (t) => `hsl(${(180 + t * 60) % 360} 70% ${45 + 20 * Math.sin(t * 3.14)}%)`,        // Ocean
    (t) => `hsl(${(20 + t * 140) % 360} 90% ${50 + 25 * Math.sin(t * 6.28)}%)`,        // Sunset
    (t) => `hsl(${(220 + t * 10) % 360} 5% ${30 + 55 * t}%)`,                           // Mono
  ];

  function field(ix, iy, t, w, h) {
    const x = ix / w - 0.5;
    const y = iy / h - 0.5;
    const s = scale;
    const u = Math.sin((x * 1200) * s + t * 0.7) + Math.cos((y * 900) * s - t * 1.1);
    const v = Math.cos((x + y) * 700 * s + t * 0.3) - Math.sin((x - y) * 1100 * s - t * 0.2);

    let a = 0;
    if (modeIndex % 3 === 0) a = u * 1.2 + v * 0.8;
    if (modeIndex % 3 === 1) a = Math.atan2(v, u) * 2.0;
    if (modeIndex % 3 === 2) a = (u * v) * 0.9;

    const px = (pointer.x - w / 2) / w;
    const py = (pointer.y - h / 2) / h;
    const dx = x - px;
    const dy = y - py;
    const r2 = dx * dx + dy * dy;
    const influence = pointer.down ? 0.002 : 0.0004;
    const swirl = r2 > 1e-6 ? 1 / (r2 * 80 + 1) : 0;

    const angle = a + (pointer.hasInteracted ? (dx * -py + dy * px) * influence * swirl * 500 : 0);
    const vx = Math.cos(angle);
    const vy = Math.sin(angle);
    return { vx, vy, angle };
  }

  function draw() {
    if (paused) return;

    const w = canvas.width;
    const h = canvas.height;

    // trail fade
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#0b0b10";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 1.2 * dpr;
    const pal = palettes[paletteIndex];
    time += 0.006;

    const active = Math.min(density, maxParticles);
    for (let i = 0; i < active; i++) {
      const p = particles[i];
      const F = field(p.x, p.y, time, w, h);
      const vx = F.vx * speed * 1.8 * dpr;
      const vy = F.vy * speed * 1.8 * dpr;

      const nx = p.x + vx;
      const ny = p.y + vy;

      if (nx < 0 || nx >= w || ny < 0 || ny >= h || p.life <= 0) {
        p.x = Math.random() * w;
        p.y = Math.random() * h;
        p.px = p.x; p.py = p.y; p.life = 200 + Math.random() * 300;
        continue;
      }

      const t = (Math.atan2(vy, vx) / (Math.PI * 2) + 1 + p.seed) % 1;
      ctx.strokeStyle = pal(t);
      ctx.globalAlpha = 0.06 + 0.12 * Math.abs(Math.sin(t * Math.PI * 2));

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      p.px = p.x; p.py = p.y; p.x = nx; p.y = ny; p.life -= 1;
    }

    requestAnimationFrame(draw);
  }

  // Input handlers
  function onMove(e) {
    pointer.hasInteracted = true;
    if (e.touches && e.touches[0]) {
      pointer.x = e.touches[0].clientX * dpr;
      pointer.y = e.touches[0].clientY * dpr;
    } else {
      pointer.x = e.clientX * dpr;
      pointer.y = e.clientY * dpr;
    }
  }
  function onDown() { pointer.down = true; }
  function onUp() { pointer.down = false; }

  function updateButtons() {
    btnMode.textContent = `モード ${(modeIndex % 3) + 1}/3`;
    btnPalette.textContent = `パレット ${(paletteIndex % 5) + 1}/5`;
    btnPause.textContent = paused ? "再開" : "停止";
    densityVal.textContent = `${density} 粒`;
    speedVal.textContent = `×${speed.toFixed(2)}`;
    scaleVal.textContent = `${scale.toFixed(4)}`;
    desc.style.display = showHUD ? "block" : "none";
  }

  // Event wiring
  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });
  window.addEventListener("mousedown", onDown);
  window.addEventListener("mouseup", onUp);
  window.addEventListener("touchstart", onDown);
  window.addEventListener("touchend", onUp);

  window.addEventListener("click", (e) => {
    // Avoid toggling when clicking inside HUD
    if (e.target.closest(".hud")) return;
    modeIndex++;
    updateButtons();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === " ") { e.preventDefault(); paused = !paused; updateButtons(); if (!paused) requestAnimationFrame(draw); }
    if (e.key.toLowerCase() === "p") { paletteIndex++; updateButtons(); }
    if (e.key.toLowerCase() === "s") { saveImage(); }
  });

  btnMode.addEventListener("click", () => { modeIndex++; updateButtons(); });
  btnPalette.addEventListener("click", () => { paletteIndex++; updateButtons(); });
  btnPause.addEventListener("click", () => { paused = !paused; updateButtons(); if (!paused) requestAnimationFrame(draw); });
  btnSave.addEventListener("click", () => saveImage());

  rangeDensity.addEventListener("input", () => { density = parseInt(rangeDensity.value, 10); updateButtons(); });
  rangeSpeed.addEventListener("input", () => { speed = parseFloat(rangeSpeed.value); updateButtons(); });
  rangeScale.addEventListener("input", () => { scale = parseFloat(rangeScale.value); updateButtons(); });
  hudToggle.addEventListener("change", () => { showHUD = hudToggle.checked; updateButtons(); });

  function saveImage() {
    if (saving) return;
    saving = true;
    try {
      const a = document.createElement("a");
      a.download = `gpt5-thinking-art-${Date.now()}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } finally {
      setTimeout(() => { saving = false; }, 400);
    }
  }

  // Boot
  resize();
  updateButtons();
  requestAnimationFrame(draw);
})();