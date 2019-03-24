const extract = (string, regex) =>
  (((string || '').match(regex) || [])[1] || '').replace(
    /&#(\d+);/g,
    (_, code) => String.fromCharCode(code)
  )

export default {
  name: 'GeoSuggest',
  props: {
    search: {
      type: String,
      default: undefined,
    },
    suggestion: {
      type: Object,
      default: undefined,
    },
    minLength: {
      type: Number,
      default: 3,
    },
    debounce: {
      type: Function,
      default: undefined,
    },
    location: {
      type: Object,
      default: undefined,
    },
    radius: {
      type: Number,
      default: undefined,
    },
    bounds: {
      type: Object,
      default: undefined,
    },
    country: {
      type: [String, Array],
      default: undefined,
    },
    placeDetailFields: {
      type: Array,
      default: undefined,
    },
    getSuggestionLabel: {
      type: Function,
      default: undefined,
    },
    skipSuggestion: {
      type: Function,
      default: undefined,
    },
    googleMaps: {
      type: Object,
      default: undefined,
    },
  },
  data() {
    return {
      loading: false,
      gmaps: null,
      autocompleteService: null,
      placesService: null,
      sessionToken: null,
      geocoder: null,
      suggestions: [],
    }
  },
  computed: {
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
    },
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
            this.$emit('service-error', { status })
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

      this.$emit('geocoded', this.extendGeocodedSuggestion(suggestion))
    },
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
