<template>
  <div class="root">
    <div ref="messagebox" class="message-box" v-chat-scroll="{always: true}">
      <ul>
        <li v-bind:key="message.id" 
          v-for="message in messages" 
          class="message vbox" 
          v-bind:class="{ 'pull-right': message.livechatUserId === currentUserId }">

          <div class="message-body">
            <span class="message-title"><span class="username">{{ message.userName }}</span><span class="sent-at">{{ message.sentAt | moment('HH:mm') }}</span></span>
            <span class="message-content">{{ message.content }}</span>
            <span class="message-ui" v-if="message.elements && message.elements.length > 0">
              <dyn-element v-for="(element, index) in message.elements" 
                :key="index" 
                :value="element.value"
                :text="element.text"
                :type="element.elementType"
                @click="sendButtonAction">
              </dyn-element>
            </span>
          </div>
        </li>
      </ul>
    </div>
    <slot></slot>
  </div>
</template>

<script>
import { ALL_MESSAGES, GET_USER_ID } from '@/getterTypes'
import { SEND_BUFFER_MESSAGE } from '@/mutationTypes'
import { mapGetters } from 'vuex'
import DynElement from './DynElement'

export default {
  mounted () {
    this.$parent.$on('updateChatListChild', () => {
      setTimeout(() => {
        let mbox = this.$refs.messagebox
        mbox.scrollTop = mbox.scrollHeight
      }, 500)
    })
  },
  computed: {
    ...mapGetters({
      messages: ALL_MESSAGES,
      currentUserId: GET_USER_ID
    })
  },
  components: {
    DynElement
  },
  methods: {
    sendButtonAction (message) {
      this.$store.commit(SEND_BUFFER_MESSAGE, {
        message
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '../styles/_vars'

.root
  flex 1
  display flex
  overflow-y auto

.message-box
  flex 1
  padding $default-padding
  overflow-y auto

  ul
    display flex
    flex-direction column
    li
      align-items flex-start

  &::-webkit-scrollbar
    width .5em
    background lighten($primary-color, 30)

    &-track
      box-shadow inset 0 0 2px darken($primary-color, 10)
    
    &-thumb
      background darken($primary-color, 20)

  .message
    display flex
    margin-top 2px
    margin-bottom 2px

  .message-body
    background lighten($primary-color, 5)
    border-radius 10px
    padding 15px 10px
    display flex
    flex-direction column
    max-width 70%

  .username
    font-weight 600
    margin-right 10px

  .sent-at
    font-weight 400
    font-size .6em
    color darken($gray-scale, 10)

  .message-title
    display flex
    align-items center

  .message-content
    margin-top 5px

  .pull-right
    align-items flex-end

    .message-body
      align-items flex-end
      background darken(#6BB9F0, 15)
      color #fff

    .sent-at
      color #fff

    .username
      margin-left 10px
      margin-right 0

    .message-title
      flex-direction row-reverse

    .message-content
      text-align right

  .message-ui
    margin-top 8px
</style>
