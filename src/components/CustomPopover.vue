<template>
  <ul>
    <li @click="openUserDetails">
      <user-details-icon :title="'Detalhes do usuário'" />
      <span>
      Informações do Usuário
      </span>
    </li>
    <li @click="endChat">
      <close-circle-icon :title="'Encerrar atendimento'" />
      <span>
      Encerrar atendimento
      </span>
    </li>
  </ul>
</template>

<script>
import UserDetailsIcon from 'icons/account-card-details.vue'
import CloseCircleIcon from 'icons/close-circle-outline.vue'
import { END_CHAT } from '@/mutationTypes'
import { GET_CUSTOMER_PROFILE } from '@/store'

export default {
  name: 'custom-popover',
  components: {
    UserDetailsIcon,
    CloseCircleIcon
  },
  props: ['menuclick'],
  methods: {
    openUserDetails () {
      this.$store.commit(GET_CUSTOMER_PROFILE)
      this.menuclick()
    },

    endChat () {
      this.$store.commit(END_CHAT)
      this.menuclick()
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '../styles/_vars'

ul
  padding 10px 5px

  li
    padding 7px $default-padding
    cursor pointer
    transition $default-duration
    display flex
    align-items center
    span
      margin-left 10px

    &.no-hover:hover
      background transparent
      cursor default

    .divider
      cursor default
      border 0
      height 1px
      background $primary-color
      margin 6px 0

    &:hover
      background lighten($primary-color, 10)
      transition $default-duration

    &.hbox
      display flex
      align-items center
</style>
