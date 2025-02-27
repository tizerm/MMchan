﻿/**
 * #Class
 * (他人の)アカウント情報を管理するクラス
 *
 * @author @tizerm@misskey.dev
 */
class User {
    // コンストラクタ: APIから来たユーザーデータを受け取って生成
    constructor(arg) {
        this.platform = arg.platform
        this.fields = []
        let host = null

        switch (arg.platform) {
            case 'Mastodon': // Mastodon
                // リモートの情報を直に取得する場合引数をそのまま使う
                if (arg.remote) host = arg.host
                else // ローカルサーバーからユーザー情報を取得している場合
                    host = arg.json.acct.match(/@/) // リモートホストはアドレスから取得
                        ? arg.json.acct.substring(arg.json.acct.lastIndexOf('@') + 1) : arg.host

                this.use_emoji_cache = false // Mastodonの場合絵文字キャッシュは使わない
                this.emojis = new Emojis({
                    host: host,
                    platform: 'Mastodon',
                    emojis: arg.json.emojis
                })

                this.id = arg.json.id
                this.user_id = arg.json.username
                this.full_address = `@${arg.json.username}@${host}`
                this.username = arg.json.display_name || arg.json.username
                this.avatar_url = arg.json.avatar
                this.header_url = arg.json.header
                this.profile = arg.json.note
                this.url = arg.json.url
                this.count_post = arg.json.statuses_count
                this.count_follow = arg.json.following_count
                this.count_follower = arg.json.followers_count

                // フィールドをセット
                if (arg.json.fields) arg.json.fields.forEach(f => this.fields.push({
                    label: f.name,
                    text: f.value
                }))
                break
            case 'Misskey': // Misskey
                // リモートの情報を直に取得する場合引数をそのまま使う
                if (arg.remote) host = arg.host
                else // ローカルサーバーからユーザー情報を取得している場合ホスト情報を参照する
                    host = arg.json.host ?? arg.host

                this.emojis = new Emojis({
                    host: host,
                    platform: 'Misskey',
                    emojis: arg.json.emojis
                })

                this.id = arg.json.id
                this.user_id = arg.json.username
                this.full_address = `@${arg.json.username}@${host}`
                this.username = arg.json.name || arg.json.username
                this.avatar_url = arg.json.avatarUrl
                this.header_url = arg.json.bannerUrl
                this.profile = arg.json.description
                if (this.profile) this.profile = this.profile.replace(new RegExp('\n', 'g'), '<br/>') // 改行文字をタグに置換
                this.url = `https://${host}/@${arg.json.username}` // URLは自前で生成
                this.count_post = arg.json.notesCount
                this.count_follow = arg.json.followingCount
                this.count_follower = arg.json.followersCount
                this.hide_ff = (arg.json.ffVisibility ?? 'public') != 'public'
                this.hide_follow = (arg.json.followingVisibility ?? 'public') != 'public'
                this.hide_follower = (arg.json.followersVisibility ?? 'public') != 'public'

                // ロールセット
                this.roles = arg.json.badgeRoles

                // フィールドをセット
                if (arg.json.fields) arg.json.fields.forEach(f => this.fields.push({
                    label: f.name,
                    text: f.value.match(/^http/) // URLはリンクにする
                        ? `<a href="${f.value}" class="__lnk_external">${f.value}</a>` : f.value
                }))

                // ピンどめ投稿はまとめる
                this.pinneds = [] // この段階ではまだ整形しない
                if (arg.json.pinnedNotes) arg.json.pinnedNotes.forEach(note => this.pinneds.push(note))
                break
            default:
                break
        }
        this.host = host
        this.ff_remote_flg = arg.host != host
        this.all_account_flg = arg.auth
        // Mistdonに認証情報のあるホストの場合は対象アカウントを引っ張ってくる
        this.authorized = Account.getByDomain(host)
        if (this.platform == 'Misskey') this.use_emoji_cache = !!this.authorized
        this.user_uuid = crypto.randomUUID()

        if (Preference.GENERAL_PREFERENCE.remote_fetch?.profile_ff && !arg.remote && this.ff_remote_flg)
            // フォローフォロワー表示でリモートアカウントを引いた場合
            this.__prm_remote_user = User.getByAddress(this.full_address, true)
    }

    // 画面に表示したユーザーのオブジェクトをキャッシュするマップ
    static USER_CACHE_MAP = new Map()

    // スタティックタイムライン情報を初期化
    static {
        User.USER_MAIN_TIMELINE = { "__extended_timeline": "profile_post" }
        User.DETAIL_TIMELINE = { "parent_column": null }
    }

    // Getter: SkyBridge判定
    get is_skybridge() { return this.host == 'skybridge.fly.dev' }
    // Getter: 取得元アカウントのカスタム絵文字
    get host_emojis() { return this.authorized?.emojis }
    // Getter: ユーザーキャッシュを認識するためのキー
    get user_key() { return `user_${this.user_uuid}` }

    /**
     * #StaticMethod
     * リモートホストも含めたユーザーアドレスからリモートのユーザー情報を取得する
     * 
     * @param address ユーザーアカウントのフルアドレス
     * @param ignore_notify 左上の通知を表示しない場合はtrue
     */
    static async getByAddress(address, ignore_notify) {
        let notification = null
        if (!ignore_notify) notification = Notification.progress("対象ユーザーのリモートIDを取得中です...")
        const user_id = address.substring(1, address.lastIndexOf('@'))
        const host = address.substring(address.lastIndexOf('@') + 1)

        return await Promise.any([
            // アドレスからプラットフォームの種類が判定できないので、request送信してうまくいったやつだけ返す
            $.ajax({ // Mastodon
                type: "GET",
                url: `https://${host}/api/v1/accounts/lookup`,
                dataType: "json",
                data: { "acct": user_id }
            }).then(data => { return {
                platform: 'Mastodon',
                id: data.id
            }}),
            $.ajax({ // Misskey
                type: "POST",
                url: `https://${host}/api/users/show`,
                dataType: "json",
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify({
                    "username": user_id,
                    "host": host
                })
            }).then(data => { return {
                platform: 'Misskey',
                id: data.id
            }})
        ]).then(info => {
            notification?.done()
            return User.get({
                id: info.id,
                platform: info.platform,
                host: host
            })
        }).catch(jqXHR => notification?.error(`
            ユーザーIDの取得でエラーが発生しました. 
            サポート外のプラットフォームの可能性があります.
        `))
    }

    /**
     * #StaticMethod
     * ローカルにキャッシュされているユーザーオブジェクトを取得する.
     * 
     * @param target_td 取得対象のプロフィールのTD DOM
     */
    static getCache(target_td) {
        return User.USER_CACHE_MAP.get(target_td.attr("id"))
    }

    /**
     * #StaticMethod
     * ローカルにキャッシュされているユーザーオブジェクトを削除する.
     * 
     * @param target_td 取得対象のプロフィールのTD DOM
     */
    static deleteCache(target_td) {
        return User.USER_CACHE_MAP.delete(target_td.attr("id"))
    }

    /**
     * #StaticMethod
     * サーバーのアカウントIDからユーザー情報を取得する
     * 
     * @param arg パラメータオブジェクト
     */
    static async get(arg) {
        let response = null
        try {
            switch (arg.platform) {
                case 'Mastodon': // Mastodon
                    response = await $.ajax({
                        type: "GET",
                        url: `https://${arg.host}/api/v1/accounts/${arg.id}`,
                        dataType: "json"
                    })
                    break
                case 'Misskey': // Misskey
                    response = await $.ajax({
                        type: "POST",
                        url: `https://${arg.host}/api/users/show`,
                        dataType: "json",
                        headers: { "Content-Type": "application/json" },
                        data: JSON.stringify({ "userId": arg.id })
                    })
                    break
                default:
                    break
            }
            return new User({ // ユーザーオブジェクトを生成
                json: response,
                host: arg.host,
                remote: true,
                auth: false,
                platform: arg.platform
            })
        } catch (err) {
            console.log(err)
            return Promise.reject(err)
        }
    }

    /**
     * #StaticMethod
     * ユーザー情報詳細表示のテンプレートHTMLを返却.
     * 
     * @param address ユーザーフルアドレス
     */
    static createDetailHtml(address) {
        return `
            <div class="timeline column_profile" name="${address}">
                <div class="col_loading">
                    <img src="resources/illust/ani_wait.png" alt="Now Loading..."/><br/>
                    <span class="loading_text">Now Loading...</span>
                </div>
                <ul class="profile_header __context_user"></ul>
                <ul class="profile_detail __context_user"></ul>
                <div class="user_post_elm">
                    <div class="tab">
                        <a class="__tab_profile_posts">投稿</a>
                        <a class="__tab_profile_channels">チャンネル</a>
                        <a class="__tab_profile_medias">メディア</a>
                    </div>
                    <div class="post_uls">
                        <div class="pinned_block post_div">
                            <h4>ピンどめ</h4>
                            <ul class="pinned_post __context_posts"></ul>
                        </div>
                        <div class="posts_block post_div">
                            <ul class="posts __context_posts"></ul>
                        </div>
                    </div>
                    <div class="channel_uls">
                        <ul class="channel_post __context_posts"></ul>
                    </div>
                    <div class="media_uls">
                        <ul class="media_post __context_posts"></ul>
                    </div>
                </div>
                <div class="user_ff_elm">
                    <ul class="ff_nametags"></ul>
                </div>
            </div>
        `
    }

    // Getter: プロフィールヘッダのDOMを返却
    get header_element() {
        let html /* name属性にURLを設定 */ = `
            <li class="header_userinfo">
                <div class="label_head user_header">
                    <span>&nbsp;</span>
                </div>
        `
        // カスタム絵文字が渡ってきていない場合はアプリキャッシュを使う
        const target_emojis = this.use_emoji_cache && this.host_emojis ? this.host_emojis : this.emojis
        html /* ユーザーアカウント情報 */ += `
            <div class="user">
                <img src="${this.avatar_url}" class="usericon"/>
                <div class="name_info">
                    <h4 class="username">${target_emojis.replace(this.username)}</h4>
                    <a href="${this.url}" class="userid __lnk_external">${this.full_address}</a>
                </div>
        `
        let bookmarks = ''
        let instance = ''
        switch (this.platform) {
            case 'Mastodon': // Mastodon
                html += `<img src="resources/${this.is_skybridge ? 'ic_bluesky' : 'ic_mastodon'}.png" class="instance_icon"/>`
                bookmarks = `
                    <a class="__on_show_bookmark" title="ブックマーク"
                        ><img src="resources/ic_bkm.png" alt="ブックマーク"/></a>
                    <a class="__on_show_mastfav" title="お気に入り"
                        ><img src="resources/ic_favorite.png" alt="お気に入り"/></a>
                `
                instance = `
                    <a class="__on_show_instance" title="所属インスタンス情報"
                        ><img src="resources/ic_mastodon.png" alt="所属インスタンス情報"/></a>
                `
                break
            case 'Misskey': // Misskey
                html += '<img src="resources/ic_misskey.png" class="instance_icon"/>'
                bookmarks = `
                    <a class="__on_show_reaction" title="リアクション"
                        ><img src="resources/ic_emoji.png" alt="リアクション"/></a>
                    <a class="__on_show_miskfav" title="お気に入り"
                        ><img src="resources/ic_favorite.png" alt="お気に入り"/></a>
                `
                instance = `
                    <a class="__on_show_instance" title="所属インスタンス情報"
                        ><img src="resources/ic_misskey.png" alt="所属インスタンス情報"/></a>
                `
                break
            default:
                break
        }
        html /* フォロー/フォロワー数(非公開の場合は非公開ラベルを出す) */ += `
            </div>
            <div class="detail_info">
                <span class="count_post counter label_postcount" title="投稿数">${this.count_post}</span>
                <span class="count_follow counter ${this.hide_follow || this.hide_ff ? 'label_private' : 'label_follow'}"
                    title="${this.hide_follow || this.hide_ff ? '(フォロー非公開ユーザーです)' : 'フォロー'}">
                    ${this.hide_follow || this.hide_ff ? '???' : this.count_follow}
                </span>
                <span class="count_follower counter ${this.hide_follower || this.hide_ff ? 'label_private' : 'label_follower'}"
                    title="${this.hide_follower || this.hide_ff ? '(フォロワー非公開ユーザーです)' : 'フォロワー'}">
                    ${this.hide_follower || this.hide_ff ? '???' : this.count_follower}
                </span>
            </div>
        </li>`

        // 生成したHTMLをjQueryオブジェクトとして返却
        const jqelm = $($.parseHTML(html))
        // ヘッダ画像を縮小表示して表示
        jqelm.find('.user_header').css('background-image', `url("${this.header_url}")`)
        if (this.all_account_flg) // 認証プロフィール表示の場合はブックマークアイコンを追加
            jqelm.find('.detail_info').addClass('auth_details').prepend(bookmarks)
        else // 認証されていないプロフィール表示の場合は所属インスタンスボタンを追加
            jqelm.find('.detail_info').prepend(instance)
        return jqelm
    }

    // Getter: プロフィール本体のDOMを返却
    get profile_element() {
        const target_emojis = this.use_emoji_cache && this.host_emojis ? this.host_emojis : this.emojis
        let html /* name属性にURLを設定 */ = '<li class="profile_userinfo">'
        html += `
            <div class="content">
                <div class="main_content">${target_emojis.replace(this.profile)}</div>
        `
        if ((this.roles?.length ?? 0) > 0) { // ロールが存在する場合は表示
            html += '<ul class="prof_role">'
            this.roles.forEach(r => html += `<li>
                <img src="${r.iconUrl}" alt="${r.name}"/>
                <span>${r.name}</span>
            </li>`)
            html += '</ul>'
        }
        if (this.fields.length > 0) { // フィールドが存在する場合は表示
            html += '<table class="prof_field"><tbody>'
            this.fields.forEach(f => html += `<tr>
                <th>${target_emojis.replace(f.label)}</th>
                <td>${target_emojis.replace(f.text)}</td>
            </tr>`)
            html += '</tbody></table>'
        }
        html += '</div></li>'

        // 生成したHTMLをjQueryオブジェクトとして返却
        const jqelm = $($.parseHTML(html))
        return jqelm
    }

    // Getter: 簡易プロフィールDOMを返却
    get short_elm() {
        let html /* name属性にURLを設定 */ = `
            <li class="short_userinfo" name="${this.full_address}">
                <div class="label_head user_header">
                    <span>&nbsp;</span>
                </div>
        `
        // カスタム絵文字が渡ってきていない場合はアプリキャッシュを使う
        const target_emojis = this.use_emoji_cache && this.host_emojis ? this.host_emojis : this.emojis
        { // ロールが存在する場合はロールをプロフィールに埋め込む
            let roles = ''
            if ((this.roles?.length ?? 0) > 0) {
                roles = '<div class="user_role">'
                this.roles.forEach(role => roles += `<img src="${role.iconUrl}" alt="${role.name}"/>`)
                roles += '</div>'
            }
            html /* ユーザーアカウント情報 */ += `
                <div class="user">
                    <img src="${this.avatar_url}" class="usericon"/>
                    ${roles}
                    <div class="name_info">
                        <h4 class="username">${target_emojis.replace(this.username)}</h4>
                        <a href="${this.url}" class="userid __lnk_external">${this.full_address}</a>
                    </div>
            `
        }
        switch (this.platform) {
            case 'Mastodon': // Mastodon
                html += '<img src="resources/ic_mastodon.png" class="instance_icon"/>'
                break
            case 'Misskey': // Misskey
                html += '<img src="resources/ic_misskey.png" class="instance_icon"/>'
                break
            default:
                break
        }
        html /* フォロー/フォロワー数(非公開の場合は非公開ラベルを出す) */ += `
            </div>
            <div class="content"><div class="main_content">
                ${$($.parseHTML(this.profile)).text()}
            </div></div>
            <div class="detail_info">
                <span class="count_post counter label_postcount" title="投稿数">${this.count_post}</span>
                <span class="count_follow counter ${this.hide_follow || this.hide_ff ? 'label_private' : 'label_follow'}"
                    title="${this.hide_follow || this.hide_ff ? '(フォロー非公開ユーザーです)' : 'フォロー'}">
                    ${this.hide_follow || this.hide_ff ? '???' : this.count_follow}
                </span>
                <span class="count_follower counter ${this.hide_follower || this.hide_ff ? 'label_private' : 'label_follower'}"
                    title="${this.hide_follower || this.hide_ff ? '(フォロワー非公開ユーザーです)' : 'フォロワー'}">
                    ${this.hide_follower || this.hide_ff ? '???' : this.count_follower}
                </span>
            </div>
        </li>`

        // 生成したHTMLをjQueryオブジェクトとして返却
        const jqelm = $($.parseHTML(html))
        // ヘッダ画像を縮小表示して表示
        jqelm.find('.user_header').css('background-image', `url("${this.header_url}")`)
        return jqelm
    }

    // Getter: インラインで名前だけ表示するネームタグ表示用DOM
    get inline_nametag() {
        let cnt_pst = Number(this.count_post)
        let cnt_flw = Number(this.count_follow)
        let cnt_flr = Number(this.count_follower)
        cnt_pst = cnt_pst < 1000 ? cnt_pst : `${floor(cnt_pst / 1000, 0)}k`
        cnt_flw = cnt_flw < 1000 ? cnt_flw : `${floor(cnt_flw / 1000, 0)}k`
        cnt_flr = cnt_flr < 1000 ? cnt_flr : `${floor(cnt_flr / 1000, 0)}k`

        const target_emojis = this.use_emoji_cache && this.host_emojis ? this.host_emojis : this.emojis
        // 生成したHTMLをjQueryオブジェクトとして返却
        const jqelm = $($.parseHTML(`
            <li class="user_nametag" name="${this.full_address}">
                <div class="user">
                    <img src="${this.avatar_url}" class="usericon"/>
                    <div class="name_info">
                        <h4 class="username">${target_emojis.replace(this.username)}</h4>
                        <span class="userid">${this.full_address}</span>
                        <div class="detail_info">
                            <span class="counter label_postcount" title="投稿数">${cnt_pst}</span>
                            <span class="counter ${this.hide_follow || this.hide_ff ? 'label_private' : 'label_follow'}"
                                title="${this.hide_follow || this.hide_ff ? '(フォロー非公開ユーザーです)' : 'フォロー'}">
                                ${this.hide_follow || this.hide_ff ? '??' : cnt_flw}
                            </span>
                            <span class="counter ${this.hide_follower || this.hide_ff ? 'label_private' : 'label_follower'}"
                                title="${this.hide_follower || this.hide_ff ? '(フォロワー非公開ユーザーです)' : 'フォロワー'}">
                                ${this.hide_follower || this.hide_ff ? '??' : cnt_flr}
                            </span>
                            <span class="short_profile"></span>
                        </div>
                    </div>
                </div>
            </li>
        `))

        // プロフィールは一行表示にする
        jqelm.find(".short_profile").html($($.parseHTML(this.profile)).text())
        if (Preference.GENERAL_PREFERENCE.blur_suspend_user && cnt_pst < 10) // 投稿数が10以下のユーザーを半透明にする
            jqelm.closest("li").addClass("ignored_user")

        return jqelm
    }

    /**
     * #Method #Async
     * このユーザー情報をDOMに反映したあとにあとから非同期で取得して表示する情報を追加でバインドする.
     * (フォロー/フォロワー表示内の処理)
     * 
     * @param tgul この情報をアペンドした親のDOM Element
     */
    async bindRemoteNametagAsync(tgul) {
        const target_li = tgul.find(`li[name="${this.full_address}"]`)

        // リモートのフォローフォロワーの情報を表示
        this.__prm_remote_user?.then(user => {
            const jqelm = user.inline_nametag
            let html = ''
            switch (user.platform) {
                case 'Mastodon': // Mastodon
                    html += '<img src="resources/ic_mastodon.png" class="instance_icon"/>'
                    break
                case 'Misskey': // Misskey
                    html += '<img src="resources/ic_misskey.png" class="instance_icon"/>'
                    break
                default:
                    break
            }
            jqelm.find(".user").append(html)
            target_li.replaceWith(jqelm)

            // 外部インスタンスのユーザーはカスタム絵文字を現地から非同期取得
            if (user.platform == 'Misskey') Emojis.replaceDomAsync(target_li.find(".username"), user.host)
        }).catch(err => { // リモートの対象外プラットフォームは警告表示
            target_li.find(".user").append('<img src="resources/ic_warn.png" class="instance_icon"/>')
            target_li.closest("li").removeClass("ignored_user")
        })
    }

    /**
     * #Method #Ajax #jQuery
     * このユーザーの投稿一覧を取得する
     * 
     * @param account リモートホストの情報を入れた最小限のアカウントオブジェクト
     * @param type 取得するタイムラインのタイプ
     * @param max_id 前のページの最後の投稿のページングID
     */
    async getPost(account, type, max_id) {
        let response = null
        let query_param = null
        try {
            switch (this.platform) {
                case 'Mastodon': // Mastodon
                    query_param = {
                        "limit": 40,
                        "only_media": type == 'media',
                        "exclude_replies": true
                    }
                    if (max_id) query_param.max_id = max_id // ページ送りの場合はID指定
                    // あればアクセストークンを設定
                    let header = {}
                    if (this.authorized) header = { "Authorization": `Bearer ${this.authorized.pref.access_token}` }
                    response = await $.ajax({
                        type: "GET",
                        url: `https://${this.host}/api/v1/accounts/${this.id}/statuses`,
                        dataType: "json",
                        headers: header,
                        data: query_param
                    })
                    break
                case 'Misskey': // Misskey
                    query_param = {
                        "userId": this.id,
                        "includeReplies": false,
                        "limit": 40,
                        "withFiles": type == 'media',
                        "withChannelNotes": type == 'channel',
                        "includeMyRenotes": false
                    }
                    if (max_id) query_param.untilId = max_id // ページ送りの場合はID指定
                    if (this.authorized) query_param.i = this.authorized.pref.access_token
                    response = await $.ajax({
                        type: "POST",
                        url: `https://${this.host}/api/users/notes`,
                        dataType: "json",
                        headers: { "Content-Type": "application/json" },
                        data: JSON.stringify(query_param)
                    })
                    break
                default:
                    break
            }

            const posts = []
            response.forEach(p => posts.push(new Status(p, User.USER_MAIN_TIMELINE, account)))
            return posts
        } catch (err) { // 取得失敗時、取得失敗のtoastを表示してrejectしたまま次に処理を渡す
            console.log(err)
            Notification.error(`${this.full_address}の投稿の取得に失敗しました.`)
            return Promise.reject(err)
        }
    }

    /**
     * #Method #Ajax #jQuery
     * このユーザーのピンどめされた投稿一覧を取得する
     * 
     * @param account リモートホストの情報を入れた最小限のアカウントオブジェクト
     */
    async getPinnedPost(account) {
        let response = null
        try {
            let posts = []
            switch (this.platform) {
                case 'Mastodon': // Mastodon
                    let header = {}
                    if (this.authorized) header = { "Authorization": `Bearer ${this.authorized.pref.access_token}` }
                    response = await $.ajax({
                        type: "GET",
                        url: `https://${this.host}/api/v1/accounts/${this.id}/statuses`,
                        dataType: "json",
                        headers: header,
                        data: { "pinned": true }
                    })
                    response.forEach(p => posts.push(new Status(p, User.DETAIL_TIMELINE, account)))
                    break
                case 'Misskey': // Misskey
                    // 既に入ってるピンどめ投稿を整形
                    this.pinneds.forEach(p => posts.push(new Status(p, User.DETAIL_TIMELINE, account)))
                    break
                default:
                    break
            }
            return posts
        } catch (err) { // 取得失敗時、取得失敗のtoastを表示してrejectしたまま次に処理を渡す
            console.log(err)
            Notification.info(`${this.full_address}の投稿の取得に失敗しました.`)
            return Promise.reject(err)
        }
    }

    /**
     * #Method
     * このユーザーのお気に入り/ブックマーク/リアクション履歴一覧を取得する
     * 
     * @param type お気に入り/ブックマーク/リアクションか指定
     * @param max_id 前のページの最後の投稿のページングID
     * @param tl バインド対象のタイムラインオブジェクト
     */
    async getBookmarks(type, max_id, tl) {
        let response = null
        let query_param = null
        try {
            switch (type) {
                case 'Favorite_Mastodon': // お気に入り(Mastodon)
                    query_param = { "limit": 40 }
                    if (max_id) query_param.max_id = max_id // ページ送りの場合はID指定
                    response = await ajax({ // response Headerが必要なのでfetchを使うメソッドを呼ぶ
                        method: "GET",
                        url: `https://${this.host}/api/v1/favourites`,
                        headers: { "Authorization": `Bearer ${this.authorized.pref.access_token}` },
                        data: query_param
                    })
                    response = {
                        body: response.body,
                        link: response.headers.get("link")
                    }
                    break
                case 'Favorite_Misskey': // お気に入り(Misskey)
                    query_param = {
                        "i": this.authorized.pref.access_token,
                        "limit": 40
                    }
                    if (max_id) query_param.untilId = max_id // ページ送りの場合はID指定
                    response = await $.ajax({
                        type: "POST",
                        url: `https://${this.host}/api/i/favorites`,
                        dataType: "json",
                        headers: { "Content-Type": "application/json" },
                        data: JSON.stringify(query_param)
                    })
                    response = { body: response }
                    break
                case 'Bookmark': // ブックマーク(Mastodon)
                    query_param = { "limit": 40 }
                    if (max_id) query_param.max_id = max_id // ページ送りの場合はID指定
                    response = await ajax({ // response Headerが必要なのでfetchを使うメソッドを呼ぶ
                        method: "GET",
                        url: `https://${this.host}/api/v1/bookmarks`,
                        headers: { "Authorization": `Bearer ${this.authorized.pref.access_token}` },
                        data: query_param
                    })
                    response = {
                        body: response.body,
                        link: response.headers.get("link")
                    }
                    break
                case 'Reaction': // リアクション(Misskey)
                    query_param = {
                        "i": this.authorized.pref.access_token,
                        "userId": this.id,
                        "limit": 40
                    }
                    if (max_id) query_param.untilId = max_id // ページ送りの場合はID指定
                    response = await $.ajax({
                        type: "POST",
                        url: `https://${this.host}/api/users/reactions`,
                        dataType: "json",
                        headers: { "Content-Type": "application/json" },
                        data: JSON.stringify(query_param)
                    })
                    response = { body: response }
                    break
                default:
                    break
            }
            // 残りのデータがない場合はreject
            if (response.body.length == 0) throw new Error('empty')

            const posts = []
            response.body.forEach(p => posts.push(new Status(p.note ?? p, tl ?? User.DETAIL_TIMELINE, this.authorized)))
            let next_id = null
            // Headerのlinkからページング処理のnext_idを抽出
            if (response.link) next_id = response.link.match(/max_id=(?<id>[0-9]+)>/)?.groups.id
            else next_id = response.body.pop()?.id // 特殊ページング以外は普通に投稿IDをnext_idとする
            return {
                datas: posts,
                max_id: next_id
            }
        } catch (err) { // 取得失敗時、取得失敗のtoastを表示してrejectしたまま次に処理を渡す
            if (err.message == 'empty') { // もうデータがない場合は専用メッセージを出す
                Notification.info("これ以上データがありません.")
                return Promise.reject(err)
            }
            console.log(err)
            Notification.error('取得に失敗しました.')
            return Promise.reject(err)
        }
    }

    /**
     * #Method
     * このユーザーのフォロー/フォロワー一覧を取得する
     * 
     * @param type フォローかフォロワーか指定
     * @param max_id 前のページの最後のユーザーのページングID
     */
    async getFFUsers(type, max_id) {
        const platform = this.authorized?.platform ?? this.platform
        let api_url = null
        let query_param = null
        let response = null
        try {
            let users = []
            switch (platform) {
                case 'Mastodon': // Mastodon
                    if (type == 'follows') api_url = `https://${this.host}/api/v1/accounts/${this.id}/following`
                    else if (type == 'followers') api_url = `https://${this.host}/api/v1/accounts/${this.id}/followers`
                    query_param = { "limit": 80 }
                    if (max_id) query_param.max_id = max_id // ページ送りの場合はID指定
                    // あればアクセストークンを設定
                    let header = {}
                    if (this.authorized) header = { "Authorization": `Bearer ${this.authorized.pref.access_token}` }
                    response = await ajax({ // response Headerが必要なのでfetchを使うメソッドを呼ぶ
                        method: "GET",
                        url: api_url,
                        headers: header,
                        data: query_param
                    })
                    response.body.forEach(u => users.push(new User({
                        json: u,
                        host: this.host,
                        remote: false,
                        auth: false,
                        platform: platform
                    })))
                    response = {
                        body: users,
                        link: response.headers.get("link")
                    }
                    break
                case 'Misskey': // Misskey
                    if (type == 'follows') api_url = `https://${this.host}/api/users/following`
                    else if (type == 'followers') api_url = `https://${this.host}/api/users/followers`
                    query_param = {
                        "userId": this.id,
                        "limit": 80
                    }
                    if (max_id) query_param.untilId = max_id // ページ送りの場合はID指定
                    if (this.authorized) query_param.i = this.authorized.pref.access_token
                    response = await $.ajax({
                        type: "POST",
                        url: api_url,
                        dataType: "json",
                        headers: { "Content-Type": "application/json" },
                        data: JSON.stringify(query_param)
                    })
                    response.forEach(u => users.push(new User({
                        json: u.followee ?? u.follower,
                        host: this.host,
                        remote: false,
                        auth: false,
                        platform: platform
                    })))
                    response = { body: users }
                    break
                default:
                    break
            }
            let next_id = null
            // Headerのlinkからページング処理のnext_idを抽出
            if (response.link) next_id = response.link.match(/max_id=(?<id>[0-9]+)>/)?.groups.id
            else next_id = response.body[response.body.length - 1]?.id // 特殊ページング以外は普通に投稿IDをnext_idとする
            return {
                datas: response.body,
                max_id: next_id
            }
        } catch (err) { // 取得失敗時、取得失敗のtoastを表示してrejectしたまま次に処理を渡す
            console.log(err)
            Notification.error(`${this.full_address}のFFの取得に失敗しました.`)
            return Promise.reject(err)
        }
    }

    /**
     * #Method
     * このユーザーの所属するインスタンスを取得する.
     */
    async getInstance() {
        try {
            return await Instance.getDetail(this.host, this.platform)
        } catch (err) {
            return Promise.reject('unsupported')
        }
    }

    /**
     * #Method
     * このユーザーオブジェクトのユニークIDを対象のプロフィールDOMに付与する.
     * (アカウントプロフィール一覧で使用)
     */
    addProfileUniqueId() {
        $(`.account_timeline.allaccount_user>.accounts_box>.column_profile[name="${this.full_address}"]`)
            .attr('id', `user_${this.user_uuid}`)
    }

    /**
     * #Method
     * このユーザーの詳細情報を表示するウィンドウのDOMを生成して表示する.
     * v0.5.1以前と違いひとつひとつ独立したウィンドウとして生成.
     */
    createDetailWindow() {
        // 一意認識用のUUIDを生成
        const window_key = `user_window_${this.user_uuid}`

        createWindow({ // ウィンドウを生成
            window_key: window_key,
            html: `
                <div id="${window_key}" class="account_timeline single_user ex_window">
                    <h2><span>${this.full_address}</span></h2>
                    <div class="window_buttons">
                        <input type="checkbox" class="__window_opacity" id="__window_opacity_${this.user_uuid}"/>
                        <label for="__window_opacity_${this.user_uuid}" class="window_opacity_button" title="透過"><img
                            src="resources/ic_alpha.png" alt="透過"/></label>
                        <button type="button" class="window_close_button" title="閉じる"><img
                            src="resources/ic_not.png" alt="閉じる"/></button>
                    </div>
                    ${User.createDetailHtml(this.full_address)}
                </div>
            `,
            color: getHashColor(this.full_address),
            resizable: true,
            drag_axis: "x",
            resize_axis: "e, w"
        })

        // キーを設定してバインド処理を実行
        $(`#${window_key}>.column_profile[name="${this.full_address}"]`).attr('id', this.user_key)
        this.bindDetail()
    }

    /**
     * #Method
     * このユーザーの詳細情報を生成済みのHTMLテンプレートにバインドする.
     */
    async bindDetail() {
        // キャッシュマップに保存
        User.USER_CACHE_MAP.set(this.user_key, this)
        const target_elm = $(`#${this.user_key}[name="${this.full_address}"]`)
        // ヘッダとプロフィール詳細を表示
        target_elm.find(".profile_header").html(this.header_element)
        target_elm.find(".profile_detail").html(this.profile_element)
        // 認証プロフィール一覧表示時にはブックマークブロックも追加すてヘッダサイズを変える
        if (this.all_account_flg) target_elm.append(`
            <div class="user_bookmark_elm">
                <ul class="bookmarks __context_posts"></ul>
            </div>
        `)

        // ヘッダ部分にツールチップを生成
        target_elm.find(".detail_info").tooltip(Preference.getUIPref("DROP", "UI_FADE_ANIMATION"))
        if (this.platform == 'Misskey') { // Misskeyの場合非同期絵文字置換を実行
            Emojis.replaceDomAsync(target_elm.find(".profile_header .username"), this.host) // ユーザー名
            Emojis.replaceDomAsync(target_elm.find(".profile_detail .main_content"), this.host) // プロフィール文
        } else target_elm.find(".__tab_profile_channels").remove() // Mastodonはチャンネルを削除


        try { // ピンどめ投稿と通常投稿を取得
            const account = { // accountには最低限の情報だけ入れる
                "platform": this.platform,
                "pref": { "domain": this.host }
            }
            const response = await Promise.all([this.getPost(account, "post", null), this.getPinnedPost(account)])
            target_elm.find(".col_loading").remove()

            // 最新投稿データはスクロールローダーを生成
            createScrollLoader({
                data: response[0],
                target: target_elm.find(".posts"),
                bind: (data, target) => {
                    data.forEach(p => {
                        target.append(p.element)
                        p.bindAdditionalInfoAsync(target)
                    })
                    if (this.platform == 'Misskey') { // Misskeyの場合非同期絵文字置換を実行
                        Emojis.replaceDomAsync(target.find(".username"), this.host) // ユーザー名
                        Emojis.replaceDomAsync(target.find(".label_cw"), this.host) // CWテキスト
                        Emojis.replaceDomAsync(target.find(".main_content"), this.host) // 本文
                        Emojis.replaceDomAsync(target.find(".reaction_section"), this.host) // リアクション
                    }
                    // max_idとして取得データの最終IDを指定
                    return data.pop()?.id
                },
                load: async max_id => this.getPost(account, "post", max_id)
            })
            { // ピンどめ投稿を展開
                const exist_pinned = response[1].length > 0
                if (exist_pinned) response[1].forEach(p => target_elm.find(".pinned_post").append(p.element))
                User.setHeight(target_elm, exist_pinned) // 高さを設定
            }

            // ピンどめ投稿と通常投稿の絵文字を取得
            if (this.platform == 'Misskey') { // Misskeyの場合非同期絵文字置換を実行
                Emojis.replaceDomAsync(target_elm.find(".post_uls .username"), this.host) // ユーザー名
                Emojis.replaceDomAsync(target_elm.find(".post_uls .label_cw"), this.host) // CWテキスト
                Emojis.replaceDomAsync(target_elm.find(".post_uls .main_content"), this.host) // 本文
                Emojis.replaceDomAsync(target_elm.find(".post_uls .reaction_section"), this.host) // リアクション
            }
        } catch (err) {
            console.log(err)
            Notification.error(`${this.full_address}のプロフィールの表示に失敗しました.`)
        }
    }

    /**
     * #StaticMethod
     * 対象のユーザー詳細情報の各レイアウトの高さを調整する.
     * 
     * @param target_elm 調整対象のjQueryオブジェクト
     * @param exist_pinned ピン留め投稿が存在する場合はtrue
     */
    static setHeight(target_elm, exist_pinned) {
        const detail_height = target_elm.find("ul.profile_detail").outerHeight()
        const pinned_height = exist_pinned ? target_elm.find("ul.pinned_post").outerHeight() : 0
        // ピンどめ投稿がない場合はピン留めブロックを削除
        if (!exist_pinned) target_elm.find(".pinned_block").remove()

        // ブロックの高さを計算
        target_elm.find("ul.posts").css('height', `calc(100vh - ${320 + detail_height + pinned_height}px)`)
        target_elm.find("ul.channel_post").css('height', `calc(100vh - ${320 + detail_height}px)`)
        target_elm.find("ul.media_post").css('height', `calc(100vh - ${320 + detail_height}px)`)
        target_elm.find("ul.bookmarks").css('height', `calc(100vh - ${290 + detail_height}px)`)
        target_elm.find("ul.ff_nametags").css('height', `calc(100vh - ${290 + detail_height}px)`)
    }

    /**
     * #Method
     * このユーザーのお気に入り/ブックマーク/リアクション履歴を取得して表示する
     * 
     * @param type お気に入り/ブックマーク/リアクションのどれかを指定
     */
    async createBookmarkList(type) {
        const target_td = $(`#user_${this.user_uuid}[name="${this.full_address}"]`)
        target_td.prepend(`
            <div class="col_loading">
                <img src="resources/illust/ani_wait.png" alt="Now Loading..."/><br/>
                <span class="loading_text">Now Loading...</span>
            </div>
        `)
        target_td.find(".user_post_elm").hide()
        target_td.find(".user_ff_elm").hide()
        target_td.find(".user_bookmark_elm>ul.bookmarks").empty()
        target_td.find(".user_bookmark_elm").show()

        // ブックマークデータを取得してローダーを生成
        const response = await this.getBookmarks(type, null)
        target_td.find(".col_loading").remove()
        createScrollLoader({ // スクロールローダーを生成
            data: response,
            target: target_td.find(".user_bookmark_elm>.bookmarks"),
            bind: (data, target) => {
                data.datas.forEach(post => target.append(post.element))
                // Headerを経由して取得されたmax_idを返却
                return data?.max_id
            },
            load: async max_id => this.getBookmarks(type, max_id)
        })
    }

    /**
     * #Method
     * このユーザーのフォロー/フォロワーの一覧を表示するリストを生成する
     * 
     * @param type フォローを取得するかフォロワーを取得するか指定
     */
    async createFFTaglist(type) {
        const target_td = $(`#user_${this.user_uuid}[name="${this.full_address}"]`)
        target_td.prepend(`
            <div class="col_loading">
                <img src="resources/illust/ani_wait.png" alt="Now Loading..."/><br/>
                <span class="loading_text">Now Loading...</span>
            </div>
        `)
        target_td.find(".user_post_elm").hide()
        target_td.find(".user_bookmark_elm").hide()
        target_td.find(".user_ff_elm>ul.ff_nametags").empty()
        target_td.find(".user_ff_elm").show()

        // ユーザーデータを取得してローダーを生成
        const response = await this.getFFUsers(type, null)
        target_td.find(".col_loading").remove()
        createScrollLoader({ // スクロールローダーを生成
            data: response,
            target: target_td.find(".user_ff_elm>.ff_nametags"),
            bind: (data, target) => {
                data.datas.forEach(u => {
                    target.append(u.inline_nametag)
                    u.bindRemoteNametagAsync(target)
                })
                // Headerを経由して取得されたmax_idを返却
                return data?.max_id
            },
            load: async max_id => this.getFFUsers(type, max_id)
        })
    }

    /**
     * #Method
     * このユーザーのメディア投稿一覧を取得して表示する.
     */
    async createMediaGallery() {
        const target_td = $(`#user_${this.user_uuid}[name="${this.full_address}"]`)
        target_td.prepend(`
            <div class="col_loading">
                <img src="resources/illust/ani_wait.png" alt="Now Loading..."/><br/>
                <span class="loading_text">Now Loading...</span>
            </div>
        `)

        const account = { // accountには最低限の情報だけ入れる
            "platform": this.platform,
            "pref": { "domain": this.host }
        }
        // メディア投稿データを取得してローダーを生成
        const response = await this.getPost(account, "media", null)
        target_td.find(".col_loading").remove()
        createScrollLoader({ // スクロールローダーを生成
            data: response,
            target: target_td.find(".media_post"),
            bind: (data, target) => {
                data.forEach(p => target.append(p.gallery_elm))
                // max_idとして取得データの最終IDを指定
                return data.pop()?.id
            },
            load: async max_id => this.getPost(account, "media", max_id)
        })
    }

    /**
     * #Method
     * このユーザーのチャンネル投稿一覧を取得して表示する.
     */
    async createChannelPosts() {
        const target_td = $(`#user_${this.user_uuid}[name="${this.full_address}"]`)
        target_td.prepend(`
            <div class="col_loading">
                <img src="resources/illust/ani_wait.png" alt="Now Loading..."/><br/>
                <span class="loading_text">Now Loading...</span>
            </div>
        `)

        const account = { // accountには最低限の情報だけ入れる
            "platform": this.platform,
            "pref": { "domain": this.host }
        }
        // メディア投稿データを取得してローダーを生成
        const response = await this.getPost(account, "channel", null)
        target_td.find(".col_loading").remove()
        createScrollLoader({ // スクロールローダーを生成
            data: response,
            target: target_td.find(".channel_post"),
            bind: (data, target) => {
                data.filter(f => f.channel_id).forEach(p => target.append(p.element))
                Emojis.replaceDomAsync(target.find(".username"), this.host) // ユーザー名
                Emojis.replaceDomAsync(target.find(".label_cw"), this.host) // CWテキスト
                Emojis.replaceDomAsync(target.find(".main_content"), this.host) // 本文
                Emojis.replaceDomAsync(target.find(".reaction_section"), this.host) // リアクション
                // max_idとして取得データの最終IDを指定
                return data.pop()?.id
            },
            load: async max_id => this.getPost(account, "channel", max_id)
        })
    }

    /**
     * #Method
     * このユーザーのブックマークタイムラインを生成.
     * マルチウィンドウとして展開する
     *
     * @param arg パラメータオブジェクト
     */
    createBookmarkWindow(arg) {
        // ブックマーク用のタイムラインオブジェクトを生成
        const bookmark_tl = new Timeline({
            "host": this.host,
            "color": this.authorized?.pref.acc_color,
            "expand_cw": arg.expand_cw,
            "expand_media": arg.expand_media,
        }, new Group({ "tl_layout": arg.layout }, null))

        // タイムラインオブジェクトからウィンドウとローダーを生成
        bookmark_tl.createScrollableWindow(null, (tl, ref_id, window_key) => this.getBookmarks(arg.type, ref_id, tl).then(body => {
            // ロード画面を削除
            $(`#${window_key}>.timeline>.col_loading`).remove()
            createScrollLoader({ // スクロールローダーを生成
                data: body,
                target: $(`#${window_key}>.timeline>ul`),
                bind: (data, target) => { // ステータスマップに挿入して投稿をバインド
                    data.datas.forEach(p => tl.ref_group.addStatus({
                        post: p,
                        target_elm: target,
                        callback: (st, tgelm) => {
                            tgelm.append(st.timeline_element)
                            st.bindAdditionalInfoAsync(tgelm)
                        }
                    }))
                    // Headerを経由して取得されたmax_idを返却
                    return data?.max_id
                },
                load: async max_id => this.getBookmarks(arg.type, max_id, tl)
            })
        }))
    }
}

