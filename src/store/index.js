const path = require("path")

import Vue from 'vue'
import Vuex from 'vuex'
import Videos from './modules/pdfs.js'
import SavedFilters from './modules/savedFilters.js'
import Playlists from './modules/playlists.js'
import Markers from './modules/markers.js'
import Meta from './modules/meta.js'
import Settings from './modules/settings.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: () => ({
    scan: {
      folders: [],
      files: [],
      stage: 0,
    },
    itemsLoading: true,
    log: [],
    isLogVisible: false,
    notifications: [],
    hoveredImage: false,
    hoveredImageId: '',
    hoveredImageMetaId: '',
    hoveredImageType: '',
    hoveredImageTime: 0,
    hoveredImageX: 0,
    hoveredImageY: 0, 
    x: 0,
    y: 0,
    contextMenu: false,
    contextMenuContent: [],
    pathToUserData: '',
    pdfPlayerVideoId: null,
    pdfPlayerPlaylist: null,
    foldersData: [],
    dialogFolder: false,
    navDrawer: false,
    clipboardMeta: {},
    updateFoldersData: 0,
    backgroundProcesses: [],
    movingFiles: false,
    swatches: ["#ff0000","#ffc800","#00ff0d","#00fbff","#1e00ff","#ff00cc"],
  }),
  getters: {
    getNotifications(state) {
      return state.notifications
    },
    getPathToUserData(state) {
      return path.join(state.pathToUserData, 'userfiles')
    },
  },
  mutations: {
    addLog(state, {text, type, color}) {
      state.log.push({
        type: type,
        text: text,
        color: color,
        time: Date.now(),
      })
    },
    addBackgroundProcess(state, backgroundProcess) { state.backgroundProcesses.push(backgroundProcess) },
    updateTextBackgroundProcess(state, {id, text}) { 
      const index = state.backgroundProcesses.findIndex(x => x.id === id)
      if (index > -1) state.backgroundProcesses[index].text = text
    },
    removeBackgroundProcess(state, id) { state.backgroundProcesses = state.backgroundProcesses.filter(i=>i.id!==id) },
    setNotification(state, notification) {
      state.notifications.push({
        id: Math.ceil(Math.random()*new Date().getTime()),
        showing: true,
        type: notification.type,
        text: notification.text,
      })
    },
    removeNotification(state, id) { state.notifications = state.notifications.filter(n => n.id !== id) },
    clearAllNotifications(state) { state.notifications = [] },
    stopLoading(state) { state.itemsLoading = false },
    resetLoading(state) { state.itemsLoading = true },
  },
  actions: {
    setNotification({ state, commit}, notification) { commit('setNotification', notification) },
    removeNotification({ state, commit}, id) { commit('removeNotification', id) },
    clearAllNotifications({ state, commit}) { commit('clearAllNotifications') },
    updateDataFromVideos({getters, rootState}) {
      const pdfs = getters.pdfs
      // update number of pdfs for meta cards
      let metaAssignedToVideo = getters.meta.filter(m=>
        rootState.Settings.metaAssignedToVideos.find(i=>i.id===m.id)).value()
      for (let m of metaAssignedToVideo) {
        getters.metaCards.filter({metaId:m.id}).each(mc => {
          mc.pdfs = pdfs.filter(v=>{
            if (v[m.id]) return v[m.id].includes(mc.id)
            else return false
          }).value().length
        }).write()
      }
    },
  },
  modules: {
    Videos,
    SavedFilters,
    Playlists,
    Markers,
    Meta,
    Settings,
  }
})
