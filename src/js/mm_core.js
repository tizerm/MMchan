$(() => {

	/*
	window.accessApi.writeFile(JSON.stringify({
		'limit': 40,
		'test': 'testmessage'
	}))
	const func = async () => {
		const response = await window.accessApi.readFile()
		$("#txt_postarea").val(response);
		console.log(response) // 'pong' �Əo��
	}
	func()
	// TL�擾�{�^���C�x���g
	$("#on_gettl_mast").on("click", function(e) {
		// ajax�Ń^�C�����C����JSON���擾
		var access_token = "";
		
		$.ajax({
			type: "GET",
			url: "https://mofu.kemo.no/api/v1/timelines/home",
			dataType: "json",
			headers: { "Authorization": "Bearer " + access_token },
			data: { limit: 40 }
		}).done(function(data) {
			// �擾������
			createHeader("HOME", "col1_head");
			createTimelineMast(data, "col1_body");
			console.log(data);
		}).fail(function(jqXHR, textStatus) {
			// �擾���s��
			alert( "Request failed: " + textStatus );
		});

		$.ajax({
			type: "GET",
			url: "https://mofu.kemo.no/api/v1/timelines/public",
			dataType: "json",
			headers: { "Authorization": "Bearer " + access_token },
			data: { limit: 40 }
		}).done(function(data) {
			// �擾������
			createHeader("PUBLIC", "col2_head");
			createTimelineMast(data, "col2_body");
			console.log(data);
		}).fail(function(jqXHR, textStatus) {
			// �擾���s��
			alert( "Request failed: " + textStatus );
		});
	});

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
