const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  executeGitPull: () => ipcRenderer.invoke('execute-git-pull'),
  restartApp: () => ipcRenderer.invoke('restart-app'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
});
