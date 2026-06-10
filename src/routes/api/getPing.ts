import fastify from "../../fastify"

fastify.get('/api/ping', async (request, reply) => {
    return { 
        body: 'pong by grabberty-backend' 
    }
})
