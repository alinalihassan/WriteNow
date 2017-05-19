'use strict';

const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const autoUpdater = require("electron-updater").autoUpdater
const log = require('electron-log');
const isDev = require('electron-is-dev');


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';


const windowStateKeeper = require('electron-window-state');

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

    // Create the window using the state information
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

    // Let us register listeners on the window, so we can update the state
    // automatically (the listeners will be removed when the window is closed)
    // and restore the maximized or full screen state
    mainWindowState.manage(mainWindow);
    mainWindow.setMenu(null);

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/index.html');

    mainWindow.toggleDevTools();
    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

}

function onReady() {
  createWindow();
  if(!isDev)
    autoUpdater.checkForUpdates();
}

function sendStatusToWindow(text) {
  log.info(text);
  mainWindow.webContents.send('message', text);
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
})

autoUpdater.on('update-available', (ev, info) => {
  sendStatusToWindow('Update available.');
})

autoUpdater.on('update-not-available', (ev, info) => {
  sendStatusToWindow('Update not available.');
})

autoUpdater.on('error', (ev, err) => {
  sendStatusToWindow('Error in auto-updater.');
})

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
})

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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', onReady);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
