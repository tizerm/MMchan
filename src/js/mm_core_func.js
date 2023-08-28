/**
 * #Ajax #jQuery
 * ���e����
 * 
 * @param arg �p�����[�^JSON
 */
async function post(arg) {
    if (!arg.content) {
        // ���������ĂȂ������牽�����Ȃ�
        return;
    }
    let visibility = null;
    let request_param = null;
    let request_promise = null;
    // ���toast�\��
    toast("���e���ł�...", "progress");
    switch (arg.post_account.platform) {
        case 'Mastodon': // Mastodon
            // ���J�͈͂��擾
            switch (arg.visibility_id) {
                case 'visibility_public': // ���J
                    visibility = "public";
                    break;
                case 'visibility_unlisted': // �z�[��
                    visibility = "unlisted";
                    break;
                case 'visibility_followers': // �t�H����
                    visibility = "private";
                    break;
                default:
                    break;
            }
            request_param = {
                "status": arg.content,
                "visibility": visibility
            };
            // CW������ꍇ��CW�e�L�X�g���ǉ�
            if (arg.cw_text) {
                request_param.spoiler_text = arg.cw_text;
            }
            // ���v���C�̏ꍇ�̓��v���C��c�[�gID��ݒ�
            if (arg.reply_id) {
                request_param.in_reply_to_id = arg.reply_id;
            }
            request_promise = $.ajax({ // API�ɓ��e�𓊂���
                type: "POST",
                url: "https://" + arg.post_account.domain + "/api/v1/statuses",
                dataType: "json",
                headers: {
                    "Authorization": "Bearer " + arg.post_account.access_token,
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                },
                data: request_param
            });
            break;
        case 'Misskey': // Misskey
            // ���J�͈͂��擾
            switch (arg.visibility_id) {
                case 'visibility_public': // ���J
                    visibility = "public";
                    break;
                case 'visibility_unlisted': // �z�[��
                    visibility = "home";
                    break;
                case 'visibility_followers': // �t�H����
                    visibility = "followers";
                    break;
                default:
                    break;
            }
            request_param = {
                "i": arg.post_account.access_token,
                "text": arg.content,
                "visibility": visibility
            };
            // CW������ꍇ��CW�e�L�X�g���ǉ�
            if (arg.cw_text) {
                request_param.cw = arg.cw_text;
            }
            // ���v���C�̏ꍇ�̓��v���C��c�[�gID��ݒ�
            if (arg.reply_id) {
                request_param.replyId = arg.reply_id;
            }
            request_promise = $.ajax({ // API�ɓ��e�𓊂���
                type: "POST",
                url: "https://" + arg.post_account.domain + "/api/notes/create",
                dataType: "json",
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify(request_param)
            });
            break;
        default:
            break;
    }
    request_promise.then(() => {
        // ���e������(�R�[���o�b�N�֐����s)
        arg.success();
        toast("���e���܂���.", "done");
    }).catch((jqXHR, textStatus, errorThrown) => {
        // ���e���s��
        toast("���e�Ɏ��s���܂���.", "error");
    });
}

/**
 * #Ajax #jQuery
 * ���A�N�V����(���v���C/�u�[�X�g/���m�[�g/���C�ɓ���/���A�N�V����)����
 * 
 * @param arg �p�����[�^JSON
 */
async function reaction(arg) {
    let request_promise = null;
    let target_post = null;
    // ���toast�\��
    toast("�Ώۂ̓��e���擾���ł�...", "progress");
    // �^�[�Q�b�g�̓��e�f�[�^���擾
    switch (arg.target_account.platform) {
        case 'Mastodon': // Mastodon
            request_promise = $.ajax({ // �������瓊�e���擾
                type: "GET",
                url: "https://" + arg.target_account.domain + "/api/v2/search",
                dataType: "json",
                headers: {
                    "Authorization": "Bearer " + arg.target_account.access_token
                },
                data: {
                    "q": arg.target_url,
                    "type": "statuses",
                    "resolve": true
                }
            }).then((data) => {
                // �擾�f�[�^��Promise�ŕԋp
                return data.statuses[0];
            }).catch((jqXHR, textStatus, errorThrown) => {
                // �擾���s��
                toast("���e�̎擾�ŃG���[���������܂���.", "error");
            });
            break;
        case 'Misskey': // Misskey
            request_promise = $.ajax({
                type: "POST",
                url: "https://" + arg.target_account.domain + "/api/ap/show",
                dataType: "json",
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify({
                    "i": arg.target_account.access_token,
                    "uri": arg.target_url
                })
            }).then((data) => {
                // �擾�f�[�^��Promise�ŕԋp
                return data.object;
            }).catch((jqXHR, textStatus, errorThrown) => {
                // �擾���s��
                toast("���e�̎擾�ŃG���[���������܂���.", "error");
            });
            break;
        default:
            break;
    }
    // �f�[�^���擾�����̂�҂���target_post�ɑ��
    target_post = await request_promise;
    if (!target_post) { // ���e���擾�ł��Ȃ�������Ȃɂ����Ȃ�
        return;
    }
    switch (arg.target_account.platform) {
        case 'Mastodon': // Mastodon
            switch (arg.target_mode) {
                case '__menu_reply': // ���v���C
                    arg.replyFunc(target_post);
                    toast(null, "hide"); // toast������
                    break;
                case '__menu_reblog': // �u�[�X�g
                    $.ajax({
                        type: "POST",
                        url: "https://" + arg.target_account.domain
                            + "/api/v1/statuses/" + target_post.id + "/reblog",
                        dataType: "json",
                        headers: {
                            "Authorization": "Bearer " + arg.target_account.access_token
                        }
                    }).then((data) => {
                        toast("���e���u�[�X�g���܂���.", "done");
                    }).catch((jqXHR, textStatus, errorThrown) => {
                        // �擾���s��
                        toast("�u�[�X�g�Ɏ��s���܂���.", "error");
                    });
                    break;
                case '__menu_favorite': // ���C�ɓ���
                    $.ajax({
                        type: "POST",
                        url: "https://" + arg.target_account.domain
                            + "/api/v1/statuses/" + target_post.id + "/favourite",
                        dataType: "json",
                        headers: {
                            "Authorization": "Bearer " + arg.target_account.access_token
                        }
                    }).then((data) => {
                        toast("���e�����C�ɓ��肵�܂���.", "done");
                    }).catch((jqXHR, textStatus, errorThrown) => {
                        // �擾���s��
                        toast("���C�ɓ���Ɏ��s���܂���.", "error");
                    });
                    break;
                default:
                    break;
            }
            break;
        case 'Misskey': // Misskey
            switch (arg.target_mode) {
                case '__menu_reply': // ���v���C
                    arg.replyFunc(target_post);
                    toast(null, "hide"); // toast������
                    break;
                case '__menu_reblog': // ���m�[�g
                    $.ajax({
                        type: "POST",
                        url: "https://" + arg.target_account.domain + "/api/notes/create",
                        dataType: "json",
                        headers: { "Content-Type": "application/json" },
                        data: JSON.stringify({
                            "i": arg.target_account.access_token,
                            "renoteId": target_post.id
                        })
                    }).then((data) => {
                        toast("���e�����m�[�g���܂���.", "done");
                    }).catch((jqXHR, textStatus, errorThrown) => {
                        // �擾���s��
                        toast("���m�[�g�Ɏ��s���܂���.", "error");
                    });
                    break;
                case '__menu_favorite': // ���C�ɓ���
                    toast("Misskey�ł��C�ɓ���͌����Ή��ł��c�c.", "error");
                    break;
                default:
                    break;
            }
            break;
        default:
            break;
    }
}

/**
 * #Ajax #jQuery
 * �^�C�����C���擾����(REST)
 * 
 * @param arg �p�����[�^JSON
 */
function getTimeline(arg) {
    let rest_promise = null;
    // �v���b�g�t�H�[������
    switch (arg.tl_account.platform) {
        case 'Mastodon': // Mastodon
            // REST API�ōŐVTL��30���擾�A���鏈�����v���~�X�Ƃ��Ċi�[
            rest_promise = $.ajax({
                type: "GET",
                url: arg.timeline.rest_url,
                dataType: "json",
                headers: { "Authorization": "Bearer " + arg.tl_account.access_token },
                data: arg.timeline.query_param
            }).then((data) => {
                return (async () => {
                    // ���e�f�[�^���\�[�g�}�b�v�\�ɂ��鏈����񓯊��Ŏ��s(Promise�ԋp)
                    const toots = [];
                    data.forEach((toot) => toots.push(getIntegratedPost({
                        data: toot,
                        timeline: arg.timeline,
                        tl_account: arg.tl_account,
                        multi_flg: arg.column.multi_user
                    })));
                    return toots;
                })();
            });
            break;
        case 'Misskey': // Misskey
            // �N�G���p�����[�^�ɃA�N�Z�X�g�[�N�����Z�b�g
            arg.timeline.query_param.i = arg.tl_account.access_token;
            // REST API�ōŐVTL��30���擾�A���鏈�����v���~�X�Ƃ��Ċi�[
            rest_promise = $.ajax({
                type: "POST",
                url: arg.timeline.rest_url,
                dataType: "json",
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify(arg.timeline.query_param)
            }).then((data) => {
                return (async () => {
                    // ���e�f�[�^���\�[�g�}�b�v�\�ɂ��鏈����񓯊��Ŏ��s(Promise�ԋp)
                    const notes = [];
                    data.forEach((note) => notes.push(getIntegratedPost({
                        data: note,
                        timeline: arg.timeline,
                        tl_account: arg.tl_account,
                        multi_flg: arg.column.multi_user
                    })));
                    return notes;
                })();
            });
            break;
        default:
            break;
    }
    // Promise��ԋp(�����񓯊�)
    return rest_promise;
}

/**
 * #WebSocket
 * WebSocket�ڑ����s�����߂̐ݒ�l�ƃR�[���o�b�N�֐��𐶐�
 * 
 * @param arg �p�����[�^JSON
 * @param params WebSocket�ݒ��ۑ����邽�߂�Set
 * @param keyset �^�C�����C���d���폜�̂��߂�keyset
 */
function createConnectPref(arg, params, keyset) {
    let socket_url = null;
    let message_callback = null;
    let send_param = null;
    
    // �v���b�g�t�H�[������
    switch (arg.tl_account.platform) {
        case 'Mastodon': // Mastodon
            socket_url = arg.tl_account.socket_url + "?access_token=" + arg.tl_account.access_token;
            // ���b�Z�[�W��M���̃R�[���o�b�N�֐�
            message_callback = (event) => {
                const data = JSON.parse(event.data);
                if (data.stream[0] != arg.timeline.socket_param.stream) {
                    // TL�ƈႤStream�͖���
                    return;
                }
                if (data.event == "update") {
                    // �^�C�����C���̍X�V�ʒm
                    prependPost({
                        data: JSON.parse(data.payload),
                        column_id: arg.column.column_id,
                        multi_flg: arg.column.multi_user,
                        timeline: arg.timeline,
                        tl_account: arg.tl_account,
                        limit: arg.timeline_limit,
                        bindFunc: createTimelineMastLine
                    }, keyset);
                } else if (arg.timeline.timeline_type == "notification" && data.event == "notification") {
                    // �ʒm�̍X�V�ʒm
                    prependPost({
                        data: JSON.parse(data.payload),
                        column_id: arg.column.column_id,
                        multi_flg: arg.column.multi_user,
                        timeline: arg.timeline,
                        tl_account: arg.tl_account,
                        limit: arg.timeline_limit,
                        bindFunc: createNotificationMastLine
                    }, keyset);
                }
            }
            // �w�ǃp�����[�^�̐ݒ�
            arg.timeline.socket_param.type = "subscribe";
            send_param = JSON.stringify(arg.timeline.socket_param);
            break;
        case 'Misskey': // Misskey
            const uuid = crypto.randomUUID();
            socket_url = arg.tl_account.socket_url + "?i=" + arg.tl_account.access_token;
            message_callback = (event) => {
                const data = JSON.parse(event.data);
                if (data.body.id != uuid) {
                    // TL�ƈႤStream�͖���
                    return;
                }
                if (data.body.type == "note") {
                    // �^�C�����C���̍X�V�ʒm
                    prependPost({
                        data: data.body.body,
                        column_id: arg.column.column_id,
                        multi_flg: arg.column.multi_user,
                        timeline: arg.timeline,
                        tl_account: arg.tl_account,
                        limit: arg.timeline_limit,
                        bindFunc: createTimelineMskyLine
                    }, keyset);
                } else if (arg.timeline.timeline_type == "notification" && data.body.type == "notification") {
                    // �ʒm�̍X�V�ʒm
                    prependPost({
                        data: data.body.body,
                        column_id: arg.column.column_id,
                        multi_flg: arg.column.multi_user,
                        timeline: arg.timeline,
                        tl_account: arg.tl_account,
                        limit: arg.timeline_limit,
                        bindFunc: createNotificationMskyLine
                    }, keyset);
                }
            }
            // �w�ǃp�����[�^�̐ݒ�
            arg.timeline.socket_param.id = uuid;
            send_param = JSON.stringify({
                'type': 'connect',
                'body': arg.timeline.socket_param
            });
            break;
        default:
            break;
    }
    // �p�����[�^�Z�b�g�Ƀf�[�^���Ȃ�������Z�b�g�ɔz������
    if (!params.has(arg.timeline.key_address)) {
        params.set(arg.timeline.key_address, {
            socket_url: socket_url,
            subscribes: []
        });
    }
    // subscribes�Ƀ\�P�b�g�ݒ��ǉ�
    params.get(arg.timeline.key_address).subscribes.push({
        target_col: arg.column,
        send_param: send_param,
        messageFunc: message_callback
    });
}

/**
 * #WebSocket
 * WebSocket�ڑ����J�n���Ĉ�A�̃C�x���g�ݒ������
 * 
 * @param arg �p�����[�^JSON
 */
async function connect(arg) {
    // WebSocket�ڑ����J�n
    const socket = new WebSocket(arg.pref.socket_url);
    console.log(arg.key_address + ": socket create."); // TODO: debug
    
    // WebSocket�ڑ��J�n������
    socket.addEventListener("open", (event) => {
        console.log(arg.key_address + ": socket opened."); // TODO: debug
        // �\�P�b�g�Ɏ�M�ݒ�𑗐M
        arg.pref.subscribes.forEach((p) => socket.send(p.send_param));
    });
    // �G���[�n���h��
    socket.addEventListener("error", (event) => {
        toast(arg.key_address + "�Őڑ��G���[���������܂����A�Đڑ����Ă��������B", "error");
        console.log(event);
    });
    // WebSocket�ڑ���~������
    socket.addEventListener("close", (event) => {
        // �ڑ���~�p�R�[���o�b�N�֐������s
        arg.closeFunc();
        console.log(arg.key_address + ": socket closed."); // TODO: debug
        console.log(event);
    });
    // ��M������ݒ�
    arg.pref.subscribes.forEach((p) => socket.addEventListener("message", p.messageFunc));
}