/**
 * #Renderer #jQuery
 * �g�[�X�g��\��
 * 
 * @param text �\�����镶��
 * @param type �g�[�X�g�̃^�C�v
 */
function toast(text, type) {
    const toast = $("#header>#pop_toast");
    if (type == 'hide') { // toast�폜
        toast.css('visibility', 'hidden');
        return;
    }
    toast.html('<span>' + text + '</span>');
    if (type != 'progress') {
        // ���s���g�[�X�g�ȊO��3�b��ɏ�������
        if (type == 'error') {
            toast.css("background-color", "rgba(115,68,68,0.85)");
        } else {
            toast.css("background-color", "rgba(68,83,115,0.85)");
        }
        (async () => setTimeout(() => toast.css('visibility', 'hidden'), 3000))()
    } else {
        // ���s���͏����J���[�ɂ��ǂ�
        toast.css("background-color", "rgba(32,32,32,0.85)");
    }
    toast.css('visibility', 'visible');
}