' =========================================================================
' LANZADOR SILENCIOSO NATIVO DE WINDOWS - AGROCONTROL PRO / LEGIÓN
' Inicia la aplicación de escritorio en segundo plano sin ventana de consola CMD
' =========================================================================

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' Obtener el directorio raíz del proyecto (un nivel arriba de /scripts)
strScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
strProjectRoot = FSO.GetParentFolderName(strScriptDir)

WshShell.CurrentDirectory = strProjectRoot

' Ejecutar Electron en modo oculto (0 = ventana oculta, False = no esperar)
WshShell.Run "cmd /c npx electron .", 0, False
