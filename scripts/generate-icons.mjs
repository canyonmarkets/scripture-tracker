import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42; // usable radius

  // ── Background: deep navy rounded square ──
  ctx.fillStyle = '#0d1e2e';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.22);
  ctx.fill();

  // ── Light rays from center spine ──
  const rayCount = 10;
  const rayLen   = r * 1.1;
  ctx.save();
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(angle) * rayLen, cy + Math.sin(angle) * rayLen);
    grad.addColorStop(0, '#f5c842');
    grad.addColorStop(1, 'transparent');
    ctx.strokeStyle = grad;
    ctx.lineWidth = size * 0.045;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * rayLen, cy + Math.sin(angle) * rayLen);
    ctx.stroke();
  }
  ctx.restore();

  // ── Open book ──
  const bookW  = r * 1.55;
  const bookH  = r * 1.1;
  const spineX = cx;
  const bookTop    = cy - bookH * 0.48;
  const bookBottom = cy + bookH * 0.52;
  const leftEdge   = cx - bookW * 0.5;
  const rightEdge  = cx + bookW * 0.5;

  // Slight page curve depth
  const curve = bookH * 0.12;

  // Left page fill
  ctx.beginPath();
  ctx.moveTo(spineX, bookTop);
  ctx.quadraticCurveTo(spineX - bookW * 0.25, bookTop - curve, leftEdge, bookTop + bookH * 0.06);
  ctx.lineTo(leftEdge, bookBottom - bookH * 0.06);
  ctx.quadraticCurveTo(spineX - bookW * 0.25, bookBottom + curve * 0.5, spineX, bookBottom);
  ctx.closePath();
  ctx.fillStyle = '#dce8f5';
  ctx.fill();

  // Right page fill
  ctx.beginPath();
  ctx.moveTo(spineX, bookTop);
  ctx.quadraticCurveTo(spineX + bookW * 0.25, bookTop - curve, rightEdge, bookTop + bookH * 0.06);
  ctx.lineTo(rightEdge, bookBottom - bookH * 0.06);
  ctx.quadraticCurveTo(spineX + bookW * 0.25, bookBottom + curve * 0.5, spineX, bookBottom);
  ctx.closePath();
  ctx.fillStyle = '#f0f6ff';
  ctx.fill();

  // Page lines — left side
  ctx.strokeStyle = '#9ab4cc';
  ctx.lineWidth = size * 0.018;
  ctx.lineCap = 'round';
  const lineCount = 4;
  for (let i = 0; i < lineCount; i++) {
    const t = (i + 1) / (lineCount + 1);
    const y = bookTop + bookH * t;
    const xStart = leftEdge + bookW * 0.07;
    const xEnd   = spineX  - bookW * 0.06;
    ctx.beginPath();
    ctx.moveTo(xStart, y);
    ctx.lineTo(xEnd,   y);
    ctx.stroke();
  }

  // Page lines — right side
  for (let i = 0; i < lineCount; i++) {
    const t = (i + 1) / (lineCount + 1);
    const y = bookTop + bookH * t;
    const xStart = spineX  + bookW * 0.06;
    const xEnd   = rightEdge - bookW * 0.07;
    ctx.beginPath();
    ctx.moveTo(xStart, y);
    ctx.lineTo(xEnd,   y);
    ctx.stroke();
  }

  // Spine line (glowing gold)
  ctx.strokeStyle = '#f5c842';
  ctx.lineWidth = size * 0.025;
  ctx.lineCap = 'round';
  ctx.shadowColor = '#f5c842';
  ctx.shadowBlur  = size * 0.04;
  ctx.beginPath();
  ctx.moveTo(spineX, bookTop - size * 0.02);
  ctx.lineTo(spineX, bookBottom + size * 0.01);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // ── Small gold star above spine ──
  const starCy = bookTop - size * 0.1;
  const starR1 = size * 0.055;
  const starR2 = size * 0.025;
  const starPts = 5;
  ctx.fillStyle = '#f5c842';
  ctx.shadowColor = '#f5c842';
  ctx.shadowBlur  = size * 0.05;
  ctx.beginPath();
  for (let i = 0; i < starPts * 2; i++) {
    const angle = (i * Math.PI) / starPts - Math.PI / 2;
    const rad   = i % 2 === 0 ? starR1 : starR2;
    const x = cx + Math.cos(angle) * rad;
    const y = starCy + Math.sin(angle) * rad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  return canvas.toBuffer('image/png');
}

const publicDir = join(__dirname, '..', 'public');
writeFileSync(join(publicDir, 'icon-192.png'), drawIcon(192));
writeFileSync(join(publicDir, 'icon-512.png'), drawIcon(512));
writeFileSync(join(publicDir, 'apple-touch-icon.png'), drawIcon(180));
console.log('Scripture Tracker icons generated.');
