const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  try {
    console.log("Navigating...");
    await page.goto('http://localhost:5050');
    
    console.log("Logging in...");
    await page.type('#login-user', 'admin');
    await page.type('#login-pass', 'admin123');
    await page.click('button[onclick="doLogin()"]');
    
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Changing language to French...");
    await page.select('#lang-switcher', 'fr');
    
    await new Promise(r => setTimeout(r, 500));
    
    const sidebarHTML = await page.$eval('#sidebar-nav', el => el.innerHTML);
    console.log("Sidebar HTML:");
    console.log(sidebarHTML);
    
  } catch(e) {
    console.error("Test script failed:", e);
  } finally {
    await browser.close();
  }
})();
