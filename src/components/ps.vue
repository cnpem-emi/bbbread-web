<template>
  <v-container fluid>
    <toolbar @search="s => search = s" @refresh="get_all" v-bind:search="search" />
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
      <template v-slot:item.status="{ item }">
        <v-chip :color="get_color(item.status)" dark>
          {{ item.status }}
        </v-chip>
      </template>
      <template v-slot:item.ps_names="{ item }">
        <v-chip small v-for="ps in item.ps_names" :key="ps">
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
          />

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

    <services
      v-bind:items="selected"
      :dialog="service_dialog"
      @closeDialog="service_dialog = false"
  /></v-container>
</template>

<script>
import toolbar from "./toolbar";
import services from "./services";

function arrayToDict(array) {
  let dict = {};
  for (let i = 0; i < array.length; i++) {
    dict[array[i]] = array[++i];
  }
  return dict;
}

export default {
  components: { toolbar, services },
  props: ["refresh"],
  data() {
    return {
      filter: {},
      user_sure: false,
      service_dialog: false,
      page: 1,
      itemsPerPage: 8,
      selected: [],
      actions: ["Reboot", "Delete", "Services"],
      innerHeaders: [
        { text: "Nameservers", value: "nameservers" },
        { text: "IP Type", value: "ip_type" },
        { text: "Sector", value: "sector" },
        { text: "UDC", value: "udc" },
      ],
      headers: [
        { text: "IP", align: "start", value: "ip" },
        { text: "Hostname", value: "hostname" },
        { text: "Status", value: "status" },
        { text: "Power Supplies", value: "ps_names" },
        { text: "Role", value: "role" },
        { value: "data-table-expand" },
      ],
      items: [],
      symbols: {},
      loading_bbbs: true,
      ps: { name: [] },
      search: {
        text: "",
        statuses: ["Disconnected", "Connected", "Moved"],
        room: "All",
        ip_types: ["Static", "DHCP", "Undetermined"],
      },
    };
  },
  computed: {
    filtered_beagles() {
      return this.items.filter((i) => {
        return (
          i.status !== undefined &&
          (i.hostname.indexOf(this.search.text) !== -1 ||
            i.ip.indexOf(this.search.text) !== -1 ||
            i.ps_names.join("").includes(this.search.text)) &&
          this.search.statuses.some((j) => i.status.includes(j)) &&
          this.search.ip_types.includes(i.ip_type) &&
          (this.search.room === i.sector || this.search.room === "All")
        );
      });
    },
  },
  methods: {
    async update_pwr_names() {
      let response = await fetch(
        "https://raw.githubusercontent.com/lnls-sirius/control-system-constants/master/beaglebone/ip-list.txt"
      );
      response = await response.text();

      for (let bbb of response
        .split("\n")
        .filter((i) => i.charAt(0) !== "#" && i)) {
        const ps_bbb = bbb.replace(/  +/g, " ").split(" ");
        this.items.push({
          ip: ps_bbb[1],
          hostname: ps_bbb[0],
          key: `BBB:${ps_bbb[1]}:${ps_bbb[0].replace(":", "--")}`,
        });
      }

      response = await fetch(
        "https://raw.githubusercontent.com/lnls-sirius/control-system-constants/master/beaglebone/beaglebone-udc.txt"
      );
      response = await response.text();

      for (let udc of response
        .split("\n")
        .filter((i) => i.charAt(0) !== "#" && i)) {
        const name_udc = udc.replace(/  +/g, " ").split(" ");
        this.items[
          this.items.findIndex((item) => item["hostname"] === name_udc[0])
        ]["udc"] = name_udc.slice(1);
      }

      response = await fetch(
        "https://raw.githubusercontent.com/lnls-sirius/control-system-constants/master/beaglebone/udc-bsmp.txt"
      );
      response = await response.text();

      for (let udc of response
        .split("\n")
        .filter((i) => i.charAt(0) !== "#" && i)) {
        const udc_name = udc.replace(/  +/g, " ").split(" ");
        this.items[
          this.items.findIndex((item) => item["udc"].includes(udc_name[0]))
        ]["ps_names"] = udc_name.filter((_, i) => i > 0 && i % 2 == 1);
      }
    },
    toggle_select(selected) {
      if (!selected.value) this.selected = [];
      else this.selected = selected.items;
    },
    async get_all() {
      await this.update_pwr_names();

      const fetches = [];
      const offset = new Date().getTimezoneOffset() * 60 * 1000;

      for (let i = 0; i < this.items.length; i += 200) {
        let command = escape(
          `EVALSHA/82281378dbb9b4ab512a34823ed9722c0743394e/${
            i + 200 > this.items.length ? this.items.length - i : 200
          }/`
        ); //Lua is behaving weirdly with the + operator.

        for (let item of this.items.slice(
          i,
          i + 200 > this.items.length ? this.items.length : i + 200
        )) {
          command += `${item["key"]}/`;
        }

        fetches.push(this.send_command(command));
      }

      const reply = await Promise.all(fetches);
      let raw_items = [];
      for (let arr of reply) raw_items = raw_items.concat(arr.EVALSHA);

      for (let i in raw_items) {
        if (raw_items[i].length > 0) {
          const dict = arrayToDict(raw_items[i]);

          let ip_type = "Static";
          if (dict["ip_type"] == "0.0.0.0") ip_type = "Undetermined";
          else if (dict["ip_type"] == "dhcp") ip_type = "DHCP";

          const role = dict["matching_bbb"]
            ? dict["matching_bbb"].charAt(0).toUpperCase() +
              dict["matching_bbb"].slice(1)
            : "Primary";

          const sector = dict["sector"].replace("Sala", "IA-");

          Object.assign(this.items[i], {
            role: role,
            status:
              dict["state_string"].substring(0, 3) === "BBB"
                ? `Moved - ${dict["state_string"].substring(4)}`
                : dict["state_string"],
            last_seen: !isNaN(dict["ping_time"])
              ? new Date(parseInt(dict["ping_time"] * 1000 - offset))
                  .toISOString()
                  .replace(/Z|T/g, " ")
              : "-",
            nameservers: dict["nameservers"],
            ip_type: ip_type,
            sector: sector === "Outros" ? "Others" : sector,
          });
        }
      }

      this.items = this.items.filter((item) => item["status"] !== undefined);
      this.loading_bbbs = false;
    },
    async performAction(item, action) {
      if (item) this.selected = [item];
      else item = this.selected[0];

      if (action !== "Services") {
        let confirmation = await this.$root.$confirm(
          "Confirmation",
          `Are you sure you want to ${action.toLowerCase()} ${item.ip} (${
            item.hostname
          }) ${
            this.selected.length > 1
              ? `and other ${this.selected.length - 1} nodes`
              : ""
          }?`
        );
        if (confirmation) {
          const token = await this.$store.state.msalInstance.acquireTokenSilent(
            {
              scopes: ["User.Read"],
              account: this.$store.state.account,
            }
          );

          let commands = [];

          switch (action) {
            case "Delete":
              for (let beagle of this.selected) {
                commands.push(this.send_command(`DEL/${beagle.key}`, token));
                commands.push(
                  this.send_command(`DEL/${beagle.key}:Command`, token)
                );
                commands.push(
                  this.send_command(`DEL/${beagle.key}:Logs`, token)
                );
              }
              break;
            case "Reboot":
              for (let beagle of this.selected) {
                commands.push(
                  this.send_command(`RPUSH/${beagle.key}:Command/1`, token)
                );
              }
              break;
          }

          const reply = await Promise.all(commands);
          if (reply !== undefined) {
            this.$store.commit(
              "show_snackbar",
              `Successfully applied changes to ${
                this.selected[0]["hostname"]
              } ${
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
    }
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
