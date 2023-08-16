$(() => {
	// �h���C�����͎��̃C�x���g
	$("#txt_instance_domain").on("blur", (e) => {
		var instance_domain = $("#txt_instance_domain").val();
		if (!instance_domain) {
			// ��̏ꍇ�͕\�����Z�b�g
			$("#lbl_instance_name").text("(Instance Name)");
			return;
		}
	
		// ajax�ŃC���X�^���X�����擾
		$.ajax({
			type: "GET",
			url: "https://" + instance_domain + "/api/v2/instance",
			dataType: "json"
		}).then((data) => {
			// �擾�ł�����C���X�^���X�����Z�b�g
			$("#lbl_instance_name").text(data.title);
		}).catch((jqXHR, textStatus, errorThrown) => {
			// �擾���s���̓G���[����������(v3.x.x�͎擾�ł��Ȃ�)
			$("#lbl_instance_name").text("(�s���ȃC���X�^���X��v3.x.x�ȉ��ł�)");
		});
	});

	// �F�؃{�^���C�x���g(�C���X�^���X������)
	$("#on_auth_instance").on("click", (e) => {
		var instance_domain = $("#txt_instance_domain").val();
		var permission = ["read", "write", "follow", "push"].join(" ");
	
		// ajax�ŃA�v���P�[�V�����o�^
		$.ajax({
			type: "POST",
			url: "https://" + instance_domain + "/api/v1/apps",
			dataType: "json",
			headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
			data: {
				"client_name": "MMchan",
				"redirect_uris": "urn:ietf:wg:oauth:2.0:oob",
				"scopes": permission,
				"website": "https://github.com/tizerm/MMchan"
			}
		}).then((data) => {
			// �F�؂ɐ���������N���C�A���gID��ۑ����ăE�B���h�E���J��
			$("#hdn_client_id").val(data.client_id);
			$("#hdn_client_secret").val(data.client_secret);
			window.open("https://" + instance_domain
				+ "/oauth/authorize?client_id=" + data.client_id
				+ "&scope=" + encodeURIComponent(permission)
				+ "&response_type=code&redirect_uri=urn:ietf:wg:oauth:2.0:oob", "_blank");
		}).catch((jqXHR, textStatus, errorThrown) => {
			// �擾���s��
			alert( "Request failed: " + textStatus );
		});
	});

	// �o�^�{�^���C�x���g(�A�N�Z�X�g�[�N���擾)
	$("#on_auth_token").on("click", (e) => {
		var access_token = null;

		var instance_domain = $("#txt_instance_domain").val();
		var auth_code = $("#txt_auth_code").val();
		var client_id = $("#hdn_client_id").val();
		var client_secret = $("#hdn_client_secret").val();

		// ajax��OAuth�F��
		$.ajax({
			type: "POST",
			url: "https://" + instance_domain + "/oauth/token",
			dataType: "json",
			headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
			data: {
				"client_id": client_id,
				"client_secret": client_secret,
				"redirect_uri": "urn:ietf:wg:oauth:2.0:oob",
				"grant_type": "authorization_code",
				"code": auth_code
			}
		}).then((data) => {
			// �F�؂ɐ��������ꍇ���̃A�N�Z�X�g�[�N�����g���ĔF�؃A�J�E���g�̏����擾(Promise�ԋp)
			access_token = data.access_token;
			return $.ajax({
				type: "GET",
				url: "https://" + instance_domain + "/api/v1/accounts/verify_credentials",
				dataType: "json",
				headers: { "Authorization": "Bearer " + access_token }
			});
		}).then((data) => {
			// �A�J�E���g���̎擾�ɐ��������ꍇ�̓��[�U�[���ƃA�N�Z�X�g�[�N����ۑ�
			window.accessApi.writePrefAccs({
				'domain': instance_domain,
				'platform': 'Mastodon',
				'user_id': data.username,
				'username': data.display_name,
				'access_token': access_token,
				'avatar_url': data.avatar
			});
			alert("�A�J�E���g�̔F�؂ɐ������܂����I");
		}).catch((jqXHR, textStatus, errorThrown) => {
			// �擾���s��
			alert( "Request failed: " + textStatus );
		});
	});
});
