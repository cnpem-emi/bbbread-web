<template>
  <v-container fluid>
    <ToolBar v-bind:search="search" />
    <v-data-table
      :headers="headers"
      :items="filtered_beagles"
      :search="searchText"
      :loading="$store.state.loading"
      item-key="key"
      :show-select="$store.state.account !== undefined"
      @toggle-select-all="toggle_select"
      @click:row="row_click"
      v-model="selected"
      class="row-pointer"
    >
      <template v-slot:item.state_string="{ item }">
        <v-chip :color="get_color(item.state_string)" dark>
          {{ item.state_string }}
        </v-chip>
        <details-dialog
          v-if="item.show"
          @closeDialog="item.show = false"
          :dialog="item.show"
          v-bind:item="item"
        />
      </template>
      <template v-slot:footer v-if="selected.length > 0">
        <div style="position: absolute" class="pa-0 pl-2">
          <v-btn
            v-for="action in actions"
            :key="action"
            color="red"
            :disabled="$store.state.account === undefined"
            dark
            @click="perform_action(false, action)"
            style="margin: 10px 10px 10px 0; flex-shrink: 1"
            >{{ action }}</v-btn
          >
        </div>
      </template>
    </v-data-table>

    <services-dialog
      v-bind:items="selected"
      :dialog="service_dialog"
      @closeDialog="service_dialog = false"
  /></v-container>
</template>

<script>
import ToolBar from "./ToolBar";
import DetailsDialog from "./DetailsDialog";
import { equipments, ip_types, possible_statuses } from "../assets/constants";
import { mdiClock, mdiTextBoxSearchOutline } from "@mdi/js";
import ServicesDialog from "./ServicesDialog";

export default {
  components: { ToolBar, DetailsDialog, ServicesDialog },
  props: ["refresh", "searchText"],
  data() {
    return {
      filter: {},
      service_dialog: false,
      details_dialog: false,
      page: 1,
      itemsPerPage: 8,
      selected: [],
      actions: ["Reboot", "Delete", "Services"],
      headers: [
        { text: "IP", align: "start", value: "ip_address" },
        { text: "Hostname", value: "name" },
        { text: "Status", value: "state_string" },
        { text: "Role", value: "role" },
      ],
      items: [],
      symbols: {},
      loading_bbbs: true,
      search: {
        statuses: possible_statuses,
        room: "All",
        equipments: equipments,
        ip_types: ip_types,
      },
      mdiClock,
      mdiTextBoxSearchOutline,
    };
  },
  computed: {
    filtered_beagles() {
      return this.$store.state.beaglebones.filter((i) => {
        return (
          i.name &&
          (i.name.indexOf(this.searchText) !== -1 ||
            i.ip_address.indexOf(this.searchText) !== -1) &&
          this.search.statuses.some((j) => i.state_string.includes(j)) &&
          this.search.ip_types.includes(i.ip_type) &&
          (this.search.room === i.sector || this.search.room === "All") &&
          this.search.equipments.includes(i.equipment)
        );
      });
    },
  },
  methods: {
    toggle_select(selected) {
      if (!selected.value) this.selected = [];
      else this.selected = selected.items;
    },
    row_click(item) {
      item.show = true;
    },
    async perform_action(item, action) {
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
        if (!confirmation) return;
        let reply;

        try {
          reply = await this.send_command(
            "beaglebones",
            { [action.toLowerCase()]: this.selected.map((b) => b.key) },
            "POST"
          );
        } catch (err) {
          console.error(err);
          this.$store.commit("show_snackbar", "Failed to send command! ");
        }

        if (reply.status === 200) {
          this.$store.commit(
            "show_snackbar",
            `Successfully applied changes to ${this.selected[0]["name"]} ${
              this.selected.length > 1
                ? `and other ${this.selected.length - 1} nodes`
                : ""
            }!`
          );
        } else if (reply.status == 401) {
          this.$store.commit(
            "show_snackbar",
            "Failed to send command! You don't have the required permissions"
          );
        } else {
          this.$store.commit(
            "show_snackbar",
            "Failed to send command! Please try reloading the page or relogging"
          );
        }

        this.selected = [];
      } else {
        this.service_dialog = true;
      }

      this.$store.commit("update_beaglebones");
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
  },
  created() {
    this.interval = setInterval(
      this.$store.commit("update_beaglebones"),
      25000
    );
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

.row-pointer >>> tbody tr :hover {
  cursor: pointer;
}
</style>
