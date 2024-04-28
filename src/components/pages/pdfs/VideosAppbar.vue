<template>
	<div class="app-bar-container">
    <div>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn icon tile @click="$store.state.Settings.dialogScanPdfs=true" v-on="on">
            <v-icon>mdi-book-plus</v-icon>
          </v-btn>
        </template>
        <span>Add new PDFs</span>
      </v-tooltip>
    </div>

    <VideosAppbarActions />
    
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="openRandomVideo" icon tile v-on="on"> 
          <v-icon>mdi-dice-5</v-icon>
        </v-btn>
      </template>
      <span>Open random pdf</span>
    </v-tooltip>

    <v-spacer></v-spacer>

    <VideosAppbarCardView />
  </div>
</template>


<script>
const fs = require('fs')
const shell = require('electron').shell

import { ipcRenderer } from 'electron'

export default {
  name: 'VideosAppbar',
  components: {
    VideosAppbarActions: () => import('@/components/elements/VideosAppbarActions.vue'),
    VideosAppbarCardView: () => import('@/components/elements/VideosAppbarCardView.vue'),
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
  }),
  computed: {
  },
  methods: {
    openRandomVideo() {
      const pdfs = this.$store.state.Videos.filteredVideos
      if (pdfs.length == 0) return
      if (pdfs.length == 1) { this.playVideo(pdfs[0]); return }
      const rand = this.getRandomIntInclusive(1, pdfs.length)
      this.playVideo(pdfs[rand-1])
    },
    getRandomIntInclusive(min, max) {
      min = Math.ceil(min)
      max = Math.floor(max)
      return Math.floor(Math.random() * (max - min + 1)) + min
    },
    playVideo(pdf) {
      const pathToVideo = pdf.path
      if (!fs.existsSync(pathToVideo)) {
        this.$store.state.Videos.dialogErrorPlayVideo = true
        this.$store.state.Videos.errorPlayVideoPath = pathToVideo
        return
      }
      if (this.$store.state.Settings.isopenPDFInSystemPlayer) shell.openPath(pathToVideo)
      else {
        let data = { pdfs: [pdf], id: pdf.id, path: this.pdf.path  }
        console.log("Sending 3");
        ipcRenderer.send('openPlayer', data)
      }  
    },
  },
  watch: {
  },
}
</script>