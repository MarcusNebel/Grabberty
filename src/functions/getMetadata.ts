import { spawn } from 'child_process'

interface YoutubeMetadata {
    id: string
    title: string
    description?: string

    uploader?: string
    uploader_id?: string
    channel?: string
    channel_id?: string

    duration?: number
    view_count?: number
    like_count?: number

    upload_date?: string
    timestamp?: number

    webpage_url: string

    thumbnail?: string

    videoFormats: VideoFormat[]
    audioFormats: AudioFormat[]
}

interface VideoFormat {
    format_id: string

    ext: string

    width?: number
    height?: number

    resolution?: string

    fps?: number

    vcodec?: string

    filesize?: number
    filesize_approx?: number

    bitrate?: number

    url?: string
}

interface AudioFormat {
    format_id: string

    ext: string

    acodec?: string

    abr?: number
    asr?: number

    filesize?: number
    filesize_approx?: number

    audioQuality?: string

    url?: string
}

export function getMetadata(youtubeId: string): Promise<YoutubeMetadata> {
    return new Promise((resolve, reject) => {
        console.log(`Accepted youtubeId: ${youtubeId}`)

        if (!youtubeId) {
            reject(new Error('No YouTube ID provided'))
        }

        const args = ['--dump-single-json', youtubeId]

        const yt = spawn('yt-dlp', args)

        let outputData = ''
        let errorData = ''

        yt.stdout.on('data', (data) => {
            outputData += data.toString()
        })

        yt.stderr.on('data', (data) => {
            errorData += data.toString()
        })

        yt.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`yt-dlp error: ${errorData}`))
                return
            }

            try {
                const json = JSON.parse(outputData)

                const formats = json.formats ?? []

                const videoFormats: VideoFormat[] = formats
                    .filter(
                        (f: any) =>
                            f.vcodec &&
                            f.vcodec !== 'none' &&
                            f.acodec == 'none'
                    )
                    .map((f: any) => ({
                        format_id: f.format_id,
                        ext: f.ext,
                        width: f.width,
                        height: f.height,
                        resolution: f.resolution,
                        fps: f.fps,
                        vcodec: f.vcodec,
                        filesize: f.filesize,
                        filesize_approx: f.filesize_approx,
                        bitrate: f.tbr,
                        url: f.url
                    }))

                const audioFormats: AudioFormat[] = formats
                    .filter(
                        (f: any) =>
                            f.acodec &&
                            f.acodec !== 'none' &&
                            f.vcodec === 'none'
                    )
                    .map((f: any) => ({
                        format_id: f.format_id,
                        ext: f.ext,
                        acodec: f.acodec,
                        abr: f.abr,
                        asr: f.asr,
                        filesize: f.filesize,
                        filesize_approx: f.filesize_approx,
                        url: f.url
                    }))

                const metadata: YoutubeMetadata = {
                    id: json.id,
                    title: json.title,
                    description: json.description,

                    uploader: json.uploader,
                    uploader_id: json.uploader_id,

                    channel: json.channel,
                    channel_id: json.channel_id,

                    duration: json.duration,

                    view_count: json.view_count,
                    like_count: json.like_count,

                    upload_date: json.upload_date,
                    timestamp: json.timestamp,

                    webpage_url: json.webpage_url,

                    thumbnail: json.thumbnail,

                    videoFormats,
                    audioFormats
                }

                console.log(`Metadata fetched for: ${youtubeId}`)
                resolve(metadata)
            } catch (e) {
                reject(new Error('Could not parse JSON'))
            }
        })
    })
}
