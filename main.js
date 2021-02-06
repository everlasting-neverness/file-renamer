const electron = require('electron');
const url = require('url');
const path = require('path');

const { app, BrowserWindow, Menu } = electron;

// Set ENV
process.env.NODE_ENV = 'production';
// process.env.NODE_ENV = 'development';

const isDevelopmentMode = process.env.NODE_ENV !== 'production';

// enable live reload for dev mode
if (isDevelopmentMode) {
    require('electron-reload')(__dirname);
}

let mainWindow;

// Listen for app to be ready
app.on('ready', function () {
    // Create new Window
    mainWindow = new BrowserWindow({
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
        },
    });
    // Load html file into Window
    mainWindow.loadURL(
        // here we get the path "file://dirname/mainWindow.html"
        url.format({
            pathname: path.join(__dirname, 'mainWindow.html'),
            protocol: 'file:',
            slashes: true,
        })
    );
    // Quit app when closed
    mainWindow.on('closed', function () {
        app.quit();
    });

    if (isDevelopmentMode) {
        // Build menu from template
        const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
        //Insert Menu
        Menu.setApplicationMenu(mainMenu);
    }

});

// Create menu template
const mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Quit',
                // Add shortcuts
                accelerator:
                    process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click() {
                    app.quit();
                },
            },
        ],
    },
];

// // If macOS, add empty object to menu (handles view issue)
if (process.platform == 'darwin') {
    mainMenuTemplate.unshift({});
}

// // Add developer tools item if not in prod
if (isDevelopmentMode) {
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle devTools',
                accelerator:
                    process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                },
            },
            {
                role: 'reload',
            },
        ],
    });
}
