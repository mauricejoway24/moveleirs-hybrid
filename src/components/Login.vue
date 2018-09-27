<template>

  <div class="main vbox">
    <div class="center-box vbox">
      <div class="logo">
        <img src="../assets/img/logo-white.svg" alt="Moveleiros Logo">
      </div>

      <div class="fields">
        configBaseHubUrl: <br>
        <span v-text="configBaseHubUrl"></span>
        <input
          ref="emailText"
          type="email"
          label="Email*" 
          placeholder="meuemail@email.com.br" 
          :invalid="!valid && !emailValid && this.email.length === 0"
          error="O e-mail é obrigatório"
          v-model="email"/>

        <input
          label="Senha*"
          type="password"
          placeholder="Digite sua senha aqui"
          @keyup.enter="sendInformation"
          :invalid="!valid && !passwordValid && this.password.length === 0"
          error="A senha é obrigatória"
          v-model="password"/>

        <ui-button
          color="primary" 
          :loading="loading" 
          :size="'normal'" 
          type="primary"
          @click="sendInformation"
          >
            Acessar
        </ui-button>

      </div>

      <div class="version">
        {{getVersion()}}
      </div>
      
    </div>
  </div>
</template>

<script>
import { UiButton } from 'keen-ui'
import axios from 'axios'
import config from '@/../config'
import { SET_USER_DATA } from '@/mutationTypes'

export default {
  components: { UiButton },

  data () {
    return {
      loading: false,
      valid: true,
      email: '',
      password: '',
      toastMessage: '',
      toastVisible: false,
      toastTimer: null,
      emailValid: true,
      passwordValid: true,
      configBaseHubUrl: ''
    }
  },

  mounted () {
    this.configBaseHubUrl = config.getConfig('BASE_HUB_URL')
    this.$nextTick(() => {
      this.$refs.emailText.focus()
    })
  },

  methods: {
    sendInformation () {
      if (!this.validate()) {
        this.$ons.notification.toast('É necessário preencher o email e senha.', { 
          timeout: 3000, 
          animation: 'fall' 
        })
        return
      }

      this.loading = true
      this.toastVisible = false

      const email = this.email
      const password = this.password

      let information = {
        email,
        password
      }

      axios
        .post(`${config.getConfig('BASE_HUB_URL')}livechat/login`, information)
        .then(result => {
          this.$store.commit(SET_USER_DATA, result.data)
          this.$router.push('agent')
        })
        .catch(err => {
          console.log(err)
          if (err && err.code === 401) {
            this.setScreenError('Usuário ou senha incorreto(s), tente novamente.')  
          } else {
            this.setScreenError('Erro ao tentar acessar. Verifique sua conexão e tente novamente.')
          }
        })
    },

    setScreenError (message) {
      this.toastVisible = false
      this.loading = false
      this.$ons.notification.alert(message || 'Usuário ou senha incorreto(s), tente novamente.', {
        title: 'Ops'
      })
    },

    validate () {
      let valid = true

      if (this.email.length === 0) {
        this.emailValid = false
        valid = false
      }

      if (this.password.length === 0) {
        this.passwordValid = false
        valid = false
      }

      this.valid = valid
      return valid
    },

    getVersion () {
      return 'MovChat v1.0.1'
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '../styles/_vars'

.main
  display flex
  flex 1
  align-items center
  justify-content center
  background rgba(73,155,234,1)
  background linear-gradient(to bottom, #285166 0%, #3c8dbc 50%, #285166 100%)
  color #fff
  padding 30px 30px 5px 30px

  .fields
    margin-top 30px
    margin-bottom 30px
    flex 2
    display flex
    flex-direction column
    min-height 170px
    input
      padding 8px
      margin-bottom 20px
      font-family 'TitilliumWeb', $font-family-regular, Helvetica, Arial, sans-serif
      font-size $default-font-size
      border-radius 3px
      color #444
      border 2px solid #fff
      &[invalid]
        border 2px solid red

  .center-box
    width 100%
    max-height 100%
    display flex
    flex 1
    padding 0 $default-padding*2
    justify-content center

  .logo
    display flex
    flex 1
    align-items center
    justify-content center
    align-self center
    width 80%

    img
      height 45px

  .version
    font-size .8em
    align-self center
    color #ccc
    font-family Arial, Helvetica, sans-serif
</style>
