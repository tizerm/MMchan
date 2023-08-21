$(() => {
	// ���[�h���ꂽ�i�K�ŃJ�����𐶐�
	var accounts = null;
	var columns = null;
	var sockets = null;
	var send_params = null;
	var post_keysets = null;
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
		post_keysets = new Map();
		$(document).on("click", ".expand_header", (e) => {
			$(e.target).next().toggle();
		});
		// �J������������
		columns.forEach((col) => {
			// �J�����{�̂𐶐�
			createColumn(col);
			// �^�C�����C���擾�����̃v���~�X���i�[����z��Ɠ��e�̃��j�[�N�L�[���i�[����Z�b�g
			var rest_promises = [];
			post_keysets.set(col.column_id, new Set());
			const keyset = post_keysets.get(col.column_id);
			col.timelines.forEach((tl) => {
				// �z���API�Ăяo���p�����[�^���g���ă^�C�����C���𐶐�
				// �N�G���p�����[�^��limit�v���p�e�B�����O�ɒǉ�(�����Mastodon��Misskey�ŋ���)
				tl.query_param.limit = 30;
				var tl_acc = accounts.get(tl.key_address);
				
				// �v���b�g�t�H�[���ɂ���ĒʐM�l�����Ⴄ�̂Ōʂɐݒ�
				switch (tl_acc.platform) {
					case 'Mastodon': // Mastodon
						// �ŏ���REST API�ōŐVTL��30���擾�A���鏈�����v���~�X�z��ɒǉ�
						rest_promises.push(
							$.ajax({
								type: "GET",
								url: tl.rest_url,
								dataType: "json",
								headers: { "Authorization": "Bearer " + tl_acc.access_token },
								data: tl.query_param
							}).then((data) => {
								const mapFunc = async () => {
									// ���e�f�[�^���\�[�g�}�b�v�\�ɂ��鏈����񓯊��Ŏ��s(Promise�ԋp)
									var toots = [];
									data.forEach((toot) => {
										toots.push(getIntegratedPost(toot, tl, tl_acc));
									});
									return toots;
								}
								return mapFunc();
							}));
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
							// �ʂ̃f�[�^�������Ƃ��ɗ]�v�ȏ��������܂Ȃ��悤��������������if���ŏ���
							if (data.event == "update") {
								// �^�C�����C���̍X�V�ʒm
								var integrated = getIntegratedPost(JSON.parse(data.payload), tl, tl_acc);
								// �d�����Ă��铊�e�����O����
								if (!keyset.has(integrated.post_key)) {
									keyset.add(integrated.post_key);
									$("#columns>table>tbody>tr>#" + col.column_id + "_body>ul")
										.prepend(createTimelineMastLine(integrated.post));
								}
							} else if (tl.timeline_type == "notification" && data.event == "notification") {
								// �ʒm�̍X�V�ʒm
								var integrated = getIntegratedPost(JSON.parse(data.payload), tl, tl_acc);
								// �d�����Ă��铊�e�����O����
								if (!keyset.has(integrated.post_key)) {
									keyset.add(integrated.post_key);
									$("#columns>table>tbody>tr>#" + col.column_id + "_body>ul")
										.prepend(createNotificationMastLine(integrated.post));
								}
							}
						});
						// �\�P�b�g�p�����[�^�Ɏ�M�J�n�̐ݒ���Z�b�g
						tl.socket_param.type = "subscribe";
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
						// �ŏ���REST API�ōŐVTL��30���擾�A���鏈�����v���~�X�z��ɒǉ�
						rest_promises.push(
							$.ajax({
								type: "POST",
								url: tl.rest_url,
								dataType: "json",
								headers: { "Content-Type": "application/json" },
								data: JSON.stringify(tl.query_param)
							}).then((data) => {
								const mapFunc = async () => {
									// ���e�f�[�^���\�[�g�}�b�v�\�ɂ��鏈����񓯊��Ŏ��s(Promise�ԋp)
									var notes = [];
									data.forEach((note) => {
										notes.push(getIntegratedPost(note, tl, tl_acc));
									});
									return notes;
								}
								return mapFunc();
							}));
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
							// �ʂ̃f�[�^�������Ƃ��ɗ]�v�ȏ��������܂Ȃ��悤��������������if���ŏ���
							if (data.body.type == "note") {
								// �^�C�����C���̍X�V�ʒm
								var integrated = getIntegratedPost(data.body.body, tl, tl_acc);
								// �d�����Ă��铊�e�����O����
								if (!keyset.has(integrated.post_key)) {
									keyset.add(integrated.post_key);
									$("#columns>table>tbody>tr>#" + col.column_id + "_body>ul")
										.prepend(createTimelineMskyLine(integrated.post));
								}
							} else if (tl.timeline_type == "notification" && data.body.type == "notification") {
								// �ʒm�̍X�V�ʒm
								var integrated = getIntegratedPost(data.body.body, tl, tl_acc);
								// �d�����Ă��铊�e�����O����
								if (!keyset.has(integrated.post_key)) {
									keyset.add(integrated.post_key);
									$("#columns>table>tbody>tr>#" + col.column_id + "_body>ul")
										.prepend(createNotificationMskyLine(integrated.post));
								}
							}
						});
						// �\�P�b�g�p�����[�^�Ɏ�M�J�n�̐ݒ���Z�b�g
						tl.socket_param.id = uuid;
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
			// �J�����̂��ׂẴ^�C�����C����REST API���Ăяo���I����������肷�邽�߂�Promise.all���g�p
			Promise.all(rest_promises).then((datas) => {
				// �^�C�����C����Promise�z��𑖍�
				var postlist = [];
				datas.forEach((posts) => {
					posts.forEach((p) => {
						// �d�����Ă��铊�e�����O����
						if (!keyset.has(p.post_key)) {
							postlist.push(p);
							keyset.add(p.post_key);
						}
					});
				});
				//*
				console.log(col.label_head); // TODO: debug
				console.log(keyset); // TODO: debug
				console.log(postlist); // TODO: debug
				//*/
				// ���ׂẴf�[�^��z��ɓ��ꂽ�^�C�~���O�Ŕz�����t���Ƀ\�[�g����(�P��TL�̂Ƃ��͂��Ȃ�)
				if (datas.length > 1) {
					postlist.sort((a, b) => new Date(b.sort_date) - new Date(a.sort_date));
				}
				// �\�[�g���I�������^�C�����C����DOM�ɔ��f
				createIntegratedTimeline(postlist,  col.column_id + "_body");
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
