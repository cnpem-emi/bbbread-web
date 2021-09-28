<template>
  <v-footer color="primary darken-2" padless>
    <v-row justify="center" no-gutters>
      <v-btn
        href="https://cnpemcamp.sharepoint.com/sites/iot/SitePages/bbbread.aspx"
        color="white"
        text
        rounded
        class="my-2"
      >
        wiki
      </v-btn>
      <v-btn
        href="https://github.com/lnls-sirius/bbbread/blob/master/BBBread.py"
        color="white"
        text
        rounded
        class="my-2"
      >
        github
      </v-btn>
      <v-btn
        href="mailto:guilherme.freitas@cnpem.br"
        color="white"
        text
        rounded
        class="my-2"
      >
        contact
      </v-btn>
      <v-col class="primary darken-3 py-4 text-center white--text" cols="12">
        {{ new Date().getFullYear() }} — <strong>CNPEM</strong>
      </v-col>
    </v-row>
  </v-footer>
</template>
