<template>
  <v-container fluid>
    <v-toolbar dense flat style="margin-bottom: 10px">
      <v-text-field
        v-on:input="$emit('search', $event)"
        clearable
        single-line
        hide-details
        prepend-inner-icon="mdi-magnify"
        label="Search"
      ></v-text-field>

      <v-icon style="padding: 0 15px">mdi-eye</v-icon>
      <v-btn-toggle dense color="blue" v-model="search.statuses" multiple>
        <v-btn
          v-for="status in possible_statuses"
          :value="status"
          :key="status"
          >{{ status }}</v-btn
        >
      </v-btn-toggle>

      <v-btn @click="$emit('refresh', $event)" icon
        ><v-icon>mdi-refresh</v-icon></v-btn
      >
    </v-toolbar>
    <v-divider />
    <v-row dense style="padding-top: 10px">
      <v-col cols="7">
        <v-combobox
          label="Equipments"
          multiple
          chips
          v-model="search.equipments"
          :items="equipments"
          :disabled="search.equipments === undefined"
        >
          <template v-slot:selection="{ attrs, item, parent, selected }">
            <v-chip v-bind="attrs" :input-value="selected" label small>
              <span class="pr-2">
                {{ item }}
              </span>
              <v-icon small @click="parent.selectItem(item)"> $delete </v-icon>
            </v-chip>
          </template>
        </v-combobox>
      </v-col>
      <v-col cols="3">
        <v-combobox
          label="IP Types"
          multiple
          chips
          v-model="search.ip_types"
          :items="ip_types"
        >
          <template v-slot:selection="{ attrs, item, parent, selected }">
            <v-chip v-bind="attrs" :input-value="selected" label small>
              <span class="pr-2">
                {{ item }}
              </span>
              <v-icon small @click="parent.selectItem(item)"> $delete </v-icon>
            </v-chip>
          </template>
        </v-combobox>
      </v-col>
      <v-col cols="2">
        <v-combobox
          label="Room"
          style="height: 90px"
          v-model="search.room"
          :items="rooms"
        />
      </v-col>
    </v-row>
    <v-divider />
  </v-container>
</template>

<script>
export default {
  props: ["settings", "search"],
  data() {
    return {
      filter: {},
      possible_statuses: ["Disconnected", "Connected", "Moved"],
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
      rooms: ["All", "TL", "RF", "Power Supplies", "Connectivity", "Others"],
      dropdown: false,
    };
  },
  mounted() {
    for (let i = 1; i <= 20; i++)
      this.rooms.push(`IA-${i.toString().padStart(2, "0")}`);
  },
};
</script>

<style>
.option-box {
  column-count: 5;
}

.v-select:not(.v-text-field--single-line):not(.v-text-field--outlined)
  .v-select__slot
  > input {
  -webkit-align-self: flex-end;
  align-self: flex-end;
  min-height: 42px;
}
</style>
