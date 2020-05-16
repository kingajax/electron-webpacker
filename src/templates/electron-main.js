const { app, BrowserWindow } = require('electron');
const path = require("path");
const { format } = require('url');

function createWindow () {

  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  /*
   * determine the correct window to load in
   * production vs development. if we're in production
   * there will be no `webpack-dev-server` running our
   * project, we will need to load it from a static dir.
   */
  var port = process.env.WEBPACK_DEV_SERVER_PORT || 9000;
  var context = process.env.WEBPACK_DEV_SERVER_PATH || "renderer";
  var devUrl = `http://localhost:${process.env.WEBPACK_DEV_SERVER_PORT || 9000}/${context}`;

  var prodUrl = format({
    pathname: path.join(__dirname, "index.html"),
    protocol: 'file',
    slashes: true
  });

  // load the `webpack-dev-server` URL when development otherwise, use prodUrl
  win.loadURL(process.env.NODE_ENV == "development"  ? devUrl : prodUrl);
  console.log(`Loading URL @ ${url} for environment=${process.env.NODE_ENV}`);

  // Open the DevTools.
  if (process.env.NODE_ENV == "development") {
    win.webContents.openDevTools();
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
