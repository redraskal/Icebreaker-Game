const electron = require("electron");
const {app} = require("electron");
const {Menu} = require("electron");
const BrowserWindow = electron.BrowserWindow;

//require("electron-debug")({enabled: true});

const path = require("path");
const url = require("url");

let mainWindow

function createWindow() {
  // 960 x 540
  const screen = electron.screen.getPrimaryDisplay().size;
  mainWindow = new BrowserWindow({width: screen.width, height: screen.height, resizable: true, maximizable: true, title: "Icebreaker", icon: "assets/img/loading.png"});
  mainWindow.maximize();
  Menu.setApplicationMenu(null);

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, "index.html"),
    protocol: "file:",
    slashes: true
  }));
  mainWindow.on("closed", function() {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", function() {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function() {
  if (mainWindow === null) {
    createWindow();
  }
});