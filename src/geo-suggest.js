const extract = (string, regex) =>
  (((string || '').match(regex) || [])[1] || '').replace(
    /&#(\d+);/g,
    (_, code) => String.fromCharCode(code)
  )

export default {
  name: 'GeoSuggest',
  props: {
    /**
     * Search string to filter places. A list of place suggestions
     * with basic details will be provided based on this text.
     * Example: "400 Broadway".
     */
    search: {
      type: String,
      required: false,
    },
    /**
     * Minimum length of the search string to trigger a request.
     */
    minLength: {
      type: Number,
      default: 3,
    },
    /**
     * Selected suggestion among all the provided values
     * to show extended details about the place. This prop must be
     * one of the elements inside the provided `suggestions` list.
     * Contains `description`, `placeId`, and `matchedSubstrings`.
     * @type Object
     */
    suggestion: {
      required: false,
      validator(value) {
        return (
          (typeof value === 'object' &&
            typeof value.description === 'string') ||
          typeof value === 'string'
        )
      },
    },
    /**
     * Called whenever the `search` prop changes
     * with another function as a single parameter that performs the actual request.
     * Useful for debouncing requests with a custom query delay. Works directly with
     * [`lodash.debounce`](https://www.npmjs.com/package/lodash.debounce):
     * `:debounce="fn => lodashDebounce(fn, msDelay)"`
     */
    debounce: {
      type: Function,
      required: false,
    },
    /**
     * Allows localizing the resulting suggestions.
     * See [`google.maps.LatLng`](https://developers.google.com/maps/documentation/javascript/reference#LatLng).
     */
    location: {
      type: Object,
      required: false,
    },
    /**
     * Radius in meters that defines the valid area around the provided location. Must be used with `location` prop.
     */
    radius: {
      type: Number,
      default: 0,
    },
    /**
     * Bounds for biasing the suggestions. `location` and `radius` are ignored when using this.
     * See [`LatLngBounds`](https://developers.google.com/maps/documentation/javascript/reference?csw=1#LatLngBounds).
     */
    bounds: {
      type: Object,
      required: false,
    },
    /**
     * Restricts predictions to the specified countries (ISO 3166-1 Alpha-2 country code, case insensitive)
     * Example: `'es'`; `['it', 'fr']`.
     */
    country: {
      type: [String, Array],
      required: false,
    },
    /**
     * List of [fields](https://developers.google.com/maps/documentation/javascript/reference/places-service#PlaceDetailsRequest.fields)
     * that should be returned by Google Places API. Useful to reduce the size of the response and [optimize billing](https://developers.google.com/maps/billing/understanding-cost-of-use#data-skus).
     * All the fields are returned by default.
     */
    placeDetailFields: {
      type: Array,
      required: false,
    },
    /**
     * Google Maps object to use in case it is not loaded globally.
     */
    googleMaps: {
      type: Object,
      required: false,
    },
  },
  data() {
    return {
      /**
       * `true` when a request to Google Places API is pending.
       * This is provided in the default scoped slot.
       */
      loading: false,
      /**
       * List of suggestions returned by Google Places API based on `search`.
       * Each element is an object containing `description`, `placeId` and `matchedSubstrings`.
       * This is provided in the default scoped slot.
       */
      suggestions: [],
      /**
       * @private
       */
      $_gmaps: null,
      /**
       * @private
       */
      $_autocompleteService: null,
      /**
       * @private
       */
      $_placesService: null,
      /**
       * @private
       */
      $_sessionToken: null,
      /**
       * @private
       */
      $_geocoder: null,
    }
  },
  computed: {
    /**
     * @private
     */
    $_debouncedSearchSuggestions() {
      return this.debounce
        ? this.debounce(this.$_searchSuggestions)
        : this.$_searchSuggestions
    },
  },
  watch: {
    search: {
      immediate: true,
      handler() {
        this.$_debouncedSearchSuggestions()
      },
    },
    suggestion: {
      immediate: true,
      handler(value) {
        if (value && typeof value === 'object') {
          this.$_geocodeSuggestion(value)
        }
      },
    },
  },
  methods: {
    /**
     * Adds initial references to Google Maps object and all related
     * dependencies. Warns if it's not properly set up.
     * @private
     */
    $_init() {
      if (!this.$_gmaps) {
        if (this.googleMaps) {
          this.$_gmaps = this.googleMaps
        } else if (!window.google) {
          console.warn('Tried to init GeoSuggest before loading GMaps')
          return false
        } else {
          this.$_gmaps = window.google.maps
        }

        this.$_autocompleteService = new this.$_gmaps.places.AutocompleteService()
        this.$_placesService = new this.$_gmaps.places.PlacesService(
          document.createElement('div')
        )
        this.$_sessionToken = new this.$_gmaps.places.AutocompleteSessionToken()
        this.$_geocoder = new this.$_gmaps.Geocoder()
      }

      return true
    },
    /**
     * Makes a request to the API to get suggestions based on `search`.
     * @private
     */
    $_searchSuggestions() {
      if (!this.search) {
        // Empty suggestion list
        this.$_updateSuggestions()
        return
      }

      if (!this.$_gmaps && !this.$_init()) {
        // Not ready, skip
        return
      }

      if (
        (this.minLength && this.search.length < this.minLength) ||
        !this.$_autocompleteService
      ) {
        // Skip short searches
        return
      }

      const options = {
        input: this.search,
        sessionToken: this.$_sessionToken,
        location: this.location,
        radius: this.radius,
        bounds: this.bounds,
        types: this.types,
        componentRestrictions: this.country
          ? { country: this.country }
          : undefined,
      }

      this.loading = true

      this.$_autocompleteService.getPlacePredictions(
        options,
        rawSuggestions => {
          this.loading = false
          this.$_updateSuggestions(rawSuggestions || [])
        }
      )
    },
    /**
     * Reshapes the resulting list of suggestions from an API call.
     * @private
     */
    $_updateSuggestions(rawSuggestions = []) {
      this.suggestions = rawSuggestions.map(suggestion => ({
        placeId: suggestion.place_id,
        description: suggestion.description,
        matchedSubstrings: suggestion.matched_substrings[0],
      }))

      /**
       * Fired when a new list of suggestions is returned by the Google Places API.
       * @param {Array} suggestions List of suggestions.
       */
      this.$emit('suggestions', [...this.suggestions])
    },
    /**
     * Requests extra details for a specific suggestion to the API.
     * @private
     */
    $_geocodeSuggestion(suggestionToGeocode) {
      if (!this.$_geocoder && !this.$_init()) {
        return
      }

      if (suggestionToGeocode.placeId && this.$_placesService) {
        const options = {
          placeId: suggestionToGeocode.placeId,
          sessionToken: this.$_sessionToken,
          fields: this.placeDetailFields,
        }

        this.$_placesService.getDetails(options, (gmaps, status) => {
          if (status === this.$_gmaps.places.PlacesServiceStatus.OK) {
            this.$_sessionToken = new this.$_gmaps.places.AutocompleteSessionToken()
            this.$_onSuggestionGeocoded(suggestionToGeocode, gmaps)
          } else {
            this.$_onServiceError(status)
          }
        })
      } else {
        const options = {
          address: suggestionToGeocode.description,
          bounds: this.bounds,
          location: this.location,
          componentRestrictions: this.country
            ? { country: this.country }
            : undefined,
        }

        this.$_geocoder.geocode(options, ([gmaps], status) => {
          if (status === this.$_gmaps.GeocoderStatus.OK) {
            this.$_onSuggestionGeocoded(suggestionToGeocode, gmaps)
          } else {
            this.$_onServiceError(status)
          }
        })
      }
    },
    /**
     * Emit when API status is not OK
     * @private
     */
    $_onServiceError({ status }) {
      /**
       * Fired when Google Places API fails.
       * @param {Object} payload.status - The status returned.
       */
      this.$emit('error', { status })
    },
    /**
     * Reshape a geocoded suggestion and emits result.
     * @private
     */
    $_onSuggestionGeocoded(suggestionToGeocode, gmaps) {
      const location = (gmaps.geometry || {}).location
      const suggestion = {
        ...suggestionToGeocode,
        gmaps,
        location: location && {
          lat: location.lat(),
          lng: location.lng(),
        },
      }

      /**
       * Fired when the selected suggestion is geocoded and all its details are available.
       * @param {String} payload.description Same description string as in the `suggestions` list.
       * @param {Object} payload.location Latitude (`lat`) and longitude (`lng`).
       * @param {Object} payload.gmaps Complete response for this suggestion. See [its structure here](https://developers.google.com/maps/documentation/javascript/reference#GeocoderResult).
       * @param {Object} payload.addressComponentsMap Handy structure that summarizes `gmaps` components.
       * @param {Object} payload.normalizedAddress Extended information based on the API result useful for shipping addresses.
       * Contains strings for `streetAddress1`, `streetAddress2`, `region`, `city`, `postalCode`, `countryName`, and `countryIso2`.
       * Any of these properties could be undefined if the suggestion doesn't find enough information. `region` format depends on the country.
       */
      this.$emit('geocoded', this.$_extendGeocodedSuggestion(suggestion))
    },
    /**
     * Extends the information of a geocoded suggestion by parsing
     * it and adding extra properties useful for shipping addresses.
     * @private
     */
    $_extendGeocodedSuggestion(suggestion) {
      // Provide address_comopnents in a more handy format
      const map = (suggestion.gmaps.address_components || []).reduce(
        (acc1, comp) => ({
          ...acc1,
          ...comp.types.reduce(
            (acc2, type) => ({
              ...acc2,
              [type]: { longName: comp.long_name, shortName: comp.short_name },
            }),
            {}
          ),
        }),
        {}
      )

      const {
        postal_code: postalCode = {},
        locality = {},
        country = {},
        administrative_area_level_1: aal1 = {},
      } = map

      // Find street address
      let streetAddress2
      let streetAddress1 = extract(
        suggestion.gmaps.adr_address,
        /"street-address"\s*>(.+?)</i
      ).replace(`, ${locality.longName || 'NO MATCH'}`, '')

      if (streetAddress1) {
        streetAddress2 =
          suggestion.gmaps.name !== streetAddress1 ? suggestion.gmaps.name : ''
      } else {
        streetAddress1 = suggestion.gmaps.name
        if (
          map.route &&
          !['street_address', 'route'].some(type =>
            (suggestion.gmaps.types || []).includes(type)
          )
        ) {
          // Smaller level than street (maybe public place), best effort guessing
          streetAddress2 = streetAddress1
          streetAddress1 =
            map.route.longName +
            (map.street_number ? `, ${map.street_number.shortName}` : '')
        }
      }

      // Best effort building a "normalized" address
      const region =
        extract(suggestion.gmaps.adr_address, /"region"\s*>(.+?)</i) ||
        locality.shortName ||
        aal1.shortName

      const normalizedAddress = {
        streetAddress1,
        streetAddress2,
        region,
        city: locality.longName || aal1.longName,
        postalCode: postalCode.longName,
        countryName: country.longName,
        countryIso2: country.shortName,
      }

      return {
        ...suggestion,
        region,
        normalizedAddress,
        addressComponentMap: map,
        formattedAddress: suggestion.gmaps.formatted_address,
        name: suggestion.gmaps.name,
        types: suggestion.gmaps.types,
      }
    },
  },
  render() {
    return this.$scopedSlots.default({
      loading: this.loading,
      suggestions: this.suggestions,
    })
  },
}
