<template>
  <vuescroll>
    <div @dragover="showDrop">
      <div class="py-4"/>
      <v-container class="text-center">
        <v-row v-if="pdfNumber==0">
          <v-col cols="12">
            <img alt="Padoof" width="200" height="200" :src="logoPath">
            <h2 class="my-8">Welcome to Padoof!</h2>
        
            <div v-if="metaNumber==0" cols="12">
              <div class="mb-4"> First, create a meta for your PDFs. 
                You can view and customize the meta in the settings </div>
              <v-btn @click="createAllMeta=true" :disabled="isAllMetaCreated" class="mb-4" color="primary" x-large rounded block>
                <v-icon left>mdi-auto-fix</v-icon> Create all meta </v-btn>
            </div>

            <div class="mb-4 mt-10">Then add PDFs from your computer by selecting folders. You can also drag and drop files</div>
            <v-btn @click="$store.state.Settings.dialogScanPdfs=true" color="primary" class="mb-6" x-large rounded block>
              <v-icon left>mdi-plus</v-icon> Add PDFs </v-btn>
          </v-col>
        </v-row>

        <v-row v-else>
          <v-col cols="12" class="pt-0 d-flex justify-space-between">
            <v-btn @click="$store.state.Settings.dialogScanPdfs=true" rounded color="primary">
              <v-icon left>mdi-plus</v-icon> Add new PDFs
            </v-btn>
            <v-btn @click="customization=!customization" rounded color="primary"> 
              <v-icon left>mdi-cog</v-icon> {{customization?'Finish Customization':'Customize widgets'}} </v-btn>
          </v-col>

          <v-col v-if="isAllWidgetsHidden" cols="12">
            <v-alert type="info" outlined text class="ma-0">
              All widgets are hidden. Set up at least one of the widgets to show for a more attractive look
            </v-alert>
          </v-col>

          <v-col v-if="customization" cols="12">
            <v-card outlined>
              <v-card-actions>
                <div>Graph with number of PDFs added and edited per days</div> 
                <v-spacer></v-spacer>
                <v-switch v-model="widgets.graphVideos" @change="updateWidget($event, 'graphVideos')" inset hide-details class="ma-2 pt-0"
                  :append-icon="`mdi-${widgets.graphVideos?'eye':'eye-off'}`"/>
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col v-if="customization||widgets.graphVideos" cols="12">
            <v-card outlined>
              <v-toolbar color="secondary">
                <div class="headline">Number of PDFs added and edited per days</div>
                <v-spacer></v-spacer>
                <v-btn @click="initVideosStat(daysBefore)" outlined>All time</v-btn>
                <v-btn @click="initVideosStat(30)" outlined class="ml-4">Last Month</v-btn>
                <v-btn @click="initVideosStat(7)" outlined class="ml-4">Last Week</v-btn>
              </v-toolbar>
              <apexchart type="area" height="250" class="pt-2" :options="chartOptions" :series="series"/>
            </v-card>   
          </v-col>
        
          <v-col v-if="customization" cols="12">
            <v-card outlined>
              <v-card-actions>
                <div>Total values of all PDFs</div>
                <v-spacer></v-spacer>
                <v-switch v-model="widgets.numberVideos" @change="updateWidget($event, 'numberVideos')" inset hide-details class="ma-2 pt-0"
                  :append-icon="`mdi-${widgets.numberVideos?'eye':'eye-off'}`"/>
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col v-if="customization||widgets.numberVideos" cols="12">
            <div class="d-flex flex-wrap justify-space-around">
              <v-card outlined class="pa-2">
                <v-icon>mdi-database</v-icon> Total Number of PDFs:
                <b v-text="$store.getters.pdfTotal"/>
              </v-card>
              <v-card outlined class="pa-2">
                <v-icon>mdi-harddisk</v-icon> Total File Size:
                <b v-text="$store.getters.pdfsTotalSize"/>
              </v-card>
            </div>
          </v-col>

          <v-col v-if="customization" cols="12">
            <v-card outlined>
              <v-card-actions>
                <div>Recently added PDFs</div>
                <v-spacer></v-spacer>
                <v-switch v-model="widgets.recentVideos" @change="updateWidget($event, 'recentVideos')" inset hide-details class="ma-2 pt-0"
                  :append-icon="`mdi-${widgets.recentVideos?'eye':'eye-off'}`"/>
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col v-if="customization||widgets.recentVideos" cols="12">
            <v-card outlined>
              <v-toolbar color="secondary">
                <div class="headline">{{numberRecentVideos}} recently added PDFs</div>
                <v-spacer></v-spacer>
                <v-btn to="/pdfs/:default?tabId=default" draggable="false" outlined>
                  <v-icon left>mdi-pdf</v-icon> Show All PDFs</v-btn>
              </v-toolbar>
              <div class="previews-grid" @mousedown="stopSmoothScroll($event)"> 
                <v-hover v-for="pdf in recentVideos" :key="pdf.id">
                  <template v-slot:default="{ hover }">
                    <v-img :src="getVideoThumbUrl(pdf.id)" @click="playVideo(pdf, 'recentVideos')" aspect-ratio="1">
                      <v-fade-transition>
                        <v-overlay v-if="hover" absolute color="secondary">
                          <v-btn icon x-large outlined>
                            <v-icon>mdi-play</v-icon>
                          </v-btn>
                        </v-overlay>
                      </v-fade-transition>
                    </v-img>
                  </template>
                </v-hover>
              </div>
            </v-card>
          </v-col>

          <v-col v-if="customization" cols="12">
            <v-card outlined>
              <v-card-actions>
                <div>Most viewed PDFs</div>
                <v-spacer></v-spacer>
                <v-switch v-model="widgets.topViewedVideos" @change="updateWidget($event, 'topViewedVideos')" inset hide-details class="ma-2 pt-0"
                  :append-icon="`mdi-${widgets.topViewedVideos?'eye':'eye-off'}`"/>
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col v-if="customization||widgets.topViewedVideos" cols="12">
            <v-card outlined>
              <v-toolbar color="secondary">
                <div class="headline">Top 10 most viewed PDFs ({{pdfsViewedLastWeek}} viewed in the past week)</div>
                <v-spacer></v-spacer>
                <v-btn to="/pdfs/:default?tabId=default" draggable="false" outlined>
                  <v-icon left>mdi-pdf</v-icon> Show All PDFs</v-btn>
              </v-toolbar>
              <div class="previews-grid" @mousedown="stopSmoothScroll($event)"> 
                <v-hover v-for="pdf in topViewedVideos" :key="pdf.id+1">
                  <template v-slot:default="{ hover }">
                    <v-img :src="getVideoThumbUrl(pdf.id)" @click="playVideo(pdf, 'topViewedVideos')" aspect-ratio="1" dark>
                      <v-fade-transition>
                        <v-overlay v-if="hover" absolute color="secondary">
                          <v-btn icon x-large outlined>
                            <v-icon>mdi-play</v-icon>
                          </v-btn>
                        </v-overlay>
                      </v-fade-transition>
                      <span class="views"><v-icon>mdi-eye-outline</v-icon> {{pdf.views||0}}</span>
                    </v-img>
                  </template>
                </v-hover>
              </div>
            </v-card>
          </v-col>

          <v-col v-if="customization" cols="12">
            <v-card outlined>
              <v-card-actions>
                <div>Top 10 most viewed meta cards</div>
                <v-spacer></v-spacer>
                <v-switch v-model="widgets.topViewedMetaCards" @change="updateWidget($event, 'topViewedMetaCards')" inset hide-details class="ma-2 pt-0"
                  :append-icon="`mdi-${widgets.topViewedMetaCards?'eye':'eye-off'}`"/>
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col v-if="customization||widgets.topViewedMetaCards" cols="12">
            <v-card v-for="m in complexMetaAssignedToVideo" :key="m.id" outlined class="mb-6">
              <v-toolbar color="secondary">
                <div class="headline"> Top 10 most viewed {{getMeta(m.id).settings.name.toLowerCase()}} </div>
                <v-spacer></v-spacer>
                <v-btn :to="`/meta/?metaId=${m.id}&tabId=default`" draggable="false" outlined>
                  <v-icon left>mdi-{{getMeta(m.id).settings.icon}}</v-icon> Show All {{getMeta(m.id).settings.name}}</v-btn>
              </v-toolbar>
              <div class="previews-grid">
                <v-hover v-for="mc in getTopMetaCards(m.id)" :key="mc.id">
                  <template v-slot:default="{ hover }">
                    <v-card outlined hover
                      @mousedown="stopSmoothScroll($event)"
                      @click="openMetaCardPage(m.id,mc.id)" 
                      @click.middle="addNewTabMetaCard(m.id,mc.id,mc.meta.name)">
                      <div class="pa-1 profile-avatar">
                        <v-avatar width="100" height="100">
                          <img :src="getImgMetaCard(m.id,mc.id)">
                        </v-avatar>
                        <span class="views"><v-icon dark>mdi-eye-outline</v-icon> {{mc.views||0}}</span>
                      </div>
                      <div class="caption px-1">{{mc.meta.name}}</div>
                      
                      <v-expand-transition>
                        <v-overlay v-if="hover" absolute color="secondary" z-index="1">
                          <v-icon>mdi-{{getMeta(m.id).settings.icon}}</v-icon>
                          <div>Open page</div>
                        </v-overlay>
                      </v-expand-transition>
                    </v-card>
                  </template>
                </v-hover>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <div v-if="$store.state.Settings.pdfTotal==0">
          <h2>First of all add PDFs in settings</h2>
          <v-btn class="ma-2" color="secondary" to="/settings" draggable="false">Open settings</v-btn>
        </div>
      </v-container>

      <CreateAllMeta v-if="createAllMeta" 
        :dialog="createAllMeta" 
        @finish="finishCreationAllMeta" 
        @close="createAllMeta=false"/>
      
      <DialogAddMetaCardsTemplate v-if="dialogAddMetaCardsTemplate" 
        :dialog="dialogAddMetaCardsTemplate" 
        @finish="finishAddMetaCardsTemplate" 
        @close="dialogAddMetaCardsTemplate=false"/>

      <div v-show="$store.state.Settings.navigationSide=='2'" class="py-6"></div>
      
      <v-card v-show="dropzone" 
        @dragleave="dropzone=false" 
        @drop="catchDrop($event)" 
        @dragenter.prevent 
        @dragover.prevent 
        class="dropzone">
        <div class="text">Drop PDF or folder to add them</div>
      </v-card>
    </div>
  </vuescroll>
</template>

<script>
const path = require('path')
const fs = require('fs')
const shell = require('electron').shell

import vuescroll from 'vuescroll'
import LabelFunctions from '@/mixins/LabelFunctions'
import { ipcRenderer } from 'electron'
import MetaGetters from '@/mixins/MetaGetters'
import VueApexCharts from 'vue-apexcharts'
import VideosGrid from '@/mixins/VideosGrid'

export default {
  name: 'HomePage',
  components: {
    vuescroll,
    apexchart: VueApexCharts,
    CreateAllMeta: () => import("@/components/pages/meta/CreateAllMeta.vue"),
    DialogAddMetaCardsTemplate: () => import("@/components/pages/meta/DialogAddMetaCardsTemplate.vue"),
  },
  mixins: [LabelFunctions, MetaGetters, VideosGrid], 
  beforeMount() {
    this.initWidgets()
    this.initVideosStat(7)
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: ()=>({
    isScrollToTopVisible: false,
    createAllMeta: false,
    isAllMetaCreated: false,
    // stats
    numberRecentVideos: 20,
    customization: false,
    series: [],
    chartOptions: {},
    dialogAddMetaCardsTemplate: false,
  }),
  computed: {
    settings() { return this.$store.getters.settings.value() },
    recentVideos() { return this.$store.getters.pdfs.orderBy('date', ['desc']).take(this.numberRecentVideos).value() },
    topViewedVideos() { return this.$store.getters.pdfs.orderBy('views', ['desc']).take(10).value() },
    pdfsViewedLastWeek() {
      let lastWeek = new Date().setDate(new Date().getDate()-7)
      return this.$store.getters.pdfs.filter(v=>v.viewed||0>=lastWeek).value().length
    },
    pathToUserData() { return this.$store.getters.getPathToUserData },
    logoPath() { return path.join('file://', __static, '/icons/icon.png') },
    pdfNumber() { return this.$store.getters.pdfs.value().length },
    metaNumber() { return this.$store.getters.meta.filter(i=>i.type!=='specific').value().length },
    complexMetaAssignedToVideo() { return this.$store.getters.settings.get('metaAssignedToVideos').filter({type:'complex'}).value() },
    daysBefore() { 
      let v = this.$store.getters.pdfs.orderBy(i=>i.date, ['asc']).take(1).value()
      if (v.length) return Math.floor((Date.now() - v[0].date)/(60*60*1000*24))
      else return 7
    },
    darkMode() { return this.$store.state.Settings.darkMode },
    widgets: {
      get() { return this.$store.state.Settings.widgets },
      set(value) { this.$store.dispatch('updateSettingsState', {key:'widgets', value}) },
    },
    isAllWidgetsHidden() {
      let allHidden = true
      for (let widget in this.widgets) if (this.widgets[widget]===true) allHidden = false
      return allHidden 
    },
  },
  methods: {
    initVideosStat(days) {
      let today = new Date()
      let numAdded = []
      let numEdited = []
      let dates = []
      for (let i = 0; i < days; i++) {
        let ms = new Date().setDate(today.getDate()-i)
        let start = new Date(ms)
        let end = new Date(ms)
        start.setHours(0,0,0,0)
        dates.push(start.getTime() - start.getTimezoneOffset() * 60 * 1000)
        start = start.getTime()
        end.setHours(23,59,59,999)
        end = end.getTime()
        let added = this.$store.getters.pdfs.filter(v=>v.date>=start&&v.date<=end).value()
        let edited = this.$store.getters.pdfs.filter(v=>v.edit>=start&&v.edit<=end).value()
        numAdded.push(added.length)
        numEdited.push(edited.length)
      }
      
      this.series = [{name:'Added',data:numAdded},{name:'Edited',data:numEdited}]
      this.chartOptions = {
        theme: { mode: this.darkMode ? "dark" : "light"},
        colors:['#00d838', '#1e79e9'],
        dataLabels: { enabled: false },
        xaxis: { type: 'datetime', categories: dates },
      }
    },
    initWidgets() {
      let defaultWidgets = {
        graphVideos: true,
        numberVideos: true,
        recentVideos: true,
        topViewedVideos: true,
        topViewedMetaCards: true,
      }
      this.widgets = {...defaultWidgets, ...this.widgets}
    },
    updateWidget(value, widgetName) { this.widgets = {...this.widgets, ...{[widgetName]: value}} },
    stopSmoothScroll(event) {
      if(event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
    getTopMetaCards(metaId) { return this.$store.getters.metaCards.filter({metaId}).orderBy(i=>i.views||0, ['desc']).take(10).value() },
    getVideoThumbUrl(pdfId) {
      let imgPath = path.join(this.pathToUserData, `/media/thumbs/${pdfId}.jpg`)
      return 'file://' + this.checkVideoImageExist(imgPath)
    },
    checkVideoImageExist(imgPath) {
      if (fs.existsSync(imgPath)) return imgPath
      else return path.join(__static, '/img/default.png')
    },
    playVideo(pdf, typeVideos) {
      if (!fs.existsSync(pdf.path)) {
        this.$store.state.Videos.dialogErrorPlayVideo = true
        this.$store.state.Videos.errorPlayVideoPath = pdf.path
        return
      }
      if (this.$store.state.Settings.isopenPDFInSystemPlayer) shell.openPath(pdf.path) 
      else {
        let data = { pdfs: this[typeVideos], id: pdf.id, path: this.pdf.path  }
        console.log("Sending 6");
        ipcRenderer.send('openPlayer', data)
      }
      let views = pdf.views || 0
      if (this.$store.state.Settings.countNumberOfViews) ++views 
      this.$store.getters.pdfs.find({id: pdf.id}).assign({
        views: views,
        viewed: Date.now(),
      }).write()
    },
    finishCreationAllMeta() {
      this.createAllMeta = false
      this.isAllMetaCreated = true
      this.dialogAddMetaCardsTemplate = true
    },
    finishAddMetaCardsTemplate() {
      this.dialogAddMetaCardsTemplate = false
      this.$store.dispatch('setNotification', {
        type: 'info',
        text: 'Scraping not yet supported'
      })
    },
    getImgMetaCard(metaId, cardId) {
      let imgPath = path.join(this.pathToUserData, '/media/meta/', `${metaId}/${cardId}_avatar.jpg`)
      if (fs.existsSync(imgPath)) return 'file://' + imgPath
      imgPath = path.join(this.pathToUserData, '/media/meta/', `${metaId}/${cardId}_main.jpg`)
      if (fs.existsSync(imgPath)) return 'file://' + imgPath
      else return 'file://' + path.join(__static, '/img/default.png')
    },
    openMetaCardPage(metaId, metaCardId) { this.$router.push(`/metacard/?metaId=${metaId}&cardId=${metaCardId}&tabId=default`) },
    addNewTabMetaCard(metaId, metaCardId, metaCardName) {
      let tabId = metaCardId
      let tabName = metaCardName
      let meta = this.getMeta(metaId)

      if (this.$store.getters.tabsDb.find({id: tabId}).value()) {
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Tab with ${meta.settings.nameSingular.toLowerCase()} "${tabName}" already exists`
        })
        return
      }

      let tab = {
        name: tabName,
        link: `/metacard/?metaId=${meta.id}&cardId=${tabId}&tabId=${tabId}`,
        id: tabId,
        icon: meta.settings.icon
      }
      this.$store.dispatch('addNewTab', tab)
    },
    openLink(link) { shell.openExternal(link) },
  },
  watch: {
    darkMode() { setTimeout(() => { this.initVideosStat(7) }, 3000) },
  }
}
</script>

<style lang="less">
.error-fix {
  font-size: 10px;
  user-select: text;
}
.previews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10%, 10%));
  .v-image {
    cursor: pointer;
  }
  .profile-avatar {
    position: relative;
    img {
      height: auto;
      border-radius: 0;
      position: absolute;
      top: 0;
    }
  }
  .views {
    position: absolute;
    right: 1px;
    bottom: 1px;
    background-color: rgba(0, 0, 0, 0.6);
    padding: 0 3px;
    border-radius: 5px;
    display: flex;
    justify-content: center;
    color: #fff;
    font-size: 12px;
    .v-icon {
      font-size: 10px !important;
      margin-right: 3px;
    }
  }
}
</style>