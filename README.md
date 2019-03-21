# vue-geo-suggest

[![GitHub open issues](https://img.shields.io/github/issues/Fran Dios/vue-geo-suggest.svg?maxAge=2592000)](https://github.com/Fran Dios/vue-geo-suggest/issues)
[![Npm version](https://img.shields.io/npm/v/vue-geo-suggest.svg?maxAge=2592000)](https://www.npmjs.com/package/vue-geo-suggest)
[![MIT License](https://img.shields.io/github/license/Fran Dios/vue-geo-suggest.svg)](https://github.com/Fran Dios/vue-geo-suggest/blob/master/LICENSE)

## Usage

```HTML
<GeoSuggest
  :search="searchInput"
  :suggest="selectedSuggest"
  @geocoded="geocoded = $event"
>
  <template v-slot="{ suggests, loading }">
    <CustomSearchInput
      v-model="searchInput"
    />
    <CustomSuggestDropdown
      v-model="selectedSuggest"
      :items="suggests"
      :loading="loading"
    />
  </template>
</GeoSuggest>
```

```javascript
import { GeoSuggest, loadGmaps } from 'vue-geo-suggest'

export default {
  components: { GeoSuggest },
  data() {
    return {
      selectedSuggest: null, // Selected suggest from dropdown
      searchInput: '', // Search text
      geocoded: null, // Information about the selected place
    }
  },
  mounted() {
    loadGmaps(process.env.VUE_APP_GCP_PLACES_API_KEY)
  },
}
```

Example with Vuetify:

```HTML
<GeoSuggest
  v-slot="{ suggests, loading }"
  :search="searchInput"
  :suggest="selectedSuggest"
  @geocoded="geocoded = $event"
>
  <VCombobox
    v-model="selectedSuggest"
    :search-input.sync="searchInput"
    :loading="loading"
    :items="suggests"
    item-text="description"
    no-filter
    clearable
  />
</GeoSuggest>
```

## API

### geo-suggest

#### props

- `search` **_String_** (_optional_) `default: undefined`

- `suggest` **_Object_** (_optional_) `default: undefined`

- `min-length` **_Number_** (_optional_) `default: 3`

- `debounce` **_Function_** (_optional_) `default: undefined`

- `location` **_Object_** (_optional_) `default: undefined`

- `radius` **_Number_** (_optional_) `default: undefined`

- `bounds` **_Object_** (_optional_) `default: undefined`

- `country` **_String|Array_** (_optional_) `default: undefined`

- `get-suggest-label` **_Function_** (_optional_) `default: undefined`

- `skip-suggest` **_Function_** (_optional_) `default: undefined`

- `google-maps` **_Object_** (_optional_) `default: undefined`

#### data

- `loading`

**initial value:** `false`

- `gmaps`

**initial value:** `null`

- `autocompleteService`

**initial value:** `null`

- `placesService`

**initial value:** `null`

- `sessionToken`

**initial value:** `null`

- `geocoder`

**initial value:** `null`

- `suggests`

**initial value:** `[object Object]`

#### computed properties

- `debouncedSearchSuggests`

  **dependencies:** `debounce`, `debounce`, `searchSuggests`, `searchSuggests`

#### events

- `service-error`

- `geocoded`

#### methods

- `init()`

- `searchSuggests()`

- `updateSuggests()`

- `geocodeSuggest(suggestToGeocode)`

- `onSuggestGeocoded(suggestToGeocode, gmaps)`

- `extendGeocodedSuggest(suggest)`

## Installation

```
npm install vue-geo-suggest
yarn add vue-geo-suggest
```

## Project setup

```
yarn
```

### Compiles and hot-reloads for development

```
yarn dev
```

### Compiles and minifies for production

```
yarn build
```

### Run your tests

```
yarn test
```

### Lints and fixes files

```
yarn lint
```

### Run your unit tests

```
yarn test:unit
```

### Update the API section of README.md with generated documentation

```
yarn doc:build
```
