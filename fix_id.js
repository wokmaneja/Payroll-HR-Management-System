const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

const target = 'var m=s.empid.match(/EMP(\\\\d+)/i);';
const replace = 'var m=(s.empid||\"\").match(/EMP(\\\\d+)/i);';
if (html.includes(target)) {
    html = html.replace(target, replace);
    fs.writeFileSync('public/index.html', html);
    console.log('Fixed getNextEmpId');
} else {
    console.log('Target not found');
}
