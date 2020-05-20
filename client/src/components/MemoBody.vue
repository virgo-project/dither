<template lang="pug">
.memo-body
  .dont-break-out(@click.self="navToMemo" v-html="memoBody")
  a.link-preview(
    v-for="url in memoUrls" :key="url" :href="url"
    target="_blank" rel="noopener noreferrer")
    img(v-if="isImage(url)" :src="url")
</template>

<script>
import getUrls from "get-urls";
import * as linkify from "linkifyjs";
import h from "../scripts/helpers";
import hashtag from "linkifyjs/plugins/hashtag"; // optional
hashtag(linkify);

export default {
  name: "memo-body",
  computed: {
    memoBody() {
      let text = this.memo.memo;
      let validTypes = ["post", "comment"];
      // handle JSON based memos
      if (typeof text === "object") {
        if (validTypes.includes(text.type) && text.body) {
          return h.linkifyMemo(text.body);
        } else if (text.type === "repost" && !text.body) {
          return "";
        }
      }
      // handle historical slash based memos
      if (text) {
        text = text.split(" ");
        text.shift();
        if (this.memo.type === "post") {
          text = text.join(" ");
          return h.linkifyMemo(text);
        }
        if (this.memo.type === "comment") {
          text.shift();
          text = text.join(" ");
          return h.linkifyMemo(text);
        }
      }
      return "";
    },
    memoUrls() {
      let urls = [];
      if (this.memo && this.memo.memo) {
        urls = Array.from(getUrls(this.memo.memo.body));
        // temporary workaround until we fully support unfurling
        urls = urls.filter((url) => this.isImage(url));
      }
      return urls;
    },
  },
  methods: {
    isImage(url) {
      return url.match(/\.(jpeg|jpg|gif|png)$/) != null;
    },
    navToMemo() {
      this.$router.push({ name: "memo", params: { memo: this.memo.id } });
    },
  },
  props: ["memo"],
};
</script>

<style scoped lang="stylus">
.memo-body
  line-height 1.25
  margin-bottom 0.25rem
.link-preview
  display block

  border-radius 1.5rem
  border 1px var(--bc)

  margin 0.75rem 0.5rem 0.5rem 0

  overflow hidden
  height 0
  padding-top 56.25%
  position relative

  img
    position absolute
    top 0
    left 0
    width 100%
</style>
