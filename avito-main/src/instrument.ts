import * as Sentry from '@sentry/nestjs'

Sentry.init({
    dsn: 'https://898222233b6f717adc2087760f500355@srv-dkr-050002.proit74.ru/2',

    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
})
