<script>
export default {
  // TODO check functions and remove this file
  methods: {
    pdfLink(pdfPath) {
      return `/pdf/:${this.getVideoId(pdfPath)}?tabId=default`
    },
    getVideoId(pdfPath) {
      return this.$store.getters.pdfs.find({path: pdfPath}).value().id
    },
    creatorLink(itemName) {
      return `/creator/:${this.getCreatorId(itemName)}?tabId=default`
    },
    getCreatorId(itemName) {
      return this.$store.getters.creators.find({name: itemName}).value().id
    },
    addNewTabCreator(creatorName) {
      let tabId, tabName
      if (creatorName) {
        tabId = this.getCreatorId(creatorName)
        tabName = creatorName
      } else if (this.creator) {
        tabId = this.creator.id
        tabName = this.creator.name
      } else return
      
      if (this.$store.getters.tabsDb.find({id: tabId}).value()) {
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Tab with creator "${tabName}" already exists`
        })
        return
      }

      let tab = { 
        name: tabName,
        link: `/creator/:${tabId}?tabId=${tabId}`,
        id: tabId,
        icon: 'account-details'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    tagLink(itemName) {
      return `/tag/:${this.getTagId(itemName)}?tabId=default`
    },
    getTagId(itemName) {
      return this.$store.getters.tags.find({name: itemName}).value().id
    },
    addNewTabWebsite(websiteName) {
      let tabId, tabName
      if (websiteName) {
        tabId = this.getWebsiteId(websiteName)
        tabName = websiteName
      } else if (this.website) {
        tabId = this.website.id
        tabName = this.website.name
      } else return

      if (this.$store.getters.tabsDb.find({id: tabId}).value()) {
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Tab with website "${tabName}" already exists`
        })
        return
      }
      let tab = { 
        name: tabName,
        link: `/website/:${tabId}?tabId=${tabId}`,
        id: tabId,
        icon: 'web-box'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    websiteLink(itemName) {
      return `/website/:${this.getWebsiteId(itemName)}?tabId=default`
    },
    getWebsiteId(itemName) {
      return this.$store.getters.websites.find({name: itemName}).value().id
    },
  },
}
</script>