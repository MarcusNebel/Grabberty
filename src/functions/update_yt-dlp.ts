import { execSync } from 'child_process'

export function checkYtdlp() {

    function getAvailableVersion() {
        try {
            const availableYtdlpVersions: string = execSync('pip index versions yt-dlp').toString()

            const flexRegex: RegExp = /LATEST:\s*(\S+)/

            const latestAvailableVersion = availableYtdlpVersions.match(flexRegex)

            if (latestAvailableVersion) {
                return latestAvailableVersion[1]
            }

            return null
        } catch (error) {
            console.error('[ERROR][yt-dlp updater] Error by running pip', error)
            return null
        }
    }

    function updatePip() {
        try {
            console.info('[INFO][pip updater] Checking for pip updates ...')

            const pipUpdateLog = execSync('python3 -m pip install --break-system-packages --upgrade pip setuptools wheel').toString()
            console.info('[INFO][pip updater][LOGS]', pipUpdateLog)

            const pipVersion = execSync('python3 -m pip --version').toString().trim()
            console.info('[INFO][pip updater] Pip is now on the newest version:', pipVersion)
        } catch (error) {
            console.error('[ERROR][pip updater] Error by updating pip:', error)
        }
    }

    function isVersionNewer(installed: string, available: string): boolean {
        // From "2026.7.4" to [2026, 7, 4]
        const pInstalled = installed.split('.').map(Number);
        const pAvailable = available.split('.').map(Number);

        const maxLength = Math.max(pInstalled.length, pAvailable.length);

        for (let i = 0; i < maxLength; i++) {
            const vInstalled = pInstalled[i] || 0;
            const vAvailable = pAvailable[i] || 0;

            if (vAvailable > vInstalled) return true;  // Available Version is newer
            if (vAvailable < vInstalled) return false;
        }

        return false;
    }

    function updateYtdlp() {
        try {
            console.info('[INFO][yt-dlp updater] Start updating yt-dlp ...')
            const updateYtdlpLogs = execSync('python3 -m pip install --upgrade --break-system-packages yt-dlp').toString()
            console.info('[INFO][yt-dlp updater][LOGS]', updateYtdlpLogs)
            console.info('[INFO][yt-dlp updater] Yt-dlp updated successfully.')
        } catch (error) {
            console.error('[ERROR][yt-dlp updater] Error by updating yt-dlp', error)
        }
    }


    // update pip to newest version
    updatePip()
    
    // get installed yt-dlp version
    let installedVersion: string = ''

    try {
        const rawVersion = execSync('yt-dlp --version').toString().trim();
        
        // Removes nulls before numbers: "2026.07.04" -> [2026, 7, 4] -> "2026.7.4"
        installedVersion = rawVersion.split('.').map(Number).join('.');
        
        console.info('[INFO][yt-dlp updater] Installed yt-dlp version:', installedVersion);
    } catch (error) {
        console.error('[ERROR][yt-dlp updater] Konnte installierte Version nicht lesen:', error);
    }

    // get newest available yt-dlp version
    const availableVersion: string = getAvailableVersion()?.toString() || ""
    console.info('[INFO][yt-dlp updater] Available yt-dlp version:', availableVersion)

    const isNewer: boolean = isVersionNewer(installedVersion, availableVersion)
    if (isNewer) {
        updateYtdlp()
    } else if (installedVersion === availableVersion && installedVersion !== '') {
        console.info('[INFO][yt-dlp updater] Yt-dlp is already on the newest version.')
    } else {
        console.warn('[WARN][yt-dlp updater] Version check not possible (Missing Data).')
    }
}
