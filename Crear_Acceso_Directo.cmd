@echo off
title Crear Acceso Directo - AgroControl Pro
echo Creando acceso directo en el Escritorio...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0scripts\crear_acceso_directo.ps1"
timeout /t 3 >nul
