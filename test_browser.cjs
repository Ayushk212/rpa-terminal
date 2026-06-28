const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.type().toUpperCase(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('http://localhost:5173/');
  
  // Wait a bit for React to render hero
  await new Promise(r => setTimeout(r, 2000));
  
  // Click launch terminal button
  try {
    await page.evaluate(() => document.querySelector('[role="button"]').click());
    console.log('Clicked launch button');
  } catch (e) {
    console.log('Failed to click launch button:', e.message);
  }
  
  // Wait for data to load
  await new Promise(r => setTimeout(r, 5000));
  
  // Get baseline length
  const baselineLen = await page.evaluate(() => window.RPAStream ? window.RPAStream.getBaseline().length : -1);
  console.log('Baseline length:', baselineLen);
  
  // Get row count from DOM
  const kpiRows = await page.evaluate(() => document.getElementById('kpi-rows')?.textContent);
  console.log('KPI Rows:', kpiRows);
  
  await browser.close();
})();
