<template lang="pug">
.card-memo-post
  .card-memo-post__timeline(
    v-if="memo.timeline && Object.keys(memo.timeline).length > 0")
    .icon: img(src="@/assets/feather/repeat.svg")
    .reposters
      router-link.reposter(
        v-for="repostMemo in memo.timeline"
        :to="{ name: 'account', params: { address: repostMemo.address }}"
        :key="repostMemo.id")
        | {{ reposterDisplayName(repostMemo.address) }}
    .label reposted
  .card-memo-post__main
    corner-error(v-if="memo.height === 0 && memo.response.code")
    corner-spinner(v-else-if="memo.height === 0")
    .container-avatar(@click.self="navToMemo")
      router-link.avatar(
        :to="{ name: 'account', params: {address: memo.address}}")
        avatar-account(:address="memo.address")
    .container-text(@click.self="navToMemo")

      .meta(@click.self="navToMemo")
        router-link.sender(:to="{ name: 'account', params: {address: memo.address}}")
          .displayname {{ displayName }}
          .address @{{ shortAddress(memo.address) }}
        router-link.time(:to="{ name: 'memo', params: { memo: this.memo.id } }")
          | · {{ timeAgo }}

      memo-body(:memo="memo")

      .actions(@click.self="navToMemo")
        btn-icon(
          slot="btn-left" size="small" icon="message-circle" :value="memoComments"
          @click.native.stop="navToMemo")

        // repost button
        btn-icon.btn-repost.btn-repost--active(
          v-if="userReposted"
          slot="btn-left" size="small" icon="repeat" color="green" :value="memoReposts")
        btn-icon.btn-repost(
          v-else
          :class="btnRepostStyle"
          slot="btn-left" size="small" icon="repeat" :value="memoReposts"
          @click.native.stop="actionRepost")

        // like button
        btn-icon.btn-like.btn-like--active(
          v-if="userLiked"
          slot="btn-left" size="small" icon="heart" color="red" :value="memoLikes")
        btn-icon.btn-like(
          v-else
          slot="btn-left" size="small" icon="heart" :value="memoLikes"
          @click.native.stop="actionLike")
</template>

<script>
import { find } from "lodash";

// linkify
import * as linkify from "linkifyjs";
import hashtag from "linkifyjs/plugins/hashtag"; // optional
hashtag(linkify);

import h from "../scripts/helpers";
import tx from "../scripts/tx";
import { mapGetters } from "vuex";
import BtnIcon from "./BtnIcon";
import CornerError from "./CornerError";
import CornerSpinner from "./CornerSpinner";
import AvatarAccount from "./AvatarAccount";
import MemoBody from "./MemoBody";
export default {
  name: "card-memo-post",
  components: {
    BtnIcon,
    CornerError,
    CornerSpinner,
    AvatarAccount,
    MemoBody,
  },
  computed: {
    ...mapGetters([
      "memos",
      "settings",
      "userSignedIn",
      "accounts",
      "queuedMemos",
    ]),
    timeAgo() {
      return h.timeAgo(this.memo.timestamp);
    },
    displayName() {
      return h.getDisplayName(this.accounts, this.memo.address);
    },
    fromAddress() {
      if (this.settings && this.settings.wallet) {
        return this.settings.wallet.address;
      }
      return "";
    },
    memoComments() {
      if (this.memo && this.memo.comments) {
        return this.memo.comments;
      }
      return 0;
    },
    memoReposts() {
      let repostsCount = 0;
      if (this.memo && this.memo.reposts) {
        repostsCount = this.memo.reposts;
      }
      if (this.queuedMemos) {
        for (let key in this.queuedMemos) {
          const memo = this.queuedMemos[key];
          if (memo.type === "repost" && memo.parent === this.memo.id) {
            repostsCount++;
          }
        }
      }
      return repostsCount;
    },
    memoLikes() {
      let likesCount = 0;
      if (this.memo && this.memo.likes) {
        likesCount = this.memo.likes;
      }
      if (this.queuedMemos) {
        for (let key in this.queuedMemos) {
          const memo = this.queuedMemos[key];
          if (memo.type === "like" && memo.parent === this.memo.id) {
            likesCount++;
          }
        }
      }
      return likesCount;
    },
    btnLikeStyle() {
      if (this.userLiked) return "btn-like--active";
      return "btn-like--default";
    },
    btnRepostStyle() {
      if (this.userReposted) return "btn-repost--active";
      return "btn-repost--default";
    },
    userLiked() {
      const memos = { ...this.memos, ...this.queuedMemos };
      if (memos && this.fromAddress) {
        return find(
          memos,
          (m) =>
            m.parent === this.memo.id &&
            m.address === this.fromAddress &&
            m.type === "like"
        );
      }
      return false;
    },
    userReposted() {
      const memos = { ...this.memos, ...this.queuedMemos };
      if (memos && this.fromAddress) {
        return find(
          memos,
          (m) =>
            m.parent === this.memo.id &&
            m.address === this.fromAddress &&
            m.type === "repost"
        );
      }
      return false;
    },
  },
  methods: {
    shortAddress(address) {
      return h.truncAddress(address);
    },
    navToMemo() {
      this.$router.push({ name: "memo", params: { memo: this.memo.id } });
    },
    async actionRepost() {
      if (!this.userSignedIn) {
        this.$router.push({ name: "login" });
        return;
      }
      if (!this.settings.uatom || this.settings.uatom === 0) {
        this.$router.push({ name: "wallet" });
        return;
      }
      let queuedMemo = await tx.sendTx({
        from: this.fromAddress,
        memo: JSON.stringify({
          type: "repost",
          parent: this.memo.id,
        }),
      });
      this.$store.dispatch("addToMemoQueue", queuedMemo);
    },
    async actionLike() {
      if (!this.userSignedIn) {
        this.$router.push({ name: "login" });
        return;
      }
      if (!this.settings.uatom || this.settings.uatom === 0) {
        this.$router.push({ name: "wallet" });
        return;
      }
      let queuedMemo = await tx.sendTx({
        from: this.fromAddress,
        memo: JSON.stringify({
          type: "like",
          parent: this.memo.id,
        }),
      });
      this.$store.dispatch("addToMemoQueue", queuedMemo);
    },
    checkForUserInteractions() {
      if (this.memo.likes || this.memo.reposts) {
        // console.log("checking...");
        this.$store.dispatch("memos/fetchAndAdd", {
          where: [
            ["parent", "==", this.memo.id],
            ["address", "==", this.fromAddress],
          ],
        });
      } else {
        // console.log("no interactions, skipping...");
      }
    },
    reposterDisplayName(address) {
      return h.getDisplayName(this.accounts, address);
    },
  },
  mounted() {
    this.$store.dispatch("accounts/fetchById", this.memo.address);
    this.checkForUserInteractions();
  },
  props: ["memo"],
};
</script>

<style scoped lang="stylus">
.card-memo-post__timeline
  display flex
  align-items center

  height 1.5rem
  padding 0.5rem 0.5rem 0

  font-size 0.875rem
  color var(--dim)

  .icon
    flex 0 0 4rem
    margin-right 0.5rem
    display flex
    justify-content flex-end
    img
      width 0.75rem
      height 0.75rem

  .reposters
    text-overflow ellipsis
    overflow hidden
    white-space nowrap
    min-width 0

  .reposter
    display inline
    color var(--txt)
    padding-right 0.2rem
    &:not(:last-child):after
      content ','
    &:hover
      text-decoration underline

.card-memo-post__main
  border-bottom 1px solid var(--bc)
  display flex
  color var(--txt)
  cursor pointer

  position relative

  &:hover
    background var(--hover-bg)

.container-avatar
  padding 0.5rem

.container-text
  padding 0.5rem 0.5rem 0.5rem 0
  display flex
  flex-flow column nowrap
  flex 1

.avatar
  display flex
  align-items center
  justify-content center

.meta
  display flex
  align-items center
  margin-bottom 0.125rem

  .sender
    margin-right 0.2rem

    text-overflow ellipsis
    overflow hidden
    white-space nowrap
    min-width 0

    .displayname, .address
      display inline

    .displayname
      font-weight bold
      color var(--txt)
      margin-right 0.2rem
      &:hover
        text-decoration underline

    .address
      color var(--dim)

  .time
    color var(--dim)
    white-space nowrap

  .block
    color var(--faint)

.body
  line-height 1.25
  margin-bottom 0.25rem

.actions
  display flex
  justify-content space-between
  width 100%
  max-width 15rem
</style>
