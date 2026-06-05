const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (e) => { console.error("JSDOM Error:", e); });
virtualConsole.on("warn", (e) => { console.warn("JSDOM Warn:", e); });
virtualConsole.on("log", (e) => { console.log("JSDOM Log:", e); });

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  virtualConsole
});
console.log("JSDOM loaded!");
