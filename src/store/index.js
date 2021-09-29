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
        set_token(state, token) {
            state.accessToken = token;
        },
        set_instance(state, msalInstance) {
            state.msalInstance = msalInstance;
        },
        set_account(state, account) {
            state.account = account;
        },
        set_url(state, url) {
            state.url = url;
        },
        show_snackbar(state, message) {
            state.snackbar = true;
            state.message = message;
        },
        hide_snackbar(state) {
            state.snackbar = false;
        }
    }
});

export default store;
