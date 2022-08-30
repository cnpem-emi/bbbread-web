<template>
  <v-row dense justify="center">
    <v-col
      :cols="$vuetify.breakpoint.xl ? 4 : 12"
      align-self="center"
      style="text-align: center"
    >
      <v-row dense>
        <v-col style="padding: 0" :cols="$vuetify.breakpoint.smAndUp ? 6 : 12">
          <v-icon style="padding: 0 5px">{{ mdiEye }}</v-icon>
          <v-btn-toggle dense color="blue" v-model="search.statuses" multiple>
            <v-btn
              v-for="status in possibleStatuses"
              :value="status"
              :key="status"
              small
              >{{ status }}</v-btn
            >
          </v-btn-toggle>
        </v-col>
        <v-col style="padding: 0" :cols="$vuetify.breakpoint.smAndUp ? 6 : 12">
          <v-icon style="padding: 0 5px">{{ mdiIp }}</v-icon>
          <v-btn-toggle dense color="blue" v-model="search.ipTypes" multiple>
            <v-btn v-for="ip in ipTypes" :value="ip" :key="ip" small>{{
              ip
            }}</v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>
    </v-col>

    <v-col :cols="$vuetify.breakpoint.mdAndUp ? 5 : 12" align-self="end">
      <v-combobox
        label="Equipments"
        multiple
        small-chips
        clearable
        deletable-chips
        v-model="search.equipments"
        :items="equipments"
        :disabled="search.equipments === undefined"
      >
      </v-combobox>
    </v-col>
    <v-col :cols="$vuetify.breakpoint.mdAndUp ? 2 : 12">
      <v-combobox label="Room" v-model="search.room" :items="rooms" />
    </v-col>
  </v-row>
</template>

<script>
import {
  equipments,
  ipTypes,
  possibleStatuses,
  rooms,
} from "@/assets/constants.js";
import { mdiEye, mdiRefresh, mdiMagnify, mdiCloseCircle, mdiIp } from "@mdi/js";
export default {
  props: ["search"],
  data() {
    return {
      filter: {},
      possibleStatuses: possibleStatuses,
      ipTypes: ipTypes,
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