<!-- src/lib/components/BeeMap.svelte -->

<script>
  // @ts-nocheck
  import { onMount } from 'svelte';

  const MAX_COUNT = 909;
  const MIN_R = 4;
  const MAX_R = 28;

  function circleR(count) {
    return MIN_R + (MAX_R - MIN_R) * Math.sqrt(count / MAX_COUNT);
  }

  const WILD  = { fill: '#29abe2', stroke: '#1a7fad' };
  const HONEY = { fill: '#f9f871', stroke: '#c4a800' };

  // Legend reference sizes (count → radius)
  const sizeRef = [
    { count: 50,  r: Math.round(circleR(50))  },
    { count: 200, r: Math.round(circleR(200)) },
    { count: 500, r: Math.round(circleR(500)) },
    { count: 909, r: Math.round(circleR(909)) },
  ];

  const data2013 = [
    { site: "Bois-de-Liesse",       lat: 45.5007, lng: -73.7647, wild: 349, honey: 9   },
    { site: "Étienne-Desmarteaux",  lat: 45.5581, lng: -73.5782, wild: 382, honey: 15  },
    { site: "Lakeview",             lat: 45.4417, lng: -73.8373, wild: 909, honey: 1   },
    { site: "Laurendeau",           lat: 45.6036, lng: -73.5702, wild: 62,  honey: 1   },
    { site: "Père-Marquette",       lat: 45.5399, lng: -73.5956, wild: 595, honey: 44  },
    { site: "Pointe-aux-Prairies",  lat: 45.6881, lng: -73.5237, wild: 446, honey: 11  },
    { site: "La Présentation",      lat: 45.4434, lng: -73.7366, wild: 251, honey: 1   },
    { site: "Prieur",               lat: 45.5778, lng: -73.6489, wild: 498, honey: 18  },
    { site: "Rosemont",             lat: 45.5654, lng: -73.5685, wild: 793, honey: 13  },
    { site: "Roseraies",            lat: 45.5923, lng: -73.5544, wild: 233, honey: 0   },
    { site: "Shaare Zion",          lat: 45.5503, lng: -73.6557, wild: 144, honey: 4   },
    { site: "Sherbrooke",           lat: 45.4447, lng: -73.6679, wild: 192, honey: 3   },
    { site: "Urgel Bourgie",        lat: 45.5095, lng: -73.6647, wild: 317, honey: 2   },
  ];

  const data2020 = [
    { site: "Bois-de-Liesse",       lat: 45.5007, lng: -73.7647, wild: 755, honey: 44  },
    { site: "Étienne-Desmarteaux",  lat: 45.5581, lng: -73.5782, wild: 430, honey: 347 },
    { site: "George Vanier",        lat: 45.4925, lng: -73.5714, wild: 219, honey: 452 },
    { site: "Lakeview",             lat: 45.4417, lng: -73.8373, wild: 83,  honey: 36  },
    { site: "Laurendeau",           lat: 45.6036, lng: -73.5702, wild: 169, honey: 28  },
    { site: "Père-Marquette",       lat: 45.5399, lng: -73.5956, wild: 429, honey: 604 },
    { site: "Pointe Verte",         lat: 45.4795, lng: -73.5683, wild: 190, honey: 216 },
    { site: "Pointe-aux-Prairies",  lat: 45.6881, lng: -73.5237, wild: 154, honey: 20  },
    { site: "La Présentation",      lat: 45.4434, lng: -73.7366, wild: 53,  honey: 1   },
    { site: "Prieur",               lat: 45.5778, lng: -73.6489, wild: 385, honey: 68  },
    { site: "Rosemont",             lat: 45.5654, lng: -73.5685, wild: 188, honey: 353 },
    { site: "Roseraies",            lat: 45.5923, lng: -73.5544, wild: 258, honey: 61  },
    { site: "Shaare Zion",          lat: 45.5503, lng: -73.6557, wild: 122, honey: 68  },
    { site: "Sherbrooke",           lat: 45.4447, lng: -73.6679, wild: 346, honey: 203 },
    { site: "Urgel Bourgie",        lat: 45.5095, lng: -73.6647, wild: 130, honey: 25  },
  ];

  let currentYear = 2013;
  let leafletMap = null;
  let currentLayer = null;
  let layers = {};

  function buildLayer(L, data) {
    const layer = L.layerGroup();

    for (const d of data) {
      if (d.wild > 0) {
        L.circleMarker([d.lat, d.lng], {
          radius: circleR(d.wild),
          fillColor: WILD.fill,
          color: WILD.stroke,
          weight: 1.5,
          fillOpacity: 0.72,
        })
          .bindTooltip(`<strong>${d.site}</strong><br>Wild bees: <b>${d.wild.toLocaleString()}</b>`, { direction: 'top' })
          .addTo(layer);
      }

      if (d.honey > 0) {
        L.circleMarker([d.lat + 0.003, d.lng + 0.003], {
          radius: circleR(d.honey),
          fillColor: HONEY.fill,
          color: HONEY.stroke,
          weight: 1.5,
          fillOpacity: 0.72,
        })
          .bindTooltip(`<strong>${d.site}</strong><br>Honey bees: <b>${d.honey.toLocaleString()}</b>`, { direction: 'top' })
          .addTo(layer);
      }
    }

    return layer;
  }

  async function showYear(year) {
    if (!leafletMap) return;
    currentYear = year;
    if (currentLayer) leafletMap.removeLayer(currentLayer);
    currentLayer = layers[year];
    currentLayer.addTo(leafletMap);
  }

  onMount(async () => {
    const L = (await import('leaflet')).default;
    await import('leaflet/dist/leaflet.css');

    leafletMap = L.map('bee-map', {
      center: [45.54, -73.65],
      zoom: 11,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(leafletMap);

    // Pre-build both layers so toggling is instant
    layers[2013] = buildLayer(L, data2013);
    layers[2020] = buildLayer(L, data2020);

    currentLayer = layers[2013];
    currentLayer.addTo(leafletMap);

    return () => leafletMap.remove();
  });
</script>

<section class="bee-maps full-bleed">
  <header>
    <h3>The change in honey bee and wild bee concentration in Montreal from 2013 to 2020</h3>
      <p>Each icon is scaled to the number of individuals collected at that site.</p>
  </header>

  <div class="map-wrap">
    <div id="bee-map"></div>

    <div class="legend">
      <div class="legend-group">
        <div class="legend-title">Bee type</div>
        <div class="legend-item">
          <svg width="14" height="14"><circle cx="7" cy="7" r="6" fill={WILD.fill} stroke={WILD.stroke} stroke-width="1.5" fill-opacity="0.72"/></svg>
          Wild bees
        </div>
        <div class="legend-item">
          <svg width="14" height="14"><circle cx="7" cy="7" r="6" fill={HONEY.fill} stroke={HONEY.stroke} stroke-width="1.5" fill-opacity="0.72"/></svg>
          Honey bees
        </div>
      </div>

      <div class="legend-group">
        <div class="legend-title">Individuals collected</div>
        <div class="size-col">
          {#each sizeRef as ref (ref.count)}
            <div class="size-item">
              <svg width={ref.r * 2 + 4} height={ref.r * 2 + 4}>
                <circle
                  cx={ref.r + 2} cy={ref.r + 2} r={ref.r}
                  fill={WILD.fill} stroke={WILD.stroke} stroke-width="1" fill-opacity="0.55"
                />
              </svg>
              <span class="size-label">{ref.count}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <div class="slider-wrap">
    <span class="year-label">
      2013
      <span class="tag tag-before">Before</span>
    </span>

    <div class="slider-inner">
      <input
        type="range"
        min="2013"
        max="2020"
        step="7"
        value={currentYear}
        on:input={(e) => showYear(Number(e.currentTarget.value))}
        class="year-slider"
      />
      <div class="current-year" class:is-2020={currentYear === 2020}>{currentYear}</div>
    </div>

    <span class="year-label">
      2020
      <span class="tag tag-after">After</span>
    </span>
  </div>

  <footer>
    Data: MacInnis, Normandin & Ziter (2023)<br>
    Sites sampled across the Island of Montréal, Québec, Canada
  </footer>
</section>

<style>
  .bee-maps {
    font-family: 'Lato', system-ui, sans-serif;
    color: #444;
    padding: 32px 24px 48px;
  }

  header { text-align: center; margin-bottom: 28px; }

  header h3 {
    font-family: 'Roboto Slab', serif;
    font-size: 1.1rem;
    font-weight: 500;
    color: #404040;
    line-height: 1.3;
    margin-bottom: 6px;
  }

  header h3 em { font-style: italic; color: #c4a800; }

  header p {
    font-size: 0.92rem;
    color: #666;
    max-width: 560px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* ── Slider ── */
  .slider-wrap {
    display: flex;
    align-items: center;
    gap: 16px;
    max-width: 680px;
    margin: 0 auto 24px;
  }

  .year-label {
    font-family: 'Roboto Slab', serif;
    font-size: 0.95rem;
    font-weight: 500;
    color: #555;
    white-space: nowrap;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .tag {
    font-family: 'Lato', sans-serif;
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 2px 7px;
    border-radius: 10px;
  }

  .tag-before { background: #ddf2fc; color: #29abe2; }
  .tag-after  { background: #fffde6; color: #c4a800; }

  .slider-inner {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .current-year {
    font-family: 'Roboto Slab', serif;
    font-size: 1.5rem;
    font-weight: 500;
    color: #29abe2;
    transition: color 0.25s ease;
    line-height: 1;
  }

  .current-year.is-2020 { color: #c4a800; }

  .year-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: linear-gradient(to right, #29abe2, #f9f871);
    outline: none;
    cursor: pointer;
  }

  .year-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid #c4a800;
    box-shadow: 0 1px 5px rgba(0,0,0,0.2);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .year-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  }

  .year-slider::-moz-range-thumb {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid #c4a800;
    box-shadow: 0 1px 5px rgba(0,0,0,0.2);
    cursor: pointer;
  }

  /* ── Map ── */
  .map-wrap {
    position: relative;
    max-width: 1100px;
    margin: 0 auto 22px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #ddd;
  }

  #bee-map { height: 520px; width: 100%; }

  @media (max-width: 600px) {
    #bee-map { height: 350px; }
  }

  /* ── Legend (inside map, right side) ── */
  .legend {
    position: absolute;
    top: 16px;
    right: 12px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 12px 14px;
    background: rgba(255, 255, 255, 0.92);
    border-radius: 8px;
    border: 1px solid #ddd;
    box-shadow: 0 1px 6px rgba(0,0,0,0.15);
    pointer-events: none;
  }

  .legend-group { display: flex; flex-direction: column; gap: 6px; }

  .legend-title {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: #999;
    margin-bottom: 4px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.83rem;
    color: #555;
  }

  .size-col {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .size-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
  }

  .size-label {
    font-size: 0.72rem;
    color: #777;
  }

  /* ── Footer ── */
  footer {
    text-align: center;
    margin-top: 18px;
    font-size: 0.72rem;
    color: #aaa;
    line-height: 1.8;
  }

  /* ── Leaflet overrides ── */
  :global(.leaflet-container) { background: #d4d4d4 !important; }
  :global(#bee-map .leaflet-tile-pane) { filter: grayscale(1) brightness(1.05) contrast(0.88); }
  :global(.leaflet-control-zoom a) { background: #fff !important; color: #444 !important; border-color: #ccc !important; }
  :global(.leaflet-control-attribution) { background: rgba(255,255,255,0.75) !important; color: #888 !important; font-size: 9px; }
  :global(.leaflet-control-attribution a) { color: #888 !important; }
  :global(.leaflet-tooltip) { background: #1e242e; border-color: #2a2e35; color: #e8e6e0; font-size: 0.82rem; }
  :global(.leaflet-tooltip-top::before) { border-top-color: #2a2e35; }
  :global(.leaflet-div-icon) { background: none !important; border: none !important; }
  :global(.site-hit-area) { background: transparent !important; border: none !important; cursor: default; }
</style>