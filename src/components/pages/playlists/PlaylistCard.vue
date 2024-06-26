<template>
  <v-lazy>
    <v-card @mousedown="stopSmoothScroll($event)"
      @mousedown.right="$store.state.contextMenu=false" 
      @contextmenu="showContextMenu" height="100%"
      :data-id="playlist.id" class="playlist-card" outlined hover 
      :class="{favorite: isFavorite}" v-ripple="{ class: 'accent--text' }">
      <v-btn @click="isFavorite = !isFavorite" icon absolute large class="fav-btn"
        :color="isFavorite===false ? 'white' : 'pink'"
      > <v-icon :color="isFavorite===false?'grey':'pink'">mdi-heart-outline</v-icon>
      </v-btn>
      
      <div v-if="playlist.pdfs.length > 0" @click="play" class="thumbs">
        <v-img v-for="(thumb, i) in thumbs" :key="i" width="50%"
          :src="getImgUrl(thumb)" :aspect-ratio="16/9"/>
        <v-btn @click="play" icon x-large outlined class="btn-playlist-play" color="white">
          <v-icon size="40">mdi-play</v-icon>
        </v-btn>
      </div>
      <div v-else class="text-center pt-10">
        <div class="overline">Playlist is Empty</div>
        <v-icon size="140">mdi-format-list-bulleted</v-icon>
      </div>

      <v-card-title class="py-1 px-2">{{playlist.name}} ({{playlist.pdfs.length}})
      </v-card-title>

      <v-btn @click="$store.state.Playlists.dialogEditPlaylist=true" color="secondary" fab x-small class="btn-edit">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </v-card>
  </v-lazy>
</template>

<script>
const fs = require("fs")
const path = require("path")
const shell = require('electron').shell

import { ipcRenderer  } from 'electron'

export default {
  name: "PlaylistCard",
  props: {
    playlist: Object,
  },
  mounted() {
    this.$nextTick(function () {
      this.playlistName = this.playlist.name
    })
  },
  data: () => ({
    playlistName: '',
    imgMain: '',
    imgMainKey: Date.now(),
  }),
  computed: {
    pdfs() {
      let pdfs = this.$store.getters.pdfs.filter(v=>(this.playlist.pdfs.includes(v.id))).value()
      return _.sortBy(pdfs, (pdf) => {
        let index = _.indexOf(this.playlist.pdfs, pdf.id)
        return (index === -1) ? this.playlist.pdfs.length : index;
      })
    },
    thumbs() { return this.pdfs.map(pdf=>(pdf.id)).slice(0, 6) },
    pathToUserData() { return this.$store.getters.getPathToUserData },
    isFavorite: {
      get() { return this.playlist.favorite },
      set(value) {
        this.playlist.favorite = value
        this.$store.getters.playlists.find({id: this.playlist.id}).assign({
          favorite: value,
          edit: Date.now(),
        }).write()
        this.$store.commit('updatePlaylists')
      },
    },
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
        let paths = this.playlist.pdfs.map(i=>this.$store.getters.pdfs.find({id:i}).value().path)
        let plPath = path.join(this.pathToUserData, `playlist.m3u`)
        let text = ''
        for (let i = 0; i < paths.length; i++) text += paths[i] + '\n'
        fs.writeFileSync(plPath, text) 
        shell.openPath(plPath) 
      } else {
        let data = {
          pdfs: this.pdfs,
          id: this.pdfs[0].id,
          path: this.pdf.path 
        }
        console.log("Sending 5");
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
    showContextMenu(e) {
      e.preventDefault()
      setTimeout(() => {
        this.$store.state.x = e.clientX
        this.$store.state.y = e.clientY
        let contextMenu = [
          { name: `Edit Playlist`, type: 'item', icon: 'pencil', function: ()=>{this.$store.state.Playlists.dialogEditPlaylist=true}, disabled: this.$store.getters.getSelectedPlaylists.length!==1},
          { type: 'divider'},
          { name: `Delete Playlist`, type: 'item', icon: 'delete', color:'error', function: ()=>{this.$store.state.Playlists.dialogDeletePlaylist=true}, disabled: this.$store.getters.getSelectedPlaylists.includes('123123123') },
        ]
        this.$store.state.contextMenuContent = contextMenu
        this.$store.state.contextMenu = true
      }, 300)
    },
  },
};
</script>

<style lang="less">
.playlist-card {
  cursor: default;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  .v-image {
    cursor: pointer;
  }
  .thumbs {
    display:flex;
    flex-wrap:wrap;
    position: relative;
    height: 100%;
    &:before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      z-index: 1;
      opacity: 0;
      background-image: linear-gradient(225deg, rgba(255, 0, 75, 1) 0%, rgba(0, 0, 0, 0) 12%, rgba(0, 0, 0, 0));
      transition: 1s all ease;
      pointer-events: none;
    }
  }
  &:hover {
    .btn-edit {
      opacity: 0.65;
      &:hover {
        opacity: 1;
      }
    }
    .btn-playlist-play {
      opacity: 0.65;
      &:hover {
        opacity: 1;
      }
    }
  }
  &.favorite {
    &:before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
      border-radius: 4px;
      pointer-events: none;
      box-shadow: 0px 2px 8px 3px rgba(255, 0, 75, 0.25), 0 0 0 1px rgba(255, 0, 75, 1);
    }
    .thumbs:before {
      opacity: 1;
    }
  }
  .btn-edit {
    position: absolute;
    right: 5px;
    opacity: 0;
    z-index: 4;
    bottom: 5px;
  }
}
.btn-playlist-play {
  opacity: 0;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
  background-color: rgba(0, 0, 0, 0.603);
}
</style>