const fs = require('fs');
let s = fs.readFileSync('public/index.html', 'utf8');

// 1. Increase width of Add New Staff form from 350px to 450px
s = s.replace(
    'style="display:grid;grid-template-columns:350px 1fr;gap:1rem"',
    'style="display:grid;grid-template-columns:450px 1fr;gap:1rem"'
);

// 2. Add Reset Password button in renderStaffTable
// The original line: var delBtn=(APP.currentUser.role==='admin'||APP.currentUser.role==='manager')?'<button class="btn btn-danger btn-sm" onclick="deleteStaff(STAFF_ID_MAP.stf'+idx+')" title="Delete"><i class="ti ti-trash"></i></button>':'';
// We want to add a reset button if a user account exists for this staff
// Let's replace that specific part

let targetStr = `var cycleStr=s.payCycle||'Monthly';var delBtn=(APP.currentUser.role==='admin'||APP.currentUser.role==='manager')?'<button class="btn btn-danger btn-sm" onclick="deleteStaff(STAFF_ID_MAP.stf'+idx+')" title="Delete"><i class="ti ti-trash"></i></button>':'';`;

let newStr = `var cycleStr=s.payCycle||'Monthly';
var linkedUser = DB.findOne('users', {linkedStaffId: s._id});
var resetBtn = '';
if (linkedUser && (APP.currentUser.role==='admin'||APP.currentUser.role==='manager')) {
    resetBtn = '<button class="btn btn-gold btn-sm" style="margin-right:4px" onclick="resetStaffPassword(\\'' + linkedUser._id + '\\')" title="Reset Password"><i class="ti ti-key"></i></button>';
}
var delBtn=(APP.currentUser.role==='admin'||APP.currentUser.role==='manager')? resetBtn + '<button class="btn btn-danger btn-sm" onclick="deleteStaff(STAFF_ID_MAP.stf'+idx+')" title="Delete"><i class="ti ti-trash"></i></button>':'';`;

// Because the original file is highly minified on that line, we should escape carefully or just replace the exact text
s = s.replace(targetStr, newStr.replace(/\n/g, '')); // Minify it to match original style but insert the logic

// 3. Add resetStaffPassword function to global scope
if (!s.includes('function resetStaffPassword')) {
    s += `\n<script>
function resetStaffPassword(userId) {
    if(confirm("Are you sure you want to reset this staff member's password? It will be set to 'staff123'.")) {
        DB.update('users', { _id: userId }, { password: 'staff123' });
        alert("Password reset to 'staff123'");
    }
}
</script>\n`;
}

fs.writeFileSync('public/index.html', s, 'utf8');
console.log("Layout patched and Reset Password button added.");
