const fs = require("fs")
const path = require("path");
const FileSync = require('lowdb/adapters/FileSync')
const app = require('@electron/remote').app
const pathToDbVideos = path.join(app.getPath('userData'), 'userfiles/databases/dbv.json')
const adapterVideos = new FileSync(pathToDbVideos)
const low = require('lowdb')
const dbv = low(adapterVideos)

import router from '@/router'

dbv.defaults({ pdfs: [] }).write()

const Videos = {
  state: () => ({
    pageTotal: 1,
    lastChanged: Date.now(),
    filteredVideos: [],
    selection: null,
    selectedVideos: [],
    dialogDeleteVideo: false,
    dialogEditVideoInfo: false,
    dialogErrorPlayVideo: false,
    dialogFolderTree: false,
    dialogFilterVideos: false,
    errorPlayVideoPath: '',
    deleteFile: false,
    rating: 0,
    updateCardIds: [],
    tree: [],
  }),
  mutations: {
    updateVideos (state, ids) {
      state.lastChanged = Date.now()
      if (ids === undefined) state.updateCardIds = []
      else state.updateCardIds = ids
    },
    updateSelectedVideos(state, ids) { state.selectedVideos = ids },
  },
  actions: {
    changeVideosPerPage({ state, commit, getters, dispatch}, number) {
      // commit('updateVideos')
      commit('resetLoading')
      dispatch('updateSettingsState', {key:'pdfsPerPage', value:number})
    },
    getFilteredVideos({ state, commit, dispatch, getters, rootState}, filters) {
      let pdfs = getters.pdfs
      pdfs = pdfs.orderBy(pdf=>(path.basename(pdf.path)), ['asc'])

      // filter by folder tree
      if (state.tree.length) {
        pdfs = pdfs.filter(pdf => {
          let include = false
          for (let i = 0; i < state.tree.length; i++) {
            if (pdf.path.includes(state.tree[i])) {
              include = true
            }
          }
          return include
        })
      }

      function compare(sign, a, b) {
        if (b===undefined||b===null||b.length==0) return false
        if (sign === 'equal') return a == b
        if (sign === 'not equal') return a != b
        if (sign === 'greater than') return a < b
        if (sign === 'less than') return a > b
        if (sign === 'greater than or equal') return a <= b
        if (sign === 'less than or equal') return a >= b
      }

      for (let filter in filters) {
        let by = filters[filter].by
        let cond = filters[filter].cond
        let val = filters[filter].val
        let type = filters[filter].type
        let flag = filters[filter].flag
        
        if (flag === 'lostVideos' || flag === 'duplicatePdfs') {
          pdfs = pdfs.filter(c=>{
            let include = false
            for (let i of val) if (c[by].includes(i)) {include=true;break}
            return include
          })
          continue
        }

        if (type === 'boolean') {
          if (cond === 'yes') pdfs = pdfs.filter(c => c[by]===true)
          else pdfs = pdfs.filter(c => !c[by]===true)
          continue
        }

        if (type=='string') val = val.toLowerCase().trim()
        if ((val===null||val.length===0)&&(cond!='empty'&&cond!='not empty')) continue
        if (cond=='empty') {
          if (type === 'number') pdfs=pdfs.filter(c=>c[by]===undefined||c[by]===0)
          else pdfs=pdfs.filter(c=>c[by]===undefined||c[by]===null||c[by].length==0)
          continue
        } 
        if (cond=='not empty') {
          if (type === 'number') pdfs=pdfs.filter(c=>c[by]!==undefined&&c[by]!==0)
          else pdfs=pdfs.filter(c=>c[by]!==undefined&&c[by]!==null&&c[by].length>0)
          continue
        }

        if (type === 'number' || type === 'date') {
          if (by === 'height') {
            pdfs = pdfs.filter(c=>{
              let height = Number(c.resolution.match(/\x(.*)/)[1])
              return compare(cond, val, height)
            })
          } else if (by === 'width') {
            pdfs = pdfs.filter(c=>{
              let width = Number(c.resolution.match(/\d*/)[0])
              return compare(cond, val, width)
            })
          } else {
            if (by=='date'||by=='edit'||by=='viewed') val = new Date(val).getTime()
            pdfs = pdfs.filter(c => compare(cond, val, c[by]))
          } 
          continue
        }
        
        if (type === 'string') {
          if (cond=='includes') pdfs=pdfs.filter(c=>{
            let pdfMeta = c[by]
            if (pdfMeta) return pdfMeta.toLowerCase().includes(val)
            else return false
          })
          else pdfs=pdfs.filter(c=>{
            let pdfMeta = c[by]
            if (pdfMeta) return !pdfMeta.toLowerCase().includes(val)
            else return true
          })
          continue
        }

        if (type === 'array' || type === 'select') {
          if (cond === 'includes all') pdfs = pdfs.filter(c=>{
            if (c[by]===undefined) return false
            else return _.isEqual(c[by].sort(), val.sort())
          })
          else if (cond === 'includes one of') pdfs = pdfs.filter(c=>{
            if (c[by]===undefined || c[by].length===0) return false
            else {
              let include = false
              for (let i of val) if (c[by].includes(i)) {include=true;break}
              return include
            }
          })
          else if (cond === 'excludes') pdfs = pdfs.filter(c=>{
            if (c[by]===undefined || c[by].length===0) return false
            else {
              let include = false
              for (let i of val) if (c[by].includes(i)) {include=true;break}
              return !include
            }
          })
        }
      }
      // sort PDFs
      let sortBy = rootState.Settings.pdfSortBy || 'name'
      let sortDirection = rootState.Settings.pdfSortDirection || 'asc'
      if (sortBy === 'name') pdfs = pdfs.orderBy(i=>path.basename(i.path), [sortDirection])
      else if (sortBy === 'resolution') pdfs = pdfs.orderBy(i=>Number(i.resolution.match(/\x(.*)/)[1]), [sortDirection])
      else {
        let meta = getters.meta.find({id:sortBy}).value()
        let defaultValue = 0
        if (meta) {
          if (meta.dataType == 'date') defaultValue = '' 
          else if (meta.dataType=='number' || meta.dataType=='rating') defaultValue = 0 
        }
        pdfs = pdfs.orderBy(i=>i[sortBy]||defaultValue, [sortDirection])
      } 
      // if (state.filters.quality) {
      //   let quality = state.filters.quality
      //   if (quality.length) {
      //     pdfs = pdfs.filter(pdf=>{
      //       let width = +pdf.resolution.match(/\d*/)[0]
      //       let height = +pdf.resolution.match(/\x(.*)/)[1]
      //       if (quality.includes('4K')) {
      //         return width>height && height>1800
      //       }
      //       if (quality.includes('1080')) {
      //         return width>height && height>720 && height<=1080
      //       }
      //       if (quality.includes('720')) {
      //         return width>height && height>480 && height<=720
      //       }
      //       if (quality.includes('480')) {
      //         return width>height && height<=480
      //       }
      //       if (quality.includes('vert')) {
      //         return width<height
      //       }
      //     })
      //     // console.log('pdfs filtered by quality')
      //   }
      // }
      return pdfs
    },
    async filterVideos({ state, commit, dispatch, getters, rootState}, stayOnCurrentPage) {
      let filters = rootState.Settings.pdfFilters
      let pdfs
      await dispatch('getFilteredVideos', filters).then(result => pdfs = result)
      commit('resetLoading')
      state.filteredVideos = pdfs.value()
      if (!stayOnCurrentPage) rootState.Settings.pdfPage = 1
      dispatch('saveFiltersOfVideos')
    },
    saveFiltersOfVideos({state, commit, getters, rootState}) {
      const route = router.currentRoute
      const newFilters = _.cloneDeep(rootState.Settings.pdfFilters)
      const sortDirection = rootState.Settings.pdfSortDirection
      const sortBy = rootState.Settings.pdfSortBy
      const page = rootState.Settings.pdfPage
      const pagesWithVideos = ['/creator/:','/website/:']

      if (route.path.includes('/pdfs/:')) {
        if (route.query.tabId === 'default') {
          getters.settings.set('pdfFilters', newFilters).write()
          getters.settings.set('pdfSortDirection', sortDirection).write()
          getters.settings.set('pdfSortBy', sortBy).write()
          getters.settings.set('pdfPage', page).write()
        } else {
          getters.tabsDb.find({id: +route.query.tabId}).assign({
            name: getters.pdfFiltersForTabName,
            filters: newFilters,
            sortBy: sortBy,
            sortDirection: sortDirection,
            page: page,
          }).write()
          commit('getTabsFromDb')
        }
      } else if (pagesWithVideos.some(page => route.path.includes(page))) {
        if (route.query.tabId !== 'default') {
          getters.tabsDb.find({id: route.query.tabId}).assign({
            filters: newFilters,
            sortBy: sortBy,
            sortDirection: sortDirection,
            page: page,
          }).write()
          commit('getTabsFromDb')
        }
      }
    },
    deleteVideos({state, rootState, commit, dispatch, getters}) {
      getters.getSelectedVideos.map(id => {
        if (getters.tabsDb.find({id: id}).value()) dispatch('closeTab', id)
        const pdf = getters.pdfs.find({'id':id}).value()
        let fileName = path.basename(pdf.path)
        let pdfName = path.parse(pdf.path).name
        // remove pdf file
        if (state.deleteFile) {
          let filePath = getters.pdfs.find({ 'id': id }).value().path
          if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
              if (err) commit('addLog',{type:'error',text:err})
              else commit('addLog',{type:'info',text:`File "${fileName}" was deleted successfully.`})
            })
          } else {
            commit('addLog',{
              type:'error',
              text:`Unable to delete "${fileName}". The file does not exist in the path: "${pdf.path}".`
            })
          }
        }
        // remove pdf from database
        getters.pdfs.remove({ 'id': id }).write()
        // remove pdf from playlists
        getters.playlists.filter({'pdfs': [id]}).each(playlist=>{
          playlist.pdfs = playlist.pdfs.filter(pdf=>(pdf !== id))
        }).write()
        // remove marker from DB and image of marker
        let markers = getters.markers.filter({pdfId: id}).value()
        for (let m = 0; m < markers.length; m++) {
          let imgPath = path.join(getters.getPathToUserData, `/media/markers/${markers[m].id}.jpg`)
          fs.unlink(imgPath, (err) => {
            // if (err) console.log(`failed to delete image of marker "${markers[m].id}", "${markers[m].name}". ${err}`)
            // else console.log(`successfully deleted image of marker "${markers[m].id}", "${markers[m].name}"`)                             
          })
        }

        if (markers.length) getters.markers.remove({pdfId: id}).write()
        // remove thumb, grid and preview of pdf
        let thumbPath = path.join(getters.getPathToUserData, `/media/thumbs/${id}.jpg`)
        fs.unlink(thumbPath, (err) => {
          // if (err) console.log("failed to delete thumb: "+err)
          // else console.log('successfully deleted thumb')
        })
        let gridPath = path.join(getters.getPathToUserData, `/media/grids/${id}.jpg`)
        fs.unlink(gridPath, (err) => {
          // if (err) console.log("failed to delete grid: "+err)
          // else console.log('successfully deleted grid')
        })
        let frames =  [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]
        for (let f = 0; f < frames.length; f++) {
          let framePath = path.join(getters.getPathToUserData, `/media/timelines/${id}_${frames[f]}.jpg`)
          fs.unlink(framePath, (err) => {
            // if (err) console.log("failed to delete grid: "+err)
            // else console.log('successfully deleted grid')
          })
        }
        commit('addLog', {type:'info',text:`📹 Video "${pdfName}" has been removed from DB 🗑️`})
      })
      commit('updateSelectedVideos', [])
      dispatch('filterVideos', true)
      rootState.updateFoldersData = Date.now()
    },
  },
  getters: {
    dbv(state) {
      return state.lastChanged, dbv
    },
    pdfs(state, store) {
      return store.dbv.get('pdfs')
    },
    pdfsDatabase(state, store) {
      return store.dbv
    },
    pdfFiltersForTabName: (state, store, rootState, getters) => {
      let filters = []
      const equals = ['equal', 'includes all', 'includes one of', 'yes']
      const notEquals = ['not equal', 'excludes', 'no']
      
      for (let filter in rootState.Settings.pdfFilters) {
        let by = rootState.Settings.pdfFilters[filter].by
        let cond = rootState.Settings.pdfFilters[filter].cond
        let val = rootState.Settings.pdfFilters[filter].val
        let type = rootState.Settings.pdfFilters[filter].type
        let flag = rootState.Settings.pdfFilters[filter].flag
        
        let metaBy = getters.meta.find({id:by}).value()
        if (metaBy) by = metaBy.settings.name

        if (flag === 'lostVideos') return 'Lost Videos'
        else if (flag === 'duplicatePdfs') return 'Duplicate pdfs'
        if (val === null || val.length === 0) continue
        
        if (equals.includes(cond)) cond = '='
        if (notEquals.includes(cond)) cond = '!='
        
        if (type === 'array' || type === 'select') {
          if (type === 'select') val = val.map(id=>getters.metaCards.find({id}).value().meta.name)
          if (type === 'array') val = val.map(id=>_.find(metaBy.settings.items, {id}).name)
          let arr = `"${by}" ${cond}`
          arr = `${arr} "${val.join(', ')}"` 
          filters.push(arr)
        } else filters.push(`"${by}" ${cond} "${val}"`)
      }
      return 'Videos' + (filters.length ? ' with ': ' ') + filters.join('; ')
    },
    pdfTotal(state, store) { return store.pdfs.value().length },
    pdfsTotalSize: (state, store) => {
      let sizes = store.pdfs.map('size').value()
      let total = 0
      for (let i=0; i<sizes.length; i++) total += sizes[i]
      if (total > 1000000000000) total = (total/1024/1024/1024/1024-0.01).toFixed(2) + ' TB'
      else if (total > 1000000000) total = (total/1024/1024/1024-0.01).toFixed(2) + ' GB'
      else if (total > 1000000) total = (total/1024/1024-0.01).toFixed(2) + ' MB'
      else if (total > 1000) total = (total/1024-0.01).toFixed(2) + ' KB'
      else total += ' B'
      return total
    },
    pdfsTotalDuration: (state, store) => {
      let durations = store.pdfs.map('duration').value()
      let secs = 0
      for (let i of durations) secs += i
      let d = secs / 8.64e4 | 0
      let h = (secs % 8.64e4) / 3.6e3 | 0
      let m = (secs % 3.6e3)  / 60 | 0
      let s = secs % 60
      let z = n=> (n < 10? '0' : '') + n
      return `${d}.${z(h)}:${z(m)}:${z(s)}`
    },
    pdfsOnPage(state, store, rootState) {
      const pdfs = state.filteredVideos, 
            pdfsCount = rootState.Settings.pdfsPerPage
      state.pageTotal = Math.ceil(pdfs.length/pdfsCount)
      if(rootState.Settings.pdfPage > state.pageTotal) rootState.Settings.pdfPage = state.pageTotal
      if (rootState.Settings.pdfPage == 0) rootState.Settings.pdfPage = 1
      const end = rootState.Settings.pdfPage * pdfsCount, start = end - pdfsCount
      return pdfs.slice(start, end)
    },
    pdfsPages(state) {
      let pages = []
      for (let i = 0; i < state.pageTotal; i++) pages.push(i+1)
      return pages
    },
    getSelectedVideos(state) { return state.selectedVideos },
  }
}

export default Videos