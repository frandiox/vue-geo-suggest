import GeoSuggest from './geo-suggest'
import loadGmaps from './load-gmaps'

// install function executed by Vue.use()
function install(Vue, { apiKey = '' } = {}) {
  if (install.installed) return
  install.installed = true
  Vue.component(GeoSuggest.name, GeoSuggest)
  if (apiKey) loadGmaps(apiKey)
}

// To auto-install when Vue is found
/* global window global */
let GlobalVue = null
if (typeof window !== 'undefined') {
  GlobalVue = window.Vue
} else if (typeof global !== 'undefined') {
  GlobalVue = global.Vue
}

if (GlobalVue) {
  GlobalVue.use({ install })
}

// Inject install function into component - allows component
// to be registered via Vue.use() as well as Vue.component()
GeoSuggest.install = install

export { GeoSuggest, loadGmaps }
export default GeoSuggest
