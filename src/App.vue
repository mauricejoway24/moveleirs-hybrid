<template>
  <div id="app" class="vbox">
    <v-ons-modal :visible="modalVisible">
      <p style="text-align: center">
        Carregando <v-ons-icon icon="fa-spinner" spin></v-ons-icon>
      </p>
    </v-ons-modal>
    <router-view/>
  </div>
</template>

<script>
import { UiButton } from 'keen-ui'
import { FULLSCREEN_LOADING_VISIBLE } from '@/getterTypes' // TODO: Set FULLSCREEN_LOADING_VISIBLE on store.js
import { mapGetters } from 'vuex'

export default {
  name: 'app',
  components: { UiButton },
  computed: {
    ...mapGetters({
      modalVisible: FULLSCREEN_LOADING_VISIBLE
    })
  }
}
</script>

<style lang="stylus">
@import "./styles/_reset.styl"
@import "./styles/_vars.styl"

html, body, #app
  width 100%
  height 100%
  margin 0
  overflow hidden
  
body
  font-family 'TitilliumWeb', $font-family-regular, Helvetica, Arial, sans-serif
  font-size $default-font-size

#app
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  color #2c3e50
  background-color #fff

.vbox
  display flex
  flex-direction column

.first-letter-capitalize
  text-transform capitalize
</style>
