// ���t�t�H�[�}�b�^�[
const yyyymmdd = new Intl.DateTimeFormat(undefined, {
    year:   'numeric',
    month:  '2-digit',
    day:    '2-digit',
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
})

/**
 * #Renderer #jQuery
 * �J�����̃e���v���[�g�𐶐�����
 * ���g�͌����
 * 
 * @param col_json �J��������JSON
 */
function createColumn(col_json) {
    // �J�����{�̂���̏�ԂŐ���
    let html = '<td id="' + col_json.column_id + '_closed" class="closed_col">'
        + '<div class="col_action"><a class="__on_column_open" title="�J�������J��">'
        + '<img src="resources/ic_right.png" alt="�J�������J��"/></a></div>'
        + '<h2>' + col_json.label_head + '<span></span></h2>'
        + '</td><td id="' + col_json.column_id + '" class="timeline">'
        + '<div class="col_head">'
        + '<h2>' + col_json.label_head + '</h2>'
        + '<h3>' + col_json.label_type + '</h3>'
        + '<div class="col_action">'
        + '<a class="__on_column_close" title="�J���������"><img src="resources/ic_left.png" alt="�J���������"/></a>'
        + '<a class="__on_column_top" title="�g�b�v�ֈړ�"><img src="resources/ic_top.png" alt="�g�b�v�ֈړ�"/></a>'
        + '</div></div><ul></ul></td>';
    $("#columns>table tr").append(html);
    
    // �J�����w�b�_�̐F��ύX
    $("#columns>table #" + col_json.column_id + ">.col_head")
        .css("background-color", "#" + col_json.col_color);
    $("#columns>table #" + col_json.column_id + "_closed")
        .css("background-color", "#" + col_json.col_color);

    // �J�����̕���ύX
    $("#columns>table #" + col_json.column_id).css("width", col_json.col_width + "px");
}

/**
 * #Renderer #jQuery
 * Mastodon��Misskey�̃^�C�����C���f�[�^���\�[�g�}�b�v�\�ȃf�[�^�Ƃ��ĕԂ�
 * 
 * @param arg �p�����[�^�ꊇ�w��JSON
 */
function getIntegratedPost(arg) {
    let binding_key = null;
    let sort_date = null;
    let user_address = null;

    // �v���b�g�t�H�[������
    switch (arg.tl_account.platform) {
        case 'Mastodon': // Mastodon
            binding_key = arg.timeline.timeline_type == 'notification'
                ? 'Mastodon-notification' : 'Mastodon-toot';
            sort_date = arg.data.created_at;
            // ���[�J�������[�g�֌W�Ȃ��A�J�E���g�̃t���A�h���X�𐶐�
            user_address = arg.data.account.acct.match(/@/)
                ? arg.data.account.acct : (arg.data.account.acct + '@' + arg.timeline.host);
            break;
        case 'Misskey': // Misskey
            binding_key = arg.timeline.timeline_type == 'notification'
                ? 'Misskey-notification' : 'Misskey-note';
            sort_date = arg.data.createdAt;
            // ���[�J�������[�g�֌W�Ȃ��A�J�E���g�̃t���A�h���X�𐶐�
            // TODO: ���т�����Ɨ�����̂�Optional�ɂ��Ƃ�
            user_address = arg.data.user?.username + '@'
                + (arg.data.user?.host ? arg.data.user?.host : arg.timeline?.host);
            // URL�𐶐����邽�߂Ƀz�X�g���������Ƀm�[�g�f�[�^�ɂ˂�����
            arg.data.__host_address = arg.timeline?.host;
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
        // �J�������}���`���[�U�[�̏ꍇ�̂ݎ擾�����[�U�[��ݒ�
        'from_address': arg.multi_flg ? arg.timeline.key_address : null,
        'post': arg.data
    };
}

/**
 * #Renderer #jQuery
 * WebSocket����󂯎�����ʒm�����Ƃɓ��e���^�C�����C���ɒǉ�
 * 
 * @param arg �p�����[�^�ꊇ�w��JSON
 * @param keyset ���e���j�[�N�L�[�Z�b�g
 */
function prependPost(arg, cache) {
    const ul = $("#columns>table #" + arg.column_id + ">ul");
    const integrated = getIntegratedPost({
        data: arg.data,
        timeline: arg.timeline,
        tl_account: arg.tl_account,
        multi_flg: arg.multi_flg
    });
    // �d�����Ă��铊�e�����O����
    if (!cache.post_keyset.has(integrated.post_key)) {
        cache.post_keyset.add(integrated.post_key);
        if (ul.find("li").length >= arg.limit) {
            // �^�C�����C���L���b�V�������E�ɓ��B���Ă������납�珇�ɃL���b�V���N���A����
            ul.find("li:last-child").remove();
            // �L�[�Z�b�g�̃L���b�V���������Ƃ�(�d������͂��łɏI����Ă���̂őS�����ł���)
            if (cache.post_keyset.size >= arg.limit) {
                cache.post_keyset.clear();
            }
        }
        ul.prepend(arg.bindFunc(integrated.post, integrated.from_address));
        // ���ǃJ�E���^�[���グ��
        const unread_counter = cache.unread + 1;
        $("#columns>table #" + arg.column_id + "_closed>h2>span").text(unread_counter);
        cache.unread = unread_counter;
        
        const added = ul.find("li:first-child");
        // �A�J�E���g���x���̔w�i��ύX
        added.find(".post_footer>.from_address").css("background-color", "#" + arg.tl_account.acc_color);
        // �ǉ��A�j���[�V����
        added.hide();
        added.show("slide", { direction: "up" }, 180);
    }
}

/**
 * #Renderer #jQuery
 * ����ʒm���^�C�����C���ɒǉ�
 * 
 * @param arg �p�����[�^�ꊇ�w��JSON
 */
function prependInfo(arg) {
    const ul = $("#columns>table #" + arg.column_id + ">ul");
    ul.prepend('<li class="inserted_info">' + arg.text +  '</li>')

    const added = ul.find("li:first-child");
    // �ǉ��A�j���[�V����
    added.hide();
    added.show("slide", { direction: "up" }, 200);
    if (arg.clear) {
        // �C���t�H�ꗗ�������ꍇ��5�b��ɂ��ׂď��ł�����
        const infos = ul.find(".inserted_info");
        (async () => setTimeout(() => ul.find(".inserted_info").remove(), 10000))()
    }
}

/**
 * #Renderer #jQuery
 * �����p�ɐ��`�������e�f�[�^����^�C�����C����DOM�𐶐�
 * 
 * @param array_json �����p�ɐ��`���ꂽ���e�z��JSON
 * @param bind_id �o�C���h���ID
 * @param accounts �A�J�E���g�}�b�v
 */
function createIntegratedTimeline(array_json, bind_id, accounts) {
    let html = '';
    $.each(array_json, (index, value) => {
        // binding_key�ɂ���ČĂяo���֐���ς���
        switch (value.binding_key) {
            case 'Mastodon-toot': // Mastodon-���e�^�C�����C��
                html += createTimelineMastLine(value.post, value.from_address);
                break;
            case 'Mastodon-notification': // Mastodon-�ʒm��
                html += createNotificationMastLine(value.post, value.from_address);
                break;
            case 'Misskey-note': // Misskey-���e�^�C�����C��
                html += createTimelineMskyLine(value.post, value.from_address);
                break;
            case 'Misskey-notification': // Misskey-�ʒm��
                html += createNotificationMskyLine(value.post, value.from_address);
                break;
            default:
                break;
        }
    });
    $("#columns>table #" + bind_id + ">ul").append(html);
    // �t�b�^�̃A�J�E���g���x���ɐF��t����
    $("#columns>table #" + bind_id + ">ul>li>.post_footer>.from_address").each((index, elm) => {
        $(elm).css("background-color", "#" + accounts.get($(elm).attr("name")).acc_color);
    });
}

/*================================================================================================*/

/**
 * #Renderer #jQuery
 * Mastodon����󂯎�����^�C�����C��JSON��HTML�Ƃ��Đ���(1�s����)
 * 
 * @param value ��status JSON
 */
function createTimelineMastLine(value, from_address) {
    let html = '';
    // �u�[�X�g�c�[�g�Ȃ�u�[�X�g����A�ʏ�Ȃ�{�̂��Q�Ɛ�ɂ���
    const viewdata = value.reblog ?? value;
    const date = yyyymmdd.format(new Date(viewdata.created_at));
    const display_name = viewdata.account.display_name ?? viewdata.account.username;
    // Mastdon�̏ꍇURL��data.url���Q�Ƃ���΃I�b�P�[
    html += '<li name="' + viewdata.url + '">';
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
        + '<a class="userid">@' + viewdata.account.acct + '</a>';
    // ���J�͈͂��p�u���b�N�ȊO�̏ꍇ�͎��ʃA�C�R����z�u
    switch (viewdata.visibility) {
        case 'unlisted': // �z�[��
            html += '<img src="resources/ic_unlisted.png" class="visibilityicon"/>';
            break;
        case 'private': // �t�H����
            html += '<img src="resources/ic_followers.png" class="visibilityicon"/>';
            break;
        default:
            break;
    }
    html += '</div><div class="content">';
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
            // �A�X�y�N�g��������N�I�v�V�����Ƃ��Đݒ�
            html += '<a href="' + media.url + '" name="' + media.meta.original.aspect + '" class="__on_media_expand">'
                + '<img src="' + media.preview_url + '" class="media_preview"/></a>';
        });
        html += '</div></div>';
    }
    html += '<div class="post_footer">'
        + '<a class="created_at __on_datelink">' + date + '</a>';
    // �擾�����[�U�[���n����Ă���ꍇ�͎擾�����[�U�[��\��
    if (from_address) {
        html += '<div class="from_address" name="' + from_address + '">From ' + from_address + '</div>';
    }
    html += '</div></li>';
    return html;
}

/**
 * #Renderer #jQuery
 * Mastodon����󂯎�����ʒmJSON��HTML�Ƃ��Đ���(1�s����)
 * 
 * @param value ��status JSON
 */
function createNotificationMastLine(value, from_address) {
    let html = '';
    const date = yyyymmdd.format(new Date(value.created_at));
    const display_name = value.account.display_name ?? value.account.username;
    // Mastdon�̏ꍇURL��data.url���Q�Ƃ���΃I�b�P�[
    html += '<li name="' + value.url + '">';
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
            html += '<a class="created_at __on_datelink">' + date + '</a>';
            break;
        case 'follow': // �t�H���[�ʒm
            html += '<div class="created_at">Post: ' + value.account.statuses_count
                + ' / Follow: ' + value.account.following_count
                + ' / Follower: ' + value.account.followers_count + '</div>';
            break;
        default: // ���C�ɓ���ƃu�[�X�g�͓��t����
            html += '<div class="created_at">' + date + '</div>';
            break;
    }
    // �擾�����[�U�[���n����Ă���ꍇ�͎擾�����[�U�[��\��
    if (from_address) {
        html += '<div class="from_address" name="' + from_address + '">From ' + from_address + '</div>';
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
    if (!text) { // �����̓��͂��Ȃ��ꍇ�͋󕶎���ԋp
        return "";
    }
    emojis.forEach((emoji) => {
        text = text.replace(new RegExp(':' + emoji.shortcode + ':', 'g'),
            '<img src="' + emoji.url + '" class="inline_emoji"/>');
    });
    return text;
}

/*================================================================================================*/

/**
 * #Renderer #jQuery
 * Misskey����󂯎�����^�C�����C��JSON��HTML�Ƃ��Đ���(1�s����)
 * 
 * @param value ��status JSON
 */
function createTimelineMskyLine(value, from_address) {
    let html = '';
    // ���m�[�g�悪����{��������ꍇ�͈��p�t���O�𗧂Ă�
    const quote_flg = value.renote && value.text;
    // ���m�[�g�Ȃ烊�m�[�g����A�ʏ�Ȃ�{�̂��Q�Ɛ�ɂ���
    const viewdata = !quote_flg && value.renote ? value.renote : value;
    const date = yyyymmdd.format(new Date(viewdata.createdAt));
    const display_name = viewdata.user.name ?? viewdata.user.username;
    const user_address = viewdata.user.username + (viewdata.user.host ? ('@' + viewdata.user.host) : '');

    html += '<li name="' + createMisskeyUrl(viewdata, value.__host_address) + '">';
    if (!quote_flg && value.renote) {
        // ���m�[�g�̏ꍇ�̓��m�[�g�w�b�_��\��
        const renote_address = value.user.username + (value.user.host ? ('@' + value.user.host) : '');
        html += '<div class="label_head label_reblog">'
            + '<span>Renoted by @' + renote_address + '</span>'
            + '</div>';
    }
    html += '<div class="user">'
        // ���[�U�[�A�J�E���g���
        + '<img src="' + viewdata.user.avatarUrl + '" class="usericon"/>'
        + '<h4 class="username">' + replaceEmojiMsky(display_name, viewdata.user.emojis) + '</h4>'
        + '<a class="userid">@' + user_address + '</a>';
    // ���J�͈͂��p�u���b�N�ȊO�̏ꍇ�͎��ʃA�C�R����z�u
    switch (viewdata.visibility) {
        case 'home': // �z�[��
            html += '<img src="resources/ic_unlisted.png" class="visibilityicon"/>';
            break;
        case 'followers': // �t�H����
            html += '<img src="resources/ic_followers.png" class="visibilityicon"/>';
            break;
        default:
            break;
    }
    html += '</div><div class="content">';
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
            // �A�X�y�N�g��������N�I�v�V�����Ƃ��Đݒ�
            const aspect = media.properties.width / media.properties.height;
            html += '<a href="' + media.url + '" name="' + aspect + '" class="__on_media_expand">'
                + '<img src="' + media.thumbnailUrl + '" class="media_preview"/></a>';
        });
        html += '</div></div>';
    }
    html += '<div class="post_footer">'
        + '<a class="created_at __on_datelink">' + date + '</a>';
    // �擾�����[�U�[���n����Ă���ꍇ�͎擾�����[�U�[��\��
    if (from_address) {
        html += '<div class="from_address" name="' + from_address + '">From ' + from_address + '</div>';
    }
    html += '</div></li>';
    return html;
}

/**
 * #Renderer #jQuery
 * Misskey����󂯎�����ʒmJSON��HTML�Ƃ��Đ���(1�s����)
 * 
 * @param value ��status JSON
 */
function createNotificationMskyLine(value, from_address) {
    let html = '';
    if (value.type == 'achievementEarned') {
        // TODO: ���т͖����I�Ƃ肠�������ʂ̊Ԃ�
        return html;
    }
    const date = yyyymmdd.format(new Date(value.createdAt));
    const display_name = value.user.name ?? value.user.username;
    const user_address = value.user.username + (value.user.host ? ('@' + value.user.host) : '');

    html += '<li name="' + createMisskeyUrl(value, value.__host_address) + '">';
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
            html += '<a class="created_at __on_datelink">' + date + '</a>';
            break;
        case 'follow': // �t�H���[�ʒm
            // TODO: Misskey�̃t�H���[�ʒm�͈�U�Ȃɂ��\�����Ȃ�
            break;
        default: // ���C�ɓ���ƃu�[�X�g�͓��t����
            html += '<div class="created_at">' + date + '</div>';
            break;
    }
    // �擾�����[�U�[���n����Ă���ꍇ�͎擾�����[�U�[��\��
    if (from_address) {
        html += '<div class="from_address" name="' + from_address + '">From ' + from_address + '</div>';
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
    if (!text) { // �����̓��͂��Ȃ��ꍇ�͋󕶎���ԋp
        return "";
    }
    if (!emojis) { // �G�������Ȃ��ꍇ�͂��̂܂ܕԋp
        return text;
    }
    Object.keys(emojis).forEach((key) => {
        text = text.replace(new RegExp(':' + key + ':', 'g'),
            '<img src="' + emojis[key] + '" class="inline_emoji"/>');
    });
    return text;
}

/**
 * #Renderer #jQuery
 * Misskey�̓��eURL���擾(Mastodon�ƈ���Ĕ��肪�߂�ǂ������̂Ń��\�b�h��)
 * 
 * @param data �Ώۃm�[�g
 * @param host �z�X�g�h���C��
 */
function createMisskeyUrl(data, host) {
    let note_url = null;
    if (!data.uri) {
        // ��������URL�������ĂȂ���Misskey�̃��[�J�����e�Ȃ̂Ŏ��O�Ő���
        // �����ɂ˂����񂾃z�X�g�����g����URL�𐶐�
        note_url = "https://" + host + "/notes/" + data.id;
    } else if (data.user?.instance?.softwareName == "misskey") {
        // URL�������Ă���Misskey�̃m�[�g�̏ꍇ��data.uri�ɎQ�Ɛ��URL�������Ă�
        note_url = data.uri;
    } else {
        // Mastodon�̏ꍇ��data.url�ɎQ�Ɛ��URL�������Ă�
        // TODO: ���ꂾ��Mastodon��Misskey�ȊO�̃v���b�g�t�H�[���ɑΉ��ł��Ȃ��̂Ō�őΉ�
        note_url = data.url;
    }
    return note_url;
}

/*================================================================================================*/

/**
 * #Renderer #jQuery
 * �I���\�ȃA�J�E���g���X�g�𐶐�
 * 
 * @param accounts �A�J�E���g�}�b�v
 */
function createSelectableAccounts(accounts) {
    let html = '<div class="account_list">';
    accounts.forEach((v, k) => {
        html += '<a name="' + k + '" class="__lnk_account_elm">'
            + '<img src="' + v.avatar_url + '" class="user_icon"/>'
            + '<div class="display_name">' + v.username + '</div>'
            + '<div class="user_domain">' + k + '</div>'
            + '</a>';
    });
    html += '</div>';
    return html;
}

/**
 * #Renderer #jQuery
 * ���j���[�ɓ����A�J�E���g���X�g�𐶐�
 * 
 * @param accounts �A�J�E���g�}�b�v
 */
function createContextMenuAccounts(accounts) {
    let html = '';
    accounts.forEach((v, k) => {
        html += '<li name="' + k + '"><div>' + v.username + ' - ' + k + '</div></li>';
    });
    return html;
}

/**
 * #Renderer #jQuery
 * ���v���C�E�B���h�E�̐���
 * 
 * @param arg �p�����[�^�ꊇ�w��JSON
 */
function createReplyColumn(arg) {
    let to_address = null;
    let bindFunc = null;
    switch (arg.platform) {
        case 'Mastodon': // Mastodon
            to_address = '@' + arg.post.account.acct;
            bindFunc = createTimelineMastLine;
            break;
        case 'Misskey': // Misskey
            to_address = '@' + arg.post.user.username + (arg.post.user.host ? ('@' + arg.post.user.host) : '');
            bindFunc = createTimelineMskyLine;
            break;
        default:
            break;
    }
    let html = '<div class="reply_col">'
        + '<h2>From ' + arg.key_address + '</h2>'
        + '<div class="reply_form">'
        + '<input type="hidden" id="__hdn_reply_id" value="' + arg.post.id + '"/>'
        + '<input type="hidden" id="__hdn_reply_account" value="' + arg.key_address + '"/>'
        + '<textarea id="__txt_replyarea" placeholder="(Ctrl+Enter�ł����e�ł��܂�)">' + to_address + ' </textarea>'
        + '<button type="button" id="__on_reply_submit">���e</button>'
        + '</div><div class="timeline"><ul>'
        + bindFunc(arg.post, null)
        + '</ul></div>'
        + '<button type="button" id="__on_reply_close">�~</button>'
        + '</div>';
    return html;
}

/**
 * #Renderer #jQuery
 * �摜�g��E�B���h�E�̐���
 * 
 * @param arg �p�����[�^�ꊇ�w��JSON
 */
function createImageWindow(arg) {
    let html = '<div class="expand_image_col">'
        + '<img src="' + arg.url + '"/>'
        + '</div>';
    $("#header>#pop_extend_column").html(html).show("slide", { direction: "right" }, 100);
    if (arg.image_aspect > arg.window_aspect) {
        // �E�B���h�E�����摜�̂ق��������Ȃ���
        $("#header>#pop_extend_column>.expand_image_col>img")
            .css('width', '80vw').css('height', 'auto');
    } else {
        // �E�B���h�E�����摜�̂ق����c���Ȃ���
        $("#header>#pop_extend_column>.expand_image_col>img")
            .css('height', '80vh').css('width', 'auto');
    }
}