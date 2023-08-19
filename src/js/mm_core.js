$(() => {
	// ���[�h���ꂽ�i�K�ŃJ�����𐶐�
	var accounts = null;
	var columns = null;
	var sockets = null;
	var send_params = null;
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
		
		// ���O��WebSocket�}�b�v��CW�Ɖ{�����ӂ̃C�x���g��ݒ�
		sockets = new Map();
		send_params = new Map();
		$(document).on("click", ".expand_header", (e) => {
			$(e.target).next().toggle();
		});
		// �J������������
		columns.forEach((col) => {
			// �J�����{�̂𐶐�
			createColumn(col);
			col.timelines.forEach((tl) => {
				// �z���API�Ăяo���p�����[�^���g���ă^�C�����C���𐶐�
				// �N�G���p�����[�^��limit�v���p�e�B�����O�ɒǉ�(�����Mastodon��Misskey�ŋ���)
				tl.query_param.limit = 30;
				var tl_acc = accounts.get(tl.key_address);
				
				// �v���b�g�t�H�[���ɂ���ĒʐM�l�����Ⴄ�̂Ōʂɐݒ�
				switch (tl_acc.platform) {
					case 'Mastodon': // Mastodon
						// �ŏ���REST API�ōŐVTL��30���擾
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
							console.log(tl.key_address + tl.timeline_type);
							console.log(data); // TODO: �f�o�b�O
						}).catch((jqXHR, textStatus, errorThrown) => {
							// �擾���s��
							console.log('!ERR: timeline get failed. ' + textStatus);
						});
						// REST API�Ăяo���Ă�Ԃ�Streaming API�p��WebSocket������
						var socket_exist_flg = sockets.has(tl.key_address);
						if (!socket_exist_flg) {
							// �A�J�E���g��WebSocket���݂��Ȃ��ꍇ�̓R�l�N�V�����̊m������n�߂�
							sockets.set(tl.key_address, new WebSocket(
								tl_acc.socket_url + "?access_token=" + tl_acc.access_token));
							send_params.set(tl.key_address, []);
						}
						var skt = sockets.get(tl.key_address);
						// �X�V�ʒm�̃C�x���g�n���h���[�����
						skt.addEventListener("message", (event) => {
							var data = JSON.parse(event.data);
							if (data.stream[0] != tl.socket_param.stream) {
								// TL�ƈႤStream�͖���
								return;
							}
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
						// �\�P�b�g�p�����[�^�Ɏ�M�J�n�̐ݒ���Z�b�g
						tl.socket_param.type = "subscribe";
						//skt.send(JSON.stringify(tl.socket_param));
						send_params.get(tl.key_address).push(JSON.stringify(tl.socket_param));
						if (!socket_exist_flg) {
							// �\�P�b�g�����߂č��ꍇ�̓G���[�n���h��������
							skt.addEventListener("error", (event) => {
								// HTTP�G���[�n���h�������ꍇ
								alert(tl.key_address + "�Őڑ��G���[���������܂����A�Đڑ����Ă��������B");
								console.log(event);
							});
						}
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
								createNotificationMsky(data, col.column_id + "_body");
							} else {
								// �^�C�����C���̏ꍇ
								createTimelineMsky(data, col.column_id + "_body");
							}
							console.log(tl.key_address + tl.timeline_type);
							console.log(data); // TODO: �f�o�b�O
						}).catch((jqXHR, textStatus, errorThrown) => {
							// �擾���s��
							console.log('!ERR: timeline get failed. ' + textStatus);
						});
						// REST API�Ăяo���Ă�Ԃ�Streaming API�p��WebSocket������
						var socket_exist_flg = sockets.has(tl.key_address);
						if (!socket_exist_flg) {
							// �A�J�E���g��WebSocket���݂��Ȃ��ꍇ�̓R�l�N�V�����̊m������n�߂�
							sockets.set(tl.key_address, new WebSocket(
								tl_acc.socket_url + "?i=" + tl_acc.access_token));
							send_params.set(tl.key_address, []);
						}
						var skt = sockets.get(tl.key_address);
						var uuid = crypto.randomUUID();
						// �X�V�ʒm�̃C�x���g�n���h���[�����
						skt.addEventListener("message", (event) => {
							var data = JSON.parse(event.data);
							if (data.body.id != uuid) {
								// TL�ƈႤStream�͖���
								return;
							}
							if (data.body.type == "note") {
								// �^�C�����C���̍X�V�ʒm
								$("#columns>table>tbody>tr>#" + col.column_id + "_body>ul")
									.prepend(createTimelineMskyLine(data.body.body));
							} else if (tl.timeline_type == "notification" && data.body.type == "notification") {
								// �ʒm�̍X�V�ʒm
								$("#columns>table>tbody>tr>#" + col.column_id + "_body>ul")
									.prepend(createNotificationMskyLine(data.body.body));
							}
						});
						// �\�P�b�g�p�����[�^�Ɏ�M�J�n�̐ݒ���Z�b�g
						tl.socket_param.id = uuid;
						/*
						skt.send(JSON.stringify({
							'type': 'connect',
							'body': tl.socket_param
						}));//*/
						send_params.get(tl.key_address).push(JSON.stringify({
							'type': 'connect',
							'body': tl.socket_param
						}));
						if (!socket_exist_flg) {
							// �\�P�b�g�����߂č��ꍇ�̓G���[�n���h��������
							skt.addEventListener("error", (event) => {
								// HTTP�G���[�n���h�������ꍇ
								alert(tl.key_address + "�Őڑ��G���[���������܂����A�Đڑ����Ă��������B");
								console.log(event);
							});
						}
						break;
					default:
						break;
				}
			});
		});
		// ���ׂẴJ�����𐶐����I�����^�C�~���O��WebSocket��open�C�x���g�ɑ��M�������o�C���h
		sockets.forEach((v, k) => {
			v.addEventListener("open", (event) => {
				send_params.get(k).forEach((p) => {
					v.send(p);
				});
			});
		});
	}
	viewFunc()
});
