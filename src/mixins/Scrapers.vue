<script>
const fs = require('fs')
const path = require("path")
const axios = require("axios")
const cheerio = require("cheerio")

import jimp from 'jimp'
import Countries from '@/components/elements/Countries'

export default {
  computed: {
  },
  data: () => ({
    months: ['january','february','march','april','may','june','july','august','september','october','november','december'],
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData }
  },
  methods: {
    findMeta(scraper) {
      this.searchInProgress = true
      this.showFindError = false
      let query = ''
      axios.get(query).then((response) => {
        if (response.status !== 200) return
        this.searchInProgress = false
        this.found = []
        const html = response.data
        const $ = cheerio.load(html)
        this.showFindError = this.found.length==0
      }, (error) => {
        this.searchInProgress = false
        this.showFindError = true
        this.$store.dispatch('setNotification', {type: 'error',text: `Can't find info for ${this.queryString}`})
      })
    },
    getInfo(meta, scraper, name) {
      this.searchInProgress = true
      let query = ''
      axios.get(query).then((response) => {
        if (response.status !== 200) return
        this.searchInProgress = false
        this.transfer.current = {}
        this.transfer.found = {}
        const html = response.data
        const $ = cheerio.load(html)
        this.initCurrentValues()
        this.dialogTransferInfo = true
      }, (error) => {
        this.searchInProgress = false
        this.$store.dispatch('setNotification', {type:'error', text:`Can't find info for "${this.queryString}"`})
      })
    },
  },
}
</script>