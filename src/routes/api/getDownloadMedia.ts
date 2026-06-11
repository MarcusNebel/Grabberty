import fastify from '../../fastify'
import { downloadMedia } from '../../functions/downloadMedia'

fastify.get('/api/download-media', async (request, reply) => {
    const rawAudioId = request.headers['audioid'] ?? request.headers['audio-id']
    const rawVideoId = request.headers['videoid'] ?? request.headers['video-id']
    const rawYoutubeId = request.headers['youtubeid'] ?? request.headers['youtube-id']

    const audioId = Array.isArray(rawAudioId)
        ? rawAudioId[0]
        : rawAudioId

    const videoId = Array.isArray(rawVideoId)
        ? rawVideoId[0]
        : rawVideoId

    const youtubeId = Array.isArray(rawYoutubeId)
        ? rawYoutubeId[0]
        : rawYoutubeId

    console.log(`Audio: ${rawAudioId} \nVideo: ${rawVideoId}`)

    if(!audioId || !videoId || !youtubeId) {
        reply.code(400).send({
            success: false,
            error: 'Missing audioId or videoId or youtubeId header'
        })
        return
    }

    try {
        const { stream, filename, mimeType } = await downloadMedia(videoId, audioId, youtubeId)

        reply.header('Content-Disposition', `attachment; filename="${filename}"`)
        reply.header('Content-Type', mimeType)

        return reply.send(stream)
    } catch (error: any) {
        console.error('Error by media download:', error)
        return reply.code(500).send({
            success: false,
            error: error.message || 'Internal Server Error'
        })
    }
})
