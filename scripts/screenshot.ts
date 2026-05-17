import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:5174';
const SCREENSHOT_DIR = path.resolve('screenshots');

const pages = [
  { name: 'dashboard', path: '/', label: 'Dashboard' },
  { name: 'engagements', path: '/engagements', label: 'Engagements' },
  { name: 'agents', path: '/agents', label: 'Agents' },
  { name: 'execution', path: '/execution', label: 'Execution' },
  { name: 'findings', path: '/findings', label: 'Findings' },
  { name: 'reports', path: '/reports', label: 'Reports' },
  { name: 'config', path: '/config', label: 'Config' },
  { name: 'process', path: '/process', label: 'Process' },
];

async function main() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  for (const p of pages) {
    const url = `${BASE_URL}${p.path}`;
    console.log(`Capturing ${p.label}: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    // Wait for antd to render
    await new Promise(r => setTimeout(r, 1500));
    const filePath = path.join(SCREENSHOT_DIR, `${p.name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`  -> saved ${filePath}`);
  }

  await browser.close();
  console.log(`\nDone! ${pages.length} screenshots saved to ${SCREENSHOT_DIR}`);
}

main().catch(e => { console.error(e); process.exit(1); });
