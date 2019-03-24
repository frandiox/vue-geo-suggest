<template>
  <VApp id="app">
    <div class="wrapper">
      <GeoSuggest
        v-slot="{ suggestions, loading }"
        :debounce="debounce"
        :search="searchInput"
        :suggestion="selectedSuggestion || null"
        @geocoded="address = { ...$event.normalizedAddress }"
        @service-error="searchInput = ''"
      >
        <VCombobox
          v-model="selectedSuggestion"
          :search-input.sync="searchInput"
          :loading="loading"
          :items="suggestions"
          item-text="description"
          label="Find my address"
          no-filter
          clearable
        />
      </GeoSuggest>

      <div class="address">
        <VTextField label="Address 1" :value="address.streetAddress1" />
        <VTextField label="Address 2" :value="address.streetAddress2" />
        <VTextField label="Region" :value="address.region" />
        <VTextField label="City" :value="address.city" />
        <VTextField label="Postal Code" :value="address.postalCode" />
        <VTextField label="Country" :value="address.countryName" />
      </div>
    </div>
  </VApp>
</template>

<script>
import { GeoSuggest, loadGmaps } from '../src'
import debounce from 'lodash.debounce'

export default {
  components: { GeoSuggest },
  data() {
    return {
      debounce: fn => debounce(fn, 200),
      selectedSuggestion: null,
      searchInput: '',
      address: {},
    }
  },
  mounted() {
    loadGmaps(process.env.VUE_APP_GCP_PLACES_API_KEY)
  },
}
</script>

<style scoped>
.wrapper {
  max-width: 600px;
  width: 100%;
  padding: 24px;
  margin: 0 auto;
}

.address {
  display: flex;
  flex-wrap: wrap;
  margin: 6px -10px;
}

.address > * {
  width: 256px;
  padding: 10px;
}
</style>
