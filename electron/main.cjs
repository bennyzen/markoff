const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow

const findMarkdownArg = () => {
	const args = process.argv.slice(app.isPackaged ? 1 : 2)
	return args.find(a => {
		const lower = a.toLowerCase()
		return lower.endsWith('.md') || lower.endsWith('.markdown') || lower.endsWith('.mdown') || lower.endsWith('.mkd') || lower.endsWith('.mkdn')
	})
}

const createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		frame: false,
		webPreferences: {
			preload: path.join(__dirname, 'preload.cjs'),
			contextIsolation: true,
			nodeIntegration: false,
		},
	})

	if (process.env.VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
	} else {
		mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
	}
}

// IPC handlers
ipcMain.handle('read-file-text', (_event, filePath) => {
	return fs.readFileSync(filePath, 'utf-8')
})

ipcMain.handle('read-file-as-data-url', (_event, baseDir, relativePath) => {
	const fullPath = path.resolve(baseDir, relativePath)
	const canonical = fs.realpathSync(fullPath)
	const canonicalBase = fs.realpathSync(baseDir)

	if (!canonical.startsWith(canonicalBase)) {
		throw new Error('Path traversal not allowed')
	}

	const data = fs.readFileSync(canonical)
	const ext = path.extname(canonical).toLowerCase().slice(1)
	const mimeMap = {
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		gif: 'image/gif',
		svg: 'image/svg+xml',
		webp: 'image/webp',
		avif: 'image/avif',
		ico: 'image/x-icon',
		bmp: 'image/bmp',
	}
	const mime = mimeMap[ext] || 'application/octet-stream'
	return `data:${mime};base64,${data.toString('base64')}`
})

ipcMain.handle('get-pending-file', () => {
	const mdFile = findMarkdownArg()
	if (!mdFile) return null
	return path.resolve(mdFile)
})

ipcMain.handle('quit-app', () => {
	app.quit()
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
	app.quit()
})
