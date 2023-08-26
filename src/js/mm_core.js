$(() => {
    var accounts = null;
    var columns = null;
    var sockets = null;
    var send_params = null;
    var post_keysets = null;
    // �^�C�����C���L���b�V�� �J�����ЂƂ����肱�̐��𒴂������납�玩���I�ɏ�����
    const timeline_limit = 150;
    // ���[�h���ꂽ�i�K�ŃJ�����𐶐�(�񓯊�)
    (async () => {
        // ���C���v���Z�X���\�b�h���񓯊��Ȃ̂�await�����ăA�J�E���g�����擾
        accounts = await window.accessApi.readPrefAccs();
        // �F�؏�񂪂Ȃ������牽�������ɏI���
        if (!accounts) {
            return;
        }
        // ���C���v���Z�X���\�b�h���񓯊��Ȃ̂�await�����ăJ���������擾
        columns = await window.accessApi.readPrefCols();
        // �J������񂪂Ȃ������牽�������ɏI���
        if (!columns) {
            return;
        } else {
            // ���e�A�C�R����name������ɐݒ�
            const key_address = columns[0].timelines[0].key_address;
            $("#header>#head_postarea>.__lnk_postuser>img").attr('src', accounts.get(key_address).avatar_url);
            $("#header>#head_postarea>.__lnk_postuser>img").attr('name', key_address);
            $("#header>h1").text(accounts.get(key_address).username + ' - ' + key_address);
            $("#header>h1").css("background-color", "#" + accounts.get(key_address).acc_color);
        }
        
        // ���e�A�C�R���N���b�N���̃��j���[�����ƕ\��
        $("#header>#pop_postuser").html(createSelectableAccounts(accounts));
        $("#header>#head_postarea>.__lnk_postuser").on("click", (e) => {
            // �A�C�R�����N���b�N����ƃA�J�E���g���X�g��\��
            $("#header>#pop_postuser").css("visibility", "visible");
        });
        $(document).on("click", ".__lnk_account_elm", (e) => {
            // �N���b�N�����A�J�E���g�̃A�C�R����key_address���Z�b�g���ă��X�g�\��������
            const key_address = $(e.target).closest(".__lnk_account_elm").attr('name');
            $("#header>#head_postarea>.__lnk_postuser>img").attr('src', accounts.get(key_address).avatar_url);
            $("#header>#head_postarea>.__lnk_postuser>img").attr('name', key_address);
            $("#header>h1").text(accounts.get(key_address).username + ' - ' + key_address);
            $("#header>h1").css("background-color", "#" + accounts.get(key_address).acc_color);
            $("#header>#pop_postuser").css("visibility", "hidden");
        });
        
        // ���J�͈̓N���b�N��
        $("#header>#head_postarea .__lnk_visibility").on("click", (e) => {
            // �I�𒆂̃I�v�V������selected�N���X��t�^
            $(".__lnk_visibility>img").removeClass("selected");
            $(e.target).closest("img").addClass("selected");
        });

        /*========================================================================================*/

        // ���e����
        const procPost = async () => {
            const content = $("#__txt_postarea").val();
            if (!content) {
                // ���������ĂȂ������牽�����Ȃ�
                return;
            }
            const tl_acc = accounts.get($("#header>#head_postarea>.__lnk_postuser>img").attr("name"));
            const cw_text = $("#__txt_content_warning").val();
            const visibility_id = $("#header>#head_postarea>.visibility_icon .selected").attr("id");
            let visibility = null;
            let request_promise = null;
            switch (tl_acc.platform) {
                case 'Mastodon': // Mastodon
                    var request_param = {
                        "status": content
                    };
                    if (cw_text) {
                        // CW������ꍇ��CW�e�L�X�g���ǉ�
                        request_param.spoiler_text = cw_text;
                    }
                    // ���J�͈͂��擾
                    switch (visibility_id) {
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
                    request_param.visibility = visibility;
                    request_promise = $.ajax({ // API�ɓ��e�𓊂���
                        type: "POST",
                        url: "https://" + tl_acc.domain + "/api/v1/statuses",
                        dataType: "json",
                        headers: {
                            "Authorization": "Bearer " + tl_acc.access_token,
                            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                        },
                        data: request_param
                    });
                    break;
                case 'Misskey': // Misskey
                    var request_param = {
                        "i": tl_acc.access_token,
                        "text": content
                    };
                    if (cw_text) {
                        // CW������ꍇ��CW�e�L�X�g���ǉ�
                        request_param.cw = cw_text;
                    }
                    // ���J�͈͂��擾
                    switch (visibility_id) {
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
                    request_param.visibility = visibility;
                    request_promise = $.ajax({ // API�ɓ��e�𓊂���
                        type: "POST",
                        url: "https://" + tl_acc.domain + "/api/notes/create",
                        dataType: "json",
                        headers: { "Content-Type": "application/json" },
                        data: JSON.stringify(request_param)
                    });
                    break;
                default:
                    break;
            }
            request_promise.then(() => {
                // ���e������(���������e������)
                $("#__txt_postarea").val("");
                $("#__txt_content_warning").val("");
            }).catch((jqXHR, textStatus, errorThrown) => {
                // ���e���s��
                console.log('!ERR: ���e�Ɏ��s���܂���. ' + textStatus);
            });
        };
        $("#header #on_submit").on("click", (e) => procPost());
        $("#header>#head_postarea").keydown((e) => {
            // Ctrl+Enter���������Ƃ��ɓ��e���������s
            if (event.ctrlKey && e.keyCode === 13) {
                procPost();
                return false;
            }
        });

        /*========================================================================================*/

        // ���O��WebSocket�}�b�v��CW�Ɖ{�����ӂ̃C�x���g��ݒ�
        sockets = new Map();
        send_params = new Map();
        post_keysets = new Map();
        $(document).on("click", ".expand_header", (e) => $(e.target).next().toggle());
        // ���e�E�N���b�N���̃R���e�L�X�g���j���[�\���C�x���g
        $("#header>#pop_context_menu>.ui_menu>li ul").html(createContextMenuAccounts(accounts));
        $("#header>#pop_context_menu>.ui_menu").menu();
        $(document).on("contextmenu", "#columns>table>tbody>tr>.timeline>ul>li", (e) => {
            $("#header>#pop_context_menu")
                .css('top', e.pageY + 'px')
                .css('left', (e.pageX - 72) + 'px')
                .css('visibility', 'visible');
            $("#header>#pop_context_menu").attr("name", $(e.target).closest("li").attr("name"));
            return false;
        });
        $("body").on("click", (e) => {
            $("#header>#pop_context_menu").css('visibility', 'hidden');
        });
        // ���j���[���ڃN���b�N������
        $(document).on("click", "#header>#pop_context_menu>.ui_menu>li ul>li", (e) => {
            const target_account = accounts.get($(e.target).closest("li").attr("name"));
            const target_mode = $(e.target).closest("ul").attr("id");
            const target_url = $("#header>#pop_context_menu").attr("name");
            
            $("#header>#pop_context_menu").css('visibility', 'hidden');
            // �擾����A�N�V�����܂ł̈�A�̗���͔񓯊��Ŏ��s
            (async () => {
                let request_promise = null;
                let target_post = null;
                // �^�[�Q�b�g�̓��e�f�[�^���擾
                switch (target_account.platform) {
                    case 'Mastodon': // Mastodon
                        request_promise = $.ajax({ // �������瓊�e���擾
                            type: "GET",
                            url: "https://" + target_account.domain + "/api/v2/search",
                            dataType: "json",
                            headers: {
                                "Authorization": "Bearer " + target_account.access_token
                            },
                            data: {
                                "q": target_url,
                                "type": "statuses",
                                "resolve": true
                            }
                        }).then((data) => {
                            // �擾�f�[�^��Promise�ŕԋp
                            return data.statuses[0];
                        }).catch((jqXHR, textStatus, errorThrown) => {
                            // �擾���s��
                            alert("���e�̎擾�ŃG���[���������܂����B");
                        });
                        break;
                    case 'Misskey': // Misskey
                        request_promise = $.ajax({
                            type: "POST",
                            url: "https://" + target_account.domain + "/api/ap/show",
                            dataType: "json",
                            headers: { "Content-Type": "application/json" },
                            data: JSON.stringify({
                                "i": target_account.access_token,
                                "uri": target_url
                            })
                        }).then((data) => {
                            // �擾�f�[�^��Promise�ŕԋp
                            return data.object;
                        }).catch((jqXHR, textStatus, errorThrown) => {
                            // �擾���s��
                            alert("���e�̎擾�ŃG���[���������܂����B");
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
                switch (target_account.platform) {
                    case 'Mastodon': // Mastodon
                        if (target_mode == "__menu_reblog") { // �u�[�X�g
                            $.ajax({
                                type: "POST",
                                url: "https://" + target_account.domain
                                    + "/api/v1/statuses/" + target_post.id + "/reblog",
                                dataType: "json",
                                headers: {
                                    "Authorization": "Bearer " + target_account.access_token
                                }
                            }).then((data) => {
                                console.log("Boost Success: " + target_post.id);
                            }).catch((jqXHR, textStatus, errorThrown) => {
                                // �擾���s��
                                alert("�u�[�X�g�Ɏ��s���܂����B");
                            });
                        } else { // ���C�ɓ���
                            $.ajax({
                                type: "POST",
                                url: "https://" + target_account.domain
                                    + "/api/v1/statuses/" + target_post.id + "/favourite",
                                dataType: "json",
                                headers: {
                                    "Authorization": "Bearer " + target_account.access_token
                                }
                            }).then((data) => {
                                console.log("Favorite Success: " + target_post.id);
                            }).catch((jqXHR, textStatus, errorThrown) => {
                                // �擾���s��
                                alert("���C�ɓ���Ɏ��s���܂����B");
                            });
                        }
                        break;
                    case 'Misskey': // Misskey
                        if (target_mode == "__menu_reblog") { // ���m�[�g
                            $.ajax({
                                type: "POST",
                                url: "https://" + target_account.domain + "/api/notes/create",
                                dataType: "json",
                                headers: { "Content-Type": "application/json" },
                                data: JSON.stringify({
                                    "i": target_account.access_token,
                                    "renoteId": target_post.id
                                })
                            }).then((data) => {
                                console.log("Renote Success: " + target_post.id);
                            }).catch((jqXHR, textStatus, errorThrown) => {
                                // �擾���s��
                                alert("���m�[�g�Ɏ��s���܂����B");
                            });
                        } else { // ���C�ɓ���
                            alert("Misskey�ł��C�ɓ���͌����Ή��ł��c�c�B");
                        }
                        break;
                    default:
                        break;
                }
            })()
        });

        /*========================================================================================*/

        // �J������������
        columns.forEach((col) => {
            // �J�����{�̂𐶐�
            createColumn(col);
            // �^�C�����C���擾�����̃v���~�X���i�[����z��Ɠ��e�̃��j�[�N�L�[���i�[����Z�b�g
            const rest_promises = [];
            post_keysets.set(col.column_id, new Set());
            const keyset = post_keysets.get(col.column_id);
            col.timelines.forEach((tl) => {
                // �z���API�Ăяo���p�����[�^���g���ă^�C�����C���𐶐�
                // �N�G���p�����[�^��limit�v���p�e�B�����O�ɒǉ�(�����Mastodon��Misskey�ŋ���)
                tl.query_param.limit = 30;
                const tl_acc = accounts.get(tl.key_address);
                
                // �v���b�g�t�H�[���ɂ���ĒʐM�l�����Ⴄ�̂Ōʂɐݒ�
                switch (tl_acc.platform) {
                    case 'Mastodon': // Mastodon
                        // �ŏ���REST API�ōŐVTL��30���擾�A���鏈�����v���~�X�z��ɒǉ�
                        rest_promises.push(
                            $.ajax({
                                type: "GET",
                                url: tl.rest_url,
                                dataType: "json",
                                headers: { "Authorization": "Bearer " + tl_acc.access_token },
                                data: tl.query_param
                            }).then((data) => {
                                return (async () => {
                                    // ���e�f�[�^���\�[�g�}�b�v�\�ɂ��鏈����񓯊��Ŏ��s(Promise�ԋp)
                                    const toots = [];
                                    data.forEach((toot) => toots.push(
                                        getIntegratedPost(toot, tl, tl_acc, col.multi_user)));
                                    return toots;
                                })();
                            }));
                        // REST API�Ăяo���Ă�Ԃ�Streaming API�p��WebSocket������
                        var socket_exist_flg = sockets.has(tl.key_address);
                        if (!socket_exist_flg) {
                            // �A�J�E���g��WebSocket���݂��Ȃ��ꍇ�̓R�l�N�V�����̊m������n�߂�
                            sockets.set(tl.key_address, new WebSocket(
                                tl_acc.socket_url + "?access_token=" + tl_acc.access_token));
                            send_params.set(tl.key_address, []);
                        }
                        var skt = sockets.get(tl.key_address);
                        // �X�V�ʒm�̃C�x���g�n���h���[�����
                        skt.addEventListener("message", (event) => {
                            const data = JSON.parse(event.data);
                            if (data.stream[0] != tl.socket_param.stream) {
                                // TL�ƈႤStream�͖���
                                return;
                            }
                            if (data.event == "update") {
                                // �^�C�����C���̍X�V�ʒm
                                prependPost({
                                    data: JSON.parse(data.payload),
                                    column_id: col.column_id,
                                    multi_flg: col.multi_user,
                                    timeline: tl,
                                    limit: timeline_limit,
                                    bindFunc: createTimelineMastLine
                                }, keyset, tl_acc);
                            } else if (tl.timeline_type == "notification" && data.event == "notification") {
                                // �ʒm�̍X�V�ʒm
                                prependPost({
                                    data: JSON.parse(data.payload),
                                    column_id: col.column_id,
                                    multi_flg: col.multi_user,
                                    timeline: tl,
                                    limit: timeline_limit,
                                    bindFunc: createNotificationMastLine
                                }, keyset, tl_acc);
                            }
                        });
                        // �\�P�b�g�p�����[�^�Ɏ�M�J�n�̐ݒ���Z�b�g
                        tl.socket_param.type = "subscribe";
                        send_params.get(tl.key_address).push(JSON.stringify(tl.socket_param));
                        if (!socket_exist_flg) {
                            // �\�P�b�g�����߂č��ꍇ�̓G���[�n���h��������
                            skt.addEventListener("error", (event) => {
                                // HTTP�G���[�n���h�������ꍇ
                                alert(tl.key_address + "�Őڑ��G���[���������܂����A�Đڑ����Ă��������B");
                                console.log(event);
                            });
                        }
                        break;
                    case 'Misskey': // Misskey
                        // �N�G���p�����[�^�ɃA�N�Z�X�g�[�N�����Z�b�g
                        tl.query_param.i = tl_acc.access_token;
                        // �ŏ���REST API�ōŐVTL��30���擾�A���鏈�����v���~�X�z��ɒǉ�
                        rest_promises.push(
                            $.ajax({
                                type: "POST",
                                url: tl.rest_url,
                                dataType: "json",
                                headers: { "Content-Type": "application/json" },
                                data: JSON.stringify(tl.query_param)
                            }).then((data) => {
                                return (async () => {
                                    // ���e�f�[�^���\�[�g�}�b�v�\�ɂ��鏈����񓯊��Ŏ��s(Promise�ԋp)
                                    const notes = [];
                                    data.forEach((note) => notes.push(
                                        getIntegratedPost(note, tl, tl_acc, col.multi_user)));
                                    return notes;
                                })();
                            }));
                        // REST API�Ăяo���Ă�Ԃ�Streaming API�p��WebSocket������
                        var socket_exist_flg = sockets.has(tl.key_address);
                        if (!socket_exist_flg) {
                            // �A�J�E���g��WebSocket���݂��Ȃ��ꍇ�̓R�l�N�V�����̊m������n�߂�
                            sockets.set(tl.key_address, new WebSocket(
                                tl_acc.socket_url + "?i=" + tl_acc.access_token));
                            send_params.set(tl.key_address, []);
                        }
                        var skt = sockets.get(tl.key_address);
                        var uuid = crypto.randomUUID();
                        // �X�V�ʒm�̃C�x���g�n���h���[�����
                        skt.addEventListener("message", (event) => {
                            const data = JSON.parse(event.data);
                            if (data.body.id != uuid) {
                                // TL�ƈႤStream�͖���
                                return;
                            }
                            // �ʂ̃f�[�^�������Ƃ��ɗ]�v�ȏ��������܂Ȃ��悤��������������if���ŏ���
                            if (data.body.type == "note") {
                                // �^�C�����C���̍X�V�ʒm
                                prependPost({
                                    data: data.body.body,
                                    column_id: col.column_id,
                                    multi_flg: col.multi_user,
                                    timeline: tl,
                                    limit: timeline_limit,
                                    bindFunc: createTimelineMskyLine
                                }, keyset, tl_acc);
                            } else if (tl.timeline_type == "notification" && data.body.type == "notification") {
                                // �ʒm�̍X�V�ʒm
                                prependPost({
                                    data: data.body.body,
                                    column_id: col.column_id,
                                    multi_flg: col.multi_user,
                                    timeline: tl,
                                    limit: timeline_limit,
                                    bindFunc: createNotificationMskyLine
                                }, keyset, tl_acc);
                            }
                        });
                        // �\�P�b�g�p�����[�^�Ɏ�M�J�n�̐ݒ���Z�b�g
                        tl.socket_param.id = uuid;
                        send_params.get(tl.key_address).push(JSON.stringify({
                            'type': 'connect',
                            'body': tl.socket_param
                        }));
                        if (!socket_exist_flg) {
                            // �\�P�b�g�����߂č��ꍇ�̓G���[�n���h��������
                            skt.addEventListener("error", (event) => {
                                // HTTP�G���[�n���h�������ꍇ
                                alert(tl.key_address + "�Őڑ��G���[���������܂����A�Đڑ����Ă��������B");
                                console.log(event);
                            });
                        }
                        break;
                    default:
                        break;
                }
            });
            // �J�����̂��ׂẴ^�C�����C����REST API���Ăяo���I����������肷�邽�߂�Promise.all���g�p
            Promise.all(rest_promises).then((datas) => {
                // �^�C�����C����Promise�z��𑖍�
                const postlist = [];
                datas.forEach((posts) => {
                    posts.forEach((p) => {
                        // �d�����Ă��铊�e�����O����
                        if (!keyset.has(p.post_key)) {
                            postlist.push(p);
                            keyset.add(p.post_key);
                        }
                    });
                });
                /*
                console.log(col.label_head); // TODO: debug
                console.log(keyset); // TODO: debug
                console.log(postlist); // TODO: debug
                //*/
                // ���ׂẴf�[�^��z��ɓ��ꂽ�^�C�~���O�Ŕz�����t���Ƀ\�[�g����(�P��TL�̂Ƃ��͂��Ȃ�)
                if (datas.length > 1) {
                    postlist.sort((a, b) => new Date(b.sort_date) - new Date(a.sort_date));
                }
                // �\�[�g���I�������^�C�����C����DOM�ɔ��f
                createIntegratedTimeline(postlist,  col.column_id + "_body", accounts);
            }).catch((jqXHR, textStatus, errorThrown) => {
                // �擾���s��
                console.log('!ERR: timeline get failed. ' + textStatus);
            });
        });
        // ���ׂẴJ�����𐶐����I�����^�C�~���O��WebSocket��open�C�x���g�ɑ��M�������o�C���h
        sockets.forEach((v, k) => {
            v.addEventListener("open", (event) => {
                send_params.get(k).forEach((p) => v.send(p));
            });
        });
    })()
});
