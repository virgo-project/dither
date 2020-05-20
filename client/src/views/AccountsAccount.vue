<template lang="pug">
.page-accounts-account
  app-header(:page-title="displayName")
    btn-icon(slot="btn-left" icon="arrow-left" @click.native="back")
  .page-header
    .cover
    .avatar: avatar-account(:address="this.$route.params.address" size="96")

    .account-displayname {{ displayName }}
    a.account-address(:href="`https://www.mintscan.io/account/${this.$route.params.address}`" rel="noopener noreferrer" target="_blank") @{{ shortAddress }}

    .account-stats
      // router-link.account-stat(:to="{ name: 'following' }")
        | #[strong {{ following }}] following
      // router-link.account-stat(:to="{ name: 'followers' }")
        | #[strong {{ followers }}] followers
      .account-stat
        | #[strong {{ following }}] following
      .account-stat
        | #[strong {{ followers }}] followers

    account-actions(:account="account")

    // .account-stat {{ account.memos }} memos

  dc-timeline(endpoint="feed" :following="[account.id]" :address="address")

  //- infinite-feed(:memos="posts" :queued="queuedPosts" :account="this.$route.params.address")
  app-footer
</template>

<script>
import { mapGetters } from "vuex";
import h from "../scripts/helpers.js";

import AccountActions from "@/components/AccountActions";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import BtnIcon from "@/components/BtnIcon";
import BtnLoadMore from "@/components/BtnLoadMore";
import AvatarAccount from "@/components/AvatarAccount";
import InfiniteFeed from "@/components/InfiniteFeed";
import DcTimeline from "@/components/DcTimeline";

const API = `http://${process.env.VUE_APP_API}`;

export default {
  name: "page-accounts-account",
  components: {
    AccountActions,
    AppHeader,
    AppFooter,
    BtnIcon,
    BtnLoadMore,
    AvatarAccount,
    InfiniteFeed,
    DcTimeline
  },
  data: function() {
    return {
      API
    };
  },
  computed: {
    ...mapGetters(["memos", "queuedMemos", "accounts"]),
    displayName() {
      return h.getDisplayName(this.accounts, this.$route.params.address);
    },
    shortAddress() {
      return h.truncAddress(this.$route.params.address);
    },
    address() {
      return this.$route.params.address;
    },
    account() {
      if (this.accounts[this.$route.params.address]) {
        return this.accounts[this.$route.params.address];
      } else {
        return {
          id: this.$route.params.address,
          memos: 0
        };
      }
    },
    following() {
      if (this.account.following) {
        return this.account.following.length;
      }
      return 0;
    },
    followers() {
      if (this.account.followers) {
        return this.account.followers.length;
      }
      return 0;
    }
  },
  async created() {
    await this.$store.dispatch("accounts/fetchById", this.account.id);
  },
  methods: {
    back() {
      this.$router.go(-1);
    }
  }
};
</script>

<style scoped lang="stylus">
.page-header
  text-align center
  padding-bottom 1.5rem

  .cover
    background var(--txt)
    height 5rem

  .avatar
    margin -3rem auto 0
    margin-bottom 0.75rem

  .account-displayname
    font-size 1.75rem
    font-weight bold
    display block
    color var(--txt)

  .account-address
    color var(--dim)

    &:hover
      text-decoration underline

  .account-stats
    display flex
    justify-content center

  .account-stat
    padding 0 1rem
    color var(--txt)

    &:hover
      text-decoration underline

  .account-actions
    margin-top 0.5rem
</style>
