<template>
  <div id="app">
    <VApp class="wrapper">
      <GeoSuggest
        v-slot="{ suggests, loading }"
        :debounce="debounce"
        :search="searchInput"
        :suggest="selectedSuggest"
        @geocoded="geocoded = $event"
        @service-error="searchInput = ''"
      >
        <VCombobox
          v-model="selectedSuggest"
          :search-input.sync="searchInput"
          :loading="loading"
          :items="suggests"
          item-text="description"
          label="Find my address"
          no-filter
          clearable
        />
      </GeoSuggest>

      <div>
        Selected:
      </div>
      <div>
        {{ geocoded }}
      </div>
    </VApp>
  </div>
</template>

<script>
import { GeoSuggest, loadGmaps } from '../src'
import debounce from 'lodash.debounce'

export default {
  components: { GeoSuggest },
  data() {
    return {
      debounce: fn => debounce(fn, 200), // Optional delay in ms
      selectedSuggest: null, // Suggest selected from dropdown
      searchInput: '', // Search text
      geocoded: null, // Information about the selected place
    }
  },
  mounted() {
    loadGmaps(process.env.VUE_APP_GCP_PLACES_API_KEY)
  },
}
</script>

<style scoped>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  background-color: rgb(250, 250, 250);
  display: flex;
  justify-content: center;
}

.wrapper {
  max-width: 600px;
  width: 100%;
  padding: 24px;
}
</style>
