<script>
const fs = require("fs")
const path = require("path")

export default {
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData },
    tabId() { return this.$route.query.tabId },
  },
  methods: {
    getItem(itemType) { return this.$store.getters[itemType].find({ id: this.itemId }).value() },
    getImgMetaUrl(cardId, metaId) {
      let img = path.join(this.pathToUserData, `/media/meta/${metaId}/${cardId}_main.jpg`)
      let imgChecked = this.checkImageExist(img)
      if (imgChecked) return 'file://' + imgChecked
      else return path.join('file://', __static, '/img/default.png')
    },
    checkImageExist(imgPath) {
      if (fs.existsSync(imgPath)) return imgPath
      else return false
    },
  },
}
</script>