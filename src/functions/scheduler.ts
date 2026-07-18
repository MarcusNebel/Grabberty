import { checkYtdlp } from "./update_yt-dlp";

// Hilfsvariable für 1 Stunde in Millisekunden (1000ms * 60s * 60min)
const ONE_HOUR = 60 * 60 * 1000;

export function scheduler(script: string) {
    console.info('[INFO][Scheduler] Trying to run function:', script, '...');
    
    if (script === 'checkYtdlp') {
        checkYtdlp();
    } else {
        console.error('[ERROR][Scheduler] Function not found:', script);
    }

    // Example for more functions
    // } else if (script === 'anotherFuntion') {
    //     anotherFuntion()
    // }
}

/**
 * Startet die stündliche Wiederholung für ein bestimmtes Skript
 */
export function startHourlyScheduler(script: string) {
    console.info(`[INFO][Scheduler] Hourly task for '${script}' were registered.`);
    
    // 1. Sofort beim Start einmal ausführen
    scheduler(script);

    // 2. Danach alle 60 Minuten wiederholen
    setInterval(() => {
        scheduler(script);
    }, ONE_HOUR);
}