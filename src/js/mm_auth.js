$(() => {
	// ドメイン入力時のイベント
	$("#txt_instance_domain").on("blur", (e) => {
		var instance_domain = $("#txt_instance_domain").val();
		if (!instance_domain) {
			// 空の場合は表示リセット
			$("#lbl_instance_name").text("(Instance Name)");
			return;
		}
	
		// ajaxでインスタンス情報を取得
		$.ajax({
			type: "GET",
			url: "https://" + instance_domain + "/api/v2/instance",
			dataType: "json"
		}).then((data) => {
			// 取得できたらインスタンス情報をセット
			$("#lbl_instance_name").text(data.title);
		}).catch((jqXHR, textStatus, errorThrown) => {
			// 取得失敗時はエラー文字を入れる(v3.x.xは取得できない)
			$("#lbl_instance_name").text("(不正なインスタンスかv3.x.x以下です)");
		});
	});

	// 認証ボタンイベント(インスタンスを検索)
	$("#on_auth_instance").on("click", (e) => {
		var instance_domain = $("#txt_instance_domain").val();
		var permission = ["read", "write", "follow", "push"].join(" ");
	
		// ajaxでアプリケーション登録
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
			// 認証に成功したらクライアントIDを保存してウィンドウを開く
			$("#hdn_client_id").val(data.client_id);
			$("#hdn_client_secret").val(data.client_secret);
			window.open("https://" + instance_domain
				+ "/oauth/authorize?client_id=" + data.client_id
				+ "&scope=" + encodeURIComponent(permission)
				+ "&response_type=code&redirect_uri=urn:ietf:wg:oauth:2.0:oob", "_blank");
		}).catch((jqXHR, textStatus, errorThrown) => {
			// 取得失敗時
			alert( "Request failed: " + textStatus );
		});
	});

	// 登録ボタンイベント(アクセストークン取得)
	$("#on_auth_token").on("click", (e) => {
		var access_token = null;

		var instance_domain = $("#txt_instance_domain").val();
		var auth_code = $("#txt_auth_code").val();
		var client_id = $("#hdn_client_id").val();
		var client_secret = $("#hdn_client_secret").val();

		// ajaxでOAuth認証
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
			// 認証に成功した場合そのアクセストークンを使って認証アカウントの情報を取得(Promise返却)
			access_token = data.access_token;
			return $.ajax({
				type: "GET",
				url: "https://" + instance_domain + "/api/v1/accounts/verify_credentials",
				dataType: "json",
				headers: { "Authorization": "Bearer " + access_token }
			});
		}).then((data) => {
			// アカウント情報の取得に成功した場合はユーザー情報とアクセストークンを保存
			window.accessApi.writePrefAccs({
				'domain': instance_domain,
				'platform': 'Mastodon',
				'user_id': data.username,
				'username': data.display_name,
				'access_token': access_token,
				'avatar_url': data.avatar
			});
			alert("アカウントの認証に成功しました！");
		}).catch((jqXHR, textStatus, errorThrown) => {
			// 取得失敗時
			alert( "Request failed: " + textStatus );
		});
	});
});
