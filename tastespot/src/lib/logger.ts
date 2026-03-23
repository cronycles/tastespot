/**
 * Logger centralizzato.
 * In development: scrive su console (visibile in Metro / Expo DevTools).
 * In production: silenzia i log di debug; gli errori vengono mantenuti (pronti per Sentry in Fase 10).
 */

const isDev = __DEV__

export const logger = {
  /** Informazioni di flusso, solo in development. */
  log(tag: string, ...args: unknown[]): void {
    if (isDev) console.log(`[${tag}]`, ...args)
  },

  /** Warning non critici, visibili in development. */
  warn(tag: string, ...args: unknown[]): void {
    if (isDev) console.warn(`[${tag}]`, ...args)
  },

  /** Errori: sempre loggati (in development su console; in production pronti per Sentry). */
  error(tag: string, ...args: unknown[]): void {
    console.error(`[${tag}]`, ...args)
    // TODO Fase 10: Sentry.captureException(args[0])
  },
}
