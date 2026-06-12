import Fastify from 'fastify'
import path from 'path'

import RateLimiter from '@fastify/rate-limit'
import fastifyCors from '@fastify/cors'

import meta_raw from '../meta.yml'
import MetaZ from './types/meta.yml.ts'

console.log('Starting Fastify init')

const meta = MetaZ.parse(meta_raw)

if (meta.is_dev) {
    console.log('Setting up CORS rules for dev')
}

const fastify = Fastify({
    logger: {
        file: path.join(process.cwd(), 'logs', 'grabberty-server.log')
    },
    requestTimeout: 5 * 60 * 1000 // 5 minutes für längere yt-dlp operations
})

await fastify.register(RateLimiter, {
    allowList: [],
    max: 50,
    timeWindow: 1000 * 60, // 1 minute
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

// Globaler Error Handler für unbehandelte Fehler
fastify.setErrorHandler((error, request, reply) => {
    console.error('Unhandled error:', error)
    
    // Bereits vom Route-Handler behandelte Fehler skip
    if (reply.statusCode < 400) {
        reply.statusCode = 500
    }
    
    let errorMessage = 'Internal Server Error'
    if (error instanceof Error) {
        errorMessage = error.message
    } else if (typeof error === 'string') {
        errorMessage = error
    }
    
    reply.send({
        success: false,
        error: errorMessage
    })
})

export default fastify
