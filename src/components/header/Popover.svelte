<script>
  import { onMount } from 'svelte'
  import { menuList, activeMenu } from '../../stores.js'

  let dimensions = {}
  let popoverLeft

  let popoverElem
  let productsElem
  let developersElem
  let companyElem
  onMount(() => {
    popoverLeft = popoverElem.getBoundingClientRect().x
    dimensions.products = productsElem.getBoundingClientRect()
    dimensions.developers = developersElem.getBoundingClientRect()
    dimensions.company = companyElem.getBoundingClientRect()
  })

  let lastActiveMenu = null
  $: if ($activeMenu !== null) {
    lastActiveMenu = $activeMenu
  }

  const calcBackgroundScale = () => {
    if (lastActiveMenu === null) return ''
    return `
      scaleX(${dimensions[$menuList[lastActiveMenu]].width / dimensions.products.width})
      scaleY(${dimensions[$menuList[lastActiveMenu]].height / dimensions.products.height})
    `
  }
</script>

<div
  class="popover" 
  class:open="{$activeMenu !== null}"
  bind:this={popoverElem}
>
  <div
    class="content"
    style="
      {lastActiveMenu !== null ? `
        width: ${parseInt(dimensions[$menuList[lastActiveMenu]].width)}px;
        height: ${parseInt(dimensions[$menuList[lastActiveMenu]].height)}px;
      ` : ''
      }
      transform: translateX({lastActiveMenu * 120}px);
    "
  >
    <section
      class="section"
      class:active="{$activeMenu === 0}"
      bind:this={productsElem}
      style="
        width: {dimensions.products ? `${parseInt(dimensions.products.width)}px` : 'auto'};
        height: {dimensions.products ? `${parseInt(dimensions.products.height)}px` : 'auto'};
      "
    >
      <slot name="products" />
    </section>
    <section
      class="section"
      class:active="{$activeMenu === 1}"
      bind:this={developersElem}
      style="
        width: {dimensions.developers ? `${parseInt(dimensions.developers.width)}px` : 'auto'};
        height: {dimensions.developers ? `${parseInt(dimensions.developers.height)}px` : 'auto'};
      "
    >
      <slot name="developers" />
    </section>
    <section
      class="section"
      class:active="{$activeMenu === 2}"
      bind:this={companyElem}
      style="
        width: {dimensions.company ? `${parseInt(dimensions.company.width)}px` : 'auto'};
        height: {dimensions.company ? `${parseInt(dimensions.company.height)}px` : 'auto'};
      "
    >
      <slot name="company" />
    </section>
  </div>

  {#if dimensions.products}
    <div
      class="background"
      style="
        width: {parseInt(dimensions.products.width)}px;
        height: {parseInt(dimensions.products.height)}px;
        transform:
          translateX({lastActiveMenu * 120}px)
          {calcBackgroundScale()}
        ;
      "
    ></div>  
  {/if}
</div>

<style>
  .popover {
    position: absolute;
    left: 0;
    right: 0;
    opacity: 0;
    transform-origin: center -20px;
    transform: rotateX(-15deg);
    transition:
      transform var(--transition-duration),
      opacity var(--transition-duration);
    display: inline-block;
  }

  .popover.open {
    opacity: 1;
    transform: rotateX(0);
  }

  .content {
    position: absolute;
    overflow: hidden;
    z-index: 1;
    top: 0;
    left: 0;
    transition:
      transform var(--transition-duration),
      opacity var(--transition-duration);
  }

  .background {
    position: absolute;
    top: 0;
    left: 0;
    background: white;
    border-radius: 6px;
    box-shadow:
      0 50px 100px -20px rgba(50,50,93,.25),
      0 30px 60px -30px rgba(0,0,0,.3);
    transform-origin: 0 0;
    transition:
      transform var(--transition-duration),
      opacity var(--transition-duration);
  }

  .section {
    position: absolute;
    opacity: 0;
    transition: opacity 0.2s;
    overflow: hidden;
    padding: var(--padding);
  }

  .section.active {
    opacity: 1;
  }
</style>
