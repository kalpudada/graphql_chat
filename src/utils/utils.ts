import { verify } from 'jsonwebtoken'
import { Context } from '../context'
import { RequestOptions } from 'http'

export const APP_SECRET = process.env.APP_SECRET || 'appsecret321'

interface Token {
    userId: string
}

export function getUserId(context: Context) {
    // console.log(`where_is_my_code_${JSON.stringify(context.req.headers)}`)
    const authHeader = context.req.headers.authorization || '' //req.get('Authorization')
    // console.log(`where_is_header_${authHeader}`)
    if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const verifiedToken = verify(token, APP_SECRET) as Token
        return verifiedToken && Number(verifiedToken.userId)
    } else return 0
}
