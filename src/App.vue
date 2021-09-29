<template>
  <v-app>
    <v-main fluid>
      <v-card>
        <v-toolbar flat color="primary" dark>
          <v-toolbar-title class="flex-grow-1">BBBread</v-toolbar-title>
          <login class="flex-grow-0" @logout="logout" @login="login" />
        </v-toolbar>
        <v-tabs background-color="#f2f2f2">
          <v-tab>
            <v-icon left> mdi-list-status </v-icon>
            Status
          </v-tab>
          <v-tab>
            <v-icon left> mdi-clock-alert-outline </v-icon>
            Logs
          </v-tab>
          <v-tab>
            <v-icon left> mdi-lightning-bolt-outline </v-icon>
            Power Supplies
          </v-tab>
          <v-tab-item>
            <v-card flat>
              <status/>
            </v-card>
          </v-tab-item>
          <v-tab-item>
            <v-card flat>
              <logs/>
            </v-card>
          </v-tab-item>
          <v-tab-item>
            <v-card flat>
              <ps/>
            </v-card>
          </v-tab-item>
        </v-tabs>
      </v-card>
    </v-main>
    <ft />
    <confirm ref="confirm" />
    <v-snackbar
      v-model="$store.state.snackbar"
      timeout="4000"
      color="white"
      light
    >
      {{ $store.state.message }}

      <template v-slot:action="{ attrs }">
        <v-btn icon text v-bind="attrs" @click="$store.commit('hide_snackbar')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script>
import { PublicClientApplication } from "@azure/msal-browser";
import status from "./components/status";
import logs from "./components/logs";
import ft from "./components/footer";
import confirm from "./components/confirm";
import login from "./components/login";
import ps from "./components/ps";

export default {
  name: "App",

  components: {
    status,
    logs,
    ft,
    confirm,
    login,
    ps,
  },

  async created() {
    const msalInstance = new PublicClientApplication(
      this.$store.state.msalConfig
    );

    this.$store.commit("set_instance", msalInstance);
  },
  async mounted() {
    this.$root.$confirm = this.$refs.confirm.open;

    const accounts = this.$store.state.msalInstance.getAllAccounts();
    if (accounts.length == 0) {
      return;
    }
    accounts[0].initials = this.getInitials(accounts[0]);
    this.$store.commit("set_account", accounts[0]);
  },
  methods: {
    async login() {
      await this.$store.state.msalInstance
        .loginPopup({})
        .then(() => {
          const accounts = this.$store.state.msalInstance.getAllAccounts();
          accounts[0].initials = this.getInitials(accounts[0]);
          this.$store.commit("set_account", accounts[0]);
        })
        .catch((error) => {
          console.error(`Error during authentication: ${error}`);
        });
      this.$store.commit(
        "show_snackbar",
        `Logged in as ${this.$store.state.account.username}`
      );
    },
    async logout() {
      await this.$store.state.msalInstance.logout({}).catch((error) => {
        console.error(error);
      });
    },
    getInitials(account) {
      return account.name.split(" ")[0].substring(0, 1);
    },
  },
};
</script>

<style scoped>
.v-main {
  background: rgb(1, 45, 87);
}
</style>
