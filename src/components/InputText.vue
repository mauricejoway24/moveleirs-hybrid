<template>
  <autosizing-textarea
    ref="innertextarea"
    class="input-text"
    placeholder="Digite sua mensagem aqui ;)"
    :content="content"
    :onenter="sendmessage"
    @click="inputClick"
    :presskeyup="bufferMessage">
  </autosizing-textarea>
</template>

<script>
export default {
  props: ['content', 'sendmessage', 'bufferMessage', 'inputClick'],

  mounted () {
    this.$nextTick(() => {
      this.$refs.innertextarea.$el.focus()
    })
  }
}
</script>

<style lang="stylus" scoped>
@import '../styles/_vars'

.input-text
  flex 1
  padding $default-padding
  padding-right 0
  border none
  outline none
  resize none
  font-size 1em
  font-family 'TitilliumWeb', TitilliumRegular, Helvetica, Arial, sans-serif;
  background $white
</style>

