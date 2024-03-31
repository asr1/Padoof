<template> 
  <v-dialog v-model="$store.state.Settings.dialogScanPdfs" scrollable persistent max-width="1200">
    <v-stepper v-model="ScanPdfsForm">
      <v-stepper-header style="height: 50px;">
        <v-stepper-step :complete="ScanPdfsForm > 1" step="1" class="py-0">
          Choose folders
        </v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step :complete="ScanPdfsForm > 2" step="2" class="py-0">
          Parse settings
        </v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step step="3" class="py-0">
          Scanning process
        </v-stepper-step>
      </v-stepper-header>
      <v-divider></v-divider>
      <v-stepper-items>
        <v-stepper-content step="1" class="pa-0">
          <v-card>
            <vuescroll>
              <v-card-text class="text-center">
                <v-textarea v-model="folderPaths" outlined no-resize
                  label="Path to folder with PDFs" hint="each path starts on a new line" />

                <v-btn @click="chooseMultipleDir" outlined>
                  <v-icon left>mdi-folder-open</v-icon>Choose folders
                </v-btn>
              </v-card-text>
            </vuescroll>
            <v-card-actions>
              <v-btn @click="close" class="ma-2">
                <v-icon left>mdi-cancel</v-icon> Cancel
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn @click="ScanPdfsForm = 2" :disabled="folderPaths.length===0" color="primary" class="ma-2">
                <v-icon left>mdi-pdf-check</v-icon> Next: parse settings <v-icon large right>mdi-chevron-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-stepper-content>

        <v-stepper-content step="2" class="pa-0">
          <v-card>

            <vuescroll>
              <v-card-text>
                <div class="text-center">
                  <v-alert type="info" text outlined dense>
                    Metadata will be automatically added during the scan.
                    It is recommended to add meta in <v-icon small color="info">mdi-cog</v-icon> Settings and then add cards on this meta page before scanning.
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on }">
                        <v-icon v-on="on" color="info">mdi-help-circle-outline</v-icon> How does parser work
                      </template>
                      <span>The file path and all meta items are filtered first. <br>
                        The filter removes all characters except numbers and letters and converts them to lower case. <br>
                        The filtered file path is searched for a match with any of the meta card names. <br>
                        Parsing works inaccurately, since the search does not match the entire string, but a part. <br>
                      </span>
                    </v-tooltip>
                  </v-alert>
                </div>
              </v-card-text>
            </vuescroll>
            <div class="d-flex flex-wrap justify-center">
              <div v-for="m of metaForParsing" :key="m.id + parseKey" class="d-flex flex-column mx-4">
                <v-checkbox v-model="parseMeta[m.id].parse" @change="parseKey=Date.now()" :label="`Parse ${getMeta(m.id).settings.name}`" class="mt-0" hide-details :prepend-icon="`mdi-${getMeta(m.id).settings.icon}`" />
                <v-checkbox v-model="parseMeta[m.id].synonyms" :disabled="!parseMeta[m.id].parse" class="ml-8 mt-2 mb-6" label="Include synonyms" hide-details />
              </div>
            </div>
            <v-card-actions>
              <v-btn @click="close" class="ma-2">
                <v-icon left>mdi-cancel</v-icon> Cancel
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn v-if="scanStage==0" @click="ScanPdfsForm=1" class="my-2 mr-6">
                <v-icon large left>mdi-chevron-left</v-icon> Back
              </v-btn>
              <v-btn @click="startScanProcess" color="primary" class="my-2 mr-2">
                <v-icon left>mdi-movie-search</v-icon>
                Start scanning process <v-icon large right>mdi-chevron-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-stepper-content>
        
        <v-stepper-content step="3" class="pa-0">
          <v-card class="file-scan-dialog">
            <v-card-title class="headline">
              {{headerText}}
              <v-spacer></v-spacer>
              <span class="body-2">
                {{currentNumberOfScanPdfs}} / {{totalNumberOfScanPdfs}} PDFs scanned
              </span>
            </v-card-title>

            <v-card-actions class="px-4">
              <v-progress-linear v-model="pdfScanProgressBar" :class="{active: isProcessRun}" 
                height="20" rounded class="progress-striped">
                <template v-slot="{ value }">
                  <strong class="process-percents">{{ Math.ceil(value) }}%</strong>
                </template>
              </v-progress-linear>
            </v-card-actions>

            <v-card-actions v-if="currentPdfScanName!==''" class="py-1 px-4">
              {{currentPdfScanName}}
            </v-card-actions>

            <v-card-actions v-if="$store.state.Settings.scanProcRun" class="py-1 px-4">
              <v-progress-linear v-if="$store.state.Settings.scanProcRun"
                height="4" indeterminate reverse class="my-2">
              </v-progress-linear>
            </v-card-actions>

            <vuescroll>
              <v-card-text class="py-1" style="max-height: calc(100vh - 450px)">
                <v-alert style="overflow:hidden;"
                  v-model="alertFolderError" type="error" :icon="false" 
                  border="left" text dense outlined 
                > Folder read error: ({{errorFolders.length}}) <br>{{errorScanFolders}}
                </v-alert>
                <v-alert style="overflow:hidden;"
                  v-model="alertScanError" type="error" :icon="false" 
                  border="left" text dense outlined :height="alertScanErrorHeight" 
                > <v-row align="start">
                    <v-col class="grow">
                      PDF file read error: ({{errorPdfs.length}}) <br>{{errorScanPdfs}}
                    </v-col>
                    <v-col class="shrink">
                      <v-btn depressed fab outlined width="24" height="24" color="error"
                        @click="alertScanErrorHeightChange"
                      ><v-icon size="16">mdi-arrow-up-down</v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-alert>
                <v-alert style="overflow:hidden;"
                  v-model="alertduplicatePdfs" type="warning" :icon="false"
                  border="left" text dense outlined :height="alertduplicatePdfsHeight" 
                > <v-row align="start">
                    <v-col class="grow">
                      Already in the database: ({{duplicatePdfs.length}}) 
                      <br>{{parsedduplicatePdfs}}
                    </v-col>
                    <v-col class="shrink">
                      <v-btn depressed fab outlined width="24" height="24" color="warning"
                        @click="alertduplicatePdfsHeightChange"
                      ><v-icon size="16">mdi-arrow-up-down</v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-alert>
                <v-alert
                  v-model="noNewPdfsAdded"
                  border="left" text dense outlined  type="info"
                > {{textNoVideosAdded}}
                </v-alert>
                <v-alert style="overflow:hidden;"
                  v-model="alertAddnewPdfs" type="success" :icon="false"
                  border="left" text dense outlined :height="alertAddnewPdfsHeight"
                > <v-row align="start">
                    <v-col class="grow"> Added: ({{newPdfs.length}})
                      <br>{{parsednewPdfs}} </v-col>
                    <v-col class="shrink">
                      <v-btn depressed fab outlined width="24" height="24" color="success"
                        @click="alertAddnewPdfsHeightChange"
                      ><v-icon size="16">mdi-arrow-up-down</v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-alert>
              </v-card-text>
            </vuescroll>

            <v-card-actions>
              <v-btn v-if="$store.state.Settings.scanProcRun" @click="stop=true" color="red" dark class="ma-2"> 
                <v-icon left>mdi-stop</v-icon> Stop scanning
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn @click="endScanProcess" :disabled="$store.state.Settings.scanProcRun" 
                color="primary" class="ma-2"
              > <v-icon left>mdi-check-circle-outline</v-icon> OK </v-btn>
            </v-card-actions>
          </v-card>
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </v-dialog>
</template>

<script>
const {ipcRenderer} = require('electron')
const fs = require('fs')
const path = require('path')
const shortid = require('shortid')
const { PDFDocument } = require('pdf-lib');

import vuescroll from 'vuescroll'
import MetaGetters from '@/mixins/MetaGetters'

export default {
  name: 'ScanPdfs',
  components: {
    vuescroll
	},
  mixins: [MetaGetters],
  mounted() {
    this.$nextTick(function () {
      if (this.scanStage>0) this.ScanPdfsForm = this.scanStage
      this.folderPaths = this.$store.state.Settings.folders.map(f=>f.path).join('\n')
    })
  },
  beforeMount() {
    this.initParseMeta()
  },
  data: () => ({
    ScanPdfsForm: 1,
    folderPaths: '',
    headerText: 'PDFs scanning in progress...',
    pdfScanProgressBar: 0,
    currentPdfScanName: '',
    isPdfScanFinished: false,
    currentNumberOfScanPdfs: 0,
    totalNumberOfScanPdfs: 0,
    alertFolderError: false,
    alertScanError: false,
    alertScanErrorHeight: 100,
    alertduplicatePdfs: false,
    alertduplicatePdfsHeight: 100,
    alertAddnewPdfs: false,
    alertAddnewPdfsHeight: 100,
    errorFolders: [],
    errorPdfs: [],
    duplicatePdfs: [],
    newPdfs: [],
    noNewPdfsAdded: false,
    textNoVideosAdded: '',
    stop: false,
    fileInfo: {},
    parseMeta: {},
    parseKey: 0,
  }),
  computed: {
    errorScanFolders() { return this.errorFolders.join(', \n') },
    errorScanPdfs() { return this.errorPdfs.join(', \n') },
    parsedduplicatePdfs() { return this.duplicatePdfs.join(', \n') },
    parsednewPdfs() { return this.newPdfs.join(', \n') },
    isProcessRun() { return this.$store.state.Settings.scanProcRun },
    pathToUserData() { return this.$store.getters.getPathToUserData },
    metaForParsing() {  
      let ids = this.$store.getters.settings.get('metaAssignedToVideos').filter({type:'complex'}).map('id').value() 
      return this.$store.getters.meta.filter(i=>ids.includes(i.id)&&i.settings.parser).value()
    },
    scanFolders: {
      get() { return this.$store.state.scan.folders },
      set(value) { this.$store.state.scan.folders = value },
    },
    scanFiles: {
      get() { return this.$store.state.scan.files },
      set(value) { this.$store.state.scan.files = value },
    },
    scanStage: {
      get() { return this.$store.state.scan.stage },
      set(value) { this.$store.state.scan.stage = value },
    },
  },
  methods: {
    initParseMeta() {
      for (let i of this.metaForParsing) {
        this.parseMeta[i.id] = { parse: true, synonyms: true }
      }
    },
    alertScanErrorHeightChange() {
      if (this.alertScanErrorHeight == 100) this.alertScanErrorHeight = undefined
      else this.alertScanErrorHeight = 100
    },
    alertduplicatePdfsHeightChange() {
      if (this.alertduplicatePdfsHeight == 100) this.alertduplicatePdfsHeight = undefined
      else this.alertduplicatePdfsHeight = 100
    },
    alertAddnewPdfsHeightChange() {
      if (this.alertAddnewPdfsHeight == 100) this.alertAddnewPdfsHeight = undefined
      else this.alertAddnewPdfsHeight = 100
    },
    async chooseMultipleDir() {
      await ipcRenderer.invoke('chooseDirectoryMultiple').then((result) => {
        console.log(result)
        if (result.filePaths.length !== 0) this.folderPaths = result.filePaths.join('\n')
      })
    },
    scanDir() {
      this.$store.state.Settings.scanProcRun = true
      this.headerText = 'PDFs scanning in progress...'

      this.pdfScanProgressBar = 0
      this.isPdfScanFinished = false
      this.currentNumberOfScanPdfs = 0
      this.totalNumberOfScanPdfs = 0
      this.alertFolderError = false
      this.alertScanError = false
      this.alertduplicatePdfs = false
      this.alertAddnewPdfs = false
      this.errorFolders = []
      this.errorPdfs = []
      this.duplicatePdfs = []
      this.newPdfs = []
      this.noNewPdfsAdded = false
      this.stop = false
      
      let formats = /\.pdf$/

      const vm = this

      let filesArray = []
      if (this.scanFiles.length || this.scanFolders.length) {
        if (this.scanFiles.length) filesArray = this.scanFiles
        if (this.scanFolders.length) {
          for (const folder of this.scanFolders) filesArray = filesArray.concat(vm.findInDir(folder, formats))
        } 
      } else {
        let folders = this.folderPaths.split('\n')
        for (const folder of folders) filesArray = filesArray.concat(vm.findInDir(folder, formats))
      } 
      function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

      async function processArray(files) {
        let percentsPerFile = 100/files.length 
        vm.totalNumberOfScanPdfs = files.length
        // console.log(percentsPerFile)
        for (const file of files) {
          if (vm.stop) break // stop process
          vm.currentPdfScanName = file
          let fileProcResult = await vm.fileScanProc(file)
          if (fileProcResult.errorVideo) {
            vm.alertScanError = true
            vm.errorPdfs.unshift(fileProcResult.errorVideo)
          }
          if (fileProcResult.duplicate) {
            vm.alertduplicatePdfs = true
            vm.duplicatePdfs.unshift(fileProcResult.duplicate)
          }
          if (fileProcResult.success) {
            vm.alertAddnewPdfs = true
            vm.newPdfs.unshift(fileProcResult.success.path)
          }
          ++vm.currentNumberOfScanPdfs
          vm.pdfScanProgressBar += percentsPerFile
          if (vm.pdfScanProgressBar > 100) vm.pdfScanProgressBar = 100
          await sleep(10)
        }
        vm.isPdfScanFinished = true
      }

      processArray(filesArray).then(()=>{
        vm.currentPdfScanName = ''
        if (vm.newPdfs.length===0 && vm.totalNumberOfScanPdfs!==0) {
          vm.noNewPdfsAdded = true
          vm.textNoVideosAdded = 'No PDFs have been added.'
        }
        if (vm.newPdfs.length===0 && vm.totalNumberOfScanPdfs===0) {
          vm.noNewPdfsAdded = true
          vm.textNoVideosAdded = 'There is no PDF in the selected folder.'
        }
        if (vm.newPdfs.length>0) {
          vm.$store.commit('addLog', {
            type:'info',
            color:'green',
            text:`${vm.newPdfs.length} new PDFs have been added 😀`
          })
          if (vm.$store.state.Settings.updateDataAfterAddingnewPdfs) vm.$store.dispatch('updateDataFromVideos')
        }
        vm.$store.state.Settings.scanProcRun = false
        vm.$store.dispatch('filterVideos')
        vm.headerText = 'PDF scanning process completed!'
      })
    },
    findInDir(dir, filter, fileList = []) {
      let files
      try {
        files = fs.readdirSync(dir)
      } catch (err) {
        this.$store.commit('addLog', {type:'error', text:'PDF scanning process: '+err})
        files = []
        this.alertFolderError = true
        this.errorFolders.unshift(dir)
      }

      files.forEach((file) => {
        const filePath = path.join(dir, file)
        let fileStat
        try {
          fileStat = fs.lstatSync(filePath)
        } catch (error) {
          this.$store.commit('addLog', {type:'error', text:'PDF scanning process: '+error})
          return
        }

        if (fileStat.isDirectory()) this.findInDir(filePath, filter, fileList)
        else if (filter.test(filePath.toLowerCase())) fileList.push(filePath)
      })

      return fileList
    },
    async fileScanProc(file) {
      let fileProcResult = {}
      // check for duplicates in database
      let duplicate = this.$store.getters.pdfs.find(pdf => pdf.path.toLowerCase() == file.toLowerCase()).value()
      if (duplicate) {
        fileProcResult.duplicate = file
        fileProcResult.success = false
        return fileProcResult
      }

      this.fileInfo.id = shortid.generate() 
      const vm = this

      try {
        await this.getVideoMetadata(file)
      } catch (error) {
        console.log("Error 1");
        console.log(error);
        vm.$store.commit('addLog', {type:'error',text:'PDF scanning process: '+error})
        fileProcResult.errorVideo = file
        return fileProcResult
      }

      // add PDF to DB
      await this.createInfoForDb(file)
        .then(async (pdfMetadata) => {
          await this.$store.getters.pdfs.push(pdfMetadata).write()
          fileProcResult.duplicate = false
          fileProcResult.success = pdfMetadata
          return(fileProcResult)
        })
        .catch(error => {
          console.log("Error 3");
          console.log(error);
          vm.$store.commit('addLog', {type:'error',text:'PDF scanning process: '+error})
          fileProcResult.errorVideo = file
        })
      return fileProcResult
    },
    getVideoMetadata (pathToFile) {
      return new Promise((resolve, reject) => {
        const metadata = fs.statSync(pathToFile, {});

console.log("Getting duration");
        this.fileInfo.meta = metadata
        const myFile = fs.readFileSync(pathToFile);
        PDFDocument.load(myFile, {ignoreEncryption: true}).then( (res)=>{
          const num = res.getPages().length;
          this.fileInfo.duration = num;
          console.log(num);
        })

        return resolve();
      })
    },
    createInfoForDb(pathToFile) { // create info of PDF file, generating thumb.jpg and return object with PDF file info
      return new Promise ((resolve, reject) => {
        let size = Math.floor(this.fileInfo.meta.size)
console.log("Creating db info", this.fileInfo);
        // get file info 
        let pdfMetadata = {
          id: this.fileInfo.id,
          path: pathToFile,
          size: size,
          duration: this.fileInfo.duration,
          resolution: "600x600",// resolution,
          rating: 0,
          favorite: false,
          bookmark: '',
          date: Date.now(),
          edit: Date.now(),
          views: 0,
        }

        let parsed = this.parsePathForMeta(pathToFile)

        pdfMetadata = {...pdfMetadata, ...parsed}
        
        let outputPathThumbs = path.join(this.pathToUserData, '/media/thumbs/')
        if (!fs.existsSync(outputPathThumbs)) fs.mkdirSync(outputPathThumbs)

        // creating the thumb of the pdf
        const options = {
            density: 100,
            saveFilename: `${this.fileInfo.id}`,
            savePath: outputPathThumbs,
            format: "jpg",
            width: 600,
            height: 600
          };
        const pdf2pic = require('pdf2pic');
        const convert = pdf2pic.fromPath(pathToFile, options);
        const pageToConvertAsImage = 1;

        // Need this to not be named ".1" at the end. Could use fs to rename it. Is there a way to do it directly within pdf2pic?
        convert(pageToConvertAsImage, { responseType: "image" })
          .then((resolve) => {
                // It's asinine that we have to do such a clunky workaround just to get the pdf file to be named what we specified.
                fs.readdir(outputPathThumbs, (err, files) => {
                  for (const file of files) {
                    const regex = /^(.*)\.1\.jpg$/g;
                    const match = [...file.matchAll(regex)];
                    if(match.length) {
                        // Add more logic to rename file. 
                        // Equally asinine that fs doesn't work without reminding it of the path when it's ACTIVELY LISTING FILES
                        const oldName = path.join(outputPathThumbs, file);
                        const newName = path.join(outputPathThumbs, match[0][1] + '.jpg')

                        fs.rename(oldName, newName, (err) => {
                          if (err) throw err
                        })
                    }
                  }
                })

            return resolve;
          });

        resolve(pdfMetadata);
      })
    },
    parsePathForMeta(filePath) {
      function filterString(string) {
        return string.replace(/[&\/\\#,+()$~%.'":*?<>{} ]/g, "").toLowerCase()
      }
      const string = filterString(filePath)

      let parsed = {}
      for (let m of this.metaForParsing) {
        if (this.parseMeta[m.id].parse && !this.parseMeta[m.id].synonyms) {
          parsed[m.id] = this.$store.getters.metaCards.filter(mc =>
            mc.metaId===m.id && string.includes(filterString(mc.meta.name))
          ).value().map(mc => mc.id)
        } else if (this.parseMeta[m.id].parse && this.parseMeta[m.id].synonyms) {
          parsed[m.id] = this.$store.getters.metaCards.filter(mc => {
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
        }
        parsed[m.id] = [...new Set(parsed[m.id])] // remove duplicates
      }

      return parsed
    },
    getPathRules(path) {
      if (path.length===0) return 'Path is required'
      else return true
    },
    startScanProcess() {
      this.ScanPdfsForm = 3
      setTimeout(()=>{ this.scanDir() },500)
    },
    endScanProcess() {
      this.close()
      this.$store.state.updateFoldersData = Date.now()
    },
    close() {
      this.$store.state.Settings.dialogScanPdfs = false
      this.scanFolders = []
      this.scanFiles = []
      this.scanStage = 0
      this.ScanPdfsForm = 1
    },
  },
  watch: {
    alertScanError(val) { if (!val) this.errorPdfs = [] }, 
    alertduplicatePdfs(val) { if (!val) this.duplicatePdfs = [] },
    alertAddnewPdfs(val) { if (!val) { this.newPdfs = [] } },
  },
}
</script>

<style lang="less">
.file-scan-dialog {
  .v-alert__content {
    font-size: 10px;
    white-space: pre-line;
  }
}
.btn-top .v-btn {
  align-self: flex-start;
  margin: 0;
}
.progress-striped {
  .v-progress-linear__determinate {
    &.primary {
      overflow: hidden;
      position: absolute;
      &:after {
        content: "";
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 25%,
        transparent 0, transparent 50%, rgba(255, 255, 255, 0.25) 0,
        rgba(255, 255, 255, 0.25) 75%, transparent 0, transparent);
        background-size: 40px 40px;
        background-repeat: repeat;
        transition: width 4s ease-in-out;
        height: 100%;
        width: 100%;
      }
    }
  }
  &.active {
    .v-progress-linear__determinate {
      &.primary {
        &:after {
          animation: cssProgressActive 2s linear infinite;
        }
      }
    }
  }
  &[aria-valuenow="100"] {
    .v-progress-linear__determinate {
      &.primary {
        &:after {
          animation-play-state: paused;
        }
      }
    }
  }
}
.bordered {
  margin-top: 10px;
  border: 1px dashed #7a7a7a;
  padding: 20px;
  border-radius: 5px;
}
.process-percents {
  background-color: rgba(255, 255, 255, 0.5);
  padding: 0 2px 0;
  border-radius: 10px;
  display: block;
  line-height: 1;
}

@keyframes cssProgressActive {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 40px 40px;
  }
}
</style>