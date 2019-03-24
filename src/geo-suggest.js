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
     */
    suggestion: {
      type: Object,
      required: false,
    },
    getSuggestionLabel: {
      type: Function,
      required: false,
    },
    skipSuggestion: {
      type: Function,
      required: false,
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
     * that should be returned by Google Places API. Useful to limited the size of the response and [optimize billing](https://developers.google.com/maps/billing/understanding-cost-of-use#data-skus).
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
      gmaps: null,
      /**
       * @private
       */
      autocompleteService: null,
      /**
       * @private
       */
      placesService: null,
      /**
       * @private
       */
      sessionToken: null,
      /**
       * @private
       */
      geocoder: null,
    }
  },
  computed: {
    /**
     * @private
     */
    debouncedSearchSuggestions() {
      return this.debounce
        ? this.debounce(this.searchSuggestions)
        : this.searchSuggestions
    },
  },
  watch: {
    search() {
      this.debouncedSearchSuggestions()
    },
    suggestion(value) {
      if (value) {
        this.geocodeSuggestion(value)
      }
    },
  },
  methods: {
    /**
     * Adds initial references to Google Maps object and all related
     * dependencies. Warns if it's not properly set up.
     * @private
     */
    init() {
      if (!this.gmaps) {
        if (this.googleMaps) {
          this.gmaps = this.googleMaps
        } else if (!window.google) {
          console.warn('Tried to init GeoSuggest before loading GMaps')
          return false
        } else {
          this.gmaps = window.google.maps
        }

        this.autocompleteService = new this.gmaps.places.AutocompleteService()
        this.placesService = new this.gmaps.places.PlacesService(
          document.createElement('div')
        )
        this.sessionToken = new this.gmaps.places.AutocompleteSessionToken()
        this.geocoder = new this.gmaps.Geocoder()
      }

      return true
    },
    /**
     * Makes a request to the API to get suggestions based on `search`.
     * @private
     */
    searchSuggestions() {
      if (!this.search) {
        // Empty suggestion list
        this.updateSuggestions()
        return
      }

      if (!this.gmaps && !this.init()) {
        // Not ready, skip
        return
      }

      if (
        (this.minLength && this.search.length < this.minLength) ||
        !this.autocompleteService
      ) {
        // Skip short searches
        return
      }

      const options = {
        input: this.search,
        sessionToken: this.sessionToken,
        location: this.location,
        radius: this.radius,
        bounds: this.bounds,
        types: this.types,
        componentsRestrictions: this.country
          ? { country: this.country }
          : undefined,
      }

      this.loading = true

      this.autocompleteService.getPlacePredictions(options, rawSuggestions => {
        this.loading = false
        this.updateSuggestions(rawSuggestions || [])
      })
    },
    /**
     * Reshapes the resulting list of suggestions from an API call.
     * @private
     */
    updateSuggestions(rawSuggestions = []) {
      this.suggestions = rawSuggestions.reduce((acc, suggestion) => {
        if (!this.skipSuggestion || !this.skipSuggestion(suggestion)) {
          acc.push({
            isFixture: false,
            placeId: suggestion.place_id,
            description: suggestion.description,
            matchedSubstrings: suggestion.matched_substrings[0],
            label: this.getSuggestionLabel
              ? this.getSuggestionLabel(suggestion)
              : '',
          })
        }

        return acc
      }, [])

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
    geocodeSuggestion(suggestionToGeocode) {
      if (!this.geocoder) {
        return
      }

      if (
        suggestionToGeocode.placeId &&
        !suggestionToGeocode.isFixture &&
        this.placesService
      ) {
        const options = {
          placeId: suggestionToGeocode.placeId,
          sessionToken: this.sessionToken,
          fields: this.placeDetailFields,
        }

        this.placesService.getDetails(options, (gmaps, status) => {
          if (status === this.gmaps.places.PlacesServiceStatus.OK) {
            this.sessionToken = new this.gmaps.places.AutocompleteSessionToken()
            this.onSuggestionGeocoded(suggestionToGeocode, gmaps)
          } else {
            /**
             * Fired when Google Places API fails.
             * @param {Object} payload.status - The status returned.
             */
            this.$emit('error', { status })
          }
        })
      } else {
        const options = {
          address: suggestionToGeocode.label,
          bounds: this.bounds,
          location: this.location,
          componentRestrictions: this.country
            ? { country: this.country }
            : undefined,
        }

        this.geocoder.geocode(options, ([gmaps], status) => {
          if (status === this.gmaps.GeocoderStatus.OK) {
            this.onSuggestionGeocoded(suggestionToGeocode, gmaps)
          }
        })
      }
    },
    /**
     * Reshape a geocoded suggestion and emits result.
     * @private
     */
    onSuggestionGeocoded(suggestionToGeocode, gmaps) {
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
      this.$emit('geocoded', this.extendGeocodedSuggestion(suggestion))
    },
    /**
     * Extends the information of a geocoded suggestion by parsing
     * it and adding extra properties useful for shipping addresses.
     * @private
     */
    extendGeocodedSuggestion(suggestion) {
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
