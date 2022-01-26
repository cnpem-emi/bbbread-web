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
      <template v-slot:item.status="{ item }">
        <v-chip :color="get_color(item.status)" dark>
          {{ item.status }}
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
            @click="perform_action(false, action)"
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
              @click="perform_action(item, action)"
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

function arrayToDict(array) {
  let dict = {};
  for (let i = 0; i < array.length; i++) {
    dict[array[i]] = array[++i];
  }

  return dict;
}

const detailToEquipment = {
  PRU_POWER_SUPPLY: "Power Supply",
  SIMAR: "SIMAR",
  COUNTING_PRU: "CountingPRU",
  THERMO_PROBE: "Thermo Probe",
  MKS: "MKS",
  AGILENT4UHV: "4UHV",
  SPIXCONV: "SPIxCONV",
  MBTEMP: "MBTemp",
  "No Device": "No Device",
};

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
      actions: ["Reboot", "Delete", "Services"],
      innerHeaders: [
        { text: "Nameservers", value: "nameservers" },
        { text: "IP Type", value: "ip_type" },
        { text: "Sector", value: "sector" },
        { text: "Equipment", value: "equipment" },
      ],
      headers: [
        { text: "IP", align: "start", value: "ip" },
        { text: "Hostname", value: "hostname" },
        { text: "Status", value: "status" },
        { text: "Role", value: "role" },
        { value: "data-table-expand" },
      ],
      items: [],
      symbols: {},
      loading_bbbs: true,
      search: {
        text: "",
        statuses: ["Disconnected", "Connected", "Moved"],
        room: "All",
        equipments: [
          "Power Supply",
          "SIMAR",
          "CountingPRU",
          "Thermo Probe",
          "MKS",
          "4UHV",
          "SPIxCONV",
          "MBTemp",
          "No Device",
        ],
        ip_types: ["Static", "DHCP", "Undetermined"],
      },
    };
  },
  computed: {
    filtered_beagles() {
      return this.items.filter((i) => {
        return (
          (i.hostname.indexOf(this.search.text) !== -1 ||
            i.ip.indexOf(this.search.text) !== -1) &&
          this.search.statuses.some((j) => i.status.includes(j)) &&
          this.search.ip_types.includes(i.ip_type) &&
          (this.search.room === i.sector || this.search.room === "All") &&
          (this.search.equipments.includes(i.equipment) ||
            (this.search.equipments.includes("No Device") && !i.equipment))
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
      this.loading_bbbs = true;
      const items = [];
      const fetches = [];
      let raw_items = [];
      const offset = new Date().getTimezoneOffset() * 60 * 1000;

      const response = await this.send_command(`KEYS/BBB:*`);
      const bbbs = response.KEYS.filter(
        (x) => !x.includes(":Command") && !x.includes(":Logs")
      );

      for (let i = 0; i < bbbs.length; i += 200) {
        //local r = {}; for _, v in pairs(KEYS) do r[#r - -1] = redis.call('HGETALL', v) end; return r
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
          const split = key.split(":");

          items.push({
            ip: split[1],
            hostname: split.slice(2).join(":"),
            key: key,
          });
        }

        fetches.push(this.send_command(command));
      }

      const reply = await Promise.all(fetches);
      for (let arr of reply) raw_items = raw_items.concat(arr.EVALSHA);

      for (let r in raw_items) {
        const dict = arrayToDict(raw_items[r]);
        const role = dict["matching_bbb"]
          ? dict["matching_bbb"].charAt(0).toUpperCase() +
            dict["matching_bbb"].slice(1)
          : "Primary";
        let sector = "None";

        if ("sector" in dict) sector = dict["sector"].replace("Sala", "IA-");

        let ip_type = "Static";

        if (dict["ip_type"] == "0.0.0.0") ip_type = "Undetermined";
        else if (dict["ip_type"] == "dhcp") ip_type = "DHCP";

        items[r] = {
          ip: items[r].ip,
          key: items[r].key,
          hostname: items[r].hostname,
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
          equipment:
            detailToEquipment[
              dict["details"].substring(0, dict["details"].indexOf(" "))
            ],
        };
      }

      this.items = items;
      this.loading_bbbs = false;
    },
    async perform_action(item, action) {
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
    },
    update_search(search) {
      this.search.text = search;
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
