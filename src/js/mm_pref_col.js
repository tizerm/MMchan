$(() => {
	// ���[�h���ꂽ�i�K�ŔF�؏������ɍs��
	var accounts = null;
	const getFunc = async () => {
		// ���C���v���Z�X���\�b�h���񓯊��Ȃ̂�await�����ăA�J�E���g�����擾
		accounts = await window.accessApi.readPrefAccs();
		var html = "";
		console.log(accounts);
		accounts.forEach((v, k) => {
			html += '<option value="' + k + '">'
				+ v.username + ' - ' + k + '</option>';
		});
		$("#cmb_account").html(html);
	}
	getFunc()
	
	// �ǉ��{�^���C�x���g(�C���X�^���X������)
	$("#on_add_column").on("click", (e) => {
		var acc_address = $("#cmb_account").val();
		var timeline_type = $('input:radio[name="opt_timeline_type"]:checked').val();
		var color = $("#txt_col_color").val();
		var acc_info = accounts.get(acc_address);
		
		// �t�@�C���ɒǉ����鏈��������(���`�̓��C���v���Z�X��)
		window.accessApi.writePrefCols({
			'key_address': acc_address,
			'timeline_type': timeline_type,
			'account': acc_info,
			'col_color': color
		});
	});
});
