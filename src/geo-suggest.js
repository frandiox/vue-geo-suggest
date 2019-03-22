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
    suggest: {
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
    getSuggestLabel: {
      type: Function,
      default: undefined,
    },
    skipSuggest: {
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
      suggests: [],
    }
  },
  computed: {
    debouncedSearchSuggests() {
      return this.debounce
        ? this.debounce(this.searchSuggests)
        : this.searchSuggests
    },
  },
  watch: {
    search() {
      this.debouncedSearchSuggests()
    },
    suggest(value) {
      if (value) {
        this.geocodeSuggest(value)
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
    searchSuggests() {
      if (!this.gmaps && !this.init()) {
        // Not ready, skip
        return
      }

      if (!this.search) {
        // Empty suggest list
        this.updateSuggests()
        return
      }

      if (
        (this.minLength && this.search.length < this.minLength) ||
        !this.autocompleteService
      ) {
        // Skip short searchs
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

      this.autocompleteService.getPlacePredictions(options, rawSuggests => {
        this.loading = false
        this.updateSuggests(rawSuggests || [])
      })
    },
    updateSuggests(rawSuggests = []) {
      this.suggests = rawSuggests.reduce((acc, suggest) => {
        if (!this.skipSuggest || !this.skipSuggest(suggest)) {
          acc.push({
            description: suggest.description,
            isFixture: false,
            label: this.getSuggestLabel ? this.getSuggestLabel(suggest) : '',
            matchedSubstrings: suggest.matched_substrings[0],
            placeId: suggest.place_id,
          })
        }

        return acc
      }, [])
    },
    geocodeSuggest(suggestToGeocode) {
      if (!this.geocoder) {
        return
      }

      if (
        suggestToGeocode.placeId &&
        !suggestToGeocode.isFixture &&
        this.placesService
      ) {
        const options = {
          placeId: suggestToGeocode.placeId,
          sessionToken: this.sessionToken,
          fields: this.placeDetailFields,
        }

        this.placesService.getDetails(options, (gmaps, status) => {
          if (status === this.gmaps.places.PlacesServiceStatus.OK) {
            this.sessionToken = new this.gmaps.places.AutocompleteSessionToken()
            this.onSuggestGeocoded(suggestToGeocode, gmaps)
          } else {
            this.$emit('service-error', { status })
          }
        })
      } else {
        const options = {
          address: suggestToGeocode.label,
          bounds: this.bounds,
          location: this.location,
          componentRestrictions: this.country
            ? { country: this.country }
            : undefined,
        }

        this.geocoder.geocode(options, ([gmaps], status) => {
          if (status === this.gmaps.GeocoderStatus.OK) {
            this.onSuggestGeocoded(suggestToGeocode, gmaps)
          }
        })
      }
    },
    onSuggestGeocoded(suggestToGeocode, gmaps) {
      const location = (gmaps.geometry || {}).location
      const suggest = {
        ...suggestToGeocode,
        gmaps,
        location: location && {
          lat: location.lat(),
          lng: location.lng(),
        },
      }

      this.$emit('geocoded', this.extendGeocodedSuggest(suggest))
    },
    extendGeocodedSuggest(suggest) {
      // Provide address_comopnents in a more handy format
      const map = (suggest.gmaps.address_components || []).reduce(
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
        suggest.gmaps.adr_address,
        /"street-address"\s*>(.+?)</i
      ).replace(`, ${locality.longName || 'NO MATCH'}`, '')

      if (streetAddress1) {
        streetAddress2 =
          suggest.gmaps.name !== streetAddress1 ? suggest.gmaps.name : ''
      } else {
        streetAddress1 = suggest.gmaps.name
        if (
          map.route &&
          !['street_address', 'route'].some(type =>
            (suggest.gmaps.types || []).includes(type)
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
        extract(suggest.gmaps.adr_address, /"region"\s*>(.+?)</i) ||
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
        ...suggest,
        region,
        normalizedAddress,
        addressComponentMap: map,
        formattedAddress: suggest.gmaps.formatted_address,
        name: suggest.gmaps.name,
        types: suggest.gmaps.types,
      }
    },
  },
  render() {
    return this.$scopedSlots.default({
      loading: this.loading,
      suggests: this.suggests,
    })
  },
}
