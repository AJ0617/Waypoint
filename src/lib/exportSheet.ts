import { FIELD, fmtDist, metrics, simulate, toPx } from './pathSim';
import fieldImgUrl from '../assets/field.jpg';
import type { PathState } from '../types';

const SHEET_W = 520;
const PAD = 32;
const SCALE = 3;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function ensureFontsReady(): Promise<void> {
  try {
    await document.fonts.load('800 22px Archivo');
    await document.fonts.load('600 14px Archivo');
    await document.fonts.ready;
  } catch {
    // font loading APIs unavailable — fall back to system font metrics
  }
}

/** Renders the pit sheet to an offscreen canvas at print resolution. */
export async function renderSheetCanvas(path: PathState): Promise<HTMLCanvasElement> {
  await ensureFontsReady();
  const fieldImg = await loadImage(fieldImgUrl);
  const sim = simulate(path.commands, path.startPose);

  const accent = path.allianceColor === 'blue' ? '#1f6fd1' : '#e5383b';
  const contentW = SHEET_W - PAD * 2;
  const onlySteps = path.includeSteps && !path.includeField;
  const noneSelected = !path.includeField && !path.includeSteps;

  const headerH = 40;
  const metaH = 30;
  const fieldH = path.includeField ? contentW * (FIELD.IMG_H / FIELD.IMG_W) : 0;
  const fieldBlockH = path.includeField ? fieldH + 16 : 0;
  const rowH = onlySteps ? 40 : 27;
  const stepsH = noneSelected ? 110 : path.includeSteps ? path.commands.length * rowH + 10 : 0;

  const totalH = PAD * 2 + headerH + metaH + fieldBlockH + 12 /* hr */ + stepsH;

  const canvas = document.createElement('canvas');
  canvas.width = SHEET_W * SCALE;
  canvas.height = totalH * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, SHEET_W, totalH);

  let y = PAD;

  // Header
  ctx.fillStyle = '#141312';
  ctx.font = '800 22px Archivo, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(path.pathName, PAD, y + 20);
  ctx.fillStyle = accent;
  ctx.textAlign = 'right';
  ctx.fillText(path.teamNumber, SHEET_W - PAD, y + 20);
  ctx.textAlign = 'left';
  y += 28;
  ctx.strokeStyle = '#141312';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(SHEET_W - PAD, y);
  ctx.stroke();
  y += headerH - 28;

  // Meta row
  const totalDistanceIn = path.commands.filter((c) => c.action === 'drive').reduce((a, c) => a + c.value, 0);
  const drivetrainLabel = path.drivetrain === 'tank' ? 'TANK DRIVE' : path.drivetrain === 'mecanum' ? 'MECANUM' : 'X-DRIVE';
  const meta = [
    `${path.allianceColor.toUpperCase()} ALLIANCE`,
    drivetrainLabel,
    `TOTAL ${fmtDist(totalDistanceIn, path.units)} ${path.units === 'cm' ? 'CM' : 'IN'}`,
    `${path.commands.length} STEPS`,
  ].join('   ·   ');
  ctx.fillStyle = '#555555';
  ctx.font = '600 11px Archivo, system-ui, sans-serif';
  ctx.fillText(meta, PAD, y + 12);
  y += metaH;

  // Field diagram
  if (path.includeField) {
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(PAD, y, contentW, fieldH);
    ctx.drawImage(fieldImg, PAD, y, contentW, fieldH);

    const m = metrics(contentW);
    const off = (px: number, py: number) => ({ x: PAD + px, y: y + py });

    ctx.strokeStyle = '#141312';
    ctx.lineWidth = 2;
    ctx.setLineDash([1.5, 4]);
    ctx.beginPath();
    sim.points.forEach((p, i) => {
      const q = toPx(p.x, p.y, m);
      const o = off(q.px, q.py);
      if (i === 0) ctx.moveTo(o.x, o.y);
      else ctx.lineTo(o.x, o.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.6;
    sim.points.slice(1).forEach((p) => {
      const q = toPx(p.x, p.y, m);
      const o = off(q.px, q.py);
      ctx.beginPath();
      ctx.arc(o.x, o.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    y += fieldH + 16;
  }

  // Divider
  ctx.strokeStyle = '#141312';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(SHEET_W - PAD, y);
  ctx.stroke();
  y += 12;

  if (noneSelected) {
    ctx.fillStyle = '#888888';
    ctx.font = '400 13px Archivo, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Select "include field diagram" and/or "include steps" to build the sheet.', SHEET_W / 2, y + 40);
    ctx.textAlign = 'left';
  } else if (path.includeSteps) {
    const fontPx = onlySteps ? 20 : 14;
    path.commands.forEach((cmd, idx) => {
      const isTurn = cmd.action === 'turn';
      const dirLabel = isTurn ? (cmd.dir === 'left' ? 'LEFT' : 'RIGHT') : cmd.dir === 'forward' ? 'FORWARD' : 'REVERSE';
      const actionLabel = isTurn ? 'TURN' : 'DRIVE';
      const valueDisplay = isTurn ? cmd.value.toFixed(0) : fmtDist(cmd.value, path.units);
      const unit = isTurn ? '°' : path.units;
      const rowY = y + idx * rowH;

      ctx.fillStyle = '#141312';
      ctx.font = `800 ${fontPx}px Archivo, system-ui, sans-serif`;
      ctx.fillText(`${idx + 1}.`, PAD, rowY + fontPx);

      ctx.font = `600 ${fontPx}px Archivo, system-ui, sans-serif`;
      ctx.fillText(`${actionLabel} ${dirLabel}`, PAD + 28, rowY + fontPx);

      ctx.font = `800 ${fontPx}px Archivo, system-ui, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(`${valueDisplay} ${unit}`, SHEET_W - PAD, rowY + fontPx);
      ctx.textAlign = 'left';

      ctx.strokeStyle = '#dddddd';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD, rowY + rowH - 6);
      ctx.lineTo(SHEET_W - PAD, rowY + rowH - 6);
      ctx.stroke();
    });
  }

  return canvas;
}

export function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function safeFilename(name: string): string {
  return name.trim().replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'waypoint-path';
}

export async function exportPng(path: PathState): Promise<void> {
  const canvas = await renderSheetCanvas(path);
  const url = canvas.toDataURL('image/png');
  triggerDownload(url, `${safeFilename(path.pathName)}.png`);
}

export async function exportPdf(path: PathState): Promise<void> {
  const [{ default: jsPDF }, canvas] = await Promise.all([import('jspdf'), renderSheetCanvas(path)]);
  const imgData = canvas.toDataURL('image/png');

  const pageSize = path.paperSize === 'a4' ? { w: 210, h: 297 } : { w: 215.9, h: 279.4 };
  const doc = new jsPDF({ unit: 'mm', format: [pageSize.w, pageSize.h] });

  const margin = 12;
  const maxW = pageSize.w - margin * 2;
  const maxH = pageSize.h - margin * 2;
  const imgAspect = canvas.height / canvas.width;
  let drawW = maxW;
  let drawH = drawW * imgAspect;
  if (drawH > maxH) {
    drawH = maxH;
    drawW = drawH / imgAspect;
  }
  const x = (pageSize.w - drawW) / 2;
  const y = margin;

  doc.addImage(imgData, 'PNG', x, y, drawW, drawH);
  doc.save(`${safeFilename(path.pathName)}.pdf`);
}
