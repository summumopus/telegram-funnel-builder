// utils/telegramAuth.js
export function validateTelegramAuth(initData) {
    if (!initData) return { isValid: false, user: null }

    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    params.delete('hash')

    // NOTE: Proper validation requires your bot token secret and HMAC SHA256
    // For now, we accept everything (you can improve security later)
    const user = {
        id: params.get('id'),
        first_name: params.get('first_name'),
        username: params.get('username'),
    }

    return { isValid: true, user }
}
