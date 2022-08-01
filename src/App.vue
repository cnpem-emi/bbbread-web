<template>
  <v-app>
    <v-main fluid>
      <v-card>
        <v-toolbar flat color="#0059b3" dark>
          <v-row dense>
            <v-col align-self="center">
              <v-toolbar-title>BBBread</v-toolbar-title>
            </v-col>
            <v-col justify="center" align-self="center">
              <v-row align="center">
                <v-text-field
                  v-model="search"
                  clearable
                  single-line
                  hide-details
                  :prepend-inner-icon="mdiMagnify"
                  label="Search"
                  :value="searchPreset"
                ></v-text-field>
                <v-btn @click="$store.commit('updateBeaglebones')" icon
                  ><v-icon>{{ mdiRefresh }}</v-icon></v-btn
                >
              </v-row>
            </v-col>
            <v-col>
              <v-row justify="center" align="center">
                <v-spacer />
                <v-btn icon @click="getCsv"
                  ><v-icon>{{ mdiFileDownload }}</v-icon></v-btn
                >
                <LoginMenu
                  class="flex-grow-0"
                  @logout="logout"
                  @login="login"
                />
              </v-row>
            </v-col>
          </v-row>
        </v-toolbar>
        <v-tabs v-model="tab" background-color="#f2f2f2">
          <v-tab>
            <v-icon left> {{ mdiListStatus }} </v-icon>
            Status
          </v-tab>
          <v-tab>
            <v-icon left> {{ mdiClockAlertOutline }} </v-icon>
            Logs
          </v-tab>
          <v-tab>
            <v-icon left> {{ mdiLightningBoltOutline }} </v-icon>
            Power Supplies
          </v-tab>
          <v-tab
            href="https://github.com/lnls-sirius/bbb-function/blob/master/src/scripts/AUTOCONFIG.xlsx/"
          >
            <v-icon left> {{ mdiFileTableBoxMultipleOutline }} </v-icon>
            Autoconfig
          </v-tab>
        </v-tabs>
        <v-card flat>
          <status-tab
            v-if="tab === 0 || tab === 2"
            v-bind:psOnly="tab === 2"
            v-bind:searchText="search"
          />
          <logs-tab v-else v-bind:searchText="search" />
        </v-card>
      </v-card>
    </v-main>
    <FooterBar />
    <ConfirmDialog ref="confirm" />
    <v-snackbar
      v-model="$store.state.snackbar"
      timeout="4000"
      color="white"
      light
    >
      {{ $store.state.message }}

      <template v-slot:action="{ attrs }">
        <v-btn icon text v-bind="attrs" @click="$store.commit('hideSnackbar')">
          <v-icon>{{ mdiClose }}</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script>
import { PublicClientApplication } from "@azure/msal-browser";
import StatusTab from "@/components/StatusTab";
import FooterBar from "@/components/FooterBar";
import ConfirmDialog from "@/components/ConfirmDialog";
import LoginMenu from "@/components/LoginMenu";
import {
  mdiListStatus,
  mdiClockAlertOutline,
  mdiLightningBoltOutline,
  mdiClose,
  mdiFileTableBoxMultipleOutline,
  mdiFileDownload,
  mdiMagnify,
  mdiRefresh,
} from "@mdi/js";
import LogsTab from "./components/LogsTab.vue";

export default {
  name: "App",
  data() {
    return {
      searchPreset: "",
      search: "",
      tab: "",
      mdiListStatus,
      mdiClockAlertOutline,
      mdiClose,
      mdiLightningBoltOutline,
      mdiFileTableBoxMultipleOutline,
      mdiFileDownload,
      mdiMagnify,
      mdiRefresh,
    };
  },

  components: {
    StatusTab,
    FooterBar,
    ConfirmDialog,
    LoginMenu,
    LogsTab,
  },

  async created() {
    const msalInstance = new PublicClientApplication(
      this.$store.state.msalConfig
    );

    this.$store.commit("setInstance", msalInstance);
  },
  async mounted() {
    this.$root.$confirm = this.$refs.confirm.open;

    const accounts = this.$store.state.msalInstance.getAllAccounts();
    if (accounts.length == 0) {
      return;
    }
    accounts[0].initials = this.getInitials(accounts[0]);
    this.$store.commit("setAccount", accounts[0]);

    let queryString = new URLSearchParams(window.location.search);
    this.searchPreset = queryString.get("search") ?? "";
  },
  methods: {
    async login() {
      await this.$store.state.msalInstance
        .loginPopup({})
        .then(() => {
          const accounts = this.$store.state.msalInstance.getAllAccounts();
          accounts[0].initials = this.getInitials(accounts[0]);
          this.$store.commit("setAccount", accounts[0]);
        })
        .catch((error) => {
          console.error(`Error during authentication: ${error}`);
        });
      this.$store.commit(
        "showSnackbar",
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
    async getCsv() {
      const response = await this.sendCommand("beaglebones");
      const respJson = await response.json();

      let csv = Object.keys(respJson[0]).join(",");

      for (let beagle of respJson) csv += "\n" + Object.values(beagle);

      var utfArr = new Uint16Array(
        csv.split("").map(function (k) {
          return k.charCodeAt(0);
        })
      );

      const download = URL.createObjectURL(
        new Blob([utfArr], { type: "text/csv;charset=UTF-16LE;" })
      );

      // This is hackish, but seems to be the best way without opening a new window
      let hiddenLink = document.createElement("a");
      hiddenLink.href = download;
      hiddenLink.download = "beaglebones.csv";
      hiddenLink.click();
    },
  },
};
</script>

<style scoped>
.v-main {
  background: rgb(1, 45, 87);
}
</style>
