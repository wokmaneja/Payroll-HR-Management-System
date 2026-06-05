const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

const formHtmlTarget = '<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.85rem\"><div><label>Phone Number</label><input id=\"sf-phone\" type=\"text\" placeholder=\"+678 000000\"/></div><div><label>Hourly Rate (VUV)</label><input id=\"sf-hourly\" type=\"number\" placeholder=\"0 (Salaried)\"/></div></div>';
const formHtmlReplace = '<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.85rem\"><div><label>Phone Number</label><input id=\"sf-phone\" type=\"text\" placeholder=\"+678 000000\"/></div><div><label>VNPF Number</label><input id=\"sf-vnpfno\" type=\"text\" placeholder=\"e.g. 123456\"/></div></div><div style=\"display:grid;grid-template-columns:1fr 1fr 1fr;gap:.5rem;margin-bottom:.85rem\"><div><label>Pay Type</label><select id=\"sf-paytype\" onchange=\"togglePayType()\"><option value=\"Salary\">Fixed Salary</option><option value=\"Hourly\">Hourly Rate</option></select></div><div id=\"sf-salary-wrap\"><label>Fixed Salary (VUV)</label><input id=\"sf-fixedsalary\" type=\"number\" placeholder=\"0\"/></div><div id=\"sf-hourly-wrap\" style=\"display:none\"><label>Hourly Rate (VUV)</label><input id=\"sf-hourly\" type=\"number\" placeholder=\"0\"/></div></div>';
if (html.includes(formHtmlTarget)) {
    html = html.replace(formHtmlTarget, formHtmlReplace);
}

if (!html.includes('function togglePayType')) {
    html = html.replace('function saveStaff(){', 'function togglePayType(){\n  var isHourly = document.getElementById(\'sf-paytype\').value === \'Hourly\';\n  document.getElementById(\'sf-hourly-wrap\').style.display = isHourly ? \'block\' : \'none\';\n  document.getElementById(\'sf-salary-wrap\').style.display = isHourly ? \'none\' : \'block\';\n}\nfunction saveStaff(){');
}

const saveStaffTarget = 'var hourlyRate=parseFloat(document.getElementById(\'sf-hourly\').value)||0;';
const saveStaffReplace = 'var hourlyRate=parseFloat(document.getElementById(\'sf-hourly\').value)||0;var fixedSalary=parseFloat(document.getElementById(\'sf-fixedsalary\').value)||0;var payType=document.getElementById(\'sf-paytype\').value;var vnpfNumber=document.getElementById(\'sf-vnpfno\').value.trim();';
if (html.includes(saveStaffTarget) && !html.includes('var fixedSalary=')) {
    html = html.replace(saveStaffTarget, saveStaffReplace);
}

const objTarget = 'var obj={name:n,empid:id,designation:dsg,department:dep,email:email,phone:phone,hourlyRate:hourlyRate,bankName:bank,accountNumber:account,annualLeave:annual,sickLeave:sick,status:st,payCycle:pc};';
const objReplace = 'if(!id){id=getNextEmpId();document.getElementById("sf-id").value=id;}\nvar obj={name:n,empid:id,designation:dsg,department:dep,email:email,phone:phone,hourlyRate:hourlyRate,fixedSalary:fixedSalary,payType:payType,vnpfNumber:vnpfNumber,bankName:bank,accountNumber:account,annualLeave:annual,sickLeave:sick,status:st,payCycle:pc};';
if (html.includes(objTarget)) {
    html = html.replace(objTarget, objReplace);
}

const clearFormTarget = 'document.getElementById(\'sf-hourly\').value=\'\';';
const clearFormReplace = 'document.getElementById(\'sf-hourly\').value=\'\';document.getElementById(\'sf-fixedsalary\').value=\'\';document.getElementById(\'sf-vnpfno\').value=\'\';document.getElementById(\'sf-paytype\').value=\'Salary\';togglePayType();';
if (html.includes(clearFormTarget) && !html.includes('sf-fixedsalary')) {
    html = html.replace(clearFormTarget, clearFormReplace);
}

const editTarget = 'document.getElementById(\'sf-hourly\').value=s.hourlyRate||\'\';';
const editReplace = 'document.getElementById(\'sf-hourly\').value=s.hourlyRate||\'\';document.getElementById(\'sf-fixedsalary\').value=s.fixedSalary||\'\';document.getElementById(\'sf-vnpfno\').value=s.vnpfNumber||\'\';document.getElementById(\'sf-paytype\').value=s.payType||\'Salary\';togglePayType();';
if (html.includes(editTarget) && !html.includes('sf-fixedsalary')) {
    html = html.replace(editTarget, editReplace);
}

const renderTableTarget = 'var hrStr=s.hourlyRate?\'VUV \'+s.hourlyRate+\'/hr\':\'Salaried\';';
const renderTableReplace = 'var hrStr=(s.payType==="Hourly"||(!s.payType&&s.hourlyRate>0))?\'VUV \'+(s.hourlyRate||0)+\'/hr\':\'VUV \'+(s.fixedSalary||0)+\' (Salary)\';';
if (html.includes(renderTableTarget)) {
    html = html.replace(renderTableTarget, renderTableReplace);
}

const idColTarget = '<td style=\"color:#888\">\'\+s.empid\+\'</td>';
const idColReplace = '<td style=\"color:#888\">\'\+(s.empid||\'<i style=\"color:#aaa\">with no ID</i>\')\+\'<br><span style=\"font-size:10px;color:#aaa\">\'\+(s.vnpfNumber?\'VNPF: \'\+s.vnpfNumber:\'\')\+\'</span></td>';
if (html.includes(idColTarget)) {
    html = html.replace(idColTarget, idColReplace);
}

const getNextIdTarget = 'var m=s.empid.match(/EMP(\\\\d+)/i);';
const getNextIdReplace = 'var m=(s.empid||\"\").match(/EMP(\\\\d+)/i);';
if (html.includes(getNextIdTarget)) {
    html = html.replace(getNextIdTarget, getNextIdReplace);
}

fs.writeFileSync('public/index.html', html);
console.log('Restored Pay Type, Fixed Salary, and VNPF fields successfully.');
