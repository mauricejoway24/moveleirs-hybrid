<template>
  <header v-bind:class="{ 'inverse-toolbar': inverseColor, 'white-toolbar': whitebackground, 'grey': grey }">
    <div class="title" data-open-menu @click="triggerHeaderButton()">
      <menu-icon class="icon" v-if="inverseColor"></menu-icon>
      <slot></slot>
    </div>
    <div v-if="inverseColor && isMobile" @click="() => { popoverTarget = this.$refs.dotButton.$el; popoverVisible = !popoverVisible }"
      v-bind:class="{ 'noshow': channels.length == 0 }">
      <dots-icon ref="dotButton"></dots-icon>
    </div>
    
    <v-ons-popover 
      :direction="'down'" 
      cancelable
      cover-target
      :target="popoverTarget"
      :visible.sync="popoverVisible">
      <custom-popover :menuclick="() => this.popoverVisible = false">
      </custom-popover>
    </v-ons-popover>
  </header>
</template>

<script>
import MenuIcon from 'icons/menu.vue'
import DotsIcon from 'icons/dots-vertical'
import CustomPopover from '@/components/CustomPopover'
import { ACTIVE_CHANNELS } from '@/getterTypes'
import { CUSTOMER_END_CHAT } from '@/store'
import { mapGetters } from 'vuex'

export default {
  components: {
    MenuIcon,
    DotsIcon,
    CustomPopover
  },

  computed: {
    ...mapGetters({
      channels: ACTIVE_CHANNELS
    })
  },

  data () {
    return {
      popoverVisible: false,
      isMobile: window.innerWidth < 768,
      popoverTarget: null
    }
  },

  props: [
    'inverseColor',
    'beforeClose',
    'whitebackground',
    'inverseCloseButton',
    'grey'
  ],

  methods: {
    triggerHeaderButton () {
      this.$emit('hamburgerTriggered')
    },
    popoverHandler () {
      this.isPopoverOpened = !this.isPopoverOpened
    },
    endChat () {
      if (this.beforeClose) {
        this.beforeClose()
        return
      }

      this.$store.commit(CUSTOMER_END_CHAT)
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '../styles/_vars'

$header-background = #d9d9d9

.noshow
  display none

header
  padding $toolbar-up-down-padding $default-padding
  display flex
  justify-content space-between
  background $toolbar-color
  color $white
  align-items center
  border-top-left-radius inherit
  border-top-right-radius inherit

  &.inverse-toolbar
    background $white
    color $gray-scale-secondary
    border-bottom 1px solid $primary-color
    .title
      display flex
      align-items center
      span
        margin-left 15px
      .icon
        fill: $gray-scale-secondary
        cursor pointer

  &.grey
    background $header-background
    color #333
    padding-top $toolbar-up-down-padding + 10
    padding-bottom $toolbar-up-down-padding + 10
    .title
      display flex
      align-items center
      span
        margin-left 5px

  &.white-toolbar
    background #ccc
    .title
      color #333

  .title
    font-size .9em

@media screen and (min-width: $mobile)
  header
    &.inverse-toolbar
      .title
        height 30px
        span
          margin-left 0
        .icon
          display none

.show-from-right-enter-active, .show-from-right-leave-active
  transition transform $default-duration, opacity $default-duration

.show-from-right-enter, .show-from-right-leave-to 
  opacity 0
  transform translate(20px)

.dialog
  background $white
  color $gray-scale-secondary
  border: 1px solid #ccc;
  z-index: 8 !important;
  transition $default-duration
  
</style>
