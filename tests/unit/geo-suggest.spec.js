import { shallowMount } from '@vue/test-utils'
import GeoSuggest from '@/geo-suggest'
import gmapsStub from './fixtures/gmaps-stub'
import geocodedFixtures from './fixtures/geocoded'
import {
  rawSuggestionFixtures,
  normalizedSuggestionFixtures,
} from './fixtures/suggestions'

describe('geo-suggest', () => {
  beforeEach(() => {
    // gmapsStub.mockReset()
    jest.resetAllMocks()
  })

  it('renders nothing without slots', () => {
    const wrapper = shallowMount(GeoSuggest)
    expect(wrapper.html()).toBeFalsy()
  })

  it('renders default slot without wrappers', () => {
    const child = `<div>child component</div>`
    const wrapper = shallowMount(GeoSuggest, {
      scopedSlots: { default: child },
    })

    expect(wrapper.html()).toMatch(child)
  })

  it('provides slot props to the default slot', () => {
    shallowMount(GeoSuggest, {
      scopedSlots: {
        default(props) {
          expect(props).toMatchObject({
            loading: false,
            suggestions: [],
          })
        },
      },
    })
  })

  it('does not run before initialization', () => {
    const wrapper = shallowMount(GeoSuggest)

    wrapper.setProps({ search: '1234' })
    expect(gmapsStub.getPlacePredictions).not.toHaveBeenCalled()
  })

  it('initializes with gmaps as a prop', () => {
    const wrapper = shallowMount(GeoSuggest, {
      propsData: { googleMaps: gmapsStub },
    })

    wrapper.setProps({ search: '1234' })
    expect(gmapsStub.getPlacePredictions).toHaveBeenCalled()
  })

  it('initializes with global gmaps', () => {
    const wrapper = shallowMount(GeoSuggest)

    window.google = { maps: gmapsStub }

    wrapper.setProps({ search: '1234' })
    expect(gmapsStub.getPlacePredictions).toHaveBeenCalled()
    delete window.google
  })

  describe('suggestions', () => {
    it('does not run for short queries', () => {
      const wrapper = shallowMount(GeoSuggest, {
        propsData: {
          googleMaps: gmapsStub,
          minLength: 2,
        },
      })

      wrapper.setProps({ search: '1' })
      expect(gmapsStub.getPlacePredictions).not.toHaveBeenCalled()

      wrapper.setProps({ search: '12' })
      expect(gmapsStub.getPlacePredictions).toHaveBeenCalled()
    })
    it('accepts a debounce function', () => {
      const debounce = jest.fn(fn => fn)

      const wrapper = shallowMount(GeoSuggest, {
        propsData: {
          googleMaps: gmapsStub,
          debounce,
        },
      })

      wrapper.setProps({ search: '1234' })
      expect(debounce).toHaveBeenCalled()
    })

    it('loads when searching', () => {
      const wrapper = shallowMount(GeoSuggest, {
        propsData: {
          googleMaps: gmapsStub,
        },
      })

      gmapsStub.getPlacePredictions.mockImplementationOnce((_, callback) => {
        expect(wrapper.vm.loading).toEqual(true)
        callback([])
        expect(wrapper.vm.loading).toEqual(false)
      })

      wrapper.setProps({ search: '1234' })
    })

    it('provides normalized suggestions using options', () => {
      const search = '1234'
      const country = 'something'
      const props = {
        types: ['something'],
        location: { something: true },
        bounds: { something: true },
        radius: 5,
      }

      const wrapper = shallowMount(GeoSuggest, {
        propsData: {
          googleMaps: gmapsStub,
          country,
          ...props,
        },
      })

      gmapsStub.getPlacePredictions.mockImplementationOnce(
        (options, callback) => {
          expect(options).toMatchObject({
            ...props,
            input: search,
            sessionToken: { token: true },
            componentRestrictions: { country },
          })

          callback(rawSuggestionFixtures)
        }
      )

      let emitted = wrapper.emitted()
      expect(emitted.suggestions).toHaveLength(1)
      expect(emitted.suggestions[0][0]).toHaveLength(0)

      wrapper.setProps({ search })

      emitted = wrapper.emitted()
      expect(emitted.suggestions).toHaveLength(2)
      expect(emitted.suggestions[0][0]).toHaveLength(0)
      expect(emitted.suggestions[1][0]).toEqual(wrapper.vm.suggestions)

      expect(wrapper.vm.suggestions).toEqual(
        expect.arrayContaining(normalizedSuggestionFixtures)
      )
    })
  })

  describe('geocoded', () => {
    it('provides details about the specified place ID with options', () => {
      const placeDetailFields = ['something']
      const selectedSuggestionFixture = normalizedSuggestionFixtures[0]

      gmapsStub.getDetails.mockImplementationOnce((options, callback) => {
        expect(options).toMatchObject({
          placeId: selectedSuggestionFixture.placeId,
          fields: placeDetailFields,
          sessionToken: { token: true },
        })

        callback(geocodedFixtures, gmapsStub)
      })

      const wrapper = shallowMount(GeoSuggest, {
        propsData: {
          googleMaps: gmapsStub,
          suggestion: selectedSuggestionFixture,
          placeDetailFields,
        },
      })

      expect(wrapper.emitted().geocoded[0][0]).toMatchSnapshot()
    })

    it('geocodes an address with options', () => {
      const country = 'something'
      const props = {
        location: { something: true },
        bounds: { something: true },
      }
      const selectedSuggestionFixture = {
        ...normalizedSuggestionFixtures[0],
        placeId: undefined,
      }

      gmapsStub.geocode.mockImplementationOnce((options, callback) => {
        expect(options).toMatchObject({
          componentRestrictions: { country },
          address: selectedSuggestionFixture.description,
          ...props,
        })

        callback([geocodedFixtures], gmapsStub)
      })

      const wrapper = shallowMount(GeoSuggest, {
        propsData: {
          googleMaps: gmapsStub,
          suggestion: selectedSuggestionFixture,
          country,
          ...props,
        },
      })

      expect(wrapper.emitted().geocoded[0][0]).toMatchSnapshot()
    })

    it('emit errors', () => {
      const status = 'wrong status'

      gmapsStub.getDetails.mockImplementationOnce((_, callback) => {
        callback(geocodedFixtures, status)
      })

      const wrapper = shallowMount(GeoSuggest, {
        propsData: {
          googleMaps: gmapsStub,
          suggestion: normalizedSuggestionFixtures[0],
        },
      })

      expect(wrapper.emitted().error[0][0]).toMatchObject({ status })

      gmapsStub.geocode.mockImplementationOnce((_, callback) => {
        callback([geocodedFixtures], status)
      })

      wrapper.setProps({
        suggestion: { ...normalizedSuggestionFixtures[0], placeId: undefined },
      })

      expect(wrapper.emitted().error[1][0]).toMatchObject({ status })
    })
  })
})
