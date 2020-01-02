import { writable, readable} from 'svelte/store'

export const menuList = readable([
  'products',
  'developers',
  'company'
])

export const activeMenu = writable(null)
