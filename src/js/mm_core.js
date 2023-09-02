$(() => {
    var accounts = null;
    var columns = null;
    var socket_prefs = null;
    var column_cache = null;
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
            $("#header>#pop_postuser").show("slide", { direction: "up" }, 150);
        });
        $(document).on("click", ".__lnk_account_elm", (e) => {
            // �N���b�N�����A�J�E���g�̃A�C�R����key_address���Z�b�g���ă��X�g�\��������
            const key_address = $(e.target).closest(".__lnk_account_elm").attr('name');
            $("#header>#head_postarea>.__lnk_postuser>img").attr('src', accounts.get(key_address).avatar_url);
            $("#header>#head_postarea>.__lnk_postuser>img").attr('name', key_address);
            $("#header>h1").text(accounts.get(key_address).username + ' - ' + key_address);
            $("#header>h1").css("background-color", "#" + accounts.get(key_address).acc_color);
            $("#header>#pop_postuser").hide("slide", { direction: "up" }, 150);
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
                $("#header>#pop_extend_column").hide("slide", { direction: "right" }, 150);
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
        // ����{�^��
        $(document).on("click", "#__on_reply_close", (e) => $("#header>#pop_extend_column")
            .hide("slide", { direction: "right" }, 150));

        /*========================================================================================*/

        // ���O��WebSocket�}�b�v��CW�Ɖ{�����ӂ̃C�x���g�ƃg�b�v�ֈړ�������ݒ�
        $(document).on("click", ".content>.main_content a", (e) => {
            const url = $(e.target).closest("a").attr("href");
            // �O���u���E�U�Ń����N���J��
            window.accessApi.openExternalBrowser(url);
            // �����N��ɔ�΂Ȃ��悤�ɂ���
            return false;
        });
        $(document).on("click", ".expand_header", (e) => $(e.target).next().toggle("slide", { direction: "up" }, 100));
        $(document).on("click", ".__on_column_top", (e) => $(e.target).closest("td").find("ul").scrollTop(0));
        $(document).on("click", ".__on_column_open", (e) => {
            // ���g����ĉE�ׂ̖{�̃J������\��
            const target_col = $(e.target).closest("td");
            
            target_col.hide();
            target_col.next().show();
        });
        $(document).on("click", ".__on_column_close", (e) => {
            if ($(e.target).closest("tr").find("td.timeline:visible").length <= 1) {
                // �S���̃J��������悤�Ƃ�����~�߂�
                toast("���ׂẴJ��������邱�Ƃ͂ł��܂���B", "error");
                return false;
            }
            // ���g����č��ׂ̒Z�k�J������\��
            const target_col = $(e.target).closest("td");
            const closed_col = target_col.prev();
            target_col.hide();
            // ���ǐ������Z�b�g���Ă���\��
            column_cache.get(target_col.attr("id")).unread = 0;
            closed_col.find("h2>span").empty();
            closed_col.show();
        });
        $(document).on("click", ".__on_media_expand", (e) => {
            // �A�v���P�[�V�����̃A�X����v�Z
            const window_aspect = window.innerWidth / window.innerHeight;
            const link = $(e.target).closest(".__on_media_expand");
            createImageWindow({
                url: link.attr("href"),
                image_aspect: link.attr("name"),
                window_aspect: window_aspect,
            });
            // �����N��ɔ�΂Ȃ��悤�ɂ���
            return false;
        });
        // �摜���g��\�������Ƃ������ǂ��N���b�N���Ă�����悤�ɂ���
        $("body").on("click", (e) => $("#header>#pop_extend_column>.expand_image_col")
            .closest("#pop_extend_column").hide("slide", { direction: "right" }, 100));

        // ���e�E�N���b�N���̃R���e�L�X�g���j���[�\���C�x���g
        $("#header>#pop_context_menu>.ui_menu>li ul").html(createContextMenuAccounts(accounts));
        $("#header>#pop_context_menu>.ui_menu").menu();
        $(document).on("contextmenu", "#columns>table>tbody>tr>.timeline>ul>li", (e) => {
            $("#header>#pop_context_menu")
                .css('top', e.pageY + 'px')
                .css('left', (e.pageX - 72) + 'px')
                .show("slide", { direction: "up" }, 100);
            $("#header>#pop_context_menu").attr("name", $(e.target).closest("li").attr("name"));
            return false;
        });
        $("body").on("click", (e) => {
            $("#header>#pop_context_menu").hide("slide", { direction: "up" }, 100);
        });
        // �R���e�L�X�g���j���[���ڃN���b�N������
        $(document).on("click", "#header>#pop_context_menu>.ui_menu>li ul>li", (e) => {
            const key_address = $(e.target).closest("li").attr("name");
            const target_account = accounts.get(key_address);
            $("#header>#pop_context_menu").hide("slide", { direction: "up" }, 100);
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
                    $("#header>#pop_extend_column").show("slide", { direction: "right" }, 150);
                }
            });
        });

        /*========================================================================================*/

        // �J������������
        socket_prefs = new Map();
        column_cache = new Map();
        columns.forEach((col) => {
            // �J�����{�̂𐶐�
            createColumn(col);
            // �^�C�����C���擾�����̃v���~�X���i�[����z��Ɠ��e�̃��j�[�N�L�[���i�[����Z�b�g
            const rest_promises = [];
            column_cache.set(col.column_id, {
                post_keyset: new Set(),
                unread: 0
            });
            const cache = column_cache.get(col.column_id);
            col.timelines.forEach((tl) => {
                // �z���API�Ăяo���p�����[�^���g���ă^�C�����C���𐶐�
                // �N�G���p�����[�^��limit�v���p�e�B�����O�ɒǉ�(�����Mastodon��Misskey�ŋ���)
                tl.query_param.limit = 30;
                const tl_acc = accounts.get(tl.key_address);

                // �ŏ���REST API�ōŐVTL��30���擾�A���鏈�����v���~�X�z��ɒǉ�
                rest_promises.push(getTimeline({
                    timeline: tl,
                    tl_account: tl_acc,
                    column: col
                }));
                // WebSocket�̃^�C�����C���ݒ��ۑ�
                createConnectPref({
                    timeline: tl,
                    tl_account: tl_acc,
                    column: col,
                    timeline_limit: timeline_limit
                }, socket_prefs, cache);
            });
            // �J�����̂��ׂẴ^�C�����C����REST API���Ăяo���I����������肷�邽�߂�Promise.all���g�p
            Promise.all(rest_promises).then((datas) => {
                // �^�C�����C����Promise�z��𑖍�
                const postlist = [];
                datas.forEach((posts) => {
                    posts.forEach((p) => {
                        // �d�����Ă��铊�e�����O����
                        if (!cache.post_keyset.has(p.post_key)) {
                            postlist.push(p);
                            cache.post_keyset.add(p.post_key);
                        }
                    });
                });
                // ���ׂẴf�[�^��z��ɓ��ꂽ�^�C�~���O�Ŕz�����t���Ƀ\�[�g����(�P��TL�̂Ƃ��͂��Ȃ�)
                if (datas.length > 1) {
                    postlist.sort((a, b) => new Date(b.sort_date) - new Date(a.sort_date));
                }
                // �\�[�g���I�������^�C�����C����DOM�ɔ��f
                createIntegratedTimeline(postlist,  col.column_id, accounts);
            }).catch((jqXHR, textStatus, errorThrown) => {
                // �擾���s��
                toast("�^�C�����C���̎擾�Ɏ��s�����J����������܂��B", "error");
            });
        });
        // ���ׂẴJ�����𐶐����I�����^�C�~���O��WebSocket�̐ڑ����J�n
        socket_prefs.forEach((v, k) => connect({
            pref: v,
            key_address: k,
            openFunc: () => v.subscribes.forEach((s) => prependInfo({
                column_id: s.target_col.column_id,
                text: k + "�Ƃ̐ڑ����J�n���܂����B",
                clear: true
            })),
            closeFunc: () => {
                toast(k + "�Ƃ̐ڑ����ؒf����܂����B", "error");
                // �ΏۃJ�����ɐڑ����؂ꂽ�ʒm���o��
                v.subscribes.forEach((s) => prependInfo({
                    column_id: s.target_col.column_id,
                    text: k + "�Ƃ̐ڑ����ؒf����܂����B",
                    clear: false
                }));
            },
            reconnect: true
        }));
        // �J�����I�v�V�����Ƀc�[���`�b�v���Z�b�g
        setColumnTooltip();
    })()
});
