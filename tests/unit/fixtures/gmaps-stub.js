const mocks = {
  getPlacePredictions: jest.fn(),
  getDetails: jest.fn(),
  geocode: jest.fn(),
}

const ctors = {
  Geocoder: mockCtor,
  PlacesService: mockCtor,
  AutocompleteService: mockCtor,
  AutocompleteSessionToken: function() {
    return { token: true }
  },
}

const proxy = new Proxy(function() {}, {
  get(target, propKey) {
    const fn = mocks[propKey] || ctors[propKey]
    return fn ? fn : proxy
  },
})

function mockCtor() {
  return proxy
}

export default proxy
