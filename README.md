# vue-geo-suggest

[![GitHub open issues](https://img.shields.io/github/issues/frandiox/vue-geo-suggest.svg?maxAge=2592000)](https://github.com/frandiox/vue-geo-suggest/issues)
[![Npm version](https://img.shields.io/npm/v/vue-geo-suggest.svg?maxAge=2592000)](https://www.npmjs.com/package/vue-geo-suggest)
[![MIT License](https://img.shields.io/github/license/frandiox/vue-geo-suggest.svg)](https://github.com/frandiox/vue-geo-suggest/blob/master/LICENSE)
[![Build Status](https://travis-ci.com/frandiox/vue-geo-suggest.svg?branch=master)](https://travis-ci.com/frandiox/vue-geo-suggest)
[![Coverage Status](https://coveralls.io/repos/github/frandiox/vue-geo-suggest/badge.svg?branch=master)](https://coveralls.io/github/frandiox/vue-geo-suggest?branch=master)

<p align="center"><img src="https://github.com/frandiox/vue-geo-suggest/blob/master/sample.gif"></p>

A small, renderless [Vue](https://vuejs.org) component for finding addresses using [Google Places API](https://developers.google.com/places/web-service/intro). The component simply provides a list of suggestions and place information as slot props in order to support custom UI and reduce size (2K gzipped). It is easily pluggable to [Vuetify](https://vuetifyjs.com) and other UI components.

This project was originally based on [`react-geosuggest`](https://github.com/ubilabs/react-geosuggest) and [`vue-google-maps`](https://github.com/xkjyeah/vue-google-maps).

## Installation

```sh
npm install vue-geo-suggest
yarn add vue-geo-suggest
```

Apart from that, an API key is necessary for using Google Places. From the [Google Developer Console](https://console.developers.google.com)'s API Manager Dashboard, enable the following APIs:

- [Google Maps Geocoding API](https://developers.google.com/maps/documentation/geocoding/start).
- [Google Places API Web Service](https://developers.google.com/places/web-service/).
- [Google Maps Javascript API](https://developers.google.com/maps/documentation/javascript/).

Generate an API key and provide it to `loadGmaps` utility.

The component and utilities can be imported directly:

```js
import { GeoSuggest, loadGmaps } from 'vue-geo-suggest'

loadGmaps('my-api-key')
Vue.component(GeoSuggest.name, GeoSuggest) // Or register locally where needed
```

Or used as a plugin:

```js
import GeoSuggest from 'vue-geo-suggest'

Vue.use(GeoSuggest, { apiKey: 'my-api-key' })
```

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
      searchInput: '', // Search text
      selectedSuggestion: null, // Selected suggest from dropdown
      address: null, // Information about the selected place
    }
  },
  mounted() {
    // Load API dependencies globally. This can be called any time
    // before using GeoSuggest component.
    // i.e. in `main.js` or directly in the view where is necessary.
    loadGmaps('my-api-key')
  },
}
```

Example with **Vuetify**:

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

- `search` **_String_** (_optional_)

  Search string to filter places. A list of place suggestions
  with basic details will be provided based on this text.
  Example: "400 Broadway".

- `min-length` **_Number_** (_optional_) `default: 3`

  Minimum length of the search string to trigger a request.

- `suggestion` **_Object_** (_optional_)

  Selected suggestion among all the provided values
  to show extended details about the place. This prop must be
  one of the elements inside the provided `suggestions` list.
  Contains `description`, `placeId`, and `matchedSubstrings`.

- `debounce` **_Function_** (_optional_)

  Called whenever the `search` prop changes
  with another function as a single parameter that performs the actual request.
  Useful for debouncing requests with a custom query delay. Works directly with
  [`lodash.debounce`](https://www.npmjs.com/package/lodash.debounce):
  `:debounce="fn => lodashDebounce(fn, msDelay)"`

- `types` **_Array_** (_optional_)

  Filter suggestions by type. See [types supported](https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service#AutocompletionRequest.types).

- `location` **_Object_** (_optional_)

  Allows localizing the resulting suggestions.
  See [`google.maps.LatLng`](https://developers.google.com/maps/documentation/javascript/reference#LatLng).

- `radius` **_Number_** (_optional_)

  Radius in meters that defines the valid area around the provided location. Must be used with `location` prop.

- `bounds` **_Object_** (_optional_)

  Bounds for biasing the suggestions. `location` and `radius` are ignored when using this.
  See [`LatLngBounds`](https://developers.google.com/maps/documentation/javascript/reference?csw=1#LatLngBounds).

- `country` **_String|Array_** (_optional_)

  Restricts predictions to the specified countries (ISO 3166-1 Alpha-2 country code, case insensitive)
  Example: `'es'`; `['it', 'fr']`.

- `place-detail-fields` **_Array_** (_optional_)

  List of [fields](https://developers.google.com/maps/documentation/javascript/reference/places-service#PlaceDetailsRequest.fields)
  that should be returned by Google Places API. Useful to reduce the size of the response and [optimize billing](https://developers.google.com/maps/billing/understanding-cost-of-use#data-skus).
  All the fields are returned by default.

- `google-maps` **_Object|Function_** (_optional_)

  Google Maps object to use in case it is not loaded globally.

#### data

- `loading`

  `true` when a request to Google Places API is pending.
  This is provided in the default scoped slot.

- `suggestions`

  List of suggestions returned by Google Places API based on `search`.
  Each element is an object containing `description`, `placeId` and `matchedSubstrings`.
  This is provided in the default scoped slot.

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

## Project setup for contributing

```
yarn # Installs dependencies
yarn dev # Compiles and hot-reloads for development
yarn build # Compiles and minifies for production
yarn lint # Lints and fixes files
yarn test:unit # Run tests
yarn doc:build # Update the API section of README.md
```
