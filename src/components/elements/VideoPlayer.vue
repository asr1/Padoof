<template>
  <div class="pdf-player-wrapper">
    <v-card class="pdf-player" :outlined="!maximized&&!fullscreen">
      <v-card-title v-if="showSystemBar" class="pa-0 title-bar" :class="{maximized:maximized,fullscreen:fullscreen,}">
        <v-spacer></v-spacer>
        <span class="now-playing-title">{{getFileNameFromPath(nowPlaying)}}</span>
        <v-spacer></v-spacer>
        <div class="window-controls">
          <v-btn text tile small width="46" height="32" @click="minimize">
            <v-icon size="16">mdi-minus</v-icon>
          </v-btn>
          <v-btn v-if="maximized" text tile small width="46" height="32" @click="unmaximize">
            <v-icon size="18">mdi-window-restore</v-icon>
          </v-btn>
          <v-btn v-else text tile small width="46" height="32" @click="maximize">
            <v-icon size="14">mdi-square-outline</v-icon>
          </v-btn>
          <v-btn text tile small width="46" height="32" @click="close" class="close-app-btn"> 
            <v-icon size="18">mdi-window-close</v-icon>
          </v-btn>
        </div>
      </v-card-title>
      <div class="pdf-player-container">
        <AppPlayer ref="player" @toggleFullscreen="toggleFullscreen" @nowPlaying="updateNowPlaying($event)"/>
      </div>
    </v-card>
  </div>
</template>


<script>
const _ = require("lodash")
const path = require("path")
const { ipcRenderer } = require('electron')
import AppPlayer from '@/components/app/AppPlayer'

export default {
  name: 'VideoPlayer',
  components: {
    AppPlayer,
  },
  async beforeCreate() {
    // get databases from main window
    await this.$store.dispatch('getDb', 'pdfs')
    await this.$store.dispatch('getDb', 'playlists')
    await this.$store.dispatch('getDb', 'markers')
    await this.$store.dispatch('getDb', 'meta')
    await this.$store.dispatch('getDb', 'metaCards')
    await this.$store.dispatch('getDb', 'settings')
    // window events
    ipcRenderer.on('maximize', () => { this.maximized = true })
    ipcRenderer.on('unmaximize', () => { this.maximized = false })
  },
  data: () => ({
    maximized: false,
    nowPlaying: '',
  }),
  computed: {
    showSystemBar() {return process.platform === 'win32'},
    pdfsDb() { return this.$store.state.pdfsDb},
    tagsDb() {return this.$store.state.tagsDb},
    playlistsDb() {return this.$store.state.playlistsDb},
    markersDb() {return this.$store.state.markersDb},
    metaDb() {return this.$store.state.metaDb},
    metaCardsDb() {return this.$store.state.metaCardsDb},
    settingsDb() {return this.$store.state.settingsDb},
    fullscreen() {return this.$store.state.fullscreen},
  },
  methods: {
    getFileNameFromPath(pdfPath) {return path.parse(pdfPath).name},
    updateNowPlaying(pdf) { if (pdf) this.nowPlaying = pdf.path},
    minimize() { ipcRenderer.invoke('minimize', 'player') },
    maximize() {
      this.maximized = true
      ipcRenderer.invoke('maximize', 'player')
    },
    unmaximize() {
      this.maximized = false
      ipcRenderer.invoke('unmaximize', 'player')
    },
    close() {
      this.playlist = []
      this.$refs.player.closePlayer()
      ipcRenderer.send('closePlayer')
    },
    toggleFullscreen() { this.$emit("toggleFullscreen") },
  },
}
</script>


<style lang="less">
.pdf-player {
  border-radius: 0 !important;
  overflow: hidden !important;
  height: 100%;
  &-wrapper {
    height: 100%;
  }
  &-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .title-bar {
    padding: 0;
    position: relative;
    z-index: 5;
    min-height: 32px;
    &:before {
      content: '';
      position: absolute;
      height: 100%;
      top: 3px;
      left: 15px;
      right: 80px;
      background-color: transparent;
      -webkit-app-region: drag;
      pointer-events: none;
    }
    &.maximized:before {
      top: 0;
    }
    &.fullscreen {
      display: none;
    }
    .v-btn, .v-rating, .v-icon {
      -webkit-app-region: no-drag !important;
    }
  }
  .now-playing-title {
    font-size: 12px;
    overflow: hidden;
    max-width: calc(100vw - 350px);
    white-space: nowrap;
  }
}
.add-playlist {
  .v-list-item {
    display: flex;
    justify-content: space-between;
    &:after {
      display: none;
    }
  }
}

.window-controls {
  -webkit-app-region: no-drag;
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  display: flex;
  .v-btn:not(.v-btn--round).v-size--small {
    min-width: 0;
  }
  .v-btn.close-app-btn:before {
    color: rgb(215, 0, 0);
  }
  .v-btn.close-app-btn:hover::before {
    opacity: 1;
  }
  .v-btn.close-app-btn:hover .v-icon {
    color: #fff;
  }
}
</style>
<style lang="less" scoped>

</style>

