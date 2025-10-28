/* script.js
 - Handles button clicks, calls the Vercel API, shows typewriter & confetti
 - Backend endpoint: '/api/generate'
*/

const buttons = document.querySelectorAll('.btn');
const resultWrap = document.getElementById('resultWrap');
const typewriterEl = document.getElementById('typewriter');
const anotherBtn = document.getElementById('another');
const saveBtn = document.getElementById('save');

// Animation canvas (floating hearts ❤️)
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let particles = [];
function resizeCanvas() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + Math.random() * 200;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = -1 - Math.random() * 1.4;
    this.size = 8 + Math.random() * 14;
    this.alpha = 0.6 + Math.random() * 0.4;
    this.color = `rgba(239,71,125,${this.alpha})`;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 0.0006;
    if (this.y < -40 || this.alpha <= 0) this.reset();
  }
  reset() {
    Object.assign(this, new Particle());
  }
  draw() {
    ctx.beginPath();
    const s = this.size;
    ctx.moveTo(this.x, this.y);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x - s / 4, this.y, s / 2, 0, Math.PI * 2);
    ctx.arc(this.x + s / 4, this.y, s / 2, 0, Math.PI * 2);
    ctx.moveTo(this.x - s / 1.1, this.y);
    ctx.bezierCurveTo(this.x, this.y + s, this.x, this.y + s, this.x + s / 1.1, this.y);
    ctx.fill();
  }
}

for (let i = 0; i < 60; i++) particles.push(new Particle());
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(loop);
}
loop();

/* Typewriter reveal animation */
async function revealText(text) {
  resultWrap.classList.remove('hidden');
  typewriterEl.textContent = '';
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i++) {
    typewriterEl.textContent += chars[i];
    await new Promise(r => setTimeout(r, 15 + Math.random() * 20));
  }
  confetti({
    particleCount: 50,
    spread: 100,
    origin: { y: 0.2 }
  });
}

/* Call Vercel API */
async function fetchMessage(kind) {
  buttons.forEach(b => b.disabled = true);
  typewriterEl.textContent = 'Thinking of the perfect Bengali words... 💭';
  resultWrap.classList.remove('hidden');

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: kind, targetName: "Shrabani Dev", senderName: "Tarunjit" })
    });

    const json = await res.json();

    if (!res.ok) throw new Error(json?.error || 'Server error');

    const message = json.message || json.result || "কিছু ভুল হয়েছে, পরে চেষ্টা করো।";
    await revealText(message);
  } catch (err) {
    console.error(err);
    typewriterEl.textContent = "⚠️ Network or server error — try again later ❤️";
  } finally {
    buttons.forEach(b => b.disabled = false);
  }
}

/* Button click handlers */
buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const kind = btn.getAttribute('data-kind');
    fetchMessage(kind);
  });
});

anotherBtn.addEventListener('click', () => {
  fetchMessage('message');
});

saveBtn.addEventListener('click', () => {
  const text = typewriterEl.textContent;
  if (!text) return;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'for_shrabani.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

/* Optional: subtle glow animation on text */
setInterval(() => {
  typewriterEl.style.textShadow = `0 0 10px rgba(255, 105, 180, 0.8)`;
  setTimeout(() => { typewriterEl.style.textShadow = 'none'; }, 800);
}, 4000);

