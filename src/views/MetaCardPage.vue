<template>
  <vuescroll ref="mainContainer" @handle-scroll="handleScroll">
    <div @dragover="showDrop">
      <v-responsive :aspect-ratio="2.3" :key="metaCardKey" class="header-images" :class="[{'above':checkImageSettings('header')&&checkImageExists('header')&&showHeaderImageAboveProfile}]">
        <div v-if="!checkImageExists('alt')" class="thumbs">
          <v-img v-for="(imgUrl, i) in pdfThumbImgUrls" :key="i" 
            :src="imgUrl" :aspect-ratio="16/9" width="20%" />
        </div>
        <img v-else-if="checkImageSettings('header')&&checkImageExists('header')" :src="getImgUrl('header')" class="header-image">
        <div v-else class="images">
          <v-img :src="getImgUrl('main')" :gradient="gradientImage" :aspect-ratio="5/9"/>
          <v-responsive :aspect-ratio="5/9" />
          <v-responsive :aspect-ratio="5/9" />
          <v-img v-if="checkImageSettings('alt')" :src="getImgUrl('alt')" :gradient="gradientImage" :aspect-ratio="9/5"/>
        </div>
        <div class="header-gradient" :style="gradient"></div>
      </v-responsive>
      
      <div class="py-16 profile-prepend" :class="[{'above':checkImageSettings('header')&&checkImageExists('header')&&showHeaderImageAboveProfile}]"/>
      <v-container class="profile-container">
        <v-avatar max-width="160" width="160" height="160" class="profile-avatar"> 
          <img :src="getImgUrl('avatar')">
        </v-avatar>
        
        <v-tooltip right>
          <template v-slot:activator="{ on, attrs }">
            <v-progress-circular v-bind="attrs" v-on="on" :value="cardInfoComplete" 
              size="168" rotate="270" width="2" class="profile-complete-progress" 
              :color="meta.settings.color?card.meta.color?card.meta.color:'primary':'primary'"/> 
          </template>
          <span>Information about the {{meta.settings.nameSingular.toLowerCase()}} is {{cardInfoComplete}}% complete</span>
        </v-tooltip>
        <div class="buttons-left">
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <v-btn @click="copyCardNameToClipboard" icon v-on="on"> 
                <v-icon>mdi-content-copy</v-icon></v-btn>
            </template>
            <span>Copy {{meta.settings.nameSingular}} name to clipboard</span>
          </v-tooltip>
        </div>
        <div class="buttons-right">
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <v-btn @click="$store.state.Meta.dialogEditMetaCard=true" icon v-on="on"> 
                <v-icon>mdi-pencil</v-icon></v-btn>
            </template>
            <span>Edit {{meta.settings.nameSingular}}</span>
          </v-tooltip>
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <v-btn @click="$store.state.Meta.dialogEditMetaCardImages=true" icon v-on="on"> 
                <v-icon>mdi-image-edit-outline</v-icon></v-btn>
            </template>
            <span>Edit Images</span>
          </v-tooltip>
        </div>
        <v-expansion-panels v-model="profile" multiple focusable>
          <v-expansion-panel :style="profileBackground" :key="0">
            <v-expansion-panel-header class="pa-6" ripple hide-actions>
              <div class="text-center meta-card-name avatar">{{card.meta.name}}</div>
            </v-expansion-panel-header>
            <v-expansion-panel-content eager>
              <v-container class="px-0">
                <v-row>
                  <v-col cols="12" class="d-flex justify-space-between pb-0">
                    <v-chip label outlined>
                      <v-icon left size="20">mdi-calendar-plus</v-icon> Added: {{dateAdded}}
                    </v-chip>
                    <v-chip label outlined class="mx-4">
                      <v-icon left size="20">mdi-eye</v-icon> Views: {{card.views || 0}}
                    </v-chip>
                    <v-chip label outlined>
                      <v-icon left size="20">mdi-calendar-edit</v-icon> Last edit: {{dateEdit}}
                    </v-chip>
                  </v-col>
                  <v-col v-if="meta.settings.rating||meta.settings.favorite" cols="12" md="4" sm="6">
                    <div v-if="meta.settings.rating" class="param"><b class="mr-2">Rating</b>
                      <v-rating :value="rating" @input="changeRating" dense hover clearable
                        color="yellow darken-3" background-color="grey darken-1"
                        empty-icon="mdi-star-outline" half-icon="mdi-star-half-full"
                        half-increments size="20" style="display: inline;"/>
                    </div>
                    <div v-if="meta.settings.favorite" class="param ml-6"><b class="mr-2">Favorite</b>
                      <v-btn @click="toggleFavorite" icon>
                        <v-icon v-if="favorite" size="20" color="pink">mdi-heart</v-icon>
                        <v-icon v-else size="20" color="grey">mdi-heart-outline </v-icon>
                      </v-btn>
                    </div><br>
                  </v-col>
                  <v-col v-if="meta.settings.synonyms" cols="12" md="4" sm="6">
                    <div class="param">
                      <b class="mr-2">Synonyms:</b> 
                      <span v-if="card.meta.synonyms">{{card.meta.synonyms.join(', ') || '-'}}</span>
                    </div>
                  </v-col>
                  <v-col v-if="meta.settings.country" cols="12" md="4" sm="6">
                    <div class="param d-flex">
                      <b class="mr-2">Country:</b> 
                      <div v-if="card.meta.country" class="d-flex flex-wrap">
                        <div v-for="country in card.meta.country" :key="country" class="country mr-2">
                          <country-flag :country='getCountryCode(country)'/>
                          <span class="name ml-2">{{getCountry(country)}}</span>
                        </div>
                      </div>
                      <div v-else>-</div>
                    </div>
                  </v-col>
                  <v-col v-if="meta.settings.career" cols="12" md="4" sm="6">
                    <b class="mr-4"> Career status </b>
                    <v-chip :color="getCareer('color')" class="overline" label light>{{getCareer('status')}}</v-chip>
                    <span class="ml-4">{{getCareer('ended')}}</span>
                  </v-col>
                  <v-col v-if="meta.settings.career" cols="12" md="4" sm="6">
                    <div class="career">
                      <div class="text">
                        <div class="bold-text"> 
                          <span v-if="getCareer('total')>0">{{getCareer('total')}}</span>
                          <span v-else>???</span>
                          year<span v-if="getCareer('total')>1">s</span>
                        </div> 
                        <br><div class="light-text">in the business</div>
                      </div>
                      <div class="start value">{{getCareer('start')}}</div>
                      <div class="end value">{{getCareer('end')}}</div>
                      <div class="line"></div>
                    </div>
                  </v-col>
                  <!-- Parse meta from cards -->
                  <v-col v-for="(m,i) in metaForProfile" :key="i" cols="12" md="4" sm="6" class="d-flex align-start">
                    <v-icon left>mdi-{{getMeta(m.id).settings.icon}}</v-icon>
                    <b class="mr-2">{{getMeta(m.id).settings.name}}:</b>
                    <v-chip-group v-if="m.type=='complex'" column class="chips-remove-padding">
                      <v-chip v-for="c in card.meta[m.id]" :key="c" 
                        :color="getColor(m.id,c)" small class="px-2"
                        :label="getMeta(m.id).settings.chipLabel"
                        :outlined="getMeta(m.id).settings.chipOutlined"
                        @mouseover.stop="showImage($event,c,'meta',m.id)" 
                        @mouseleave.stop="$store.state.hoveredImage=false"> 
                          {{ getCard(c).meta.name }} </v-chip>
                    </v-chip-group>
                    <div v-else-if="m.type=='simple'" class="simple-meta">
                      <span v-if="getMeta(m.id).dataType=='array'">{{getArrayValuesForCard(m.id)}}</span>
                      <span v-else-if="getMeta(m.id).dataType=='boolean'">{{JSON.stringify(card.meta[m.id])}}</span>
                      <span v-else-if="getMeta(m.id).dataType=='rating'">      
                        <v-rating :value="card.meta[m.id]" @input="changeMetaRating($event, m.id)" :length="getMeta(m.id).settings.ratingMax" hover 
                          :full-icon="`mdi-${getMeta(m.id).settings.ratingIcon}`" :empty-icon="`mdi-${getMeta(m.id).settings.ratingIconEmpty||getMeta(m.id).settings.ratingIcon}`" 
                          :color="getMeta(m.id).settings.ratingColor" background-color="grey" class="meta-rating" clearable 
                          :half-increments="getMeta(m.id).settings.ratingHalf" :half-icon="`mdi-${getMeta(m.id).settings.ratingIconHalf||getMeta(m.id).settings.ratingIcon}`"/>
                      </span>
                      <span v-else-if="getMeta(m.id).dataType=='string'&&getMeta(m.id).settings.isLink" @click="openLink(card.meta[m.id])" class="link" title="Open link in browser">{{card.meta[m.id]}}</span>
                      <span v-else-if="m.scraperField=='birthday'">{{card.meta[m.id]}}{{getAge(card.meta[m.id])}}</span>
                      <span v-else>{{card.meta[m.id]}}</span>
                    </div>
                  </v-col>
                  <v-col cols="12">
                    <div v-if="meta.settings.bookmark" class="param bookmark-text">
                      <v-icon left>mdi-bookmark</v-icon>
                      <b class="mr-2">Bookmark:</b> 
                      <span>{{card.meta.bookmark || '-'}}</span>
                    </div>
                  </v-col>
                  <v-col v-if="quickFilters" class="text-center">
                    <v-tooltip left>
                        <template v-slot:activator="{ on, attrs }">
                        <v-icon v-bind="attrs" v-on="on" left small>mdi-help-circle-outline</v-icon>
                      </template>
                      <span>Click on chip for filter PDFs</span>
                    </v-tooltip>
                    <span>Quick filters for PDFs</span>
                  </v-col>
                  <v-col v-for="(qf,i) in quickFilters" :key="qf.id+i" cols="12" class="text-center py-0">
                    <v-chip-group :value="qf.value" @change="setCardFilter($event, qf.id)" active-class="active-chip" multiple column>
                      <span class="mr-2">
                        <v-icon left>mdi-{{getMeta(qf.id).settings.icon}}</v-icon>
                        <b>{{getMeta(qf.id).settings.name}}:</b>
                      </span>
                      <v-chip v-for="(c) in qf.chips" :key="c" 
                        class="mr-2 mb-1 px-2" small filter
                        :color="getColor(qf.id,c)" 
                        :label="getMeta(qf.id).settings.chipLabel"
                        :outlined="getMeta(qf.id).settings.chipOutlined"
                        :disabled="card.id===c"
                        @mouseover.stop="showImage($event,c,'meta',qf.id)" 
                        @mouseleave.stop="$store.state.hoveredImage=false">
                        {{getCard(c).meta.name}}</v-chip>
                    </v-chip-group>
                  </v-col>
                </v-row>
              </v-container>
            </v-expansion-panel-content>
            <div class="profile-hover-btn show"><v-icon>mdi-chevron-down</v-icon></div>
            <div class="profile-hover-btn hide"><v-icon>mdi-chevron-up</v-icon></div>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-container>
      
      <div v-if="isMetaAssignedToVideo">
        <v-container v-if="filters.length>0" fluid class="d-flex justify-center align-start mt-10">
          <FiltersChips :filters="filters" type="Video" @removeAllFilters="removeAllFilters"/>
        </v-container>

        <v-container v-if="filteredVideosNumber" fluid class="pagination-container">
          <v-overflow-btn v-model="pdfsPerPage" hint="items per page" persistent-hint
            :items="pdfsPerPagePreset" dense height="36" solo disable-lookup hide-no-data
            class="items-per-page-dropdown"
          ></v-overflow-btn>
          <v-spacer></v-spacer>
          <v-pagination v-model="pdfsCurrentPage" :length="pdfsPagesSum"
            :total-visible="getNumberOfPagesLimit" style="z-index:1"/>
          <v-spacer></v-spacer>
          <v-text-field
            v-model="jumpPage" solo dense type="number"
            class="jump-to-page" hint="jump to page" persistent-hint
            prepend-icon="mdi-redo" @click:prepend="jumpToPage($event)"
          />
        </v-container>
      
        <div v-if="numberVideosMetaCard==0" class="text-center">
          <div><v-icon size="100" class="ma-10">mdi-pdf</v-icon></div>
          It's so empty... add this {{meta.settings.nameSingular.toLowerCase()}} to your pdfs so they appear here,
          also you can drag a folder or pdf files here to add them to the database
        </div>

        <div v-if="filteredVideosNumber==0&&numberVideosMetaCard>0" class="text-center pt-10">
          <div><v-icon size="100" class="ma-10">mdi-close</v-icon></div>
          There are no matching pdfs for the selected filters
        </div>

        <Loading />
        <v-container fluid class="wide-image pdfs-selection" :class="[cardSize, gapSize, {'card-grid':view==0}, {'line-grid':view==1}]">
          <VideoCard v-for="(pdf, i) in pdfsOnPage" :key="pdf.id" :pdf="pdf" :i="i" :reg="reg"/>
        </v-container>

        <v-pagination v-if="filteredVideosNumber" v-model="pdfsCurrentPage" :length="pdfsPagesSum" :total-visible="getNumberOfPagesLimit" class="pt-4 pb-10"/>
      </div>
      
      <div v-show="$store.state.Settings.navigationSide=='2'" class="py-6"></div>

      <v-btn @click="scrollToTop" v-show="isScrollToTopVisible" 
        class="scroll-to-top" fixed fab color="primary">
        <v-icon>mdi-chevron-up</v-icon>
      </v-btn>
    </div>

    <v-card v-show="dropzone" @dragleave="dropzone=false" class="dropzone" @drop="catchDrop($event)" @dragenter.prevent @dragover.prevent>
      <div class="text">Drop pdf or folder to add them</div>
    </v-card>
  </vuescroll>
</template>


<script>
const { clipboard } = require('electron')
const fs = require("fs")
const path = require("path")
const shell = require('electron').shell

import CountryFlag from 'vue-country-flag'
import VideosGrid from '@/mixins/VideosGrid'
import Countries from '@/components/elements/Countries'
import vuescroll from 'vuescroll'
import ShowImageFunction from '@/mixins/ShowImageFunction'
import LabelFunctions from '@/mixins/LabelFunctions'
import Keys from '@/mixins/Keys'
import MetaGetters from '@/mixins/MetaGetters'

export default {
  name: 'MetaCardPage',
  mixins: [VideosGrid, ShowImageFunction, LabelFunctions, Keys, MetaGetters],
  components: {
    vuescroll,
    CountryFlag,
    Loading: () => import('@/components/elements/Loading.vue'),
    FiltersChips: () => import('@/components/elements/FiltersChips.vue'),
  },
  mounted() {
    this.$nextTick(function () {
      if (this.$store.state.Settings.countNumberOfViews) this.updateViews()
      this.initFilters()
      this.rating = this.card.meta.rating || 0
      this.favorite = this.card.meta.favorite || false
    })
  },
  beforeDestroy() {
    this.$store.state.Settings.pdfFilters = []
    this.$store.state.clipboardMeta = {}
  },
  data: () => ({
    metaCardKey: 1,
    profile: [],
    rating: 0,
    favorite: false,
    currentYear: new Date().getFullYear(),
    months: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ],
    isScrollToTopVisible: false,
    // header: '',
    pdfs: [],
    quickFilters: [],
  }),
  computed: {
    updateMetaCardIds() { return this.$store.state.Meta.updateCardIds },
    metaCardId() { return this.$route.query.cardId },
    card() { return this.$store.getters.metaCards.find({id: this.metaCardId}).value() },
    dateAdded() {
      let date = new Date(this.card.date)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    dateEdit() {
      let date = new Date(this.card.edit)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    gradient() {
      let color = this.$vuetify.theme.isDark ? '#121212' : '#fff'
      return `background: linear-gradient(to top, ${color}, rgba(0,0,0,.0) 30%)`
    },
    gradientImage() {
      let color = this.$vuetify.theme.isDark ? '#121212' : '#fff'
      return `90deg, ${color}, rgba(0,0,0,.0), ${color}`
    },
    profileBackground() {
      let color = this.$vuetify.theme.isDark ? '30,30,30':'255,255,255'
      return `background-color: rgba(${color},.3)`
    },
    cardInfoComplete() {
      let completed = []
      for (let m of _.cloneDeep(this.metaInCard)) {
        const val = this.card.meta[m.id]
        if (val===undefined) completed.push(0)
        else if (typeof val == 'boolean') completed.push(1)
        else if (typeof val == 'number') val > 0 ? completed.push(1) : completed.push(0)
        else val.length > 0 ? completed.push(1) : completed.push(0)
      }
      let completedValue = 0
      for (let i of completed) completedValue = completedValue + i
      return Math.ceil(completedValue / completed.length * 100)
    },
    pdfsOnPage() { return this.$store.getters.pdfsOnPage },
    numberVideosMetaCard() { 
      return this.$store.getters.pdfs.filter(v=>{
        let m = v[this.metaId]
        if (m) return m.includes(this.card.id)
        else return false
      }).value().length 
    },

    filteredVideosNumber() { return this.$store.state.Videos.filteredVideos.length },
    cardSize() { return `card-size-${this.$store.state.Settings.pdfCardSize}` },
    pathToUserData() { return this.$store.getters.getPathToUserData },
    tabId() { return this.$route.query.tabId },
    tab() {
      if (this.tabId === 'default') return undefined
      else return this.$store.getters.tabsDb.find({id:this.tabId}).value()   
    },
    view() { return this.$store.state.Settings.pdfView || 0 },
    gapSize() { return `gap-size-${this.$store.state.Settings.gapSize}` },
    filters() { return this.$store.state.Settings.pdfFilters },
    isMetaAssignedToVideo() { return _.find(this.$store.state.Settings.metaAssignedToVideos, {id: this.meta.id}) !== undefined },
    complexMetaAssignedToVideos() { return _.filter(this.$store.state.Settings.metaAssignedToVideos, {type:'complex'}) },
    metaForProfile() { 
      let careerOption = this.meta.settings.career || false
      function checkMetaForCareer(meta) {
        if (!careerOption) return true
        if (meta.scraperField=='career_end' || meta.scraperField=='career_start') return false
        else return true
      }
      return this.metaInCard.filter(i=>checkMetaForCareer(i))
    },
    pdfThumbImgUrls() {
      let pdfs = this.$store.getters.pdfs.filter(pdf=>pdf[this.meta.id]===undefined?false:pdf[this.meta.id].includes(this.card.id))
      let imgUrls = pdfs.orderBy('rating',['desc']).take(40).value().map(v=>{
        let imgPath = path.join(this.pathToUserData, `/media/thumbs/${v.id}.jpg`)
        if (fs.existsSync(imgPath)) return 'file://' + imgPath
        else return ''
      })
      return imgUrls
    },
    showHeaderImageAboveProfile() {return this.$store.state.Settings.showHeaderImageAboveProfile},
  },
  methods: {
    updateViews() {
      let views = this.card.views || 0
      ++views
      this.$store.getters.metaCards.find({id:this.card.id}).assign({views}).write()
    },
    getCareer(dataType) {
      let data = 'grey'
      let startMeta = _.find(this.meta.settings.metaInCard, i=>i.scraperField==='career_start')
      let endMeta = _.find(this.meta.settings.metaInCard, i=>i.scraperField==='career_end')
      if (!startMeta || !endMeta) return 'red'
      let start = this.card.meta[startMeta.id]
      let end = this.card.meta[endMeta.id]
      start = Number(start || 0)
      end = Number(end || 0)
      switch (dataType) {
        case 'color':
          if (start != 0 && end == 0) data = 'green'
          else if (start != 0 && end != 0) data = 'orange'
          else if (start == 0 && end == 0) data = 'grey'
          break
        case 'start': data = start == 0 ? '???' : start; break
        case 'end': data = end == 0 ? start == 0 ? '???' : 'Now' : end; break
        case 'total':
          if (start!=0 && end!=0) data = end - start
          else if (start == this.currentYear) data = 1
          else if (start!=0 && end==0) data = this.currentYear - start
          else data = 0
          break 
        case 'status':
          if (start != 0 && end == 0) data = 'Active'
          else if (start != 0 && end != 0) data = 'Retired'
          else if (start == 0 && end == 0) data = 'Unknown'
          break
        case 'ended':
          let birthday = _.find(this.meta.settings.metaInCard, i=>i.scraperField==='birthday')
          if (end!=0 && birthday && this.card.meta[birthday.id].length) {
            birthday = this.card.meta[birthday.id].match(/\d{4}/)[0]
            data = `at ${Number(end) - Number(birthday)} y.o.`
          } else data = ''
      }
      return data
    },
    getAge(date) {
      let birthday = date || ''
      let ageString = ''
      let ageNow = 0
      if (birthday.length) {
        ageNow = birthday.match(/\d{4}/)[0]
        ageNow = this.currentYear - Number(ageNow)
        ageString = `, ${ageNow} y.o.`
      }
      return ageString
    },
    removeAllFilters() {
      this.$store.state.Meta.filters = []
      this.$store.dispatch('filterMetaCards') 
    },
    toggleProfile() {
      let value
      if (this.profile.length) value = true
      else value = false
    },
    copyCardNameToClipboard() { clipboard.writeText(this.card.meta.name) },
    scrollToTop() { this.$refs.mainContainer.scrollTo({y: 0},500,"easeInQuad") },
    handleScroll(vertical) {
      if (vertical.scrollTop > 500) this.isScrollToTopVisible = true
      else this.isScrollToTopVisible = false
      // this.header = `top:${vertical.scrollTop * 0.7}px` // parallax effect
    },
    initFilters() { 
      let defaultFilters = [{
        by: this.meta.id,
        cond: 'includes one of',
        val: [this.metaCardId],
        type: 'select',
        flag: null,
        lock: true,
      }]
      let pdfFilters = this.initVideoFilters()
      defaultFilters = [...defaultFilters, ...pdfFilters]
      if (this.tabId === 'default' || typeof this.tab === 'undefined') {
        this.$store.state.Settings.pdfFilters = _.cloneDeep(defaultFilters)
        this.$store.state.Settings.pdfSortBy = 'name'
        this.$store.state.Settings.pdfSortDirection = 'asc'
        this.$store.state.Settings.pdfPage = 1
      } else {
        this.$store.state.Settings.pdfFilters = _.cloneDeep(this.tab.filters) || _.cloneDeep(defaultFilters)
        this.$store.state.Settings.pdfSortBy = this.tab.sortBy || 'name'
        this.$store.state.Settings.pdfSortDirection = this.tab.sortDirection || 'asc'
        this.$store.state.Settings.pdfPage = this.tab.page || 1
      }

      this.$store.dispatch('filterVideos', true)
    },
    initVideoFilters() { 
      this.pdfs = this.$store.getters.pdfs.filter(i=>{
        if (i[this.metaId]) return i[this.metaId].includes(this.metaCardId)
        else return false
      }).cloneDeep().value()
      let pdfFilters = []
      for (let meta of this.complexMetaAssignedToVideos) {
        this.quickFilters.push({
          id: meta.id,
          chips: this.getCardsInVideos(meta.id),
          value: [],
        })
        pdfFilters.push({
          by: meta.id,
          cond: 'includes one of',
          val: [],
          type: 'select',
          flag: 'card',
          lock: true,
        })
      }
      return pdfFilters
    },
    getImgUrl(imgType) {
      let imgUrl = path.join(__static, '/img/default.png')
      if (this.checkImageExists(imgType)) imgUrl = this.getImagePath(imgType) 
      else if (imgType == 'avatar') if (this.checkImageExists('main')) imgUrl = this.getImagePath('main') 
      return 'file://' + imgUrl
    },
    getImagePath(imgType) { 
      return path.join(this.pathToUserData, '/media/meta/', `${this.metaId}/${this.card.id}_${imgType}.jpg`)
    },
    checkImageExists(imgType) { return fs.existsSync( this.getImagePath(imgType) ) },
    checkImageSettings(imgType) { return this.meta.settings.imageTypes.includes(imgType) },
    getCountryCode(country) {
      let index = Countries.findIndex(i => i.name === country)
      return Countries[index].code
    },
    getCountry(country) {
      let index = Countries.findIndex(i => i.name === country)
      return Countries[index].name
    },
    getCardsInVideos(metaId) {
      let metaIds = []
      for (let pdf of this.pdfs) if (pdf[metaId]) {
        metaIds = [...metaIds, ...pdf[metaId]]
      }
      metaIds = [...new Set(metaIds)]
      metaIds = metaIds.sort((a,b)=>{
        a = this.getCard(a).meta.name
        b = this.getCard(b).meta.name
        return a.localeCompare(b)
      })
      return metaIds
    },
    setCardFilter(e, metaId) {
      let index = _.findIndex(this.$store.state.Settings.pdfFilters, i=>i.by==metaId&&i.flag=='card')
      let metaArr = _.find(this.quickFilters, {id:metaId}).chips
      if (index > -1) this.$store.state.Settings.pdfFilters[index].val = e.map(i=>metaArr[i])
      this.$store.dispatch('filterVideos', true)
    },
    changeRating(stars) {
      this.$store.getters.metaCards.find({id:this.card.id})
        .assign({edit: Date.now()}).get('meta').assign({rating:stars}).write()
    },
    changeMetaRating(stars, metaId) {
      this.$store.getters.metaCards.find({id:this.card.id})
        .assign({edit: Date.now()}).get('meta').assign({[metaId]:stars}).write()
    },
    toggleFavorite() {
      this.favorite = !this.favorite
      this.$store.getters.metaCards.find({id:this.card.id})
        .assign({edit: Date.now()}).get('meta').assign({favorite:this.favorite}).write()
    },
    openLink(url) { shell.openExternal(url) }
  },
  watch: {
    profile() {
      this.toggleProfile()
    },
    updateMetaCardIds(newValue) {
      if (newValue.includes(this.card.id)) {
        this.metaCardKey = this.card.id + Date.now() 
        this.rating = this.card.meta.rating || 0
        this.favorite = this.card.meta.favorite || false
      } 
    },
    $route() {
      if (!this.$route.path.includes('/metacard')) return
      this.initFilters()
    },
  }
}
</script>


<style lang="less">
.header-images {
  position: absolute;
  width: 100%;
  &.above {
    position: relative;
  }
  .images {
    display: flex;
    justify-content: space-between;
    position: absolute;
    width: 100%;
    overflow: hidden;
  }
  .thumbs {
    display: flex;
    flex-wrap: wrap;
    position: absolute;
    opacity: 0.2;
    top: 0;
    left: 0;
    width: 100%;
    pointer-events: none;
  }
}
.header-image {
  position: absolute;
  width: 100%;
  opacity: 0.7;
  &-wrapper {
    .v-image__image {
      z-index: 1;
    }
  }
}
.header-gradient {
  position: absolute;
  width: 100%;
  height: 100%;
}
.profile-prepend {
  &.above {
    display: none;
  }
}
.profile-container {
  position: relative;
  .buttons-left,
  .buttons-right {
    position: absolute;
    top: 25px;
    z-index: 2;
  }
  .buttons-left {
    left: 25px;
  }
  .buttons-right {
    right: 25px;
  }
  .profile-avatar {
    position: absolute;
    top: -70px;
    left: 0;
    right: 0;
    margin: auto;
    z-index: 3;
    img {
      height: auto;
      border-radius: 0;
      position: absolute;
      top: 0;
    }
  }
  .meta-card-name {
    font-size: 2rem;
    letter-spacing: 0.1666666667em !important;
    line-height: 2rem;
    text-transform: uppercase;
    &.avatar {
      padding-top: 80px;
    }
  }
  .profile-complete-progress {
    top: -74px;
    left: 0;
    right: 0;
    margin: auto;
    z-index: 3;
    position: absolute;
  }
  .bookmark-text {
    word-break: break-all;
  }
  .v-expansion-panel-header {
    overflow: hidden;
    &--active {
      & + .v-expansion-panel-content {
        & + .profile-hover-btn {
          &.show {
            display: none;
          }
          & + .profile-hover-btn {
            &.hide {
              display: flex !important;
            }
          }
        }
      }
    }
    &:hover {
      & + .v-expansion-panel-content {
        & + .profile-hover-btn {
          opacity: 1;
          transform: translateY(0);
          & + .profile-hover-btn {
            opacity: 1;
            transform: translateY(0);
            &.hide {
              display: none;
            }
          }
        }
      }
    }
  }
  .profile-hover-btn {
    text-transform: uppercase;
    font-size: 14px;
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 150px;
    height: 40px;
    bottom: -40px;
    left: 0;
    right: 0;
    margin: auto;
    border-radius: 0 0 5px 5px;
    border-right: 1px solid #5c5c5c;
    border-left: 1px solid #5c5c5c;
    border-bottom: 1px solid #5c5c5c;
    background-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-10px);
    transition: .2s all ease;
    opacity: 0;
    z-index: -5;
  }
  .tags-from-pdfs {
    .v-slide-group__content {
      justify-content: center;
      .active-chip {
        background: #777 !important;
        color: #fff;
      }
    }
  }
  .chips-remove-padding .v-slide-group__content {
    padding: 0;
  }
}
.country {
  display: flex;
  align-items: center;
  .name {
    font-weight: 300;
    letter-spacing: 0.3px;
  }
}
.career {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: space-between;
  height: 60px;
  .line {
    border-top: 2px solid var(--v-secondary-base);
    position: absolute;
    padding-bottom: 4px;
    bottom: 0;
    width: 100%;
    &:after,
    &:before {
      content: '';
      position: absolute;
      border: 2px solid var(--v-secondary-base);
      border-radius: 50%;
      width: 10px;
      height: 10px;
      bottom: 0;
      background-color: #fff;
    }
    &:after {
      right: 0;
    }
    &:before {
      left: 0;
    }
  }
  .start {
    left: 0;
  }
  .end {
    right: 0;
  }
  .text {
    position: absolute;
    left: 0;
    right: 0;
    margin: auto;
    width: 100%;
    text-align: center;
  }
  .bold-text {
    font-weight: bold;
    display: inline-block;
  }
  .light-text {
    font-weight: 300;
    font-size: 14px;
  }
  .value {
    position: absolute;
    bottom: 20px;
    font-size: 18px;
  }
}
.param {
  font-weight: 300;
  display: inline-block;
  margin-right: 15px;
  b {
    font-weight: bold;
  }
  i {
    font-style: normal;
    font-size: 12px;
  }
}
</style>