import { registerAs } from "@nestjs/config";
import * as url from 'url'

export default registerAs('redis', () => {
    const redisUrl = process.env.REDIS_URL;

    if(redisUrl) {
        const parsed = url.parse(redisUrl);
        const [username,password] = (parsed.auth || '').split(':');

        return {
            host: parsed.hostname,
            port: parseInt(parsed.port || '6379', 10),
            password: password || undefined,
            tls: redisUrl.startsWith('rediss://') ? {} : undefined
        }

    }

    return {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined
    }
})