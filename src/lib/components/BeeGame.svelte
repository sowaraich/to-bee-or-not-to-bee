<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  // ── Sprite constants ──────────────────────────────────────────────────────
  const FRAME_W = 143, FRAME_H = 104, TOTAL_FRAMES = 7;
  const SCALE   = 0.46;
  const BEE_W   = Math.round(FRAME_W * SCALE);       // 66
  const BEE_H   = Math.round(FRAME_H * SCALE);       // 48
  const SHEET_W = BEE_W * TOTAL_FRAMES;              // 462

  // ── Game constants ────────────────────────────────────────────────────────
  const FLOWER_PX   = 34;
  const COLLECT_R   = 40;
  const P_SPEED     = 3.0;
  const HONEY_SPEED = 2.4;
  const WILD_SPEED  = 1.8;
  const TIMER_SEC   = 15;
  const GOAL        = 10;

  // ── Types ─────────────────────────────────────────────────────────────────
  type State = 'start' | 'playing' | 'won' | 'lost';
  interface NPC {
    id: string; type: 'wild' | 'honey';
    x: number; y: number; vx: number; vy: number;
    fi: number; fc: number; facing: number;
    grabCd: number;   // ms until next flower grab
  }
  interface Flower { id: string; x: number; y: number; full: boolean; }

  // ── Reactive state ────────────────────────────────────────────────────────
  let gs: State   = 'start';
  let hives       = 0;    // setting 0–3
  let flowerSet   = 1;    // setting 0–3
  let timeLeft    = TIMER_SEC;
  let nectar      = 0;
  let px = 0, py = 0, pfi = 0, pfc = 0, pfacing = 1;
  let npcs: NPC[]    = [];
  let flowers: Flower[] = [];

  // ── Internal ──────────────────────────────────────────────────────────────
  let gameEl: HTMLDivElement;
  let gW = 860, gH = 540;
  const keys: Record<string, boolean> = {};
  let raf = 0, tickInt: ReturnType<typeof setInterval>, lastTs = 0;

  // ── Difficulty tables ─────────────────────────────────────────────────────
  const FLOWER_COUNTS  = [4,  9, 16, 25];

  function npcCfg(h: number) {
    if (h === 0) return { wild: 4, honey: 0 };
    if (h === 1) return { wild: 2, honey: 2 };
    if (h === 2) return { wild: 0, honey: 4 };
                 return { wild: 0, honey: 6 };
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  function startGame() {
    nectar = 0; timeLeft = TIMER_SEC;
    if (gameEl) { gW = gameEl.offsetWidth || 860; }

    // Player starts center
    px = gW / 2 - BEE_W / 2;
    py = gH / 2 - BEE_H / 2;
    pfi = 0; pfc = 0; pfacing = 1;

    // Spawn flowers — avoid the spawn zone
    const count = FLOWER_COUNTS[flowerSet];
    flowers = [];
    for (let i = 0; i < count; i++) {
      let fx = 0, fy = 0, tries = 0;
      do {
        fx = FLOWER_PX + Math.random() * (gW - FLOWER_PX * 2);
        fy = FLOWER_PX + Math.random() * (gH - FLOWER_PX * 2);
        tries++;
      } while (tries < 30 && Math.hypot(fx - px, fy - py) < 90);
      flowers.push({ id: `f${i}`, x: fx, y: fy, full: true });
    }

    // Spawn NPC bees
    const { wild, honey } = npcCfg(hives);
    npcs = [];
    let ni = 0;
    for (let i = 0; i < wild;  i++) npcs.push(mkNPC(`w${ni++}`, 'wild'));
    for (let i = 0; i < honey; i++) npcs.push(mkNPC(`h${ni++}`, 'honey'));

    gs = 'playing';

    clearInterval(tickInt);
    tickInt = setInterval(() => {
      if (gs !== 'playing') return;
      timeLeft = Math.max(0, timeLeft - 1);
      if (timeLeft === 0) endGame('lost');
    }, 1000);

    lastTs = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function mkNPC(id: string, type: 'wild' | 'honey'): NPC {
    const spd = type === 'honey' ? HONEY_SPEED : WILD_SPEED;
    const a   = Math.random() * Math.PI * 2;
    return {
      id, type,
      x: Math.random() * (gW - BEE_W),
      y: Math.random() * (gH - BEE_H),
      vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
      fi: 0, fc: 0, facing: 1,
      grabCd: 800 + Math.random() * 1600
    };
  }

  function endGame(result: 'won' | 'lost') {
    gs = result;
    clearInterval(tickInt);
    cancelAnimationFrame(raf);
  }

  // ── Main loop ─────────────────────────────────────────────────────────────
  function loop(ts: number) {
    if (gs !== 'playing') return;
    const dt = Math.min(ts - lastTs, 50);
    lastTs = ts;
    movePlayer();
    moveNPCs(dt);
    checkCollect();
    if (gs === 'playing') checkAllGone();
    if (gs === 'playing') raf = requestAnimationFrame(loop);
  }

  function movePlayer() {
    const l = keys['ArrowLeft']  || keys['a'] || keys['A'];
    const r = keys['ArrowRight'] || keys['d'] || keys['D'];
    const u = keys['ArrowUp']    || keys['w'] || keys['W'];
    const d = keys['ArrowDown']  || keys['s'] || keys['S'];
    const dx = (r ? 1 : 0) - (l ? 1 : 0);
    const dy = (d ? 1 : 0) - (u ? 1 : 0);

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      px = Math.max(0, Math.min(gW - BEE_W, px + (dx / len) * P_SPEED));
      py = Math.max(0, Math.min(gH - BEE_H, py + (dy / len) * P_SPEED));
      if (dx !== 0) pfacing = dx > 0 ? 1 : -1;
    }
    pfc++;
    if (pfc >= 7) { pfc = 0; pfi = (pfi + 1) % TOTAL_FRAMES; }
  }

  function moveNPCs(dt: number) {
    npcs = npcs.map(n => {
      let { x, y, vx, vy, fi, fc, grabCd } = n;

      x += vx; y += vy;
      if (x < 0)           { x = 0;          vx =  Math.abs(vx); }
      if (x > gW - BEE_W)  { x = gW - BEE_W; vx = -Math.abs(vx); }
      if (y < 0)           { y = 0;          vy =  Math.abs(vy); }
      if (y > gH - BEE_H)  { y = gH - BEE_H; vy = -Math.abs(vy); }

      // Slight random steering
      if (Math.random() < 0.004) {
        const spd = n.type === 'honey' ? HONEY_SPEED : WILD_SPEED;
        const a   = Math.atan2(vy, vx) + (Math.random() - 0.5) * 1.2;
        vx = Math.cos(a) * spd;
        vy = Math.sin(a) * spd;
      }

      // NPC flower grab
      grabCd -= dt;
      if (grabCd <= 0) {
        grabCd = 1200 + Math.random() * 1400;
        const idx = flowers.findIndex(
          f => f.full && Math.hypot(f.x - x, f.y - y) < COLLECT_R * 1.8
        );
        if (idx >= 0) {
          flowers[idx] = { ...flowers[idx], full: false };
          flowers = flowers;
        }
      }

      fc++;
      if (fc >= 7) { fc = 0; fi = (fi + 1) % TOTAL_FRAMES; }
      return { ...n, x, y, vx, vy, fi, fc, facing: vx >= 0 ? 1 : -1, grabCd };
    });
  }

  function checkCollect() {
    const cx = px + BEE_W / 2;
    const cy = py + BEE_H / 2;
    let changed = false;
    flowers = flowers.map(f => {
      if (!f.full) return f;
      if (Math.hypot(f.x + FLOWER_PX / 2 - cx, f.y + FLOWER_PX / 2 - cy) < COLLECT_R) {
        nectar++;
        changed = true;
        if (nectar >= GOAL) endGame('won');
        return { ...f, full: false };
      }
      return f;
    });
    if (changed) flowers = flowers;
  }

  function checkAllGone() {
    if (flowers.length > 0 && flowers.every(f => !f.full) && nectar < GOAL) {
      endGame('lost');
    }
  }

  // ── Input ─────────────────────────────────────────────────────────────────
  function kdown(e: KeyboardEvent) {
    keys[e.key] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
      e.preventDefault();
    }
  }
  function kup(e: KeyboardEvent) { delete keys[e.key]; }

  onMount(() => {
    if (gameEl) gW = gameEl.offsetWidth || 860;
    // Populate decorative flowers visible on the start screen
    flowers = Array.from({ length: 28 }, (_, i) => ({
      id: `pre${i}`,
      x: FLOWER_PX + Math.random() * (gW - FLOWER_PX * 2),
      y: FLOWER_PX + Math.random() * (gH - FLOWER_PX * 2),
      full: true
    }));
  });
  onDestroy(() => {
    clearInterval(tickInt);
    if (browser) cancelAnimationFrame(raf);
  });
</script>

<svelte:window on:keydown={kdown} on:keyup={kup} />

<section class="game-section">

  <!-- ── Arena ───────────────────────────────────────────────────────── -->
  <div class="arena" bind:this={gameEl}>

    <!-- ── HUD ───────────────────────────────────────────────────────── -->
    {#if gs === 'playing'}
      <div class="hud">
        <div class="hud-score">
          {#each Array.from({length: GOAL}, (_, i) => i) as i (i)}
            <span class="hive-slot" class:filled={i < nectar}>🍯</span>
          {/each}
        </div>
        <div class="hud-timer" class:danger={timeLeft <= 5}>⏱ {timeLeft}s</div>
      </div>
    {/if}

    <!-- Flowers -->
    {#each flowers as f (f.id)}
      <div class="flower" class:spent={!f.full}
        style="left:{f.x}px;top:{f.y}px;width:{FLOWER_PX}px;height:{FLOWER_PX}px">
        {f.full ? '🌸' : '🌿'}
      </div>
    {/each}

    {#if gs === 'playing'}
      <!-- NPC bees -->
      {#each npcs as n (n.id)}
        <div class="bee" class:honey={n.type === 'honey'}
          style="
            left:{Math.round(n.x)}px;top:{Math.round(n.y)}px;
            width:{BEE_W}px;height:{BEE_H}px;
            background-position-x:{-n.fi * BEE_W}px;
            background-size:{SHEET_W}px {BEE_H}px;
            transform:scaleX({n.facing});
          ">
        </div>
      {/each}

      <!-- Player bee -->
      <div class="bee player"
        style="
          left:{Math.round(px)}px;top:{Math.round(py)}px;
          width:{BEE_W}px;height:{BEE_H}px;
          background-position-x:{-pfi * BEE_W}px;
          background-size:{SHEET_W}px {BEE_H}px;
          transform:scaleX({pfacing});
        ">
      </div>
    {/if}

    <!-- ── Start overlay ─────────────────────────────────────────────── -->
    {#if gs === 'start'}
      <div class="overlay start">
        <div class="start-header">
          <h3 class="game-title-overlay">Honey Comb-at</h3>
          <div class="hero-bee"></div>
        </div>

        <div class="start-bottom">
          <div class="pickers">
            <div class="diff-block">
              <span class="diff-block-label">Flowers</span>
              <div class="icon-row">
                {#each [0,1,2,3] as i (i)}
                  <button class="icon-btn" class:lit={i <= flowerSet} on:click={() => flowerSet = i}>
                    <img src="/game/Yellow_Flower_1.png" alt="" class="pick-img" />
                  </button>
                {/each}
              </div>
              <span class="diff-name">{(['Impossible','Hard','Medium','Easy'])[flowerSet]}</span>
            </div>

            <div class="diff-block">
              <span class="diff-block-label">Hives</span>
              <div class="icon-row">
                {#each [0,1,2,3] as i (i)}
                  <button class="icon-btn" class:lit={i <= hives} on:click={() => hives = i}>
                    <img src="/game/Stup.png" alt="" class="pick-img" />
                  </button>
                {/each}
              </div>
              <span class="diff-name">{(['Easy','Medium','Hard','Impossible'])[hives]}</span>
            </div>
          </div>

          <button class="cta" on:click={startGame}>Start Game</button>
        </div>
      </div>

    <!-- ── Result screens (no overlay) ───────────────────────────────── -->
    {:else if gs === 'won'}
      <div class="result-screen">
        <p class="result-text">You win!</p>
        <button class="result-btn" on:click={() => gs = 'start'}>Play Again</button>
      </div>

    {:else if gs === 'lost'}
      <div class="result-screen">
        <p class="result-text">You lose!</p>
        <button class="result-btn" on:click={() => gs = 'start'}>Try Again</button>
      </div>
    {/if}

  </div><!-- /arena -->
</section>

<style>
  .game-section {
    width: 100%;
    max-width: 960px;
    margin: 3rem auto;
    padding: 0 1rem;
    font-family: system-ui, sans-serif;
    user-select: none;
  }

  /* ── HUD ─────────────────────────────────────────────────────────────── */
  .hud {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.45rem 1.1rem;
    color: #1b3a2a;
    font-size: 1.1rem;
    font-weight: 700;
    text-shadow: 0 1px 3px rgba(255,255,255,0.7);
  }
  .hud-score { display: flex; gap: 0.25rem; font-size: 1.3rem; }
  .hive-slot { opacity: 0.25; transition: opacity 0.2s, transform 0.2s; }
  .hive-slot.filled { opacity: 1; transform: scale(1.2); }
  .hud-timer { font-size: 1.15rem; }
  .hud-timer.danger { color: #cc2200; animation: blink 0.45s infinite alternate; }
  @keyframes blink { to { opacity: 0.45; } }

  /* ── Arena ───────────────────────────────────────────────────────────── */
  .arena {
    position: relative;
    width: 100%;
    height: 540px;
    overflow: hidden;
    background: #aaf489;
    background-image:
      radial-gradient(ellipse at 12% 88%, #88d462 0%, transparent 35%),
      radial-gradient(ellipse at 80% 15%, #98e070 0%, transparent 28%),
      radial-gradient(ellipse at 55% 60%, #b2f08a 0%, transparent 22%),
      radial-gradient(ellipse at 30% 40%, #a8ec82 0%, transparent 18%);
    border: 3px solid #2d6a4f;
    border-radius: 0 0 10px 10px;
  }

  /* ── Flowers ─────────────────────────────────────────────────────────── */
  .flower {
    position: absolute;
    font-size: 1.5rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    transition: opacity 0.3s;
  }
  .flower.spent { opacity: 0.3; }

  /* ── Bee sprites ─────────────────────────────────────────────────────── */
  .bee {
    position: absolute;
    background-image: url('/pixel_sheets/wildbee_pixelsheet.png');
    background-repeat: no-repeat;
    image-rendering: pixelated;
    pointer-events: none;
    transform-origin: center center;
  }
  .bee.honey  { background-image: url('/pixel_sheets/honeybee_pixelsheet.png'); }
  .bee.player {
    filter: drop-shadow(0 0 6px #52b788) drop-shadow(0 0 2px #fff);
    z-index: 5;
  }

  /* ── Overlays ────────────────────────────────────────────────────────── */
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 20;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #fff;
    text-align: center;
    padding: 2rem;
    gap: 0.35rem;
  }
  .overlay.start {
    background: transparent;
    color: #fff;
    justify-content: space-between;
    padding: 3rem 2rem 2.5rem;
  }

  .start-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .start-bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
  }

  /* ── Hero bee (start screen only) ───────────────────────────────────── */
  .hero-bee {
    width: 110px;
    height: 80px;
    background-image: url('/pixel_sheets/wildbee_pixelsheet.png');
    background-repeat: no-repeat;
    background-size: 770px 80px;
    image-rendering: pixelated;
    animation: hero-flap 0.55s steps(7, end) infinite;
    pointer-events: none;
    flex-shrink: 0;
  }
  @keyframes hero-flap {
    from { background-position-x: 0px; }
    to   { background-position-x: -770px; }
  }
  .game-title-overlay {
    font-size: 3.2rem;
    font-weight: 900;
    margin: 0;
    color: #fff;
    text-shadow: 0 2px 10px rgba(0,0,0,0.35);
    letter-spacing: 0.02em;
  }

  /* ── Result screens ──────────────────────────────────────────────────── */
  .result-screen {
    position: absolute;
    inset: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    pointer-events: none;
  }
  .result-text {
    font-size: 4rem;
    font-weight: 900;
    margin: 0;
    color: #fff;
    text-shadow: 0 3px 14px rgba(0,0,0,0.45);
  }
  .result-btn {
    pointer-events: auto;
    padding: 0.5rem 2rem;
    background: rgba(255,255,255,0.2);
    color: #fff;
    border: 2px solid rgba(255,255,255,0.6);
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    backdrop-filter: blur(4px);
    transition: background 0.15s;
  }
  .result-btn:hover { background: rgba(255,255,255,0.35); }

  /* ── Difficulty pickers ──────────────────────────────────────────────── */
  .pickers {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin: 1rem 0;
  }

  .diff-block {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
  }

  .diff-block-label {
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #fff;
    text-shadow: 0 1px 4px rgba(0,0,0,0.3);
    min-width: 52px;
    text-align: right;
  }

  .icon-row { display: flex; gap: 0.35rem; }

  .icon-btn {
    width: 54px;
    height: 54px;
    background: none;
    border: none;
    padding: 2px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: grayscale(1) opacity(0.3);
    transition: transform 0.12s, filter 0.15s;
  }
  .icon-btn:hover { transform: scale(1.1); }
  .icon-btn.lit   { filter: none; }

  .pick-img {
    width: 48px;
    height: 48px;
    object-fit: contain;
    image-rendering: pixelated;
    pointer-events: none;
  }

  .diff-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
    text-shadow: 0 1px 4px rgba(0,0,0,0.3);
    white-space: nowrap;
    min-width: 70px;
  }


  /* ── CTA button ──────────────────────────────────────────────────────── */
  .cta {
    margin-top: 0.6rem;
    padding: 0.65rem 2.6rem;
    background: #52b788;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.12s, transform 0.1s;
  }
  .cta:hover  { background: #40916c; }
  .cta:active { transform: scale(0.97); }
</style>
