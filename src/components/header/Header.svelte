<script>
  import MenuList from './MenuList.svelte'
  import Popover from './Popover.svelte'
</script>

<header class="header">
  <MenuList />
  <Popover>
    <div slot="products">
      <ul>
        <li>Foo</li>
        <li>Bar</li>
        <li>Baz</li>
      </ul>
    </div>
    <div slot="developers">
      <ul>
        <li>hbsnow</li>
      </ul>
    </div>
    <div slot="company">
      <ul>
        <li>A</li>
        <li>B</li>
        <li>C</li>
        <li>D</li>
      </ul>
    </div>
  </Popover>
</header>


<style>
  .header {
    perspective: 2000px;
  }
</style>
