<template>
  <v-lazy :key="cardKey" :data-id="pdf.id" class="select-item">
    <v-card v-if="view==0" @mousedown="stopSmoothScroll($event)" v-ripple="{ class: 'accent--text' }"
      @mousedown.right="$store.state.contextMenu=false" @contextmenu="showContextMenu"
      :class="{favorite: isFavorite, 'icons-in-card':ratingAndFavoriteInCard}" class="pdf-card meta-card"
      outlined hover :disabled="!reg && i>4"
    >
      <v-responsive 
        @mouseover.capture="playPreview()" @mouseleave="stopPlayingPreview()"
        :aspect-ratio="16/9" class="pdf-preview-container"
      >
        <div v-if="!reg && i>4" class="reg-block"> <div>App not registered</div> </div>
        <v-img :src="getImgUrl()" :aspect-ratio="16/9" class="thumb" contain/>
        <v-btn @click="playVideo" icon outlined class="btn-play" :color="isVideoExist?'white':'red'">
          <v-icon>mdi-play</v-icon> </v-btn>

        <div v-if="errorThumb" class="error-load-thumb">
          unable to find thumb for this PDF
        </div>

        <v-rating v-if="!ratingAndFavoriteInCard && !isRatingHidden" 
          :value="pdf.rating" @input="changeRating($event, pdf.id)"
          class="rating rating-wrapper"
          color="yellow darken-2" background-color="grey darken-1"
          empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"
          dense half-increments hover clearable />
        
        <v-btn v-if="!ratingAndFavoriteInCard && !isFavoriteHidden" 
          @click="isFavorite = !isFavorite" icon absolute 
          :color="isFavorite===false ? 'white' : 'pink'" class="fav-btn"
        > <v-icon :color="isFavorite===false?'grey':'pink'">mdi-heart-outline</v-icon>
        </v-btn>
        
        <div v-if="!isDurationHidden" class="duration">{{pdf.duration}} pages</div>

        <div class="preview"
          :style="`animation-delay: ${delayVideoPreview}.7s`">
          <pdf ref="pdf" autoplay muted loop />
        </div>

<!-- TODO hover behavior -->
        <div v-if="isVideoHovered && pdfPreviewHover=='timeline'" class="timeline">
          <img :src="getTimelineImgUrl(timeline[hoveredSection])">
          <div class="sections">
            <div v-for="(item, i) in timeline" :key="i" @mouseover="hoveredSection=i" class="section"/>
          </div>
        </div>
      </v-responsive>

      <div v-if="!isFileNameHidden" class="pdf-card-title" :title="fileName" v-html="fileName"/>

      <!-- Video meta -->
      <v-chip v-if="!isFileInfoHidden" label class="props px-2 py-1 mt-0 mx-1">
        <div label outlined class="prop" :title="pdfPath">
          <v-icon>mdi-folder-outline</v-icon>
          <span class="value">Path</span>
        </div>
        <div label outlined class="prop">
          <v-icon>mdi-book-open-page-variant-outline</v-icon>
          {{pdf.duration}} pages
        </div>
        <div label outlined class="prop">
          <v-icon>mdi-file-pdf</v-icon>
          {{fileExtension}}
        </div>
        <div label outlined class="prop">
          <v-icon>mdi-harddisk</v-icon>
          {{calcSize(pdf.size)}}
        </div>
      </v-chip>

      <v-card-actions v-if="ratingAndFavoriteInCard" class="px-1 py-0">
        <v-rating :value="pdf.rating" @input="changeRating($event, pdf.id)"
          color="yellow darken-2" background-color="grey"
          empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"
          dense half-increments hover clearable />
        <v-spacer></v-spacer>
        <v-btn @click="isFavorite = !isFavorite" icon color="pink" x-small class="fav-in-card"> 
          <v-icon v-if="isFavorite" color="pink">mdi-heart</v-icon>
          <v-icon v-else color="grey">mdi-heart-outline</v-icon>
        </v-btn>
      </v-card-actions>
      <v-divider v-if="ratingAndFavoriteInCard"></v-divider>

      <!-- Parse meta -->
      <div v-for="(m,i) in metaAssignedToVideos" :key="i">
        <div v-if="visibility[m.id]&&checkShowEmptyValue(m)" class="meta-in-card">
          <v-chip-group v-if="m.type=='complex'" column>
            <v-icon :title="getMeta(m.id).settings.name">mdi-{{getMeta(m.id).settings.icon}}</v-icon>
            <v-chip v-for="mc in pdf[m.id]" :key="mc" 
              :color="getColor(m.id,mc)" 
              :label="getMeta(m.id).settings.chipLabel"
              :outlined="getMeta(m.id).settings.chipOutlined"
              :title="`Open page with ${getMeta(m.id).settings.nameSingular.toLowerCase()}`"
              @click="openMetaCardPage(m.id,mc)"
              @click.middle="openMetaInNewTab(mc)"
              @mouseover.stop="showImage($event,mc,'meta',m.id)" 
              @mouseleave.stop="$store.state.hoveredImage=false"> 
                {{ getCard(mc).meta.name }} </v-chip>
          </v-chip-group>
          <div v-else-if="m.type=='simple'" class="simple-meta">
            <v-icon :title="getMeta(m.id).settings.name">mdi-{{getMeta(m.id).settings.icon}}</v-icon>
            <span v-if="getMeta(m.id).dataType=='array'">{{getArrayValuesForCard(m.id, 'pdf')}}</span>
            <span v-else-if="getMeta(m.id).dataType=='rating'">      
              <v-rating :value="pdf[m.id]" @input="changeMetaRating($event, m.id)" :length="getMeta(m.id).settings.ratingMax" hover 
                :full-icon="`mdi-${getMeta(m.id).settings.ratingIcon}`" :empty-icon="`mdi-${getMeta(m.id).settings.ratingIconEmpty||getMeta(m.id).settings.ratingIcon}`" 
                :color="getMeta(m.id).settings.ratingColor" background-color="grey" class="meta-rating" clearable
                :half-increments="getMeta(m.id).settings.ratingHalf" :half-icon="`mdi-${getMeta(m.id).settings.ratingIconHalf||getMeta(m.id).settings.ratingIcon}`"/>
            </span>
            <span v-else-if="getMeta(m.id).dataType=='boolean'">{{pdf[m.id]?'Yes':'No'}}</span>
            <span v-else>{{pdf[m.id]}}</span>
          </div>
        </div>
      </div>
      
      <v-icon v-if="pdf.bookmark" class="bookmark" color="red" :title="pdf.bookmark">mdi-bookmark</v-icon>

      <v-btn v-if="!isEditBtnHidden" @click="$store.state.Videos.dialogEditVideoInfo=true"
        color="secondary" fab x-small class="btn-edit"> <v-icon>mdi-pencil</v-icon> </v-btn>
    </v-card>
    <v-card v-else-if="view==1" @contextmenu="showContextMenu"
      @mousedown="stopSmoothScroll($event)" @mousedown.right="$store.state.contextMenu=false"
      class="pdf-card meta-card" outlined hover :disabled="!reg && i>4">
      <div @click="playVideo" @mousemove.capture="scrollStory($event)" @mouseleave="stopScrollStory" ref="story" class="story">
        <v-sheet v-if="!isFileNameHidden" class="pdf-card-title" v-html="fileName"/>
        <div v-if="!isVideoExist" class="path-error"> <div class="error">No PDF found. Please update the path.</div> </div>
        <div class="wrapper" ref="storyWrapper" :class="{'hovered':isVideoHovered}">
          <div v-for="(p, i) in timeline" :key="i" class="frame">
            <img :src="getTimelineImgUrl(p)"/>
            <div v-if="!isDurationHidden" class="duration">{{pdf.duration}} pages</div>
          </div>
        </div>
      </div>

      <div class="content">
        <v-btn v-if="!isFavoriteHidden" @click="isFavorite = !isFavorite" icon color="pink" class="mx-1"> 
          <v-icon v-if="isFavorite" color="pink">mdi-heart</v-icon>
          <v-icon v-else color="grey">mdi-heart-outline</v-icon>
        </v-btn>
        <v-rating v-if="!isRatingHidden" :value="pdf.rating" @input="changeRating($event, pdf.id)"
          color="yellow darken-2" background-color="grey"
          empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"
          dense half-increments hover clearable class="mx-1" />

        <v-chip v-if="!isFileInfoHidden" label class="px-2 py-1 mx-2">
          <div label outlined class="prop mr-2" :title="pdfPath">
            <v-icon>mdi-folder-outline</v-icon>
            <span class="value">Path</span>
          </div>
          <div label outlined class="prop mr-2">
            <v-icon>mdi-monitor-screenshot</v-icon>
            {{pdf.resolution}}
          </div>
          <div label outlined class="prop mr-2">
            <v-icon>mdi-file-pdf</v-icon>
            {{fileExtension}}
          </div>
          <div label outlined class="prop">
            <v-icon>mdi-harddisk</v-icon>
            {{calcSize(pdf.size)}}
          </div>
        </v-chip>

        <!-- Parse meta -->
        <div v-for="(m,i) in metaAssignedToVideos" :key="i" class="d-flex">
          <div v-if="visibility[m.id]&&checkShowEmptyValue(m)" class="meta-in-card">
            <v-chip-group v-if="m.type=='complex'" column>
              <v-icon :title="getMeta(m.id).settings.name">mdi-{{getMeta(m.id).settings.icon}}</v-icon>
              <v-chip v-for="mc in pdf[m.id]" :key="mc" 
                :color="getColor(m.id,mc)" 
                :label="getMeta(m.id).settings.chipLabel"
                :outlined="getMeta(m.id).settings.chipOutlined"
                :title="`Open page with ${getMeta(m.id).settings.nameSingular.toLowerCase()}`"
                @click="openMetaCardPage(m.id,mc)"
                @click.middle="openMetaInNewTab(mc)"
                @mouseover.stop="showImage($event,mc,'meta',m.id)" 
                @mouseleave.stop="$store.state.hoveredImage=false"> 
                  {{ getCard(mc).meta.name }} </v-chip>
            </v-chip-group>
            <div v-else-if="m.type=='simple'" class="simple-meta">
              <v-icon :title="getMeta(m.id).settings.name">mdi-{{getMeta(m.id).settings.icon}}</v-icon>
              <span v-if="getMeta(m.id).dataType=='array'">{{getArrayValuesForCard(m.id, 'pdf')}}</span>
              <span v-else-if="getMeta(m.id).dataType=='rating'">      
                <v-rating :value="pdf[m.id]" @input="changeMetaRating($event, m.id)" :length="getMeta(m.id).settings.ratingMax" hover 
                  :full-icon="`mdi-${getMeta(m.id).settings.ratingIcon}`" :empty-icon="`mdi-${getMeta(m.id).settings.ratingIconEmpty||getMeta(m.id).settings.ratingIcon}`" 
                  :color="getMeta(m.id).settings.ratingColor" background-color="grey" class="meta-rating" clearable
                  :half-increments="getMeta(m.id).settings.ratingHalf" :half-icon="`mdi-${getMeta(m.id).settings.ratingIconHalf||getMeta(m.id).settings.ratingIcon}`"/>
              </span>
              <span v-else-if="getMeta(m.id).dataType=='boolean'">{{pdf[m.id]?'Yes':'No'}}</span>
              <span v-else>{{pdf[m.id]}}</span>
            </div>
          </div>
        </div>
      </div>

      <v-btn v-if="!isEditBtnHidden" @click="$store.state.Videos.dialogEditVideoInfo=true"
        color="secondary" fab x-small class="btn-edit"> <v-icon>mdi-pencil</v-icon> </v-btn>
    </v-card>
  </v-lazy>
</template>

<script>
const { clipboard, ipcRenderer } = require('electron')
const shell = require('electron').shell
const fs = require('fs')
const mv = require('mv');
const path = require('path')
const shortid = require('shortid')
const ffmpeg = require('fluent-ffmpeg')
const pathToFfprobe = require('ffprobe-static').path.replace('app.asar', 'app.asar.unpacked')
ffmpeg.setFfprobePath(pathToFfprobe)

import Functions from '@/mixins/Functions'
import ShowImageFunction from '@/mixins/ShowImageFunction'
import LabelFunctions from '@/mixins/LabelFunctions'
import MetaGetters from '@/mixins/MetaGetters'
import {PDFDocument} from 'pdf-lib';
// const pdfjsLib = require('pdfjs-dist');

export default {
  name: 'VideoCard',
  props: {
    pdf: Object,
    i: Number,
    reg: Boolean,
  },
  mixins: [ShowImageFunction, Functions, LabelFunctions, MetaGetters],
  mounted() {
    this.$nextTick(function () {
      this.cardKey = this.pdf.id
      this.isVideoExist = fs.existsSync(this.pdf.path)
    })
  },
  beforeDestroy() {
    try { this.$refs.pdf.src = '' } catch (error) {}
  },
  destroyed() {
    for (const timeout in this.timeouts) clearTimeout(this.timeouts[timeout])
  },
  data: () => ({
    isVideoExist: false,
    errorThumb: false,
    isVideoHovered: false,
    timeouts: {},
    cardKey: '',
    hoveredSection: 0,
    timeline: [5, 15, 25, 35, 45, 55, 65, 75, 85, 95],
  }),
  computed: {
    updateCardIds() { return this.$store.state.Videos.updateCardIds},
    isChipsColored() {return this.$store.state.Settings.pdfChipsColored},
    isEditBtnHidden() {return this.$store.state.Settings.pdfEditBtnHidden },
    isFileNameHidden() {return this.$store.state.Settings.pdfFileNameHidden },
    isFileInfoHidden() {return this.$store.state.Settings.pdfFileInfoHidden },
    isRatingHidden() {return this.$store.state.Settings.pdfRatingHidden },
    isFavoriteHidden() {return this.$store.state.Settings.pdfFavoriteHidden},
    isQualityLabelHidden() {return this.$store.state.Settings.pdfQualityLabelHidden},
    isDurationHidden() { return this.$store.state.Settings.pdfDurationHidden },
    pdfPath() { return path.parse(this.pdf.path).dir },
    fileName() { return path.parse(this.pdf.path).name },
    fileExtension() { return path.parse(this.pdf.path).ext.replace('.', '').toLowerCase() },
    isFavorite: {
      get() { return this.pdf.favorite },
      set(value) {
        this.pdf.favorite = value
        this.$store.getters.pdfs.find({id: this.pdf.id}).assign({
          favorite: value,
          edit: Date.now(),
        }).write()
      },
    },
    pathToUserData() { return this.$store.getters.getPathToUserData },
    pdfPreviewStatic() { return this.$store.state.Settings.pdfPreviewStatic },
    pdfPreviewHover() { return this.$store.state.Settings.pdfPreviewHover },
    delayVideoPreview() { return this.$store.state.Settings.delayVideoPreview },
    ratingAndFavoriteInCard() { return this.$store.state.Settings.ratingAndFavoriteInCard },
    metaAssignedToVideos() { return this.$store.state.Settings.metaAssignedToVideos },
    view() { return this.$store.state.Settings.pdfView || 0 },
    visibility() { return this.$store.state.Settings.pdfVisibility },
    isSelectedSingleVideo() { return this.$store.getters.getSelectedVideos.length == 1 },
    complexMetaAssignedToVideo() { return this.$store.getters.settings.get('metaAssignedToVideos').filter({type:'complex'}).value() },
    metaForParsing() {  
      let ids = this.$store.getters.settings.get('metaAssignedToVideos').filter({type:'complex'}).map('id').value() 
      return this.$store.getters.meta.filter(i=>ids.includes(i.id)&&i.settings.parser).value()
    },
    showEmptyMetaValueInCard() { return this.$store.state.Settings.showEmptyMetaValueInCard },
    playlists() { return this.$store.getters.playlists.value() },
  },
  methods: {
    openMetaCardPage(metaId, cardId) { this.$router.push(`/metacard/?metaId=${metaId}&cardId=${cardId}&tabId=default`) },
    stopSmoothScroll(event) {
      if(event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
    checkShowEmptyValue(meta) {
      if (this.showEmptyMetaValueInCard) return true
      if (meta.type == 'complex') return this.pdf[meta.id]&&this.pdf[meta.id].length
      let valueType = typeof this.pdf[meta.id]
      let simpleMeta = this.getMeta(meta.id)
      if (valueType == 'undefined' && simpleMeta.dataType!=='rating') return false
      if (['object','string'].includes(valueType)) return this.pdf[meta.id].length
      else return true
    },
    setVideoProgress(percent) { this.$refs.pdf.currentTime = Math.floor(this.pdf.duration*percent) },
    playPreview() {
      if (this.isVideoHovered) return
      this.isVideoHovered = true
      if (this.pdfPreviewHover !== 'pdf') return
      this.timeouts.z = setTimeout(()=>{
        // play original pdf
        if (!this.isVideoExist) return
        this.$refs.pdf.src = this.pdf.path
        this.setVideoProgress(0.2)
        this.timeouts.a = setTimeout(this.setVideoProgress, 3000, 0.4)
        this.timeouts.b = setTimeout(this.setVideoProgress, 6000, 0.6)
        this.timeouts.c = setTimeout(this.setVideoProgress, 9000, 0.8)
        this.timeouts.d = setTimeout(this.setVideoProgress, 12000, 0.2)
      }, this.delayVideoPreview * 1000 + 500)
    },
    stopPlayingPreview() {
      if (this.pdfPreviewHover != 'none') this.isVideoHovered = false
      if (this.pdfPreviewHover != 'pdf') return
      for (const timeout in this.timeouts) clearTimeout(this.timeouts[timeout])
      this.$refs.pdf.src = ''
    },
    scrollStory(e) {
      let storyWidth = this.$refs.story.clientWidth
      let wrapperWidth = this.$refs.storyWrapper.clientWidth
      if (wrapperWidth <= storyWidth) return
      let x = e.layerX
      let ratio = storyWidth / (wrapperWidth - storyWidth)
      let offset = Math.ceil(x / ratio)
      this.$refs.storyWrapper.style.left = '-' + offset +'px'
    },
    stopScrollStory() { this.$refs.storyWrapper.style.left = 0 },
    getImgUrl() {
      let imgPath = path.join(this.pathToUserData, `/media/thumbs/${this.pdf.id}.jpg`)
      let gridPath = path.join(this.pathToUserData, `/media/grids/${this.pdf.id}.jpg`)
      return 'file://' + this.checkImageExist(imgPath, gridPath)
    },
    checkImageExist(imgPath, gridPath) {
      if (this.pdfPreviewStatic=='grid' && fs.existsSync(gridPath)) return gridPath
      else if (fs.existsSync(imgPath)) return imgPath
      else {
        this.errorThumb = true
        return path.join(__static, '/img/default.png')
      }
    },
    getTimelineImgUrl(progress) {
      let imgPath = path.join(this.pathToUserData, `/media/timelines/${this.pdf.id}_${progress}.jpg`)
      if (fs.existsSync(imgPath)) return 'file://' + imgPath
      else return 'file://' + path.join(__static, '/img/default.png')
    },
    playVideo() {
      const pathToVideo = this.pdf.path
      if (!this.isVideoExist) {
        this.$store.state.Videos.dialogErrorPlayVideo = true
        this.$store.state.Videos.errorPlayVideoPath = pathToVideo
        return
      }
      if (this.$store.state.Settings.isopenPDFInSystemPlayer) shell.openPath(pathToVideo) 
      else { 
        let data = { pdfs: this.$store.getters.pdfsOnPage, id: this.pdf.id, path: this.pdf.path }
        console.log("Sending 1");
        console.log(data);
        ipcRenderer.send('openPlayer', data)
      } 
      this.countViewData()
    },
    openPDFInSystemPlayer() {
      const pathToVideo = this.pdf.path
      if (!this.isVideoExist) {
        this.$store.state.Videos.dialogErrorPlayVideo = true
        this.$store.state.Videos.errorPlayVideoPath = pathToVideo
        return
      }
      shell.openPath(pathToVideo) 
      this.countViewData()
    },
    countViewData() {
      let views = this.pdf.views || 0
      if (this.$store.state.Settings.countNumberOfViews) ++views 
      this.$store.getters.pdfs.find({id: this.pdf.id}).assign({
        views: views,
        viewed: Date.now(),
      }).write()
    },
    changeRating(stars, pdfID) { this.$store.getters.pdfs.find({id:pdfID}).assign({rating:stars,edit:Date.now()}).write() },
    showContextMenu(e) {
      e.preventDefault()
      const vm = this
      function getFilterMeta() {
        let menuMetaAssignedToVideo = []
        for (let m of vm.complexMetaAssignedToVideo) {
          const meta = vm.getMeta(m.id)
          let menuMetaCards = []
          let metaCardIds = vm.pdf[m.id]
          if (metaCardIds) for (let metaCardId of metaCardIds) {
            const card = vm.getCard(metaCardId)
            menuMetaCards.push({name: card.meta.name, type: 'item', icon: 'circle', color: card.meta.color, function: ()=>{vm.filterVideosBy(m.id,metaCardId)}})
          }
          if (menuMetaCards.length==0) menuMetaCards.push({name:'No added meta', type: 'item', function: ()=>{}, disabled: true})
          menuMetaAssignedToVideo.push({name: meta.settings.name, type: 'menu', icon: meta.settings.icon, disabled: !vm.isSelectedSingleVideo, menu:menuMetaCards})
        }
        if (menuMetaAssignedToVideo.length==0) menuMetaAssignedToVideo.push({name:'No assigned meta', type: 'item', function: ()=>{}, disabled: true})
        return menuMetaAssignedToVideo
      }
      function metaClipboard(metaId, type) {
        if (type === 'copy') {
          let metaCardIds = []
          vm.$store.getters.getSelectedVideos.map(pdfId => {
            let pdf = vm.$store.getters.pdfs.find({id:pdfId}).value()
            if (pdf[metaId]) metaCardIds = [...metaCardIds, ...pdf[metaId] || []] 
          })
          metaCardIds = metaCardIds.filter((value, index, self) => (self.indexOf(value) === index))
          vm.$store.state.clipboardMeta[metaId] = metaCardIds
          let names = []
          for (let i of vm.$store.state.clipboardMeta[metaId]) {
            names.push(vm.getCard(i).meta.name)
          }
          clipboard.writeText(names.join(', '))
        } else {
          let clipboard = vm.$store.state.clipboardMeta[metaId]
          let pdfIds = vm.$store.getters.getSelectedVideos
          if ((clipboard===undefined || clipboard.length==0) && type!=='clear' || pdfIds.length==0) return
          pdfIds.map(pdfId => {
            let newValues = []
            let pdf = vm.$store.getters.pdfs.find({ id: pdfId })
            // replace pdf values with clipboard values
            if (type === 'add') {
              newValues = [...pdf.value()[metaId] || [], ...clipboard]
              newValues = [...new Set(newValues)]
            } else if (type === 'replace') newValues = clipboard
            // sort by name
            let meta = vm.getMeta(metaId)
            if (meta && meta.type === 'complex') newValues.sort((a,b)=>{
              a = vm.getCard(a).meta.name
              b = vm.getCard(b).meta.name
              return a.localeCompare(b)
            })
            pdf.assign({[metaId]:newValues,edit:Date.now()}).write()
          })
          vm.$store.commit('updateVideos', pdfIds)
        }
      }
      function getMetaClipboard(type) {
        let items = []
        for (let m of vm.complexMetaAssignedToVideo) {
          const meta = vm.getMeta(m.id)
          items.push({name: meta.settings.name, type: 'item', icon: meta.settings.icon, function: ()=>{metaClipboard(m.id, type)}})
        }
        if (vm.complexMetaAssignedToVideo.length==0) items.push({name:'No added meta', type: 'item', function: ()=>{}, disabled: true})
        return items
      }
      function getPlaylists() {
        let items = []
        for (let p of vm.playlists) {
          items.push({name: `${p.name} (${p.pdfs.length})`, type: 'item', icon: '', function: ()=>{vm.addToPlaylist(p)}})
        }
        if (vm.playlists.length==0) items.push({name:'No playlists', type: 'item', function: ()=>{}, disabled: true})
        return items
      }
      setTimeout(() => {
        this.$store.state.x = e.clientX
        this.$store.state.y = e.clientY
        let contextMenu = [
          { name: `Open in System Player`, type: 'item', icon: 'play', function: ()=>{this.openPDFInSystemPlayer()}},
          { name: `Add to Playlist`, type: 'menu', icon: 'playlist-plus', menu: getPlaylists()},
          { type: 'divider' },
          { name: `Edit Info`, type: 'item', icon: 'pencil', function: ()=>{this.$store.state.Videos.dialogEditVideoInfo=true}},
          { name: `Rating`, type: 'menu', icon: 'star', menu: [
            { name: `5`, type: 'item', icon: 'star', function: ()=>{this.changeRating(5)}},
            { name: `4.5`, type: 'item', icon: 'star-half-full', function: ()=>{this.changeRating(4.5)}},
            { name: `4`, type: 'item', icon: 'star', function: ()=>{this.changeRating(4)}},
            { name: `3.5`, type: 'item', icon: 'star-half-full', function: ()=>{this.changeRating(3.5)}},
            { name: `3`, type: 'item', icon: 'star', function: ()=>{this.changeRating(3)}},
            { name: `2.5`, type: 'item', icon: 'star-half-full', function: ()=>{this.changeRating(2.5)}},
            { name: `2`, type: 'item', icon: 'star', function: ()=>{this.changeRating(2)}},
            { name: `1.5`, type: 'item', icon: 'star-half-full', function: ()=>{this.changeRating(1.5)}},
            { name: `1`, type: 'item', icon: 'star', function: ()=>{this.changeRating(1)}},
            { name: `0.5`, type: 'item', icon: 'star-half-full', function: ()=>{this.changeRating(0.5)}},
            { name: `0`, type: 'item', icon: 'star-outline', function: ()=>{this.changeRating(0)}},
          ]},
          { name: `Favorite`, type: 'menu', icon: 'heart', menu: [
            { name: `Add to Favorite `, type: 'item', icon: 'heart-plus', function: ()=>{this.changeFavorite(true)}},
            { name: `Remove from Favorite`, type: 'item', icon: 'heart-remove', function: ()=>{this.changeFavorite(false)}},
          ]},
          { type: 'divider' },
          { name: `Copy Meta to Clipboard`, type: 'menu', icon: 'content-copy', menu: getMetaClipboard('copy')},
          { name: `Add Meta from Clipboard`, type: 'menu', icon: 'plus-circle-outline', menu: getMetaClipboard('add')},
          { name: `Replace Meta from Clipboard`, type: 'menu', icon: 'reload-alert', menu: getMetaClipboard('replace')},
          { name: `Clear Meta`, type: 'menu', icon: 'close-circle-outline', color: 'error', menu: getMetaClipboard('clear')},
          { type: 'divider' },
          { name: `Filter PDFs by`, type: 'menu', icon: 'filter', disabled: !this.isSelectedSingleVideo, menu: getFilterMeta()},
          { name: `Parse Metadata`, type: 'item', icon: 'text-box-search', function: ()=>{this.parseMetadata()}},
          { name: `Update File Information`, type: 'item', icon: 'information-variant', function: ()=>{this.updateFileInfo()}},
          { type: 'divider' },
          { name: `Reveal in File Explorer`, type: 'item', icon: 'folder-open', function: ()=>{this.revealInFileExplorer()}, disabled: !this.isSelectedSingleVideo},
          { name: `Move File to...`, type: 'item', icon: 'file-move', function: ()=>{this.moveFile()}, disabled: this.$store.state.movingFiles},
          { type: 'divider' },
          { name: `Remove File`, type: 'item', icon: 'delete', color: 'error', function: ()=>{this.$store.state.Videos.dialogDeleteVideo=true},},
        ]
        this.$store.state.contextMenuContent = contextMenu
        this.$store.state.contextMenu = true
      }, 300) 
    },
    addToPlaylist(playlist) {
      let id = playlist.id
      let pdfs = _.cloneDeep(playlist.pdfs)
      this.$store.getters.getSelectedVideos.map(pdfId => {
        if (!pdfs.includes(pdfId)) pdfs.push(pdfId)
      })
      this.$store.getters.playlists.find({id}).assign({
        pdfs: pdfs,
        edit: Date.now(),
      }).write()
    },
    revealInFileExplorer() {
      let pdfId = this.$store.getters.getSelectedVideos[0]
      let pdfPath = this.$store.getters.pdfs.find({id:pdfId}).value().path
      shell.showItemInFolder(pdfPath)
    },
    async moveFile() {
      const move = (oldPath, newPath) => {
        return new Promise((resolve, reject) => {
          mv(oldPath, newPath, (err) => {
            if (err) reject(err)
            else resolve(null)
          })
        })
      }

      const result = await ipcRenderer.invoke('chooseDirectory', path.dirname(this.pdf.path))
      if (result.filePaths.length === 0) return
      let filePath = result.filePaths[0]
      let ids = this.$store.getters.getSelectedVideos
      if (ids.length===0) return
      let vids = this.$store.getters.pdfs
      let bpId = shortid.generate()
      let bp = { id: bpId, text: 'Moving files', icon: 'file-move', }
      this.$store.commit('addBackgroundProcess', bp)
      this.$store.state.movingFiles = true
      for (let i of ids) {
        let oldPath = vids.find({id:i}).value().path
        let fileName = path.basename(oldPath)
        let newPath = path.join(filePath, fileName)
        const moveError = await move(oldPath, newPath)
        if (moveError) {
          this.$store.commit('addLog', { type: 'error', text: `Failed to move file "${fileName}".` })
          throw moveError
        } else {
          vids.find({id:i}).assign({ path: newPath, edit: Date.now() }).write()
          this.$store.commit('addLog', { type: 'info', text: `File "${fileName}" successfully moved!` })
        }
      }
      this.$store.commit('removeBackgroundProcess', bpId)
      this.$store.state.movingFiles = false
    },

    filterVideosBy(metaId, metaCardId) {
      let filter = {
        by: metaId,
        cond: 'includes one of',
        val: [metaCardId],
        type: 'select',
        flag: null,
        lock: false,
      }
      this.$store.state.Settings.pdfFilters.push(filter)
      this.$store.dispatch('filterVideos')
    },
    changeRating(stars) {
      this.$store.state.Videos.selectedVideos.map(id => {
        this.$store.getters.pdfs.find({ id }).assign({ rating: stars, edit: Date.now() }).write()
      })
      this.$store.commit('updateVideos', this.$store.state.Videos.selectedVideos)
    },
    changeMetaRating(stars, metaId) {
      this.$store.getters.pdfs.find({ id:this.pdf.id }).assign({edit:Date.now(), [metaId]:stars}).write()
    },
    changeFavorite(value) {
      this.$store.state.Videos.selectedVideos.map(id => {
        this.$store.getters.pdfs.find({ id }).assign({favorite: value,edit: Date.now()}).write()
      })
      this.$store.commit('updateVideos', this.$store.state.Videos.selectedVideos)
    },
    parseMetadata() {
      function filterString(string) {
        return string.replace(/[&\/\\#,+()$~%.'":*?<>{} ]/g, "").toLowerCase()
      }

      const vm = this
      
      function parseFilePath(filePath) {
        const string = filterString(filePath)

        let parsed = {}
        for (let m of vm.metaForParsing) {
          parsed[m.id] = vm.$store.getters.metaCards.filter(mc => {
            if (mc.metaId!==m.id) return false
            let foundName = string.includes(filterString(mc.meta.name))
            let foundSynonyms = false
            if (mc.meta.synonyms && mc.meta.synonyms.length) {
              for (let synonym of mc.meta.synonyms) {
                if (string.includes(filterString(synonym))) foundSynonyms = true
              }
            }
            return foundName || foundSynonyms
          }).value().map(mc => mc.id)
          parsed[m.id] = [...new Set(parsed[m.id])] // remove duplicates
        }
        return parsed
      }

      let ids = this.$store.getters.getSelectedVideos

      this.$store.getters.pdfs.filter(i=>ids.includes(i.id)).each(pdf => {
        const meta = parseFilePath(pdf.path)
        for (let m in meta) pdf[m] = _.union(pdf[m], meta[m])
      }).write()
    },
    updateFileInfo() {
      function getVideoMetadata (pathToFile) {
        console.log("Getting video metadata");
        return new Promise((resolve, reject) => {

// TODO can delete all of this.
        const { PDFDocument } = require('pdf-lib');

          const myFile = fs.readFileSync(pathToFile);
          PDFDocument.load(myFile).then( (res)=>{
            const num = res.getPages().length;
            resolve(num);
          })
        })
      }
      let successfullyUpdatedIds = []
      this.$store.state.Videos.selectedVideos.map(async id => {
        let pdf = this.$store.getters.pdfs.find({ id }).value()
        if (!fs.existsSync(pdf.path)) {
          this.$store.commit('addLog', { type: 'error', text: `No such file "${pdf.path}"` })
          return
        } 
        try {
          console.log("About to get metadata canada");
          let metadata = await getVideoMetadata(pdf.path)
          console.log(metadata);
          let duration = metadata; // get number of pages of document

          let updatedMetadata = {
            duration: duration,
            size: 10, // metadata.format.size,
            resolution: "600x600",
            edit: Date.now(),
          }
          this.$store.getters.pdfs.find({ id }).assign(updatedMetadata).write()
          successfullyUpdatedIds.push(id)
        } catch (error) { console.log(error) }
      })
      if (successfullyUpdatedIds.length) this.$store.commit('updateVideos', successfullyUpdatedIds)
    },
    openMetaInNewTab(cardId) {
      let card = this.getCard(cardId)
      let tabId = cardId
      let tabName = card.meta.name
      let meta = this.getMeta(card.metaId)

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
  },
  watch: {
    updateCardIds(newValue) {
      if (newValue.length === 0) this.cardKey = this.pdf.id + Date.now()
      if (newValue.includes(this.pdf.id)) this.cardKey = this.pdf.id + Date.now()
    }
  }
}
</script>