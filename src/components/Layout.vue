<template>
  <div class="main" v-touch:swipe="toggleNavHandler">
      <div id="menu" class="left-main vbox" v-bind:class="{'left-main-whole' : !channels.length}">
        <menu-root @closeMenuWhenOpen="toggleNavHandler('swipeleft')"></menu-root>
      </div>

      <div id="panel" class="right-main vbox" v-bind:class="{'right-main-whole' : !channels.length}">
        <div class="overlay" @click="closeNavHandler"></div>
        <notification-permission></notification-permission>
        <flash-message></flash-message>

        <header-toolbar
          :inverse-color="true"
          @hamburgerTriggered="leftNavHandler">
          <span v-if="currentChannel !== {}">{{currentChannel.name}}
            <span v-if="$store.state.customerState.isCustomerTyping" class="istyping"> está digitando</span>
          </span>
        </header-toolbar>

        <message-box v-if="channels.length > 0">
        </message-box>
        <message-input @updatemessagebox="updateChatList"
          v-if="channels.length > 0">
        </message-input>

        <div v-if="channels.length == 0" class="no-chat">
          Sem nenhuma conversa ativa ;)
        </div>
      </div>
  </div>
</template>

<script>
import MessageBox from '@/components/MessageBox'
import MessageInput from '@/components/MessageInput'
import HeaderToolbar from '@/components/HeaderToolbar'
import MenuRoot from '@/components/MenuRoot'
import FlashMessage from '@/components/FlashMessage'
import NotificationPermission from '@/components/NotificationPermission'
import { START_CONNECTION, SET_FULLSCREEN_LOADING_VISIBLE, SIGN_OUT } from '@/mutationTypes'
import { ACTIVE_CHANNELS, ACTIVE_CHANNEL } from '@/getterTypes'
import { mapGetters } from 'vuex'
import sendSlackError from '@/utils/slack'
import servertoken from '@/utils/servertoken'
import auth from '@/utils/auth'

export default {
  components: {
    MessageBox,
    MessageInput,
    HeaderToolbar,
    MenuRoot,
    FlashMessage,
    NotificationPermission
  },

  mounted () {
    // Loading
    this.$store.commit(SET_FULLSCREEN_LOADING_VISIBLE, true)

    this.$nextTick(() => {
      let token = auth.getToken()
      let livechatId = auth.getLivechatId()

      if (!token || token.length === 0 || !livechatId || livechatId.length === 0) {
        console.log('Missing token/livechatId', token, livechatId)
        this.$store.commit(SET_FULLSCREEN_LOADING_VISIBLE, false)
        this.$router.push('login')
        return
      }

      servertoken(token, livechatId)
        .then(pushToken => {
          console.log('app => pushToken from FCMPlugin', pushToken) 
          this.$store.commit(START_CONNECTION, true)
          this.$store.commit(SET_FULLSCREEN_LOADING_VISIBLE, false)
        })
        .catch(err => {
          if (typeof err === 'string' && err === '401') {

            this.setScreenError()
            this.$store.commit(SET_FULLSCREEN_LOADING_VISIBLE, false)
            this.$store.commit(SIGN_OUT)

            return
          }

          sendSlackError(err)

          this.setScreenError()
        })
    })
  },

  computed: {
    ...mapGetters({
      channels: ACTIVE_CHANNELS,
      currentChannel: ACTIVE_CHANNEL
    })
  },

  methods: {
    toggleNavHandler (direction) {
      // swipe to right
      if (direction === 'swipeleft') {
        this.closeNavHandler()
      } else {
        this.leftNavHandler()
      }
    },

    leftNavHandler () {
      const menu = document.getElementById('menu')
      const panel = document.querySelector('.right-main')
      
      if (menu.classList.contains('opened')) return;
      
      menu.classList.add('opened')
      panel.classList.add('opened')
      panel.classList.add('menu-open')
    },

    closeNavHandler () {
      const menu = document.getElementById('menu')
      const panel = document.querySelector('.right-main')

      if (!menu.classList.contains('opened')) return;

      menu.classList.remove('opened')
      panel.classList.remove('opened')
      panel.classList.remove('menu-open')
    },

    updateChatList () {
      this.$emit('updateChatListChild')
    },

    setScreenError () {
      this.toastVisible = false
      this.loading = false
      this.$ons.notification.alert('Erro ao tentar acessar. Feche o app e tente entrar novamente. Se persistir, entre em contato com o suporte Moveleiros.', {
        title: 'Ops'
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '../styles/_vars'

.istyping
  color $gray-scale
  margin-left 0px !important

.main
  flex 1
  display flex
  > div // Slideout hack
    display flex
    flex 1

.no-chat
  flex 1
  display flex
  padding $default-padding
  font-size 20px
  justify-content center
  align-items center


.left-main-whole
  width 100% !important
  max-width 100% !important
  margin-left -100% !important
  transform translateX(100%) !important

.right-main-whole
  transform translateX(100%) !important

.left-main
  max-width 300px

.overlay
  display none

.right-main.menu-open
  position relative

  .overlay
    display block
    cursor pointer
    position absolute
    top 0
    bottom 0
    left 0
    right 0
    background transparent

@media screen and (max-width: $mobile)
  .main
    overflow hidden

  .left-main
    margin-left -300px
  
  .left-main
    backface-visibility hidden
    perspective 1000
    transform translateX(-300px)
    transition transform $default-duration

  .opened
      backface-visibility hidden
      perspective 1000
      transform translateX(300px)
      transition transform $default-duration

@media screen and (min-width: $mobile)
  .btn-hamburger
    display none
</style>
