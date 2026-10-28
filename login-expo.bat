@echo off
title HemoRed - Iniciar Sesion en Expo
cd /d "%~dp0\app"
echo ====================================================
echo   Inicio de Sesion en Expo (EAS Build)
echo ====================================================
echo.
echo Ingresa tu usuario/correo y contrasena de Expo.
echo Si aun no tienes cuenta, puedes crearla gratis en:
echo https://expo.dev/signup
echo.
set EAS_NO_VCS=1
call npx --yes eas-cli login
echo.
pause
