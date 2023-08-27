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

        // ���e����(�ώG�Ȃ̂Ŏ��ۂ̏����̓��\�b�h��)
        const procPost = async () => post({
            content: $("#__txt_postarea").val(),
            cw_text: $("#__txt_content_warning").val(),
            visibility_id: $("#header>#head_postarea>.visibility_icon .selected").attr("id"),
            post_account: accounts.get($("#header>#head_postarea>.__lnk_postuser>img").attr("name")),
            success: () => {
                // ���e������(���������e������)
                $("#__txt_postarea").val("");
                $("#__txt_content_warning").val("");
            }
        });
        $("#header #on_submit").on("click", (e) => procPost());
        $("#header>#head_postarea").keydown((e) => {
            // Ctrl+Enter���������Ƃ��ɓ��e���������s
            if (event.ctrlKey && e.keyCode === 13) {
                procPost();
                return false;
            }
        });

        // ���v���C���e����(�ώG�Ȃ̂Ŏ��ۂ̏����̓��\�b�h��)
        const procMentionPost = async () => post({
            content: $("#__txt_replyarea").val(),
            visibility_id: 'visibility_public', // TODO: ��U���J�ɂ���
            post_account: accounts.get($("#__hdn_reply_account").val()),
            reply_id: $("#__hdn_reply_id").val(),
            success: () => {
                // ���e������(���v���C�E�B���h�E�����)
                $("#header>#pop_extend_column").css('visibility', 'hidden');
            }
        });
        // 
        $(document).on("click", "#__on_reply_submit", (e) => procMentionPost());
        $(document).on("keydown", "#__txt_replyarea", (e) => {
            // Ctrl+Enter���������Ƃ��ɓ��e���������s
            if (event.ctrlKey && e.keyCode === 13) {
                procMentionPost();
                return false;
            }
        });
        $(document).on("click", "#__on_reply_close", (e) => { // ����{�^��
            $("#header>#pop_extend_column").css('visibility', 'hidden');
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
            const key_address = $(e.target).closest("li").attr("name");
            const target_account = accounts.get(key_address);
            $("#header>#pop_context_menu").css('visibility', 'hidden');
            // ���A�N�V�������s(�ώG�Ȃ̂Ŏ��ۂ̏����̓��\�b�h��)
            reaction({
                target_account: target_account,
                target_mode: $(e.target).closest("ul").attr("id"),
                target_url: $("#header>#pop_context_menu").attr("name"),
                replyFunc: (target_post) => {
                    // ���v���C�J������\�����邽�߂̏���
                    $("#header>#pop_extend_column").html(createReplyColumn({
                        post: target_post,
                        key_address: key_address,
                        platform: target_account.platform
                    }));
                    $("#header>#pop_extend_column h2").css("background-color", "#" + target_account.acc_color);
                    $("#header>#pop_extend_column").css('visibility', 'visible');
                }
            });
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
                                    data.forEach((toot) => toots.push(getIntegratedPost({
                                        data: toot,
                                        timeline: tl,
                                        tl_account: tl_acc,
                                        multi_flg: col.multi_user
                                    })));
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
                            //console.log(data); // TODO: debug
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
                                    tl_account: tl_acc,
                                    limit: timeline_limit,
                                    bindFunc: createTimelineMastLine
                                }, keyset);
                            } else if (tl.timeline_type == "notification" && data.event == "notification") {
                                // �ʒm�̍X�V�ʒm
                                prependPost({
                                    data: JSON.parse(data.payload),
                                    column_id: col.column_id,
                                    multi_flg: col.multi_user,
                                    timeline: tl,
                                    tl_account: tl_acc,
                                    limit: timeline_limit,
                                    bindFunc: createNotificationMastLine
                                }, keyset);
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
                                    data.forEach((note) => notes.push(getIntegratedPost({
                                        data: note,
                                        timeline: tl,
                                        tl_account: tl_acc,
                                        multi_flg: col.multi_user
                                    })));
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
                            //console.log(data); // TODO: debug
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
                                    tl_account: tl_acc,
                                    limit: timeline_limit,
                                    bindFunc: createTimelineMskyLine
                                }, keyset);
                            } else if (tl.timeline_type == "notification" && data.body.type == "notification") {
                                // �ʒm�̍X�V�ʒm
                                prependPost({
                                    data: data.body.body,
                                    column_id: col.column_id,
                                    multi_flg: col.multi_user,
                                    timeline: tl,
                                    tl_account: tl_acc,
                                    limit: timeline_limit,
                                    bindFunc: createNotificationMskyLine
                                }, keyset);
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
