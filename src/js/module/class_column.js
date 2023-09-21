/**
 * #Class
 * �^�C�����C�����Ǘ�����N���X(�J�����ɓ���)
 *
 * @autor tizerm@mofu.kemo.no
 */
class Timeline {
    #__column_id // ���̃^�C�����C������������J������ID
    // �R���X�g���N�^: �ݒ�t�@�C���ɂ���J�����ݒ�l���g���ď�����
    constructor(pref, column) {
        this.pref = pref
        this.__column_id = column.id
        this.status_key_map = new Map()
    }

    // Getter: ���̃^�C�����C���̃z�X�g(�T�[�o�[�h���C��)
    get host() { return this.pref.host }
    // Getter: ���̃^�C�����C���̃A�J�E���g�̃t���A�h���X
    get account_key() { return this.pref.key_address }
    // Getter: ���̃^�C�����C���̃A�J�E���g
    get target_account() { return Account.get(this.pref.key_address) }
    // Getter: ���̃^�C�����C������������J����
    get parent_column() { return Column.get(this.__column_id) }

    // Setter: �X�e�[�^�XID���L�[�Ɏ���ӎ��ʎq�̃}�b�v�ɑ}��
    set id_list(arg) { this.status_key_map.set(arg.status_id, arg.status_key) }

    /**
     * #Method
     * ���̃^�C�����C���̍ŐV�̓��e��30���擾����
     * (�Ԃ�l�͎擾�f�[�^��promise)
     */
    getTimeline() {
        // �N�G���p�����[�^��limit�v���p�e�B�����O�ɒǉ�(�����Mastodon��Misskey�ŋ���)
        this.pref.query_param.limit = 30
        let rest_promise = null
        // �v���b�g�t�H�[������
        switch (this.target_account.platform) {
            case 'Mastodon': // Mastodon
                // REST API�ōŐVTL��30���擾�A���鏈�����v���~�X�Ƃ��Ċi�[
                rest_promise = $.ajax({
                    type: "GET",
                    url: this.pref.rest_url,
                    dataType: "json",
                    headers: { "Authorization": `Bearer ${this.target_account.pref.access_token}` },
                    data: this.pref.query_param
                }).then(data => {
                    return (async () => {
                        // ���e�f�[�^���\�[�g�}�b�v�\�ɂ��鏈����񓯊��Ŏ��s(Promise�ԋp)
                        const posts = []
                        data.forEach(p => posts.push(new Status(p, this, this.target_account)))
                        return posts
                    })()
                })
                break
            case 'Misskey': // Misskey
                // �N�G���p�����[�^�ɃA�N�Z�X�g�[�N�����Z�b�g
                this.pref.query_param.i = this.target_account.pref.access_token
                // REST API�ōŐVTL��30���擾�A���鏈�����v���~�X�Ƃ��Ċi�[
                rest_promise = $.ajax({
                    type: "POST",
                    url: this.pref.rest_url,
                    dataType: "json",
                    headers: { "Content-Type": "application/json" },
                    data: JSON.stringify(this.pref.query_param)
                }).then(data => {
                    return (async () => {
                        // ���e�f�[�^���\�[�g�}�b�v�\�ɂ��鏈����񓯊��Ŏ��s(Promise�ԋp)
                        const posts = []
                        data.forEach(p => posts.push(new Status(p, this, this.target_account)))
                        return posts
                    })()
                })
                break
            default:
                break
        }
        // Promise��ԋp(�����񓯊�)
        return rest_promise
    }

    /**
     * #Method
     * ���̃^�C�����C����WebSocket�ݒ�p�����[�^���A�J�E���g���ɂ킽��
     * (���̒i�K�ł�WebSocket�ւ͂܂��ڑ����Ȃ�)
     */
    setSocketParam() {
        let message_callback = null
        let send_param = null

        // �v���b�g�t�H�[������
        switch (this.target_account.platform) {
            case 'Mastodon': // Mastodon
                // ���b�Z�[�W��M���̃R�[���o�b�N�֐�
                message_callback = (event) => {
                    const data = JSON.parse(event.data)
                    // TL�ƈႤStream�͖���
                    if (data.stream[0] != this.pref.socket_param.stream) return
                    // �^�C�����C���̍X�V�ʒm
                    if (data.event == "update"
                        || (this.pref.timeline_type == "notification" && data.event == "notification"))
                        this.parent_column.prepend(new Status(JSON.parse(data.payload), this, this.target_account))
                    // �폜���ꂽ���e�����m
                    else if (data.event == "delete") this.removeStatus(data.payload)
                }
                // �w�ǃp�����[�^�̐ݒ�
                this.pref.socket_param.type = "subscribe"
                send_param = JSON.stringify(this.pref.socket_param)
                break
            case 'Misskey': // Misskey
                const uuid = crypto.randomUUID()
                message_callback = (event) => {
                    const data = JSON.parse(event.data)
                    // TL�ƈႤStream�͖���
                    if (data.body.id != uuid) return
                    if (data.body.type == "note"
                        || (this.pref.timeline_type == "notification" && data.body.type == "notification"))
                        this.parent_column.prepend(new Status(data.body.body, this, this.target_account))
                }
                // �w�ǃp�����[�^�̐ݒ�
                this.pref.socket_param.id = uuid
                send_param = JSON.stringify({
                    'type': 'connect',
                    'body': this.pref.socket_param
                })
                break
            default:
                break
        }
        // �A�J�E���g���Ƀ\�P�b�g�ݒ��ǉ�
        this.target_account.addSocketPref({
            target_col: this.parent_column,
            send_param: send_param,
            messageFunc: message_callback
        })
    }

    removeStatus(id) {
        const status_key = this.status_key_map.get(id)
        // �^�C�����C���ɑ��݂��铊�e�����폜�ΏۂƂ���
        if (status_key) this.parent_column.removeStatus(this.parent_column.getStatusElement(status_key))
    }
}

/*====================================================================================================================*/

/**
 * #Class
 * �J�������Ǘ�����N���X
 *
 * @autor tizerm@mofu.kemo.no
 */
class Column {
    #open_flg
    // �R���X�g���N�^: �ݒ�t�@�C���ɂ���J�����ݒ�l���g���ď�����
    constructor(pref) {
        this.pref = pref
        this.index = pref.index
        this.status_map = new Map()
        this.unread = 0
        this.flex = pref.d_flex
        this.open_flg = !pref.d_hide

        // �^�C�����C���̓C���X�^���X������ĊǗ�
        const tls = []
        pref.timelines.forEach(tl => tls.push(new Timeline(tl, this)))
        this.timelines = tls
    }

    // Getter: �J�����̈�ӎ���ID���擾
    get id() { return this.pref.column_id }

    static TIMELINE_LIMIT = 200 // �J�����̃^�C�����C���ɕ\���ł�����E��
    static SCROLL = 200         // ws�X�N���[���ŃX�N���[������s�N�Z����
    static SHIFT_SCROLL = 800   // �V�t�gws�X�N���[���ŃX�N���[������s�N�Z����

    // �X�^�e�B�b�N�}�b�v��������(�񓯊�)
    static {
        (async () => {
            const columns = await window.accessApi.readPrefCols()
            const col_map = new Map()
            columns.forEach((col, index) => {
                col.index = index
                col_map.set(col.column_id, new Column(col))
            })
            Column.map = col_map
        })()
    }

    /**
     * #StaticMethod
     * �J�����v���p�e�B���擾
     * 
     * @param arg �擾�Ɏg������
     */
    static get(arg) {
        // ���l�^�������ꍇ�C���f�N�X�Ƃ��Ĕԍ�����v���p�e�B���擾
        if (typeof arg == 'number') return Column.map.get($(".column_td").eq(arg).attr("id"))
        // ������^�������ꍇ�͂��̂܂܃L�[�Ƃ��ăv���p�e�B���擾
        else if (typeof arg == 'string') return Column.map.get(arg)
        // �I�u�W�F�N�g�������ꍇjQuery�I�u�W�F�N�g�Ƃ��Ď擾
        else return Column.map.get(arg.attr("id"))
    }

    /**
     * #StaticMethod
     * �J���Ă���J�����̒��ōŏ��̃J������ԋp
     */
    static getOpenedFirst() {
        return Column.get($(".column_td:visible").first())
    }

    /**
     * #StaticMethod
     * �J�����v���p�e�B�𑖍�
     * 
     * @param callback �v�f���ƂɎ��s����R�[���o�b�N�֐�
     */
    static each(callback) {
        Column.map.forEach((v, k) => callback(v))
    }

    /**
     * #Method
     * ���̃J�����̃^�C�����C���v���p�e�B�𑖍�
     * 
     * @param callback �v�f���ƂɎ��s����R�[���o�b�N�֐�
     */
    eachTimeline(callback) {
        this.timelines.forEach(callback)
    }

    /**
     * #Method
     * ���̃J������DOM�𐶐����ăe�[�u���ɃA�y���h����
     */
    create() {
        // �J�����{�̂���̏�ԂŐ���(�i���o�[�A�C�R����10�����̃J�����̂ݕ\��)
        const num_img = this.index < 9 ? `<img src="resources/${this.index + 1}.png" class="ic_column_num"/>` : ''
        let html /* ������Ԃ̃J���� */ = `
            <td id="${this.id}_closed" class="closed_col">
                ${num_img}
                <div class="col_action">
                    <a class="__on_column_open" title="�J�������J��">
                        <img src="resources/ic_right.png" alt="�J�������J��"/>
                    </a>
                </div>
                <h2>${this.pref.label_head}<span></span></h2>
            </td>
        `; html /* �J������Ԃ̃J���� */ += `
            <td id="${this.id}" class="timeline column_td">
                <div class="col_head">
                    <h2>${this.pref.label_head}</h2>
                    <div class="ic_column_cursor">
                        ${num_img}
                    </div>
                    <div class="col_action">
                        <a class="__on_column_reload" title="�J�����������[�h"
                            ><img src="resources/ic_reload.png" alt="�J�����������[�h"/></a>
                        <a class="__on_column_flex" title="�ϕ�ON/OFF"
                            ><img src="resources/${this.pref.d_flex ? 'ic_flex_on' : 'ic_flex_off'}.png"
                                class="ic_column_flex" alt="�ϕ�ON/OFF"/></a>
                        <a class="__on_column_close" title="�J���������"
                            ><img src="resources/ic_left.png" alt="�J���������"/></a>
                        <a class="__on_column_top" title="�g�b�v�ֈړ�"
                            ><img src="resources/ic_top.png" alt="�g�b�v�ֈړ�"/></a>
                    </div>
                </div>
                <ul></ul>
            </td>
        `
        // �e�[�u���Ƀo�C���h(�Ώۂ������ɓn��̂ň�x�o�C���h���Ă���\������)
        $("#columns>table tr").append(html)

        // �J�����̐F�ƕ���ύX
        $(`#${this.id}>.col_head`).css("background-color", `#${this.pref.col_color}`)
        $(`#${this.id}_closed`).css("background-color", `#${this.pref.col_color}`)
        $(`#${this.id}`).css("width", this.pref.d_flex ? "auto" : `${this.pref.col_width}px`)

        // �f�t�H���g�ŕ���ꍇ�͕\���𔽓]
        if (this.pref.d_hide) {
            $(`#columns>table #${this.id}`).hide()
            $(`#columns>table #${this.id}_closed`).show()
        }
    }

    /**
     * #StaticMethod
     * �J������J�����ɕ\��������e�Ɋւ���C�x���g��ݒ肷��
     */
    static bindEvent() {
        // �R���e���c�{��: �����N���O���u���E�U�ŊJ��
        $(document).on("click", ".content>.main_content a", e => {
            const url = $(e.target).closest("a").attr("href")
            window.accessApi.openExternalBrowser(url)
            // �����N��ɔ�΂Ȃ��悤�ɂ���
            return false
        })
        // �R���e���c�{��: �{�����ӂ�CW�̃I�[�v��/�N���[�Y
        $(document).on("click", ".expand_header",
            e => $(e.target).next().toggle("slide", { direction: "up" }, 100))
        // �J�����{��: ���̃J�����ɃJ�[�\�������킹��
        $(document).on("click", ".column_td", e => {
            Column.disposeCursor()
            Column.get($(e.target).closest("td")).setCursor()
        })
        // �J�����{�^��: �g�b�v�ֈړ�
        $(document).on("click", ".__on_column_top",
            e => Column.get($(e.target).closest("td")).scroll(0))
        // �J�����{�^��: �J�������J��
        $(document).on("click", ".__on_column_open",
            e => Column.get($(e.target).closest("td").index(".closed_col")).toggle())
        // �J�����{�^��: �J���������
        $(document).on("click", ".__on_column_close",
            e => Column.get($(e.target).closest("td").index(".column_td")).toggle())
        // �J�����{�^��: �ϕ�ON/OFF
        $(document).on("click", ".__on_column_flex",
            e => Column.get($(e.target).closest("td")).toggleFlex())
        // �J�����{�^��: �����[�h
        $(document).on("click", ".__on_column_reload",
            e => Column.get($(e.target).closest("td")).reload())
        // �R���e���c�{��: �摜���g��\��
        $(document).on("click", ".__on_media_expand", e => {
            // �A�v���P�[�V�����̃A�X����v�Z
            const link = $(e.target).closest(".__on_media_expand")
            const window_aspect = window.innerWidth / window.innerHeight
            const image_aspect = link.attr("name")

            $("#header>#pop_extend_column")
                .html(`<div class="expand_image_col"><img src="${link.attr("href")}"/></div>`)
                .show("slide", { direction: "right" }, 100)
            if (image_aspect > window_aspect) // �E�B���h�E�����摜�̂ق��������Ȃ���
                $("#header>#pop_extend_column>.expand_image_col>img").css('width', '85vw').css('height', 'auto')
            else // �E�B���h�E�����摜�̂ق����c���Ȃ���
                $("#header>#pop_extend_column>.expand_image_col>img").css('height', '85vh').css('width', 'auto')
            return false
        })
        // �摜�ȊO���N���b�N����Ɖ摜�E�B���h�E�����
        $("body *:not(#header>#pop_extend_column>.expand_image_col)")
            .on("click", e => $("#header>#pop_extend_column>.expand_image_col")
                .closest("#pop_extend_column").hide("slide", { direction: "right" }, 100))
    }

    /**
     * #StaticMethod
     * �J�����̃{�^���Ƀc�[���`�b�v��ݒ肷��
     */
    static tooltip() {
        // �J�����I�v�V�����Ƀc�[���`�b�v�\��
        $("td .col_action").tooltip({
            position: {
                my: "center top",
                at: "center bottom"
            },
            show: {
                effect: "slideDown",
                duration: 100
            },
            hide: {
                effect: "slideUp",
                duration: 100
            }
        });
    }

    /**
     * #Method
     * ���̃J�����̃^�C�����C�����J������DOM�Ƀo�C���h����
     * (�^�C�����C���擾�̃��N�G�X�g�����ׂđ������^�C�~���O(���X�|���X���Ԃ��Ă������͖��Ȃ�)�Ŏ��s)
     */
    async onLoadTimeline(rest_promises) {
        // �J�����̂��ׂẴ^�C�����C����REST API���Ăяo���I����������肷�邽�߂�Promise.all���g�p
        Promise.all(rest_promises).then(datas => {
            // �^�C�����C����Promise�z��𑖍�
            const postlist = [];
            datas.forEach(posts => posts.forEach(p => this.addStatus(p, () => postlist.push(p))))
            // ���ׂẴf�[�^��z��ɓ��ꂽ�^�C�~���O�Ŕz�����t���Ƀ\�[�g����(�P��TL�̂Ƃ��͂��Ȃ�)
            if (datas.length > 1) postlist.sort((a, b) => b.sort_date - a.sort_date)
            // �\�[�g���I�������^�C�����C����DOM�ɔ��f
            postlist.forEach(post => this.append(post))
        }).catch((jqXHR, textStatus, errorThrown) => {
            // �擾���s��
            console.log(jqXHR)
            toast("�^�C�����C���̎擾�Ɏ��s�����J����������܂��B", "error")
        })
    }

    /**
     * #Method
     * �����̃X�e�[�^�X�f�[�^�����̃J�����̖����ɒǉ�����
     * (�ŏ��̃^�C�����C���擾�����Ŏg�p)
     * 
     * @param post �J�����ɒǉ�����X�e�[�^�X�f�[�^
     */
    append(post) {
        $(`#${this.id}>ul`).append(post.element)
    }

    /**
     * #Method
     * �����̃X�e�[�^�X�f�[�^�����̃J�����̐擪�ɒǉ�����
     * (WebSocket�ɂ��Streaming API����̃f�[�^�o�C���h�Ŏg�p)
     * 
     * @param post �J�����ɒǉ�����X�e�[�^�X�f�[�^
     */
    prepend(post) {
        const ul = $(`#${this.id}>ul`)
        // �d�����Ă��铊�e�����O����
        this.addStatus(post, () => {
            // �^�C�����C���L���b�V�������E�ɓ��B���Ă������납�珇�ɃL���b�V���N���A����
            if (ul.find("li").length >= Column.TIMELINE_LIMIT) this.removeStatus(ul.find("li:last-child"))
            ul.prepend(post.element)
            ul.find('li:first-child').hide().show("slide", { direction: "up" }, 180)
            // ���ǃJ�E���^�[���グ��
            $(`#${this.id}_closed>h2>span`).text(++this.unread)
        })

        // �ʒm�������ꍇ�͒ʒm�E�B���h�E�ɒǉ�
        if (post.type == 'notification') window.accessApi.notification(post.notification)
    }

    getStatusElement(status_key) {
        return $(`#${this.id}>ul>li[id="${status_key}"]`)
    }

    /**
     * #Method
     * �����̃X�e�[�^�X�f�[�^�����ɂ��̃J�����ɑ��݂��邩�ǂ�����������
     * ���݂��Ȃ��ꍇ�̓Z�b�g�ɃL�[��ǉ����Ēǉ��p�̃R�[���o�b�N�֐������s
     * 
     * @param post �J�����ɒǉ�����X�e�[�^�X�f�[�^
     * @param callback �d�����Ă��Ȃ��������Ɏ��s����R�[���o�b�N�֐�
     */
    addStatus(post, callback) {
        // �d�����Ă���A�������̓~���[�g�Ώۂ̏ꍇ�̓R�[���o�b�N�֐��̎��s�𖳎�����
        if (!this.status_map.has(post.status_key) && !post.muted) {
            // ���j�[�N�L�[���L�[�ɁA�X�e�[�^�X�C���X�^���X������(Timeline�Ƒ��ݎQ�Ƃ��邽��)
            this.status_map.set(post.status_key, post)
            post.from_timeline.id_list = post
            callback()
        }
    }

    removeStatus(jqelm) {
        const post = this.status_map.get(jqelm.attr("id"))
        post.from_timeline.status_key_map.delete(post.status_id)
        this.status_map.delete(post.status_key)
        jqelm.remove()
    }

    /**
     * #Method
     * ���̃J�����ɃJ�[�\����ݒ�
     */
    setCursor() {
        const elm = $(`#${this.id}`)
        elm.addClass("__target_col")
            .find(".ic_column_cursor").append('<img src="resources/ani_cur.png" class="ic_cursor"/>')
        // �J�[�\�����Z�b�g�����Ƃ���܂ŃX�N���[��
        elm.get()[0].scrollIntoView({ inline: 'nearest' })
    }

    /**
     * #StaticMethod
     * ���݃J�[�\���̂��Ă���J�����̃C���X�^���X���擾
     */
    static getCursor() {
        return Column.get($(".__target_col"))
    }

    /**
     * #StaticMethod
     * ���݃J�[�\���̂��Ă���J��������J�[�\�����������ăJ�����̃C���X�^���X���擾
     */
    static disposeCursor() {
        const target = Column.getCursor()
        $(".__target_col").removeClass("__target_col").find(".ic_cursor").remove()
        return target
    }

    /**
     * #Method
     * ���̃J�����̕\��/��\����؂�ւ���
     */
    toggle() {
        const target = $(`#${this.id}`)
        if (this.open_flg) {
            // Open��Close
            if ($(".column_td:visible").length <= 1) {
                // �S���̃J��������悤�Ƃ�����~�߂�
                toast("���ׂẴJ��������邱�Ƃ͂ł��܂���B", "error")
                return
            }
            // ���g����č��ׂ̒Z�k�J������\��
            const closed_col = target.prev()
            target.hide()
            this.unread = 0 // ���ǐ������Z�b�g
            closed_col.find("h2>span").empty()
            closed_col.show()
            this.open_flg = false
        } else {
            // Close��Open
            target.prev().hide()
            target.show()
            this.open_flg = true
        }
        return this.open_flg
    }

    /**
     * #Method
     * ���̃J�������J��(���łɕ\�����Ă���ꍇ�͂Ȃɂ����Ȃ�)
     */
    open() {
        if (!this.open_flg) this.toggle()
    }

    /**
     * #Method
     * ���̃J���������(���łɔ�\���̏ꍇ�͂Ȃɂ����Ȃ�)
     */
    close() {
        if (this.open_flg) this.toggle()
    }

    /**
     * #Method
     * ���̃J�����̉ϕ��ݒ��ON/OFF��؂�ւ���
     */
    toggleFlex() {
        const target = $(`#${this.id}`)
        const img = target.find(".ic_column_flex")
        if (!this.flex) {
            // OFF��ON
            target.css('width', 'auto')
            img.attr('src', 'resources/ic_flex_on.png')
            this.flex = true
        } else {
            // ON��OFF
            target.css('width', `${this.pref.col_width}px`)
            img.attr('src', 'resources/ic_flex_off.png')
            this.flex = false
        }
    }

    /**
     * #Method
     * ���̃J�����̃X�N���[���ʒu�������̒l�����㉺����
     * 0��ݒ肵���ꍇ�͖������Ő擪�܂ŃX�N���[������
     *
     * @param to �X�N���[�������(0���Z�b�g�Ő擪�܂ňړ�)
     */
    scroll(to) {
        const target = $(`#${this.id}>ul`)
        // ������0�̏ꍇ�͐擪�܂ŃX�N���[��
        if (to == 0) {
            target.scrollTop(0)
            return
        }
        let pos = target.scrollTop() + to
        target.scrollTop(pos > 0 ? pos : 0)
    }

    /**
     * #Method
     * ���̃J�����������[�h����
     */
    reload() {
        // ��U���g��S��������
        $(`#${this.id}`).find("ul").empty()

        const rest_promises = []
        this.status_map = new Map()
        // �J�����̃^�C�����C���𑖍����Ĕz���API�Ăяo���p�����[�^���g���ă^�C�����C���𐶐�
        this.timelines.forEach(tl => rest_promises.push(tl.getTimeline()))
        // �J�����̂��ׂẴ^�C�����C�����擾���I������^�C�����C�����o�C���h
        this.onLoadTimeline(rest_promises)
    }

    // Getter: ���̃J�����̉E���̃J�������擾(���[�e�[�V����)
    get next() {
        let index = $(`#${this.id}`).index(".column_td") + 1
        // �E�[�̏ꍇ�͍ŏ��̗v�f��I��
        if ($(".column_td").length <= index) index = 0
        return Column.get(index)
    }

    // Getter: ���̃J�����̉E���̊J���Ă���J�������擾(���[�e�[�V����)
    get opened_next() {
        let index = $(`#${this.id}`).index(".column_td:visible") + 1
        // �E�[�̏ꍇ�͍ŏ��̗v�f��I��
        if ($(".column_td:visible").length <= index) index = 0
        return Column.get($(".column_td:visible").eq(index))
    }

    // Getter: ���̃J�����̍����̃J�������擾(���[�e�[�V����)
    get prev() {
        let index = $(`#${this.id}`).index(".column_td") - 1
        // ���[�̏ꍇ�͍Ō�̗v�f��I��
        if (index < 0) index = $(".column_td").length - 1
        return Column.get(index)
    }

    // Getter: ���̃J�����̍����̊J���Ă���J�������擾(���[�e�[�V����)
    get opened_prev() {
        let index = $(`#${this.id}`).index(".column_td:visible") - 1
        // �E�[�̏ꍇ�͍ŏ��̗v�f��I��
        if (index < 0) index = $(".column_td:visible").length - 1
        return Column.get($(".column_td:visible").eq(index))
    }
}
