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
		
		// ���O��CW�Ɖ{�����ӂ̃C�x���g��ݒ�
		$(document).on("click", ".expand_header", (e) => {
			$(e.target).next().toggle();
		});
		// �J������������
		columns.forEach((col) => {
			// �J�����{�̂𐶐�
			createColumn(col);
			col.timelines.forEach((tl) => {
				// �z���API�Ăяo���p�����[�^���g���ă^�C�����C���𐶐�
				// �N�G���p�����[�^��limit�v���p�e�B�����O�ɒǉ�
				tl.query_param.limit = 30;
				var tl_acc = accounts.get(tl.key_address);
				
				// �v���b�g�t�H�[���ɂ���ĒʐM�l�����Ⴄ�̂Ōʂɐݒ�
				switch (tl_acc.platform) {
					case 'Mastodon': // Mastodon
						$.ajax({
							type: "GET",
							url: tl.rest_url,
							dataType: "json",
							headers: { "Authorization": "Bearer " + tl_acc.access_token },
							data: tl.query_param
						}).then((data) => {
							// �擾������
							if (tl.timeline_type == 'notification') {
								// �ʒm���̏ꍇ
								createNotificationMast(data, col.column_id + "_body");
							} else {
								// �^�C�����C���̏ꍇ
								createTimelineMast(data, col.column_id + "_body");
							}
							console.log(data); // �f�o�b�O
						}).catch((jqXHR, textStatus, errorThrown) => {
							// �擾���s��
							console.log('!ERR: timeline get failed. ' + textStatus);
						});
						// REST API�Ăяo���Ă�Ԃ�Streaming API�p��WebSocket������
						var socket = new WebSocket(tl.socket_url
							+ "&access_token=" + tl_acc.access_token);
						socket.addEventListener("message", (event) => {
							// �X�V�ʒm�������ꍇ
							var data = JSON.parse(event.data);
							if (data.event == "update") {
								// �^�C�����C���̍X�V�ʒm
								$("#columns>table>tbody>tr>#" + col.column_id + "_body>ul")
									.prepend(createTimelineMastLine(JSON.parse(data.payload)));
							} else if (tl.timeline_type == "notification" && data.event == "notification") {
								// �ʒm�̍X�V�ʒm
								$("#columns>table>tbody>tr>#" + col.column_id + "_body>ul")
									.prepend(createNotificationMastLine(JSON.parse(data.payload)));
							}
						});
						socket.addEventListener("error", (event) => {
							// HTTP�G���[�n���h�������ꍇ
							alert(tl.key_address + "�Őڑ��G���[���������܂����A�Đڑ����Ă��������B");
							console.log(event);
						});
						break;
					case 'Misskey': // Misskey
						// �N�G���p�����[�^�ɃA�N�Z�X�g�[�N�����Z�b�g
						tl.query_param.i = tl_acc.access_token;
						$.ajax({
							type: "POST",
							url: tl.rest_url,
							dataType: "json",
							headers: { "Content-Type": "application/json" },
							data: JSON.stringify(tl.query_param)
						}).then((data) => {
							// �擾������
							if (tl.timeline_type == 'notification') {
								// �ʒm���̏ꍇ
								// TODO: ������
								//createNotificationMast(data, col.column_id + "_body");
							} else {
								// �^�C�����C���̏ꍇ
								createTimelineMsky(data, col.column_id + "_body");
							}
							console.log(data); // �f�o�b�O
						}).catch((jqXHR, textStatus, errorThrown) => {
							// �擾���s��
							console.log('!ERR: timeline get failed. ' + textStatus);
						});
						// TODO: WebSocket�ɂ�郊�A���^�C���ʐM�͂��傢�҂���
						break;
					default:
						break;
				}
			});
		});
	}
	viewFunc()
});
