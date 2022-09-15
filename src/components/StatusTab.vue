<template>
  <v-container fluid>
    <ToolBar v-bind:search="search" />
    <v-divider />
    <v-data-table
      :headers="headers"
      :items="filteredBeagles"
      :search="searchText"
      :loading="$store.state.loading"
      item-key="key"
      :show-select="$store.state.account !== undefined"
      @toggle-select-all="toggleSelect"
      @click:row="rowClick"
      v-model="selected"
      class="row-pointer"
    >
      <template v-slot:item.state_string="{ item }">
        <v-chip :color="getColor(item.state_string)" dark>
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
            @click="performAction(false, action)"
            style="margin: 10px 10px 10px 0; flex-shrink: 1"
            >{{ action }}</v-btn
          >
        </div>
      </template>

      <template v-slot:item.ps="{ item }">
        <v-chip small v-for="ps in item.ps" :key="ps">
          {{ ps }}
        </v-chip>
      </template>
    </v-data-table>

    <services-dialog
      v-if="serviceDialog"
      v-bind:items="selected"
      :dialog="serviceDialog"
      @closeDialog="serviceDialog = false"
  /></v-container>
</template>

<script>
import ToolBar from "@/components/ToolBar";
import DetailsDialog from "@/components/DetailsDialog";
import { equipments, ipTypes, possibleStatuses } from "@/assets/constants";
import { mdiClock, mdiTextBoxSearchOutline } from "@mdi/js";
import ServicesDialog from "@/components/ServicesDialog";

export default {
  components: { ToolBar, DetailsDialog, ServicesDialog },
  props: ["searchText", "psOnly"],
  data() {
    return {
      serviceDialog: false,
      page: 1,
      itemsPerPage: 8,
      selected: [],
      actions: ["Reboot", "Delete", "Services"],
      search: {
        statuses: possibleStatuses,
        room: "All",
        equipments: equipments,
        ipTypes: ipTypes,
      },
      mdiClock,
      mdiTextBoxSearchOutline,
    };
  },
  computed: {
    filteredBeagles() {
      return this.$store.state.beaglebones.filter((i) => {
        return (
          i.name &&
          (i.ps !== undefined || !this.psOnly) &&
          (i.name.indexOf(this.searchText) !== -1 ||
            i.ip_address.indexOf(this.searchText) !== -1) &&
          this.search.statuses.some((j) => i.state_string.includes(j)) &&
          this.search.ipTypes.includes(i.ip_type) &&
          (this.search.room === i.sector || this.search.room === "All") &&
          this.search.equipments.includes(i.equipment)
        );
      });
    },
    headers() {
      let headers = [
        { text: "IP", align: "start", value: "ip_address" },
        { text: "Hostname", value: "name" },
        { text: "Status", value: "state_string" },
        { text: "Role", value: "role" },
      ];

      if (!this.psOnly) return headers;

      headers.splice(2, 0, {
        text: "Power Supplies",
        value: "ps",
        width: "45%",
      });
      return headers;
    },
  },
  methods: {
    toggleSelect(selected) {
      if (!selected.value) this.selected = [];
      else this.selected = selected.items;
    },
    rowClick(item) {
      item.show = true;
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
        if (!confirmation) return;
        let reply;

        try {
          reply = await this.sendCommand(
            "beaglebones",
            { [action.toLowerCase()]: this.selected.map((b) => b.key) },
            "POST"
          );
        } catch (err) {
          console.error(err);
          this.$store.commit("showSnackbar", "Failed to send command! ");
        }

        if (reply.status === 200) {
          this.$store.commit(
            "showSnackbar",
            `Successfully applied changes to ${this.selected[0]["name"]} ${
              this.selected.length > 1
                ? `and other ${this.selected.length - 1} nodes`
                : ""
            }!`
          );
        } else if (reply.status == 401) {
          this.$store.commit(
            "showSnackbar",
            "Failed to send command! You don't have the required permissions"
          );
        } else {
          this.$store.commit(
            "showSnackbar",
            "Failed to send command! Please try reloading the page or relogging"
          );
        }

        this.selected = [];
      } else {
        this.serviceDialog = true;
      }

      this.$store.commit("updateBeaglebones");
    },
    getColor(item) {
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
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active em versões anteriores a 2.1.8 */ {
  opacity: 0;
}

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
