'use strict'

import awaitCordova from '@/utils/awaitCordova'

export default (authToken, livechatUserId) => {
  if (process.env.NODE_ENV === 'development') return new Promise((resolve, _) => resolve())

  return new Promise((resolve, reject) => {
    awaitCordova().then(_ => init(resolve, reject, authToken, livechatUserId))
  })
}

function init (resolve, reject, authToken, livechatUserId) {
  let FCMPlugin = window.FCMPlugin

  FCMPlugin.getTokenAndRegister(authToken, livechatUserId, (succ) => {
    resolve(succ)
  }, (fail) => {
    console.error(fail)
    reject(fail)
  })
}