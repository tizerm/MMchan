﻿/**
 * #Class
 * アカウント情報を管理するクラス
 *
 * @autor tizerm@mofu.kemo.no
 */
class Account {
    // コンストラクタ: 設定ファイルにあるアカウント設定値を使って初期化
    constructor(pref) {
        this.pref = pref
        this.index = pref.index
        this.full_address = `@${pref.user_id}@${pref.domain}`
        this.socket_prefs = []
        this.socket = null
        this.reconnect = false
        this.emoji_cache = null
    }

    // Getter: プラットフォーム
    get platform() { return this.pref.platform }
    // Getter: WebSocket接続URL
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
    // Getter: 絵文字キャッシュ
    get emojis() { return Emojis.get(this.pref.domain) }

    // スタティックマップを初期化(非同期)
    static {
        (async () => {
            const accounts = await window.accessApi.readPrefAccs()
            const acc_map = new Map()
            const keys = []
            let index = 0
            accounts?.forEach((v, k) => {
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
     * アカウントプロパティを取得
     * 
     * @param arg 数値かアカウントのフルアドレス
     */
    static get(arg) {
        // 数値型だった場合インデクスとして番号からプロパティを取得
        if (typeof arg == 'number') return Account.map.get(Account.keys[arg])
        // オブジェクトだった場合文字列として取得
        else return Account.map.get(arg)
    }

    /**
     * #StaticMethod
     * アカウントプロパティを走査
     * 
     * @param callback 要素ごとに実行するコールバック関数
     */
    static each(callback) {
        Account.map.forEach((v, k) => callback(v))
    }

    static eachPlatform(platform, callback) {
        let nothing = true
        Account.map.forEach((v, k) => {
            if (v.platform == platform) {
                nothing = false
                callback(v)
            }
        })
        return nothing
    }

    /**
     * #Method
     * このアカウントを投稿先アカウントに設定
     */
    setPostAccount() {
        $("#header>#head_postarea .__lnk_postuser>img").attr('src', this.pref.avatar_url)
        $("#header>#head_postarea .__lnk_postuser>img").attr('name', this.full_address)
        $("#header>h1").text(`${this.pref.username} - ${this.full_address}`)
        $("#header>h1").css("background-color", `#${this.pref.acc_color}`)
    }

    /**
     * #Method #Ajax #jQuery
     * このアカウントから投稿処理を実行
     * 
     * @param arg パラメータ
     */
    async post(arg) {
        // 何も書いてなかったら何もしない
        if (!arg.content) return
        let visibility = null
        let request_param = null
        let request_promise = null
        // 先にtoast表示
        const toast_uuid = crypto.randomUUID()
        toast("投稿中です...", "progress", toast_uuid)
        switch (this.pref.platform) {
            case 'Mastodon': // Mastodon
                // 公開範囲を取得
                switch (arg.visibility_id) {
                    case 'visibility_public': // 公開
                        visibility = "public"
                        break
                    case 'visibility_unlisted': // ホーム
                        visibility = "unlisted"
                        break
                    case 'visibility_followers': // フォロ限
                        visibility = "private"
                        break
                    case 'visibility_direct': // DM
                        visibility = "direct"
                        break
                    default: // リプライから来た場合はリプライ先の値が既に入っている
                        visibility = arg.visibility_id
                        break
                }
                request_param = {
                    "status": arg.content,
                    "visibility": visibility
                }
                // CWがある場合はCWテキストも追加
                if (arg.cw_text) request_param.spoiler_text = arg.cw_text
                // リプライの場合はリプライ先ツートIDを設定
                if (arg.reply_id) request_param.in_reply_to_id = arg.reply_id
                request_promise = $.ajax({ // APIに投稿を投げて、正常に終了したら最終投稿に設定
                    type: "POST",
                    url: `https://${this.pref.domain}/api/v1/statuses`,
                    dataType: "json",
                    headers: {
                        "Authorization": `Bearer ${this.pref.access_token}`,
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                    },
                    data: request_param
                }).then(data => new Status(data, null, this).pushStack())
                break
            case 'Misskey': // Misskey
                // 公開範囲を取得
                switch (arg.visibility_id) {
                    case 'visibility_public': // 公開
                        visibility = "public"
                        break
                    case 'visibility_unlisted': // ホーム
                        visibility = "home"
                        break
                    case 'visibility_followers': // フォロ限
                        visibility = "followers"
                        break
                    case 'visibility_direct': // DM
                        visibility = "specified"
                        break
                    default: // リプライから来た場合はリプライ先の値が既に入っている
                        visibility = arg.visibility_id
                        break
                }
                request_param = {
                    "i": this.pref.access_token,
                    "text": arg.content,
                    "visibility": visibility
                }
                // CWがある場合はCWテキストも追加
                if (arg.cw_text) request_param.cw = arg.cw_text
                // リプライの場合はリプライ先ツートIDを設定
                if (arg.reply_id) request_param.replyId = arg.reply_id
                request_promise = $.ajax({ // APIに投稿を投げて、正常に終了したら最終投稿に設定
                    type: "POST",
                    url: `https://${this.pref.domain}/api/notes/create`,
                    dataType: "json",
                    headers: { "Content-Type": "application/json" },
                    data: JSON.stringify(request_param)
                }).then(data => new Status(data.createdNote, null, this).pushStack())
                break
            default:
                break
        }
        request_promise.then(data => {
            // 投稿成功時(コールバック関数実行)
            arg.success()
            toast("投稿しました.", "done", toast_uuid)
        }).catch((jqXHR, textStatus, errorThrown) => toast("投稿に失敗しました.", "error", toast_uuid))
    }

    /**
     * #Method #Ajax #jQuery
     * このアカウントからブースト/リノート/お気に入り処理を実行
     * 
     * @param arg パラメータ
     */
    async reaction(arg) {
        let request_promise = null
        let target_json = null
        const toast_uuid = crypto.randomUUID()
        toast("対象の投稿を取得中です...", "progress", toast_uuid)
        // ターゲットの投稿データを取得
        switch (this.platform) {
            case 'Mastodon': // Mastodon
                request_promise = $.ajax({ // 検索から投稿を取得
                    type: "GET",
                    url: `https://${this.pref.domain}/api/v2/search`,
                    dataType: "json",
                    headers: { "Authorization": `Bearer ${this.pref.access_token}` },
                    data: {
                        "q": arg.target_url,
                        "type": "statuses",
                        "resolve": true
                    }
                }).then(data => { return data.statuses[0] }).catch((jqXHR, textStatus, errorThrown) => {
                    // 取得失敗時
                    toast("投稿の取得でエラーが発生しました.", "error", toast_uuid)
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
                }).then(data => { return data.object }).catch((jqXHR, textStatus, errorThrown) => {
                    // 取得失敗時
                    toast("投稿の取得でエラーが発生しました.", "error", toast_uuid)
                })
                break
            default:
                break
        }
        // データが取得されるのを待ってtarget_jsonに代入
        target_json = await request_promise
        // 投稿を取得できなかったらなにもしない
        if (!target_json) return
        // 取得できた場合はtarget_jsonからStatusインスタンスを生成
        const target_post = new Status(target_json, null, this)
        switch (this.platform) {
            case 'Mastodon': // Mastodon
                switch (arg.target_mode) {
                    case '__menu_reply': // リプライ
                        target_post.createReplyWindow()
                        toast(null, "hide", toast_uuid)
                        break
                    case '__menu_reblog': // ブースト
                        $.ajax({
                            type: "POST",
                            url: `https://${this.pref.domain}/api/v1/statuses/${target_post.id}/reblog`,
                            dataType: "json",
                            headers: { "Authorization": `Bearer ${this.pref.access_token}` }
                        }).then(data => toast("投稿をブーストしました.", "done", toast_uuid)).catch(
                            (jqXHR, textStatus, errorThrown) => toast("ブーストに失敗しました.", "error", toast_uuid))
                        break
                    case '__menu_favorite': // お気に入り
                        $.ajax({
                            type: "POST",
                            url: `https://${this.pref.domain}/api/v1/statuses/${target_post.id}/favourite`,
                            dataType: "json",
                            headers: { "Authorization": `Bearer ${this.pref.access_token}` }
                        }).then(data => toast("投稿をお気に入りしました.", "done", toast_uuid)).catch(
                            (jqXHR, textStatus, errorThrown) => toast("お気に入りに失敗しました.", "error", toast_uuid))
                        break
                    case '__menu_bookmark': // ブックマーク
                        $.ajax({
                            type: "POST",
                            url: `https://${this.pref.domain}/api/v1/statuses/${target_post.id}/bookmark`,
                            dataType: "json",
                            headers: { "Authorization": `Bearer ${this.pref.access_token}` }
                        }).then(data => toast("投稿をブックマークしました.", "done", toast_uuid)).catch(
                            (jqXHR, textStatus, errorThrown) => toast("ブックマークに失敗しました.", "error", toast_uuid))
                        break
                    default:
                        break
                }
                break
            case 'Misskey': // Misskey
                switch (arg.target_mode) {
                    case '__menu_reply': // リプライ
                        target_post.createReplyWindow()
                        toast(null, "hide", toast_uuid)
                        break
                    case '__menu_reblog': // リノート
                        $.ajax({
                            type: "POST",
                            url: `https://${this.pref.domain}/api/notes/create`,
                            dataType: "json",
                            headers: { "Content-Type": "application/json" },
                            data: JSON.stringify({
                                "i": this.pref.access_token,
                                "renoteId": target_post.id
                            })
                        }).then(data => toast("投稿をリノートしました.", "done", toast_uuid)).catch(
                            (jqXHR, textStatus, errorThrown) => toast("リノートに失敗しました.", "error", toast_uuid))
                        break
                    case '__menu_favorite': // お気に入り
                        $.ajax({
                            type: "POST",
                            url: `https://${this.pref.domain}/api/notes/favorites/create`,
                            dataType: "json",
                            headers: { "Content-Type": "application/json" },
                            data: JSON.stringify({
                                "i": this.pref.access_token,
                                "noteId": target_post.id
                            })
                        }).then(data => toast("投稿をお気に入りしました.", "done", toast_uuid)).catch(
                            (jqXHR, textStatus, errorThrown) => toast("お気に入りに失敗しました.", "error", toast_uuid))
                        break
                    case '__menu_reaction': // リアクション
                        target_post.createReactionWindow()
                        toast(null, "hide", toast_uuid)
                        break
                    default:
                        break
                }
                break
            default:
                break
        }
    }

    async sendReaction(arg) {
        const toast_uuid = crypto.randomUUID()
        toast("リアクションを送信しています...", "progress", toast_uuid)
        $.ajax({
            type: "POST",
            url: `https://${this.pref.domain}/api/notes/reactions/create`,
            dataType: "json",
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify({
                "i": this.pref.access_token,
                "noteId": arg.id,
                "reaction": arg.shortcode
            })
        }).then(data => {
            // 投稿成功時(コールバック関数実行)
            arg.success()
            toast("リアクションを送信しました.", "done", toast_uuid)
        }).catch((jqXHR, textStatus, errorThrown) => toast("リアクションに失敗しました.", "error", toast_uuid))
    }

    /**
     * #Method #WebSocket
     * このアカウントにWebSocketの設定を追加する
     * 
     * @param arg パラメータ
     */
    addSocketPref(arg) {
        this.socket_prefs.push(arg)
    }

    /**
     * #Method #WebSocket
     * このアカウントからWebSocket接続処理を実行
     * 
     * @param arg パラメータ
     */
    async connect(arg) {
        // WebSocket接続を開始
        this.socket = new WebSocket(this.socket_url)
        this.reconnect = arg.reconnect

        // WebSocket接続開始時処理
        this.socket.addEventListener("open", (event) => {
            // 接続開始用コールバック関数を実行
            arg.openFunc()
            // ソケットに受信設定を送信
            this.socket_prefs.forEach(p => this.socket.send(p.send_param))
        })
        // エラーハンドラ
        this.socket.addEventListener("error", (event) => {
            toast(`${this.full_address}で接続エラーが発生しました、再接続してください。`, "error")
            // エラーで切れた場合は再接続しない
            this.reconnect = false
            console.log(event)
        })
        // WebSocket接続停止時処理
        this.socket.addEventListener("close", (event) => {
            // 接続停止用コールバック関数を実行
            arg.closeFunc()
            // 自身を呼び出して再接続
            if (this.reconnect) this.connect(arg)
            console.log(event)
        })
        // 受信処理を設定
        this.socket_prefs.forEach(p => this.socket.addEventListener("message", p.messageFunc))
    }

    static async cacheEmojis() {
        { // キャッシュが取れていないアカウントがある場合は自動的にキャッシュを取得
            let cache_flg = true
            for (const elm of Account.map) {
                if (!elm[1].emojis) {
                    cache_flg = false
                    break
                }
            }
            if (cache_flg) return // キャッシュが取れてる場合はなにもしない
        }
        const toast_uuid = crypto.randomUUID()
        toast("カスタム絵文字がキャッシュされていないアカウントがあります。キャッシュを更新します...",
            "progress", toast_uuid)
        // サーバーのカスタム絵文字一覧を取得してファイルに書き込む
        const write_promises = []
        Account.map.forEach((v, k) => write_promises.push(
            v.getCustomEmojis().then(data => { return window.accessApi.writeCustomEmojis(data) })))
        // すべて書き込み終わったら通知toastを出してキャッシュを更新
        Promise.all(write_promises).then(() => {
            toast("カスタム絵文字のキャッシュが完了しました.", "done", toast_uuid)
            Emojis.readCache()
        })
    }

    getCustomEmojis() {
        let rest_promise = null
        switch (this.pref.platform) {
            case 'Mastodon': // Mastodon
                // カスタム絵文字を取得して整形するプロセスをpromiseとして返却
                rest_promise = $.ajax({
                    type: "GET",
                    url: `https://${this.pref.domain}/api/v1/custom_emojis`,
                    dataType: "json"
                }).then(data => {
                    return (async () => {
                        // 絵文字一覧データをメインプロセスにわたす形に整形する
                        const emojis = []
                        data.forEach(e => emojis.push({
                            "name": e.shortcode,
                            "shortcode": `:${e.shortcode}:`,
                            "url": e.url
                        }))
                        return {
                            "host": this.pref.domain,
                            "emojis": emojis
                        }
                    })()
                })
                break
            case 'Misskey': // Misskey
                // カスタム絵文字を取得して整形するプロセスをpromiseとして返却
                rest_promise = $.ajax({
                    type: "POST",
                    url: `https://${this.pref.domain}/api/emojis`,
                    dataType: "json",
                    headers: { "Content-Type": "application/json" },
                    data: JSON.stringify({ })
                }).then(data => {
                    return (async () => {
                        // 絵文字一覧データをメインプロセスにわたす形に整形する
                        const emojis = []
                        data.emojis.forEach(e => emojis.push({
                            "name": e.aliases[0],
                            "shortcode": `:${e.name}:`,
                            "url": e.url
                        }))
                        return {
                            "host": this.pref.domain,
                            "emojis": emojis
                        }
                    })()
                })
                break
            default:
                break
        }
        // Promiseを返却(実質非同期)
        return rest_promise
    }

    unauthorize(callback) {
        switch (this.pref.platform) {
            case 'Mastodon': // Mastodon
                // 認証解除プロセスに成功したらコールバック関数を実行
                $.ajax({
                    type: "POST",
                    url: `https://${this.pref.domain}/oauth/revoke`,
                    dataType: "json",
                    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
                    data: {
                        "client_id": this.pref.client_id,
                        "client_secret": this.pref.client_secret,
                        "token": this.pref.access_token
                    }
                }).then(callback)
                break
            case 'Misskey': // Misskey
                // 認証解除APIがないのでそのままコールバックを実行
                callback()
                break
            default:
                break
        }
    }

    createEmojiList() {
        $("#header>#pop_custom_emoji").html(`
            <div class="emoji_head">
                <h2>カスタム絵文字一覧</h2>
                <h3>${this.pref.domain}</h3>
            </div>
            <div class="emoji_list">
            </div>
            <button type="button" id="__on_emoji_close">×</button>
        `).show("slide", { direction: "left" }, 150)
        $("#header>#pop_custom_emoji>.emoji_head").css("background-color", `#${this.pref.acc_color}`)

        // 一度枠組みを表示してから非同期で絵文字一覧を動的に表示してく
        ;(async () => this.emojis.each(emoji => $("#header>#pop_custom_emoji>.emoji_list").append(`
            <a class="__on_emoji_append" name="${emoji.shortcode}"><img src="${emoji.url}" alt="${emoji.name}"/></a>
            `)))()
    }

    // Getter: 認証アカウントを順番に並べたときにこのアカウントの次にあたるアカウントを取得
    get next() {
        let index = this.index + 1
        // 右端の場合は最初の要素を選択
        if (Account.keys.length <= index) index = 0
        return Account.get(index)
    }

    // Getter: 認証アカウントを順番に並べたときにこのアカウントの前にあたるアカウントを取得
    get prev() {
        let index = this.index - 1
        // 左端の場合は最後の要素を選択
        if (index < 0) index = Account.keys.length - 1
        return Account.get(index)
    }

    /**
     * #StaticMethod
     * 投稿アカウントを選択するリストのDOMを返却
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
     * 投稿アカウントを選択するコンテキストメニューのDOMを返却
     */
    static createContextMenuAccountList(platform) {
        let html = ''
        if (platform) {
            // プラットフォーム指定がされている場合は対象プラットフォームだけ表示
            if (Account.eachPlatform(platform, elm => html += `
                <li name="${elm.full_address}"><div>${elm.pref.username} - ${elm.full_address}</div></li>`))
                // 対象プラットフォームが認証されていない場合は選択不可の項目を作る
                html = `<li class="ui-state-disabled"><div>(${platform}のアカウントがありません)</div></li>`
        } else // プラットフォーム指定がない場合は普通にすべてのアカウントを表示
            Account.map.forEach((v, k) => html += `<li name="${k}"><div>${v.pref.username} - ${k}</div></li>`)
        return html
    }

    static createAccountPrefList() {
        let html = ''
        Account.map.forEach((v, k) => {
            const cache_flg = v.emojis ? true : false
            html += `
                <li class="ui-sortable" name="${v.full_address}">
                    <h3>${v.pref.domain}</h3>
                    <div class="user">
                        <img src="${v.pref.avatar_url}" class="usericon"/>
                        <h4 class="username">${v.pref.username}</h4>
                        <div class="userid">${v.full_address}</div>
                    </div>
                    <div class="option">
                        アカウントカラー: 
                        #<input type="text" class="__txt_acc_color __pull_color_palette" value="${v.pref.acc_color}" size="6"/>
                        <br/>カスタム絵文字キャッシュ: ${cache_flg ? '◯' : '×'}
                    </div>
                    <div class="foot_button">
                        <button type="button" class="__btn_unauth_acc">認証解除</button>
                    </div>
                </li>
            `
        })
        return html
    }
}
