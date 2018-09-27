<template>
  <div>
    <div class="header" @click="showPopover" >
      <div class="profile-header vbox" ref="popoverTarget">
        <span class="title">Moveleiros Chat</span>
        <span class="username">
          <availabity :content="username" :status="currentStatus"></availabity>
        </span>
      </div>
      <div class="profile-menu">
        <icon name="ellipsis-v" label="Menu"></icon>
      </div>
    </div>

    <!-- <popover name="foo" class="dialog">
      <profile-menu></profile-menu>
    </popover> -->

    <v-ons-popover 
      :direction="'down'" 
      cancelable
      :target="popoverTarget"
      :visible.sync="popoverVisible">
      <profile-menu></profile-menu>
    </v-ons-popover>
  </div>
</template>

<script>
import 'vue-awesome/icons/ellipsis-v'
import Availabity from '@/components/Availabity'
import ProfileMenu from '@/components/ProfileMenu'
import { CURRENT_USERNAME, CURRENT_STATUS } from '@/getterTypes'
import { mapGetters } from 'vuex'

export default {
  components: { Availabity, ProfileMenu },

  computed: {
    ...mapGetters({
      username: CURRENT_USERNAME,
      currentStatus: CURRENT_STATUS
    })
  },

  data () {
    return {
      popoverVisible: false,
      popoverTarget: null
    }
  },

  methods: {
    showPopover () {
      this.popoverTarget = this.$refs.popoverTarget
      this.popoverVisible = true
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '../styles/_vars'

.header
  display flex
  cursor pointer
  padding 20px $default-padding
  transition $default-duration

  > .profile-header
    flex 1

  > .profile-menu
    display flex
    padding-right 5px

  &:hover
    background darken($inverse-color, 5)
    transition $default-duration

  .title
    font-weight 600

  .username
    margin-top 8px
    display flex
    align-items center

.dialog
  background $white
  color $gray-scale-secondary
  border: 1px solid #ccc;
  z-index: 8 !important;
  transition $default-duration

.show-from-left-enter-active, .show-from-left-leave-active {
  transition: transform 0.3s, opacity 0.7s;
}
.show-from-left-enter, .show-from-left-leave-to {
  opacity: 0;
  transform: translate(-20px);
}
</style>
