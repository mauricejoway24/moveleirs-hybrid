// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'onsenui/css/onsenui.css'
import 'onsenui/css/onsen-css-components.css'

import Vue from 'vue'
import VueOnsen from 'vue-onsenui'
import store from './store'
import router from './router'
import App from './App'

import VueLocalStorage from 'vue-localstorage'
import VueChatScroll from 'vue-chat-scroll'
import 'keen-ui/dist/keen-ui.css'
import VueMoment from 'vue-moment'
import moment from 'moment'
import Icon from 'vue-awesome/components/Icon'
import Popover from 'vue-js-popover'
import VueHammer from '@/wrappers/vue-hammer'
import autosize from 'autosize'
import Notify from './utils/notify'

Vue.config.productionTip = false

moment.locale('pt-BR')

Vue.component('icon', Icon)

Vue.component('autosizing-textarea', {
  props: [ 'onenter', 'presskeyup', 'content' ],
  template: `<textarea @keypress="dealWithPressKey($event)" @keyup="presskeyup" rows="1" :value="content"></textarea>`,
  mounted () {
    autosize(this.$el)

    // $nextTick doesn't work here when it comes with UI update =\
    setTimeout(() => autosize.update(this.$el), 1000)
  },

  updated () {
    autosize.update(this.$el)
  },

  methods: {
    dealWithPressKey (e) {
      let key = e.keyCode || e.which

      if (key === 13) {
        e.preventDefault()

        this.$nextTick(function () {
          this.onenter()
        })
      }
    }
  }
})

Vue.use(VueHammer)
Vue.use(VueChatScroll)
Vue.use(VueMoment, { moment })
Vue.use(Popover)
Vue.use(VueLocalStorage)
Vue.use(VueOnsen)
Vue.use(Notify)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router,
  template: '<App/>',
  components: { App }
})
