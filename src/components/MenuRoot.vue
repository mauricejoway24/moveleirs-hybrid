<template>
  <nav class="vbox">
    <profile></profile>
    <conversation-list @closeMenuWhenOpen="() => this.$emit('closeMenuWhenOpen')"></conversation-list>
    <!-- <channel-list></channel-list> -->
    <footer-logo></footer-logo>
  </nav>
</template>

<script>
import Profile from '@/components/Profile'
import ConversationList from '@/components/ConversationList'
import FooterLogo from '@/components/FooterLogo'
import ChannelList from '@/components/ChannelList'

export default {
  components: { Profile, ConversationList, FooterLogo, ChannelList }
}
</script>

<style lang="stylus" scoped>
@import '../styles/_vars'

nav
  background $inverse-color
  background linear-gradient(to bottom, $inverse-color 0%, lighten($inverse-color, 5) 50%, lighten($inverse-color, 15) 100%)
  flex 1
  display flex
  color $white
  min-width $min-nav-width
</style>
