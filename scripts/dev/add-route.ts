import { fileURLToPath } from 'url'

import inquirer from 'inquirer'
import chalk from 'chalk'
import fs from 'fs/promises'
import path from 'path'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.join(SCRIPT_DIR, '..', '..')
const SRC_PATH = path.join(PROJECT_ROOT, 'src')
const ROUTES_PATH = path.join(SRC_PATH, 'routes')
const INDEX_PATH = path.join(PROJECT_ROOT, 'src', 'index.ts')

console.log(chalk.blue('This script will create a new route.'))

function normalizeRoutePath(value: string) {
    return value.replace(/^\/+|\/+$/g, '')
}

function toPascalCase(value: string) {
    return value
        .split('/')
        .filter(Boolean)
        .map((segment) =>
            segment
                .replace(/^:/, '')
                .replace(/\*/g, 'Any')
                .replace(/[^a-zA-Z0-9]+/g, ' ')
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join('')
        )
        .join('')
}

function toImportPath(fromFile: string, toFile: string) {
    const relativePath = path.relative(path.dirname(fromFile), toFile).split(path.sep).join('/')
    return relativePath.startsWith('.') ? relativePath : `./${relativePath}`
}

function insertImport(existing: string, importLine: string) {
    if (existing.includes(importLine)) {
        return existing
    }

    const lines = existing.split(/\r?\n/)
    let lastImportIndex = -1

    for (let index = 0; index < lines.length; index += 1) {
        if (lines[index]?.startsWith('import ')) {
            lastImportIndex = index
        }
    }

    if (lastImportIndex === -1) {
        return `${importLine}\n${existing}`
    }

    lines.splice(lastImportIndex + 1, 0, importLine)
    return lines.join('\n')
}

async function main(): Promise<void> {
    const answers = await inquirer.prompt<{
        isAPI: boolean
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
        path: string
    }>([
        {
            type: 'confirm',
            name: 'isAPI',
            default: true,
            message: 'Is this an API route?'
        },
        {
            type: 'rawlist',
            name: 'method',
            message: 'What HTTP method should the route use?',
            choices: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            default: 'GET'
        },
        {
            type: 'input',
            name: 'path',
            message: 'Please enter the route path',
            validate: (value: string) => {
                return value.trim().length > 0
                    ? true
                    : 'Route path may not be empty, try again'
            }
        }
    ])

    const routePath = normalizeRoutePath(answers.path)
    const routeUrl = `/${answers.isAPI ? 'api/' : ''}${routePath}`
    const routeStem = toPascalCase(routePath)
    const routeFileName = `${answers.method.toLowerCase()}${routeStem}.ts`
    const routeDirectory = path.join(ROUTES_PATH, answers.isAPI ? 'api' : '')
    const routeFilePath = path.join(routeDirectory, routeFileName)

    await fs.mkdir(routeDirectory, { recursive: true })

    try {
        await fs.access(routeFilePath)
        throw new Error(`Route file already exists: ${routeFilePath}`)
    } catch (err) {
        if (err instanceof Error && err.message.startsWith('Route file already exists:')) {
            throw err
        }
    }

    const fastifyImportPath = toImportPath(routeFilePath, path.join(SRC_PATH, 'fastify'))
    const routeSource = `import fastify from '${fastifyImportPath}'

fastify.${answers.method.toLowerCase()}('${routeUrl}', async () => {
    return {
        success: true
    }
})
`

    await fs.writeFile(routeFilePath, routeSource, 'utf-8')

    const indexImportPath = toImportPath(INDEX_PATH, routeFilePath).replace(/\.ts$/, '')
    const indexFile = await fs.readFile(INDEX_PATH, 'utf-8')
    const updatedIndexFile = insertImport(indexFile, `import './${indexImportPath.replace(/^\.\//, '')}'`)

    if (updatedIndexFile !== indexFile) {
        await fs.writeFile(INDEX_PATH, updatedIndexFile, 'utf-8')
    }
}

try {
    await main()
} catch (err) {
    console.error(err)
    console.log(chalk.red('Something went wrong, please see the error above!'))
    process.exit(1)
}
