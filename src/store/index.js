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
        url: "ais-eng-srv-la.cnpem.br",
        beaglebones: [],
        loading: false
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
        },
        async update_beaglebones(state) {
            state.loading = true;
            let config = {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            };

            const response = await fetch(
                `https://${state.url}/simar/api/beaglebones?ps=true`,
                config,
            );

            const resp_json = await response.json();

            if (!state.beaglebones.length) state.beaglebones = resp_json;

            state.beaglebones = state.beaglebones.map((item, i) =>
                Object.assign({}, { show: item.show ?? false }, resp_json[i])
            );
            state.loading = false;
        }
    }
});


export default store;
