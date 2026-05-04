<script lang="ts">
  import { base } from '$app/paths';
  const bees = [
    { file: 'andrenid',   common: 'Mining Bee',           scientific: 'Andrena sp.'    },
    { file: 'anthidium',  common: 'Wool Carder Bee',       scientific: 'Anthidium sp.'  },
    { file: 'bombus',     common: 'Bumblebee',             scientific: 'Bombus sp.'     },
    { file: 'ceratina',   common: 'Small Carpenter Bee',   scientific: 'Ceratina sp.'   },
    { file: 'halictid',   common: 'Sweat Bee',             scientific: 'Halictidae'     },
    { file: 'megachilid', common: 'Leafcutter Bee',        scientific: 'Megachilidae'   },
    { file: 'melissodes', common: 'Long-horned Bee',       scientific: 'Melissodes sp.' },
    { file: 'osmia',      common: 'Mason Bee',             scientific: 'Osmia sp.'      },
    { file: 'peponapis',  common: 'Squash Bee',            scientific: 'Peponapis sp.'  },
    { file: 'xylocopa',   common: 'Carpenter Bee',         scientific: 'Xylocopa sp.'   },
  ];

  const n = bees.length;
  let active = 0;

  function prev() { active = (active - 1 + n) % n; }
  function next() { active = (active + 1) % n; }
</script>

<section class="bee-carousel full-bleed">
  <header>
    <h3>Wild Bee Diversity</h3>
    <p>Ten wild bee genera that share urban green spaces — and compete with the honeybee for flowers.</p>
  </header>

  <div class="stage">
    <button class="arrow arrow-prev" aria-label="Previous" on:click={prev}>&#8249;</button>

    <div class="track-wrap">
      <div class="track" style="transform: translateX(calc(-{active} * 100%));">
        {#each bees as bee}
          <div class="slide">
            <img src="{base}/bees/{bee.file}.png" alt={bee.common} />
          </div>
        {/each}
      </div>
    </div>

    <button class="arrow arrow-next" aria-label="Next" on:click={next}>&#8250;</button>
  </div>

  <div class="caption">
    <p class="common">{bees[active].common}</p>
    <p class="scientific">{bees[active].scientific}</p>
  </div>

  <div class="dots">
    {#each bees as _, i}
      <button
        class="dot"
        class:active={i === active}
        aria-label="Go to bee {i + 1}"
        on:click={() => active = i}
      ></button>
    {/each}
  </div>
</section>

<style>
  .bee-carousel {
    padding: 40px 0 48px;
    font-family: 'Lato', system-ui, sans-serif;
  }

  header {
    text-align: center;
    margin-bottom: 32px;
    padding: 0 24px;
  }

  header h3 {
    font-family: 'Roboto Slab', serif;
    font-size: 1.1rem;
    font-weight: 500;
    color: #404040;
    margin-bottom: 6px;
  }

  header p {
    font-size: 0.9rem;
    color: #777;
    max-width: 520px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* ── Stage ── */
  .stage {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 0 16px;
  }

  .track-wrap {
    width: min(420px, 80vw);
    overflow: hidden;
    flex-shrink: 0;
  }

  .track {
    display: flex;
    transition: transform 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .slide {
    min-width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .slide img {
    width: 100%;
    max-height: 340px;
    object-fit: contain;
    display: block;
  }

  /* ── Arrows ── */
  .arrow {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid #ddd;
    background: #fff;
    color: #444;
    font-size: 1.7rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    transition: box-shadow 0.15s;
    padding: 0;
  }

  .arrow:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.18); }

  /* ── Caption ── */
  .caption {
    text-align: center;
    margin-top: 20px;
    min-height: 48px;
  }

  .common {
    font-weight: 700;
    font-size: 1rem;
    color: #333;
    margin: 0 0 4px;
  }

  .scientific {
    font-style: italic;
    font-size: 0.85rem;
    color: #888;
    margin: 0;
  }

  /* ── Dots ── */
  .dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 16px;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    border: none;
    background: #ccc;
    cursor: pointer;
    padding: 0;
    transition: background 0.2s, transform 0.2s;
  }

  .dot.active {
    background: #6a8f4b;
    transform: scale(1.35);
  }
</style>
