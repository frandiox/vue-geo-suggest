import { shallowMount } from '@vue/test-utils'
import GeoSuggest from '@/geo-suggest.vue'

describe('geo-suggest.vue', () => {
  it('renders props.msg when passed', () => {
    const msg = 'new message'
    const wrapper = shallowMount(GeoSuggest, {
      propsData: { msg },
    })
    expect(wrapper.text()).toMatch(msg)
  })
})
