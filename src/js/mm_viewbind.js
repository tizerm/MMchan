// ���t�t�H�[�}�b�^�[
const yyyymmdd = new Intl.DateTimeFormat(undefined,
	{
		year:   'numeric',
		month:  '2-digit',
		day:    '2-digit',
		hour:   '2-digit',
		minute: '2-digit',
		second: '2-digit',
		//fractionalSecondDigits: 3,
	}
)

function createHeader(instance_name, bind_id) {
	var html = '<th id="' + bind_id + '" class="head">'
		+ '<h2>' + instance_name + '</h2>'
		+ '</th>';
	$("#columns>table>thead>tr").append(html);

}

// Mastodon����󂯎����JSON�z���HTML�ɐ��`
function createTimelineMast(array_json, bind_id) {
	var html = '<td id="' + bind_id + '" class="timeline"><ul>';
	$.each(array_json, function(index, value) {
		var date = yyyymmdd.format(new Date(value.created_at));
		// toot_url = value.url
		// account_url = value.account.url
		html += '<li><div class="user">'
			// ���[�U�[�A�J�E���g���
			+ '<img src="' + value.account.avatar + '" class="usericon"/>'
			+ '<h4 class="username">' + value.account.display_name + '</h4>'
			+ '<a class="userid">' + value.account.acct + '</a>'
			+ '</div><div class="content">'
			// �{��
			+ value.content
			+ '</div><div class="post_footer">'
			+ '<a href="' + value.url + '" target="_blank" class="created_at">' + date + '</a>'
			+ '<a class="buttons option">OPT</a>'
			+ '<a class="buttons favorite">FAV</a>'
			+ '<a class="buttons boost">BT</a>'
			+ '<a class="buttons reply">RP</a>'
			+ '</div></li>';
	});
	html += '</ul></td>';
	$("#columns>table>tbody>tr").append(html);
}

// Misskey����󂯎����JSON�z���HTML�ɐ��`
function createTimelineMsky(array_json, bind_id) {
	var html = '<td id="' + bind_id + '" class="timeline"><ul>';
	$.each(array_json, function(index, value) {
		var date = yyyymmdd.format(new Date(value.createdAt));
		// toot_url = value.uri
		// account_url = (���̂܂܂��ƃA�N�Z�X�ł��Ȃ�)
		html += '<li><div class="user">'
			// ���[�U�[�A�J�E���g���
			+ '<img src="' + value.user.avatarUrl + '" class="usericon"/>'
			+ '<h4 class="username">' + value.user.name + '</h4>'
			+ '<a class="userid">' + value.user.username + '</a>'
			+ '</div><div class="content">'
			// �{��
			+ value.text
			+ '</div><div class="post_footer">'
			+ '<a href="' + value.uri + '" target="_blank" class="created_at">' + date + '</a>'
			+ '<a class="buttons option">OPT</a>'
			+ '<a class="buttons favorite">ACT</a>'
			+ '<a class="buttons boost">RN</a>'
			+ '<a class="buttons reply">RP</a>'
			+ '</div></li>';
	});
	html += '</ul></td>';
	$("#columns>table>tbody>tr").append(html);
}