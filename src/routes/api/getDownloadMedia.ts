import fastify from '../../fastify'

fastify.get('/api/download-media', async () => {
    return {
        success: true
    }
})
