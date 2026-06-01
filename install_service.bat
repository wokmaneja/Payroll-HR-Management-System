@echo off
echo Installing WokManeja Service...

set "APPNAME=WokManeja"
set "INSTDIR=%PROGRAMFILES%\%APPNAME%"

if not exist "%INSTDIR%" mkdir "%INSTDIR%"
copy /y "WokManeja.exe" "%INSTDIR%\WokManeja.exe"
copy /y "logoapp.ico" "%INSTDIR%\logoapp.ico"
copy /y "uninstall.bat" "%INSTDIR%\uninstall.bat"

sc stop "%APPNAME%" >nul 2>&1
timeout /t 2 /nobreak >nul
sc delete "%APPNAME%" >nul 2>&1
sc create "%APPNAME%" binPath= "%INSTDIR%\WokManeja.exe" start= auto obj= LocalSystem DisplayName= "WokManeja Payroll Service"
sc description "%APPNAME%" "Background service for WokManeja"

rem Open firewall for 5050
netsh advfirewall firewall add rule name="%APPNAME%" dir=in action=allow protocol=TCP localport=5050

sc start "%APPNAME%"

rem Registry keys for Control Panel
set "REGKEY=HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\%APPNAME%"
reg add "%REGKEY%" /v DisplayName /t REG_SZ /d "%APPNAME%" /f
reg add "%REGKEY%" /v UninstallString /t REG_SZ /d "\"%INSTDIR%\uninstall.bat\"" /f
reg add "%REGKEY%" /v DisplayIcon /t REG_SZ /d "%INSTDIR%\logoapp.ico" /f
reg add "%REGKEY%" /v InstallLocation /t REG_SZ /d "%INSTDIR%" /f
reg add "%REGKEY%" /v Publisher /t REG_SZ /d "Chronniac" /f
reg add "%REGKEY%" /v NoModify /t REG_DWORD /d 1 /f
reg add "%REGKEY%" /v NoRepair /t REG_DWORD /d 1 /f

echo Installation Complete!
