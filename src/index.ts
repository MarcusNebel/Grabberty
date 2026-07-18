import fastify from './fastify'
import './routes/getApiPing'
import './routes/api/getGetMetadata'
import './routes/api/getDownloadMedia'
import './functions/update_yt-dlp'
import { checkYtdlp } from './functions/update_yt-dlp'

console.log('Starting Grabberty')

checkYtdlp()

fastify.listen({ port: 3000, host: '0.0.0.0' }, function (err, address) {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)

    console.log(`Server is now listening for HTTP requests`)
})
