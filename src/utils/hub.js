import { HubConnection } from '@aspnet/signalr'
// import HttpClient from './httpclient'
import config from '@config'
import auth from './auth'
import router from '@/router'
import sendSlackMessage from './slack'
import {
  ON_RECONNECT,
  HUB_SEND_MESSAGE,
  NEW_CHANNEL_REGISTRY,
  USERS_JOINED,
  TRYING_FIND_AGENT,
  ALREADY_TAKEN,
  AGENT_HAS_ACCEPTED,
  UPDATE_CHANNEL_LIST,
  HUB_GET_CUSTOMER_PROFILE,
  CHAT_HAS_ENDED,
  INVALID_CHANNEL,
  CUSTOMER_INTEGRATION_SENT,
  HUB_EDIT_CUSTOMER_PROFILE,
  EDIT_CUSTOMER_PROFILE_SAVED,
  DISPATCH_ALERT,
  ON_DISCONNECT
} from '@/store'

import { 
  SEND_BULK,
  ON_CONNECT,
  SET_USER_DATA,
  HUB_USER_IS_TYPING,
  HUB_USER_IS_NOT_TYPING,
  TYPING_START
} from '@/mutationTypes'

import { ACTIVE_CHANNELS } from '@/getterTypes'

export let activeConnection
export let timeoutReconnect = 0

export default (state, store, callback) => {
  if (state.tryingToConnect) {
    return
  }

  state.tryingToConnect = true

  if (activeConnection) {
    cleanActiveConnection()
  }

  const storeIdParam = `storeId=${state.currentStoreId()}`
  const token = state.currentToken()

  let hubConnection = new HubConnection(`${config.getConfig('BASE_HUB_URL')}mktchat?${storeIdParam}`, {
    accessTokenFactory: () => token
  })

  activeConnection = hubConnection

  if (!auth.userAuthenticated()) {
    // force beforeEach method call
    router.push('livechat')
    return
  }

  store.commit(ON_RECONNECT)

  // Hub
  hubConnection.on(HUB_SEND_MESSAGE, data => {
    store.commit(HUB_SEND_MESSAGE, data)
  })

  hubConnection.on(NEW_CHANNEL_REGISTRY, storeId => {
    store.commit(NEW_CHANNEL_REGISTRY, storeId)
  })

  hubConnection.on(SEND_BULK, messages => {
    store.commit(SEND_BULK, messages)
  })

  hubConnection.on(USERS_JOINED, userJoined => {
    store.commit(USERS_JOINED, userJoined)
  })

  hubConnection.on(ACTIVE_CHANNELS, channels => {
    store.commit(ACTIVE_CHANNELS, channels)
  })

  hubConnection.on(ALREADY_TAKEN, _ => {
    store.commit(ALREADY_TAKEN)
  })

  hubConnection.on(AGENT_HAS_ACCEPTED, _ => {
    store.commit(AGENT_HAS_ACCEPTED)
  })

  hubConnection.on(UPDATE_CHANNEL_LIST, channels => {
    store.commit(UPDATE_CHANNEL_LIST, channels)
  })

  hubConnection.on(HUB_GET_CUSTOMER_PROFILE, profile => {
    store.commit(HUB_GET_CUSTOMER_PROFILE, profile)
  })

  hubConnection.on(CHAT_HAS_ENDED, channelId => {
    store.commit(CHAT_HAS_ENDED, channelId)
  })

  hubConnection.on(INVALID_CHANNEL, _ => {
    store.commit(INVALID_CHANNEL)
  })

  hubConnection.on(CUSTOMER_INTEGRATION_SENT, _ => {
    store.commit(CUSTOMER_INTEGRATION_SENT)
  })

  hubConnection.on(HUB_EDIT_CUSTOMER_PROFILE, profile => {
    store.commit(HUB_EDIT_CUSTOMER_PROFILE, profile)
  })

  hubConnection.on(EDIT_CUSTOMER_PROFILE_SAVED, _ => {
    store.commit(EDIT_CUSTOMER_PROFILE_SAVED)
  })

  hubConnection.on(DISPATCH_ALERT, alertType => {
    store.commit(DISPATCH_ALERT, alertType)
  })

  hubConnection.on(HUB_USER_IS_TYPING, typingObj => {
    store.commit(HUB_USER_IS_TYPING, typingObj)
  })

  hubConnection.on(HUB_USER_IS_NOT_TYPING, typingObj => {
    store.commit(HUB_USER_IS_NOT_TYPING, typingObj)
  })

  hubConnection.on(TYPING_START, typingObj => {
    store.commit(TYPING_START, typingObj)
  })

  hubConnection.onclose(_ => {
    // It checks if our disconnect event is from an active connection or not
    if (activeConnection !== hubConnection) return

    store.commit(ON_DISCONNECT)
  })

  return hubConnection.start()
    .then(() => {
      timeoutReconnect = 5
      store.commit(ON_CONNECT, hubConnection)
      state.tryingToConnect = false

      if (callback) callback()
    })
    .catch(err => {
      console.log('erro on chat', err, err.statusCode)
      if (err && err.statusCode && err.statusCode === 401) {
        auth
          .logout()
          .then(_ => {
            cleanActiveConnection()
            store.commit(SET_USER_DATA, {})
            router.push('/login')
          })
          .catch(err => {
            console.log('Auth logout error', err)
            sendSlackMessage(err)
          })
      } else {
        sendSlackMessage(err)
        state.tryingToConnect = false
        timeoutReconnect += 5
        store.commit(ON_DISCONNECT, callback)
      }
    })
}

export const cleanActiveConnection = () => {
  removeHub(activeConnection)
  activeConnection = null
}

function removeHub (connection) {
  try {
    connection.off(HUB_SEND_MESSAGE)
    connection.off(NEW_CHANNEL_REGISTRY)
    connection.off(SEND_BULK)
    connection.off(USERS_JOINED)
    connection.off(ACTIVE_CHANNELS)
    connection.off(TRYING_FIND_AGENT)
    connection.off(ALREADY_TAKEN)
    connection.off(AGENT_HAS_ACCEPTED)
    connection.off(UPDATE_CHANNEL_LIST)
    connection.off(HUB_GET_CUSTOMER_PROFILE)
    connection.off(CHAT_HAS_ENDED)
    connection.off(INVALID_CHANNEL)
    connection.off(CUSTOMER_INTEGRATION_SENT)
    connection.off(EDIT_CUSTOMER_PROFILE_SAVED)
    connection.off(HUB_USER_IS_TYPING)
    connection.off(HUB_USER_IS_NOT_TYPING)
    connection.removeConnection = true
    connection.stop()
  } catch (e) {
  }
}
