<template>
<div>
  <v-dialog v-model="dialog" persistent scrollable max-width="600">
    <v-card>
      <v-toolbar color="primary">
        <div class="headline">Adding meta cards </div>
        <v-spacer></v-spacer>
        <v-btn @click="close" :disabled="isProcessRunning" class="mr-4" outlined><v-icon left>mdi-cancel</v-icon>Cancel</v-btn>
        <v-btn @click="start" :disabled="isProcessRunning||!valid||(!settings.performers.value&&!settings.tags.value&&!settings.websites.value)" outlined><v-icon left>mdi-plus</v-icon>Add</v-btn>
      </v-toolbar>
      <vuescroll>
        <v-card-text>
            <!-- TODO: May be possible to integrate with RPG geek API, but not seeing a way to scrape publishers. -->
        </v-card-text>
      </vuescroll>
    </v-card>
  </v-dialog>
</div>
</template>


<script>
const axios = require("axios")
const cheerio = require("cheerio")
const shortid = require('shortid')

import vuescroll from 'vuescroll'
import MetaGetters from '@/mixins/MetaGetters'
import Tags from '@/components/elements/TagsDefault'
import Publishers from '@/components/elements/PublishersDefault'

export default {
  name: 'DialogAddMetaCardsTemplate',
  props: {
    dialog: Boolean,
  },
  components: { vuescroll, },
  mixins: [MetaGetters], 
  mounted() {
    this.$nextTick(function () {
      let performers = this.$store.getters.meta.find(i=>i.settings.name==='Performers').cloneDeep().value()
      if (performers) this.settings.performers.meta = performers.id 
      let tags = this.$store.getters.meta.find(i=>i.settings.name==='Tags').cloneDeep().value()
      if (tags) this.settings.tags.meta = tags.id 
      let publishers = this.$store.getters.meta.find(i=>i.settings.name==='Publishers').cloneDeep().value()
      if (publishers) this.settings.publishers.meta = publishers.id 
    })
  },
  data: () => ({
    settings: {
      performers: {
        value: true,
        meta: null,
      },
      tags: {
        value: true,
        meta: null,
      },
      websites: {
        value: true,
        meta: null,
      },
    },
    numberPerformers: 288,
    isProcessRunning: false,
    months: ['january','february','march','april','may','june','july','august','september','october','november','december'],
    found: [],
    valid: false,
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData },
    metaList() { return this.$store.getters.meta.filter({type:'complex'}).value() },
  },
  methods: {
    async start() {
      this.$refs.form.validate()
      if (!this.valid) return
      this.isProcessRunning = true
      let pages = this.numberPerformers/96
      if (this.settings.performers.value) {
        for (let i=1; i<=pages; i++) {
          let query = 'https://www.freeones.com/babes?s=rank.currentRank&o=asc&l=96&v=grid&f%5Bprofessions%5D=porn_stars&p='+i
          await this.getPerformers(query)
        }
        await this.createPerformers()
      }
      if (this.settings.tags.value) await this.createTags()
      if (this.settings.websites.value) await this.createWebsites()
      this.isProcessRunning = false
      this.$emit('finish') 
    },
    close() { this.$emit('close') },
    sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) },
    async getPerformers(query) {
      return new Promise(resolve => {
        axios.get(query).then((response) => {
          if (response.status !== 200) return
          const html = response.data
          const $ = cheerio.load(html)
          $('.grid-item').each((i,e) => {
            let p = {}
            p.id = shortid.generate()
            p.name = $(e).find('[data-test="subject-name"]').text().trim()
            p.link = $(e).find('a').attr('href').replace('feed','bio')
            let avatar = $(e).find('.image-content').attr('src')
            if (avatar == undefined) avatar = $(e).find('.image-content').attr('data-src')
            if (avatar !== undefined) p.img = avatar
            this.found.push(p)
          })
          resolve()
        }, (error) => { console.log(error) })
      })
    },
    async createPerformers() {
      return new Promise(async resolve => {
        const metaId = this.settings.performers.meta
        for (const p of this.found) {
          let card = {
            id: p.id,
            metaId,
            views: 0,
            meta: {
              name: p.name,
            },
          }
          
          let isDublicate = this.$store.getters.metaCards.filter({metaId}).find(i=>i.meta.name.toLowerCase()===p.name.toLowerCase()).value()
          if (!isDublicate) this.$store.dispatch('addMetaCard', card)
          await this.sleep(1)
        }
        resolve()
      })
    },
    async createTags() {
      return new Promise(async resolve => {
        const metaId = this.settings.tags.meta
        const synonyms = this.getMeta(metaId).settings.synonyms
        for (const t of Tags) {
          let card = {
            id: shortid.generate(),
            metaId,
            views: 0,
            meta: {
              name: t.name,
            },
          }
          if (synonyms) card.meta.synonyms = t.synonyms || []
          
          let isDublicate = this.$store.getters.metaCards.filter({metaId}).find(i=>i.meta.name.toLowerCase()===t.name.toLowerCase()).value()
          if (!isDublicate) this.$store.dispatch('addMetaCard', card)
          await this.sleep(1)
        }
        resolve()
      })
    },
    async createWebsites() {
      return new Promise(async resolve => {
        const metaId = this.settings.websites.meta
        const synonyms = this.getMeta(metaId).settings.synonyms
        for (const w of Websites) {
          let card = {
            id: shortid.generate(),
            metaId,
            views: 0,
            meta: {
              name: w.name,
            },
          }
          if (synonyms) card.meta.synonyms = w.synonyms || []
          
          let isDublicate = this.$store.getters.metaCards.filter({metaId}).find(i=>i.meta.name.toLowerCase()===w.name.toLowerCase()).value()
          if (!isDublicate) this.$store.dispatch('addMetaCard', card)
          await this.sleep(1)
        }
        resolve()
      })
    },
    filterMeta(metaObj, queryText) { return metaObj.settings.name.toLowerCase().includes(queryText.toLowerCase()) },
  },
}
</script>