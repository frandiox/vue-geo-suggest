// import { shallowMount } from '@vue/test-utils'
// import GeoSuggest from '@/geo-suggest'
const { shallowMount } = require('@vue/test-utils')
const GeoSuggest = require('@/geo-suggest').default

describe('geo-suggest', () => {
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
})
