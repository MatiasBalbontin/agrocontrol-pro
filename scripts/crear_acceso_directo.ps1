# =========================================================================
# CREAR ACCESO DIRECTO EN EL ESCRITORIO DE WINDOWS - AGROCONTROL PRO
# =========================================================================

$projectRoot = Split-Path -Parent $PSScriptRoot
$vbsLauncher = Join-Path $PSScriptRoot "iniciar_agrocontrol.vbs"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "AgroControl Pro.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$vbsLauncher`""
$Shortcut.WorkingDirectory = $projectRoot
$Shortcut.Description = "Sistema de Gestión Laboral y Recursos Humanos - AgroControl Pro"
$Shortcut.Save()

Write-Host " Acceso directo creado exitosamente en tu Escritorio:" -ForegroundColor Green
Write-Host "   $shortcutPath" -ForegroundColor Cyan
Write-Host "Desde ahora puedes abrir AgroControl Pro haciendo doble clic en el icono de tu escritorio." -ForegroundColor Yellow
