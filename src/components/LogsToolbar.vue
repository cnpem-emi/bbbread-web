<template>
  <v-container fluid>
    <v-toolbar dense flat>
      <v-row>
        <v-col cols="2">
          <v-dialog
            ref="dialog"
            v-model="dateDialog"
            :return-value.sync="dateRange"
            persistent
            width="290px"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                v-model="dateText"
                label="Log Date Range"
                :prepend-icon="mdiCalendar"
                readonly
                v-bind="attrs"
                v-on="on"
                single-line
                hide-details
                clearable
                @click:clear="
                  dateRange = [];
                  $emit('date', dateRange);
                "
              ></v-text-field>
            </template>
            <v-date-picker v-model="dateRange" scrollable range>
              <v-spacer></v-spacer>
              <v-btn text color="primary" @click="dateDialog = false">
                Cancel
              </v-btn>
              <v-btn
                text
                color="primary"
                @click="
                  $refs.dialog.save(dateRange);
                  $emit('date', dateRange);
                "
              >
                OK
              </v-btn>
            </v-date-picker>
          </v-dialog>
        </v-col>
      </v-row>
      <v-btn @click="$emit('refresh', $event)" icon
        ><v-icon>{{ mdiRefresh }}</v-icon></v-btn
      >
    </v-toolbar>
  </v-container>
</template>

<script>
import { mdiRefresh, mdiCalendar } from "@mdi/js";
export default {
  props: ["search"],
  data() {
    return {
      filter: {},
      dateRange: [],
      dateDialog: false,
      mdiCalendar,
      mdiRefresh,
    };
  },
  computed: {
    dateText() {
      return this.dateRange.join(" ~ ");
    },
  },
};
</script>
