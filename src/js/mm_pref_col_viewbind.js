/**
 * #Renderer #jQuery
 * �J�����̃e���v���[�g�𐶐�����
 * ���g�͌����
 * 
 * @param column �J��������JSON
 */
function createColumn(column) {
    // �J��������ID(�V�K�쐬�̏ꍇ�͎���ID�𐶐�)
    const column_uuid = column?.column_id ?? `col_${crypto.randomUUID()}`;
    // �J�����{�̂���̏�ԂŐ���
    $("#columns>table>tbody>tr").append(`
        <td id="${column_uuid}" class="timeline ui-sortable">
            <div class="col_head">
                <h2><input type="text" class="__txt_col_head" value="${column?.label_head ?? ''}"/></h2>
                <div class="col_pref">
                    <input type="text" class="__txt_col_width" value="${column?.col_width ?? ''}" size="5"/>px
                </div>
            </div>
            <div class="col_option">
                <button type="button" class="__btn_add_tl">TL�ǉ�</button>
                <button type="button" class="__btn_del_col">��폜</button><br/>
                <input type="checkbox" id="dh_${column_uuid}" class="__chk_default_hide"${column?.d_hide ? ' checked' : ''}/>
                <label for="dh_${column_uuid}">�f�t�H���g�ŕ���</label><br/>
                <input type="checkbox" id="df_${column_uuid}" class="__chk_default_flex"${column?.d_flex ? ' checked' : ''}/>
                <label for="df_${column_uuid}">�f�t�H���g�ŉϕ��ɂ���</label><br/>
                �J�����J���[:
                #<input type="text" class="__txt_col_color __pull_color_palette" value="${column?.col_color ?? ''}" size="6"/>
            </div>
            <ul></ul>
        </td>
    `);
    // �J�������C�A�E�g��ύX
    if (column?.col_color) {
        $(`#columns>table #${column_uuid}>.col_head`).css("background-color", `#${column.col_color}`);
    }
    if (column?.col_width) {
        $(`#columns>table #${column_uuid}`).css("width", `${column.col_width}px`);
    }
    // �J������UUID��ԋp
    return column_uuid;
}

/**
 * #Renderer #jQuery
 * �^�C�����C���ݒ�JSON��HTML�Ƃ��Đ���
 * 
 * @param array_json �ݒ�JSON
 * @param j �J�����ԍ�
 * @param accounts �A�J�E���g�}�b�v
 */
function createTimelineOptions(col, accounts) {
    let html = '';
    $.each(col.timelines, (index, value) => {
        html += createTimelineOptionLine({
            value: value,
            index: index + 1,
            accounts: accounts
        });
    });
    $(`#columns>table #${col.column_id}>ul`).append(html);
}

/**
 * #Renderer #jQuery
 * �^�C�����C���ݒ��HTML�Ƃ��Đ���(1�s����)
 * 
 * @param value ��status JSON
 * @param index �^�C�����C���ԍ�
 * @param accounts �A�J�E���g�}�b�v
 */
function createTimelineOptionLine(arg) {
    const uuid = crypto.randomUUID();
    let html = `
        <li>
            <h4><span class="tl_header_label">Timeline ${arg.index}</span></h4>
            <div class="tl_option">
                <div class="lbl_disp_account">
                    �\���A�J�E���g:<br/>
                    <select class="__cmb_tl_account">
    `;
    // �A�J�E���g���R���{�{�b�N�X�ɃZ�b�g
    arg.accounts?.forEach((v, k) => html += `
        <option value="${k}"${arg.value?.key_address == k ? ' selected' : ''}>${v.username} - ${k}</option>
    `);
    html += `
                    </select>
                </div>
                <div class="lbl_tl_type">
                    �ǉ�����J�����̎��:<br/>
                    <select class="__cmb_tl_type">
                        <option value="home"${arg.value?.timeline_type == 'home' ? ' selected' : ''}>�z�[��</option>
                        <option value="local"${arg.value?.timeline_type == 'local' ? ' selected' : ''}>���[�J��</option>
                        <option value="federation"${arg.value?.timeline_type == 'federation' ? ' selected' : ''}>�A��</option>
                        <option value="notification"${arg.value?.timeline_type == 'notification' ? ' selected' : ''}>�ʒm</option>
                    </select>
                </div>
                <div class="lbl_checkbox">
                    <input type="checkbox" id="xr_${uuid}" class="__chk_exclude_reblog"${arg.value?.exclude_reblog ? ' checked' : ''}/>
                    <label for="xr_${uuid}">�u�[�X�g/���m�[�g���\��</label>
                </div>
                <div class="foot_button">
                    <button type="button" class="__btn_del_tl">�^�C�����C�����폜</button>
                </div>
            </div>
        </li>
    `;
    return html;
}

/**
 * #Renderer #jQuery
 * �g����{�^���Ǝg���Ȃ��{�^�����Đݒ�
 */
function setButtonPermission() {
    // �^�C�����C����1�̏ꍇ�̓^�C�����C���폜���֎~
    $("#columns>table>tbody>tr>td").each(
        (index, elm) => $(elm).find(".__btn_del_tl").prop("disabled", $(elm).find("li").length == 1));
}
