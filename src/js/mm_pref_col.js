$(() => {
	// ���[�h���ꂽ�i�K�ŔF�؏������ɍs��
	var accounts = null;
	var columns = null;
	const getFunc = async () => {
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
		$(".__txt_tl_color").each((index, elm) => {
			var color = $(elm).val();
			$(elm).closest("h4").css("background-color", "#" + color);
		});
		setButtonPermission();
	}
	getFunc()
	
	// �J�����ǉ��{�^���C�x���g
	$("#on_add_column").on("click", (e) => {
		// �J���������擾���ăJ����DOM�����ƒP�̂̃^�C�����C��DOM���������s
		var index = $("#columns>table>thead>tr>th").length;
		createColumn(null, index + 1);
		$("#columns>table>tbody>tr>td").eq(index)
			.find("ul").append(createTimelineOptionLine(null, 1, accounts));
		setButtonPermission();
	});

	// �J�����폜�{�^���C�x���g(���I�o�C���h)
	$(document).on("click", ".__btn_del_col", (e) => {
		// �{�^�����������J������td���擾���ă^�C�����C��DOM���������s
		removeColumn($(e.target).closest("td"));
		setButtonPermission();
	});

	// �J�������ړ��{�^���C�x���g(���I�o�C���h)
	$(document).on("click", ".__btn_to_left", (e) => {
		// �{�^�����������J������td���擾���ă^�C�����C��DOM���������s
		moveColumn($(e.target).closest("td"), -1);
		setButtonPermission();
	});

	// �J�����E�ړ��{�^���C�x���g(���I�o�C���h)
	$(document).on("click", ".__btn_to_right", (e) => {
		// �{�^�����������J������td���擾���ă^�C�����C��DOM���������s
		moveColumn($(e.target).closest("td"), 1);
		setButtonPermission();
	});

	// �^�C�����C���ǉ��{�^���C�x���g(���I�o�C���h)
	$(document).on("click", ".__btn_add_tl", (e) => {
		// �{�^�����������J������ul���X�g���擾���ă^�C�����C��DOM���������s
		var ul = $(e.target).closest("td").find("ul");
		var index = ul.children().length + 1;
		ul.append(createTimelineOptionLine(null, index, accounts));
		setButtonPermission();
	});

	// �^�C�����C���폜�{�^���C�x���g(���I�o�C���h)
	$(document).on("click", ".__btn_del_tl", (e) => {
		// �폜�O�ɐe��ul�̃I�u�W�F�N�g��ێ�
		var ul = $(e.target).closest("ul");
		// �{�^���̂���^�C�����C��DOM���폜����
		$(e.target).closest("li").remove();
		ul.children().each((index, elm) => {
			// �^�C�����C���̘A�Ԃ��Đ���
			$(elm).find(".tl_header_label").text("Timeline " + (index + 1));
		});
		setButtonPermission();
	});
	
	// �J�����J���[�ύX�C�x���g(���I�o�C���h)
	$(document).on("blur", ".__txt_col_color", (e) => {
		// �J�����J���[����͂����F�ɂ���
		var target = $(e.target);
		target.closest("th").css("background-color", "#" + target.val());
	});

	// �^�C�����C���J���[�ύX�C�x���g(���I�o�C���h)
	$(document).on("blur", ".__txt_tl_color", (e) => {
		// �J�����J���[����͂����F�ɂ���
		var target = $(e.target);
		target.closest("h4").css("background-color", "#" + target.val());
	});

	// �J�������ύX�C�x���g(���I�o�C���h)
	$(document).on("blur", ".__txt_col_width", (e) => {
		// �J����������͂������ɂ���
		var target = $(e.target);
		target.closest("th").css("width", target.val() + "px");
	});

	// �ݒ��ۑ��{�^���C�x���g
	$("#on_save_pref").on("click", (e) => {
		// ���݂̃J�������\�����Ă���DOM��HTML�\������ݒ�JSON�𐶐�����
		var col_list = [];
		$("#columns>table>thead>tr>th").each((col_index, col_elm) => {
			var target_th = $(col_elm);
			// �^�C�����C���ꗗ�𑖍�
			var tl_list = [];
			$("#columns>table>tbody>tr>td").eq(target_th.index()).find("li").each((tl_index, tl_elm) => {
				// �A�J�E���g�R���{�{�b�N�X�̒l���擾
				var acc_address = $(tl_elm).find(".__cmb_tl_account").val();
				// �e�t�H�[���̏���JSON�Ń��X�g�ɒǉ�
				tl_list.push({
					'key_address': acc_address,
					'timeline_type': $(tl_elm).find(".__cmb_tl_type").val(),
					'account': accounts.get(acc_address),
					'tl_color': $(tl_elm).find(".__txt_tl_color").val()
				});
			});
			// �e�t�H�[���̏���JSON�Ń��X�g�ɒǉ�
			col_list.push({
				'label_head': $(col_elm).find(".__txt_col_head").val(),
				'label_type': $(col_elm).find(".__txt_col_type").val(),
				'timelines': tl_list,
				'col_color': $(col_elm).find(".__txt_col_color").val(),
				'col_width': $(col_elm).find(".__txt_col_width").val(),
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
