// Одноразовый генератор PNG-значков из app/icon.svg для установки сайта как приложения.
// Запуск: PW_CHANNEL=msedge node scripts/gen-icons.cjs
const fs = require('fs');
const { chromium } = require('@playwright/test');

(async () => {
  const svg = fs.readFileSync('app/icon.svg', 'utf8');
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
  const targets = [
    ['public/icon-192.png', 192],
    ['public/icon-512.png', 512],
    ['app/apple-icon.png', 180],
  ];
  for (const [file, size] of targets) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    const inner = Math.round(size * 0.72);
    await page.setContent(
      `<html><body style="margin:0;width:${size}px;height:${size}px;background:#f7f3ec;display:flex;align-items:center;justify-content:center">` +
        `<div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`,
    );
    await page.screenshot({ path: file });
    await page.close();
    console.log('ok', file, fs.statSync(file).size);
  }
  await browser.close();
})();
