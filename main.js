'use strict';

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const autoUpdater = require("electron-updater").autoUpdater
const log = require('electron-log');
const isDev = require('electron-is-dev');
const {dialog} = require('electron');
const windowStateKeeper = require('electron-window-state');

let mainWindow;

function createWindow () {
    // Get user's settings
    const scaleFactor= electron.screen.getPrimaryDisplay().scaleFactor;
    const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize

    var windowMinWidth =  600;
    var windowMinHeight = 700;
    var windowsWidth = parseInt(width * scaleFactor / 4.5) > windowMinWidth ? parseInt(width * scaleFactor / 4.5) : windowMinWidth;
    var windowHeight = parseInt(height * scaleFactor / 2.3) > windowMinHeight ? parseInt(height * scaleFactor / 2.3) : windowMinHeight;

    let mainWindowState = windowStateKeeper({
      defaultWidth: windowsWidth,
      defaultHeight: windowHeight
    });

    mainWindow = new BrowserWindow({
      x: mainWindowState.x,
      y: mainWindowState.y,
      width: mainWindowState.width,
      height: mainWindowState.height,
      frame: false, 
      minWidth: windowMinWidth, 
      minHeight: windowMinHeight, 
      title: "WriteNow", 
      icon: __dirname + '/res/icon.ico'
    });

    mainWindowState.manage(mainWindow);
    mainWindow.setMenu(null);

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/index.html');

    mainWindow.toggleDevTools();
    mainWindow.on('closed', function() {
        mainWindow = null;
    });

}

function onReady() {
  createWindow();
  if(!isDev)
    autoUpdater.checkForUpdates();
}

autoUpdater.on('update-downloaded', (ev, info) => {
  sendStatusToWindow('Update downloaded; will install in 5 seconds');
  dialog.showMessageBox({
    type: 'info',
    title: 'Install Updates',
    message: 'Updates are available to the app, install the update now?',
    buttons: ['Yes', 'No']
  }, (buttonIndex) => {
    if (buttonIndex === 0) {
      autoUpdater.quitAndInstall();
    } 
    else {

    }
  });

});

app.on('ready', onReady);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
