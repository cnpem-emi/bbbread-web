<template>
  <v-container fluid>
    <v-row dense justify="center">
      <v-col cols="4" align-self="center">
        <v-row>
          <v-icon style="padding: 0 5px">{{ mdiEye }}</v-icon>
          <v-btn-toggle
            dense
            color="blue"
            v-model="search.statuses"
            multiple
            style="margin-right: 15px"
          >
            <v-btn
              v-for="status in possible_statuses"
              :value="status"
              :key="status"
              small
              >{{ status }}</v-btn
            >
          </v-btn-toggle>
          <v-icon style="padding: 0 5px">{{ mdiIp }}</v-icon>
          <v-btn-toggle dense color="blue" v-model="search.ip_types" multiple>
            <v-btn v-for="ip in ip_types" :value="ip" :key="ip" small>{{
              ip
            }}</v-btn>
          </v-btn-toggle>
        </v-row>
      </v-col>

      <v-col cols="5" align-self="end">
        <v-combobox
          label="Equipments"
          multiple
          small-chips
          deletable-chips
          v-model="search.equipments"
          :items="equipments"
          :disabled="search.equipments === undefined"
        >
        </v-combobox>
      </v-col>
      <v-col cols="2">
        <v-combobox label="Room" v-model="search.room" :items="rooms" />
      </v-col>
    </v-row>
    <v-divider />
  </v-container>
</template>

<script>
import {
  equipments,
  ip_types,
  possible_statuses,
  rooms,
} from "../assets/constants.js";
import { mdiEye, mdiRefresh, mdiMagnify, mdiCloseCircle, mdiIp } from "@mdi/js";

export default {
  props: ["search"],
  data() {
    return {
      filter: {},
      possible_statuses: possible_statuses,
      ip_types: ip_types,
      rooms: rooms,
      dropdown: false,
      equipments: equipments,
      mdiEye,
      mdiRefresh,
      mdiMagnify,
      mdiCloseCircle,
      mdiIp,
    };
  },
  mounted() {
    for (let i = 1; i <= 20; i++)
      this.rooms.push(`IA-${i.toString().padStart(2, "0")}`);
  },
};
</script>

<style>
.v-select__selections {
  overflow: scroll;
  flex-wrap: nowrap !important;
}
.v-chip {
  overflow: initial !important;
}
</style>
