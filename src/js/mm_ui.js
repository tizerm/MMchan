$(() => {
    // �i�r�Q�[�V�������j���[�z�o�[���Ƀc�[���`�b�v�\��
    $("#navi").tooltip({
        position: {
            my: "left+15 bottom+2",
            at: "right center"
        },
        show: {
            effect: "slide",
            duration: 100
        },
        hide: {
            effect: "slide",
            duration: 100
        }
    });
    // ���J�͈̓z�o�[���Ƀc�[���`�b�v�\��
    $("#header>#head_postarea").tooltip({
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
});

/**
 * #Renderer #jQuery
 * �J�����̃I�v�V�����A�C�R���Ƀc�[���`�b�v��ݒ�
 * (���I�ɐ�������֌W�Ō�t���Ȃ��Ɠ����Ȃ��̂Ŋ֐���)
 */
function setColumnTooltip() {
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
 * #Renderer #jQuery
 * �g�[�X�g��\��
 * 
 * @param text �\�����镶��
 * @param type �g�[�X�g�̃^�C�v
 * @param type �g�[�X�g����ӂɔF�����邽�߂�ID
 */
function toast(text, type, progress_id) {
    const toast_block = $("#header>#pop_toast");
    if (type != 'progress' && progress_id) {
        // progress���[�h�ȊO��ID���n���Ă����ꍇ�͑Ώ�toast���폜
        const target_toast = toast_block.find("#" + progress_id);
        target_toast.hide("slide", 1000, () => target_toast.remove());
    }
    if (type == 'hide') {
        // hide�̏ꍇ�͂��̂܂܏I��
        return;
    }
    // �g�[�X�g����ʂɒǉ�
    if (type == 'progress' && progress_id) {
        toast_block.append('<span id="' + progress_id + '">' + text + '</span>');
    } else {
        toast_block.append('<span>' + text + '</span>');
    }
    const added = toast_block.find("span:last-child");
    if (type != 'progress') {
        // ���s���g�[�X�g�ȊO��3�b��ɏ�������
        if (type == 'error') {
            added.css("background-color", "rgba(115,68,68,0.85)");
            prependNotification(text, true);
        } else {
            added.css("background-color", "rgba(68,83,115,0.85)");
        }
        // 3�b��ɉB���ėv�f���̂��폜
        (async () => setTimeout(() => added.hide("slide", 500, () => added.remove()), 3000))()
    } else {
        // ���s���͏����J���[�ɂ��ǂ�
        added.css("background-color", "rgba(32,32,32,0.85)");
    }
    // �ǉ��A�j���[�V����
    added.hide();
    added.show("slide", 250);
}