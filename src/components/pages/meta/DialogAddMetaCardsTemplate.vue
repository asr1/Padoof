<template>
<div>
  <v-dialog v-model="dialog" persistent scrollable max-width="600">
    <v-card>
      <v-toolbar color="primary">
        <div class="headline">Adding meta cards </div>
        <v-spacer></v-spacer>
        <v-btn @click="close" :disabled="isProcessRunning" class="mr-4" outlined><v-icon left>mdi-cancel</v-icon>Cancel</v-btn>
        <v-btn @click="start" :disabled="isProcessRunning||!valid||(!settings.creators.value&&!settings.tags.value&&!settings.publishers.value)" outlined><v-icon left>mdi-plus</v-icon>Add</v-btn>
      </v-toolbar>
      <vuescroll>
        <v-card-text>
            <!-- TODO: May be possible to integrate with RPG geek API, but not seeing a way to scrape publishers. -->
          <v-form ref="form" v-model="valid" :disabled="isProcessRunning">

          <div class="d-flex align-center">
            <v-switch v-model="settings.tags.value" label="Add tags to:" class="mr-4"/>
            <v-autocomplete v-model="settings.tags.meta" :disabled="!settings.tags.value" :items="metaList"
              label="Meta with tags" placeholder="Please select the meta for which tags will be added" 
              :rules="settings.tags.value?[v=>!!v||'Meta is required']:[]" item-value="id" :filter="filterMeta">
              <template v-slot:selection="data">
                <v-icon left small>mdi-{{data.item.settings.icon}}</v-icon>
                <span>{{data.item.settings.name}}</span>
              </template>
              <template v-slot:item="data">
                <v-icon left>mdi-{{data.item.settings.icon}}</v-icon>
                <span>{{data.item.settings.name}}</span>
              </template>
            </v-autocomplete>
          </div>

          <div class="d-flex align-center">
            <v-switch v-model="settings.publishers.value" label="Add publishers to:" class="mr-4"/>
            <v-autocomplete v-model="settings.publishers.meta" :disabled="!settings.publishers.value" :items="metaList"
              label="Meta with publishers" placeholder="Please select the meta for which publishers will be added" 
              :rules="settings.publishers.value?[v=>!!v||'Meta is required']:[]" item-value="id" :filter="filterMeta">
              <template v-slot:selection="data">
                <v-icon left small>mdi-{{data.item.settings.icon}}</v-icon>
                <span>{{data.item.settings.name}}</span>
              </template>
              <template v-slot:item="data">
                <v-icon left>mdi-{{data.item.settings.icon}}</v-icon>
                <span>{{data.item.settings.name}}</span>
              </template>
            </v-autocomplete>
          </div>
          </v-form>
        </v-card-text>
      </vuescroll>
    </v-card>
  </v-dialog>
</div>
</template>


<script>
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
      let creators = this.$store.getters.meta.find(i=>i.settings.name==='Creators').cloneDeep().value()
      console.log("Creators");
      console.log(creators);
      if (creators) this.settings.creators.meta = creators.id 
      let tags = this.$store.getters.meta.find(i=>i.settings.name==='Tags').cloneDeep().value()
      console.log("Tags");
      console.log(tags);
      if (tags) this.settings.tags.meta = tags.id 
      let publishers = this.$store.getters.meta.find(i=>i.settings.name==='Publishers').cloneDeep().value()
      if (publishers) this.settings.publishers.meta = publishers.id 
    })
  },
  data: () => ({
    settings: {
      creators: {
        value: true,
        meta: null,
      },
      tags: {
        value: true,
        meta: null,
      },
      publishers: {
        value: true,
        meta: null,
      },
    },
    numberCreators: 288,
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
      console.log("Validating", this.valid);
      this.$refs.form.validate()
      console.log("Validating again", this.valid); 
      if (!this.valid) return
      this.isProcessRunning = true
      let pages = this.numberCreators/96
      if (this.settings.creators.value) {
        for (let i=1; i<=pages; i++) {
        }
        console.log("This is never reached");
        await this.createCreators()
      }
      console.log("T or F", this.settings.tags.value);
      if (this.settings.tags.value) await this.createTags()
      if (this.settings.publishers.value) await this.createPublishers()
      this.isProcessRunning = false
      this.$emit('finish') 
    },
    close() { this.$emit('close') },
    sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) },
    async createCreators() {
      // TODO since this.found isn't populated, this does nothing and can be removed.
      return new Promise(async resolve => {
        const metaId = this.settings.creators.meta
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
      console.log("Creating specific tags");
      return new Promise(async resolve => {
        const metaId = this.settings.tags.meta
        console.log("MetaId", metaId);
        console.log(Tags);
        const synonyms = this.getMeta(metaId).settings.synonyms
        for (const t of Tags) {
          console.log("One tag");
          console.log(t);
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
    async createPublishers() {
      return new Promise(async resolve => {
        const metaId = this.settings.publishers.meta
        const synonyms = this.getMeta(metaId).settings.synonyms
        for (const w of Publishers) {
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