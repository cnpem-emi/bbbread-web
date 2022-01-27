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
      </v-list>
      <v-card-actions>
        <v-spacer />
        <v-btn color="red darken-1" text @click="act_service('stop')">
          Stop
        </v-btn>
        <v-btn color="blue darken-1" text @click="act_service('restart')">
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
        { text: "SIMAR", name: "simar_sensors" },
        { text: "eth-bridge", name: "eth-bridge-pru-serial485" },
        { text: "bbb-function", name: "bbb-function" },
      ],
      selected: [],
    };
  },
  methods: {
    async act_service(action) {
      let service_actions = { restart: [], stop: [] };
      for (let beagle of this.items) {
        service_actions[action].push({
          key: beagle.key,
          services: this.selected,
        });
      }

      const response = await this.send_command(
        "services",
        service_actions,
        "POST"
      );

      if (response.status === 200) {
        this.$store.commit(
          "show_snackbar",
          `Successfully applied changes to ${this.items[0].name} ${
            this.items.length > 1
              ? `and other ${this.items.length - 1} nodes`
              : ""
          }!`
        );
        this.$emit("closeDialog");
      } else {
        this.$store.commit(
          "show_snackbar",
          "Failed to apply actions (check your authentication)"
        );
      }
    },
  },
};
</script>
