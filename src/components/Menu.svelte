<svelte:options immutable/>

<script>
	export let index
	export let menu
</script>

<style>
	.menu {
    height: 50px;
    padding: 0 25px;
    line-height: 50px;
    border: 0;
    font-size: 16px;
    color: white;
    background:  none;
    font-weight: 500;
    -webkit-font-smoothing: antialiased;
    transition: opacity 0.2s;
  }
  
  .menu:hover {
    opacity: 0.5;
  }
</style>

<button
  class="menu"
  on:mouseenter
  on:mouseleave
>
  {menu}
</button>
