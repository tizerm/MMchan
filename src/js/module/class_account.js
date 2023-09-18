/**
 * #Class
 * �A�J�E���g�����Ǘ�����N���X
 *
 * @autor tizerm@mofu.kemo.no
 */
class Account {
    // �R���X�g���N�^: �ݒ�t�@�C���ɂ���A�J�E���g�ݒ�l���g���ď�����
    constructor(pref) {
        this.pref = pref
        this.index = pref.index
        this.full_address = `@${pref.user_id}@${pref.domain}`
        this.socket_prefs = []
        this.socket = null
        this.reconnect = false
        this.emoji_cache = null
    }

    // Getter: �v���b�g�t�H�[��
    get platform() { return this.pref.platform }
    // Getter: WebSocket�ڑ�URL
    get socket_url() {
        let url = null
        switch (this.pref.platform) {
            case 'Mastodon': // Mastodon
                url = `${this.pref.socket_url}?access_token=${this.pref.access_token}`
                break
            case 'Misskey': // Misskey
                url = `${this.pref.socket_url}?i=${this.pref.access_token}`
                break
            default:
                break
        }
        return url
    }

    // �X�^�e�B�b�N�}�b�v��������(�񓯊�)
    static {
        (async () => {
            const accounts = await window.accessApi.readPrefAccs()
            const acc_map = new Map()
            const keys = []
            let index = 0
            accounts.forEach((v, k) => {
                v.index = index++
                acc_map.set(k, new Account(v))
                keys.push(k)
            })
            Account.map = acc_map
            Account.keys = keys
        })()
    }

    /**
     * #StaticMethod
     * �A�J�E���g�v���p�e�B���擾
     * 
     * @param arg ���l���A�J�E���g�̃t���A�h���X
     */
    static get(arg) {
        // ���l�^�������ꍇ�C���f�N�X�Ƃ��Ĕԍ�����v���p�e�B���擾
        if (typeof arg == 'number') return Account.map.get(Account.keys[arg])
        // �I�u�W�F�N�g�������ꍇ������Ƃ��Ď擾
        else return Account.map.get(arg)
    }

    /**
     * #StaticMethod
     * �A�J�E���g�v���p�e�B�𑖍�
     * 
     * @param callback �v�f���ƂɎ��s����R�[���o�b�N�֐�
     */
    static each(callback) {
        Account.map.forEach((v, k) => callback(v))
    }

    /**
     * #Method
     * ���̃A�J�E���g�𓊍e��A�J�E���g�ɐݒ�
     */
    setPostAccount() {
        $("#header>#head_postarea>.__lnk_postuser>img").attr('src', this.pref.avatar_url)
        $("#header>#head_postarea>.__lnk_postuser>img").attr('name', this.full_address)
        $("#header>h1").text(`${this.pref.username} - ${this.full_address}`)
        $("#header>h1").css("background-color", `#${this.pref.acc_color}`)
    }

    /**
     * #Method #Ajax #jQuery
     * ���̃A�J�E���g���瓊�e���������s
     * 
     * @param arg �p�����[�^
     */
    async post(arg) {
        // ���������ĂȂ������牽�����Ȃ�
        if (!arg.content) return
        let visibility = null
        let request_param = null
        let request_promise = null
        // ���toast�\��
        const toast_uuid = crypto.randomUUID()
        toast("���e���ł�...", "progress", toast_uuid)
        switch (this.pref.platform) {
            case 'Mastodon': // Mastodon
                // ���J�͈͂��擾
                switch (arg.visibility_id) {
                    case 'visibility_public': // ���J
                        visibility = "public"
                        break
                    case 'visibility_unlisted': // �z�[��
                        visibility = "unlisted"
                        break
                    case 'visibility_followers': // �t�H����
                        visibility = "private"
                        break
                    default:
                        break
                }
                request_param = {
                    "status": arg.content,
                    "visibility": visibility
                }
                // CW������ꍇ��CW�e�L�X�g���ǉ�
                if (arg.cw_text) request_param.spoiler_text = arg.cw_text
                // ���v���C�̏ꍇ�̓��v���C��c�[�gID��ݒ�
                if (arg.reply_id) request_param.in_reply_to_id = arg.reply_id
                request_promise = $.ajax({ // API�ɓ��e�𓊂���
                    type: "POST",
                    url: `https://${this.pref.domain}/api/v1/statuses`,
                    dataType: "json",
                    headers: {
                        "Authorization": `Bearer ${this.pref.access_token}`,
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                    },
                    data: request_param
                })
                break
            case 'Misskey': // Misskey
                // ���J�͈͂��擾
                switch (arg.visibility_id) {
                    case 'visibility_public': // ���J
                        visibility = "public"
                        break
                    case 'visibility_unlisted': // �z�[��
                        visibility = "home"
                        break
                    case 'visibility_followers': // �t�H����
                        visibility = "followers"
                        break
                    default:
                        break
                }
                request_param = {
                    "i": this.pref.access_token,
                    "text": arg.content,
                    "visibility": visibility
                }
                // CW������ꍇ��CW�e�L�X�g���ǉ�
                if (arg.cw_text) request_param.cw = arg.cw_text
                // ���v���C�̏ꍇ�̓��v���C��c�[�gID��ݒ�
                if (arg.reply_id) request_param.replyId = arg.reply_id
                request_promise = $.ajax({ // API�ɓ��e�𓊂���
                    type: "POST",
                    url: `https://${this.pref.domain}/api/notes/create`,
                    dataType: "json",
                    headers: { "Content-Type": "application/json" },
                    data: JSON.stringify(request_param)
                })
                break
            default:
                break
        }
        request_promise.then(() => {
            // ���e������(�R�[���o�b�N�֐����s)
            arg.success()
            toast("���e���܂���.", "done", toast_uuid)
        }).catch((jqXHR, textStatus, errorThrown) => toast("���e�Ɏ��s���܂���.", "error", toast_uuid))
    }

    /**
     * #Method #Ajax #jQuery
     * ���̃A�J�E���g����u�[�X�g/���m�[�g/���C�ɓ��菈�������s
     * 
     * @param arg �p�����[�^
     */
    async reaction(arg) {
        let request_promise = null
        let target_json = null
        const toast_uuid = crypto.randomUUID()
        toast("�Ώۂ̓��e���擾���ł�...", "progress", toast_uuid)
        // �^�[�Q�b�g�̓��e�f�[�^���擾
        switch (this.platform) {
            case 'Mastodon': // Mastodon
                request_promise = $.ajax({ // �������瓊�e���擾
                    type: "GET",
                    url: `https://${this.pref.domain}/api/v2/search`,
                    dataType: "json",
                    headers: { "Authorization": `Bearer ${this.pref.access_token}` },
                    data: {
                        "q": arg.target_url,
                        "type": "statuses",
                        "resolve": true
                    }
                }).then(data => {
                    // �擾�f�[�^��Promise�ŕԋp
                    return data.statuses[0]
                }).catch((jqXHR, textStatus, errorThrown) => {
                    // �擾���s��
                    toast("���e�̎擾�ŃG���[���������܂���.", "error", toast_uuid)
                })
                break
            case 'Misskey': // Misskey
                request_promise = $.ajax({
                    type: "POST",
                    url: `https://${this.pref.domain}/api/ap/show`,
                    dataType: "json",
                    headers: { "Content-Type": "application/json" },
                    data: JSON.stringify({
                        "i": this.pref.access_token,
                        "uri": arg.target_url
                    })
                }).then(data => {
                    // �擾�f�[�^��Promise�ŕԋp
                    return data.object
                }).catch((jqXHR, textStatus, errorThrown) => {
                    // �擾���s��
                    toast("���e�̎擾�ŃG���[���������܂���.", "error", toast_uuid)
                });
                break
            default:
                break
        }
        // �f�[�^���擾�����̂�҂���target_json�ɑ��
        target_json = await request_promise
        // ���e���擾�ł��Ȃ�������Ȃɂ����Ȃ�
        if (!target_json) return
        // �擾�ł����ꍇ��target_json����Status�C���X�^���X�𐶐�
        const target_post = new Status(target_json, null, this)
        switch (this.platform) {
            case 'Mastodon': // Mastodon
                switch (arg.target_mode) {
                    case '__menu_reply': // ���v���C
                        target_post.createReplyWindow()
                        toast(null, "hide", toast_uuid)
                        break;
                    case '__menu_reblog': // �u�[�X�g
                        $.ajax({
                            type: "POST",
                            url: `https://${this.pref.domain}/api/v1/statuses/${target_post.id}/reblog`,
                            dataType: "json",
                            headers: { "Authorization": `Bearer ${this.pref.access_token}` }
                        }).then(data => {
                            toast("���e���u�[�X�g���܂���.", "done", toast_uuid)
                        }).catch((jqXHR, textStatus, errorThrown) => {
                            // �擾���s��
                            toast("�u�[�X�g�Ɏ��s���܂���.", "error", toast_uuid)
                        })
                        break
                    case '__menu_favorite': // ���C�ɓ���
                        $.ajax({
                            type: "POST",
                            url: `https://${this.pref.domain}/api/v1/statuses/${target_post.id}/favourite`,
                            dataType: "json",
                            headers: { "Authorization": `Bearer ${this.pref.access_token}` }
                        }).then(data => {
                            toast("���e�����C�ɓ��肵�܂���.", "done", toast_uuid)
                        }).catch((jqXHR, textStatus, errorThrown) => {
                            // �擾���s��
                            toast("���C�ɓ���Ɏ��s���܂���.", "error", toast_uuid)
                        })
                        break
                    default:
                        break
                }
                break
            case 'Misskey': // Misskey
                switch (arg.target_mode) {
                    case '__menu_reply': // ���v���C
                        target_post.createReplyWindow()
                        toast(null, "hide", toast_uuid)
                        break
                    case '__menu_reblog': // ���m�[�g
                        $.ajax({
                            type: "POST",
                            url: `https://${this.pref.domain}/api/notes/create`,
                            dataType: "json",
                            headers: { "Content-Type": "application/json" },
                            data: JSON.stringify({
                                "i": this.pref.access_token,
                                "renoteId": target_post.id
                            })
                        }).then(data => {
                            toast("���e�����m�[�g���܂���.", "done", toast_uuid)
                        }).catch((jqXHR, textStatus, errorThrown) => {
                            // �擾���s��
                            toast("���m�[�g�Ɏ��s���܂���.", "error", toast_uuid)
                        })
                        break
                    case '__menu_favorite': // ���C�ɓ���
                        toast("Misskey�ł��C�ɓ���͌����Ή��ł��c�c.", "error", toast_uuid)
                        break
                    default:
                        break
                }
                break
            default:
                break
        }
    }

    /**
     * #Method #WebSocket
     * ���̃A�J�E���g��WebSocket�̐ݒ��ǉ�����
     * 
     * @param arg �p�����[�^
     */
    addSocketPref(arg) {
        this.socket_prefs.push(arg)
    }

    /**
     * #Method #WebSocket
     * ���̃A�J�E���g����WebSocket�ڑ����������s
     * 
     * @param arg �p�����[�^
     */
    async connect(arg) {
        // WebSocket�ڑ����J�n
        this.socket = new WebSocket(this.socket_url)
        this.reconnect = arg.reconnect

        // WebSocket�ڑ��J�n������
        this.socket.addEventListener("open", (event) => {
            // �ڑ��J�n�p�R�[���o�b�N�֐������s
            arg.openFunc()
            // �\�P�b�g�Ɏ�M�ݒ�𑗐M
            this.socket_prefs.forEach(p => this.socket.send(p.send_param))
        })
        // �G���[�n���h��
        this.socket.addEventListener("error", (event) => {
            toast(`${this.full_address}�Őڑ��G���[���������܂����A�Đڑ����Ă��������B`, "error")
            // �G���[�Ő؂ꂽ�ꍇ�͍Đڑ����Ȃ�
            this.reconnect = false
            console.log(event)
        })
        // WebSocket�ڑ���~������
        this.socket.addEventListener("close", (event) => {
            // �ڑ���~�p�R�[���o�b�N�֐������s
            arg.closeFunc()
            // ���g���Ăяo���čĐڑ�
            if (this.reconnect) this.connect(arg)
            console.log(event)
        })
        // ��M������ݒ�
        this.socket_prefs.forEach(p => this.socket.addEventListener("message", p.messageFunc))
    }

    // Getter: �F�؃A�J�E���g�����Ԃɕ��ׂ��Ƃ��ɂ��̃A�J�E���g�̎��ɂ�����A�J�E���g���擾
    get next() {
        let index = this.index + 1
        // �E�[�̏ꍇ�͍ŏ��̗v�f��I��
        if (Account.keys.length <= index) index = 0
        return Account.get(index)
    }

    // Getter: �F�؃A�J�E���g�����Ԃɕ��ׂ��Ƃ��ɂ��̃A�J�E���g�̑O�ɂ�����A�J�E���g���擾
    get prev() {
        let index = this.index - 1
        // ���[�̏ꍇ�͍Ō�̗v�f��I��
        if (index < 0) index = Account.keys.length - 1
        return Account.get(index)
    }

    /**
     * #StaticMethod
     * ���e�A�J�E���g��I�����郊�X�g��DOM��ԋp
     */
    static createPostAccountList() {
        let html = '<div class="account_list">'
        Account.map.forEach((v, k) => html += `
            <a name="${k}" class="__lnk_account_elm">
                <img src="${v.pref.avatar_url}" class="user_icon"/>
                <div class="display_name">${v.pref.username}</div>
                <div class="user_domain">${k}</div>
            </a>
        `)
        html += '</div>'
        return html
    }

    /**
     * #StaticMethod
     * ���e�A�J�E���g��I������R���e�L�X�g���j���[��DOM��ԋp
     */
    static createContextMenuAccountList() {
        let html = ''
        Account.map.forEach((v, k) => html += `<li name="${k}"><div>${v.pref.username} - ${k}</div></li>`)
        return html
    }
}
