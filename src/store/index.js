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
        },
        async updateBeaglebones(state) {
            state.loading = true;
            let config = {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            };

            const response = await fetch(
                `https://${state.url}/simar/api/beaglebones?ps=true`,
                config,
            );

            const respJson = await response.json();

            if (!state.beaglebones.length) state.beaglebones = respJson;

            state.beaglebones = state.beaglebones.map((item, i) =>
                Object.assign({}, { show: item.show ?? false }, respJson[i])
            );
            state.loading = false;
        }
    }
});


export default store;
