<template>
  <v-col>
    <v-menu
      v-if="$store.state.account"
      bottom
      min-width="300px"
      rounded
      offset-y
    >
      <template v-slot:activator="{ on }">
        <v-btn icon x-large v-on="on">
          <v-avatar color="indigo" size="48">
            <span class="white--text text-h6">{{
              $store.state.account.initials
            }}</span>
          </v-avatar>
        </v-btn>
      </template>
      <v-card>
        <v-list-item-content class="justify-center">
          <div class="mx-auto text-center">
            <v-avatar color="indigo" style="margin-bottom: 10px">
              <span class="white--text text-h6">{{
                $store.state.account.initials
              }}</span>
            </v-avatar>
            <h3>{{ $store.state.account.name }}</h3>
            <p class="text-caption mt-1">{{ $store.state.account.username }}</p>
            <v-divider class="my-3"></v-divider>
            <v-btn @click="$emit('logout')" depressed rounded text>
              Disconnect
            </v-btn>
          </div>
        </v-list-item-content>
      </v-card>
    </v-menu>
    <v-menu
      :close-on-content-click="false"
      v-else
      bottom
      min-width="200px"
      rounded
      offset-y
    >
      <template v-slot:activator="{ on }">
        <v-btn @click="$emit('login')" icon x-large v-on="on">
          <v-icon>mdi-login</v-icon>
        </v-btn>
      </template>
    </v-menu>
  </v-col>
</template>
