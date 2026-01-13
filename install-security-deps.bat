@echo off
echo Instalando dependencias de seguridad...
echo.
cd /d "%~dp0"
npm install express-rate-limit express-validator helmet
echo.
echo Instalacion completada!
echo Presiona cualquier tecla para cerrar...
pause > nul
