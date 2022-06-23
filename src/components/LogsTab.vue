<template>
  <v-container fluid>
    <LogsToolbar
      @search="update_search"
      @refresh="get_all"
      @date="update_date_range"
      v-bind:search="search"
    />
    <v-data-table
      :headers="headers"
      :items="filtered_keys"
      :search="search.text"
      :loading="loading_bbbs"
      :sort-by.sync="sortBy"
      :show-select="$store.state.account !== undefined"
      :sort-desc="true"
      item-key="id"
      v-model="selected"
    >
      <template v-slot:item.actions="{ item }">
        <v-icon small @click="delete_log(item)"> {{ mdiDelete }} </v-icon>
      </template>
      <template v-slot:footer v-if="selected.length > 0">
        <div style="position: absolute" class="pa-0 pl-2">
          <v-btn
            color="red"
            dark
            @click="delete_logs()"
            style="margin: 10px 10px 10px 0; flex-shrink: 1"
            >Delete</v-btn
          >
        </div>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import LogsToolbar from "./LogsToolbar";
import { mdiDelete } from "@mdi/js";

export default {
  components: { LogsToolbar },
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
      loading_bbbs: true,
      sortBy: "date",
      search: "",
      date_range: [],
      selected: [],
      mdiDelete,
    };
  },
  computed: {
    composite_key(item) {
      return item.timestamp + " " + item.key;
    },
    filtered_keys() {
      return this.items.filter(
        (i) =>
          ([i.ip_address, i.name, i.message].some((e) =>
            e.includes(this.search ?? "")
          ) &&
            (!this.date_range.length ||
              (this.date_range[0] < i.date && this.date_range[1] > i.date))) ||
          this.date_range[0] === i.date.substring(0, i.date.indexOf(" "))
      );
    },
  },
  methods: {
    update_date_range(raw_date) {
      this.date_range = raw_date;
    },
    async get_all() {
      this.loading_bbbs = true;

      let response = await this.send_command("beaglebones/logs");

      this.items = await response.json();
      for (let i in this.items) {
        this.items[i].id = this.items[i].key.concat(this.items[i].timestamp, i);
      }
      this.loading_bbbs = false;
    },
    get_color(item) {
      switch (item) {
        case "Disconnected":
          return "red";
        case "Connected":
          return "green";
        default:
          return "yellow";
      }
    },
    update_search(search) {
      this.search = search;
    },
    async delete_log(item) {
      let confirmed = await this.$root.$confirm(
        "Confirmation",
        "Are you sure you want to delete this log?",
        true
      );

      if (confirmed) {
        this.send_command(
          "beaglebones/del_logs",
          [{ key: item.key, timestamps: [item.timestamp] }],
          "POST"
        );
        this.get_all();
      }
    },
    async delete_logs() {
      let confirmed = await this.$root.$confirm(
        "Confirmation",
        `Are you sure you want to delete ${this.selected.length} logs?`,
        true
      );

      if (confirmed) {
        let request_body = [];
        let index = 0;
        for (let log of this.selected) {
          index = request_body.findIndex((l) => l.key === log.key);
          if (index >= 0) request_body[index].timestamps.push(log.timestamp);
          else request_body.push({ key: log.key, timestamps: [log.timestamp] });
        }
        await this.send_command("del_logs", request_body, "POST");
        this.selected = [];
        this.get_all();
      }
    },
  },

  created() {
    this.get_all();
    this.interval = setInterval(this.get_all, 25000);
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
