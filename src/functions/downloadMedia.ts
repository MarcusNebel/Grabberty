import { spawn } from 'child_process'
import { Readable } from 'stream'
import fs from 'fs'
import path from 'path'

export interface DownloadMedia {
    stream: Readable,       // The filestream to browser
    filename: string,       // Name of the streamed file
    mimeType: string        // for example "audio/mpeg" or "video/mp4"
}

export function downloadMedia(videoId: string, audioId: string, youtubeId: string): Promise<DownloadMedia> {
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
                youtubeId, 
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
                youtubeId, 
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
                youtubeId, 
                '-o', path.join(tmpDir, filenameTemplate)
            ]
        } else {
            return reject(new Error('Can not define for video, audio or both'))
        }

        // 2. Prozess starten mit den dynamisch gesetzten Argumenten
        const yt = spawn('yt-dlp', finalArgs)
        
        let stderrOutput = ''
        let stdoutOutput = ''

        // Fehler-Output erfassen
        yt.stderr?.on('data', (data) => {
            stderrOutput += data.toString()
            console.error('[yt-dlp stderr]', data.toString())
        })
        
        // Standard-Output erfassen
        yt.stdout?.on('data', (data) => {
            stdoutOutput += data.toString()
            console.log('[yt-dlp stdout]', data.toString())
        })

        // Fehler abfangen, falls z.B. yt-dlp nicht gefunden wird
        yt.on('error', (err) => {
            reject(new Error(`Failed to spawn yt-dlp: ${err.message}`))
        })

        // 3. Warten, bis der Download komplett abgeschlossen ist
        yt.on('close', (code) => {
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
            const fileStream = fs.createReadStream(fullPath)

            // Datei nach dem Senden automatisch vom Server löschen
            fileStream.on('close', () => {
                fs.unlink(fullPath, (err) => {
                    if (err) console.error('Fehler beim Löschen der temporären Datei:', err)
                })
            })

            // Versprechen auflösen
            resolve({
                stream: fileStream,
                filename: finalFilename, 
                mimeType: mimeType
            })
        })
    })
}
