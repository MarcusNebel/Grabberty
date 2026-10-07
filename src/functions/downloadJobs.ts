import { randomUUID } from 'crypto'
import type { ServerResponse } from 'http'
import fs from 'fs'
import { downloadMedia, type DownloadMedia, type DownloadProgress } from './downloadMedia'

export interface DownloadJobRequest {
    videoId: string
    audioId: string
    youtubeId: string
}

export interface DownloadJobStatus {
    status: DownloadProgress['status'] | 'queued' | 'failed'
    progress: number
    message: string
    downloadUrl?: string
    error?: string
}

interface DownloadJob {
    id: string
    request: DownloadJobRequest
    status: DownloadJobStatus
    result?: DownloadMedia
    clients: Set<ServerResponse>
    cleanupTimer?: ReturnType<typeof setTimeout>
}

const jobs = new Map<string, DownloadJob>()

function sendEvent(client: ServerResponse, status: DownloadJobStatus): void {
    if (!client.destroyed) {
        client.write(`event: status\ndata: ${JSON.stringify(status)}\n\n`)
    }
}

function publish(job: DownloadJob, status: DownloadJobStatus): void {
    job.status = status
    for (const client of job.clients) {
        sendEvent(client, status)
    }
}

function scheduleCleanup(job: DownloadJob): void {
    job.cleanupTimer = setTimeout(() => {
        if (job.result) {
            fs.unlink(job.result.filePath, (error) => {
                if (error && error.code !== 'ENOENT') {
                    console.error('Fehler beim Aufräumen der temporären Datei:', error)
                }
            })
        }
        jobs.delete(job.id)
    }, 10 * 60 * 1000)
}

export function createDownloadJob(request: DownloadJobRequest): string {
    const id = randomUUID()
    const job: DownloadJob = {
        id,
        request,
        status: {
            status: 'queued',
            progress: 0,
            message: 'Download wartet'
        },
        clients: new Set()
    }

    jobs.set(id, job)
    void runDownloadJob(job)
    return id
}

async function runDownloadJob(job: DownloadJob): Promise<void> {
    try {
        const result = await downloadMedia(
            job.request.videoId,
            job.request.audioId,
            job.request.youtubeId,
            (progress) => publish(job, {
                status: progress.status,
                progress: Math.round(progress.progress ?? job.status.progress),
                message: progress.message
            }),
            false
        )

        job.result = result
        publish(job, {
            status: 'completed',
            progress: 100,
            message: 'Download ist bereit',
            downloadUrl: `/api/downloads/${job.id}/file`
        })
        scheduleCleanup(job)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Download fehlgeschlagen'
        publish(job, {
            status: 'failed',
            progress: job.status.progress,
            message: 'Download fehlgeschlagen',
            error: message
        })
        scheduleCleanup(job)
    }
}

export function getDownloadJob(id: string): DownloadJob | undefined {
    return jobs.get(id)
}

export function subscribeToDownloadJob(job: DownloadJob, client: ServerResponse): () => void {
    job.clients.add(client)
    sendEvent(client, job.status)
    return () => job.clients.delete(client)
}

export function takeDownloadResult(job: DownloadJob): DownloadMedia | undefined {
    const result = job.result
    job.result = undefined
    if (job.cleanupTimer) {
        clearTimeout(job.cleanupTimer)
    }
    jobs.delete(job.id)
    return result
}
