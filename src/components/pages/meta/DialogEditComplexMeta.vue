<template>
  <div>
    <v-dialog v-if="dialogEditMeta" :value="dialogEditMeta" @input="closeSettings" scrollable width="80vw" max-width="700">
      <v-card>
        <v-toolbar color="primary">
          <v-card-title class="headline pl-0">Settings for meta <b class="ml-2">{{meta.settings.name}}</b></v-card-title>
          <v-spacer></v-spacer>
          <v-btn @click="saveSettings" outlined> <v-icon left>mdi-content-save</v-icon> Save </v-btn>
        </v-toolbar>
        <vuescroll>
          <v-card-text class="px-4">
            <div class="d-flex justify-space-between pb-4">
              <v-chip label small outlined class="mr-4">
                <v-icon left small>mdi-calendar-plus</v-icon> Added: {{dateAdded}}
              </v-chip>
              <span>ID: {{meta.id}}</span>
              <v-chip label small outlined>
                <v-icon left small>mdi-calendar-edit</v-icon> Last edit: {{dateEdit}}
              </v-chip>
            </div>
            <v-form v-model="valid" ref="form" class="flex-grow-1" @submit.prevent>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="settings.name" :rules="[nameRules]" label="Name of meta"/>
                  <v-text-field v-model="settings.nameSingular" :rules="[nameRules]" label="Name singular"/>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="settings.hint" label="Hint of meta" hint="This text under the field is the hint"/>
                  <div class="text--secondary caption">Icon of meta</div>
                  <div class="d-flex">
                    <v-icon>mdi-{{settings.icon}}</v-icon>
                    <v-btn @click="dialogIcons=true" color="primary" small rounded class="ml-4">Select icon</v-btn>
                  </div>
                </v-col>
                <v-col cols="6" class="pt-0 d-flex align-center">
                  <v-tooltip top>
                    <template v-slot:activator="{ on }">
                      <v-icon v-on="on" left>mdi-menu</v-icon>
                    </template>
                    <span>Drag to change order (only available for side navbar)</span>
                  </v-tooltip>
                  <v-switch v-model="settings.hidden" :label="`Hide in navbar - ${settings.hidden?'On':'Off'}`" class="ma-0 pa-0" hide-details/>
                </v-col>
                <v-col cols="6" class="pt-0 d-flex align-center">
                  <v-tooltip top>
                    <template v-slot:activator="{ on }">
                      <v-icon v-on="on" left>mdi-map-marker</v-icon>
                    </template>
                    <span>Markers on timeline in built-in player</span>
                  </v-tooltip>
                  <v-switch v-model="settings.markers" :label="`Markers in player - ${settings.markers?'On':'Off'}`" class="ma-0 pa-0" hide-details/>
                </v-col>
                <v-col cols="6" class="pt-0 d-flex align-center">
                  <v-tooltip top>
                    <template v-slot:activator="{ on }">
                      <v-icon v-on="on" left>mdi-file-search-outline</v-icon>
                    </template>
                    <span>Allow the application to parse the path to the pdf file and look for meta-card names in it</span>
                  </v-tooltip>
                  <v-switch v-model="settings.parser" :label="`Parse pdf for data - ${settings.parser?'On':'Off'}`" class="ma-0 pa-0" hide-details/>
                </v-col>
                <v-col v-if="$store.state.Settings.showExperimentalFeatures" cols="6" class="pt-0 d-flex align-center">
                  <v-tooltip top>
                    <template v-slot:activator="{ on }">
                      <v-icon v-on="on" left>mdi-file-tree</v-icon>
                    </template>
                    <span>Drawing up a tree structure from cards (experimental)</span>
                  </v-tooltip>
                  <v-switch v-model="settings.nested" :label="`Nested view - ${settings.nested?'On':'Off'}`" class="ma-0 pa-0" hide-details/>
                </v-col>
                <v-col cols="12" align="center">
                  <v-card outlined class="pa-4">
                    <div class="text-center mb-4">
                      <v-tooltip top>
                        <template v-slot:activator="{ on }">
                          <v-icon v-on="on" left>mdi-help-circle-outline</v-icon>
                        </template>
                        <span>Drag to change order</span>
                      </v-tooltip>
                      <span class="overline">Meta in Cards</span> 
                    </div>
                    <v-card v-if="settings.metaInCard.length" outlined class="mb-4 mt-2">
                      <v-list dense class="list-zebra pa-0">
                        <draggable v-model="settings.metaInCard" v-bind="dragOptions" @start="drag=true" @end="drag=false">
                          <v-list-item v-for="(m, i) in settings.metaInCard" :key="i" class="pr-1 pl-2">
                            <div class="d-flex justify-space-between align-center" style="width:100%">
                              <span>
                                <v-icon left>mdi-{{getMeta(m.id).settings.icon}}</v-icon>
                                <span>{{getMeta(m.id).settings.name}}</span>
                                <span class="text--secondary px-2">({{m.type}})</span>
                                <span class="caption text--secondary px-2">id: {{m.id}}</span>
                                <span v-if="m.type=='simple'" class="caption text--secondary px-2">type: {{getMeta(m.id).dataType}}</span>
                                <span v-if="m.scraperField" class="caption text--secondary">scraper: {{m.scraperField}}</span>
                              </span>
                              <span>
                                <v-btn @click="openDialogDeleteMetaFromCards(i)" color="red" icon><v-icon>mdi-close</v-icon></v-btn>
                              </span>
                            </div>
                          </v-list-item>
                        </draggable>
                      </v-list>
                    </v-card>
                    <div v-else class="mb-4">
                      <v-icon large class="mb-2">mdi-card-off-outline</v-icon>
                      <div>No meta added to the cards</div>
                    </div>
                    <v-btn @click="dialogAddMetaToCard=true" color="success" small rounded>
                      <v-icon left>mdi-plus</v-icon>Add meta to cards</v-btn>
                  </v-card>
                </v-col>
                <v-col cols="12" align="center">
                  <v-card outlined class="pa-4">
                    <div class="overline text-center mb-4">Specific meta</div>
                    <v-row>
                      <v-col cols="6" class="d-flex align-center">
                        <v-icon left color="pink">mdi-heart</v-icon>
                        <v-switch v-model="settings.favorite" :label="`Favorites - ${settings.favorite?'On':'Off'}`" class="ma-0 pa-0" hide-details/>
                      </v-col>
                      <v-col cols="6" class="d-flex align-center">
                        <v-icon left color="yellow darken-2">mdi-star</v-icon>
                        <v-switch v-model="settings.rating" :label="`Ratings - ${settings.rating?'On':'Off'}`" class="ma-0 pa-0" hide-details/>
                      </v-col>
                      <v-col cols="6" class="d-flex align-center">
                        <v-tooltip top>
                          <template v-slot:activator="{ on }">
                            <v-icon v-on="on" left color="red">mdi-bookmark</v-icon>
                          </template>
                          <span>Text area for notes</span>
                        </v-tooltip>
                        <v-switch v-model="settings.bookmark" :label="`Bookmarks - ${settings.bookmark?'On':'Off'}`" class="ma-0 pa-0" hide-details/>
                      </v-col>
                      <v-col cols="6" class="d-flex align-center">
                        <v-tooltip top>
                          <template v-slot:activator="{ on }">
                            <v-icon v-on="on" left>mdi-alphabetical-variant</v-icon>
                          </template>
                          <span>Multiple names for one card</span>
                        </v-tooltip>
                        <v-switch v-model="settings.synonyms" :label="`Synonyms - ${settings.synonyms?'On':'Off'}`" class="ma-0 pa-0" hide-details/>
                      </v-col>
                      <v-col cols="6" class="d-flex align-center">
                        <v-icon left>mdi-flag</v-icon>
                        <v-switch v-model="settings.country" :label="`Countries - ${settings.country?'On':'Off'}`" class="ma-0 pa-0" hide-details/>
                      </v-col>
                      <v-col cols="6" class="d-flex align-center">
                      </v-col>
                    </v-row>
                  </v-card>
                </v-col>
                <v-col cols="12">
                  <v-card outlined class="pa-4">
                    <div class="overline text-center mb-4">Chips Appearance</div>
                    <div class="d-flex justify-space-around">
                      <div class="d-flex justify-space-between">
                        <v-checkbox v-model="settings.color" label="Color" class="my-0 mr-6" hide-details/>
                        <v-checkbox v-model="settings.chipLabel" label="Label" class="my-0 mr-6" hide-details/>
                        <v-checkbox v-model="settings.chipOutlined" label="Outlined" class="my-0 mr-6" hide-details/>
                      </div>
                      <v-spacer></v-spacer>
                      <v-chip :label="settings.chipLabel" :outlined="settings.chipOutlined" 
                        :color="settings.color?getRandomColor():''">Example chip</v-chip>
                    </div>
                  </v-card>
                </v-col>
                <v-col cols="12">
                  <v-card outlined class="pa-4">
                    <v-row>
                      <v-col cols="12" align="center" class="pb-0">
                        <span class="overline text-center">Card Appearance</span>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <div class="body-1">Aspect ratio of images:</div>
                        <v-radio-group v-model="settings.imageAspectRatio" column mandatory hide-details class="mt-2">
                          <v-radio :value="1">
                            <template v-slot:label> 
                              <span class="aspect-ratio-sample" :style="`width:${25}px;height:${25}px;`">
                                <v-icon small>mdi-image-filter-hdr</v-icon>
                              </span> 1:1 
                            </template>
                          </v-radio>
                          <v-radio :value="5/8">
                            <template v-slot:label> 
                              <span class="aspect-ratio-sample" :style="`width:${30*5/8}px;height:${30}px;`">
                                <v-icon small>mdi-account</v-icon>
                              </span> 5:8
                            </template>
                          </v-radio>
                          <v-radio :value="43/61">
                            <template v-slot:label> 
                              <span class="aspect-ratio-sample" :style="`width:${30*43/61}px;height:${30}px;`">
                                <v-icon small>mdi-account</v-icon>
                              </span> 2:3
                            </template>
                          </v-radio>
                          <v-radio :value="16/9">
                            <template v-slot:label> 
                              <span class="aspect-ratio-sample" :style="`width:${40}px;height:${40/16*9}px;`">
                                <v-icon small>mdi-image-filter-hdr</v-icon>
                              </span> 16:9
                            </template>
                          </v-radio>
                        </v-radio-group>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <div class="mb-2 body-1">Type of images:</div>
                        <v-checkbox v-model="settings.imageTypes" label="Main" value="main" class="ma-0 pa-0" hide-details disabled/>
                        <v-checkbox v-model="settings.imageTypes" label="Alternate" value="alt" class="ma-0 pa-0" hide-details/>
                        <v-checkbox v-model="settings.imageTypes" label="Custom 1" value="custom1" class="ma-0 pa-0" hide-details/>
                        <v-checkbox v-model="settings.imageTypes" label="Custom 2" value="custom2" class="ma-0 pa-0" hide-details/>
                        <v-checkbox v-model="settings.imageTypes" label="Avatar" value="avatar" class="ma-0 pa-0" hide-details/>
                        <v-checkbox v-model="settings.imageTypes" label="Header" value="header" class="ma-0 pa-0" hide-details/>
                      </v-col>
                    </v-row>
                  </v-card>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
    
    <v-dialog v-if="dialogAddMetaToCard" v-model="dialogAddMetaToCard" scrollable max-width="450">
      <v-card>
        <v-toolbar color="primary" height="50">
          <div class="headline">Add Meta to Cards</div>
          <v-spacer></v-spacer>
          <v-btn @click="addMetaToCard" outlined><v-icon left>mdi-plus</v-icon> Add </v-btn>
        </v-toolbar>
        <vuescroll>
          <v-card-text class="px-4">
            <v-autocomplete v-model="selectedMetaForCard" label="Meta name" :items="metaForCard"
              :rules="[value => !!value || 'Meta is required']" item-value="id" autofocus :filter="filterMeta">

              <template v-slot:selection="data">
                <v-icon left small>mdi-{{data.item.settings.icon}}</v-icon>
                <span>{{data.item.settings.name}}</span>
                <span class="text--secondary ml-2">({{data.item.type}})</span>
              </template>
              <template v-slot:item="data">
                <v-icon left>mdi-{{data.item.settings.icon}}</v-icon>
                <span>{{data.item.settings.name}}</span>
                <span class="text--secondary ml-2">({{data.item.type}})</span>
              </template>
            </v-autocomplete>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>

    <v-dialog v-if="dialogDeleteMetaFromCards" :value="dialogDeleteMetaFromCards" persistent max-width="450">
      <v-card>
        <v-toolbar color="error">
          <div class="headline">Are you sure?</div>
          <v-spacer></v-spacer>
          <v-btn @click="dialogDeleteMetaFromCards=false" outlined class="mx-4"> <v-icon left>mdi-close</v-icon> No </v-btn>
          <v-btn @click="addMetaToDeleted" outlined> <v-icon left>mdi-check</v-icon> Yes </v-btn>
        </v-toolbar>
        <v-card-text class="text-center">
          <v-icon size="72" color="error" class="py-4">mdi-alert-outline</v-icon>
          <div>Remove meta 
            <v-chip small class="mx-2">
              <v-icon small left>mdi-{{getMeta(metaInCard[selectedMetaIndex].id).settings.icon}}</v-icon>
              <b>{{getMeta(metaInCard[selectedMetaIndex].id).settings.name}}</b>
            </v-chip> from meta {{meta.settings.name}}?
            <div>This meta will be removed from all {{meta.settings.name.toLowerCase()}} cards.</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
    
    <Icons v-if="dialogIcons" @close="dialogIcons=false" @apply="changeIcon($event)"/>
    <DialogEditScraperFields v-if="dialogSetUpScraper" :dialog="dialogSetUpScraper" :metaInCards="settings.metaInCard" @closeDialog="getScraperFields($event)"/>
  </div>
</template>

<script>
import vuescroll from 'vuescroll'
import draggable from 'vuedraggable'
import NameRules from '@/mixins/NameRules'
import MetaGetters from '@/mixins/MetaGetters'
import DialogEditScraperFields from '@/components/pages/meta/DialogEditScraperFields.vue'

export default {
  props: {
    dialogEditMeta: false,
    metaObj: Object,
  },
  name: "DialogEditMeta",
  components: { 
    vuescroll, draggable, DialogEditScraperFields,
    Icons: () => import('@/components/elements/Icons.vue'),
  },
  mixins: [NameRules, MetaGetters], 
  mounted () {
    this.$nextTick(function () {
      this.settings = { ...this.settings, ...this.meta.settings }
    })
  },
  data: () => ({
    dialogIcons: false,
    dialogAddMetaToCard: false,
    dialogSetUpScraper: false,
    dialogDeleteMetaFromCards: false,
    selectedMetaForCard: null,
    valid: false,
    settings: {
      name: '',
      nameSingular: '',
      hint: '',
      icon: 'shape',
      hidden: false,
      parser: false,
      imageAspectRatio: 1,
      imageTypes: ['main'],
      chipLabel: false,
      chipOutlined: false,
      color: false,
      favorite: false,
      rating: false,
      synonyms: false,
      bookmark: false,
      country: false,
      career: false,
      scraper: false,
      nested: false,
      markers: false,
      metaInCard: [],
    },
    drag: false,
    dragOptions: {
      animation: 200,
      group: "description",
      disabled: false,
      ghostClass: "ghost"
    },
    selectedMetaIndex: 0,
    deletedMetaFromCards: [],
  }),
  computed: {
    meta() { return this.metaObj },
    metaForCard() {
      let metaInCardIds = this.settings.metaInCard.map(i=>i.id)
      let freeMetaList = this.$store.getters.meta.filter(i=>!metaInCardIds.includes(i.id))
      freeMetaList = freeMetaList.filter(i=>i.type!=='specific')
      return freeMetaList.filter(i=>i.id!=this.meta.id).cloneDeep().value()
    },
    dateAdded() {
      let date = new Date(this.meta.date)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    dateEdit() {
      let date = new Date(this.meta.edit)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
  },
  methods: {
    changeIcon(icon) {
      this.dialogIcons = false
      this.settings.icon = icon
    },
    addMetaToCard() {
      if (this.selectedMetaForCard == null || this.selectedMetaForCard.length == 0) return // check if empty
      if (_.filter(this.settings.metaInCard, {id:this.selectedMetaForCard}).length > 0) return // check for dups
      let meta = _.find(this.metaForCard, {id: this.selectedMetaForCard})
      let metaForAdding = { id: meta.id, type: meta.type } 
      this.settings.metaInCard.push(metaForAdding)
      this.dialogAddMetaToCard = false
      this.selectedMetaForCard = null
    },
    saveSettings() {
      this.$refs.form.validate()
      if (!this.valid) return
      this.$store.getters.meta.find({id: this.meta.id}).set('edit', Date.now()).set('settings', this.settings).write()
      this.parseDeletedMetaFromCards()
      this.$store.commit('updateComplexMetaListFromDb')
      this.closeSettings()
    },
    closeSettings() { this.$emit('closeSettings') },
    getScraperFields(fields) { 
      this.dialogSetUpScraper=false
      if (fields===undefined) return
      let metaInCard = this.settings.metaInCard
      let assignedFields = _.filter(fields, i=>i.assigned)
      for (let i = 0; i < metaInCard.length; i++) {
        const index = _.findIndex(assignedFields, j=>j.assigned===metaInCard[i].id)
        if (index > -1) this.settings.metaInCard[i].scraperField = assignedFields[index].name
        else this.settings.metaInCard[i].scraperField = undefined
      }
    },
    getRandomColor() { return '#'+Math.floor(Math.random()*16777215).toString(16) },
    openDialogDeleteMetaFromCards(i) { 
      this.dialogDeleteMetaFromCards = true
      this.selectedMetaIndex = i
    },
    addMetaToDeleted() {
      this.deletedMetaFromCards.push(this.metaInCard[this.selectedMetaIndex].id)
      this.settings.metaInCard.splice(this.selectedMetaIndex, 1)
      this.dialogDeleteMetaFromCards = false
    },
    parseDeletedMetaFromCards() {
      let metaId = this.meta.id
      for (let id of this.deletedMetaFromCards) { // delete from meta cards
        this.$store.getters.metaCards.filter({metaId}).each(card=>{delete card.meta[id]}).write() 
        this.$store.getters.savedFilters.get(metaId).each(sf=>{_.remove(sf.filters, f=>f.by===id)}).write() // delete from saved filters
        this.$store.getters.meta.filter({id:metaId}).each(m=>{ _.remove(m.state.filters, f=>f.by===id) }).write() // delete from all meta filters
        this.$store.getters.settings.get('tabs').filter(tab=>tab.link.includes(metaId)).each(tab=>{
          tab.filters = _.filter(tab.filters, i=>i.by!==id) }).write() // remove from tab's filters
      }
      this.$store.dispatch('updateSavedFilters')
      this.$store.commit('updateSettingsState', 'tabs') // update tabs
    },
    filterMeta(metaObj, queryText) { return metaObj.settings.name.toLowerCase().includes(queryText.toLowerCase()) },
  },
}
</script>


<style lang="scss" scoped>
.aspect-ratio-sample {
  border: 1px solid;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 3px;
  margin-right: 10px;
  background-color: rgba(121, 121, 121, 0.164);
}
</style>