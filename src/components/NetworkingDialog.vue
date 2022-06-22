<template>
  <v-dialog
    :value="dialog"
    max-width="800px"
    @click:outside="$emit('closeDialog')"
  >
    <v-card>
      <v-card-title>
        <span class="text-h5">Networking</span>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-form ref="form" v-model="valid">
          <v-col>
            <v-row>
              <v-col cols="12" sm="9">
                <v-text-field
                  dense
                  label="IP Address"
                  outlined
                  :append-icon="
                    new_ip !== item.ip_address ? `${mdiPencil}` : ''
                  "
                  v-model="new_ip"
                  :value="item.ip_address"
                  hide-details
                  :disabled="dhcp"
                  :rules="[rules.ip]"
                ></v-text-field>
              </v-col>
              <v-col fill-height class="d-flex align-center justify-center">
                <v-switch
                  style="margin-top: 0"
                  inset
                  hide-details
                  v-model="dhcp"
                  flat
                  label="DHCP"
                  :append-icon="
                    dhcp !== (item.ip_type === 'DHCP') ? `${mdiPencil}` : ''
                  "
                ></v-switch>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-text-field
                  dense
                  label="Hostname"
                  outlined
                  v-model="new_name"
                  :value="item.name"
                  :append-icon="new_name !== item.name ? `${mdiPencil}` : ''"
                  hide-details
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-text-field
                  dense
                  label="Nameserver 1"
                  outlined
                  v-model="new_nameserver1"
                  :value="get_nameserver(0)"
                  :append-icon="
                    new_nameserver1 !== get_nameserver(0) ? `${mdiPencil}` : ''
                  "
                  :rules="[rules.ip]"
                  hide-details
                ></v-text-field>
              </v-col>

              <v-col>
                <v-text-field
                  dense
                  label="Nameserver 2"
                  outlined
                  v-model="new_nameserver2"
                  :value="get_nameserver(1)"
                  :append-icon="
                    new_nameserver2 !== get_nameserver(1) ? `${mdiPencil}` : ''
                  "
                  :rules="[rules.ip]"
                  hide-details
                ></v-text-field>
              </v-col>
            </v-row>
          </v-col>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="blue darken-1" text @click="apply()" :disabled="!valid">
          Apply
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mdiPencil } from "@mdi/js";

export default {
  props: ["item", "dialog"],
  data: function () {
    return {
      dhcp: this.item.ip_type === "DHCP",
      new_ip: this.item.ip_address,
      new_name: this.item.name,
      new_nameserver1: this.get_nameserver(0),
      new_nameserver2: this.get_nameserver(1),
      rules: {
        ip: (value) => {
          const pattern =
            /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          return pattern.test(value) || "Invalid address.";
        },
      },
      mdiPencil,
      valid: true,
    };
  },
  methods: {
    get_nameserver(index) {
      if (!this.item.nameservers) {
        return index === 0 ? "10.0.0.71" : "10.0.0.72";
      }
      return this.item.nameservers[index];
    },
    async apply() {
      this.$refs.form.validate();

      let confirmation = await this.$root.$confirm(
        "Confirmation",
        "Are you sure you want to apply these networking changes?"
      );

      if (!confirmation) return;

      let body = { key: this.item.key };
      if (
        this.new_nameserver2 !== this.get_nameserver(1) ||
        this.new_nameserver1 !== this.get_nameserver(0)
      ) {
        Object.assign(body, {
          nameservers: [this.new_nameserver1, this.new_nameserver2],
        });
      }

      if (this.new_name !== this.item.name)
        Object.assign(body, { hostname: this.new_name });

      if (
        this.new_ip !== this.item.ip_address ||
        this.dhcp !== (this.item.ip_type === "DHCP")
      ) {
        let ip_subdiv = this.new_ip.split(".");
        ip_subdiv[ip_subdiv.length - 1] = "1";
        Object.assign(body, {
          type: this.dhcp ? "dhcp" : "manual",
          ip: this.new_ip,
          mask: "255.255.255.0",
          gateway: ip_subdiv.join("."),
        });
      }

      if (body !== { key: this.item.key }) {
        await this.send_command("beaglebones/networking", [body], "POST");
        this.$store.commit(
          "show_snackbar",
          `Successfully applied changes to ${this.item.name}!`
        );
        this.$emit("closeDialog");
      }
    },
  },
};
</script>
