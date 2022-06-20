<template>
  <v-dialog
    max-width="1000px"
    :value="dialog"
    @click:outside="$emit('closeDialog')"
  >
    <v-card>
      <v-card-title>
        <span class="text-h5">{{ item.name }}</span>
        <v-spacer />
        <v-menu>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              :disabled="$store.state.account === undefined"
              icon
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>
                {{ mdiDotsVertical }}
              </v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              v-for="(item, index) in actions"
              :key="index"
              @click="confirm(item.title)"
            >
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-card-title>
      <v-card-subtitle style="padding-bottom: 5px">
        {{ item.ip_address }}
      </v-card-subtitle>
      <v-spacer />

      <v-divider />
      <v-card-text style="padding-top: 15px">
        <v-row>
          <v-col cols="6">
            <v-list-item>
              <v-list-item-icon>
                <v-icon color="indigo">
                  {{ mdiTextBoxSearchOutline }}
                </v-icon>
              </v-list-item-icon>

              <v-list-item-content>
                <code style="height: 104.6664px; overflow: scroll">{{
                  values.details
                }}</code>
                <!-- Line height is 13.0833px -->
                <v-list-item-subtitle>Details</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-icon>
                <v-icon color="indigo">
                  {{ mdiHarddisk }}
                </v-icon>
              </v-list-item-icon>

              <v-list-item-content>
                <v-progress-circular
                  :size="100"
                  :width="20"
                  :value="values.disk_usage"
                  color="indigo"
                >
                  {{ values.disk_usage }}
                </v-progress-circular>
                <v-list-item-subtitle>Disk Usage</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item v-if="item.udc">
              <v-list-item-icon>
                <v-icon color="indigo">
                  {{ mdiTextBoxSearchOutline }}
                </v-icon>
              </v-list-item-icon>

              <v-list-item-content>
                <v-chip-group active-class="primary--text" column>
                  <v-chip v-for="udc in item.udc" :key="udc" small>
                    {{ udc }}
                  </v-chip>
                </v-chip-group>
                <v-list-item-subtitle>UDC</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-col>
          <v-col cols="6">
            <v-list two-line>
              <v-list-item v-for="(item, index) in details" :key="index">
                <v-list-item-icon>
                  <v-icon color="indigo">
                    {{ item.icon }}
                  </v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ item.value }}</v-list-item-title>
                  <v-list-item-subtitle>{{ item.title }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <span
          class="text-body-2 grey--text font-weight-light"
          style="justify: center"
          >Last seen at {{ item.last_seen }}</span
        >
      </v-card-actions>
    </v-card>
    <ServicesDialog
      v-bind:items="[item]"
      :dialog="service_dialog"
      @closeDialog="service_dialog = false"
    />
    <NetworkingDialog
      v-bind:item="item"
      :dialog="networking_dialog"
      @closeDialog="networking_dialog = false"
    />
  </v-dialog>
</template>

<script>
import {
  mdiPower,
  mdiWeb,
  mdiIpNetwork,
  mdiDelete,
  mdiDotsVertical,
  mdiHarddisk,
  mdiMapMarker,
  mdiDeveloperBoard,
  mdiTextBoxSearchOutline,
} from "@mdi/js";

import NetworkingDialog from "./NetworkingDialog";
import ServicesDialog from "./ServicesDialog";

export default {
  props: ["item", "dialog"],
  components: { NetworkingDialog, ServicesDialog },
  data: function () {
    return {
      mdiPower,
      mdiIpNetwork,
      mdiWeb,
      mdiDelete,
      mdiDotsVertical,
      mdiMapMarker,
      mdiHarddisk,
      mdiDeveloperBoard,
      mdiTextBoxSearchOutline,
      service_dialog: false,
      networking_dialog: false,
      values: { details: "" },
      actions: [
        { title: "Delete", method: this.del },
        { title: "Reboot", method: this.reboot },
        { title: "Services", method: this.open_services },
        { title: "Networking", method: this.open_networking },
      ],
      details: [
        {
          title: "Nameservers",
          value: "",
          icon: mdiWeb,
        },
        { title: "IP Type", value: this.item.ip_type, icon: mdiIpNetwork },
        {
          title: "Equipment",
          value: this.item.equipment,
          icon: mdiDeveloperBoard,
        },
        { title: "Sector", value: this.item.sector, icon: mdiMapMarker },
      ],
    };
  },
  methods: {
    async confirm(action) {
      switch (action) {
        case "Services":
          this.service_dialog = true;
          return;
        case "Networking":
          this.networking_dialog = true;
          return;
      }

      let confirmation = await this.$root.$confirm(
        "Confirmation",
        `Are you sure you want to ${action.toLowerCase()} ${
          this.item.ip_address
        } (${this.item.name})?`
      );
      if (confirmation) {
        let reply;
        try {
          reply = await this.send_command(
            "beaglebones",
            { [action.toLowerCase()]: [this.item.key] },
            "POST"
          );
        } catch (err) {
          this.$store.commit(
            "show_snackbar",
            "Failed to send command! Check the console (F12) for more information"
          );
          console.error(err);
        }

        if (reply.status === 200) {
          this.$store.commit(
            "show_snackbar",
            `Successfully applied changes to ${this.item.name}!`
          );
        } else {
          this.$store.commit(
            "show_snackbar",
            "Failed to send command! Check the console (F12) for more information"
          );
          console.error(reply);
        }
      }
    },
  },
  async mounted() {
    const response = await this.send_command(
      `beaglebones/details/${this.item.key}`
    );
    this.values = await response.json();
    this.details[0].value = this.values.nameservers;
    this.values.disk_usage = this.values.disk_usage ?? "N/A";
  },
};
</script>
