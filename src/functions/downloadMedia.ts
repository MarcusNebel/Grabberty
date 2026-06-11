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
        console.log(`Accepted youtubeId: ${youtubeId} \nAccepted videoId: ${videoId} \nAccepted audioId: ${audioId}`)

        if (!youtubeId || !videoId || !audioId) {
            return reject(new Error('No YouTube ID, Video ID or Audio ID provided'))
        }

        // 1. Ordner definieren
        const tmpDir = path.join(__dirname, '../../tmp')
        if (!fs.existsSync(tmpDir)){
            fs.mkdirSync(tmpDir, { recursive: true })
        }

        let filename = ''
        let mimeType = ''
        let finalArgs: string[] = []

        // Wichtig: Wir nutzen .%(ext)s im Output-Pfad, damit yt-dlp die korrekte Endung setzt!
        if (videoId !== "0" && audioId !== "0") {
            filename = `${youtubeId}.mp4`
            mimeType = 'video/mp4'
            finalArgs = [
                '-f', `${videoId}+${audioId}`, 
                '--merge-output-format', 'mp4', 
                youtubeId, 
                '-o', path.join(tmpDir, `${youtubeId}.%(ext)s`) // <--- Hier .%(ext)s nutzen
            ]
        } else if (videoId !== "0" && audioId === "0") {
            filename = `video-only-${youtubeId}.mp4`
            mimeType = 'video/mp4'
            finalArgs = [
                '-f', videoId, 
                '--merge-output-format', 'mp4', 
                youtubeId, 
                '-o', path.join(tmpDir, `video-only-${youtubeId}.%(ext)s`)
            ]
        } else if (videoId === "0" && audioId !== "0") {
            filename = `audio-only-${youtubeId}.mp3`
            mimeType = 'audio/mpeg'
            finalArgs = [
                '-f', audioId, 
                '-x', 
                '--audio-format', 'mp3', 
                youtubeId, 
                '-o', path.join(tmpDir, `audio-only-${youtubeId}.%(ext)s`)
            ]
        } else {
            return reject(new Error('Can not define for video, audio or both'))
        }

        // 2. Prozess starten mit den dynamisch gesetzten Argumenten
        const yt = spawn('yt-dlp', finalArgs)

        // Fehler abfangen, falls z.B. yt-dlp nicht gefunden wird
        yt.on('error', (err) => {
            reject(err)
        })

        // 3. Warten, bis der Download komplett abgeschlossen ist
        yt.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`yt-dlp exited with code ${code}`))
            }

            const fullPath = path.join(tmpDir, filename)
            
            // Stream von der Festplatte erstellen
            const fileStream = fs.createReadStream(fullPath)

            // OPTIONAL: Datei nach dem Senden automatisch vom Server löschen
            fileStream.on('close', () => {
                fs.unlink(fullPath, (err) => {
                    if (err) console.error('Fehler beim Löschen der temporären Datei:', err)
                })
            })

            // Versprechen mit dem Stream auflösen
            resolve({
                stream: fileStream,
                filename: filename,
                mimeType: mimeType
            })
        })
    })
}
