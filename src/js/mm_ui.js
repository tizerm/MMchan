const color_palette = [
    // �f�t�H���g�őI���ł���J���[�p���b�g
    '8a3f3f', '8a543f', '8a683f', '8a873f', '708a3f', '3f8a43', '3f8a63',
    '3f8a84', '3f6b8a', '3f4f8a', '573f8a', '7a3f8a', '8a3f77', '8a3f5b', '666666'
]

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
 * �J���[�t�H�[���ɃJ���[�p���b�g�\���@�\��ǉ�
 * (���I�ɐ�������֌W�Ō�t���Ȃ��Ɠ����Ȃ��̂Ŋ֐���)
 */
function setColorPalette() {
    /* TODO: �o�O�̉����ɂȂ��Ă���̂ň�U�J���[�p���b�g�@�\���I�~�b�g���܂��c�c
    // �J���[�p���b�g�̐����ƕ\��(�t�H�[�J�X��)
    $(document).on("focus", ".__pull_color_palette", (e) => {
        // �ŏ��ɃJ���[�p���b�g�𐶐�
        $("#header>#pop_palette").append("<div></div>");
        const palette_dom = $("#header>#pop_palette>div:last-child");
        color_palette.forEach((color) => {
            palette_dom.append(`<a id="${color}" class="__on_select_color">&nbsp;</a>`);
            palette_dom.find('.__on_select_color:last-child').css("background-color", `#${color}`);
        });

        // �Ώۃt�H�[���̈ʒu���擾���Ĕz�u
        let pos = $(e.target).offset();
        pos.left -= 132; // �\���ʒu�������
        pos.top += 24;
        palette_dom.css(pos).show("slide", { direction: "up" }, 50);

        // �C�x���g�^�[�Q�b�g�ɂ��邽�߂̃N���X��t�^
        $(e.target).addClass("__target_color_box");
    });
    // �J���[�p���b�g�̔�\���ƍ폜(�t�H�[�J�X�A�E�g��)
    $(document).on("blur", ".__pull_color_palette", (e) => {
        const palette_dom = $("#header>#pop_palette>div:first-child");
        (async () => setTimeout(() => palette_dom.hide("slide", { direction: "up" }, 50, () => {
            // ���S�ɏ�������DOM���̂��������ă^�[�Q�b�g����N���X���O��
            palette_dom.remove();
            $(e.target).removeClass("__target_color_box");
        }), 100))()
    });
    // �J���[�p���b�g�̐F���t�H�[���ɓK�p(�p���b�g�N���b�N��)
    $(document).on("click", ".__on_select_color",
        (e) => $(".__target_color_box").val($(e.target).attr("id")).blur());
        //*/
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
        const target_toast = toast_block.find(`#${progress_id}`);
        target_toast.hide("slide", 1000, () => target_toast.remove());
    }
    if (type == 'hide') {
        // hide�̏ꍇ�͂��̂܂܏I��
        return;
    }
    // �g�[�X�g����ʂɒǉ�
    if (type == 'progress' && progress_id) {
        toast_block.append(`<span id="${progress_id}">${text}</span>`);
    } else {
        toast_block.append(`<span>${text}</span>`);
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
    added.hide().show("slide", 250);
}
