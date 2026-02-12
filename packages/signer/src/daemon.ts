import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..')

// Daemon configuration
export const DAEMON_CONFIG = {
    pidFile: join(ROOT_DIR, 'signer.pid'),
    logFile: join(ROOT_DIR, 'signer.log'),
    errFile: join(ROOT_DIR, 'signer.err.log'),
    get logsDir() {
        return dirname(this.logFile)
    },
}

/**
 * Check if daemon is running
 */
export function isDaemonRunning(): { running: boolean; pid?: number } {
    if (!existsSync(DAEMON_CONFIG.pidFile)) {
        return { running: false }
    }

    try {
        const pid = parseInt(readFileSync(DAEMON_CONFIG.pidFile, 'utf8').trim(), 10)

        // Check if process is actually running
        process.kill(pid, 0) // Signal 0 checks if process exists
        return { running: true, pid }
    } catch {
        // Process not running, clean up stale PID file
        try {
            unlinkSync(DAEMON_CONFIG.pidFile)
        } catch {
            // Ignore errors
        }
        return { running: false }
    }
}

/**
 * Start daemon process
 */
export function startDaemon(args: string[] = []): number {
    const status = isDaemonRunning()
    if (status.running) {
        console.info(`⚠️  Daemon already running (PID: ${status.pid})`)
        return status.pid ?? 0
    }

    // Ensure logs directory exists
    if (!existsSync(DAEMON_CONFIG.logsDir)) {
        mkdirSync(DAEMON_CONFIG.logsDir, { recursive: true })
    }

    // Prepare spawn arguments
    const nodeArgs = [join(__dirname, 'index.js'), '--daemon-child', ...args]

    // Spawn detached process
    const child = spawn(process.execPath, nodeArgs, {
        detached: true,
        stdio: 'ignore',
        env: { ...process.env, IS_DAEMON: 'true' },
    })

    // Detach from parent
    child.unref()

    const pid = child.pid ?? 0

    // Write PID file
    writeFileSync(DAEMON_CONFIG.pidFile, pid.toString(), 'utf8')

    console.info(`✅ Signer daemon started (PID: ${pid})`)
    console.info(`📋 Logs: ${DAEMON_CONFIG.logFile}`)
    console.info(`📋 Errors: ${DAEMON_CONFIG.errFile}`)
    console.info(`\n💡 Use 'pnpm stop' to stop the daemon`)
    console.info(`💡 Use 'pnpm logs' to view logs`)
    console.info(`💡 Use 'pnpm status' to check status`)

    return pid
}

/**
 * Stop daemon process
 */
export function stopDaemon(): boolean {
    const status = isDaemonRunning()

    if (!status.running) {
        console.info('⚠️  Daemon is not running')
        return false
    }

    try {
        process.kill(status.pid ?? 0, 'SIGTERM')

        // Wait for process to exit
        let attempts = 0
        const maxAttempts = 50 // 5 seconds max

        while (attempts < maxAttempts) {
            try {
                process.kill(status.pid ?? 0, 0)
                // Still running, wait
                const delay = 100
                const start = Date.now()
                while (Date.now() - start < delay) {
                    // Busy wait
                }
                attempts++
            } catch {
                // Process has exited
                break
            }
        }

        // Force kill if still running
        if (attempts >= maxAttempts) {
            console.info('⚠️  Process did not exit gracefully, force killing...')
            try {
                process.kill(status.pid ?? 0, 'SIGKILL')
            } catch {
                // Ignore
            }
        }

        // Clean up PID file
        try {
            unlinkSync(DAEMON_CONFIG.pidFile)
        } catch {
            // Ignore
        }

        console.info(`✅ Signer daemon stopped (PID: ${status.pid})`)
        return true
    } catch (err) {
        console.error(`❌ Failed to stop daemon: ${err}`)
        return false
    }
}

/**
 * Restart daemon process
 */
export function restartDaemon(args: string[] = []): number {
    console.info('🔄 Restarting signer daemon...')
    stopDaemon()

    // Wait a bit before restarting
    const delay = 500
    const start = Date.now()
    while (Date.now() - start < delay) {
        // Busy wait
    }

    return startDaemon(args)
}

/**
 * Show daemon status
 */
export function showStatus(): void {
    const status = isDaemonRunning()

    console.info('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.info('  Verbitto Signer Daemon Status')
    console.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (status.running) {
        console.info(`\n✅ Status: RUNNING`)
        console.info(`📍 PID: ${status.pid}`)
        console.info(`📋 Log file: ${DAEMON_CONFIG.logFile}`)
        console.info(`📋 Error file: ${DAEMON_CONFIG.errFile}`)
        console.info(`📁 PID file: ${DAEMON_CONFIG.pidFile}`)

        // Show recent logs
        if (existsSync(DAEMON_CONFIG.logFile)) {
            try {
                const logs = readFileSync(DAEMON_CONFIG.logFile, 'utf8')
                const lines = logs.split('\n').filter(Boolean).slice(-5)
                if (lines.length > 0) {
                    console.info(`\n📄 Recent logs (last ${lines.length} lines):`)
                    console.info('─────────────────────────────────────────')
                    for (const line of lines) {
                        console.info(`  ${line}`)
                    }
                }
            } catch {
                // Ignore
            }
        }
    } else {
        console.info(`\n❌ Status: NOT RUNNING`)
        console.info(`\n💡 Start the daemon with: pnpm start:daemon`)
    }

    console.info('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

/**
 * Setup daemon logging (redirect stdout/stderr to log files)
 */
export async function setupDaemonLogging(): Promise<void> {
    if (!existsSync(DAEMON_CONFIG.logsDir)) {
        mkdirSync(DAEMON_CONFIG.logsDir, { recursive: true })
    }

    const util = await import('node:util')
    const fs = await import('node:fs')

    const logStream = fs.createWriteStream(DAEMON_CONFIG.logFile, { flags: 'a' })
    const errStream = fs.createWriteStream(DAEMON_CONFIG.errFile, { flags: 'a' })

    // Redirect console methods to log files
    console.log = (...args: unknown[]) => {
        const timestamp = new Date().toISOString()
        const message = util.format(...args)
        logStream.write(`[${timestamp}] ${message}\n`)
    }

    console.error = (...args: unknown[]) => {
        const timestamp = new Date().toISOString()
        const message = util.format(...args)
        errStream.write(`[${timestamp}] ${message}\n`)
    }

    // Also redirect uncaught exceptions
    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err)
        process.exit(1)
    })

    process.on('unhandledRejection', (reason) => {
        console.error('Unhandled Rejection:', reason)
        process.exit(1)
    })
}
