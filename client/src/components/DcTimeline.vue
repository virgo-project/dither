<template lang="pug">
  div
    dc-card-memo(v-for="memo in timelineStream" :memo="memo" @like="actionLike($event)" @repost="actionRepost($event)")
    .btn-load-more(style="btnStyle" v-if="!txhash")
      dc-btn(size="large" @click.native="fetchAndAddMemos" icon="refresh-cw") Show more
</template>

<style lang="stylus" scoped>
.btn-load-more
  height 5rem
  display flex
  align-items center
  justify-content center
</style>

<script>
import DcCardMemo from "@/components/DcCardMemo";
import DcBtn from "@/components/DcBtn";
import { mapGetters } from "vuex";
import axios from "axios";
import { cloneDeep, sortBy, find } from "lodash";

const API = `http://${process.env.VUE_APP_API}`;

export default {
  components: {
    DcCardMemo,
    DcBtn
  },
  props: {
    endpoint: {
      type: String
    },
    following: {
      type: Array
    },
    address: {
      type: String
    },
    txhash: {
      type: String
    }
  },
  data: function() {
    return {
      timeline: [],
      socket: null,
      settings: null
    };
  },
  computed: {
    ...mapGetters(["queuedMemos", "userSignedIn"]),
    outgoing() {
      const memos = Object.values(this.queuedMemos).map(tx => {
        return {
          txhash: tx.id,
          created_at: tx.timestamp,
          type: tx.memo.type,
          body: tx.memo.body,
          parent: tx.memo.parent,
          from_address: tx.address,
          received_at: new Date().getTime(),
          like_count: "0",
          repost_count: "0",
          like_self: null,
          repost_self: null,
          status: "queued"
        };
      });
      return sortBy(memos, ["created_at"]);
    },
    incoming() {
      return this.$store.state.incoming;
    },
    timelineStream() {
      let timeline = cloneDeep(this.timeline);
      const events = [...this.outgoing, ...this.incoming];
      events.forEach(tx => {
        const parent = find(timeline, ["txhash", tx.parent]);
        const follows = this.following.includes(tx.from_address);
        const isPost = tx.type === "post" && follows;
        const isNew = parent && tx.received_at > parent.received_at;
        if (isPost) {
          timeline = [tx, ...timeline];
        }
        if (tx.type === "like" && isNew) {
          parent.like_count++;
          if (tx.from_address === this.address) {
            parent.like_self = tx.txhash;
          }
        }
        if (tx.type === "repost" && isNew) {
          parent.repost_count++;
          if (tx.from_address === this.address) {
            parent.repost_self = tx.txhash;
          }
        }
        if (tx.type === "comment" && isNew) {
          parent.comment_count++;
        }
      });
      return timeline;
    }
  },
  methods: {
    actionLike(memo) {
      this.$store.dispatch("actionLike", memo);
    },
    actionRepost(memo) {
      this.$store.dispatch("actionRepost", memo);
    },
    async fetchAndAddMemos() {
      this.timeline = [...this.timeline, ...(await this.fetchMemos())];
    },
    async fetchMemos() {
      const last = this.timeline[this.timeline.length - 1];
      const after = last ? `after=${last.created_at}` : "";
      const from_address = this.address ? `from_address=${this.address}` : "";
      const url = `${API}/${this.endpoint}?${from_address}&${after}&txhash=${this.txhash}`;
      let memos = (await axios.get(url)).data;
      memos = Array.isArray(memos) ? memos : [memos];
      return memos.map(m => {
        return {
          ...m,
          received_at: new Date().getTime()
        };
      });
    }
  },
  async created() {
    this.fetchAndAddMemos();
  }
};
</script>