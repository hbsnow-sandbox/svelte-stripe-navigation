<script>
  import MenuList from './components/MenuList.svelte'
</script>

<div class="app">
  <MenuList />
</div>

<style>
  @import url('https://fonts.googleapis.com/css?family=Open+Sans:400,600');

  :root {
    --padding: 16px 32px;
    --transition-duration: 0.3s;
    --products-width: 490px;
    --products-height: 280px;
    --developers-width: 390px;
    --developers-height: 266px;
    --company-width: 260px;
    --company-height: 296px;
  }

  :global(*) {
    box-sizing: border-box;
    font-family: 'Open Sans', sans-serif;
  }

  :global(body) {
    min-height: 100vh;
    font-family: 'Open Sans', sans-serif;
    background: linear-gradient(-45deg, #19C5FE, #4553FF);
    padding: 20px;
  }
</style>
