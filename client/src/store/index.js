/* eslint-disable */
import Vue from "vue";
import Vuex from "vuex";
import VuexEasyFirestore from "vuex-easy-firestore";
Vue.use(Vuex);
import router from "../router/index.js";
import io from "socket.io-client";
import { Firebase, initFirebase } from "./firebase.js";

const API = `http://${process.env.VUE_APP_API}`;

// import vuex-firestore modules
import accounts from "./modules/accounts.js";
import blockchains from "./modules/blockchains.js";
import memos from "./modules/memos.js";
import memoLikes from "./modules/memoLikes.js";
import notifications from "./modules/notifications.js";
import settings from "./modules/settings.js";
import defaultFollowing from "./defaultFollowing.json";
import tx from "@/scripts/tx";
import { sortBy } from "lodash";

// connect vuex-firestore modules to firestore
const easyFirestore = VuexEasyFirestore(
  [accounts, blockchains, memos, memoLikes, notifications, settings],
  {
    logging: true,
    FirebaseDependency: Firebase,
  }
);

// import channels
import channels from "../../../channels.json";

const storeData = {
  plugins: [easyFirestore],
  getters: {
    incoming: (state) => {
      return state.incoming;
    },
    outgoing: (state) => {
      const memos = Object.values(state.queuedMemos).map((tx) => {
        return {
          txhash: tx.id,
          created_at: tx.timestamp,
          type: tx.memo.type,
          body: tx.memo.body,
          parent: tx.memo.parent,
          from_address: tx.address,
          received_at: tx.received_at,
          like_count: "0",
          repost_count: "0",
          like_self: null,
          repost_self: null,
          status: "queued",
        };
      });
      return sortBy(memos, ["created_at"]);
    },
    accounts: (state) => {
      return state.accounts.data;
    },
    blockchain: (state) => {
      return state.blockchain;
    },
    blockchains: (state) => {
      return state.blockchains.data;
    },
    chainId: (state) => {
      return state.blockchain.chainId;
    },
    channels: (state) => {
      return state.channels;
    },
    defaultAccounts: (state) => {
      return state.defaultAccounts.data;
    },
    following: (state) => {
      return state.following;
    },
    memos: (state) => {
      return state.memos.data;
    },
    memoLikes: (state) => {
      return state.memoLikes.data;
    },
    notifications: (state) => {
      return state.notifications.data;
    },
    settings: (state) => {
      return state.settings.data;
    },
    queuedMemos: (state) => {
      return state.queuedMemos;
    },
    queuedSequence: (state) => {
      return state.queuedSequence;
    },
    user: (state) => {
      return state.user;
    },
    userSignedIn: (state) => {
      return state.userSignedIn;
    },
  },
  state: {
    incoming: [],
    blockchain: {
      chainId: "cosmoshub-3",
      lcd: "https://lcd.nylira.net",
      toAddress: "cosmos1lfq5rmxmlp8eean0cvr5lk49zglcm5aqyz7mgq",
      defaultGas: "100000",
      height: 0,
      queuedSequence: 0,
      // load the last x days of memos (at 7s per block)
      blockRange: (1 * 24 * 60 * 60) / 7,
    },
    channels: channels,
    userSignedIn: false,
    user: {
      displayName: "Loading",
      providerData: [
        {
          photoURL: "Loading",
          displayName: "Loading",
          providerId: "Loading",
        },
      ],
    },
    following: [],
    queuedMemos: {},
    queuedTxSends: {},
  },
  actions: {
    authCheck({ state }) {
      if (!state.userSignedIn) {
        router.push({ name: "login" });
        return;
      }
      if (!state.settings.data.uatom || state.settings.data.uatom === 0) {
        router.push({ name: "wallet" });
        return;
      }
    },
    actionLike({ dispatch, state }, memo) {
      dispatch("authCheck");
      return new Promise((resolve, reject) => {
        tx.sendTx({
          from: state.settings.data.wallet.address,
          memo: JSON.stringify({
            type: "like",
            parent: memo.txhash,
          }),
        }).then((data) => {
          dispatch("addToMemoQueue", data);
          resolve(data);
        });
      });
    },
    actionRepost({ dispatch, state }, memo) {
      dispatch("authCheck");
      return new Promise((resolve, reject) => {
        tx.sendTx({
          from: state.settings.data.wallet.address,
          memo: JSON.stringify({
            type: "repost",
            parent: memo.txhash,
          }),
        }).then((data) => {
          dispatch("addToMemoQueue", data);
          resolve(data);
        });
      });
    },
    socketInit({ dispatch, commit }) {
      this.socket = io(`${API}`);
      this.socket.on("newtx", (tx) => {
        dispatch("rmFromMemoQueue", tx.txhash);
        const transaction = {
          ...tx,
          received_at: new Date().getTime(),
        };
        commit("addIncoming", transaction);
      });
    },
    addToMemoQueue({ commit }, memo) {
      commit("addQueuedMemo", memo);
      commit("incrementQueuedSequence");
      // console.log("add to queue:", state.queuedMemos[memo.id]);
    },
    rmFromMemoQueue({ commit, state }, id) {
      if (state.queuedMemos[id]) {
        // console.log("rm from queue:", state.queuedMemos[id]);
        commit("rmQueuedMemo", id);
        commit("decrementQueuedSequence");
      }
    },
    authenticate({ commit }) {
      return new Promise((resolve, reject) => {
        Firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            commit("signInUser", user);
            resolve(user);
          } else {
            reject();
          }
        });
      });
    },
    fetchSettings({ dispatch }) {
      return new Promise((resolve, reject) => {
        dispatch("authenticate")
          .then(() => {
            dispatch("settings/fetchAndAdd").then((settings) => {
              resolve(settings);
            });
          })
          .catch(() => {
            reject();
          });
      });
    },
    fetchFollowingList({ dispatch, commit }) {
      return new Promise((resolve) => {
        dispatch("fetchSettings")
          .then((settings) => {
            const address = settings.wallet.address;
            Firebase.firestore()
              .collection("accounts")
              .doc(address)
              .get()
              .then((account) => {
                // add users own account to following
                let following = account.data().following;
                following.push(address);

                commit("setFollowing", following);
                resolve(following);
              });
          })
          .catch(() => {
            commit("setFollowing", defaultFollowing);
            resolve(defaultFollowing);
          });
      });
    },
  },
  mutations: {
    addIncoming(state, tx) {
      state.incoming = [tx, ...state.incoming];
    },
    setHeight(state, height) {
      if (height > state.blockchain.height) {
        state.blockchain.height = height;
        // console.log("set blockchain height to", state.blockchain.height);
      }
    },
    setFollowing(state, following) {
      state.following = following;
    },
    addFollow(state, address) {
      state.following.push(address);
    },
    rmFollow(state, address) {
      state.following = state.following.filter(
        (followingAddress) => followingAddress !== address
      );
    },
    addQueuedMemo(state, memo) {
      const m = { ...memo, received_at: new Date().getTime() };
      Vue.set(state.queuedMemos, memo.id, m);
    },
    rmQueuedMemo(state, id) {
      Vue.delete(state.queuedMemos, id);
    },
    addQueuedTxSends(state, txSend) {
      Vue.set(state.queuedTxSends, txSend.id, txSend);
      console.log("adding to queue:", state.queuedTxSends[txSend.id]);
    },
    incrementQueuedSequence(state) {
      state.blockchain.queuedSequence += 1;
      // console.log("queuedSequence + 1", state.blockchain.queuedSequence);
    },
    decrementQueuedSequence(state) {
      state.blockchain.queuedSequence -= 1;
      // console.log("queuedSequence - 1", state.blockchain.queuedSequence);
    },
    signInUser(state, user) {
      state.user = user;
      state.userSignedIn = true;
    },
    signOutUser(state) {
      Firebase.auth().signOut();
      state.user = {};
      state.userSignedIn = false;
      router.push({
        name: "login",
      });
    },
  },
};

// init Vuex
const store = new Vuex.Store(storeData);

// init Firebase
initFirebase().catch((error) => {
  console.log("there was a firebase error", error);
  // take user to a page stating an error occurred
  // (might be a connection error, or the app is open in another tab)
});

export default store;
