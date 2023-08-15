// ���W���[���̃C���|�[�g
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

// �t�@�C���ǂݍ���
function readFileFunc() {
	var content = new String();
	try {
		content = fs.readFileSync('prefs/pref.json', 'utf8');
	} catch(err) {
		console.log('Read Error.');
	}
	return content;
}

// �t�@�C����������
function writeFileFunc(event, str) {
	fs.writeFile('prefs/pref.json', str, 'utf8', (err) => {
		if (err) throw err;
		console.log('The file has been saved!');
	})
}

// �E�B���h�E�쐬�֐�
const createWindow = () => {
	const win = new BrowserWindow({
		width: 1920,
		height: 1080,
		webPreferences: {
			nodeIntegration: false,
			preload: path.join(__dirname, 'preload.js')
		}
	})
	
	// �ŏ��ɕ\������y�[�W���w��
	win.loadFile('src/index.html')
}

// �A�v���P�[�V�����N���v���~�X
app.whenReady().then(() => {
	ipcMain.handle('read-file', readFileFunc)
	ipcMain.on('write-file', writeFileFunc)
	createWindow()
	
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow()
		}
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})