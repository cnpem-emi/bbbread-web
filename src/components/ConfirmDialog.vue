<template>
  <v-dialog
    v-model="dialog"
    :max-width="500"
    :style="{ zIndex: 1 }"
    @keydown.esc="cancel"
  >
    <v-card>
      <v-toolbar dark color="orange" dense flat>
        <v-toolbar-title class="white--text">{{ title }}</v-toolbar-title>
      </v-toolbar>
      <v-card-text v-show="message" class="pa-4"
        >{{ message }}
        <v-checkbox v-model="userSure" label="Yes, I'm absolutely sure"
      /></v-card-text>

      <v-card-actions class="pt-0">
        <v-spacer></v-spacer>
        <v-btn
          :disabled="!userSure"
          color="primary darken-1"
          text
          @click.native="agree"
          >Yes</v-btn
        >
        <v-btn color="dark-grey" text @click.native="cancel">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      userSure: false,
      dialog: false,
      resolve: null,
      reject: null,
      message: null,
      title: null,
    };
  },
  methods: {
    open(title, message, checkbox = false) {
      this.userSure = checkbox;
      this.dialog = true;
      this.title = title;
      this.message = message;
      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },
    agree() {
      this.resolve(true);
      this.dialog = false;
    },
    cancel() {
      this.resolve(false);
      this.dialog = false;
    },
  },
};
</script>
