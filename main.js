/**
 * Electron Run Module.
 * Electron�̎��s/�E�B���h�E�̐�����IPC�ʐM���\�b�h�̒�`���s���܂��B
 */

// ���W���[���̃C���|�[�g
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const crypto = require('crypto')
const fs = require('fs')

// �A�v���ێ��p�ݒ�f�[�^�̊Ǘ�
var pref_accounts = null
var pref_columns = null

/*================================================================================================*/

/**
 * #IPC
 * �ۑ����Ă���A�J�E���g�F�؏���ǂݍ���
 * �A�v���P�[�V�����L���b�V��������΂����͂������D��
 * 
 * @return �A�J�E���g�F�؏��(�}�b�v�ŕԋp)
 */
function readPrefAccs() {
	// �ϐ��L���b�V��������ꍇ�̓L���b�V�����g�p
	if (pref_accounts) {
		console.log('@INF: use prefs/auth.json cache.')
		return pref_accounts
	}
	var content = readFile('prefs/auth.json')
	if (!content) { // �t�@�C����������Ȃ�������null��ԋp
		return null
	}
	pref_accounts = jsonToMap(JSON.parse(content), (elm) => '@' + elm.user_id + '@' + elm.domain)
	console.log('@INF: read prefs/auth.json.')
	return pref_accounts
}

/**
 * #IPC
 * �A�J�E���g�F�؏���ݒ�t�@�C���ɏ�������(Mastodon�p)
 * �������񂾌�A�v���P�[�V�����L���b�V�����X�V
 * 
 * @param path �������ރt�@�C���̃p�X
 * @param json_data ��������JSON�f�[�^
 */
function writePrefMstdAccs(event, json_data) {
	// �t�@�C���ɏ�������
	var content = writeFileArrayJson('prefs/auth.json', json_data)

	// �L���b�V�����X�V
	if (!pref_accounts) {
		// �L���b�V�����Ȃ��ꍇ�̓t�@�C����ǂݍ���ŃL���b�V���𐶐�
		pref_accounts = jsonToMap(JSON.parse(content), (elm) => '@' + elm.user_id + '@' + elm.domain)
	} else {
		pref_accounts.set('@' + json_data.user_id + '@' + json_data.domain, json_data)
	}
}

/**
 * #IPC
 * �A�J�E���g�F�؏���ݒ�t�@�C���ɏ�������(Misskey�p)
 * �������񂾌�A�v���P�[�V�����L���b�V�����X�V
 * 
 * @param path �������ރt�@�C���̃p�X
 * @param json_data ��������JSON�f�[�^
 */
function writePrefMskyAccs(event, json_data) {
	// �܂���accessToken��appSecret����i�𐶐�
	const i = crypto.createHash("sha256")
		.update(json_data.access_token + json_data.app_secret, "utf8")
		.digest("hex")
	// JSON�𐶐�(���ƂŃL���b�V���ɓ����̂�)
	const write_json = {
		'domain': json_data.domain,
		'platform': 'Misskey',
		'user_id': json_data.user.username,
		'username': json_data.user.name,
		'access_token': i,
		'avatar_url': json_data.user.avatarUrl
	}

	// �t�@�C���ɏ�������
	var content = writeFileArrayJson('prefs/auth.json', write_json)

	// �L���b�V�����X�V
	if (!pref_accounts) {
		// �L���b�V�����Ȃ��ꍇ�̓t�@�C����ǂݍ���ŃL���b�V���𐶐�
		pref_accounts = jsonToMap(JSON.parse(content), (elm) => '@' + elm.user_id + '@' + elm.domain)
	} else {
		pref_accounts.set('@' + write_json.user_id + '@' + write_json.domain, write_json)
	}
}

/**
 * #IPC
 * �ۑ����Ă���J�����ݒ����ǂݍ���
 * �A�v���P�[�V�����L���b�V��������΂����͂������D��
 * 
 * @return �A�J�E���g�F�؏��(�}�b�v�ŕԋp)
 */
function readPrefCols() {
	// �ϐ��L���b�V��������ꍇ�̓L���b�V�����g�p
	if (pref_columns) {
		console.log('@INF: use prefs/columns.json cache.')
		return pref_columns
	}
	var content = readFile('prefs/columns.json')
	if (!content) { // �t�@�C����������Ȃ�������null��ԋp
		return null
	}
	pref_columns = JSON.parse(content)
	console.log('@INF: read prefs/columns.json.')
	return pref_columns
}

/**
 * #IPC
 * �J�����ݒ����ݒ�t�@�C���ɏ�������
 * �������񂾌�A�v���P�[�V�����L���b�V�����X�V
 * 
 * @param path �������ރt�@�C���̃p�X
 * @param json_data ���`�O�̏�������JSON�f�[�^
 */
function writePrefCols(event, json_data) {
	// �ʃt�@�C����ǂޏ���������̂�await���ނ��ߔ񓯊��ɂ���
	const proc = async () => {
		var read_data = await readPrefCols()
		var col_num = (read_data ? read_data.length : 0) + 1;
		var rest_url = null
		var socket_url = null
		var query_param = null
		var socket_param = null
		
		// �v���b�g�t�H�[���̎�ނɂ����API�̌`�����Ⴄ�̂Ōʂɐݒ�
		switch (json_data.account.platform) {
			case 'Mastodon': // Mastodon
				// �^�C�����C���^�C�v�ɂ���Đݒ�l��ς���
				switch (json_data.timeline_type) {
					case 'home': // �z�[���^�C�����C��
						rest_url = "https://" + json_data.account.domain + "/api/v1/timelines/home"
						socket_url = "wss://" + json_data.account.domain + "/api/v1/streaming?stream=user"
						query_param = {}
						break
					case 'local': // ���[�J���^�C�����C��
						rest_url = "https://" + json_data.account.domain + "/api/v1/timelines/public"
						socket_url = "wss://" + json_data.account.domain + "/api/v1/streaming?stream=public:local"
						query_param = { 'local': true }
						break
					case 'federation': // �A���^�C�����C��
						rest_url = "https://" + json_data.account.domain + "/api/v1/timelines/public"
						socket_url = "wss://" + json_data.account.domain + "/api/v1/streaming?stream=public:remote"
						query_param = { 'remote': true }
						break
					case 'notification': // �ʒm
						rest_url = "https://" + json_data.account.domain + "/api/v1/notifications"
						socket_url = "wss://" + json_data.account.domain + "/api/v1/streaming?stream=user:notification"
						query_param = { 'types': ['mention', 'reblog', 'follow', 'follow_request', 'favourite'] }
						break
					default:
						break
				}
				break;
			case 'Misskey': // Misskey
				// �^�C�����C���^�C�v�ɂ���Đݒ�l��ς���
				switch (json_data.timeline_type) {
					case 'home': // �z�[���^�C�����C��
						rest_url = "https://" + json_data.account.domain + "/api/notes/timeline"
						query_param = {}
						break
					case 'local': // ���[�J���^�C�����C��
						rest_url = "https://" + json_data.account.domain + "/api/notes/local-timeline"
						query_param = {}
						break
					case 'federation': // �A���^�C�����C��
						rest_url = "https://" + json_data.account.domain + "/api/notes/global-timeline"
						query_param = {}
						break
					case 'notification': // �ʒm
						rest_url = "https://" + json_data.account.domain + "/api/i/notifications"
						query_param = { 'excludeTypes': ['pollVote', 'pollEnded', 'groupInvited', 'app'] }
						break
					default:
						break
				}
				// WebSocket URL�͋��ʂȂ̂ŊO�ɏo��
				// TODO: �����I�ɃA�J�E���g�P�ʂ�WebSocket�ɐڑ�����̂ŃJ�����ɕۑ�����̂�߂܂��c�c
				socket_url = "wss://" + json_data.account.domain + "/streaming"
				break
			default:
				break
		}

		// JSON�f�[�^�𐶐����Ȃ���t�@�C���ɏ�������
		var content = writeFileArrayJson('prefs/columns.json', {
			'column_id': 'col' + col_num,
			'label_head': json_data.account.domain,
			'label_type': json_data.timeline_type,
			'timelines': [{ // TODO: �����I�ɓ���TL�Ɋg������̂Ŕz��ŕۑ�
				'key_address': json_data.key_address,
				'timeline_type': json_data.timeline_type,
				'rest_url': rest_url,
				'socket_url': socket_url,
				'query_param': query_param
			}],
			'col_color': json_data.col_color
		})

		// �L���b�V�����X�V
		pref_columns = JSON.parse(content)
	}
	proc()
}

/*================================================================================================*/

/**
 * #Utils #Node.js
 * �ėp�t�@�C���������݃��\�b�h(����)
 * �ǂݍ��݂ɐ�������΃t�@�C����string���A���s�����null���Ԃ�
 * 
 * @param path �ǂݍ��ރt�@�C���̃p�X
 * @return �ǂݍ��񂾃t�@�C��(string�`��) ���s�����ꍇnull
 */
function readFile(path) {
	var content = null
	try {
		content = fs.readFileSync(path, 'utf8')
	} catch(err) {
		console.log('!ERR: file read failed.')
	}
	return content
}

/**
 * #Utils #Node.js
 * �ėp�z��^JSON�t�@�C���������݃��\�b�h(�񓯊�)
 * ��z��^JSON��z��^JSON�t�@�C���̌��ɒǉ�����
 * 
 * @param path �ǂݍ��ރt�@�C���̃p�X
 * @param json_data �t�@�C���ɒǉ�����JSON�f�[�^(��z��^)
 * @return �ŏI�I�ɏ������񂾃t�@�C�����estring
 */
function writeFileArrayJson(path, json_data) {
	var content = readFile(path)
	if (content) {
		// �t�@�C�������݂���ꍇ(������JSON��push)
		var pre_json = JSON.parse(content)
		pre_json.push(json_data)
		content = JSON.stringify(pre_json)
	} else {
		// �t�@�C�������݂��Ȃ��ꍇ(�z�񉻂���string��)
		content = JSON.stringify([json_data])
	}

	fs.writeFile(path, content, 'utf8', (err) => {
		if (err) throw err;
		console.log('@INF: file write successed.')
	})
	return content
}

/**
 * #Utils #JS
 * �z��^JSON��map�ɕϊ�����
 * 
 * @param json_data map������JSON�z��
 * @param key_func �L�[�𐶐�����R�[���o�b�N�֐�
 * @return ��������map
 */
function jsonToMap(json_data, key_func) {
	var map = new Map()
	json_data.forEach((elm) => {
		map.set(key_func(elm), elm)
	})
	return map;
}

/*================================================================================================*/

/**
 * #Main #Electron
 * ���C���E�B���h�E��������
 */
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

/**
 * #Main #IPC #Electron
 * �A�v���P�[�V�������s����
 * IPC�ʐM�𒇉��API�������Œ�`
 */
app.whenReady().then(() => {
	// IPC�ʐM�ŌĂяo�����\�b�h��`
	ipcMain.handle('read-pref-accs', readPrefAccs)
	ipcMain.handle('read-pref-cols', readPrefCols)
	ipcMain.on('write-pref-mstd-accs', writePrefMstdAccs)
	ipcMain.on('write-pref-msky-accs', writePrefMskyAccs)
	ipcMain.on('write-pref-cols', writePrefCols)

	// �E�B���h�E����
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