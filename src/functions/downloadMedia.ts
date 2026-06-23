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
            
            let fullPath = ''

            // 1. Schauen wir, ob ffmpeg Video + Audio zusammengefügt hat (wichtig bei HD)
            const mergerLine = lines.find(line => line.includes('[Merger] Merging formats into'))
            
            if (mergerLine) {
                // Holt den Pfad, der zwischen den Anführungszeichen steht
                const match = mergerLine.match(/"([^"]+)"/)
                if (match && match[1]) {
                    fullPath = match[1].trim()
                }
            }

            // 2. Fallback: Falls kein Merger aktiv war (z.B. nur Audio oder nur Video geladen wurde)
            if (!fullPath) {
                const destinationLine = lines.find(line => line.includes('[download] Destination:'))
                if (destinationLine) {
                    fullPath = destinationLine.replace('[download] Destination:', '').trim()
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
