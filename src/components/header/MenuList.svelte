<script>
  import { menuList, activeMenu } from '../../stores.js'
  import Menu from './Menu.svelte'

	const enter = (index) => {
    activeMenu.set(index)
  }

	const leave = () => {
    activeMenu.set(null)
  }
</script>

<nav class="nav">
  {#each $menuList as menu, i}
    <Menu
      {menu}
      index={i}
      on:mouseenter="{() => enter(i)}"
      on:mouseleave="{() => leave()}"
    />
  {/each}
</nav>

<style>
  .nav {
    display: flex;
  }
</style>
