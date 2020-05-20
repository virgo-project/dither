<template lang="pug">
router-link.btn-icon(v-if="type == 'link'" :class="cssClass" :to="to")
  img(:src="imgSrc")
  .value(v-if="value") {{ value }}
a.btn-icon(v-else-if="type == 'anchor'" :class="cssClass" :href="href")
  img(:src="imgSrc")
  .value(v-if="value") {{ value }}
.btn-icon(v-else :class="cssClass")
  img(:src="imgSrc")
  .value(v-if="value") {{ value }}
</template>

<script>
export default {
  name: "btn-icon",
  computed: {
    cssClass() {
      let css = "";
      if (this.size) {
        css += ` btn-icon--size-${this.size}`;
      }
      if (this.color) {
        css += " btn-icon--color";
        if (this.color !== "true") {
          css += ` btn-icon--color-${this.color}`;
        }
      }
      if (this.disabled) {
        css += " btn-icon--disabled";
      }
      return css;
    },
    imgSrc() {
      if (this.color) {
        return require("../assets/feather/color/" + this.icon + ".svg");
      }
      return require("../assets/feather/" + this.icon + ".svg");
    }
  },
  props: ["color", "href", "icon", "size", "to", "type", "value", "disabled"]
};
</script>

<style scoped lang="stylus">
.btn-icon
  display block
  color var(--link)
  display flex
  align-items center
  justify-content center
  cursor pointer
  width 3rem
  height 3rem

  .value
    font-size 0.75rem
    color var(--dim)
    margin-left 0.25rem

  img
    width 1.5rem
    height 1.5rem

  &.btn-icon--size-small
    width 2rem
    height 2rem

    &:hover
      background var(--hover-fg)

    img
      width 1rem
      height 1rem
      opacity 0.5

  &.btn-icon--color
    cursor not-allowed

    &:hover
      background transparent

    img
      opacity 1

  &.btn-icon--color-red .value
    color #f00

  &.btn-icon--color-green .value
    color #090

  &.btn-icon--disabled
    cursor not-allowed
</style>
