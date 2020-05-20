<template>
  <div id="app">
    <router-view :key="$route.fullPath" />
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "app",
  metaInfo: {
    title: "Uncensorable, decentralized social network built on the Cosmos Hub",
    titleTemplate: "%s - Dither Alpha",
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" }
    ],
    htmlAttrs: {
      lang: "en",
      amp: true
    }
  },
  computed: {
    ...mapGetters([
      "blockchain",
      "blockchains",
      "accounts",
      "settings",
      "following"
    ])
  },
  async mounted() {
    try {
      await this.$store.dispatch("authenticate");
    } catch {
      console.log("Failed to authenticate.");
    }
    this.$store.dispatch("socketInit");
  }
};
</script>

<style lang="stylus">
@import './styles/normalize.css'
@import './styles/variables.css'

*
  box-sizing border-box

html
  font 16px / 1.5 var(--sans)
  background hsl(0, 0, 97%)

body
  padding 3rem 0
  min-height 100vh
  max-width 40rem
  margin 0 auto
  background var(--app-bg)

a
  text-decoration none
  color var(--link)
  cursor pointer

  &:hover
    color var(--hover)

p
  margin 0

.dont-break-out
  /* These are technically the same, but use both */
  overflow-wrap break-word
  word-wrap break-word
  -ms-word-break break-all
  /* This is the dangerous one in WebKit, as it breaks things wherever */
  word-break break-all
  /* Instead use this non-standard one: */
  word-break break-word
  /* Adds a hyphen where the word breaks, if supported (No Blink) */
  -ms-hyphens auto
  -moz-hyphens auto
  -webkit-hyphens auto
  hyphens auto

.break-address
  /* These are technically the same, but use both */
  overflow-wrap break-word
  word-wrap break-word
  -ms-word-break break-all
  /* This is the dangerous one in WebKit, as it breaks things wherever */
  word-break break-all
  /* Instead use this non-standard one: */
  word-break break-word
</style>
