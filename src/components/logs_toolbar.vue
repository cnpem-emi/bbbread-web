<template>
  <v-container fluid>
    <v-toolbar dense flat>
      <v-row>
        <v-col cols="10">
          <v-text-field
            v-on:input="$emit('search', $event)"
            clearable
            single-line
            hide-details
            prepend-inner-icon="mdi-magnify"
            label="Search"
          ></v-text-field>
        </v-col>
        <v-col cols="2">
          <v-dialog
            ref="dialog"
            v-model="date_dialog"
            :return-value.sync="date_range"
            persistent
            width="290px"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                v-model="date_text"
                label="Log Date Range"
                prepend-icon="mdi-calendar"
                readonly
                v-bind="attrs"
                v-on="on"
                single-line
                hide-details
                clearable
                @click:clear="date_range = []; $emit('date', date_range);"
              ></v-text-field>
            </template>
            <v-date-picker v-model="date_range" scrollable range>
              <v-spacer></v-spacer>
              <v-btn text color="primary" @click="date_dialog = false">
                Cancel
              </v-btn>
              <v-btn
                text
                color="primary"
                @click="
                  $refs.dialog.save(date_range);
                  $emit('date', date_range);
                "
              >
                OK
              </v-btn>
            </v-date-picker>
          </v-dialog>
        </v-col>
      </v-row>
      <v-btn @click="$emit('refresh', $event)" icon
        ><v-icon>mdi-refresh</v-icon></v-btn
      >
    </v-toolbar>
  </v-container>
</template>

<script>
export default {
  props: ["search"],
  data() {
    return {
      filter: {},
      possible_statuses: ["Disconnected", "Connected", "Moved"],
      dropdown: false,
      date_range: [],
      date_dialog: false,
    };
  },
  computed: {
    date_text() {
      return this.date_range.join(" ~ ");
    }
  }
};
</script>
