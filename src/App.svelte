<div class="app">
  <Header />
</div>

<script>
  import Header from './components/header/Header.svelte'
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=Open+Sans:400,600');

  :root {
    --padding: 16px 32px;
    --transition-duration: 0.3s;
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
