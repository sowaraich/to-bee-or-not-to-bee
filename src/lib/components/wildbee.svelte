<!-- src/lib/components/WildBee.svelte -->

<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import { beePositions } from "$lib/stores/beeStore";
  import { get } from "svelte/store";

  export let mapMode = false;
  export let count = 100;
  export let id: string = "wildbee"; // unique id so the store can tell bees apart

  let x = 0, y = 0;
  let mounted = false;
  let vx = 1.5, vy = 1.5;
  let w = 800, h = 600;
  let clicked = false;

  let frameIndex = 0;
  let frameCounter = 0;
  let rafId: number;

  const FRAME_W = 143;
  const FRAME_H = 104;
  const TOTAL_FRAMES = 7;

  const MAX_COUNT = 909;
  const MIN_SIZE = 20;
  const MAX_SIZE = 72;

  $: flyScale     = !mapMode && w < 600 ? 0.6 : 1;
  $: scaledWidth  = mapMode ? Math.round(MIN_SIZE + (MAX_SIZE - MIN_SIZE) * Math.sqrt(count / MAX_COUNT)) : Math.round(FRAME_W * flyScale);
  $: scaledHeight = mapMode ? Math.round(scaledWidth * (FRAME_H / FRAME_W)) : Math.round(FRAME_H * flyScale);
  $: sheetWidth   = mapMode ? scaledWidth * TOTAL_FRAMES : Math.round(FRAME_W * TOTAL_FRAMES * flyScale);
  $: sheetHeight  = mapMode ? scaledHeight : Math.round(FRAME_H * flyScale);
  $: bgOffsetX    = mapMode ? -frameIndex * scaledWidth : -frameIndex * scaledWidth;
  $: facingLeft   = vx < 0;

  function handleClick() {
    if (mapMode) return;
    if (clicked) {
      clicked = false;
      vx = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random()) * 1.0;
      vy = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random()) * 1.0;
      return;
    }
    clicked = true;
    vx = 0;
    vy = Math.abs(vy) || 1;
  }

  function checkCollisions() {
    const positions = get(beePositions);

    for (const [otherId, pos] of Object.entries(positions)) {
      if (otherId === id) continue;

      const dx = x - pos.x;
      const dy = y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = FRAME_W; // treat full frame width as collision radius

      if (dist < minDist && dist > 0) {
        // Reflect velocity along the collision normal
        const nx = dx / dist;
        const ny = dy / dist;

        // Dot product of velocity and normal — only bounce if moving toward each other
        const dot = vx * nx + vy * ny;
        if (dot < 0) {
          vx -= 2 * dot * nx;
          vy -= 2 * dot * ny;

          // Nudge apart so they don't get stuck overlapping
          x += nx * (minDist - dist) / 2;
          y += ny * (minDist - dist) / 2;
        }
      }
    }
  }

  function animate() {
    if (!mapMode && !clicked) {
      x += vx;
      y += vy;

      // Bounce off edges
      if (x < 0)                { x = 0;                 vx =  Math.abs(vx); }
      if (x > w - scaledWidth)  { x = w - scaledWidth;   vx = -Math.abs(vx); }
      if (y < 0)                { y = 0;                 vy =  Math.abs(vy); }
      if (y > h - scaledHeight) { y = h - scaledHeight;  vy = -Math.abs(vy); }

      // Check collision with other bees then publish updated position
      checkCollisions();
      beePositions.update(p => ({ ...p, [id]: { x, y } }));
    } else if (!mapMode && clicked) {
      if (y < h - scaledHeight) {
        vy += 0.4;
        y = Math.min(y + vy, h - scaledHeight);
      } else {
        y = h - scaledHeight;
      }
    }

    // Advance spritesheet frames
    if (frameCounter >= 7) {
      frameCounter = 0;
      frameIndex = (frameIndex + 1) % TOTAL_FRAMES;
    }
    frameCounter++;

    rafId = requestAnimationFrame(animate);
  }

  onMount(() => {
    if (!mapMode) {
      x = Math.random() * (w - FRAME_W);
      y = h - FRAME_H;
      clicked = true;
    }
    mounted = true;
    animate();
  });

  onDestroy(() => {
    if (browser) cancelAnimationFrame(rafId);
    // Clean up this bee's entry from the store on unmount
    beePositions.update(p => {
      const next = { ...p };
      delete next[id];
      return next;
    });
  });
</script>

<svelte:window bind:innerWidth={w} bind:innerHeight={h} />

<div
  class="WildBee"
  class:map-mode={mapMode}
  role="button"
  tabindex="0"
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
  style="
    {mapMode ? '' : `transform: translate(${Math.round(x)}px, ${Math.round(y)}px) ${facingLeft ? 'scaleX(-1)' : ''};`}
    width: {scaledWidth}px;
    height: {scaledHeight}px;
    background-position-x: {bgOffsetX}px;
    background-size: {sheetWidth}px {sheetHeight}px;
    pointer-events: {mapMode ? 'none' : 'auto'};
    cursor: {mapMode ? 'default' : 'pointer'};
    opacity: {mounted ? 1 : 0};
  "
></div>

<style>
  .WildBee {
    position: fixed;
    z-index: 9999;
    top: 0;
    left: 0;
    transform-origin: center;
    background-image: url("/pixel_sheets/wildbee_pixelsheet.png");
    background-repeat: no-repeat;
    image-rendering: pixelated;
  }

  .WildBee.map-mode {
    position: relative;
    top: unset;
    left: unset;
    z-index: unset;
  }
</style>