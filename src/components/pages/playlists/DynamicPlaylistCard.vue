<template>
  <v-hover>
    <template v-slot:default="{ hover }">
      <v-card @click="play" @mousedown="stopSmoothScroll($event)" width="300"
        :data-id="playlist.id" class="playlist-card mr-4" outlined>
        <div v-if="playlist.pdfs.length > 0" class="thumbs">
          <v-img v-for="(thumb, i) in thumbs" :key="i" width="50%"
            :src="getImgUrl(thumb)" :aspect-ratio="16/9"/>
        </div>
        <div v-else class="text-center pt-10">
          <div class="overline">Playlist is Empty</div>
          <v-icon size="140">mdi-format-list-bulleted</v-icon>
        </div>

        <v-sheet dark rounded="0">
          <FiltersChips :filters="playlist.filters" :type="'Video'" :isTooltip="true"/>
        </v-sheet>

        <v-card-title class="py-1 px-2">{{playlist.name}} ({{playlist.pdfs.length}})</v-card-title>
        
        <v-expand-transition>
          <v-overlay v-if="hover" absolute color="secondary">
            <v-icon size="200">mdi-play</v-icon>
          </v-overlay>
        </v-expand-transition>
      </v-card>
    </template>
  </v-hover>
</template>

<script>
const fs = require("fs")
const path = require("path")
const shell = require('electron').shell

import { ipcRenderer  } from 'electron'

export default {
  name: "DynamicPlaylistCard",
  props: {
    playlist: Object,
  },
  components: {
    FiltersChips: () => import('@/components/elements/FiltersChips.vue'),
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
  }),
  computed: {
    thumbs() { return this.playlist.pdfs.map(pdf=>(pdf.id)).slice(0, 6) },
    pathToUserData() { return this.$store.getters.getPathToUserData },
  },
  methods: {
    play() {
      if (this.playlist.pdfs.length === 0) {
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Playlist "${this.playlist.name}" is empty. Add pdf first to play.`
        })
        return
      }
      if (this.$store.state.Settings.isopenPDFInSystemPlayer) {
        let paths = this.playlist.pdfs.map(i=>i.path)
        let plPath = path.join(this.pathToUserData, `playlist.m3u`)
        let text = ''
        for (let i = 0; i < paths.length; i++) text += paths[i] + '\n'
        fs.writeFileSync(plPath, text) 
        shell.openPath(plPath) 
      } else {
        let data = {
          pdfs: this.playlist.pdfs,
          id: this.playlist.pdfs[0].id,
          path: this.pdf.path   
        }
        console.log("Sending 4");
        ipcRenderer.send('openPlayer', data)
      }
    },
    stopSmoothScroll(event) {
      if(event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
    getImgUrl(pdfId) {
      let imgPath = path.join(this.pathToUserData, `/media/thumbs/${pdfId}.jpg`)
      return 'file://' + this.checkImageExist(imgPath)
    },
    checkImageExist(imgPath) {
      if (fs.existsSync(imgPath)) return imgPath
      else {
        this.errorThumb = true
        return path.join(__static, '/img/default.png')
      }
    },
  },
};
</script>