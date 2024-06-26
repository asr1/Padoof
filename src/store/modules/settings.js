const path = require("path")
const FileSync = require('lowdb/adapters/FileSync')
const app = require('@electron/remote').app
const pathToDbSettings = path.join(app.getPath('userData'), 'userfiles/dbs.json')
const adapterSettings = new FileSync(pathToDbSettings)
const low = require('lowdb')
const dbs = low(adapterSettings)

import router from '@/router'
import Vuetify from '@/plugins/vuetify'

dbs.defaults({
  passwordProtection: false,
  phrase: '',
  passwordHint: '',
  pdfPreviewStatic: 'thumb',
  pdfPreviewHover: 'pdf',
  delayVideoPreview: 0,
  appColorLightPrimary: '#7059b7',
  appColorLightSecondary: '#e98700',
  appColorLightAccent: '#7059b7',
  appColorLightHeader: '#e1d6eb',
  appColorDarkPrimary: '#7059b7',
  appColorDarkSecondary: '#e98700',
  appColorDarkAccent: '#7059b7',
  appColorDarkHeader: '#4D3791',
  darkMode: false,
  headerGradient: true,
  headerGradientLight: 'linear-gradient(to right,#FFC766,#7480DD)',
  headerGradientDark: 'linear-gradient(to right,#B96E3E,#6A54B1)',
  textFont: 'Roboto',
  headerFont: 'Roboto',
  navigationSide: "1",
  numberOfPagesLimit: 7,
  pdfCardSize: 3,
  selectedDisk: '',
  pdfFilters: [],
  pdfSortBy: 'name',
  pdfSortDirection: 'asc',
  pdfPage: 1,
  pdfChipsColored: true,
  pdfEditBtnHidden: false,
  pdfFileNameHidden: false,
  pdfFileInfoHidden: false,
  pdfRatingHidden: false,
  pdfFavoriteHidden: false,
  pdfQualityLabelHidden: false,
  pdfDurationHidden: false,
  ratingAndFavoriteInCard: false,
  metaAssignedToVideos: [],
  pdfView: 0,
  pdfVisibility: {},
  playlistFilters: [],
  playlistSortBy: 'name',
  playlistSortDirection: 'asc',
  playlistPage: 1,
  tabs: [],
  pdfsPerPage: 20,
  playlistsPerPage: 20,
  gapSize: 's',
  isopenPDFInSystemPlayer: false,
  updateIntervalDataFromVideos: 30,
  autoUpdateDataFromVideos: true,
  updateDataAfterAddingnewPdfs: true,
  updateDataFromVideosOnStart: false,
  typingFiltersDefault: false,
  countNumberOfViews: true,
  watchFolders: false,
  folders: [],
  zoom: 1,
  checkForUpdatesAtStartup: true,
  registration: '',
  colorScroll: false,
  tabBorders: true,
  showIconsOfMetaInEditingDialog: true,
  showEmptyMetaValueInCard: true,
  showIconsInsteadTextOnFiltersChips: false,
  showHeaderImageAboveProfile: true,
  showExperimentalFeatures: false,
  showSavedFilters: true,
  databaseVersion: app.getVersion(),
  widgets: {}
}).write()

const Settings = {
  state: () => ({
    passwordProtection: dbs.get('passwordProtection').value(),
    phrase: dbs.get('phrase').value(),
    passwordConfirmed: false,
    passwordHint: dbs.get('passwordHint').value(),
    pdfPreviewStatic: dbs.get('pdfPreviewStatic').value(),
    pdfPreviewHover: dbs.get('pdfPreviewHover').value(),
    delayVideoPreview: dbs.get('delayVideoPreview').value(),
    darkMode: dbs.get('darkMode').value(),
    headerGradient: dbs.get('headerGradient').value(),
    headerGradientLight: dbs.get('headerGradientLight').value(),
    headerGradientDark: dbs.get('headerGradientDark').value(),
    navigationSide: dbs.get('navigationSide').value(),
    appColorLightPrimary: dbs.get('appColorLightPrimary').value(),
    appColorLightSecondary: dbs.get('appColorLightSecondary').value(),
    appColorLightAccent: dbs.get('appColorLightAccent').value(),
    appColorLightHeader: dbs.get('appColorLightHeader').value(),
    appColorDarkPrimary: dbs.get('appColorDarkPrimary').value(),
    appColorDarkSecondary: dbs.get('appColorDarkSecondary').value(),
    appColorDarkAccent: dbs.get('appColorDarkAccent').value(),
    appColorDarkHeader: dbs.get('appColorDarkHeader').value(),
    textFont: dbs.get('textFont').value(),
    headerFont: dbs.get('headerFont').value(),
    lastChanged: Date.now(),
    numberOfPagesLimit: dbs.get('numberOfPagesLimit').value(),
    dialogScanPdfs: false,
    scanProcRun: false,
    ratingAndFavoriteInCard: dbs.get('ratingAndFavoriteInCard').value(),
    selectedDisk: dbs.get('selectedDisk').value() || '',
    pdfFilters: [],
    pdfSortBy: 'name',
    pdfSortDirection: 'asc',
    pdfPage: 1,
    pdfsPerPage: dbs.get('pdfsPerPage').value() || 20,
    pdfCardSize: dbs.get('pdfCardSize').value(),
    pdfChipsColored: dbs.get('pdfChipsColored').value() || true,
    pdfEditBtnHidden: dbs.get('pdfEditBtnHidden').value() || false,
    pdfFileNameHidden: dbs.get('pdfFileNameHidden').value() || false,
    pdfFileInfoHidden: dbs.get('pdfFileInfoHidden').value() || false,
    pdfRatingHidden: dbs.get('pdfRatingHidden').value() || false,
    pdfFavoriteHidden: dbs.get('pdfFavoriteHidden').value() || false,
    pdfQualityLabelHidden: dbs.get('pdfQualityLabelHidden').value() || false,
    pdfDurationHidden: dbs.get('pdfDurationHidden').value() || false,
    metaAssignedToVideos: dbs.get('metaAssignedToVideos').value(),
    pdfView: dbs.get('pdfView').value(),
    pdfVisibility: dbs.get('pdfVisibility').value(),
    playlistsPerPage: dbs.get('playlistsPerPage').value() || 20,
    playlistFilters: [],
    playlistSortBy: 'name',
    playlistSortDirection: 'asc',
    playlistPage: 1,
    tab: null,
    tabs: _.cloneDeep(dbs.get('tabs').value()),
    gapSize: dbs.get('gapSize').value(),
    isopenPDFInSystemPlayer: dbs.get('isopenPDFInSystemPlayer').value(),
    updateIntervalDataFromVideos: dbs.get('updateIntervalDataFromVideos').value(),
    autoUpdateDataFromVideos: dbs.get('autoUpdateDataFromVideos').value(),
    updateDataAfterAddingnewPdfs: dbs.get('updateDataAfterAddingnewPdfs').value(),
    updateDataFromVideosOnStart: dbs.get('updateDataFromVideosOnStart').value(),
    typingFiltersDefault: dbs.get('typingFiltersDefault').value(),
    countNumberOfViews: dbs.get('countNumberOfViews').value(),
    watchFolders: dbs.get('watchFolders').value(),
    folders: dbs.get('folders').value(),
    zoom: dbs.get('zoom').value(),
    checkForUpdatesAtStartup: dbs.get('checkForUpdatesAtStartup').value(),
    registration: dbs.get('registration').value(),
    colorScroll: dbs.get('colorScroll').value(),
    tabBorders: dbs.get('tabBorders').value(),
    showIconsOfMetaInEditingDialog: dbs.get('showIconsOfMetaInEditingDialog').value(),
    showEmptyMetaValueInCard: dbs.get('showEmptyMetaValueInCard').value(),
    showIconsInsteadTextOnFiltersChips: dbs.get('showIconsInsteadTextOnFiltersChips').value(),
    showHeaderImageAboveProfile: dbs.get('showHeaderImageAboveProfile').value(),
    showExperimentalFeatures: dbs.get('showExperimentalFeatures').value(),
    showSavedFilters: dbs.get('showSavedFilters').value(),
    databaseVersion: dbs.get('databaseVersion').value(),
    widgets: dbs.get('widgets').value(),
  }),
  mutations: {
    closeTab(state, tabId) { state.tabs = _.filter(state.tabs, tab => tab.id !== tabId) },
    getTabsFromDb(state, tabs) { state.tabs = _.cloneDeep(dbs.get('tabs').value()) },
    updateSettingsState(state, name) { state[name] = dbs.get(name).cloneDeep().value() },
  },
  actions: {
    saveHeaderGradient({ state, commit, getters}, {gradient, themeDark}) {
      // console.log(themeDark)
      if (themeDark) {
        getters.settings.set('headerGradientDark', gradient).write()
        state.headerGradientDark = gradient
      } else {
        getters.settings.set('headerGradientLight', gradient).write()
        state.headerGradientLight = gradient
      }
    },
    addNewTab({state, rootState, commit, dispatch, getters}, tab) {
      getters.tabsDb.push(tab).write()
      state.tabs.push(tab)
    },
    closeTab({state, rootState, commit, dispatch, getters}, tabId) {
      let currentTab = getters.tabsDb.find({id: tabId}).value()
      if (currentTab) { // if tab is open
        if (currentTab.link === router.currentRoute.fullPath) {
          const numberTabs = getters.tabsDb.value().length
          if (numberTabs > 1) {
            const tabIndex = getters.tabsDb.findIndex({id: tabId}).value()
            if (numberTabs === tabIndex + 1) {
              router.push(getters.tabsDb.value()[tabIndex-1].link)
            } else {
              router.push(getters.tabsDb.value()[tabIndex+1].link)
            } 
          } else router.push('/home')
        }
      }
      getters.tabsDb.remove({id: tabId}).write()
      commit('closeTab', tabId)
    },
    updateSettingsState({state, rootState, commit, dispatch, getters}, {key, value}) {
      getters.settings.set(key, value).write()
      state[key] = value
    },
    updateVuetifyColor({state, rootState, commit, dispatch, getters}, {key, color, theme, type}) {
      getters.settings.set(key, color).write()
      state[key] = color
      Vuetify.framework.theme.themes[theme][type] = color
    },
  },
  getters: {
    dbs(state) { return state.lastChanged, dbs },
    settings(state, store) { return store.dbs },
    tabsDb(state, store) { return store.dbs.get('tabs') },
    tabs(state, store) { return state.tabs },
  }
}

export default Settings