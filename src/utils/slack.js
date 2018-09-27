import axios from 'axios'
import { toObject, toPlainString } from './message-template'

export default (err, forceDev) => {
  if ((err && err.code && err.code === 'messaging/notifications-blocked') ||
    (process.env.NODE_ENV === 'development' && !forceDev)) return

  const SLACK_WEBHOOK_URI = 'https://hooks.slack.com/services/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'
  const text = formatError(err)
  const channel = '#front-debug-logs'
  const payload = {
    'username': 'webhookbot',
    'icon_emoji': ':ghost:',
    channel,
    text
  }

  function formatError (payloadError) {
    console.log('type', typeof payloadError)
    console.log('keys', Object.keys(payloadError))
    if (Object.keys(payloadError).length === 0 || typeof payloadError === 'string') return toPlainString(payloadError)

    const { request = {}, response = {}, config = {} } = payloadError

    const payload = {
      requestFormated: JSON.stringify(request, null, 2),
      responseFormated: JSON.stringify(response, null, 2),
      configFormated: JSON.stringify(config, null, 2)
    }

    try {
      if (!('request' in payloadError)) return toPlainString(payloadError)
    } catch (_){
      return toPlainString(payloadError)
    }

    return toObject(response, payload)
  }

  axios.post(SLACK_WEBHOOK_URI, payload, {
    transformRequest: [(data, headers) => {
      delete headers.common.contentType

      return JSON.stringify(data)
    }]
  })
  .catch((sendSlackLoggerError) =>
    console.error('[[ LOGGER ]] Error on logger sender', sendSlackLoggerError)
  )
}
