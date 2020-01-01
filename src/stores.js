import { writable, readable} from 'svelte/store'

export const menuList = readable([
  'Products',
  'Developers',
  'Company'
])

export const activeMenu = writable(null)
