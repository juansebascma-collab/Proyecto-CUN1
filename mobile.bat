@echo off
title HemoRed - Servidor Móvil (Expo)
cd /d "%~dp0"
echo ====================================================
echo   Iniciando HemoRed Móvil para Celular y Tablet
echo ====================================================
echo.
echo Escanea el codigo QR que aparecera a continuacion
echo con la aplicacion Expo Go en tu celular.
echo.
pnpm.cmd mobile
pause
