<template>
  <v-dialog
    :value="dialog"
    @input="$emit('update:dialog', false)"
    @click:outside="$emit('closeDialog')"
    max-width="500px"
  >
    <v-card>
      <v-card-title>
        <span class="text-h5">Services</span>
      </v-card-title>
      <v-divider />
      <v-list dense style="column-count: 2">
        <v-list-item v-for="(service, index) in services" :key="index">
          <v-list-item-content>
            <v-checkbox v-model="selected" :value="service.name">
              <template v-slot:label>
                <div>
                  <h4>{{ service.text }}</h4>
                  <h5>{{ service.name }}</h5>
                </div>
              </template>
            </v-checkbox>
          </v-list-item-content>
        </v-list-item>
        <v-list-item :key="services.length">
          <v-list-item-content>
            <v-checkbox v-model="selected" value="custom_service">
              <template v-slot:label>
                <div>
                  <h4>Custom Service</h4>
                  <v-text-field dense v-model="custom_service"></v-text-field>
                </div>
              </template>
            </v-checkbox>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-card-actions>
        <v-spacer />
        <v-btn color="red darken-1" text @click="actService('stop')">
          Stop
        </v-btn>
        <v-btn color="blue darken-1" text @click="actService('restart')">
          Restart
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: ["items", "dialog"],
  data: function () {
    return {
      services: [
        { text: "BBBread", name: "bbbread" },
        { text: "SIMAR (BME)", name: "simar@bme" },
        { text: "eth-bridge", name: "eth-bridge-pru-serial485" },
        { text: "bbb-function", name: "bbb-function" },
      ],
      selected: [],
      custom_service: "",
    };
  },
  methods: {
    async actService(action) {
      let confirmation = await this.$root.$confirm(
        "Confirmation",
        `Are you sure you want to perform this action on ${
          this.items[0].name
        } ${
          this.items.length > 1
            ? `and other ${this.items.length - 1} nodes`
            : ""
        }?`
      );
      if (!confirmation) return;

      let services = this.selected.filter((s) => s != "custom_service");

      if (this.selected.includes("custom_service")) {
        services.push(this.custom_service);
      }

      const response = await this.sendCommand(
        "beaglebones/services",
        this.items.map((b) => {
          return { key: b.key, [action]: services };
        }),
        "POST"
      );

      if (response.status === 200) {
        this.$store.commit(
          "showSnackbar",
          `Successfully applied changes to ${this.items[0].name} ${
            this.items.length > 1
              ? `and other ${this.items.length - 1} nodes`
              : ""
          }!`
        );
        this.$emit("closeDialog");
      } else {
        this.$store.commit(
          "showSnackbar",
          "Failed to apply actions (check your authentication)"
        );
      }
    },
  },
};
</script>
