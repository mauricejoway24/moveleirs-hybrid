'use strict'

// When true it means Cordova has loaded
let haveCordovaLoad = false

export default () => {
  if (haveCordovaLoad) return new Promise((resolve, _) => { resolve() })

  return new Promise((resolve, reject) => {
    document.addEventListener('deviceready', () => {
      console.log('Cordova has loaded')
      haveCordovaLoad = true
      return resolve()
    }, false)
  })
}