@echo off
title HemoRed - Generador de Bundle para Google Play Store
cd /d "%~dp0\app"
echo ====================================================
echo   Compilando Bundle (.aab) para Google Play Store
echo ====================================================
echo.
set EAS_NO_VCS=1
call npx --yes eas-cli build --platform android --profile production
echo.
pause
