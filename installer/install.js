const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('===================================================');
console.log('          WokManeja Installation Setup             ');
console.log('===================================================');

const appName = 'WokManeja';
const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
const instDir = path.join(programFiles, appName);

try {
    // 1. Create directory
    console.log(`\n[*] Creating installation directory at ${instDir}...`);
    if (!fs.existsSync(instDir)) {
        fs.mkdirSync(instDir, { recursive: true });
    }

    // 2. Extract files
    console.log('[*] Extracting application files...');
    const exeBuf = fs.readFileSync(path.join(__dirname, '../wokmaneja.exe'));
    fs.writeFileSync(path.join(instDir, 'WokManeja.exe'), exeBuf);

    const icoBuf = fs.readFileSync(path.join(__dirname, '../logoapp.ico'));
    fs.writeFileSync(path.join(instDir, 'logoapp.ico'), icoBuf);

    const uninstBuf = fs.readFileSync(path.join(__dirname, '../uninstall.bat'));
    fs.writeFileSync(path.join(instDir, 'uninstall.bat'), uninstBuf);

    const winswBuf = fs.readFileSync(path.join(__dirname, '../winsw_v2.exe'));
    fs.writeFileSync(path.join(instDir, 'WokManejaService.exe'), winswBuf);

    const sqliteNodeBuf = fs.readFileSync(path.join(__dirname, '../node_modules/sqlite3/build/Release/node_sqlite3.node'));
    fs.writeFileSync(path.join(instDir, 'node_sqlite3.node'), sqliteNodeBuf);

    const winswXml = `<service>
  <id>${appName}</id>
  <name>WokManeja Payroll Service</name>
  <description>Background service for the WokManeja Payroll application</description>
  <executable>%BASE%\\WokManeja.exe</executable>
  <logmode>roll</logmode>
</service>`;
    fs.writeFileSync(path.join(instDir, 'WokManejaService.xml'), winswXml);

    // 3. Stop/Delete existing service
    console.log('[*] Preparing Windows Service...');
    try { execSync(`"${path.join(instDir, 'WokManejaService.exe')}" stop`, { stdio: 'ignore' }); } catch(e){}
    try { execSync(`timeout /t 2 /nobreak`, { stdio: 'ignore' }); } catch(e){}
    try { execSync(`"${path.join(instDir, 'WokManejaService.exe')}" uninstall`, { stdio: 'ignore' }); } catch(e){}

    // 4. Create and start service using WinSW
    console.log('[*] Registering WokManeja Payroll Service...');
    execSync(`"${path.join(instDir, 'WokManejaService.exe')}" install`);
    
    // 5. Firewall rule
    try { execSync(`netsh advfirewall firewall delete rule name="${appName}"`, { stdio: 'ignore' }); } catch(e){}
    execSync(`netsh advfirewall firewall add rule name="${appName}" dir=in action=allow protocol=TCP localport=5050`);

    console.log('[*] Starting service...');
    execSync(`"${path.join(instDir, 'WokManejaService.exe')}" start`);

    // 6. Registry keys for Control Panel
    console.log('[*] Registering in Control Panel...');
    const regKey = `HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${appName}`;
    const runReg = (cmd) => execSync(`reg ${cmd}`, { stdio: 'ignore' });
    
    try { runReg(`delete "${regKey}" /f`); } catch(e){}
    runReg(`add "${regKey}" /v DisplayName /t REG_SZ /d "${appName}" /f`);
    runReg(`add "${regKey}" /v UninstallString /t REG_SZ /d "\\"${path.join(instDir, 'uninstall.bat')}\\"" /f`);
    runReg(`add "${regKey}" /v DisplayIcon /t REG_SZ /d "${path.join(instDir, 'logoapp.ico')}" /f`);
    runReg(`add "${regKey}" /v InstallLocation /t REG_SZ /d "${instDir}" /f`);
    runReg(`add "${regKey}" /v Publisher /t REG_SZ /d "Chronniac" /f`);
    runReg(`add "${regKey}" /v NoModify /t REG_DWORD /d 1 /f`);
    runReg(`add "${regKey}" /v NoRepair /t REG_DWORD /d 1 /f`);

    console.log('\n===================================================');
    console.log('   SUCCESS: WokManeja Installed Successfully!');
    console.log('   You can access the app at http://localhost:5050');
    console.log('===================================================');
    
    setTimeout(() => {
        // Try opening browser
        try { execSync(`start http://localhost:5050`); } catch(e){}
        process.exit(0);
    }, 2000);

} catch (err) {
    console.error('\n[!] INSTALLATION FAILED!');
    console.error(err.message);
    console.log('\nPlease run this installer as Administrator.');
    setTimeout(() => process.exit(1), 5000);
}
