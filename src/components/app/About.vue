<template>   
  <v-card outlined class="pa-4">
    <div class="d-flex">
      <div>
        <div>Padoof v0.0.9</div>
        <div class="text--secondary">by Alex Rinehart</div>
      </div>
      <v-spacer></v-spacer>
      <div class="text-center d-flex flex-column">
        <img :src="logoPath" alt="Padoof" width="82" height="82">
        <span>2024</span>
      </div>
    </div>
    <div>Links</div>
    <div class="d-flex flex-wrap mt-2">
      <v-btn @click="openLink('https://example.com/')" color="#1da6ff" rounded class="px-5 mb-2 mr-2">
        <v-icon left>mdi-web</v-icon> website </v-btn>
      <v-btn @click="openLink('https://github.com/asr1/Padoof')" color="#eee" light rounded class="px-5 mb-2 mr-2">
        <v-icon left>mdi-github</v-icon> Github </v-btn>
    </div>
    <v-divider class="my-4"></v-divider>
    <div class="d-flex flex-column">
      <div>Thanks to fupdec, who made MedicaChip, and all of the people who worked on these wonderful libraries:</div>
      <div class="d-flex flex-wrap">
        <span @click="openLink('https://github.com/electron')" class="link">Electron</span>
        <span @click="openLink('https://github.com/vuejs/vue')" class="link">vue</span>
        <span @click="openLink('https://github.com/vuetifyjs/vuetify')" class="link">vuetify</span>
        <span @click="openLink('https://github.com/vuejs/vuex')" class="link">vuex</span>
        <span @click="openLink('https://www.ffmpeg.org/')" class="link">FFmpeg</span>
        <span @click="openLink('https://github.com/whyboris/Video-Hub-App')" class="link">VideoHubApp</span>
        <span @click="openLink('https://github.com/apexcharts')" class="link">apexcharts</span>
        <span @click="openLink('https://github.com/archiverjs/node-archiver')" class="link">archiver</span>
        <span @click="openLink('https://github.com/axios/axios')" class="link">axios</span>
        <span @click="openLink('https://github.com/cheeriojs/cheerio')" class="link">cheerio</span>
        <span @click="openLink('https://github.com/zloirock/core-js')" class="link">core-js</span>
        <span @click="openLink('https://github.com/eugeneware/ffmpeg-static')" class="link">ffmpeg-static</span>
        <span @click="openLink('https://github.com/joshwnj/ffprobe-static')" class="link">ffprobe-static</span>
        <span @click="openLink('https://github.com/pqina/filepond')" class="link">filepond</span>
        <span @click="openLink('https://github.com/fluent-ffmpeg/node-fluent-ffmpeg')" class="link">fluent-ffmpeg</span>
        <span @click="openLink('https://github.com/jprichardson/node-fs-extra')" class="link">fs-extra</span>
        <span @click="openLink('https://github.com/oliver-moran/jimp')" class="link">jimp</span>
        <span @click="openLink('https://github.com/typicode/lowdb')" class="link">lowdb</span>
        <span @click="openLink('https://github.com/cristiammercado/node-disk-info')" class="link">node-disk-info</span>
        <span @click="openLink('https://github.com/antelle/node-stream-zip')" class="link">node-stream-zip</span>
        <span @click="openLink('https://github.com/dylang/shortid')" class="link">shortid</span>
        <span @click="openLink('https://github.com/Norserium/vue-advanced-cropper')" class="link">vue-advanced-cropper</span>
        <span @click="openLink('https://github.com/P3trur0/vue-country-flag')" class="link">vue-country-flag</span>
        <span @click="openLink('https://github.com/vuejs/vue-router')" class="link">vue-router</span>
        <span @click="openLink('https://www.npmjs.com/package/vue-the-mask')" class="link">vue-the-mask</span>
        <span @click="openLink('https://github.com/SortableJS/Vue.Draggable')" class="link">vuedraggable</span>
        <span @click="openLink('https://github.com/YvesCoding/vuescroll')" class="link">vuescroll</span>
        <span @click="openLink('https://github.com/Simonwep/selection')" class="link">selection</span>
        <span @click="openLink('https://github.com/mirari/v-viewer')" class="link">v-viewer</span>
      </div>
      <div class="mt-4">Thanks to these wonderful artists for the images:</div>
    </div>
  </v-card>
</template>


<script>
const path = require("path")
const shell = require('electron').shell

export default {
  name: 'About',
  computed: {
    logoPath() {return path.join('file://', __static, '/icons/icon.png')},
  },
  methods: {
    openLink(link) { shell.openExternal(link) },
  },
}
</script>


<style lang="scss">
.link {
  margin-right: 5px;
}
</style>