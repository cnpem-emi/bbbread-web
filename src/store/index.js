import Vuex from 'vuex';
import Vue from 'vue';

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        msalConfig: {
            auth: {
                clientId: process.env.VUE_APP_ID,
                authority: process.env.VUE_APP_AUTH,
            },
            cache: {
                cacheLocation: 'localStorage',
            },
        },
        accessToken: "",
        msalInstance: "",
        account: undefined,
        message: "",
        snackbar: false,
        url: "10.0.38.46"
    },
    mutations: {
        setAccessToken(state, token) {
            state.accessToken = token;
        },
        setInstance(state, msalInstance) {
            state.msalInstance = msalInstance;
        },
        setAccount(state, account) {
            state.account = account;
        },
        setUrl(state, url) {
            state.url = url;
        },
        showSnackbar(state, message) {
            state.snackbar = true;
            state.message = message;
        },
        hideSnackbar(state) {
            state.snackbar = false;
        }
    }
});

export default store;
