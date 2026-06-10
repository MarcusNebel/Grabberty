import fastify from '../fastify'
import * as z from 'zod'

fastify.get(
    '*',
    {
        schema: {
            response: {
                404: z.string().meta({
                    description: '404 Not Found error message or page.'
                })
            }
        }
    },
    (req, res) => {
        res.status(404)
        res.send('This page does not exist.')
    }
)
