<template>
  <v-app id="inspire">
    <v-app-bar app>
    
      <v-toolbar-title>Application</v-toolbar-title>
    </v-app-bar>

    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <v-main>
            <router-view></router-view>
          </v-main>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
export default {
  data: () => ({
    drawer: false
  }),
  methods: {
    toggleDrawer() {
      this.drawer = !this.drawer;
    }
  }
};
</script>
