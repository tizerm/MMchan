/**
 * #Class
 * ���e�A�ʒm�f�[�^���Ǘ�����N���X
 *
 * @autor tizerm@mofu.kemo.no
 */
class Status {
    // �R���X�g���N�^: API���痈���X�e�[�^�X�f�[�^���󂯎���Đ���
    constructor(json, timeline, account) {
        // �^�C�����C������Ăяo���ꍇ��timeline��account���n���Ă���
        // �ʂ̓��e��API����Ăяo�����ꍇ��timeline��null�œn���Ă���(account�͌Ăяo�����A�J�E���g)
        this.from_timeline = timeline
        this.from_account = account
        this.type = this.from_timeline?.pref?.timeline_type == 'notification' ? 'notification' : 'post'
        this.status_id = json.id // ���e�ł͂Ȃ����̃X�e�[�^�X�f�[�^�ɑΉ�����ID
        const host = this.from_timeline?.host ?? this.from_account.pref.domain

        // �v���b�g�t�H�[������
        let original_date = null // �����L�[�Ɏg�p����̂�JSON���t�̂ق����ꎞ�ۑ�
        let data = null
        switch (this.from_account.platform) {
            case 'Mastodon': // Mastodon
                this.notif_type = this.type == 'notification' ? json.type : null
                original_date = json.created_at
                this.reblog = json.reblog ? true : false // �u�[�X�g�t���O
                this.reblog_by = this.reblog ? json.account.acct : null // �u�[�X�g�����[�U�[

                // �u�[�X�g�̏ꍇ�̓u�[�X�g����Q�ƃf�[�^�ɐݒ�
                data = this.reblog ? json.reblog : json
                this.uri = json.status?.url ?? data.url // ���eURL(�O�̓��v���C����URL)
                this.id = data.id // ���eID

                // ���[�U�[�Ɋւ���f�[�^
                this.user = {
                    username: data.account.display_name ?? data.account.username,
                    id: data.account.acct,
                    full_address: data.account.acct.match(/@/)
                        ? data.account.acct : `${data.account.acct}@${host}`,
                    avatar_url: data.account.avatar,
                    profile: data.account.note,
                    emojis: new Emojis({
                        host: host,
                        platform: 'Mastodon',
                        emojis: data.account.emojis
                    }),
                    post_count: data.account.statuses_count,
                    follow_count: data.account.following_count,
                    follower_count: data.account.followers_count
                }
                // ���e�R���e���c�Ɋւ���f�[�^
                this.visibility = data.visibility
                this.cw_text = data.spoiler_text // CW�e�L�X�g
                this.content = data.status?.content ?? data.content // �{��(�ʒm�̏ꍇ��status����)
                this.emojis = new Emojis({
                    host: host,
                    platform: 'Mastodon',
                    emojis: data.status?.emojis ?? data.emojis
                })

                // �Y�t���f�B�A
                this.sensitive = data.sensitive // �{�����Ӑݒ�
                this.medias = []
                data.media_attachments?.forEach(media => this.medias.push({
                    url: media.url,
                    thumbnail: media.preview_url,
                    aspect: media.meta?.original?.aspect ?? 1
                }))
                break
            case 'Misskey': // Misskey
                this.notif_type = this.type == 'notification' ? json.type : null
                if (this.notif_type == 'achievementEarned') return // TODO: ���т͈�U���O

                original_date = json.createdAt
                this.reblog = json.renote && !json.text // ���m�[�g�t���O
                this.reblog_by = this.reblog ? json.user.username
                    + (json.user.host ? ('@' + json.user.host) : '') : null // ���m�[�g�����[�U�[
                this.quote_flg = json.renote && json.text

                // ���m�[�g�̏ꍇ�̓��m�[�g����Q�ƃf�[�^�ɐݒ�
                data = this.reblog ? json.renote : json
                // �m�[�gURL����
                // uri�������Ă��Ȃ��ꍇ�͎��I�̓��e�Ȃ̂Ńz�X�g����URI�𐶐�
                if (!data.uri) this.uri = `https://${host}/notes/${data.id}`
                // URI�������Ă��ăv���b�g�t�H�[����Misskey�̏ꍇ��uri���Q��
                else if (data.user?.instance?.softwareName == "misskey") this.uri = data.uri
                // TODO: ����ȊO�͈�UMastodon�Ƃ��ĉ��߂���
                else this.uri = data.url
                this.id = data.id // ���eID

                // ���[�U�[�Ɋւ���f�[�^
                this.user = {
                    username: data.user.name ?? data.user.username,
                    id: data.user.username + (data.user.host ? ('@' + data.user.host) : ''),
                    full_address: `${json.user?.username}@${json.user?.host ? json.user?.host : host}`,
                    avatar_url: data.user.avatarUrl,
                    emojis: new Emojis({
                        host: host,
                        platform: 'Misskey',
                        emojis: data.user.emojis
                    })
                }
                // ���e�R���e���c�Ɋւ���f�[�^
                this.visibility = data.visibility
                this.cw_text = data.cw // CW�e�L�X�g
                this.content = data.note?.renote?.text ?? data.note?.text ?? data.text // �{��(�ʒm�̏ꍇ��status����)
                this.emojis = new Emojis({
                    host: host,
                    platform: 'Misskey',
                    emojis: data.note?.renote?.emojis ?? data.note?.emojis ?? data.emojis
                })
                // ���p�m�[�g������ꍇ�͈��p���ݒ�
                if (this.quote_flg) this.quote = {
                    username: data.renote.user.name,
                    user_id: data.renote.user.username,
                    content: data.renote.text,
                    emojis: new Emojis({
                        host: host,
                        platform: 'Misskey',
                        emojis: data.renote.emojis
                    })
                }

                // �Y�t���f�B�A
                this.sensitive = (data.files?.filter(f => f.isSensitive)?.length ?? 0) > 0 // �{�����Ӑݒ�
                this.medias = []
                data.files?.forEach(media => this.medias.push({
                    url: media.url,
                    thumbnail: media.thumbnailUrl,
                    aspect: media.properties.width / media.properties.height
                }))
                break
            default:
                break
        }
        // ���̃X�e�[�^�X����ӂɌ��肷�邽�߂̃L�[��ݒ�
        this.sort_date = new Date(original_date)
        this.status_key = `${original_date.substring(0, original_date.lastIndexOf('.'))}@${this.user.full_address}`
    }

    // Getter: �}����J����
    get from_column() { return this.from_timeline?.parent_column }
    // Getter: �擾���A�J�E���g�̃v���b�g�t�H�[��(���e�������[�U�[�̃v���b�g�t�H�[���ł͂���܂���)
    get platform() { return this.from_account.platform }
    // Getter: �擾���A�J�E���g�̃A�J�E���g�J���[
    get account_color() { return this.from_account.pref.acc_color }
    // Getter: �~���[�g����(�����BTRN���O�̂�)
    get muted() { return this.from_timeline?.pref?.exclude_reblog && this.reblog }
    // Getter: �{����HTML��͂��ĕ��͂̕��������𔲂��o��
    get content_text() { return $($.parseHTML(this.content)).text() }

    // �Ō�ɓ��e�������e�f�[�^��ێ�����̈�
    static post_stack = []

    // ���t�t�H�[�}�b�^�[��static�v���p�e�B�ɂ���
    static {
        Status.DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
            year:   'numeric',
            month:  '2-digit',
            day:    '2-digit',
            hour:   '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
    }

    pushStack() {
        Status.post_stack.push(this)
    }

    static lastStatusIf(presentCallback, absentCallback) {
        const last_status = Status.post_stack.pop()
        if (last_status) presentCallback(last_status)
        else absentCallback()
    }

    // Getter: ���e�f�[�^����HTML�𐶐����ĕԋp
    get element() {
        if (this.notif_type == 'achievementEarned') return '' // TODO: �ʒm�͈�U���O

        let html /* name������URL��ݒ� */ = `<li id="${this.status_key}" name="${this.uri}">`
        if (this.type == 'notification') { // �ʒm�^�C�v�ɂ���ĕ\����ύX
            switch (this.notif_type) {
                case 'favourite': // ���C�ɓ���
                    html += `
                        <div class="label_head label_favorite">
                            <span>Favorited by @${this.user.id}</span>
                        </div>
                    `
                    break
                case 'reblog': // �u�[�X�g
                    html += `
                        <div class="label_head label_reblog">
                            <span>Boosted by @${this.user.id}</span>
                        </div>
                    `
                    break
                case 'reaction': // �G�������A�N�V����
                    html += `
                        <div class="label_head label_favorite">
                            <span>ReAction from @${this.user.id}</span>
                        </div>
                    `
                    break
                case 'renote': // ���m�[�g
                    html += `
                        <div class="label_head label_reblog">
                            <span>Renoted by @${this.user.id}</span>
                        </div>
                    `
                    break
                case 'follow': // �t�H���[�ʒm
                    html += `
                        <div class="label_head label_follow">
                            <span>Followed by @${this.user.id}</span>
                        </div>
                    `
                    break
                default: // ���v���C�̏ꍇ�̓w�b�_�����Ȃ�
                    break
            }
        } else if (this.reblog) html /* �u�[�X�g/���m�[�g�̃w�b�_ */ += `
            <div class="label_head label_reblog">
                <span>Boosted by @${this.reblog_by}</span>
            </div>
        `
        html /* ���[�U�[�A�J�E���g��� */ += `
            <div class="user">
                <img src="${this.user.avatar_url}" class="usericon"/>
                <h4 class="username">${this.user.emojis.replace(this.user.username)}</h4>
                <a class="userid">@${this.user.id}</a>
        ` // ���J�͈͂��p�u���b�N�ȊO�̏ꍇ�͎��ʃA�C�R����z�u
        switch (this.visibility) {
            case 'unlisted':
            case 'home': // �z�[��
                html += '<img src="resources/ic_unlisted.png" class="visibilityicon"/>'
                break
            case 'private':
            case 'followers': // �t�H����
                html += '<img src="resources/ic_followers.png" class="visibilityicon"/>'
                break
            default:
                break
        }
        html += `
            </div>
            <div class="content">
        `
        if (this.cw_text) html /* CW�e�L�X�g */ += `
            <a class="expand_header label_cw">${this.cw_text}</a>
            <div class="main_content cw_content">
        `; else html += '<div class="main_content">'
        html /* �{��(�G������u��) */ += `   
                    ${this.emojis.replace(this.content)}
                </div>
            </div>
        `
        if (this.platform == 'Misskey' && this.quote_flg) html /* ���p�m�[�g(Misskey�̂�) */ += `
            <div class="post_quote">
                <div>${this.quote.username}</div>
                <div>@${this.quote.user_id}</div>
                <div>${this.quote.emojis.replace(this.quote.content)}</div>
            </div>
        `
        if (this.medias.length > 0) { // �Y�t���f�B�A(����͉摜�̂�)
            html += '<div class="media">'
            if (this.sensitive) html /* �{������ */ += `
                <a class="expand_header label_sensitive">�{�����ӂ̉摜������܂�</a>
                <div class="media_content cw_content">
            `; else if (this.medias.length > 4) /* �Y�t�摜5���ȏ� */ html += `
                <a class="expand_header label_cw">�Y�t�摜��5���ȏ゠��܂�</a>
                <div class="media_content cw_content">
            `; else html += '<div class="media_content">'
            // �A�X�y�N�g��������N�I�v�V�����Ƃ��Đݒ�
            this.medias.forEach(media => html += `
                <a href="${media.url}" name="${media.aspect}" class="__on_media_expand">
                    <img src="${media.thumbnail}" class="media_preview"/>
                </a>
            `)
            html += `
                    </div>
                </div>
            `
        }
        html /* ���e(�X�e�[�^�X)���t */ += `
            <div class="post_footer">
                <a class="created_at __on_datelink">${Status.DATE_FORMATTER.format(this.sort_date)}</a>
        `
        /*
            case 'follow': // �t�H���[�ʒm
        html += `
            <div class="created_at">
                Post: ${value.account.statuses_count} /
                Follow: ${value.account.following_count} /
                Follower: ${value.account.followers_count}
            </div>
        `;//*/

        if (this.from_column?.pref?.multi_user) // �}���`�A�J�E���g�J�����̏ꍇ�͕\�������[�U�[��\��
            html += `<div class="from_address" name="${this.from_account.full_address}">From ${this.from_account.full_address}</div>`
        html += `
                </div>
            </li>
        `

        // ��������HTML��jQuery�I�u�W�F�N�g�Ƃ��ĕԋp
        const jqelm = $($.parseHTML(html))
        jqelm.find('.post_footer>.from_address').css("background-color", `#${this.account_color}`)
        return jqelm
    }

    delete(callback) {
        // ���toast�\��
        const toast_uuid = crypto.randomUUID()
        toast("���e���폜���Ă��܂�...", "progress", toast_uuid)

        let request_promise = null
        switch (this.platform) {
            case 'Mastodon': // Mastodon
                request_promise = $.ajax({ // ���̃X�e�[�^�XID���g���č폜���N�G�X�g�𑗐M
                    type: "DELETE",
                    url: `https://${this.from_account.pref.domain}/api/v1/statuses/${this.status_id}`,
                    headers: { "Authorization": `Bearer ${this.from_account.pref.access_token}` }
                })
                break
            case 'Misskey': // Misskey
                const request_param = {
                    "i": this.from_account.pref.access_token,
                    "noteId": this.status_id
                }
                request_promise = $.ajax({ // ���̃X�e�[�^�XID���g���č폜���N�G�X�g�𑗐M
                    type: "POST",
                    url: `https://${this.from_account.pref.domain}/api/notes/delete`,
                    dataType: "json",
                    headers: { "Content-Type": "application/json" },
                    data: JSON.stringify(request_param)
                })
                break
            default:
                break
        }
        request_promise.then(() => callback(this, toast_uuid)).catch(
            (jqXHR, textStatus, errorThrown) => toast("���e�̍폜�Ɏ��s���܂���.", "error", toast_uuid))
    }

    /**
     * #Method
     * ���̓��e�ɑ΂���ԐM�𓊍e���邽�߂̉�ʂ�\��
     */
    createReplyWindow() {
        // ���v���C�E�B���h�E��DOM����
        const jqelm = $($.parseHTML(`
            <div class="reply_col">
                <h2>From ${this.from_account.full_address}</h2>
                <div class="reply_form">
                    <input type="hidden" id="__hdn_reply_id" value="${this.id}"/>
                    <input type="hidden" id="__hdn_reply_account" value="${this.from_account.full_address}"/>
                    <textarea id="__txt_replyarea" class="__ignore_keyborad"
                        placeholder="(Ctrl+Enter�ł����e�ł��܂�)">@${this.user.id} </textarea>
                    <button type="button" id="__on_reply_submit">���e</button>
                </div>
                <div class="timeline">
                    <ul></ul>
                </div>
                <button type="button" id="__on_reply_close">�~</button>
            </div>
        `))
        // �F�ƃX�e�[�^�X�o�C���h�̐ݒ������DOM���g���J�����Ƀo�C���h
        jqelm.find('h2').css("background-color", `#${this.account_color}`)
        jqelm.find('.timeline>ul').append(this.element)
        $("#header>#pop_extend_column").html(jqelm).show("slide", { direction: "right" }, 150)
        // �\����Ƀ��v���C�J�����̃e�L�X�g�{�b�N�X�Ƀt�H�[�J�X����
        $("#header>#pop_extend_column #__txt_replyarea").focus()
    }

    // Getter: Electron�̒ʒm�R���X�g���N�^�ɑ���ʒm���𐶐����ĕԋp
    get notification() {
        let title = null
        let body = null
        switch (this.platform) {
            case 'Mastodon': // Mastodon
                // �ʒm�^�C�v�ɂ���ĕ\����ύX
                switch (this.notif_type) {
                    case 'favourite': // ���C�ɓ���
                        title = `${this.from_account.full_address}: ${this.user.username}���炨�C�ɓ���`
                        body = this.content
                        break
                    case 'reblog': // �u�[�X�g
                        title = `${this.from_account.full_address}: ${this.user.username}����u�[�X�g`
                        body = this.content
                        break
                    case 'follow': // �t�H���[�ʒm
                        title = `${this.from_account.full_address}: ${this.user.username}����t�H���[`
                        body = this.user.profile
                        break
                    default: // ���v���C
                        title = `${this.from_account.full_address}: ${this.user.username}����ԐM`
                        body = this.content
                        break
                }
                break
            case 'Misskey': // Misskey
                // �ʒm�^�C�v�ɂ���ĕ\����ύX
                switch (this.notif_type) {
                    case 'reaction': // �G�������A�N�V����
                        title = `${this.from_account.full_address}: ${this.user.username}���烊�A�N�V����`
                        body = this.content
                        break
                    case 'renote': // ���m�[�g
                        title = `${this.from_account.full_address}: ${this.user.username}���烊�m�[�g`
                        body = this.content
                        break
                    case 'follow': // �t�H���[�ʒm
                        title = `${this.from_account.full_address}: ${this.user.username}����t�H���[`
                        body = `@${this.user.id} - ${this.user.username}`
                        break
                    default: // ���v���C
                        title = `${this.from_account.full_address}: ${this.user.username}����ԐM`
                        body = this.content
                        break
                }
                break;
            default:
                break;
        }

        // �ʒm��ԋp
        return {
            title: title,
            // HTML�Ƃ��ĉ�͂��Ē��g�̕��͂��������o��
            body: $($.parseHTML(body)).text()
        }
    }
}
