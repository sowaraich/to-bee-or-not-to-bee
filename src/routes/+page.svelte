<script lang="ts">
  import rawBlocks from '$lib/doc.blocks.json';
  import DocRenderer from '$lib/components/DocRenderer.svelte';
  import type { Block } from '$lib/components/DocRenderer.svelte';
  const blocks = rawBlocks as Block[];
  import WildBee from '$lib/components/wildbee.svelte';
  import HoneyBee from '$lib/components/honeybee.svelte';
</script>

<WildBee />
<HoneyBee />

<header class="hero-header">
  <video autoplay muted loop playsinline class="hero-video">
    <source src="/scrolly/01.mp4" type="video/mp4" />
  </video>
  <div class="hero-content">
    <h1 class="text-white text-center display-1">To bee or not to bee</h1>
    <p class="text-white text-center lead">By Sonia Waraich</p>
  </div>
</header>

<!-- blocks[1]: Scrolly — full-bleed, outside container -->
<DocRenderer blocks={[blocks[1]]} />

<!-- blocks[2]: first text section — padded container -->
<div class="container story-section">
  <div class="row justify-content-center">
    <div class="col-12 col-sm-10 col-lg-8 col-xxl-6">
      <DocRenderer blocks={[blocks[2]]} />
    </div>
  </div>
</div>

<!-- blocks[3]: beeMap — full-bleed -->
<DocRenderer blocks={[blocks[3]]} />

<!-- blocks[4]: second text section -->
<div class="container">
  <div class="row justify-content-center">
    <div class="col-12 col-sm-10 col-lg-8 col-xxl-6">
      <DocRenderer blocks={[blocks[4]]} />
    </div>
  </div>
</div>

<!-- blocks[5]: BeeGame — full-bleed via shortcode -->
<DocRenderer blocks={[blocks[5]]} />

<!-- blocks[6]: third text section (Nagoya onwards) -->
<div class="container">
  <div class="row justify-content-center">
    <div class="col-12 col-sm-10 col-lg-8 col-xxl-6">
      <DocRenderer blocks={[blocks[6]]} />
    </div>
  </div>
</div>

<!-- blocks[7]: BeeCarousel — full-bleed via shortcode -->
<DocRenderer blocks={[blocks[7]]} />

<footer class="container-fluid bg-dark text-white p-5">
  <p class="text-center">See template on <a class="text-white" href="https://github.com/jrue/multimedia-template-2026" target="_blank">Github</a></p>
</footer>

<style>
  .hero-header {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hero-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
  }

  .hero-content {
    position: relative;
    z-index: 1;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
  }

  .story-section {
    padding-top: 4rem;
  }
</style>