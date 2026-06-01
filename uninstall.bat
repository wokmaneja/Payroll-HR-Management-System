@echo off
echo Uninstalling WokManeja Service...

set "APPNAME=WokManeja"
set "INSTDIR=%PROGRAMFILES%\%APPNAME%"

cd /d "%INSTDIR%"
"%INSTDIR%\WokManejaService.exe" stop >nul 2>&1
timeout /t 2 /nobreak >nul
"%INSTDIR%\WokManejaService.exe" uninstall >nul 2>&1

netsh advfirewall firewall delete rule name="%APPNAME%" >nul 2>&1

set "REGKEY=HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\%APPNAME%"
reg delete "%REGKEY%" /f >nul 2>&1

del /q "%INSTDIR%\WokManeja.exe" >nul 2>&1
del /q "%INSTDIR%\logoapp.ico" >nul 2>&1
del /q "%INSTDIR%\node_sqlite3.node" >nul 2>&1
del /q "%INSTDIR%\WokManejaService.exe" >nul 2>&1
del /q "%INSTDIR%\WokManejaService.xml" >nul 2>&1
del /q "%INSTDIR%\WokManejaService.wrapper.log" >nul 2>&1
del /q "%INSTDIR%\WokManejaService.out.log" >nul 2>&1
del /q "%INSTDIR%\WokManejaService.err.log" >nul 2>&1

echo Uninstall Complete!
echo Press any key to exit...
pause >nul
(goto) 2>nul & del "%~f0" & rmdir "%INSTDIR%" >nul 2>&1
