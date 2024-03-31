<script>
const { ipcRenderer } = require('electron')
const shortid = require('shortid')

import MetaGetters from '@/mixins/MetaGetters'

export default {
  mixins: [MetaGetters],
  mounted () {
    this.$nextTick(function () {
      // requests from other windows
      ipcRenderer.on('getDb', (event, dbType) => {
        let database = this.$store.getters[dbType].value()
        ipcRenderer.send('getDbAnswer', database)
      })
      ipcRenderer.on('watchLater', (event, pdfId) => {
        this.watchLater(pdfId)
      })
      ipcRenderer.on('addMarker', (event, marker, pdf) => {
        this.addMarker(marker, pdf)
      })
      ipcRenderer.on('removeMarker', (event, markerForRemove, pdf) => {
        this.removeMarker(markerForRemove, pdf)
      })
      ipcRenderer.on('addNewMetaCard', (event, metaCardName, metaId) => {
        this.addNewMetaCard(metaCardName, metaId)
      })
      ipcRenderer.on('pdfWatched', (event, pdfId) => {
        this.pdfWatched(pdfId)
      })
    })
  },
  computed: {
    settingsDb() {
      return this.$store.state.settingsDb
    },
  },
  methods: {
    watchLater(pdfId) {
      let playlist = this.$store.getters.playlists.find({name:'Watch later'}).value()
      if (playlist.pdfs.includes(pdfId)) {
        this.$store.getters.playlists.find({name:'Watch later'}).assign({
          pdfs: playlist.pdfs.filter(pdf=>(pdf !== pdfId)),
          edit: Date.now(),
        }).write()
      } else {
        let pdfsFromPlaylist = playlist.pdfs
        pdfsFromPlaylist.push(pdfId)
        this.$store.getters.playlists.find({name:'Watch later'}).assign({
          pdfs: pdfsFromPlaylist,
          edit: Date.now(),
        }).write()
      }
    },
    addMarker(marker, pdfId) {
      let pdf = _.cloneDeep(this.$store.getters.pdfs.find({id: pdfId}).value())
      this.$store.getters.markers.push(marker).write()
      if (marker.type !== 'favorite' && marker.type !== 'bookmark') {
        if (pdf[marker.type]!==undefined && pdf[marker.type].includes(marker.name)) return
        if (pdf[marker.type]===undefined) pdf[marker.type] = []
        pdf[marker.type].push(marker.name)
        pdf[marker.type] = pdf[marker.type].sort((a,b)=>{
          a = this.getCard(a).meta.name
          b = this.getCard(b).meta.name
          return a.localeCompare(b)
        })
        this.$store.getters.pdfs.find({ id: pdf.id }).assign({ 
          [marker.type]: pdf[marker.type],
          edit: Date.now(),
        }).write()
        this.$store.commit('updateVideos', [pdf.id])
      }
    },
    removeMarker(markerForRemove) {
      this.$store.dispatch('deleteMarker' , markerForRemove)
    },
    addNewMetaCard(metaCardName, metaId) {
      this.$store.dispatch('addMetaCard', { 
        id: shortid.generate(),
        metaId: metaId,
        meta: { name: metaCardName },
      })
      ipcRenderer.send('updatePlayerDb', 'metaCards') // update meta in player window
    },
    pdfWatched(pdfId) {
      let pdf = this.$store.getters.pdfs.find({id: pdfId})
      if (!pdf.value()) return 
      let views = pdf.value().views || 0
      if (this.$store.state.Settings.countNumberOfViews) ++views
      pdf.assign({
        views: views,
        viewed: Date.now(),
      }).write()
    },
  },
}
</script>