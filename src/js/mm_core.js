$(() => {
    // HTML���[�h���ɔ񓯊��Ŏ��s
    (async () => {
        // �ی��p�ɃA�J�E���g���ƃJ������񂪓ǂ߂ĂȂ�������ꎞ��~
        if (!await window.accessApi.readPrefAccs()) return;
        if (!await window.accessApi.readPrefCols()) return;

        /*============================================================================================================*/

        // ���e��A�J�E���g�̏����ݒ�
        Account.get(0).setPostAccount();

        // ���e�A�C�R���N���b�N���̃��j���[�����ƕ\��(�N���b�N�C�x���g)
        $("#header>#pop_postuser").html(Account.createPostAccountList());
        $("#header>#head_postarea>.__lnk_postuser").on("click",
            e => $("#header>#pop_postuser").show("slide", { direction: "up" }, 150));
        // �A�J�E���g���X�g�̃A�J�E���g�I�����ɓ��e��A�J�E���g��ύX
        $(document).on("click", ".__lnk_account_elm", e => {
            Account.get($(e.target).closest(".__lnk_account_elm").attr('name')).setPostAccount();
            $("#header>#pop_postuser").hide("slide", { direction: "up" }, 150);
        });

        // ���J�͈̓N���b�N�C�x���g
        $("#header>#head_postarea .__lnk_visibility").on("click", e => {
            // �I�𒆂̃I�v�V������selected�N���X��t�^
            $(".__lnk_visibility>img").removeClass("selected");
            $(e.target).closest("img").addClass("selected");
        });

        // ���e�{�^���N���b�N�C�x���g(���e����)
        $("#header #on_submit").on("click",
            e => Account.get($("#header>#head_postarea>.__lnk_postuser>img").attr("name")).post({
                content: $("#__txt_postarea").val(),
                cw_text: $("#__txt_content_warning").val(),
                visibility_id: $("#header>#head_postarea>.visibility_icon .selected").attr("id"),
                // ���e����������(���������e������)
                success: () => {
                    $("#__txt_postarea").val("");
                    $("#__txt_content_warning").val("");
                }
            }));

        // ���v���C�E�B���h�E�̓��e�{�^���N���b�N�C�x���g(���v���C���M����)
        $(document).on("click", "#__on_reply_submit", e => Account.get($("#__hdn_reply_account").val()).post({
            content: $("#__txt_replyarea").val(),
            visibility_id: 'visibility_public', // TODO: ��U���J�ɂ���
            reply_id: $("#__hdn_reply_id").val(),
            // ���e����������(���v���C�E�B���h�E�����)
            success: () => $("#header>#pop_extend_column").hide("slide", { direction: "right" }, 150)
        }));
        // ����{�^���N���b�N�C�x���g
        $(document).on("click", "#__on_reply_close", 
            (e) => $("#header>#pop_extend_column").hide("slide", { direction: "right" }, 150));

        /*============================================================================================================*/

        // �S�ʃC�x���g����
        // �J�����Ɋւ���C�x���g�̓J�����N���X�Ńo�C���h
        Column.bindEvent();

        // ���e�E�N���b�N���̃R���e�L�X�g���j���[�\���C�x���g
        $("#header>#pop_context_menu>.ui_menu>li ul").html(Account.createContextMenuAccountList());
        $("#header>#pop_context_menu>.ui_menu").menu();
        $(document).on("contextmenu", "#columns>table>tbody>tr>.column_td>ul>li", e => {
            $("#header>#pop_context_menu")
                .css('top', e.pageY + 'px')
                .css('left', (e.pageX - 72) + 'px')
                .show("slide", { direction: "up" }, 100);
            $("#header>#pop_context_menu").attr("name", $(e.target).closest("li").attr("name"));
            return false;
        });
        $("body").on("click", e => $("#header>#pop_context_menu").hide("slide", { direction: "up" }, 100));
        // �R���e�L�X�g���j���[���ڃN���b�N������
        $(document).on("click", "#header>#pop_context_menu>.ui_menu>li ul>li", e => {
            const target_account = Account.get($(e.target).closest("li").attr("name"));
            $("#header>#pop_context_menu").hide("slide", { direction: "up" }, 100);
            target_account.reaction({
                target_mode: $(e.target).closest("ul").attr("id"),
                target_url: $("#header>#pop_context_menu").attr("name")
            });
        });
        // �ʒm�{�^���N���b�N��
        $(document).on("click", ".__on_show_notifications", e => {
            $(".__on_show_notifications").text("0");
            $("#pop_notification_console").toggle("slide", { direction: "down" }, 250);
        });

        /*============================================================================================================*/

        // �J������������
        Column.each(col => {
            // �J�����{�̂𐶐�
            col.create();
            const rest_promises = [];
            // �^�C�����C���擾�������v���~�X�z��Ɋi�[����WebSocket�̐ݒ���Z�b�g
            col.eachTimeline(tl => {
                rest_promises.push(tl.getTimeline());
                tl.setSocketParam();
            });
            // �^�C�����C����DOM�Ƀo�C���h
            col.onLoadTimeline(rest_promises);
        });
        // �ΏۃA�J�E���g��WebSocket�ɐڑ�
        Account.each(account => account.connect({
            openFunc: () => {},
            closeFunc: () => toast(`${account.full_address}�Ƃ̐ڑ����ؒf����܂����B`, "error"),
            reconnect: true
        }));
        Column.tooltip(); // �J�����Ƀc�[���`�b�v��ݒ�
        // �����Ă��钆�ōŏ��̃J�����ɃJ�[�\�����Z�b�g
        Column.getOpenedFirst().setCursor();
    })()
});
