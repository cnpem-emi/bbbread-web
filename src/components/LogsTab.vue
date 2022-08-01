<template>
  <v-container fluid>
    <LogsToolbar @refresh="getAll" @date="updateDateRange" />
    <v-data-table
      :headers="headers"
      :items="filteredKeys"
      :search="searchText"
      :loading="loading"
      :sort-by.sync="sortBy"
      :show-select="$store.state.account !== undefined"
      :sort-desc="true"
      item-key="id"
      @click:row="rowClick"
      v-model="selected"
    >
      <template v-slot:item.actions="{ item }">
        <v-icon small @click="deleteLog(item)"> {{ mdiDelete }} </v-icon>
      </template>
      <template v-slot:footer v-if="selected.length > 0">
        <div style="position: absolute" class="pa-0 pl-2">
          <v-btn
            color="red"
            dark
            @click="deleteLogs()"
            style="margin: 10px 10px 10px 0; flex-shrink: 1"
            >Delete</v-btn
          >
        </div>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import LogsToolbar from "@/LogsToolbar";
import { mdiDelete } from "@mdi/js";

export default {
  components: { LogsToolbar },
  props: ["searchText"],
  data() {
    return {
      filter: {},
      page: 1,
      itemsPerPage: 8,
      headers: [
        { text: "Date", align: "start", value: "date" },
        { text: "IP", value: "ip_address" },
        { text: "Hostname", value: "name" },
        { text: "Message", value: "message" },
        { text: "Actions", value: "actions", sortable: false },
      ],
      items: [],
      symbols: {},
      loading: true,
      sortBy: "date",
      dateRange: [],
      selected: [],
      mdiDelete,
    };
  },
  computed: {
    filteredKeys() {
      return this.items.filter(
        (i) =>
          ([i.ip_address, i.name, i.message].some((e) =>
            e.includes(this.searchText ?? "")
          ) &&
            (!this.dateRange.length ||
              (this.dateRange[0] < i.date && this.dateRange[1] > i.date))) ||
          this.dateRange[0] === i.date.substring(0, i.date.indexOf(" "))
      );
    },
  },
  methods: {
    updateDateRange(raw_date) {
      this.dateRange = raw_date;
    },
    async getAll() {
      this.loading = true;

      let response = await this.sendCommand("beaglebones/logs");

      this.items = await response.json();
      for (let i in this.items) {
        this.items[i].id = this.items[i].key.concat(this.items[i].timestamp, i);
      }
      this.loading = false;
    },
    async deleteLog(item) {
      let confirmed = await this.$root.$confirm(
        "Confirmation",
        "Are you sure you want to delete this log?",
        true
      );

      if (confirmed) {
        this.sendCommand(
          "beaglebones/del_logs",
          [{ key: item.key, timestamps: [item.timestamp] }],
          "POST"
        );
        this.getAll();
      }
    },
    async deleteLogs() {
      let confirmed = await this.$root.$confirm(
        "Confirmation",
        `Are you sure you want to delete ${this.selected.length} logs?`,
        true
      );

      if (confirmed) {
        const body = [];
        let index = 0;
        for (const log of this.selected) {
          index = body.findIndex((l) => l.key === log.key);
          if (index >= 0) body[index].timestamps.push(log.timestamp);
          else body.push({ key: log.key, timestamps: [log.timestamp] });
        }
        await this.sendCommand("beaglebones/del_logs", body, "POST");
        this.selected = [];
        this.getAll();
      }
    },
    rowClick(item) {
      this.$store.commit(
        "show_beaglebone",
        `BBB:${item.ip_address}:${item.name}`
      );
    },
  },
  created() {
    this.getAll();
    this.interval = setInterval(this.getAll, 25000);
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
