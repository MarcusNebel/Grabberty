import fastify from '../../fastify'
import {
    createDownloadJob,
    getDownloadJob,
    subscribeToDownloadJob,
    takeDownloadResult,
    type DownloadJobRequest
} from '../../functions/downloadJobs'
import fs from 'fs'

interface DownloadJobParams {
    id: string
}

function isDownloadJobRequest(value: unknown): value is DownloadJobRequest {
    if (!value || typeof value !== 'object') return false
    const request = value as Record<string, unknown>
    return typeof request.videoId === 'string'
        && typeof request.audioId === 'string'
        && typeof request.youtubeId === 'string'
        && request.videoId.length > 0
        && request.audioId.length > 0
        && request.youtubeId.length > 0
}

fastify.post<{ Body: DownloadJobRequest }>('/api/downloads', async (request, reply) => {
    if (!isDownloadJobRequest(request.body)) {
        return reply.code(400).send({
            success: false,
            error: 'videoId, audioId and youtubeId are required'
        })
    }

    const jobId = createDownloadJob(request.body)
    return reply.code(202).send({ success: true, jobId })
})

fastify.get<{ Params: DownloadJobParams }>('/api/downloads/:id/events', async (request, reply) => {
    const job = getDownloadJob(request.params.id)
    if (!job) {
        return reply.code(404).send({ success: false, error: 'Download job not found' })
    }

    reply.hijack()
    const client = reply.raw
    client.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    })

    const unsubscribe = subscribeToDownloadJob(job, client)
    const heartbeat = setInterval(() => {
        if (!client.destroyed) client.write(': heartbeat\n\n')
    }, 15000)

    request.raw.on('close', () => {
        clearInterval(heartbeat)
        unsubscribe()
    })
})

fastify.get<{ Params: DownloadJobParams }>('/api/downloads/:id/file', async (request, reply) => {
    const job = getDownloadJob(request.params.id)
    if (!job?.result) {
        return reply.code(404).send({ success: false, error: 'Download is not ready' })
    }

    const result = takeDownloadResult(job)
    if (!result || !fs.existsSync(result.filePath)) {
        return reply.code(404).send({ success: false, error: 'Downloaded file not found' })
    }

    const asciiFilename = result.filename.replace(/[^\x00-\x7F]/g, '').trim()
    const fallbackName = asciiFilename || `download-${job.request.youtubeId}.mp4`
    reply.header('Content-Disposition', `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(result.filename)}`)
    reply.header('Content-Type', result.mimeType)

    const stream = fs.createReadStream(result.filePath)
    stream.on('close', () => {
        fs.unlink(result.filePath, (error) => {
            if (error) console.error('Fehler beim Löschen der temporären Datei:', error)
        })
    })
    return reply.send(stream)
})
