<template>
  <v-dialog v-model="$store.state.Videos.dialogFolderTree" persistent scrollable max-width="700">
    <v-card>
      <v-toolbar color="primary">
        <div class="headline">Folder tree</div>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-icon v-on="on" right>mdi-help-circle-outline</v-icon>
          </template>
          <span>You can filter PDFs by selected folders. <br>
            An experimental feature to be improved.</span>
        </v-tooltip>
        <v-spacer></v-spacer>
        <v-btn @click="cancelFilterByTree" outlined class="ml-4">
          <v-icon left>mdi-close</v-icon> Close</v-btn>
        <v-btn @click="clearSelectedFolders" outlined class="mx-4">
          <v-icon left>mdi-cancel</v-icon> Clear all</v-btn>
        <v-btn @click="filterByTree" :disabled="updatingFolderTree" outlined>
          <v-icon left>mdi-filter</v-icon>Filter</v-btn>
      </v-toolbar>
      <v-card-actions>
        <v-select v-model="selectedDisk" :items="disks" label="Choose disk" solo dense
          prepend-icon="mdi-harddisk" hide-details class="mx-8 disks" @change="selectDisk"
          :menu-props="{contentClass:'disks'}" item-text="_mounted" item-value="_mounted">
          <template v-slot:selection="data">
            <div class="mounted">{{data.item._mounted}}</div>
            <div class="space">{{calcSize(data.item._blocks)}}</div>
            <v-progress-linear :value="data.item._capacity" height="20" color="secondary">
              {{data.item._capacity}}
            </v-progress-linear>
          </template>
          <template v-slot:item="data">
            <div class="mounted">{{data.item._mounted}}</div>
            <div class="space">{{calcSize(data.item._blocks)}}</div>
            <v-progress-linear :value="data.item._capacity" height="20" color="secondary">
              {{data.item._capacity}}
            </v-progress-linear>
          </template>
        </v-select>
      </v-card-actions>
      <vuescroll>
        <v-card-text v-if="updatingFolderTree" class="text-center">
          <h3 class="mb-2">Creating a folder tree...</h3>
          <v-icon x-large class="loading-animation">mdi-loading</v-icon>
        </v-card-text>
        <v-card-text v-else>
          <v-treeview :items="folders" item-key="path" :load-children="loadChildren"
            open-on-click dense expand-icon="mdi-chevron-down">
            <template v-slot:prepend="{item}">
              <v-icon @click="selectFolder($event, item)" 
                :color="selectedFolders.includes(item.path) ? 'primary' : ' '">
                {{ selectedFolders.includes(item.path) ? 'mdi-folder' : 'mdi-folder-outline' }}
              </v-icon>
            </template>
          </v-treeview>
        </v-card-text>
      </vuescroll>
    </v-card>
  </v-dialog>
</template>


<script>
const fs = require("fs")
const path = require("path")
const nodeDiskInfo = require('node-disk-info')

import vuescroll from 'vuescroll'
import Functions from '@/mixins/Functions'

export default {
  name: "DialogFolderTree",
  components: {
    vuescroll,
  },
  mixins: [Functions],
  mounted () {
    this.$nextTick(function () {
      this.openDialogFolderTree()
    })
  },
  data: () => ({
    updatingFolderTree: false,
    folders: [],
    disks: [],
    prevSelectedFolders: [],
    depth: 2,
    excludes: ['.git','node_modules','System Volume Information','$Recycle.Bin'],
  }),
  computed: {
    selectedFolders: {
      get() {
        return this.$store.state.Videos.tree
      },
      set(value) {
        this.$store.state.Videos.tree = value
      },
    },
    selectedDisk: {
      get() {
        return this.$store.state.Settings.selectedDisk
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'selectedDisk', value})
      },
    },
  },
  methods: {
    openDialogFolderTree() {
      this.$store.state.Videos.dialogFolderTree = true
      this.updatingFolderTree = true
      this.prevSelectedFolders = _.clone(this.selectedFolders)
      if (this.disks.length===0) {
        setTimeout(()=>{
          try {
            this.disks = nodeDiskInfo.getDiskInfoSync()
            if (this.selectedDisk) {
              const isSelectedDiskExists = _.find(this.disks, disk=>(disk._mounted===this.selectedDisk))
              if (!isSelectedDiskExists) {
                this.selectedDisk = this.disks[0]._mounted
              }
            } else {
              this.selectedDisk = this.disks[0]._mounted
            }
            this.readDiskFolders()
          } catch (e) {
            console.error(e)
          }
        }, 500)
      } else this.updatingFolderTree = false
    },
    readDiskFolders() {
      const selected = this.selectedFolders.filter(folder=>(folder.includes(this.selectedDisk)))
      if (!selected.length) {
        this.selectedFolders = []
      }
      this.folders = this.mapDir(this.selectedDisk+path.sep, this.excludes)
      this.updatingFolderTree = false
    },
    cancelFilterByTree() {
      this.selectedFolders = _.clone(this.prevSelectedFolders)
      this.$store.state.Videos.dialogFolderTree = false
    },
    clearSelectedFolders() {
      this.selectedFolders = []
      this.$store.state.Videos.dialogFolderTree = false
      this.$store.dispatch('filterVideos')
    },
    filterByTree() {
      this.$store.state.Videos.dialogFolderTree = false
      this.$store.dispatch('filterVideos')
    },
    selectDisk() {
      this.updatingFolderTree = true
      setTimeout(()=>{this.readDiskFolders()}, 500)
    },
    selectFolder(event, item) {
      event.stopPropagation()
      if (this.selectedFolders.includes(item.path)) {
        const index = this.selectedFolders.indexOf(item.path)
        if (index > -1) {
          this.selectedFolders.splice(index, 1)
        }
      } else {
        this.selectedFolders.push(item.path)
      }
    },
    loadChildren(item) {
      const folder = this.mapDir(item.path+path.sep, this.excludes)
      if (folder.length) {
        item.children.push(...folder)
      } else item.children = undefined
    },
    isIgnored(fileName, ignoredDirs) {
      return ignoredDirs.some((dir) => {
        return dir.toLowerCase() === fileName.toLowerCase()
      })
    },
    mapDir(directory, ignoredDirs, deep = 1) {
      let dirMap
      try {
        dirMap = fs.readdirSync(directory, ignoredDirs)
      } catch (err) {
        // if (err.code === 'ENOENT') {
        //   console.log(directory + ' not found!')
        // } else if (err.code === 'EACCES') {
        //   console.log('No access rights to the ' + directory)
        // } else {
        //   throw err
        // }
        return []
      }
      return dirMap.map((dir) => {
        if(!this.isIgnored(dir, ignoredDirs)) {
          const dirPath = path.join(directory, dir)
          let stats 
          try {
            stats = fs.lstatSync(dirPath)
          } catch (err) {
            // console.error(err)
          }
          if(stats) {
            if(stats.isDirectory()) {
              let newDirMap = []
              if (!this.depth || deep < this.depth) {
                const nextDeep = deep + 1
                newDirMap = this.mapDir(dirPath, ignoredDirs, nextDeep)
              }
              const res = {
                name: dir,
                path: dirPath,
              }
              if(newDirMap.length) {
                res.children = []
              }
              return res
            }
          }
        }
      }).filter(function(x) { return x !== undefined })
    },
  },
  watch: {
  },
}
</script>


<style lang="less">
.disks {
  .mounted {
    min-width: 30%;
  }
  .space {
    min-width: 50%;
    text-align: right;
    padding-right: 10px;
    font-size: 12px;
  }
  .v-progress-linear__background {
    display: block !important;
  }
  .v-progress-linear__content {
    font-size: 12px;
  }
}
</style>