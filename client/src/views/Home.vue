<template lang="pug">
.page-home
  app-header(page-title="Dither Alpha")
    template(v-slot:btn-left v-if="userSignedIn")
      btn-icon(type="link" :to="{ name: 'settings' }" icon="settings")
    template(v-slot:btn-right v-if="userSignedIn")
      btn-icon(type="link" :to="{ name: 'memos-new' }" icon="edit")
    template(v-slot:btn-right v-else)
      btn-icon(type="link" :to="{ name: 'login' }" icon="log-in")
  dc-rt-memo(v-for="memo in timelineStream" :value="memo" :address="address")
  .btn-load-more(style="btnStyle")
    dc-btn(size="large" @click.native="fetchAndAddMemos" icon="refresh-cw") Show more
  app-footer
</template>

<style lang="stylus" scoped>
.btn-load-more
  height 5rem
  display flex
  align-items center
  justify-content center
</style>

<script>
import { mapGetters } from "vuex";
import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import DcCardMemo from "@/components/DcCardMemo";
import axios from "axios";
import DcTimeline from "@/components/DcTimeline";
import BtnIcon from "@/components/BtnIcon";
import DcRtMemo from "@/components/DcRtMemo";
import DcBtn from "@/components/DcBtn";
import { orderBy } from "lodash";

const API = `http://${process.env.VUE_APP_API}`;

export default {
  name: "page-index",
  components: {
    AppHeader,
    AppFooter,
    DcCardMemo,
    DcTimeline,
    BtnIcon,
    DcRtMemo,
    DcBtn
  },
  computed: {
    ...mapGetters(["userSignedIn", "incoming", "outgoing"]),
    timelineStream() {
      let events = [...this.incoming, ...this.outgoing];
      events = events.filter(memo => {
        const isPost = memo.type === "post";
        const isFollowing = this.following.includes(memo.from_address);
        return isPost && isFollowing;
      });
      return orderBy([...events, ...this.timeline], "created_at", "desc");
    }
  },
  data: function() {
    return {
      address: null,
      following: [],
      settings: null,
      API,
      timeline: []
    };
  },
  methods: {
    async fetchFollowing() {
      const from_address = this.address && `from_address=${this.address}`;
      const url = `${API}/following?${from_address}`;
      return (await axios.get(url)).data;
    },
    async fetchAndAddMemos() {
      const last = this.timeline[this.timeline.length - 1];
      const after = last ? `after=${last.created_at}` : "";
      const from_address = this.address ? `from_address=${this.address}` : "";
      const timeline = (
        await axios.get(`${API}/timeline?${from_address}&${after}`)
      ).data.map(tx => {
        return {
          ...tx,
          received_at: new Date().getTime()
        };
      });
      this.timeline = [...this.timeline, ...timeline];
    }
  },
  async created() {
    try {
      this.settings = await this.$store.dispatch("fetchSettings");
    } catch {
      console.log("Failed to fetch user settings.");
    }
    this.address = this.settings && this.settings.wallet.address;
    this.fetchAndAddMemos();
    this.following = await this.fetchFollowing();
  }
};
</script>
