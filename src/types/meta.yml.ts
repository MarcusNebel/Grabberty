import * as z from 'zod'

export default z.object({
    is_dev: z.boolean().meta({
        description: 'Whether this is a Jimce dev build / execution / API state'
    })
})
