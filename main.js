/**
 * Electron Run Module.
 * Electron�̎��s/�E�B���h�E�̐�����IPC�ʐM���\�b�h�̒�`���s���܂��B
 */

// ���W���[���̃C���|�[�g
const { app, BrowserWindow, ipcMain, shell, Notification } = require('electron')
const path = require('path')
const crypto = require('crypto')
const fs = require('fs')

// �A�v���ێ��p�ݒ�f�[�^�̊Ǘ�
var pref_accounts = null
var pref_columns = null

/*====================================================================================================================*/

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
    const content = readFile('prefs/auth.json')
    if (!content) { // �t�@�C����������Ȃ�������null��ԋp
        return null
    }
    pref_accounts = jsonToMap(JSON.parse(content), (elm) => `@${elm.user_id}@${elm.domain}`)
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
    // JSON�𐶐�(���ƂŃL���b�V���ɓ����̂�)
    const write_json = {
        'domain': json_data.domain,
        'platform': 'Mastodon',
        'user_id': json_data.user_id,
        'username': json_data.username,
        'socket_url': `wss://${json_data.domain}/api/v1/streaming`,
        'client_id': json_data.client_id,
        'client_secret': json_data.client_secret,
        'access_token': json_data.access_token,
        'avatar_url': json_data.avatar_url,
        // �A�J�E���g�J���[�͏����l�O���[
        'acc_color': '808080'
    }

    // �t�@�C���ɏ�������
    const content = writeFileArrayJson('prefs/auth.json', write_json)

    // �L���b�V�����X�V
    if (!pref_accounts) {
        // �L���b�V�����Ȃ��ꍇ�̓t�@�C����ǂݍ���ŃL���b�V���𐶐�
        pref_accounts = jsonToMap(JSON.parse(content), (elm) => `@${elm.user_id}@${elm.domain}`)
    } else {
        pref_accounts.set(`@${json_data.user_id}@${json_data.domain}`, write_json)
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
        'socket_url': `wss://${json_data.domain}/streaming`,
        'client_id': null,
        'client_secret': json_data.app_secret,
        'access_token': i,
        'avatar_url': json_data.user.avatarUrl,
        // �A�J�E���g�J���[�͏����l�O���[
        'acc_color': '808080'
    }

    // �t�@�C���ɏ�������
    const content = writeFileArrayJson('prefs/auth.json', write_json)

    // �L���b�V�����X�V
    if (!pref_accounts) {
        // �L���b�V�����Ȃ��ꍇ�̓t�@�C����ǂݍ���ŃL���b�V���𐶐�
        pref_accounts = jsonToMap(JSON.parse(content), (elm) => `@${elm.user_id}@${elm.domain}`)
    } else {
        pref_accounts.set(`@${write_json.user_id}@${write_json.domain}`, write_json)
    }
}

/**
 * #IPC
 * �A�J�E���g�F�؏��ɐF������������.
 * �������񂾌�A�v���P�[�V�����L���b�V�����X�V
 * 
 * @param event �C�x���g
 * @param json_data ��������JSON�f�[�^
 */
function writePrefAccColor(event, json_data) {
    console.log('@INF: use prefs/auth.json cache.')
    // �ԋpJSON�𑖍����ĐF�����L���b�V���ɕۑ�
    const write_json = []
    json_data.forEach((color) => {
        let acc = pref_accounts.get(color.key_address)
        acc.acc_color = color.acc_color
        write_json.push(acc)
    })

    // �t�@�C���ɏ�������
    const content = overwriteFile('prefs/auth.json', write_json)

    // �L���b�V�����X�V
    pref_accounts = jsonToMap(JSON.parse(content), (elm) => `@${elm.user_id}@${elm.domain}`)
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
    const content = readFile('prefs/columns.json')
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
    // �t�@�C���������ݗp��JSON�t�@�C�����Đ���
    const write_json = []
    json_data.forEach((col, index) => {
        const tl_list = []
        const unique_address = col.timelines[0].key_address
        let multi_account_flg = false
        col.timelines.forEach((tl) => {
            // �^�C�����C����JSON���Đ���
            let rest_url = null
            let socket_url = null
            let query_param = null
            let socket_param = null

            if (tl.key_address != unique_address) {
                // �ЂƂ̃^�C�����C����2�A�J�E���g�ȏ㍬�݂���ꍇ�̓}���`�t���O�𗧂Ă�
                multi_account_flg = true
            }
            // �v���b�g�t�H�[���̎�ނɂ����API�̌`�����Ⴄ�̂Ōʂɐݒ�
            switch (tl.account.platform) {
                case 'Mastodon': // Mastodon
                    // �^�C�����C���^�C�v�ɂ���Đݒ�l��ς���
                    switch (tl.timeline_type) {
                        case 'home': // �z�[���^�C�����C��
                            rest_url = `https://${tl.account.domain}/api/v1/timelines/home`
                            query_param = {}
                            socket_param = { 'stream': 'user' }
                            break
                        case 'local': // ���[�J���^�C�����C��
                            rest_url = `https://${tl.account.domain}/api/v1/timelines/public`
                            query_param = { 'local': true }
                            socket_param = { 'stream': 'public:local' }
                            break
                        case 'federation': // �A���^�C�����C��
                            rest_url = `https://${tl.account.domain}/api/v1/timelines/public`
                            query_param = { 'remote': true }
                            socket_param = { 'stream': 'public:remote' }
                            break
                        case 'notification': // �ʒm
                            rest_url = `https://${tl.account.domain}/api/v1/notifications`
                            query_param = { 'types': ['mention', 'reblog', 'follow', 'follow_request', 'favourite'] }
                            socket_param = { 'stream': 'user:notification' }
                            break
                        default:
                            break
                    }
                    socket_url = `wss://${tl.account.domain}/api/v1/streaming`
                    break;
                case 'Misskey': // Misskey
                    // �^�C�����C���^�C�v�ɂ���Đݒ�l��ς���
                    switch (tl.timeline_type) {
                        case 'home': // �z�[���^�C�����C��
                            rest_url = `https://${tl.account.domain}/api/notes/timeline`
                            query_param = {}
                            socket_param = { 'channel': 'homeTimeline' }
                            break
                        case 'local': // ���[�J���^�C�����C��
                            rest_url = `https://${tl.account.domain}/api/notes/local-timeline`
                            query_param = {}
                            socket_param = { 'channel': 'localTimeline' }
                            break
                        case 'federation': // �A���^�C�����C��
                            rest_url = `https://${tl.account.domain}/api/notes/global-timeline`
                            query_param = {}
                            socket_param = { 'channel': 'globalTimeline' }
                            break
                        case 'notification': // �ʒm
                            rest_url = `https://${tl.account.domain}/api/i/notifications`
                            query_param = { 'excludeTypes': ['pollVote', 'pollEnded', 'groupInvited', 'app'] }
                            socket_param = { 'channel': 'main' }
                            break
                        default:
                            break
                    }
                    // WebSocket URL�͋��ʂȂ̂ŊO�ɏo��
                    socket_url = `wss://${tl.account.domain}/streaming`
                    break
                default:
                    break
            }
            // �^�C�����C�����X�g�ɒǉ�
            tl_list.push({
                'key_address': tl.key_address,
                'host': tl.account.domain,
                'timeline_type': tl.timeline_type,
                'rest_url': rest_url,
                'socket_url': socket_url,
                'query_param': query_param,
                'socket_param': socket_param,
                'exclude_reblog': tl.exclude_reblog
            })
        })
        // �J�������X�g�ɒǉ�
        write_json.push({
            // �J����ID��UUID���g���Ĉ�ӂɌ���(�������ݒ��O�ɍĐ���)
            'column_id': `col_${crypto.randomUUID()}`,
            'label_head': col.label_head,
            'timelines': tl_list,
            'multi_user': multi_account_flg,
            'multi_timeline': tl_list.length > 1,
            'col_color': col.col_color,
            'col_width': col.col_width,
            'd_hide': col.d_hide,
            'd_flex': col.d_flex
        })
    })
    // �ŏI�I�Ȑݒ�t�@�C����JSON�t�@�C���ɏ�������
    const content = overwriteFile('prefs/columns.json', write_json)
    
    // �L���b�V�����X�V
    pref_columns = JSON.parse(content)
}

/*====================================================================================================================*/

/**
 * #Utils #Node.js
 * �ėp�t�@�C���������݃��\�b�h(����)
 * �ǂݍ��݂ɐ�������΃t�@�C����string���A���s�����null���Ԃ�
 * 
 * @param path �ǂݍ��ރt�@�C���̃p�X
 * @return �ǂݍ��񂾃t�@�C��(string�`��) ���s�����ꍇnull
 */
function readFile(path) {
    let content = null
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
    let content = readFile(path)
    if (content) {
        // �t�@�C�������݂���ꍇ(������JSON��push)
        let pre_json = JSON.parse(content)
        pre_json.push(json_data)
        content = JSON.stringify(pre_json)
    } else {
        // �t�@�C�������݂��Ȃ��ꍇ(�z�񉻂���string��)
        content = JSON.stringify([json_data])
    }

    writeDirFile(path, content)
    return content
}

/**
 * #Utils #Node.js
 * �ėpJSON�t�@�C���������݃��\�b�h(�񓯊�)
 * ������JSON�t�@�C�����t�@�C���ɏ�������(���S�㏑������)
 * 
 * @param path �ǂݍ��ރt�@�C���̃p�X
 * @param json_data �t�@�C���ɏ�������JSON�f�[�^(���̓��e�ŏ㏑��)
 * @return �ŏI�I�ɏ������񂾃t�@�C�����estring
 */
function overwriteFile(path, json_data) {
    const content = JSON.stringify(json_data)

    writeDirFile(path, content)
    return content
}

/**
 * #Utils #Node.js
 * �ėp�t�@�C���������݃��\�b�h(�񓯊�)
 * ������content���t�@�C���ɏ������ށA�f�B���N�g�����Ȃ������玩���ō쐬
 * 
 * @param path �ǂݍ��ރt�@�C���̃p�X
 * @param content �t�@�C���ɏ�������string
 */
function writeDirFile(path, content) {
    const dir_name = path.split('/')[0]
    // �p�X�擪�̃f�B���N�g�������쐬�Ȃ��ɍ쐬
    if (!fs.existsSync(dir_name)) {
        fs.mkdirSync(dir_name)
    }

    // �t�@�C����������
    fs.writeFile(path, content, 'utf8', (err) => {
        if (err) throw err;
        console.log('@INF: file write successed.')
    })
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
    const map = new Map()
    json_data.forEach(elm => map.set(key_func(elm), elm))
    return map;
}

/*====================================================================================================================*/

/**
 * #Utils #Electron
 * �����N���O���u���E�U�ŊJ��
 * 
 * @param event �C�x���g
 * @param url �ړ����URL
 */
function openExternalBrowser(event, url) {
    console.log(`@INF: web-${url}`)
    shell.openExternal(url)
}

/**
 * #Utils #Electron
 * �ʒm�𔭐�������
 * 
 * @param event �C�x���g
 * @param arg �ʒm�p�����[�^
 */
function notification(event, arg) {
    new Notification(arg).show()
}

/*====================================================================================================================*/

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
    ipcMain.on('write-pref-acc-color', writePrefAccColor)
    ipcMain.on('write-pref-cols', writePrefCols)
    ipcMain.on('open-external-browser', openExternalBrowser)
    ipcMain.on('notification', notification)

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
