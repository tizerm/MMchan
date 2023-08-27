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
