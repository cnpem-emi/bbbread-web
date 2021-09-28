import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import store from './store';

Vue.config.productionTip = false
Vue.prototype.$msalInstance = {};

let host = "10.0.38.42";
if (window.location.host === "vpn.cnpem.br") {
  // If using WEB VPN
  // Capture IPv4 address
  const ipRegExp =
    /https?\/((?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])))\//;
  const match = ipRegExp.exec(window.location.href);
  if (match && match.length > 1) {
    host = match[1];
  }
} else {
    host = window.location.host;
}
if (
      host.includes("0.0.0.0") ||
      host.includes("localhost") ||
      host.includes("10.0.38.50") ||
      host.includes("10.0.6.70")
   ) {
   host = "10.0.38.46";
   console.log("__`o##o>__ DEBUG SERVER. Setting host to 10.0.38.46");
}

Vue.mixin({
  methods: {
    async sendCommand(command, token = "") {
      const response = await fetch(`https://${this.$store.state.url}/archiver-generic-backend/bypass?${this.$store.state.url}:7379/${command}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      });

      return response.json();
    },
  }
});

new Vue({
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')

store.commit("setUrl", host);
