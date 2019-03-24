# vue-geo-suggest

[![GitHub open issues](https://img.shields.io/github/issues/frandiox/vue-geo-suggest.svg?maxAge=2592000)](https://github.com/frandiox/vue-geo-suggest/issues)
[![Npm version](https://img.shields.io/npm/v/vue-geo-suggest.svg?maxAge=2592000)](https://www.npmjs.com/package/vue-geo-suggest)
[![MIT License](https://img.shields.io/github/license/frandiox/vue-geo-suggest.svg)](https://github.com/frandiox/vue-geo-suggest/blob/master/LICENSE)

## Usage

```HTML
<GeoSuggest
  :search="searchInput"
  :suggestion="selectedSuggestion"
  @geocoded="address = $event.normalizedAddress"
>
  <template v-slot="{ suggestions, loading }">
    <CustomSearchInput
      v-model="searchInput"
    />
    <CustomSuggestDropdown
      v-model="selectedSuggestion"
      :items="suggestions"
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
      selectedSuggestion: null, // Selected suggest from dropdown
      searchInput: '', // Search text
      address: null, // Information about the selected place
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
  v-slot="{ suggestions, loading }"
  :search="searchInput"
  :suggestion="selectedSuggestion"
  @geocoded="address = $event.normalizedAddress"
>
  <VCombobox
    v-model="selectedSuggestion"
    :search-input.sync="searchInput"
    :loading="loading"
    :items="suggestions"
    item-text="description"
    no-filter
    clearable
  />
</GeoSuggest>
```

## API

### geo-suggest 

#### props 

- `search` ***String*** (*optional*) 

  Search string to filter places. A list of place suggestions
  with basic details will be provided based on this text.
  Example: "400 Broadway". 

- `min-length` ***Number*** (*optional*) `default: 3` 

  Minimum length of the search string to trigger a request. 

- `suggestion` ***Object*** (*optional*) 

  Selected suggestion among all the provided values
  to show extended details about the place. This prop must be
  one of the elements inside the provided `suggestions` list.
  Contains `description`, `placeId`, and `matchedSubstrings`. 

- `get-suggestion-label` ***Function*** (*optional*) 

- `skip-suggestion` ***Function*** (*optional*) 

- `debounce` ***Function*** (*optional*) 

  Called whenever the `search` prop changes
  with another function as a single parameter that performs the actual request.
  Useful for debouncing requests with a custom query delay. Works directly with
  [`lodash.debounce`](https://www.npmjs.com/package/lodash.debounce):
  `:debounce="fn => lodashDebounce(fn, msDelay)"` 

- `location` ***Object*** (*optional*) 

  Allows localizing the resulting suggestions.
  See [`google.maps.LatLng`](https://developers.google.com/maps/documentation/javascript/reference#LatLng). 

- `radius` ***Number*** (*optional*) 

  Radius in meters that defines the valid area around the provided location. Must be used with `location` prop. 

- `bounds` ***Object*** (*optional*) 

  Bounds for biasing the suggestions. `location` and `radius` are ignored when using this.
  See [`LatLngBounds`](https://developers.google.com/maps/documentation/javascript/reference?csw=1#LatLngBounds). 

- `country` ***String|Array*** (*optional*) 

  Restricts predictions to the specified countries (ISO 3166-1 Alpha-2 country code, case insensitive)
  Example: `'es'`; `['it', 'fr']`. 

- `place-detail-fields` ***Array*** (*optional*) 

  List of [fields](https://developers.google.com/maps/documentation/javascript/reference/places-service#PlaceDetailsRequest.fields)
  that should be returned by Google Places API. Useful to limited the size of the response and [optimize billing](https://developers.google.com/maps/billing/understanding-cost-of-use#data-skus).
  All the fields are returned by default. 

- `google-maps` ***Object*** (*optional*) 

  Google Maps object to use in case it is not loaded globally. 

#### data 

- `loading` 

  `true` when a request to Google Places API is pending.
  This is provided in the default scoped slot. 

**initial value:** `false` 

- `suggestions` 

  List of suggestions returned by Google Places API based on `search`.
  Each element is an object containing `description`, `placeId` and `matchedSubstrings`.
  This is provided in the default scoped slot. 

**initial value:** `[object Object]` 

#### events 

- `suggestions` 

  Fired when a new list of suggestions is returned by the Google Places API. 

  **arguments:** 

     - `suggestions` **Array** - List of suggestions. 

- `error` 

  Fired when Google Places API fails. 

  **arguments:** 

     - `payload.status` **Object** - The status returned. 

- `geocoded` 

  Fired when the selected suggestion is geocoded and all its details are available. 

  **arguments:** 

     - `payload.description` **String** - Same description string as in the `suggestions` list. 
     - `payload.location` **Object** - Latitude (`lat`) and longitude (`lng`). 
     - `payload.gmaps` **Object** - Complete response for this suggestion. See [its structure here](https://developers.google.com/maps/documentation/javascript/reference#GeocoderResult). 
     - `payload.addressComponentsMap` **Object** - Handy structure that summarizes `gmaps` components. 
     - `payload.normalizedAddress` **Object** - Extended information based on the API result useful for shipping addresses. 

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
