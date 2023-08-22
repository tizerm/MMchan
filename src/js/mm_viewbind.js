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

/**
 * #Renderer #jQuery
 * Mastodon��Misskey�̃^�C�����C���f�[�^���\�[�g�}�b�v�\�ȃf�[�^�Ƃ��ĕԂ�
 * 
 * @param data �|�X�g����JSON
 * @param timeline ����Ă����^�C�����C��JSON
 * @param tl_acc ����Ă����A�J�E���gJSON
 */
function getIntegratedPost(data, timeline, tl_acc) {
	var binding_key = null;
	var sort_date = null;
	var user_address = null;

	// �v���b�g�t�H�[������
	switch (tl_acc.platform) {
		case 'Mastodon': // Mastodon
			binding_key = timeline.timeline_type == 'notification'
				? 'Mastodon-notification' : 'Mastodon-toot';
			sort_date = data.created_at;
			// ���[�J�������[�g�֌W�Ȃ��A�J�E���g�̃t���A�h���X�𐶐�
			user_address = data.account.acct.match(/@/)
				? data.account.acct : (data.account.acct + '@' + timeline.host);
			break;
		case 'Misskey': // Misskey
			binding_key = timeline.timeline_type == 'notification'
				? 'Misskey-notification' : 'Misskey-note';
			sort_date = data.createdAt;
			// ���[�J�������[�g�֌W�Ȃ��A�J�E���g�̃t���A�h���X�𐶐�
			// TODO: ���т�����Ɨ�����̂�Optional�ɂ��Ƃ�
			user_address = data?.user?.username + '@'
				+ (data?.user?.host ? data?.user?.host : timeline?.host);
			break;
		default:
			break;
	}
	// ���e�I�u�W�F�N�g���܂߂�JSON�I�u�W�F�N�g�Ƃ��ĕԋp
	return {
		'binding_key': binding_key,
		'sort_date': sort_date,
		// ���e���t(�����_�ȉ��؂�̂�)+���[�U�[�t���A�h���X�𓊍e�̃��j�[�N�L�[�Ƃ���
		'post_key': sort_date.substring(0, sort_date.lastIndexOf('.')) + '@' + user_address,
		'post': data
	};
}

/**
 * #Renderer #jQuery
 * �J�����̃e���v���[�g�𐶐�����
 * ���g�͌����
 * 
 * @param col_json �J��������JSON
 */
function createColumn(col_json) {
	// �J�����w�b�_�𐶐�
	var html = '<th id="'
		+ col_json.column_id + '_head" class="head">'
		+ '<h2>' + col_json.label_head + '</h2>'
		+ '<h3>' + col_json.label_type + '</h3>'
		+ '</th>';
	$("#columns>table>thead>tr").append(html);
	
	// �J�����{�̂���̏�ԂŐ���
	html = '<td id="' + col_json.column_id + '_body" class="timeline">'
		+ '<ul></ul></td>';
	$("#columns>table>tbody>tr").append(html);
	
	// �J�����w�b�_�̐F��ύX
	$("#columns>table>thead>tr>#" + col_json.column_id + "_head")
		.css("background-color", "#" + col_json.col_color);

	// �J�����̕���ύX
	$("#columns>table>thead>tr>#" + col_json.column_id + "_head")
		.css("width", col_json.col_width + "px");
}

/**
 * #Renderer #jQuery
 * �����p�ɐ��`�������e�f�[�^����^�C�����C����DOM�𐶐�
 * 
 * @param array_json �����p�ɐ��`���ꂽ���e�z��JSON
 * @param bind_id �o�C���h���ID
 */
function createIntegratedTimeline(array_json, bind_id) {
	var html = '';
	$.each(array_json, (index, value) => {
		// binding_key�ɂ���ČĂяo���֐���ς���
		switch (value.binding_key) {
			case 'Mastodon-toot': // Mastodon-���e�^�C�����C��
				html += createTimelineMastLine(value.post);
				break;
			case 'Mastodon-notification': // Mastodon-�ʒm��
				html += createNotificationMastLine(value.post);
				break;
			case 'Misskey-note': // Misskey-���e�^�C�����C��
				html += createTimelineMskyLine(value.post);
				break;
			case 'Misskey-notification': // Misskey-�ʒm��
				html += createNotificationMskyLine(value.post);
				break;
			default:
				break;
		}
	});
	$("#columns>table>tbody>tr>#" + bind_id + ">ul").append(html);
}

/*================================================================================================*/

/**
 * #Renderer #jQuery
 * Mastodon����󂯎�����^�C�����C��JSON��HTML�Ƃ��Đ���
 * 
 * @param array_json API����ԋp���ꂽ���e�z��JSON
 * @param bind_id �o�C���h���ID
 */
function createTimelineMast(array_json, bind_id) {
	var html = '';
	$.each(array_json, (index, value) => {
		html += createTimelineMastLine(value);
	});
	$("#columns>table>tbody>tr>#" + bind_id + ">ul").append(html);
}

/**
 * #Renderer #jQuery
 * Mastodon����󂯎�����^�C�����C��JSON��HTML�Ƃ��Đ���(1�s����)
 * 
 * @param value ��status JSON
 */
function createTimelineMastLine(value) {
	var html = '';
	// �u�[�X�g�c�[�g�Ȃ�u�[�X�g����A�ʏ�Ȃ�{�̂��Q�Ɛ�ɂ���
	var viewdata = value.reblog ? value.reblog : value;
	// toot_url = value.url
	// account_url = value.account.url
	var date = yyyymmdd.format(new Date(viewdata.created_at));
	var display_name = viewdata.account.display_name ? viewdata.account.display_name : viewdata.account.username;
	html += '<li>';
	if (value.reblog) {
		// �u�[�X�g�c�[�g�̏ꍇ�̓u�[�X�g�w�b�_��\��
		html += '<div class="label_head label_reblog">'
			+ '<span>Boosted by @' + value.account.acct + '</span>'
			+ '</div>';
	}
	html += '<div class="user">'
		// ���[�U�[�A�J�E���g���
		+ '<img src="' + viewdata.account.avatar + '" class="usericon"/>'
		// �G�����u��
		+ '<h4 class="username">' + replaceEmojiMast(display_name, viewdata.account.emojis) + '</h4>'
		+ '<a class="userid">@' + viewdata.account.acct + '</a>'
		+ '</div><div class="content">';
	if (viewdata.spoiler_text) {
		// CW�e�L�X�g������ꍇCW�{�^����\��
		html += '<a class="expand_header label_cw">' + viewdata.spoiler_text + '</a>'
			+ '<div class="main_content cw_content">';
	} else {
		// �Ȃ��ꍇ�͕��ʂɃu���b�N�����
		html += '<div class="main_content">';
	}
	// �{��
	html += replaceEmojiMast(viewdata.content, viewdata.emojis) // �G�����u��
		+ '</div></div>';
	if (viewdata.media_attachments.length > 0) {
		// �Y�t�摜������ꍇ�͉摜��\��
		html += '<div class="media">';
		if (viewdata.sensitive) {
			// �{�����Ӑݒ�̏ꍇ�͉摜���B��
			html += '<a class="expand_header label_sensitive">�{�����ӂ̉摜������܂�</a>'
				+ '<div class="media_content cw_content">';
		} else {
			html += '<div class="media_content">';
		}
		viewdata.media_attachments.forEach((media) => {
			html += '<img src="' + media.preview_url + '" class="media_preview"/>';
		});
		html += '</div></div>';
	}
	html += '<div class="post_footer">'
		+ '<a href="' + viewdata.url + '" target="_blank" class="created_at">' + date + '</a>'
		+ '<a class="buttons option">OPT</a>'
		+ '<a class="buttons favorite">FAV</a>'
		+ '<a class="buttons boost">BT</a>'
		+ '<a class="buttons reply">RP</a>'
		+ '</div></li>';
	return html;
}

/**
 * #Renderer #jQuery
 * Mastodon����󂯎�����ʒmJSON��HTML�Ƃ��Đ���
 * 
 * @param array_json API����ԋp���ꂽ���e�z��JSON
 * @param bind_id �o�C���h���ID
 */
function createNotificationMast(array_json, bind_id) {
	var html = '';
	$.each(array_json, (index, value) => {
		html += createNotificationMastLine(value);
	});
	$("#columns>table>tbody>tr>#" + bind_id + ">ul").append(html);
}

/**
 * #Renderer #jQuery
 * Mastodon����󂯎�����ʒmJSON��HTML�Ƃ��Đ���(1�s����)
 * 
 * @param value ��status JSON
 */
function createNotificationMastLine(value) {
	var html = '';
	var date = yyyymmdd.format(new Date(value.created_at));
	var display_name = value.account.display_name ? value.account.display_name : value.account.username;
	html += '<li>';
	// �ʒm�^�C�v�ɂ���ĕ\����ύX
	switch (value.type) {
		case 'favourite': // ���C�ɓ���
			html += '<div class="label_head label_favorite">'
				+ '<span>Favorited by @' + value.account.acct + '</span>'
				+ '</div>';
			break;
		case 'reblog': // �u�[�X�g
			html += '<div class="label_head label_reblog">'
				+ '<span>Boosted by @' + value.account.acct + '</span>'
				+ '</div>';
			break;
		case 'follow': // �t�H���[�ʒm
			html += '<div class="label_head label_follow">'
				+ '<span>Followed by @' + value.account.acct + '</span>'
				+ '</div>';
			break;
		default: // ���v���C�̏ꍇ�̓w�b�_�����Ȃ�
			break;
	}
	html += '<div class="user">'
		// ���[�U�[�A�J�E���g���
		+ '<img src="' + value.account.avatar + '" class="usericon"/>'
		+ '<h4 class="username">' + replaceEmojiMast(display_name, value.account.emojis) + '</h4>'
		+ '<a class="userid">@' + value.account.acct + '</a>'
		+ '</div><div class="content"><div class="main_content">';
		// �{��
	if (value.type == 'follow') {
		// �t�H���[�̏ꍇ�̓��[�U�[�̃v���t��\��
		html += replaceEmojiMast(value.account.note, value.account.emojis);
	} else {
		html += replaceEmojiMast(value.status.content, value.status.emojis);
	}
	html += '</div></div><div class="post_footer">';
	// �ʒm�^�C�v�ɂ���ĕ\����ύX
	switch (value.type) {
		case 'mention': // ���v���C
			html += '<a href="' + value.status.url + '" target="_blank" class="created_at">' + date + '</a>'
				+ '<a class="buttons option">OPT</a>'
				+ '<a class="buttons favorite">FAV</a>'
				+ '<a class="buttons boost">BT</a>'
				+ '<a class="buttons reply">RP</a>';
			break;
		case 'follow': // �t�H���[�ʒm
			html += '<div class="created_at">Post: ' + value.account.statuses_count
				+ ' / Follow: ' + value.account.following_count
				+ ' / Follower: ' + value.account.followers_count + '</div>'
				+ '<a class="buttons option">OPT</a>'
				+ '<a class="buttons block">BL</a>'
				+ '<a class="buttons follow">FL</a>';
			break;
		default: // ���C�ɓ���ƃu�[�X�g�͓��t����
			html += '<div class="created_at">' + date + '</a>';
			break;
	}
	html += '</div></li>';
	return html;
}

/**
 * #Renderer #jQuery
 * Mastodon�̃e�L�X�g����G�����̃V���[�g�R�[�h���G�����ɕϊ�
 * 
 * @param text �ϊ��Ώۃe�L�X�g
 * @param emojis ���X�|���X�Ɋ܂܂��G�����z��
 */
function replaceEmojiMast(text, emojis) {
	emojis.forEach((emoji) => {
		text = text.replace(new RegExp(':' + emoji.shortcode + ':', 'g'),
			'<img src="' + emoji.url + '" class="inline_emoji"/>');
	});
	return text;
}

/*================================================================================================*/

/**
 * #Renderer #jQuery
 * Misskey����󂯎�����^�C�����C��JSON��HTML�Ƃ��Đ���
 * 
 * @param array_json API����ԋp���ꂽ���e�z��JSON
 * @param bind_id �o�C���h���ID
 */
function createTimelineMsky(array_json, bind_id) {
	var html = '';
	$.each(array_json, (index, value) => {
		html += createTimelineMskyLine(value);
	});
	$("#columns>table>tbody>tr>#" + bind_id + ">ul").append(html);
}

/**
 * #Renderer #jQuery
 * Misskey����󂯎�����^�C�����C��JSON��HTML�Ƃ��Đ���(1�s����)
 * 
 * @param value ��status JSON
 */
function createTimelineMskyLine(value) {
	var html = '';
	// ���m�[�g�悪����{��������ꍇ�͈��p�t���O�𗧂Ă�
	var quote_flg = value.renote && value.text;
	// ���m�[�g�Ȃ烊�m�[�g����A�ʏ�Ȃ�{�̂��Q�Ɛ�ɂ���
	var viewdata = !quote_flg && value.renote ? value.renote : value;
	// toot_url = value.uri
	// account_url = (���̂܂܂��ƃA�N�Z�X�ł��Ȃ�)
	var date = yyyymmdd.format(new Date(viewdata.createdAt));
	var display_name = viewdata.user.name ? viewdata.user.name : viewdata.user.username;
	var user_address = viewdata.user.username + (viewdata.user.host ? ('@' + viewdata.user.host) : '');
	html += '<li>';
	if (!quote_flg && value.renote) {
		// ���m�[�g�̏ꍇ�̓��m�[�g�w�b�_��\��
		var renote_address = value.user.username + (value.user.host ? ('@' + value.user.host) : '');
		html += '<div class="label_head label_reblog">'
			+ '<span>Renoted by @' + renote_address + '</span>'
			+ '</div>';
	}
	html += '<div class="user">'
		// ���[�U�[�A�J�E���g���
		+ '<img src="' + viewdata.user.avatarUrl + '" class="usericon"/>'
		+ '<h4 class="username">' + replaceEmojiMsky(display_name, viewdata.user.emojis) + '</h4>'
		+ '<a class="userid">@' + user_address + '</a>'
		+ '</div><div class="content">';
	if (viewdata.cw) {
		// CW�e�L�X�g������ꍇCW�{�^����\��
		html += '<a class="expand_header label_cw">' + viewdata.cw + '</a>'
			+ '<div class="main_content cw_content">';
	} else {
		// �Ȃ��ꍇ�͕��ʂɃu���b�N�����
		html += '<div class="main_content">';
	}
	// �{��
	html += replaceEmojiMsky(viewdata.text, viewdata.emojis)
		+ '</div></div>';
	if (quote_flg) {
		// ���p�t���O������ꍇ�͈��p���\��
		html += '<div class="post_quote">'
			+ '<div>' + viewdata.renote.user.name +  '</div>'
			+ '<div>@' + viewdata.renote.user.username +  '</div>'
			+ '<div>' + replaceEmojiMsky(viewdata.renote.text, viewdata.renote.emojis) +  '</div>'
			+ '</div>';
	}
	if (viewdata.files.length > 0) {
		// �Y�t�摜������ꍇ�͉摜��\��
		html += '<div class="media">';
		if (viewdata.files.filter(f => f.isSensitive).length > 0) {
			// �{�����Ӑݒ�̂���ꍇ���܂܂�Ă���ꍇ�͉摜���B��
			html += '<a class="expand_header label_sensitive">�{�����ӂ̉摜������܂�</a>'
				+ '<div class="media_content cw_content">';
		} else if (viewdata.files.length > 4) {
			// �摜�t�@�C����5���ȏ゠��ꍇ���B��
			html += '<a class="expand_header label_cw">�Y�t�摜��5���ȏ゠��܂�</a>'
				+ '<div class="media_content cw_content">';
		} else {
			html += '<div class="media_content">';
		}
		viewdata.files.forEach((media) => {
			html += '<img src="' + media.thumbnailUrl + '" class="media_preview"/>';
		});
		html += '</div></div>';
	}
	html += '<div class="post_footer">'
		+ '<a href="' + viewdata.id + '" target="_blank" class="created_at">' + date + '</a>'
		+ '<a class="buttons option">OPT</a>'
		+ '<a class="buttons favorite">ACT</a>'
		+ '<a class="buttons boost">RN</a>'
		+ '<a class="buttons reply">RP</a>'
		+ '</div></li>';
	return html;
}

/**
 * #Renderer #jQuery
 * Misskey����󂯎�����ʒmJSON��HTML�Ƃ��Đ���
 * 
 * @param array_json API����ԋp���ꂽ���e�z��JSON
 * @param bind_id �o�C���h���ID
 */
function createNotificationMsky(array_json, bind_id) {
	var html = '';
	$.each(array_json, (index, value) => {
		html += createNotificationMskyLine(value);
	});
	$("#columns>table>tbody>tr>#" + bind_id + ">ul").append(html);
}

/**
 * #Renderer #jQuery
 * Misskey����󂯎�����ʒmJSON��HTML�Ƃ��Đ���(1�s����)
 * 
 * @param value ��status JSON
 */
function createNotificationMskyLine(value) {
	var html = '';
	if (value.type == 'achievementEarned') {
		// TODO: ���т͖����I�Ƃ肠�������ʂ̊Ԃ�
		return html;
	}
	var date = yyyymmdd.format(new Date(value.createdAt));
	var display_name = value.user.name ? value.user.name : value.user.username;
	var user_address = value.user.username + (value.user.host ? ('@' + value.user.host) : '');
	html += '<li>';
	// �ʒm�^�C�v�ɂ���ĕ\����ύX
	switch (value.type) {
		case 'reaction': // �G�������A�N�V����
			html += '<div class="label_head label_favorite">'
				+ '<span>ReAction from @' + user_address + '</span>'
				+ '</div>';
			break;
		case 'renote': // ���m�[�g
			html += '<div class="label_head label_reblog">'
				+ '<span>Renoted by @' + user_address + '</span>'
				+ '</div>';
			break;
		case 'follow': // �t�H���[�ʒm
			html += '<div class="label_head label_follow">'
				+ '<span>Followed by @' + user_address + '</span>'
				+ '</div>';
			break;
		default: // ���v���C�̏ꍇ�̓w�b�_�����Ȃ�
			break;
	}
	html += '<div class="user">'
		// ���[�U�[�A�J�E���g���
		+ '<img src="' + value.user.avatarUrl + '" class="usericon"/>'
		+ '<h4 class="username">' + replaceEmojiMsky(display_name, value.user.emojis) + '</h4>'
		+ '<a class="userid">@' + user_address + '</a>'
		+ '</div><div class="content"><div class="main_content">';
		// �{��
	if (value.type == 'renote') {
		// ���m�[�g�̏ꍇ�͓�d�l�X�g���Ă���m�[�g�����ɍs���̏ꍇ�͓��e��\��
		html += replaceEmojiMsky(value.note.renote.text, value.note.renote.emojis);
	} else if (value.type != 'follow' && value.type != 'followRequestAccepted') {
		// �t�H���[�ȊO�̏ꍇ�͓��e��\��
		html += replaceEmojiMsky(value.note.text, value.note.emojis);
	}
	html += '</div></div><div class="post_footer">';
	// �ʒm�^�C�v�ɂ���ĕ\����ύX
	switch (value.type) {
		case 'mention': // ���v���C
			html += '<a href="' + value.note.id + '" target="_blank" class="created_at">' + date + '</a>'
				+ '<a class="buttons option">OPT</a>'
				+ '<a class="buttons favorite">ACT</a>'
				+ '<a class="buttons boost">RN</a>'
				+ '<a class="buttons reply">RP</a>';
			break;
		case 'follow': // �t�H���[�ʒm
		/*
			html += '<div class="created_at">Post: ' + value.account.statuses_count
				+ ' / Follow: ' + value.account.following_count
				+ ' / Follower: ' + value.account.followers_count + '</div>'
				+ '<a class="buttons option">OPT</a>'
				+ '<a class="buttons block">BL</a>'
				+ '<a class="buttons follow">FL</a>';//*/
			break;
		default: // ���C�ɓ���ƃu�[�X�g�͓��t����
			html += '<div class="created_at">' + date + '</a>';
			break;
	}
	html += '</div></li>';
	return html;
}

/**
 * #Renderer #jQuery
 * Misskey�̃e�L�X�g����G�����̃V���[�g�R�[�h���G�����ɕϊ�
 * 
 * @param text �ϊ��Ώۃe�L�X�g
 * @param emojis ���X�|���X�Ɋ܂܂��G�����I�u�W�F�N�g
 */
function replaceEmojiMsky(text, emojis) {
	if (!emojis) { // �G�������Ȃ��ꍇ�͂��̂܂ܕԋp
		return text;
	}
	Object.keys(emojis).forEach((key) => {
		text = text.replace(new RegExp(':' + key + ':', 'g'),
			'<img src="' + emojis[key] + '" class="inline_emoji"/>');
	});
	return text;
}
