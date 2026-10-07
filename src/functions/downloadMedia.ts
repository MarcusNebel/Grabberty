import { spawn } from 'child_process'
import { Readable } from 'stream'
import fs from 'fs'
import path from 'path'

export interface DownloadMedia {
    stream: Readable,       // The filestream to browser
    filename: string,       // Name of the streamed file
    mimeType: string        // for example "audio/mpeg" or "video/mp4"
    filePath: string
}

export interface DownloadProgress {
    status: 'starting' | 'downloading' | 'converting' | 'completed'
    progress?: number
    message: string
}

export function downloadMedia(
    videoId: string,
    audioId: string,
    youtubeId: string,
    onProgress?: (progress: DownloadProgress) => void,
    createStream = true
): Promise<DownloadMedia> {
    return new Promise((resolve, reject) => {
        if (!youtubeId || !videoId || !audioId) {
            return reject(new Error('No YouTube ID, Video ID or Audio ID provided'))
        }

        // define tmp folder
        const tmpDir = path.join(__dirname, '../../tmp')
        if (!fs.existsSync(tmpDir)){
            fs.mkdirSync(tmpDir, { recursive: true })
        }

        // --- COOKIES CONFIGURATION ---
        const cookiesPath = '/app/cookies.txt'
        const useCookies = fs.existsSync(cookiesPath)
        if (!useCookies) {
            console.warn(`[Grabberty] Warning: No cookies found under ${cookiesPath}. Continuing without cookies...`)
        }
        // -----------------------------

        let filenameTemplate = ''
        let mimeType = ''
        let finalArgs: string[] = []
        let outputPrefix = ''

        //  base arguments for yt-dlp downloads
        const baseArgs = [
            '--js-runtimes', 'node',
            '--remote-components', 'ejs:github',
            '--extractor-args', 'youtube:player-client=web_embedded',
        ]

        if (useCookies) {
            baseArgs.push('--cookies', cookiesPath)
        }

        if (videoId !== "0" && audioId !== "0") {
            filenameTemplate = `%(title)s.%(ext)s`
            outputPrefix = ''
            mimeType = 'video/mp4'
            finalArgs = [
                '-f', `${videoId}+${audioId}`, 
                '--merge-output-format', 'mp4', 
                ...baseArgs,
                `https://www.youtube.com/watch?v=${youtubeId}`, 
                '-o', path.join(tmpDir, filenameTemplate)
            ]
        } else if (videoId !== "0" && audioId === "0") {
            filenameTemplate = `video-only-%(title)s.%(ext)s`
            outputPrefix = 'video-only-'
            mimeType = 'video/mp4'
            finalArgs = [
                '-f', videoId, 
                '--merge-output-format', 'mp4', 
                ...baseArgs,
                `https://www.youtube.com/watch?v=${youtubeId}`, 
                '-o', path.join(tmpDir, filenameTemplate)
            ]
        } else if (videoId === "0" && audioId !== "0") {
            filenameTemplate = `audio-only-%(title)s.%(ext)s`
            outputPrefix = 'audio-only-'
            mimeType = 'audio/mpeg'
            finalArgs = [
                '-f', audioId, 
                '-x', 
                '--audio-format', 'mp3', 
                ...baseArgs,
                `https://www.youtube.com/watch?v=${youtubeId}`, 
                '-o', path.join(tmpDir, filenameTemplate)
            ]
        } else {
            return reject(new Error('Can not define for video, audio or both'))
        }

        onProgress?.({
            status: 'starting',
            progress: 0,
            message: 'Download wird gestartet'
        })

        // 2. Prozess starten mit den dynamisch gesetzten Argumenten
        const yt = spawn('yt-dlp', [
            ...finalArgs.slice(0, finalArgs.length - 2),
            '--newline',
            '--progress-template', 'download:%(progress._percent_str)s|%(progress.status)s',
            ...finalArgs.slice(-2)
        ])
        
        let stderrOutput = ''
        let stdoutOutput = ''
        let stdoutBuffer = ''
        let stderrBuffer = ''

        const handleOutput = (output: string): void => {
            for (const line of output.split(/\r\n|\n|\r/)) {
                const progressMatch = line.match(/(?:^|\[download\]\s*)download:\s*([\d.]+)%\|(\w+)/)
                    ?? line.match(/\[download\]\s+([\d.]+(?:\.\d+)?)%/)
                    ?? line.match(/^\s*([\d.]+(?:\.\d+)?)%\|(\w+)/)
                if (progressMatch?.[1]) {
                    const rawProgress = Number.parseFloat(progressMatch[1])
                    if (!Number.isFinite(rawProgress)) {
                        continue
                    }

                    onProgress?.({
                        status: 'downloading',
                        progress: Math.min(85, rawProgress * 0.85),
                        message: `Download läuft (${rawProgress.toFixed(1)} %)`
                    })
                }

                if (line.includes('[ExtractAudio]')) {
                    onProgress?.({
                        status: 'converting',
                        progress: 90,
                        message: 'Audio wird konvertiert'
                    })
                }
            }
        }

        const handleChunk = (
            data: Buffer,
            stream: 'stdout' | 'stderr'
        ): void => {
            const output = data.toString()
            if (stream === 'stdout') {
                stdoutOutput += output
                stdoutBuffer += output
                console.log('[yt-dlp stdout]', output)
                const lines = stdoutBuffer.split(/\r\n|\n|\r/)
                stdoutBuffer = lines.pop() ?? ''
                handleOutput(lines.join('\n'))
            } else {
                stderrOutput += output
                stderrBuffer += output
                console.error('[yt-dlp stderr]', output)
                const lines = stderrBuffer.split(/\r\n|\n|\r/)
                stderrBuffer = lines.pop() ?? ''
                handleOutput(lines.join('\n'))
            }
        }

        // Fehler-Output erfassen
        yt.stderr?.on('data', (data) => {
            handleChunk(data, 'stderr')
        })
        
        // Standard-Output erfassen
        yt.stdout?.on('data', (data) => {
            handleChunk(data, 'stdout')
        })

        // Fehler abfangen, falls z.B. yt-dlp nicht gefunden wird
        yt.on('error', (err) => {
            reject(new Error(`Failed to spawn yt-dlp: ${err.message}`))
        })

        // 3. Warten, bis der Download komplett abgeschlossen ist
        yt.on('close', (code) => {
            handleOutput(stdoutBuffer)
            handleOutput(stderrBuffer)

            if (code !== 0) {
                const errorMsg = stderrOutput || stdoutOutput || 'No error message from yt-dlp'
                return reject(new Error(`yt-dlp exited with code ${code}: ${errorMsg}`))
            }

            // Holt alle Zeilen aus der Standardausgabe
            const lines = stdoutOutput.split('\n')
            
            const candidatePaths: string[] = []

            for (const line of lines) {
                const mergerMatch = line.match(/\[Merger\]\s+Merging formats into\s+"([^"]+)"/)
                if (mergerMatch?.[1]) {
                    candidatePaths.push(mergerMatch[1].trim())
                }

                const downloadDestinationMatch = line.match(/\[download\]\s+Destination:\s+(.+)/)
                if (downloadDestinationMatch?.[1]) {
                    candidatePaths.push(downloadDestinationMatch[1].trim())
                }

                const extractAudioDestinationMatch = line.match(/\[ExtractAudio\]\s+Destination:\s+(.+)/)
                if (extractAudioDestinationMatch?.[1]) {
                    candidatePaths.push(extractAudioDestinationMatch[1].trim())
                }

                const alreadyDownloadedMatch = line.match(/\[download\]\s+(.+?)\s+has already been downloaded/)
                if (alreadyDownloadedMatch?.[1]) {
                    candidatePaths.push(alreadyDownloadedMatch[1].trim())
                }
            }

            let fullPath = ''
            for (let i = candidatePaths.length - 1; i >= 0; i--) {
                const candidate = candidatePaths[i]
                if (!candidate) {
                    continue
                }

                if (fs.existsSync(candidate)) {
                    fullPath = candidate
                    break
                }

                // Falls zuerst die Zwischen-Datei (.m4a) erkannt wurde, pruefe den finalen mp3-Pfad.
                if (path.extname(candidate).toLowerCase() === '.m4a') {
                    const asMp3 = candidate.replace(/\.m4a$/i, '.mp3')
                    if (fs.existsSync(asMp3)) {
                        fullPath = asMp3
                        break
                    }
                }
            }

            if (!fullPath) {
                // Letzter Fallback: passende Datei aus tmp suchen, falls yt-dlp keinen eindeutigen Pfad ausgegeben hat.
                const expectedExtensions = mimeType === 'audio/mpeg'
                    ? ['.mp3', '.m4a', '.webm']
                    : ['.mp4', '.mkv', '.webm']

                const fallbackFiles = fs.readdirSync(tmpDir)
                    .filter(file => !outputPrefix || file.startsWith(outputPrefix))
                    .filter(file => expectedExtensions.includes(path.extname(file).toLowerCase()))
                    .map(file => ({
                        file,
                        mtimeMs: fs.statSync(path.join(tmpDir, file)).mtimeMs
                    }))
                    .sort((a, b) => b.mtimeMs - a.mtimeMs)

                if (fallbackFiles[0]) {
                    fullPath = path.join(tmpDir, fallbackFiles[0].file)
                }
            }

            // Sicherheitscheck: Haben wir den Pfad gefunden und existiert die Datei?
            if (!fullPath || !fs.existsSync(fullPath)) {
                return reject(new Error(`Datei wurde von yt-dlp nicht gefunden. Ermittelter Pfad: ${fullPath || 'Unbekannt'}`))
            }
            
            // Extrahiert den reinen Dateinamen für den Browser
            const finalFilename = path.basename(fullPath)
            
            // Stream von der echten Festplattendatei erstellen
            const fileStream = createStream ? fs.createReadStream(fullPath) : Readable.from([])

            // Datei nach dem Senden automatisch vom Server löschen
            if (createStream) {
                fileStream.on('close', () => {
                    fs.unlink(fullPath, (err) => {
                        if (err) console.error('Fehler beim Löschen der temporären Datei:', err)
                    })
                })
            }

            // Versprechen auflösen
            resolve({
                stream: fileStream,
                filename: finalFilename, 
                mimeType: mimeType,
                filePath: fullPath
            })
        })
    })
}
