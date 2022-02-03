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
      :search="search"
      :loading="loading_bbbs"
      :sort-by.sync="sortBy"
      :sort-desc="true"
    >
      <template v-slot:item.actions="{ item }">
        <v-icon small @click="delete_log(item)"> mdi-delete </v-icon>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import LogsToolbar from "./LogsToolbar";

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
    };
  },
  computed: {
    filtered_keys() {
      return this.items.filter(
        (i) =>
          ([i.ip_address, i.name, i.message].some((e) =>
            e.includes(this.search)
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

      let response = await this.send_command("logs");

      this.items = await response.json();
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
      this.search.text = search;
    },
    async delete_log(item) {
      let confirmed = await this.$root.$confirm(
        "Confirmation",
        "Are you sure you want to delete this log?",
        true
      );

      if (confirmed) {
        this.send_command(
          "del_logs",
          [{ key: item.key, timestamps: [item.timestamp] }],
          "POST"
        );
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
