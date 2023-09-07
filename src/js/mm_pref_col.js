$(() => {
    // ���[�h���ꂽ�i�K�ŔF�؏������ɍs��
    var accounts = null;
    var columns = null;
    // �J���������\��(�񓯊�)
    (async () => {
        // ���C���v���Z�X���\�b�h���񓯊��Ȃ̂�await�����ăA�J�E���g�����擾
        accounts = await window.accessApi.readPrefAccs();
        columns = await window.accessApi.readPrefCols();
        
        // �f�[�^���Ȃ�������DOM�����͂��Ȃ�
        if (!columns) {
            return;
        }
        
        // �J�����ݒ��񂩂�DOM�𐶐�
        columns.forEach((col, index) => {
            createColumn(col, index + 1);
            createTimelineOptions(col.timelines, index + 1, accounts);
        });
        // �^�C�����C���J���[�������ݒ�
        $(".__cmb_tl_account").each((index, elm) => {
            const key_address = $(elm).find("option[selected]").val();
            $(elm).closest("li").find("h4")
                .css("background-color", "#" + accounts.get(key_address).acc_color);
        });
        // �J������Sortable�ɂ���
        $("#columns>table>tbody>tr").sortable({
            axis: "x",
            delay: 100,
            distance: 48,
            handle: ".col_head",
            revert: 50,
            tolerance: "pointer"
        });
        setButtonPermission();
        setColorPalette();
    })()
    
    // �J�����ǉ��{�^���C�x���g
    $("#on_add_column").on("click", (e) => {
        // �J���������擾���ăJ����DOM�����ƒP�̂̃^�C�����C��DOM���������s
        const index = $("#columns>table td").length + 1;
        createColumn(null, index);
        $("#columns>table #col" + index + ">ul").append(createTimelineOptionLine({
            value: null,
            col_num: index,
            index: 1,
            accounts: accounts
        }));
        setButtonPermission();
    });

    // �J�����폜�{�^���C�x���g(���I�o�C���h)
    $(document).on("click", ".__btn_del_col", (e) => {
        // �{�^�����������J������td���擾���ă^�C�����C��DOM���������s
        removeColumn($(e.target).closest("td"));
        setButtonPermission();
    });

    // �^�C�����C���ǉ��{�^���C�x���g(���I�o�C���h)
    $(document).on("click", ".__btn_add_tl", (e) => {
        // �{�^�����������J������ul���X�g���擾���ă^�C�����C��DOM���������s
        const col_td = $(e.target).closest("td");
        ul.append(createTimelineOptionLine({
            value: null,
            col_num: col_td.index() + 1,
            index: col_td.find("ul").children().length + 1,
            accounts: accounts
        }));
        setButtonPermission();
    });

    // �^�C�����C���폜�{�^���C�x���g(���I�o�C���h)
    $(document).on("click", ".__btn_del_tl", (e) => {
        // �폜�O�ɐe��ul�̃I�u�W�F�N�g��ێ�
        const ul = $(e.target).closest("ul");
        // �{�^���̂���^�C�����C��DOM���폜����
        $(e.target).closest("li").remove();
        ul.children().each((index, elm) => {
            // �^�C�����C���̘A�Ԃ��Đ���
            $(elm).find(".tl_header_label").text("Timeline " + (index + 1));
        });
        setButtonPermission();
    });
    
    // �J�����J���[�ύX�C�x���g(���I�o�C���h)
    $(document).on("blur", ".__txt_col_color",
        (e) => $(e.target).closest(".col_head").css("background-color", "#" + $(e.target).val()));

    // �^�C�����C���J���[�ύX�C�x���g(���I�o�C���h)
    $(document).on("change", ".__cmb_tl_account", (e) => {
        // �J�����J���[��I�������A�J�E���g�̐F�ɂ���
        const target = $(e.target);
        const key_address = target.find("option:selected").val();
        target.closest("li").find("h4")
            .css("background-color", "#" + accounts.get(key_address).acc_color);
        setButtonPermission();
    });

    // �J�������ύX�C�x���g(���I�o�C���h)
    $(document).on("blur", ".__txt_col_width",
        (e) => $(e.target).closest("td").css("width", $(e.target).val() + "px"));

    // �ݒ��ۑ��{�^���C�x���g
    $("#on_save_pref").on("click", (e) => {
        // ���݂̃J�������\�����Ă���DOM��HTML�\������ݒ�JSON�𐶐�����
        const col_list = [];
        $("#columns>table td").each((col_index, col_elm) => {
            // �^�C�����C���ꗗ�𑖍�
            const tl_list = [];
            $(col_elm).find("ul>li").each((tl_index, tl_elm) => {
                // �A�J�E���g�R���{�{�b�N�X�̒l���擾
                const acc_address = $(tl_elm).find(".__cmb_tl_account").val();
                // �e�t�H�[���̏���JSON�Ń��X�g�ɒǉ�
                tl_list.push({
                    'key_address': acc_address,
                    'timeline_type': $(tl_elm).find(".__cmb_tl_type").val(),
                    'account': accounts.get(acc_address),
                    'exclude_reblog': $(tl_elm).find(".__chk_exclude_reblog").prop("checked")
                });
            });
            // �e�t�H�[���̏���JSON�Ń��X�g�ɒǉ�
            col_list.push({
                // �f�t�H���g�J�������́uColumn XX�v
                'label_head': $(col_elm).find(".__txt_col_head").val() || ('Column ' + (col_index + 1)),
                'label_type': 'Col ' + (col_index + 1),
                'timelines': tl_list,
                // �f�t�H���g�J�����J���[��#808080(�O���[)
                'col_color': $(col_elm).find(".__txt_col_color").val() || '808080',
                // �f�t�H���g�J��������330px
                'col_width': $(col_elm).find(".__txt_col_width").val() || '330',
                'd_hide': $(col_elm).find(".__chk_default_hide").prop("checked"),
                'd_flex': $(col_elm).find(".__chk_default_flex").prop("checked")
            });
        });
        // �t�@�C���ɒǉ����鏈��������(���`�̓��C���v���Z�X��)
        window.accessApi.writePrefCols(col_list);
        
        alert("�J�����ݒ��ۑ����܂����B");
    });

    // �߂�{�^���C�x���g
    $("#on_close").on("click", (e) => {
        window.open("index.html", "_self");
    });

});
