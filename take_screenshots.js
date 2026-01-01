const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
        defaultViewport: { width: 1280, height: 800 }
    });
    const page = await browser.newPage();

    // Convert local path to file URL
    const filePath = path.join(__dirname, 'demo', 'demo.html');
    const fileUrl = 'file://' + filePath;

    console.log(`Navigating to ${fileUrl}`);

    // LOGGING
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    // Helper to take screenshot
    const snap = async (name) => {
        const p = path.join(__dirname, 'demo', 'screenshots', name);
        await page.screenshot({ path: p, fullPage: false });
        console.log(`Saved ${name}`);
    };

    // 1. Initial State - Editor Open (Triggered by onload in demo.html)
    // Wait for selection mode logic to init (body class changes)
    await page.waitForFunction(() => document.body.classList.contains('dragger-selecting-active'));

    console.log("Selection mode active. Clicking element...");

    // Select the Hero Title explicitly
    await page.click('#hero-title');

    // NOW wait for panel to appear
    await page.waitForSelector('#dragger-editor-panel', { visible: true });

    await new Promise(r => setTimeout(r, 500)); // Wait for animation
    await snap('1_editor_overview.png');

    // 2. Layout Tab (Default, but let's tweak something)
    // Change background color opacity to 0.5 to show interaction
    await page.evaluate(() => {
        const input = document.querySelector('#dragger-control-opacity input');
        if (input) { input.value = '0.5'; input.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await new Promise(r => setTimeout(r, 200));
    await snap('2_layout_tweaks.png');

    // 3. Typography Tab
    // Switch to Typography
    await page.evaluate(() => {
        const tab = document.querySelector('.dragger-tab-item[data-tab="Typography"]');
        if (tab) tab.click();
    });
    await new Promise(r => setTimeout(r, 300));

    // Change Color
    await page.evaluate(() => {
        const colorInput = document.querySelector('#dragger-control-color-text');
        if (colorInput) { colorInput.value = '#ef4444'; colorInput.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await snap('3_typography_colors.png');

    // 4. Borders Tab
    await page.evaluate(() => {
        const tab = document.querySelector('.dragger-tab-item[data-tab="Borders"]');
        if (tab) tab.click();
    });
    await new Promise(r => setTimeout(r, 300));
    await snap('4_borders.png');

    // 5. Spacing Tab (Visual Box Model)
    await page.evaluate(() => {
        const tab = document.querySelector('.dragger-tab-item[data-tab="Spacing"]');
        if (tab) tab.click();
    });
    await new Promise(r => setTimeout(r, 300));
    await snap('5_spacing_model.png');

    await browser.close();
})();
