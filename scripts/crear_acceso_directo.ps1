# =========================================================================
# CREAR ACCESO DIRECTO EN EL ESCRITORIO DE WINDOWS - AGROCONTROL PRO
# =========================================================================

$projectRoot = Split-Path -Parent $PSScriptRoot
$vbsLauncher = Join-Path $PSScriptRoot "iniciar_agrocontrol.vbs"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "AgroControl Pro.lnk"
$iconPath = Join-Path $projectRoot "electron\icon.ico"

# Si ya existe un acceso directo previo, eliminarlo para invalidar caché antigua
if (Test-Path $shortcutPath) {
    Remove-Item -Path $shortcutPath -Force -ErrorAction SilentlyContinue
}

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$vbsLauncher`""
$Shortcut.WorkingDirectory = $projectRoot
$Shortcut.IconLocation = "$iconPath,0"
$Shortcut.Description = "Sistema de Gestión Laboral y Recursos Humanos - AgroControl Pro"
$Shortcut.Save()

[System.Runtime.InteropServices.Marshal]::ReleaseComObject($Shortcut) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($WshShell) | Out-Null

# Notificar a Windows Shell (Explorer) para refrescar la visualización de iconos de inmediato
try {
    Add-Type -TypeDefinition @"
    using System;
    using System.Runtime.InteropServices;
    public class IconRefreshHelper {
        [DllImport("shell32.dll")]
        public static extern void SHChangeNotify(int wEventId, int uFlags, IntPtr dwItem1, IntPtr dwItem2);
    }
"@ -ErrorAction SilentlyContinue
    [IconRefreshHelper]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
} catch {
    # Ignorar si ya está compilado en la sesión
}

Write-Host " Acceso directo con icono renovado creado exitosamente en tu Escritorio:" -ForegroundColor Green
Write-Host "   $shortcutPath" -ForegroundColor Cyan
Write-Host "Icono asignado: $iconPath" -ForegroundColor DarkGray
Write-Host "Desde ahora puedes abrir AgroControl Pro haciendo doble clic en el icono de tu escritorio." -ForegroundColor Yellow
