import Fastify from 'fastify'
import path from 'path'

import RateLimiter from '@fastify/rate-limit'
import fastifyCors from '@fastify/cors'

import meta_raw from '../meta.yml'
import MetaZ from './types/meta.yml.ts'

console.log('Starting Fastify init')

const meta = MetaZ.parse(meta_raw)

if(meta.is_dev) {
    console.log('Setting up CORS rules for dev')
}

const fastify = Fastify({
    logger: {
        file: path.join(process.cwd(), 'logs', 'grabberty-server.log')
    }
})

await fastify.register(RateLimiter, {
    allowList: [],
    max: 50,
    timeWindow: 1000 * 60 // 1 minute
})

// Set up CORS in dev mode
if (meta.is_dev) {
    await fastify.register(fastifyCors, {
        origin: '*',
        methods: [
            'GET',
            'POST',
            'PUT',
            'OPTIONS',
            'HEAD',
            'PATCH',
            'DELETE',
            'TRACE'
        ]
    })
}

export default fastify