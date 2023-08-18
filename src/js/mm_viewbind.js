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
		+ '<h4 class="username">' + viewdata.account.display_name + '</h4>'
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
	html += viewdata.content + '</div></div>';
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
		+ '<h4 class="username">' + value.account.display_name + '</h4>'
		+ '<a class="userid">@' + value.account.acct + '</a>'
		+ '</div><div class="content"><div class="main_content">';
		// �{��
	if (value.type == 'follow') {
		// �t�H���[�̏ꍇ�̓��[�U�[�̃v���t��\��
		html += value.account.note;
	} else {
		html += value.status.content;
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
	// ���m�[�g�Ȃ烊�m�[�g����A�ʏ�Ȃ�{�̂��Q�Ɛ�ɂ���
	var viewdata = value.reblog ? value.reblog : value;
	// toot_url = value.uri
	// account_url = (���̂܂܂��ƃA�N�Z�X�ł��Ȃ�)
	var date = yyyymmdd.format(new Date(viewdata.createdAt));
	html += '<li>';
	if (value.reblog) {
		// �u�[�X�g�c�[�g�̏ꍇ�̓u�[�X�g�w�b�_��\��
		html += '<div class="label_head label_reblog">'
			+ '<span>Renoted by @' + value.user.username + '</span>'
			+ '</div>';
	}
	html += '<div class="user">'
		// ���[�U�[�A�J�E���g���
		+ '<img src="' + viewdata.user.avatarUrl + '" class="usericon"/>'
		+ '<h4 class="username">' + viewdata.user.name + '</h4>'
		+ '<a class="userid">@' + viewdata.user.username + '</a>'
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
	html += viewdata.text + '</div></div>';
	// TODO: �摜�Y�t����U�ۗ�
	/*
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
	}//*/
	html += '<div class="post_footer">'
		+ '<a href="' + viewdata.uri + '" target="_blank" class="created_at">' + date + '</a>'
		+ '<a class="buttons option">OPT</a>'
		+ '<a class="buttons favorite">FAV</a>'
		+ '<a class="buttons boost">BT</a>'
		+ '<a class="buttons reply">RP</a>'
		+ '</div></li>';
	return html;
}
