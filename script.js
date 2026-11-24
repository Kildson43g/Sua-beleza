
const img = new Image();
img.src = "pyetra.jpg";

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

let W, H, dpr, particles = [], started = 0, phase = "reveal";

const rand = (a, b) => a + Math.random() * (b - a);

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth;
  H = innerHeight;

  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  makeParticles();
}

function makeParticles() {
  if (!img.complete || !img.naturalWidth) return;

  const scale = Math.min(
    Math.min(W * 0.94, 720) / 720,
    (H * 0.82) / 691
  );

  const dw = 720 * scale;
  const dh = 691 * scale;
  const ox = (W - dw) / 2;
  const oy = (H - dh) / 2;

  const off = document.createElement("canvas");
  off.width = 720;
  off.height = 691;

  const o = off.getContext("2d");
  o.drawImage(img, 0, 0, 720, 691);

  const data = o.getImageData(0, 0, 720, 691).data;
  particles = [];

  for (let y = 3; y < 688; y += 3) {
    for (let x = 3; x < 717; x += 3) {
      const i = (y * 720 + x) * 4;

      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;

      const a = y - 2;
      const b = y + 2;
      const c = x - 2;
      const d = x + 2;

      const l1 = (
        data[(a * 720 + x) * 4] +
        data[(a * 720 + x) * 4 + 1] +
        data[(a * 720 + x) * 4 + 2]
      ) / 3;

      const l2 = (
        data[(b * 720 + x) * 4] +
        data[(b * 720 + x) * 4 + 1] +
        data[(b * 720 + x) * 4 + 2]
      ) / 3;

      const l3 = (
        data[(y * 720 + c) * 4] +
        data[(y * 720 + c) * 4 + 1] +
        data[(y * 720 + c) * 4 + 2]
      ) / 3;

      const l4 = (
        data[(y * 720 + d) * 4] +
        data[(y * 720 + d) * 4 + 1] +
        data[(y * 720 + d) * 4 + 2]
      ) / 3;

      const edge = Math.abs(l1 - l2) + Math.abs(l3 - l4);

      if (edge > 24 || (lum > 190 && Math.random() < 0.16)) {
        const color = Math.random() < 0.55
          ? "#35c8e8"
          : "#67f4ff";

        const tx = ox + x * scale;
        const ty = oy + y * scale;

        particles.push({
          tx,
          ty,
          x: rand(-W * 0.35, W * 1.35),
          y: rand(-H * 0.3, H * 1.3),
          size: rand(0.6, 1.7),
          color,
          delay: rand(0, 1),
          seed: rand(0, 6.28)
        });
      }
    }
  }

  if (particles.length > 20000) {
    const skip = Math.ceil(particles.length / 20000);
    particles = particles.filter((_, i) => i % skip === 0);
  }

  started = performance.now();
  phase = "reveal";
}

function animate(t) {
  ctx.clearRect(0, 0, W, H);

  const elapsed = (t - started) / 1000;

  if (phase === "reveal" && elapsed > 6) {
    phase = "settled";
  }

  for (const p of particles) {
    let k = Math.max(
      0,
      Math.min(1, (elapsed - p.delay * 1.25) / 3.8)
    );

    k = k * k * (3 - 2 * k);

    const drift = phase === "settled"
      ? Math.sin(t * 0.001 + p.seed) * 1.2
      : 0;

    const x = p.x * (1 - k) + p.tx * k + drift;
    const y = p.y * (1 - k) + p.ty * k + drift;

    ctx.globalAlpha = (0.12 + k * 0.8) *
      (0.7 + 0.3 * Math.sin(t * 0.003 + p.seed));

    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = k * 8 + 1;

    ctx.beginPath();
    ctx.arc(x, y, p.size * (0.4 + k * 0.6), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  requestAnimationFrame(animate);
}

canvas.addEventListener("pointerdown", () => {
  started = performance.now();
  phase = "reveal";

  particles.forEach(p => {
    p.delay = rand(0, 1);
    p.x = rand(-W * 0.35, W * 1.35);
    p.y = rand(-H * 0.3, H * 1.3);
  });
});

img.onload = resize;
window.addEventListener("resize", resize);

requestAnimationFrame(animate);
