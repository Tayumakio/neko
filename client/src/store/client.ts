import { getterTree, mutationTree, actionTree } from 'typed-vuex'
import { get, set } from '~/utils/localstorage'

export const namespaced = true

export const state = () => ({
  side: get<boolean>('side', false),
  tab: get<string>('tab', 'chat'),
  about: false,
  about_page: '',
  theaterMode: get<boolean>('theaterMode', false),
  chatWidth: get<number>('chatWidth', 350),
})

export const getters = getterTree(state, {})

export const mutations = mutationTree(state, {
  setTab(state, tab: string) {
    state.tab = tab
    set('tab', tab)
  },
  setAbout(state, page: string) {
    state.about_page = page
  },
  toggleAbout(state) {
    state.about = !state.about
  },
  toggleSide(state) {
    state.side = !state.side
    set('side', state.side)
  },
  setSide(state, side: boolean) {
    state.side = side
    set('side', side)
  },
  toggleTheaterMode(state) {
    state.theaterMode = !state.theaterMode
    set('theaterMode', state.theaterMode)
  },
  setTheaterMode(state, theaterMode: boolean) {
    state.theaterMode = theaterMode
    set('theaterMode', theaterMode)
  },
  setChatWidth(state, width: number) {
    state.chatWidth = width
    set('chatWidth', width)
  },
})

export const actions = actionTree({ state, getters, mutations }, {})
