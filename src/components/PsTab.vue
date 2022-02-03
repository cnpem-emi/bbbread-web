<template>
  <v-container fluid>
    <ToolBar
      @search="update_search"
      @refresh="get_all"
      v-bind:search="search" />
    <v-data-table
      show-expand
      :headers="headers"
      :items="filtered_beagles"
      :search="search.text"
      :loading="loading_bbbs"
      item-key="key"
      :show-select="$store.state.account !== undefined"
      @toggle-select-all="toggle_select"
      v-model="selected"
    >
      <template v-slot:item.state_string="{ item }">
        <v-chip :color="get_color(item.state_string)" dark>
          {{ item.state_string }}
        </v-chip>
      </template>
      <template v-slot:item.ps="{ item }">
        <v-chip small v-for="ps in item.ps" :key="ps">
          {{ ps }}
        </v-chip>
      </template>

      <template v-slot:footer v-if="selected.length > 0">
        <div style="position: absolute" class="pa-0 pl-2">
          <v-btn
            v-for="action in actions"
            :key="action"
            color="red"
            :disabled="$store.state.account === undefined"
            dark
            @click="performAction(false, action)"
            style="margin: 10px 10px 10px 0; flex-shrink: 1"
            >{{ action }}</v-btn
          >
        </div>
      </template>
      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length" style="padding: 10px">
          <v-data-table
            flat
            dense
            :hide-default-footer="true"
            :headers="innerHeaders"
            :items="[item]"
          >
            <template v-slot:item.udc="{ item }">
              <v-chip small v-for="udc in item.udc" :key="udc">
                {{ udc }}
              </v-chip>
            </template>
          </v-data-table>

          <div style="text-align: right; position: relative">
            <span
              style="position: absolute; bottom: 0; left: 0"
              class="grey--text font-weight-light"
              ><v-icon small left> mdi-clock </v-icon> last seen at
              {{ item.last_seen }}</span
            >
            <v-btn
              v-for="action in actions"
              :key="action"
              class="white--text"
              color="red"
              :disabled="$store.state.account === undefined"
              @click="performAction(item, action)"
              style="margin-right: 10px; flex-shrink: 1"
              >{{ action }}</v-btn
            >
          </div>
        </td>
      </template>
    </v-data-table>

    <ServicesDialog
      v-bind:items="selected"
      :dialog="service_dialog"
      @closeDialog="service_dialog = false"
  /></v-container>
</template>

<script>
import ToolBar from "./ToolBar";
import ServicesDialog from "./ServicesDialog";
import { actions, possible_statuses } from "../assets/constants";

export default {
  components: { ToolBar, ServicesDialog },
  props: ["refresh"],
  data() {
    return {
      filter: {},
      user_sure: false,
      service_dialog: false,
      page: 1,
      itemsPerPage: 8,
      selected: [],
      actions: actions,
      innerHeaders: [
        { text: "Nameservers", value: "nameservers" },
        { text: "IP Type", value: "ip_type" },
        { text: "Sector", value: "sector" },
        { text: "UDC", value: "udc" },
      ],
      headers: [
        { text: "IP", align: "start", value: "ip_address" },
        { text: "Hostname", value: "name" },
        { text: "Status", value: "state_string" },
        { text: "Power Supplies", value: "ps", width: "45%" },
        { text: "Role", value: "role" },
        { value: "data-table-expand" },
      ],
      items: [],
      symbols: {},
      loading_bbbs: true,
      search: {
        text: "",
        statuses: possible_statuses,
        room: "All",
        ip_types: ip_types,
      },
    };
  },
  computed: {
    filtered_beagles() {
      return this.items.filter((i) => {
        return (
          i.state_string !== undefined &&
          (i.name.indexOf(this.search.text) !== -1 ||
            i.ip_address.indexOf(this.search.text) !== -1 ||
            i.ps.join("").includes(this.search.text)) &&
          this.search.statuses.some((j) => i.state_string.includes(j)) &&
          this.search.ip_types.includes(i.ip_type) &&
          (this.search.room === i.sector || this.search.room === "All")
        );
      });
    },
  },
  methods: {
    toggle_select(selected) {
      if (!selected.value) this.selected = [];
      else this.selected = selected.items;
    },
    async get_all() {
      const response = await this.send_command("beaglebones?ps");
      this.items = await response.json();
      this.loading_bbbs = false;
    },
    async performAction(item, action) {
      if (item) this.selected = [item];
      else item = this.selected[0];

      if (action !== "Services") {
        let confirmation = await this.$root.$confirm(
          "Confirmation",
          `Are you sure you want to ${action.toLowerCase()} ${
            item.ip_address
          } (${item.name}) ${
            this.selected.length > 1
              ? `and other ${this.selected.length - 1} nodes`
              : ""
          }?`
        );
        if (confirmation) {
          const reply = await this.send_command(
            "beaglebones",
            { [action.toLowerCase()]: this.selected.map((b) => b.key) },
            "POST"
          );
          if (reply.status === 200) {
            this.$store.commit(
              "show_snackbar",
              `Successfully applied changes to ${this.selected[0].name} ${
                this.selected.length > 1
                  ? `and other ${this.selected.length - 1} nodes`
                  : ""
              }!`
            );
          }
        }
      } else {
        this.service_dialog = true;
      }
      this.get_all();
    },
    get_color(item) {
      switch (item) {
        case "Disconnected":
          return "red";
        case "Connected":
          return "green";
        default:
          return "orange";
      }
    },
    update_search(search) {
      this.search.text = search;
    },
  },
  created() {
    this.get_all();
    this.interval = setInterval(this.get_all, 35000);
  },
};
</script>

<style scoped>
.no-margin {
  margin: 0;
}

.blue-background {
  background: rgb(21, 101, 192);
}

div:first-child .v-data-iterator {
  color: white;
}
</style>
