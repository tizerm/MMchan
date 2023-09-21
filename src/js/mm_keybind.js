$(() => {
    // �V���[�g�J�b�g�L�[�o�C���h(�S��)
    $("body").keydown(e => {
        // �V���[�g�J�b�g�L�[�̃o�C���h�𖳎�����t�H�[�����ł͎��s���Ȃ�
        if ($(e.target).is(".__ignore_keyborad")) return;
        let col = null;
        switch (e.keyCode) {
            case 78: // n: ���e�e�L�X�g�{�b�N�X�Ƀt�H�[�J�X
                $("#__txt_postarea").focus();
                return false;
            case 66: // b: CW�e�L�X�g�{�b�N�X�Ƀt�H�[�J�X
                $("#__txt_content_warning").focus();
                return false;
            case 46: // Ctrl+Del: ���O�̓��e���폜����
                if (event.ctrlKey || event.metaKey) {
                    $("#header #on_last_delete").click();
                    return false;
                }
                break;
            case 90: // Ctrl+Z: ���O�̓��e���폜���čēW�J����
                if (event.ctrlKey || event.metaKey) {
                    $("#header #on_last_delete_paste").click();
                    $("#__txt_postarea").focus();
                    return false;
                }
                break;
            case 86: // Ctrl+V: ���O�̓��e���R�s�[���čēW�J����
                if (event.ctrlKey || event.metaKey) {
                    $("#header #on_last_copy").click();
                    $("#__txt_postarea").focus();
                    return false;
                }
                break;
            case 65:
            case 37: // a, <-: �J�[�\�������Ɉړ�
                col = Column.disposeCursor();
                if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
                    // Ctrl+Shift+A: �J�[�\���ړ���̃J�������J��
                    col.prev.open();
                } else if (event.shiftKey) {
                    // Shift+A: �J�[�\���ړ���̃J�������J���Č��݂̃J���������
                    col.prev.open();
                    col.close();
                    col.prev.setCursor();
                    return false;
                }
                col.opened_prev.setCursor();
                return false;
            case 68:
            case 39: // d, ->: �J�[�\�����E�Ɉړ�
                col = Column.disposeCursor();
                if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
                    // Ctrl+Shift+D: �J�[�\���ړ���̃J�������J��
                    col.next.open();
                } else if (event.shiftKey) {
                    // Shift+D: �J�[�\���ړ���̃J�������J���Č��݂̃J���������
                    col.next.open();
                    col.close();
                    col.next.setCursor();
                    return false;
                }
                col.opened_next.setCursor();
                return false;
            case 87:
            case 38: // w, ��: �J�[�\���̃J��������ɃX�N���[��
                col = Column.getCursor();
                // Ctrl+W: �擪�܂ňړ�
                if (event.ctrlKey || event.metaKey) col.scroll(0);
                // Shift+W: �ʏ��葽�߂ɃX�N���[������
                else if (event.shiftKey) col.scroll(-Column.SHIFT_SCROLL);
                else col.scroll(-Column.SCROLL);
                return false;
            case 83:
            case 40: // s, ��: �J�[�\���̃J���������ɃX�N���[��
                col = Column.getCursor();
                // Shift+S: �ʏ��葽�߂ɃX�N���[������
                if (event.shiftKey) col.scroll(Column.SHIFT_SCROLL);
                else col.scroll(Column.SCROLL);
                return false;
            case 70: // f: �J�[�\���J�����̉ϕ��\�����g�O������
                Column.getCursor().toggleFlex();
                return false;
            case 116: // F5: �J�[�\���̃J�����������[�h����
                if (event.ctrlKey || event.metaKey) {
                    // Ctrl+F5: ��ʂ��̂��̂�ǂݍ��݂Ȃ���(�u���E�U�����[�h)
                    location.reload();
                    return false;
                }
                Column.getCursor().reload();
                return false;
            default:
                // 1�`9(+�e���L�[): �J�����̕\�����g�O��
                const key_num = 49 <= e.keyCode && e.keyCode <= 57;
                const ten_num = 97 <= e.keyCode && e.keyCode <= 105;
                if (key_num || ten_num) {
                    let number = null;
                    // �L�[�{�[�h�̐����L�[
                    if (key_num) number = e.keyCode - 48;
                    // �e���L�[
                    else if (ten_num) number = e.keyCode - 96;

                    Column.disposeCursor();
                    col = Column.get(number - 1);
                    if (col.toggle()) col.setCursor(); // �J����
                    else Column.getOpenedFirst().setCursor(); // ����
                }
                break;
        }
    });

    /*================================================================================================================*/

    // �V���[�g�J�b�g�L�[�o�C���h(���e�t�H�[����)
    $("#header>#head_postarea").keydown(e => {
        if (event.shiftKey && e.keyCode === 13) {
            // Shift+Enter�œ��e�������s
            $("#header #on_submit").click();
            return false;
        } else if ((event.ctrlKey || event.metaKey) && e.keyCode === 13) {
            // Ctrl+Enter�̏ꍇ�A���e��Ɏ����Ńt�H�[�J�X���O��
            $("#header #on_submit").click();
            $(e.target).blur();
            return false;
        } else if (e.keyCode === 27) {
            // Esc�Ńt�H�[�J�X�A�E�g
            $(e.target).blur();
            return false;
        }
        // Alt+�����ŃA�J�E���g��؂�ւ�
        if (event.altKey) {
            if (e.keyCode === 38) { // ��
                Account.get($("#header>#head_postarea>.__lnk_postuser>img").attr("name")).prev.setPostAccount();
                return false;
            } else if (e.keyCode === 40) { // ��
                Account.get($("#header>#head_postarea>.__lnk_postuser>img").attr("name")).next.setPostAccount();
                return false;
            }
        }
    });
    // �V���[�g�J�b�g�L�[�o�C���h(���v���C�t�H�[����)
    $(document).on("keydown", "#__txt_replyarea", e => {
        // Ctrl+Enter��Shift+Enter�œ��e�������s
        if ((event.ctrlKey || event.metaKey || event.shiftKey) && e.keyCode === 13) {
            $("#__on_reply_submit").click();
            return false;
        }
    });
});

