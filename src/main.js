import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import store from './store';

Vue.config.productionTip = false
Vue.prototype.$msalInstance = {};

Vue.mixin({
  methods: {
    async send_command(endpoint, body, method = "GET") {
      let config = {
        method: method,
        headers: { "Content-Type": "application/json" },
      };

      if (method !== "GET") {
        config["body"] = JSON.stringify(body);
        config["headers"]["Authorization"] = `Bearer ${await this.get_token()}`;
      }

      const response = await fetch(
        `https://${this.$store.state.url}/simar/api/${endpoint}`,
        config,
      );

      return response;
    },
    async get_token() {
      let token;
      try {
        token = await this.$store.state.msalInstance.acquireTokenSilent({
          scopes: ["User.Read"],
          account: this.$store.state.account,
        });
      } catch (err) {
        console.error(err);
        token = await this.$store.state.msalInstance.acquireTokenPopup({
          scopes: ["User.Read"],
          account: this.$store.state.account,
        });
      }

      return token.accessToken;
    }
  },
});

new Vue({
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')

if (window.location.host === "vpn.cnpem.br") {
  const ipRegExp =
    /https?\/((?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])))\//;
  const match = ipRegExp.exec(window.location.href);
  if (match && match.length > 1) store.commit("set_url", match[1]);
} else {
  if (process.env.NODE_ENV !== "development") store.commit("set_url", window.location.host);
}
