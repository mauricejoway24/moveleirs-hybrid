import Vue from 'vue'
import Vuex from 'vuex'
import auth from './utils/auth'
import router from './router'
import persistence from './utils/persistence'
import sendSlackMessage from './utils/slack'
import { default as connectHub, 
  activeConnection, 
  timeoutReconnect,
  cleanActiveConnection
} from './utils/hub'

import { 
  START_CONNECTION, 
  SEND_BUFFER_MESSAGE,
  SEND_BULK,
  ON_CONNECT,
  END_CHAT,
  SET_USER_DATA,
  SET_FULLSCREEN_LOADING_VISIBLE,
  SIGN_OUT,
  HUB_USER_IS_TYPING,
  HUB_USER_IS_NOT_TYPING,
  TYPING_START
} from '@/mutationTypes'

import { 
  ACTIVE_CHANNELS,
  PERMISSION,
  CURRENT_USERNAME,
  CURRENT_STATUS,
  CURRENT_CHANNEL_ID,
  ALERT_ON_CHANNEL,
  CHANGE_STATUS,
  ALL_MESSAGES,
  GET_USER_ID,
  FULLSCREEN_LOADING_VISIBLE,
  ACTIVE_CHANNEL
} from '@/getterTypes'

Vue.use(Vuex)

// Mutations

export const PERMISSION_GRANTED = 'permissionGranted'

export const JOIN_NEW_CHANNEL = 'JoinNewChannel'
export const SHOW_FLASH_MESSAGE = 'showFlashMessage'
export const FLASH_TYPE = 'flashType'
export const FLASH_MESSAGE = 'flashMessage'
export const NEW_CHANNEL_REGISTRY = 'NewChannelRegistry'
export const SET_TYPING_STATE = 'SetTypingState'
export const CHANGE_CHANNEL = 'CHANGE_CHANNEL'
export const SET_CURRENT_STORE = 'SET_CURRENT_STORE'
export const UPLOAD_FILE = 'UPLOAD_FILE'
export const SEND_MESSAGE = 'SEND_MESSAGE'
export const EDIT_USER_INFO = 'EDIT_USER_INFO'
export const SEND_CUSTOMER_INTEGRATION = 'SEND_CUSTOMER_INTEGRATION'

export const GET_CUSTOMER_PROFILE = 'GET_CUSTOMER_PROFILE'

export const AGENT_HAS_ACCEPTED = 'AGENT_HAS_ACCEPTED'
export const UPDATE_CHANNEL_LIST = 'UPDATE_CHANNEL_LIST'
export const CHAT_HAS_ENDED = 'CHAT_HAS_ENDED'
export const INVALID_CHANNEL = 'INVALID_CHANNEL'
export const ON_DISCONNECT = 'OnDisconnect'

const TYPING_MESSAGE = 'TYPING_MESSAGE'

// Hub messages
export const HUB_GET_CUSTOMER_PROFILE = 'GetCustomerProfile'
export const CUSTOMER_END_CHAT = 'CustomerEndChat'
export const ON_RECONNECT = 'OnReconnect'
export const HUB_SEND_MESSAGE = 'Send'
export const USERS_JOINED = 'UsersJoined'
export const TRYING_FIND_AGENT = 'TryingFindAgent'
export const ALREADY_TAKEN = 'ALREADY_TAKEN'
export const CUSTOMER_INTEGRATION_SENT = 'CUSTOMER_INTEGRATION_SENT'
export const HUB_EDIT_CUSTOMER_PROFILE = 'EditCustomerProfile'
export const EDIT_CUSTOMER_PROFILE_SAVED = 'EDIT_CUSTOMER_PROFILE_SAVED'
export const DISPATCH_ALERT = 'DISPATCH_ALERT'
export const GET_LAST_MESSAGES = 'GetLastMessages'

const HUB_SEND_CUSTOMER_INTEGRATION = 'SendCustomerWebhookIntegration'

const HUB_TYPING_MESSAGE = 'PushTyping'
const NEW_GROUP_MESSAGE = 'NEW_GROUP_MESSAGE'

// store typing timeout status
let typingTimeout = null

// TODO: Change everything to const values
const state = {
  currentStatus: 'available',
  bufferMessage: '',
  isOnline: true,
  appInPause: false,
  isConnected: false,
  channels: [],
  messages: [],
  customerState: {
    isCustomerTyping: false,
    customerName: ''
  },
  currentStoreId: () => persistence.getCurrentStore(),
  currentToken: () => auth.getToken(),
  [PERMISSION_GRANTED]: true,
  [CURRENT_CHANNEL_ID]: '',
  [FLASH_TYPE]: 'success',
  [FLASH_MESSAGE]: '',
  [ALERT_ON_CHANNEL]: [],
  [FULLSCREEN_LOADING_VISIBLE]: false
}

const getters = {
  [PERMISSION]: state => state[PERMISSION_GRANTED],
  [ACTIVE_CHANNELS]: state => state.channels,
  [GET_USER_ID]: state => auth.getLivechatId(),
  [CURRENT_CHANNEL_ID]: state => state[CURRENT_CHANNEL_ID],
  [ALL_MESSAGES]: state => state.messages,
  [CURRENT_USERNAME]: state => auth.getUsername(),
  [CURRENT_STATUS]: state => state.currentStatus,
  [SHOW_FLASH_MESSAGE]: state => !state.isOnline,
  [FLASH_TYPE]: state => state.flashType,
  [FLASH_MESSAGE]: state => state.flashMessage,
  [ALERT_ON_CHANNEL]: state => state[ALERT_ON_CHANNEL],
  [FULLSCREEN_LOADING_VISIBLE]: state => state[FULLSCREEN_LOADING_VISIBLE],
  [ACTIVE_CHANNEL]: state => {
    let currentId = state[CURRENT_CHANNEL_ID]

    if (state.channels.length === 0) {
      return {}
    }

    let currentChannel = state.channels.filter(t => t.id === currentId)

    if (currentChannel.length === 0) return {};

    return currentChannel[0]
  }
}

const store = new Vuex.Store({
  mutations: {
    [CHANGE_STATUS] (state, status) {
      if (state !== state.currentStatus) {
        state.currentStatus = status
      }
    },

    [SIGN_OUT] (state) {
      removeAuthData(this)
    },

    [START_CONNECTION] (state, forceConnection) {
      console.log('starting connection')
      if (forceConnection) {
        state.tryingToConnect = false
      }

      let callback = () => {
        console.log('changing connection state', activeConnection.connection.connectionState)
        state.isConnected = activeConnection.connection.connectionState === 1
      }

      connectHub(state, store, callback)
    },

    [SET_USER_DATA] (state, data) {
      state.userId = data.livechatUserId
      state.username = data.username
      state.token = data.token
      state.livechatUserId = data.livechatUserId

      auth.setAuthData(data)
    },

    [JOIN_NEW_CHANNEL] (state, channelId) {
      if (!channelId) {
        Vue.notify.swal({
          title: 'Hum...',
          text: 'Canal inválido. Tente recarregar a página.',
          icon: 'error',
          buttons: ['Ok'],
          timer: 10000
        })

        return
      }

      console.log('Active connection:', activeConnection, 'IsOnline: ', state.isOnline)

      if (!activeConnection || activeConnection.connection.connectionState === 2) {
        console.log('Waiting for connection state 2', activeConnection)

        let disconnectCallback = () => {
          console.log('Calling not active connection callback', activeConnection)
          store.commit(JOIN_NEW_CHANNEL, channelId)
          // activeConnection
          //   .invoke(JOIN_NEW_CHANNEL, channelId)
          //   .catch(err => sendSlackMessage(err))
        }

        return connectHub(state, store, disconnectCallback)
      }

      if (activeConnection && activeConnection.connection.connectionState === 1) {
        console.log('Waiting for connection', activeConnection)

        let waitForConnection = () => {
          activeConnection
            .invoke(JOIN_NEW_CHANNEL, channelId)
            .catch(_ => {
              setTimeout(() => {
                waitForConnection()
              }, 2000)
            })
        }

        return waitForConnection()
      }

      activeConnection
        .invoke(JOIN_NEW_CHANNEL, channelId)
        .catch(err => {
          // sendSlackMessage(err)
          console.error('Waiting for connection state === 0', err)

          let callback = () => {
            activeConnection
              .invoke(JOIN_NEW_CHANNEL, channelId)
              .catch(_ => {
                setTimeout(() => {
                  callback()
                }, 2000)
              })
          }

          return callback()
        })
    },

    [GET_CUSTOMER_PROFILE] (state) {
      Vue.notify.swal({
        title: 'Informações do usuário',
        html: 'Carregando as informações.',
        showConfirmButton: false,
        onOpen: function () {
          Vue.notify.$swal().showLoading()

          activeConnection
            .invoke(HUB_GET_CUSTOMER_PROFILE, state.currentChannelId)
            .catch(err => {
              sendSlackMessage(err)
            })
        }
      })
    },

    [ON_RECONNECT] (state) {
      state.flashMessage = 'Conectando ao servidor. Aguarde um momento ;)'
      state.isOnline = false
      state.flashType = 'success'
    },

    [ON_DISCONNECT] (state, callback) {
      let connectionTimeoutCounter = timeoutReconnect

      if (state.tryingToConnect) {
        console.info('ON_DISCONNECT quitting...')
        return
      }

      state.isOnline = false
      state.flashMessage = `A conexão falhou. Tentando reconectar-se em ${connectionTimeoutCounter}`
      state.flashType = 'warn'

      const timeoutFunc = () => {
        connectionTimeoutCounter--

        if (connectionTimeoutCounter <= 0) {
          connectHub(state, store, callback)
          return
        }

        state.flashMessage = `A conexão falhou. Tentando reconectar-se em ${connectionTimeoutCounter}`

        setTimeout(timeoutFunc, 1000)
      }

      setTimeout(timeoutFunc, 1000)
    },

    [ACTIVE_CHANNELS] (state, channels) {
      this.commit(UPDATE_CHANNEL_LIST, channels)

      if (channels.length > 0) {
        store.commit(NEW_CHANNEL_REGISTRY, channels[0].id)
      }
    },

    [UPDATE_CHANNEL_LIST] (state, channels) {
      state.channels = channels
    },

    [NEW_CHANNEL_REGISTRY] (state, channelId) {
      state.currentChannelId = channelId

      state[ALERT_ON_CHANNEL] = state[ALERT_ON_CHANNEL]
        .filter(id => id !== channelId)

      activeConnection
        .invoke(GET_LAST_MESSAGES, channelId)
        .catch(err => {
          sendSlackMessage(err)
        })
    },

    [SET_TYPING_STATE] (state, data) {
      if (data.channelId !== state[CURRENT_CHANNEL_ID]) return
      state['customerState'] = {
        isCustomerTyping: true,
        customerName: data.fromName
      }
      setTimeout(() => {
        state['customerState'] = {
          isCustomerTyping: false,
          customerName: ''
        }
      }, 2000)
    },

    [SEND_BULK] (state, messages) {
      state.messages = []

      messages.map(message => {
        state.messages.push({
          id: message.id,
          userId: message.fromConnectionId,
          userName: message.fromName,
          livechatUserId: message.livechatUserId,
          content: message.message,
          sentAt: message.createdAt,
          elements: message.elements
        })
      })
    },

    [ON_CONNECT] (state, hub) {
      state.isOnline = true
      state.flashMessage = ''

      // Force firebase send a new token to the server
      // let firebase = new FirebaseHandler()
      // firebase.getToken(true)
    },

    [SEND_BUFFER_MESSAGE] (state, content) {
      if (typeof content === 'string') {
        state.bufferMessage = content
        this.commit(TYPING_MESSAGE)
        return
      }

      state.bufferMessage = content.message
      this.commit(SEND_MESSAGE)
    },

    [SEND_MESSAGE] (state, content) {
      if (content && content.length > 0) return

      if (state.bufferMessage.length === 0) return

      let messagePack = {
        fromConnectionId: auth.getLivechatId(),
        channelId: state.currentChannelId,
        livechatUserId: state.userId,
        fromName: state.username || auth.getUsername(),
        message: state.bufferMessage,
        elements: []
      }

      activeConnection
        .invoke('SendGroupMessage', messagePack)
        .catch(err => console.error(err))

      state.bufferMessage = ''

      this.commit(TYPING_MESSAGE)
    },

    [TYPING_MESSAGE] (state) {
      let pushTyping = {
        channelId: state.currentChannelId,
        message: state.bufferMessage
      }

      if (typingTimeout) clearTimeout(typingTimeout)

      typingTimeout = setTimeout(_ => {
        typingTimeout = null

        activeConnection
          .invoke(HUB_TYPING_MESSAGE, pushTyping)
          .catch(err => sendSlackMessage(err))
      }, 1000)
    },

    [HUB_SEND_MESSAGE] (state, data) {
      if (data.channelId !== state.currentChannelId) {
        state[ALERT_ON_CHANNEL].push(data.channelId)
        return
      }

      state.messages.push({
        userId: data.fromConnectionId,
        userName: data.fromName,
        livechatUserId: data.livechatUserId,
        content: data.message,
        sentAt: data.createdAt,
        elements: data.elements
      })
    },

    [HUB_GET_CUSTOMER_PROFILE] (state, userInformation) {
      console.log(userInformation)
      
      let template = ''
      let store = userInformation['store'] ? userInformation['store'] : null
      let city = userInformation['city'] ? userInformation['city'] : null
      template += `<li><span class="first-letter-capitalize">nome</span>: ${userInformation['nome']}</li>`
      template += `<li><span class="first-letter-capitalize">telefone</span>: ${userInformation['telefone']}</li>`
      if (userInformation['email']) {
        template += `<li><span class="first-letter-capitalize">Email</span>: ${userInformation['email']} </li>`
      } else {
        template += `<li><span class="first-letter-capitalize">Email</span>: ${userInformation['email']} ` + `<button class="btn btn-sm" id="ask_email"> Solicitar E-mail </button></li>`
      }
      template += `<li><span class="first-letter-capitalize">origem</span>: ${userInformation['origem']}</li>`
      template += `<li><span class="first-letter-capitalize">Cod. Produto</span>: ${userInformation['codProd']}</li>`
      template += `<li><span class="first-letter-capitalize">produto</span>: <a target='_blank' href="${userInformation['productSeName']}">${userInformation['product']}</a></li>`
      if (store) {
        template += `<li><hr>Informações da loja:<br><br></li>`
        let storeCompanyName = store['CompanyName'] ? store['CompanyName'] : 'No provided'
        template += `<li><span class="first-letter-capitalize">Loja</span>: <a target='_blank' href="${store['Url']}">${storeCompanyName}</a></li>`
        let storeAddress = store['CompanyAddress'] ? store['CompanyAddress'] : ''
        template += `<li><span class="first-letter-capitalize">Endereço</span>: <small> ${storeAddress} </small></li>`
        if (city) {
          template += `<li><span class="first-letter-capitalize">Cidade-UF</span>: <small> ${city['UFDescricao']} </small></li>`
        }
      }

      Vue.notify.swal({
        title: 'Informações do usuário',
        html: `<ul>${template}</ul>`,
        showConfirmButton: true,
        confirmButtonText: 'Ok',
        onOpen: () => {
          let askEmail = document.getElementById('ask_email')
          askEmail.addEventListener('click', () => {
            state.bufferMessage = 'Please enter your email.'
            this.commit(TYPING_MESSAGE)
            this.commit(SEND_MESSAGE)
          })
          console.log(askEmail)
        }
      })
    },

    [END_CHAT] (state, hubCallMethod) {
      Vue.notify.swal({
        title: 'Encerrar o atendimento?',
        text: 'Não será possível enviar mensagens para esta conversa, continuar?',
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Sim',
        cancelButtonText: 'Não'
      }).then(function (result) {
        if (result.value) {
          Vue.notify.swal({
            showConfirmButton: false,
            title: 'Encerrando',
            allowEscapeKey: false,
            allowOutsideClick: false,
            text: 'Aguarde, por favor.',
            onOpen: function () {
              Vue.notify.$swal().showLoading()

              activeConnection
                .invoke(hubCallMethod || 'EndChat', state.currentChannelId)
                .catch(err => sendSlackMessage(err))
            }
          })
        }
      })
    },

    [CHAT_HAS_ENDED] (state, channelId) {
      Vue.notify.swal({
        title: 'Encerrado!',
        text: 'O chat foi encerrado com sucesso.',
        type: 'success'
      })

      state.channels = state.channels
        .filter(channel => channel.channelId !== channelId)

      if (state.channels.length > 0) {
        this.commit(CHANGE_CHANNEL, state.channels[0])
      } else {
        state.currentChannelId = ''
      }
    },

    [CHANGE_CHANNEL] (state, channel) {
      this.commit(NEW_CHANNEL_REGISTRY, channel.id)
    },

    [TYPING_START] (state, data) {
      this.commit(SET_TYPING_STATE, data)
    },

    [SET_USER_DATA] (state, data) {
      state.userId = data.livechatUserId
      state.username = data.username

      auth.setAuthData(data)
    },

    [SET_FULLSCREEN_LOADING_VISIBLE] (state, isLoading) {
      state[FULLSCREEN_LOADING_VISIBLE] = isLoading
    },

    [HUB_USER_IS_TYPING] (state, typingObj) {
      let currentChannel = state.channels.filter(t => t.id === typingObj.channelId)

      if (currentChannel.length === 0) return {}

      currentChannel = currentChannel[0]

      let channelIx = state.channels.indexOf(currentChannel)

      currentChannel.isTyping = true

      Vue.set(state.channels, channelIx, currentChannel)
    },

    [HUB_USER_IS_NOT_TYPING] (state, typingObj) {
      let currentChannel = state.channels.filter(t => t.id === typingObj.channelId)

      if (currentChannel.length === 0) return {}

      currentChannel = currentChannel[0]

      let channelIx = state.channels.indexOf(currentChannel)

      currentChannel.isTyping = false

      Vue.set(state.channels, channelIx, currentChannel)
    }

  },
  getters,
  state
})

export default store

function removeAuthData (store) {
  auth
    .logout()
    .then(_ => {
      cleanActiveConnection()
      store.commit(SET_USER_DATA, {})
      router.push('/login')
    })
    .catch(err => {
      sendSlackMessage(err)
    })
}

document.addEventListener('deviceready', () => {
  state.appInPause = false
}, false)

document.addEventListener('resume', () => {
  state.appInPause = false
}, false)

document.addEventListener('pause', () => {
  state.appInPause = true
}, false)

document.addEventListener('deviceready', () => {
  window.FCMPlugin.onNotification(data => {
    console.log('Notification received', data)

    let lnotification = window.cordova.plugins.notification.local

    if (data.wasTapped) {
      return
    }

    let mobileData = JSON.parse(data.chat_mobile)

    // When is not a new call
    if (mobileData.data && mobileData.data.action === NEW_GROUP_MESSAGE) {
      let channelId = mobileData.data.p1

      if (state[CURRENT_CHANNEL_ID] === channelId) return
    }

    console.log('Dados', mobileData)

    lnotification.schedule(mobileData)
  })

  window.cordova.plugins.notification.local.on('click', (push) => {
    console.log('click event', push)

    let retries = 0

    let waitingForConnection = () => {
      console.log('waiting for connection... retries', retries)

      if (!state.isConnected) {
        retries++

        if (retries < 10) {
          return setTimeout(waitingForConnection, 1000)
        }
      }

      if (push.data) {

        // new message and click should change channel
        if (push.data.action === NEW_GROUP_MESSAGE) {
          console.log('--channels--')
          console.log(state.channels)
          console.log('--pushed channelID--')
          console.log(push.data.p1)
          if (state.channels.filter(channel => channel.channelId === push.data.p1).length > 0) {
            store.commit(CHANGE_CHANNEL, { id: push.data.p1 })
            console.log('change channel')
          }
          return
        }
      
        if (push.data.p1) {
          console.log('Sending', push.data.action, push.data.p1)
          store.commit(push.data.action, push.data.p1)
        } else {
          console.log('Sending', push.data.action)
          store.commit(push.data.action)
        }
      }
    }

    if (!state.isConnected) {
      setTimeout(waitingForConnection, 1000)
    } else {
      waitingForConnection()
    }
  })
}, false)