const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const html = fs.readFileSync('public/index.html','utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost' });
const window = dom.window;

window.DB = {
  findAll: function(col) {
    if (col === 'payslips') return [{totalEarn:1000, vnpf:60, loan:0, others:0, net:940, staff:'Bob', othersNote:''}];
    if (col === 'hr_requests') return [];
    if (col === 'staff') return [{_id:'1', name:'Bob', status:'Active'}];
    return [];
  },
  findOne: function(col, q) {
    if (col==='staff') return {_id:'1', name:'Bob', status:'Active'};
    return null;
  }
};
window.LAST_COMPLIANCE_DATA = null;
window.fetch = async () => ({ json: async () => ({ content: [{text: '{"executive_summary":"test"}' }] }) });
window.translateUI = () => {};

try {
  window.renderCompliance();
  console.log('Finished renderCompliance without crash.');
} catch (e) {
  console.error('CRASH:', e.message);
  console.error(e.stack);
}
