/**
 * Loads the Google Map API.
 *
 * @param {string|object} apiKey API Key, or object with the URL parameters. For example to use
 * the Google Maps Premium API, pass { client: <YOUR-CLIENT-ID> }. You may pass the
 * ersion (as 'v) as a property on this parameter.
 * @param {string} version Google Maps SDK Version.
 *
 * Adapted from {@link https://github.com/xkjyeah/vue-google-maps}
 * @see {@link https://github.com/xkjyeah/vue-google-maps}
 * @access private
 */
export default function loadGmaps(apiKey, version) {
  try {
    // If not within browser context, do not continue processing.
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    if (
      typeof window.google === 'object' &&
      typeof window.google.maps === 'object'
    ) {
      if (typeof window.google.maps.places === 'object') {
        return // google is already loaded, don't try to load it again to prevent errors
      }

      throw new Error(
        'Google Maps is already loaded, but does not contain the places API.'
      )
    }

    window.initVGAMaps =
      window.initVGAMaps ||
      function() {
        this.loaded = true
      }

    if (!window.initVGAMaps.loaded) {
      const googleMapScript = document.createElement('script')
      const options = { libraries: 'places', callback: 'initVGAMaps' }

      // Allow apiKey to be an object.
      // This is to support more esoteric means of loading Google Maps,
      // such as Google for business
      // https://developers.google.com/maps/documentation/javascript/get-api-key#premium-auth

      if (typeof apiKey === 'string') {
        options.key = apiKey
      } else if (typeof apiKey === 'object') {
        Object.keys(apiKey).forEach(key => {
          options[key] = apiKey[key]
        })
      } else {
        throw new TypeError('apiKey should either be a string or an object')
      }

      const parameters = Object.keys(options)
        .map(
          key =>
            `${encodeURIComponent(key)}=${encodeURIComponent(options[key])}`
        )
        .join('&')

      let url = `https://maps.googleapis.com/maps/api/js?${parameters}`

      if (version) {
        url = `${url}&v=${version}`
      }

      googleMapScript.setAttribute('src', url)
      googleMapScript.setAttribute('async', '')
      googleMapScript.setAttribute('defer', '')

      document.body.append(googleMapScript)
    } else {
      throw new Error('LoadGmaps loaded multiple times.')
    }
  } catch (err) {
    err.message = 'LoadGmaps load error:' + err.message
    throw err
  }
}
