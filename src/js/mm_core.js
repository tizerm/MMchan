$(() => {
	// ���[�h���ꂽ�i�K�ŃJ�����𐶐�
	var accounts = null;
	var columns = null;
	const viewFunc = async () => {
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
		}
		
		// �J������������
		columns.forEach((col) => {
			// �J�����{�̂𐶐�
			createColumn(col);
			col.timelines.forEach((tl) => {
				// �z���API�Ăяo���p�����[�^���g���ă^�C�����C���𐶐�
				// �N�G���p�����[�^��limit�v���p�e�B�����O�ɒǉ�
				tl.query_param.limit = 30;
				$.ajax({
					type: "GET",
					url: tl.api_url,
					dataType: "json",
					headers: { "Authorization": "Bearer " + accounts.get(tl.key_address).access_token },
					data: tl.query_param
				}).then((data) => {
					// �擾������
					createTimelineMast(data, col.column_id + "_body");
					console.log(data);
				}).catch((jqXHR, textStatus, errorThrown) => {
					// �擾���s��
					console.log('!ERR: timeline get failed. ' + textStatus);
				});
			});
		});
	}
	viewFunc()
	/*

	// TL�擾�{�^���C�x���g
	$("#on_gettl_msky").on("click", function(e) {
		// ajax�Ń^�C�����C����JSON���擾
		var access_token = "";
		
		$.ajax({
			type: "POST",
			url: "https://misskey.design/api/notes/timeline",
			dataType: "json",
			headers: { "Content-Type": "application/json" },
			data: JSON.stringify({
				'limit': 40,
				'i': access_token
			})
		}).done(function(data) {
			// �擾������
			createHeader("Misskey", "col3_head");
			createTimelineMsky(data, "col3_body");
			console.log(data);
		}).fail(function(jqXHR, textStatus) {
			// �擾���s��
			console.log(jqXHR);
			alert( "Request failed: " + textStatus );
		});
	});
	//*/
});
