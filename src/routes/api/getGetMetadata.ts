import fastify from '../../fastify'
import { getMetadata } from '../../functions/getMetadata'

fastify.get('/api/get-metadata', async (request, reply) => {
    const rawYoutubeId = request.headers['youtubeid'] ?? request.headers['youtube-id']

    const youtubeId = Array.isArray(rawYoutubeId)
        ? rawYoutubeId[0]
        : rawYoutubeId

    if (!youtubeId) {
        return reply.code(400).send({
            success: false,
            error: 'Missing youtubeId header'
        })
    }

    try {
        const metadata = await getMetadata(youtubeId)

        return {
            success: true,
            metadata
        }
    } catch (error: any) {
        console.error('Error fetching metadata:', error)
        return reply.code(500).send({
            success: false,
            error: error.message || 'Internal Server Error'
        })
    }
})
