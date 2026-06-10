import fastify from '../../fastify'

fastify.get('/api/api/get-metadata', async () => {
    return {
        success: true
    }
})
