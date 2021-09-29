<template>
  <v-container fluid>
    <toolbar
      @search="s => search = s"
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
      <template v-slot:item.status="{ item }">
        <v-chip :color="getColor(item.status)" dark>
          {{ item.status }}
        </v-chip>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import toolbar from "./logs_toolbar";

export default {
  components: { toolbar },
  data() {
    return {
      filter: {},
      page: 1,
      itemsPerPage: 8,
      headers: [
        { text: "Date", align: "start", value: "date" },
        { text: "IP", value: "ip" },
        { text: "Hostname", value: "hostname" },
        { text: "Message", value: "message" },
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
          ([i.ip, i.hostname, i.message].some((e) => e.includes(this.search)) &&
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
      const items = [];
      const bbbs = [];
      this.loading_bbbs = true;

      const response = await this.send_command("KEYS/BBB:*:Logs");
      let command = escape(
        `EVALSHA/82281378dbb9b4ab512a34823ed9722c0743394e/${response.KEYS.length}/`
      );
      for (let key of response.KEYS) {
        command += `${key}/`;
        const split = key.split(":");
        bbbs.push({
          ip: split[1],
          hostname: split.slice(2, -1).join(":"),
          key: key,
        });
      }

      const reply = await this.send_command(command);

      for (let bbb = 0; bbb < response.KEYS.length; bbb++) {
        for (let log = 0; log < reply.EVALSHA[bbb].length; log++) {
          items.push({
            ip: bbbs[bbb]["ip"],
            hostname: bbbs[bbb]["hostname"],
            key: bbbs[bbb]["key"],
            date: new Date(parseInt(reply.EVALSHA[bbb][log++]) * 1000)
              .toISOString()
              .replace(/Z|T/g, " "),
            message: reply.EVALSHA[bbb][log],
          });
        }
      }

      this.items = items;
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
  },
  created() {
    this.get_all();
    this.interval = setInterval(this.get_all, 10000);
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
