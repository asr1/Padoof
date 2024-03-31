<template>
  <v-dialog v-model="dialog" persistent max-width="600">
    <v-card>
      <v-toolbar color="primary">
        <div class="headline">Create meta</div>
        <v-spacer></v-spacer>
        <v-btn @click="closeDialog" outlined><v-icon left>mdi-close</v-icon>close</v-btn>
      </v-toolbar>
      <v-card-actions class="pb-4">
        <v-spacer></v-spacer>
        <v-btn @click="createAllMeta" color="primary" rounded class="pr-4">
          <v-icon left>mdi-auto-fix</v-icon>create Meta</v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>


<script>
const shortid = require('shortid')
const fs = require("fs-extra")
const path = require("path")
const { ipcRenderer } = require('electron')

export default {
  name: 'CreateAllMeta',
  props: {
    dialog: Boolean,
  },
  components: {
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData },
  },
  methods: {
    async createAllMeta() {
        let pId = shortid.generate()
        let tagsId = shortid.generate()
        const publishersId = shortid.generate();

        await this.createCreators(pId, tagsId)
        await this.createTags(tagsId)
        await this.createPublishers(publishersId);
     
        this.$store.getters.settings.get('metaAssignedToVideos')
          .push({ id: pId, type: 'complex' })
          .push({ id: tagsId, type: 'complex' })
          .push({ id: publishersId, type: 'complex' })
          .write()
        
        this.createMetaFolder(pId)
        this.createMetaFolder(tagsId)
        this.createMetaFolder(publishersId)
      this.$store.state.Settings.metaAssignedToVideos = this.$store.getters.settings.get('metaAssignedToVideos').value()

      ipcRenderer.invoke('getAppVersion').then((result) => {
        this.$store.dispatch('updateSettingsState', {
          key:'databaseVersion', 
          value:result
        })
      })
            
      ipcRenderer.send('updatePlayerDb', 'settings') // update settings in player window
      ipcRenderer.send('updatePlayerDb', 'meta') // update meta in player window
      ipcRenderer.send('updatePlayerDb', 'metaCards') // update meta in player window
      this.$emit('finish') 
    },
    parseItems(items) { return items.map(i=>{ if (i.length) return{ id:shortid.generate(), name:i } }) },
    async createCreators(creatorsId, tagsId) {
      return new Promise(resolve => {
        let newMetaArr = []

        newMetaArr.push(
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'date',
          scraperField: 'birthday',
          settings: { 
            name: 'Birthday', 
            hint: 'YYYY-MM-DD', 
            icon: 'cake-variant',
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'number',
          scraperField: 'career_start',
          settings: { 
            name: 'Career start', 
            hint: 'YYYY', 
            icon: 'calendar',
          },
        },
        {
          id: shortid.generate(),
          type: 'simple',
          dataType: 'number',
          scraperField: 'career_end',
          settings: { 
            name: 'Career end', 
            hint: 'YYYY', 
            icon: 'calendar',
          },
        },
      )

        resolve(newMetaArr)
      })
      .then(newMetaArr=>{
        //-parsing meta in card
        let metaInCardForCreators = [{ id: tagsId, type: 'complex' }]

        for (let i = 0; i < newMetaArr.length; i++) {
          const e = newMetaArr[i]
          let mc = {id: e.id, type: 'simple'}
          if (e.scraperField) {
            mc.scraperField = e.scraperField
            delete e.scraperField
          }
          metaInCardForCreators.push(mc)
          this.$store.dispatch('addSimpleMeta', e)
        }
        
        let complexMetaCreators = {
          id: creatorsId,
          type: 'complex',
          settings: { 
            name: 'Creators',
            nameSingular: 'Creator',
            hint: 'Authors and illustrators on the game',  
            icon: 'account-outline',
            hidden: false,
            parser: true,
            imageAspectRatio: 0.625,
            imageTypes: [ 'main', 'alt', 'custom1', 'custom2', 'avatar', 'header' ],
            chipLabel: false,
            chipOutlined: false,
            color: false,
            synonyms: true,
            rating: true,
            favorite: true,
            country: true,
            career: true,
            scraper: true,
            bookmark: true,
            nested: false,
            markers: true,
            metaInCard: _.cloneDeep(metaInCardForCreators),
          },
          state: {
            visibility: {
              name: true,
              cardSize: 3,
            },
          },
        }
        this.$store.dispatch('addComplexMeta', complexMetaCreators)
        return newMetaArr
      })
    },
    async createTags(tagsId) {
      console.log("Creating tags");
      return new Promise(async resolve => {
        //-complex meta
        let complexMetaTags = {
          id: tagsId,
          type: 'complex',
          settings: { 
            name: 'Tags',
            nameSingular: 'Tag',
            hint: 'For a quick search',
            icon: 'tag-outline',
            hidden: false,
            parser: true,
            imageAspectRatio: 1,
            imageTypes: ['main'],
            chipLabel: false,
            chipOutlined: true,
            color: true,
            synonyms: true,
            rating: false,
            favorite: true,
            country: false,
            scraper: false,
            bookmark: true,
            nested: false,
            markers: true,
            metaInCard: [],
          },
          state: {
            visibility: {
              name: true,
              cardSize: 3,
            },
          },
        }
        this.$store.dispatch('addComplexMeta', complexMetaTags)
        resolve()
      })
    },
    async createPublishers(publishersId) {
      return new Promise(async resolve => {
        let simpleMetaUrlId = shortid.generate() 

        //-complex meta
        let complexMetaPublishers = {
          id: publishersId,
          type: 'complex',
          settings: { 
            name: 'Publishers',
            nameSingular: 'Publisher',
            hint: 'Studios',
            icon: 'web',
            hidden: false,
            parser: true,
            imageAspectRatio: 1,
            imageTypes: ['main'],
            chipLabel: true,
            chipOutlined: true,
            color: true,
            synonyms: true,
            rating: false,
            favorite: true,
            country: false,
            scraper: false,
            bookmark: true,
            nested: true,
            markers: false,
            metaInCard: [
              {
                id: simpleMetaUrlId,
                type: 'simple'
              },
            ],
          },
          state: {
            visibility: {
              name: true,
              cardSize: 3,
            },
          },
        }
        this.$store.dispatch('addComplexMeta', complexMetaPublishers)

        //-simple meta
        let simpleMetaUrl = {
          id: simpleMetaUrlId,
          type: 'simple',
          dataType: 'string',
          settings: {
            name: 'URL',
            hint: 'Address in the internet',
            icon: 'link',
          },
        }
        this.$store.dispatch('addSimpleMeta', simpleMetaUrl)

        resolve()
      })
    },
    createMetaFolder(metaId) {
      const pathMeta = path.join(this.pathToUserData, `/media/meta`)
      const newPathMeta = path.join(this.pathToUserData, `/media/meta/${metaId}`)
      if (!fs.existsSync(pathMeta)) fs.mkdirSync(pathMeta)
      if (!fs.existsSync(newPathMeta)) fs.mkdirSync(newPathMeta)
    },
    closeDialog() { this.$emit('close') },
  },
}
</script>