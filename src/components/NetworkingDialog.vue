<template>
  <v-dialog
    :value="dialog"
    max-width="800px"
    @click:outside="$emit('closeDialog')"
    loading
  >
    <v-card :loading="loading">
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
                  :append-icon="newIp !== item.ip_address ? `${mdiPencil}` : ''"
                  v-model="newIp"
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
                  v-model="newName"
                  :value="item.name"
                  :append-icon="newName !== item.name ? `${mdiPencil}` : ''"
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
                  v-model="newNameserver1"
                  :value="getNameserver(0)"
                  :append-icon="
                    newNameserver1 !== getNameserver(0) ? `${mdiPencil}` : ''
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
                  v-model="newNameserver2"
                  :value="getNameserver(1)"
                  :append-icon="
                    newNameserver2 !== getNameserver(1) ? `${mdiPencil}` : ''
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
      newIp: this.item.ip_address,
      newName: this.item.name,
      newNameserver1: this.getNameserver(0),
      newNameserver2: this.getNameserver(1),
      rules: {
        ip: (value) => {
          const pattern =
            /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          return pattern.test(value) || "Invalid address.";
        },
      },
      mdiPencil,
      valid: true,
      loading: false,
    };
  },
  methods: {
    getNameserver(index) {
      if (!this.item.nameservers) return "";

      return this.item.nameservers[index];
    },
    async apply() {
      this.$refs.form.validate();

      let confirmation = await this.$root.$confirm(
        "Confirmation",
        "Are you sure you want to apply these networking changes?"
      );

      if (!confirmation) return;

      this.loading = true;
      let body = { key: this.item.key };
      if (
        this.newNameserver2 !== this.getNameserver(1) ||
        this.newNameserver1 !== this.getNameserver(0)
      ) {
        Object.assign(body, {
          nameservers: [this.newNameserver1, this.newNameserver2],
        });
      }

      if (this.newName !== this.item.name)
        Object.assign(body, { hostname: this.newName });

      if (
        this.newIp !== this.item.ip_address ||
        this.dhcp !== (this.item.ip_type === "DHCP")
      ) {
        let ipSubdiv = this.newIp.split(".");
        ipSubdiv[ipSubdiv.length - 1] = "1";
        Object.assign(body, {
          type: this.dhcp ? "dhcp" : "manual",
          ip: this.newIp,
          mask: "255.255.255.0",
          gateway: ipSubdiv.join("."),
        });
      }

      this.loading = false;
      if (body !== { key: this.item.key }) {
        await this.sendCommand("beaglebones/networking", [body], "POST");
        this.$store.commit(
          "showSnackbar",
          `Successfully applied changes to ${this.item.name}!`
        );
        this.$emit("closeDialog");
      }
    },
  },
};
</script>
