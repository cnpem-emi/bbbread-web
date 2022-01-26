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
      <template v-slot:item.status="{ item }">
        <v-chip :color="getColor(item.status)" dark>
          {{ item.status }}
        </v-chip>
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
      const fetches = [];
      this.loading_bbbs = true;

      let bbbs = await this.send_command(`KEYS/BBB:*:Logs`);
      bbbs = bbbs.KEYS;

      for (let i = 0; i < bbbs.length; i += 200) {
        let command = escape(
          `EVALSHA/82281378dbb9b4ab512a34823ed9722c0743394e/${
            i + 200 > bbbs.length ? bbbs.length - i : 200
          }/`
        ); //Lua is behaving weirdly with the + operator.
        for (let key of bbbs.slice(
          i,
          i + 200 > bbbs.length ? bbbs.length : i + 200
        )) {
          command += `${key}/`;
        }

        fetches.push(this.send_command(command));
      }

      const reply = await Promise.all(fetches);

      let raw_items = [];
      for (let arr of reply) raw_items = raw_items.concat(arr.EVALSHA);

      for (let bbb = 0; bbb < bbbs.length; bbb++) {
        for (let log = 0; log < raw_items[bbb].length; log++) {
          items.push({
            ip: bbbs[bbb].split(":")[1],
            hostname: bbbs[bbb].split(":")[2],
            key: bbbs[bbb],
            date: new Date(parseInt(raw_items[bbb][log++]) * 1000)
              .toISOString()
              .replace(/Z|T/g, " "),
            message: raw_items[bbb][log],
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
    update_search(search) {
      this.search.text = search;
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
