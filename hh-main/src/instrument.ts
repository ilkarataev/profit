import * as Sentry from '@sentry/nestjs'

Sentry.init({
    dsn: 'https://6f143dd1dad6e8f4e8909da3035d3b70@srv-dkr-050002.proit74.ru/3',

    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
})
