<script>
import VideoCard from '@/components/pages/pdfs/VideoCard.vue'
import VideoPreviewGrid from '@/components/elements/VideoPreviewGrid'
import VideoPreviewTimeline from '@/components/elements/VideoPreviewTimeline'

const fs = require("fs")
const path = require("path")
const shortid = require('shortid')

export default {
  components: {
    VideoCard
  },
  beforeDestroy() {
    this.isGenerationBreak = true
  },
  mounted() {
    this.$nextTick(() => {
      this.jumpPage = this.pdfsCurrentPage
    })
  },
  data: () => ({
    pdfsPerPagePreset: [20,40,60,80,100,150,200,300],
    isGenerationGridsRun: false,
    isGenerationTimelinesRun: false,
    isGenerationBreak: false,
    timeout: null,
    numberOfCreatedGrid: 0,
    dropzone: false,
    jumpPage: null,
  }),
  computed: {
    getNumberOfPagesLimit() {return this.$store.state.Settings.numberOfPagesLimit},
    pages(){return this.$store.getters.pdfsPages},
    pdfsOnPage() {return this.$store.getters.pdfsOnPage},
    pdfsPerPage: {
      get() {return this.$store.state.Settings.pdfsPerPage},
      set(number) {this.$store.dispatch('changeVideosPerPage', number)},
    },
    pdfsPagesSum: {
      get() {return this.$store.state.Videos.pageTotal},
      set(number) {this.$store.state.Videos.pageTotal = number},
    },
    pdfsCurrentPage: {
      get() {return this.$store.state.Settings.pdfPage},
      set(number) {
        this.$store.state.Settings.pdfPage = number
        this.$store.dispatch('saveFiltersOfVideos')
      },
    },
    backgroundProcesses: {
      get() { return this.$store.state.backgroundProcesses },
      set(val) { this.$store.state.backgroundProcesses = val },
    },
    pathToUserData() { return this.$store.getters.getPathToUserData },
    view() { return this.$store.state.Settings.pdfView || 0 },
  },
  methods: {
    async createGrids(pdfs) {
      let bpId = shortid.generate()
      let bp = { id: bpId, text: 'Generating grids images', icon: 'apps', }
      this.$store.commit('addBackgroundProcess', bp)
      this.isGenerationGridsRun = true
      const gridsPath = path.join(this.pathToUserData, `/media/grids/`) 
      if (!fs.existsSync(gridsPath)) fs.mkdirSync(gridsPath)
      const vm = this
      for (let i = 0; i < pdfs.length; i++) {
        this.$store.commit('updateTextBackgroundProcess', {id:bpId, text:`Generating grids images ${i+1} of ${pdfs.length}`})
        if (this.isGenerationBreak) break
        const pdf = pdfs[i]
        if (!fs.existsSync(pdf.path)) continue
        const gridPath = path.join(vm.pathToUserData, `/media/grids/${pdf.id}.jpg`)
        if (!fs.existsSync(gridPath)) await vm.createVideoGrid(pdf.path, pdf.id, pdf.duration)
      }

      if (this.numberOfCreatedGrid) this.$store.commit('updateVideos') // re render cards if grid added
      this.numberOfCreatedGrid = 0
      this.isGenerationGridsRun = false
      this.$store.commit('removeBackgroundProcess', bpId)
    },
    async createVideoGrid(inputVideoPath, pdfId, pdfDuration) {
      let opts = {
        input: inputVideoPath,
        output: path.join(this.pathToUserData, `/media/grids/${pdfId}.jpg`),
        width: 180,
        cols: 3,
        rows: 3,
        duration: pdfDuration,
      }

      let p = new VideoPreviewGrid(opts)
      const result = await p.generate()
      if (result) ++this.numberOfCreatedGrid
    },
    async createTimelines(pdfs) {
      let bpId = shortid.generate()
      let bp = { id: bpId, text: 'Generating timelines images', icon: 'view-carousel', }
      this.$store.commit('addBackgroundProcess', bp)
      this.isGenerationTimelinesRun = true
      const timelinesPath = path.join(this.pathToUserData, `/media/timelines/`) 
      if (!fs.existsSync(timelinesPath)) fs.mkdirSync(timelinesPath)
      const vm = this
      for (let i = 0; i < pdfs.length; i++) {
        this.$store.commit('updateTextBackgroundProcess', {id:bpId, text:`Generating timelines images ${i+1} of ${pdfs.length}`})
        if (this.isGenerationBreak) break
        const pdf = pdfs[i]
        if (!fs.existsSync(pdf.path)) continue
        const frame = path.join(vm.pathToUserData, `/media/timelines/${pdf.id}_5.jpg`)
        if (!fs.existsSync(frame)) await vm.createVideoTimeline(pdf)
        if (this.view==1) this.$store.commit('updateVideos', [pdf.id])
      }
      this.isGenerationTimelinesRun = false
      this.$store.commit('removeBackgroundProcess', bpId)
    },
    async createVideoTimeline(pdf) {
      let opts = {
        pdf: pdf,
        pathToUserData: this.pathToUserData,
      }

      let timeline = new VideoPreviewTimeline(opts)
      await timeline.generate()
    },
    generateImages() {
      clearInterval(this.timeout)
      this.isGenerationBreak = true
      this.timeout = setTimeout(() => {
        this.isGenerationBreak = false
        if (!this.isGenerationGridsRun) {
          if (this.$store.state.Settings.pdfPreviewStatic==='grid') this.createGrids(this.$store.getters.pdfsOnPage)
        }
        if (!this.isGenerationTimelinesRun) {
          if (this.$store.state.Settings.pdfPreviewHover==='timeline' || this.$store.state.Settings.pdfView===1) 
          this.createTimelines(this.$store.getters.pdfsOnPage)
        }
      }, 3000)
    },
    clearSelection() {
      this.$store.state.Videos.selection.clearSelection()
      let selected = this.$store.state.Videos.selection.select('.pdf-card')
      for (let i of selected) i.classList.remove('selected')
      this.$store.commit('updateSelectedVideos', [])
    },
    jumpToPage() { 
      if (this.jumpPage === null) return
      let val = Number(this.jumpPage)
      if (val < 1) val = 1
      else if (val > this.pdfsPagesSum) val = this.pdfsPagesSum
      if (val !== this.pdfsCurrentPage) this.pdfsCurrentPage = val 
      this.jumpPage = val
    },
    showDrop() { if (this.dropzone==false) this.dropzone = true },
    catchDrop(e) {
      this.dropzone = false

      let files = e.dataTransfer.files
      let folders = []
      let pdfs = []
      for (let f of files) {
        if (!f.type && f.size%4096 == 0) { // is a folder?
          folders.push(f.path)
        } else {
          if ( f.type.match(/.+?(?=\/)/)[0] == 'pdf' ) pdfs.push(f.path)
        }
      }

      if (folders.length == 0 && pdfs.length == 0) {
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `No pdfs found in the dropped files`
        })
      } else {
        this.$store.state.scan.folders = folders
        this.$store.state.scan.files = pdfs
        this.$store.state.scan.stage = 2
        this.$store.state.Settings.dialogScanPdfs = true
      }
    },
  },
  watch: {
    pdfsOnPage() {
      this.clearSelection()
      this.generateImages()
    },
    pdfsPerPage() {
      this.clearSelection()
      this.generateImages()
    },
    pdfsCurrentPage() {
      this.clearSelection()
      this.generateImages()
    },
  },
}
</script>


<style lang="scss" scoped>
.dropzone {
  position: fixed;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  padding: 100px;
  opacity: 0.9;
  .text {
    pointer-events: none;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    border: 8px dashed;
    font-size: 2em;
  }
}
</style>