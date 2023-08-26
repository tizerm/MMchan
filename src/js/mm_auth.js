$(() => {
    var accounts = null;
    // ���[�h���ꂽ�i�K�ŃA�J�E���g���X�g�𐶐�(�񓯊�)
    (async () => {
        // ���C���v���Z�X���\�b�h���񓯊��Ȃ̂�await�����ăA�J�E���g�����擾
        accounts = await window.accessApi.readPrefAccs();
        // �F�؏�񂪂Ȃ������牽�������ɏI���
        if (!accounts) {
            return;
        }
        
        // �A�J�E���g�������ƂɃA�J�E���g���X�g�𐶐�
        let html = '';
        accounts.forEach((v, k) => {
            html += createAccountLine(v);
        });
        $("#content>#account_list>ul").html(html);
        
        // �A�J�E���g�J���[�ύX���C�x���g��ǉ�
        $(document).on("blur", ".__txt_acc_color", (e) => {
            // �A�J�E���g�J���[����͂����F�ɂ���
            const target = $(e.target);
            target.closest("li").find("h3").css("background-color", "#" + target.val());
        });
        // �A�J�E���g�J���[�����ݒ�
        $(".__txt_acc_color").each((index, elm) => {
            const target = $(elm);
            target.closest("li").find("h3").css("background-color", "#" + target.val());
        });
        
        // �A�J�E���g�J���[���f�{�^��
        $("#on_save_color").on("click", (e) => {
            const param_json = [];
            $("#content>#account_list>ul>li").each((index, elm) => {
                param_json.push({
                    'key_address': $(elm).find(".userid").text(),
                    'acc_color': $(elm).find(".__txt_acc_color").val()
                });
            });
            // �A�J�E���g�J���[���t�@�C���ɏ�������
            window.accessApi.writePrefAccColor(param_json);
            alert("�A�J�E���g�J���[��ύX���܂����B");
            
        });
    })()

    // �h���C�����͎��̃C�x���g
    $("#txt_mst_instance_domain").on("blur", (e) => {
        const instance_domain = $("#txt_mst_instance_domain").val();
        if (!instance_domain) {
            // ��̏ꍇ�͕\�����Z�b�g
            $("#lbl_mst_instance_name").text("(Instance Name)");
            return;
        }
    
        // ajax�ŃC���X�^���X�����擾
        $.ajax({
            type: "GET",
            url: "https://" + instance_domain + "/api/v2/instance",
            dataType: "json"
        }).then((data) => {
            // �擾�ł�����C���X�^���X�����Z�b�g
            console.log(data);
            $("#lbl_mst_instance_name").text(data.title);
        }).catch((jqXHR, textStatus, errorThrown) => {
            // �擾���s���̓G���[����������(v3.x.x�͎擾�ł��Ȃ�)
            $("#lbl_mst_instance_name").text("(�s���ȃC���X�^���X��v3.x.x�ȉ��ł�)");
        });
    });

    /*============================================================================================*/
    // ��Mastodon�̔F�؃��W�b�N��

    // �F�؃{�^���C�x���g(�C���X�^���X������)
    $("#on_mst_auth_instance").on("click", (e) => {
        const instance_domain = $("#txt_mst_instance_domain").val();
        const permission = ["read", "write", "follow", "push"].join(" ");
    
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
    $("#on_mst_auth_token").on("click", (e) => {
        let access_token = null;

        const instance_domain = $("#txt_mst_instance_domain").val();
        const auth_code = $("#txt_mst_auth_code").val();
        const client_id = $("#hdn_client_id").val();
        const client_secret = $("#hdn_client_secret").val();

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
            window.accessApi.writePrefMstdAccs({
                'domain': instance_domain,
                'user_id': data.username,
                'username': data.display_name,
                "client_id": client_id,
                "client_secret": client_secret,
                'access_token': access_token,
                'avatar_url': data.avatar
            });
            alert("�A�J�E���g�̔F�؂ɐ������܂����I");
            // ��ʃ����[�h
            location.reload();
        }).catch((jqXHR, textStatus, errorThrown) => {
            // �擾���s��
            alert( "Request failed: " + textStatus );
        });
    });

    /*============================================================================================*/
    // ��Misskey�̔F�؃��W�b�N��

    // �F�؃{�^���C�x���g(�A�v���o�^�ƔF��)
    $("#on_msk_auth_instance").on("click", (e) => {
        const instance_domain = $("#txt_msk_instance_domain").val();
        const permission = ["read:account", "read:notes", "write:notes", "write:blocks",
            "read:drive", "read:favorites", "write:favorites", "read:following", "write:following",
            "write:mutes", "read:notifications", "read:reactions", "write:reactions",
            "write:votes", "read:channels", "write:channels"];
    
        // ajax�ŃA�v���P�[�V�����o�^
        $.ajax({
            type: "POST",
            url: "https://" + instance_domain + "/api/app/create",
            dataType: "json",
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify({
                'name': 'MMchan',
                'description': 'This is Electron base Mastodon and Misskey client.',
                'permission': permission
            })
        }).then((data) => {
            // �A�v���o�^�ɐ���������secret��ۑ����ĔF�؃Z�b�V�������J�n
            $("#hdn_app_secret").val(data.secret);
            return $.ajax({
                type: "POST",
                url: "https://" + instance_domain + "/api/auth/session/generate",
                dataType: "json",
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify({
                    'appSecret': data.secret
                })
            });
        }).then((data) => {
            // �����Ƀ��X�|���X���Ԃ�����token��ۑ����ĔF�؋��E�B���h�E�𐶐�
            $("#hdn_app_token").val(data.token);
            window.open(data.url, "_blank");
        }).catch((jqXHR, textStatus, errorThrown) => {
            // �擾���s��
            alert( "Request failed: " + textStatus );
        });
    });

    // �o�^�{�^���C�x���g(�A�N�Z�X�g�[�N���̐����ƕۑ�)
    $("#on_msk_auth_token").on("click", (e) => {
        const instance_domain = $("#txt_msk_instance_domain").val();
        const app_secret = $("#hdn_app_secret").val();
        const app_token = $("#hdn_app_token").val();

        // ajax�ŃA�N�Z�X�g�[�N���擾
        $.ajax({
            type: "POST",
            url: "https://" + instance_domain + "/api/auth/session/userkey",
            dataType: "json",
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify({
                'appSecret': app_secret,
                'token': app_token
            })
        }).then((data) => {
            // �����Ƀ��X�|���X���Ԃ�����A�Ԃ��Ă����A�N�Z�X�g�[�N�������C���v���Z�X�ɓn��
            window.accessApi.writePrefMskyAccs({
                'domain': instance_domain,
                'user': data.user,
                'app_secret': app_secret,
                'access_token': data.accessToken
            });
            alert("�A�J�E���g�̔F�؂ɐ������܂����I");
            // ��ʃ����[�h
            location.reload();
        }).catch((jqXHR, textStatus, errorThrown) => {
            // �擾���s��
            alert( "Request failed: " + textStatus );
        });
    });
});
