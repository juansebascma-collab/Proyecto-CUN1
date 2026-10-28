@echo off
title HemoRed - Generador de APK Android
cd /d "%~dp0\app"
echo ====================================================
echo   Compilando instalador APK de HemoRed para Android
echo ====================================================
echo.
set EAS_NO_VCS=1
call npx --yes eas-cli build --platform android --profile preview
echo.
pause
