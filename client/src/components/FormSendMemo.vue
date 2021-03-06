<template lang="pug">
form.form-memo(@submit.prevent.default="validateAndSend")
  textarea#memo-body(v-model="memo" :placeholder="placeholderText")
  .field-note Bytes left: {{ bytesLeft }}
  .field-note.field-note--error(v-if="formHasError") {{ formErrorMsg }}
  dc-btn(type="submit") {{ submitText }}
</template>

<script>
import { byteLength } from "byte-length";

import { mapGetters } from "vuex";
import tx from "../scripts/tx";
import DcBtn from "./DcBtn";
export default {
  name: "form-send-memo",
  components: {
    DcBtn
  },
  computed: {
    ...mapGetters(["settings", "blockchain", "queuedMemos"]),
    placeholderText() {
      if (this.type === "comment") {
        return "Leave your comment";
      }
      return "What's on your mind?";
    },
    submitText() {
      if (this.type === "comment") {
        return "Comment";
      }
      return "Post";
    },
    bytesLeft() {
      let bytes = 512;
      bytes -= byteLength(`"{"type":"${this.type}","body":"${this.memo}"}"`);
      if (this.channel && this.channel !== "general") {
        bytes -= byteLength(`,"channel":"${this.channel}"`);
      }
      if (this.parentAddress) {
        bytes -= byteLength(`,"parent":"${this.parentAddress}"`);
      }
      return bytes;
    },
    fromAddress() {
      return this.settings.wallet.address;
    }
  },
  data: () => ({
    memo: "",
    formHasError: false,
    formErrorMsg: ""
  }),
  methods: {
    async validateAndSend() {
      if (this.bytesLeft === 512) {
        this.formHasError = true;
        this.formErrorMsg = "Memo needs to have some text";
        return;
      } else if (this.bytesLeft < 0) {
        this.formHasError = true;
        this.formErrorMsg = "Memo is too long";
        return;
      } else {
        this.formHasError = false;
        this.formErrorMessage = "";
      }
      this.sendTx();
    },
    async sendTx() {
      let queuedMemo = await tx.sendTx({
        from: this.fromAddress,
        memo: JSON.stringify({
          type: this.type,
          parent: this.parentAddress,
          body: this.memo,
          channel: this.channel
        })
      });
      this.$store.dispatch("addToMemoQueue", queuedMemo);

      this.memo = "";

      if (this.$route.path === "/memos/new") {
        this.$router.push({ name: "home" });
      }
    }
  },
  mounted() {
    this.$el.querySelector("#memo-body").focus();
  },
  props: ["type", "parent-address", "channel"]
};
</script>

<style scoped lang="stylus">
form
  width 100%

textarea
  display block
  border 1px solid var(--bc-input)
  height 6rem
  margin-bottom 0.5rem
  box-sizing border-box
  width 100%
  padding 0.5rem

.field-note
  font-size 0.75rem
  margin-bottom 0.5rem
  color var(--dim)

.field-note--error
  color var(--danger)
</style>
