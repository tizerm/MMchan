/**
 * #Renderer #jQuery #TemplateLiteral
 * ����ʒm���^�C�����C���ɒǉ�
 * 
 * @param arg �p�����[�^�ꊇ�w��JSON
 */
function prependInfo(arg) {
    const ul = $(`#columns>table #${arg.column_id}>ul`);
    ul.prepend(`<li class="inserted_info">${arg.text}</li>`)

    const added = ul.find("li:first-child");
    // �ǉ��A�j���[�V����
    added.hide().show("slide", { direction: "up" }, 200);
    if (arg.clear) {
        // �C���t�H�ꗗ�������ꍇ��5�b��ɂ��ׂď��ł�����
        const infos = ul.find(".inserted_info");
        (async () => setTimeout(() => ul.find(".inserted_info").remove(), 10000))()
    }
}

/**
 * #Renderer #jQuery
 * �ʒm�E�B���h�E�ɒʒm��ǉ�
 * 
 * @param text �ʒm�e�L�X�g
 * @param error_flg �G���[�̏ꍇ��true
 */
function prependNotification(text, error_flg) {
    const ymd = Status.DATE_FORMATTER.format(new Date());
    $("#pop_notification_console").prepend(
        `${error_flg ? '<span class="console_error">' : '<span>'}${ymd}@${error_flg ? 'ERR' : 'INF'}: ${text}</span><br/>`);
    const count = Number($(".__on_show_notifications").text()) + 1;
    $(".__on_show_notifications").text(count);
}

