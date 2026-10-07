import fastify from '../../fastify'
import { downloadMedia } from '../../functions/downloadMedia'

export interface DownloadQuery {
    audioid?: string
    videoid?: string
    youtubeid?: string
}

fastify.get<{ Querystring: DownloadQuery }>('/api/download-media', async (request, reply) => {
    const { audioid, videoid, youtubeid } = request.query

    if(!audioid || !videoid || !youtubeid) {
        reply.code(400).send({
            success: false,
            error: 'Missing audioId or videoId or youtubeId query parameter'
        })
        return
    }

    try {
        const { stream, filename, mimeType } = await downloadMedia(videoid, audioid, youtubeid)

        const asciiFilename = filename.replace(/[^\x00-\x7F]/g, '').trim()
        
        const fallbackName = asciiFilename || `download-${youtubeid}.mp4`

        reply.header('Content-Disposition', `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(filename)}`)
        reply.header('Content-Type', mimeType)

        console.log(`Download finished for ${youtubeid}`)
        return reply.send(stream)
    } catch (error: any) {
        console.error('Error by media download:', error)
        return reply.code(500).send({
            success: false,
            error: error.message || 'Internal Server Error'
        })
    }
})
