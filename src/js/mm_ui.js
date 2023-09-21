const color_palette = [
    // �f�t�H���g�őI���ł���J���[�p���b�g
    'b53a2a', 'bf7a41', '56873b', '428a6f', '42809e', '3b5da1', '564391', '933ba1', 'b53667', '666666'
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
    const palette_dom = $("#header>#pop_palette");
    color_palette.forEach(color => {
        palette_dom.append(`<a id="${color}" class="__on_select_color">&nbsp;</a>`);
        palette_dom.find('.__on_select_color:last-child').css("background-color", `#${color}`);
    });
    // �J���[�p���b�g�̒���Ƀp���b�g�Ăяo���{�^�����Z�b�g
    $(".__pull_color_palette").each((index, elm) => {
        $(elm).after('<a class="__on_call_palette" title="�h���b�O&�h���b�v�ŐF��I���ł��܂�">&nbsp;</a>');
        $(elm).next().css("background-color", `#${$(elm).val()}`);
    });
    $(".__on_call_palette").tooltip({
        position: {
            my: "left+6 bottom+18",
            at: "right center"
        },
        show: {
            effect: "slide",
            duration: 80
        },
        hide: {
            effect: "slide",
            duration: 80
        }
    });

    $(document).on("mousedown", ".__on_call_palette", e => {
        // �C�x���g�^�[�Q�b�g�ɂ��邽�߂̃N���X��t�^
        $(e.target).addClass("__target_color_button").prev().addClass("__target_color_box");

        palette_dom.css('top', (e.pageY + 12) + 'px').css('left', (e.pageX - 132) + 'px')
            .show("slide", { direction: "up" }, 50);
        return false;
    });
    $("body *").on("mouseup", e => {
        const target = $(e.target);
        if (target.is(".__on_select_color")) {
            const color = target.attr("id");
            $(".__target_color_box").val(color).blur();
            $(".__target_color_button").css("background-color", `#${color}`);
        }
        $("body *").removeClass("__target_color_button __target_color_box");
        palette_dom.hide("slide", { direction: "up" }, 50);
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
