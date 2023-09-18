/**
 * #Class
 * �J�X�^���G�������Ǘ�����N���X
 *
 * @autor tizerm@mofu.kemo.no
 */
class Emojis {
    // �R���X�g���N�^: �p�����[�^���g���ď�����(�t�@�C����JSON���Ή�)
    // TODO: �Ƃ肠�������e�ɕt������G��������
    constructor(arg) {
        this.host = arg.host ?? null
        const emoji_list = []
        switch (arg.platform) {
            case 'Mastodon': // Mastodon
                arg.emojis?.forEach(e => emoji_list.push(e))
                break
            case 'Misskey': // Misskey
                if (arg.emojis) Object.keys(arg.emojis).forEach(key => emoji_list.push({
                    shortcode: key,
                    url: arg.emojis[key]
                }))
                break
            default:
                break
        }
        this.list = emoji_list
    }

    /**
     * #Method
     * �����̃e�L�X�g�Ɋ܂܂�Ă���V���[�g�R�[�h���G�����ɒu������
     * 
     * @param text �u���Ώۂ̃e�L�X�g
     */
    replace(text) {
         // �����̓��͂��Ȃ��ꍇ�͋󕶎���ԋp
        if (!text) return ""
        this.list.forEach(emoji => text = text.replace(
            new RegExp(`:${emoji.shortcode}:`, 'g'), `<img src="${emoji.url}" class="inline_emoji"/>`))
        return text
    }
}

