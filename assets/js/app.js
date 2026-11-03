/* ==========================================================================
   Sports Wave — application
   Hash-routed vanilla JS. No build step, no external runtime dependencies.
   ========================================================================== */
(function () {
  "use strict";

  const DATA = window.SW_DATA;
  const CHANNELS = DATA.channels;
  const CATEGORIES = DATA.categories;
  const STREAM_KEY = "sw_streams_v1";
  const WATCHLIST_KEY = "sw_watchlist_v1";

  const app = document.getElementById("app");
  const header = document.getElementById("siteHeader");
  const mobileMenu = document.getElementById("mobileMenu");
  const menuBtn = document.getElementById("menuBtn");

  let currentRoute = null;
  let activeHls = null;
  let pageCleanups = [];
  let hasRendered = false;

  /* ── Utilities ───────────────────────────────────────────────────────── */

  const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const value = JSON.parse(raw);
      return value && typeof value === "object" ? value : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      toast("This browser blocked local storage.");
      return false;
    }
  }

  function getSavedStreams() {
    const saved = readJSON(STREAM_KEY, {});
    return saved && !Array.isArray(saved) ? saved : {};
  }

  function getWatchlist() {
    const list = readJSON(WATCHLIST_KEY, []);
    return Array.isArray(list) ? list.filter((id) => CHANNELS.some((c) => c.id === id)) : [];
  }

  function categoryById(id) {
    return CATEGORIES.find((c) => c.id === id) || null;
  }

  function channelById(id) {
    return CHANNELS.find((c) => c.id === id) || null;
  }

  function channelsIn(categoryId) {
    return CHANNELS.filter((c) => c.category === categoryId);
  }

  function categoryName(id) {
    const cat = categoryById(id);
    return cat ? cat.name : "Channels";
  }

  function normalizeSource(raw) {
    if (!raw) return null;
    const url = (typeof raw === "string" ? raw : raw.url || "").trim();
    if (!/^https?:\/\//i.test(url)) return null;

    let type = typeof raw === "object" && typeof raw.type === "string" ? raw.type.toLowerCase() : "";
    if (!type) {
      if (/(?:youtube\.com|youtu\.be)/i.test(url)) type = "youtube";
      else if (/\.m3u8(?:[?#]|$)/i.test(url)) type = "hls";
      else if (/\.(?:mp4|webm|ogg)(?:[?#]|$)/i.test(url)) type = "mp4";
      else type = "hls";
    }
    return { url, type };
  }

  function resolveSource(channel) {
    if (!channel) return null;
    const saved = getSavedStreams();
    const shipped = window.SW_STREAMS && typeof window.SW_STREAMS === "object" ? window.SW_STREAMS : {};
    return normalizeSource(saved[channel.id]) || normalizeSource(shipped[channel.id]) || normalizeSource(channel.streamUrl);
  }

  function youtubeId(url) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.replace(/^www\./, "") === "youtu.be") {
        return parsed.pathname.split("/").filter(Boolean)[0] || null;
      }
      if (/youtube\.com$/i.test(parsed.hostname.replace(/^www\./, ""))) {
        const v = parsed.searchParams.get("v");
        if (v) return v;
        const match = parsed.pathname.match(/\/(?:embed|live|shorts)\/([^/?#]+)/);
        if (match) return match[1];
      }
    } catch (err) {
      return null;
    }
    return null;
  }

  function isSafeHttpUrl(value) {
    return typeof value === "string" && /^https?:\/\//i.test(value.trim());
  }

  /* ── Icons ───────────────────────────────────────────────────────────── */

  const ICON_STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6l2.6 5.3 5.9.9-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.9z"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
  const ICON_EXT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-8.5 8.5"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
  const ICON_ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const ICON_CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
  const ICON_ANTENNA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12v9M8 21h8"/><circle cx="12" cy="8" r="5"/><path d="M9.5 5.5 12 8l2.5-2.5"/></svg>';
  const ICON_WARN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5M12 16.5v.5"/><path d="M10.3 4.3 2.8 17.6A2 2 0 0 0 4.5 20.6h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z"/></svg>';

  /* ── Cards ───────────────────────────────────────────────────────────── */

  function isSaved(id) {
    return getWatchlist().includes(id);
  }

  function cardHTML(channel) {
    const saved = isSaved(channel.id);
    const source = resolveSource(channel);
    return `
      <article class="channel-card" data-card="${esc(channel.id)}">
        <div class="card-art" style="background:linear-gradient(140deg, ${esc(channel.bg)}, ${esc(channel.bg)} 55%, rgba(0,0,0,.6));--logo-fg:${esc(channel.fg)}">
          <span class="live-badge"><span class="dot"></span>Live TV</span>
          <button class="star-btn${saved ? " is-saved" : ""}" type="button" data-star="${esc(channel.id)}"
            aria-pressed="${saved}" aria-label="${saved ? "Remove" : "Save"} ${esc(channel.name)} ${saved ? "from" : "to"} watchlist">${ICON_STAR}</button>
          <div class="card-wordmark">
            <strong>${esc(channel.logoText)}</strong>
            <small>${esc(channel.logoSub)}</small>
          </div>
          <span class="quality-badge">${esc(channel.quality)}</span>
        </div>
        <div class="card-body">
          <h3><a href="#/watch/${esc(channel.id)}">${esc(channel.name)}</a></h3>
          <p class="card-meta"><span>${esc(channel.country)}</span><span class="sep">•</span><span>${esc(channel.language)}</span></p>
          <span class="card-source${source ? " is-ready" : ""}"><span class="dot"></span>${source ? "Playback ready" : "Official site link"}</span>
        </div>
      </article>`;
  }

  function railHTML(categoryId, limit) {
    const list = channelsIn(categoryId).slice(0, limit || 12);
    return `<div class="rail">${list.map(cardHTML).join("")}</div>`;
  }

  /* ── Home ────────────────────────────────────────────────────────────── */

  function heroHTML() {
    const slides = DATA.slides.map((slide, index) => {
      const channel = channelById(slide.channelId);
      const category = categoryById(slide.category);
      return `
        <article class="hero-slide${index === 0 ? " is-active" : ""}" data-cat="${esc(slide.category)}"
          role="group" aria-roledescription="slide" aria-label="${index + 1} of ${DATA.slides.length}"
          ${index === 0 ? "" : 'aria-hidden="true"'}>
          <img src="${esc(slide.image)}" alt="" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>
          <div class="hero-copy">
            <span class="hero-kicker"><span class="dot"></span>${esc(slide.kicker)}</span>
            <h1>${esc(slide.title)}</h1>
            <p>${esc(slide.text)}</p>
            <div class="hero-actions">
              <a class="btn btn--primary" href="#/category/${esc(slide.category)}">${esc(slide.cta)} ${ICON_ARROW}</a>
              ${channel ? `<a class="btn btn--ghost" href="#/watch/${esc(channel.id)}">Open ${esc(channel.name)}</a>` : ""}
            </div>
          </div>
        </article>`;
    }).join("");

    const dots = DATA.slides.map((slide, index) =>
      `<button class="hero-dot${index === 0 ? " is-active" : ""}" type="button" data-hero-dot="${index}"
        aria-label="Show slide ${index + 1}: ${esc(slide.kicker)}" aria-current="${index === 0 ? "true" : "false"}"></button>`
    ).join("");

    return `
      <section class="hero" data-hero aria-roledescription="carousel" aria-label="Featured categories">
        ${slides}
        <div class="hero-nav">
          <div class="hero-dots">${dots}</div>
          <div class="hero-arrows">
            <button class="hero-arrow" type="button" data-hero-go="-1" aria-label="Previous slide">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
            </button>
            <button class="hero-arrow" type="button" data-hero-go="1" aria-label="Next slide">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </div>
        </div>
      </section>`;
  }

  function categoryTilesHTML() {
    return `
      <div class="category-grid">
        ${CATEGORIES.map((cat) => `
          <a class="category-tile" href="#/category/${esc(cat.id)}">
            <img src="${esc(cat.image)}" alt="" loading="lazy">
            <span class="count">${channelsIn(cat.id).length} channels</span>
            <h3>${esc(cat.name)}</h3>
            <p>${esc(cat.blurb.split(".")[0])}.</p>
          </a>`).join("")}
      </div>`;
  }

  function renderHome() {
    const featured = CHANNELS.filter((c) => c.featured);
    return `
      <div class="container">
        ${heroHTML()}

        <section class="section">
          <div class="section-head">
            <div>
              <h2>Browse by category</h2>
              <p>Four worlds, one guide.</p>
            </div>
          </div>
          ${categoryTilesHTML()}
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <h2>Featured channels</h2>
              <p>A hand-picked mix of sport, nature and family brands.</p>
            </div>
            <a class="section-link" href="#/live-tv">View all ${ICON_CHEV}</a>
          </div>
          <div class="rail">${featured.map(cardHTML).join("")}</div>
        </section>

        ${CATEGORIES.map((cat) => `
          <section class="section">
            <div class="section-head">
              <div>
                <h2>${esc(cat.name)}</h2>
                <p>${esc(cat.blurb)}</p>
              </div>
              <a class="section-link" href="#/category/${esc(cat.id)}">View all ${ICON_CHEV}</a>
            </div>
            ${railHTML(cat.id)}
          </section>`).join("")}
      </div>`;
  }

  function initHome() {
    const hero = document.querySelector("[data-hero]");
    if (!hero) return;

    const slides = Array.from(hero.querySelectorAll(".hero-slide"));
    const dots = Array.from(hero.querySelectorAll("[data-hero-dot]"));
    const ac = new AbortController();
    let index = 0;
    let timer = null;
    let paused = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function go(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === index);
        slide.setAttribute("aria-hidden", i === index ? "false" : "true");
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === index);
        dot.setAttribute("aria-current", i === index ? "true" : "false");
      });
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    function start() {
      stop();
      if (reduced || paused || document.hidden) return;
      timer = window.setInterval(() => go(index + 1), 6500);
    }

    hero.addEventListener("click", (event) => {
      const dot = event.target.closest("[data-hero-dot]");
      if (dot) { go(Number(dot.dataset.heroDot)); start(); return; }
      const arrow = event.target.closest("[data-hero-go]");
      if (arrow) { go(index + Number(arrow.dataset.heroGo)); start(); }
    }, { signal: ac.signal });

    hero.addEventListener("mouseenter", () => { paused = true; stop(); }, { signal: ac.signal });
    hero.addEventListener("mouseleave", () => { paused = false; start(); }, { signal: ac.signal });
    hero.addEventListener("focusin", () => { paused = true; stop(); }, { signal: ac.signal });
    hero.addEventListener("focusout", () => { paused = false; start(); }, { signal: ac.signal });

    hero.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); go(index - 1); start(); }
      if (event.key === "ArrowRight") { event.preventDefault(); go(index + 1); start(); }
    }, { signal: ac.signal });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop(); else start();
    }, { signal: ac.signal });

    start();
    pageCleanups.push(() => { stop(); ac.abort(); });
  }

  /* ── Category page ───────────────────────────────────────────────────── */

  function renderCategory(categoryId) {
    const cat = categoryById(categoryId);
    if (!cat) return null;
    const list = channelsIn(cat.id);
    const ready = list.filter((c) => resolveSource(c)).length;

    return `
      <div class="container">
        <section class="cat-banner">
          <img src="${esc(cat.image)}" alt="" ${cat.id === "hockey" ? 'style="object-position:center 30%"' : ""}>
          <div>
            <span class="eyebrow">${esc(cat.short)}</span>
            <h1>${esc(cat.name)} channels</h1>
            <p>${esc(cat.blurb)}</p>
            <div class="banner-meta">
              <span><span class="dot"></span>${list.length} channels in the guide</span>
              <span>${ready ? `${ready} playable here` : "Official links for every channel"}</span>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <h2>All ${esc(cat.name.toLowerCase())} channels</h2>
              <p>Open a channel to check its source status and details.</p>
            </div>
            <a class="section-link" href="#/live-tv">All categories ${ICON_CHEV}</a>
          </div>

          <div class="chips" style="margin-bottom:16px">
            ${CATEGORIES.map((item) => `
              <a class="chip${item.id === cat.id ? " is-active" : ""}" href="#/category/${esc(item.id)}">${esc(item.short)}</a>`).join("")}
          </div>

          <div class="toolbar">
            <span class="result-count" data-grid-count><strong>${list.length}</strong> channels</span>
            <div class="toolbar-end">
              <input class="filter-input" type="search" placeholder="Filter ${esc(cat.name.toLowerCase())}…" data-grid-search aria-label="Filter channels">
            </div>
          </div>

          <div class="channel-grid" data-grid data-grid-cat="${esc(cat.id)}">
            ${list.map(cardHTML).join("")}
          </div>
        </section>
      </div>`;
  }

  /* ── Live TV ─────────────────────────────────────────────────────────── */

  function renderLiveTV() {
    const ready = CHANNELS.filter((c) => resolveSource(c)).length;
    return `
      <div class="container page-shell">
        <header class="page-head">
          <div>
            <span class="eyebrow">Channel guide</span>
            <h1>Live TV</h1>
            <p>${CHANNELS.length} real broadcasters across cricket, hockey, wildlife and cartoons. Every channel opens its official site; embedded playback appears only when an authorised source is attached.${ready ? ` ${ready} channel${ready === 1 ? " is" : "s are"} currently playable here.` : ""}</p>
          </div>
        </header>

        <div class="toolbar">
          <div class="chips" role="group" aria-label="Filter by category">
            <button class="chip is-active" type="button" data-grid-chip="all">All</button>
            ${CATEGORIES.map((cat) => `<button class="chip" type="button" data-grid-chip="${esc(cat.id)}">${esc(cat.short)}</button>`).join("")}
          </div>
          <div class="toolbar-end">
            <span class="result-count" data-grid-count></span>
            <input class="filter-input" type="search" placeholder="Search channels…" data-grid-search aria-label="Search channels">
          </div>
        </div>

        <div class="channel-grid" data-grid data-grid-cat="all">
          ${CHANNELS.map(cardHTML).join("")}
        </div>
      </div>`;
  }

  function gridSearchText(channel) {
    return [channel.name, channel.category, categoryName(channel.category), channel.country, channel.language, channel.logoText]
      .join(" ").toLowerCase();
  }

  function initGridFilter() {
    const grid = document.querySelector("[data-grid]");
    if (!grid) return;

    let category = grid.dataset.gridCat || "all";
    let query = "";
    const input = document.querySelector("[data-grid-search]");
    const counter = document.querySelector("[data-grid-count]");
    const chips = Array.from(document.querySelectorAll("[data-grid-chip]"));
    const ac = new AbortController();

    function paint() {
      const needle = query.trim().toLowerCase();
      const list = CHANNELS.filter((channel) => {
        if (category !== "all" && channel.category !== category) return false;
        return !needle || gridSearchText(channel).includes(needle);
      });

      grid.innerHTML = list.length
        ? list.map(cardHTML).join("")
        : `<div class="empty-state"><div class="empty-icon">${ICON_ANTENNA}</div><h2>No channels found</h2><p>Try a different name, category or country.</p></div>`;

      if (counter) {
        counter.innerHTML = `<strong>${list.length}</strong> channel${list.length === 1 ? "" : "s"}`;
      }
      chips.forEach((chip) => {
        const active = chip.dataset.gridChip === category;
        chip.classList.toggle("is-active", active);
        chip.setAttribute("aria-pressed", String(active));
      });
    }

    chips.forEach((chip) => {
      chip.addEventListener("click", () => { category = chip.dataset.gridChip; paint(); }, { signal: ac.signal });
    });
    if (input) {
      input.addEventListener("input", () => { query = input.value; paint(); }, { signal: ac.signal });
    }
    paint();
    pageCleanups.push(() => ac.abort());
  }

  /* ── Watch ───────────────────────────────────────────────────────────── */

  function playerEmptyHTML(channel) {
    const official = isSafeHttpUrl(channel.officialUrl)
      ? `<a class="btn btn--primary btn--sm" href="${esc(channel.officialUrl)}" target="_blank" rel="noopener noreferrer">Visit official site ${ICON_EXT}</a>`
      : "";
    const addSource = `<a class="btn btn--ghost btn--sm" href="#/studio?channel=${esc(channel.id)}">Add authorised source</a>`;
    return `
      <div class="player-empty">
        <div class="player-empty-inner">
          <div class="player-icon">${ICON_ANTENNA}</div>
          <h2>Watch this channel officially</h2>
          <p>Sports Wave is a guide, not a broadcaster. Continue to ${esc(channel.name)}'s official site, or attach a stream source you are authorised to distribute.</p>
          <div class="hero-actions" style="justify-content:center">
            ${official || addSource}
            ${official ? addSource : ""}
          </div>
          <p class="fine">No embedded broadcast is supplied with this listing.</p>
        </div>
      </div>`;
  }

  function watchPanelHTML(channel, source) {
    return `
      <div class="watch-panel">
        <div class="panel">
          <h2>About this channel</h2>
          <p>${esc(channel.description)}</p>
          ${isSafeHttpUrl(channel.officialUrl) ? `
            <a class="link-out" href="${esc(channel.officialUrl)}" target="_blank" rel="noopener noreferrer">
              Visit the official channel ${ICON_EXT}
            </a>` : ""}
        </div>
        <div class="panel">
          <h2>Playback &amp; rights</h2>
          ${source ? `
            <p>A source is attached for this channel. If it fails to play, the link may have expired or be restricted to another region.</p>
            <dl>
              <div><dt>Source type</dt><dd>${esc(source.type.toUpperCase())}</dd></div>
              <div><dt>Added by</dt><dd>${getSavedStreams()[channel.id] ? "You (this browser)" : "Site owner"}</dd></div>
            </dl>` : `
            <p>No source is attached. Only add a stream link you are licensed or otherwise authorised to use, then save it in Stream Studio.</p>
            <dl>
              <div><dt>Channel quality</dt><dd>${esc(channel.quality)}</dd></div>
              <div><dt>Official site</dt><dd>${isSafeHttpUrl(channel.officialUrl) ? "Linked" : "Not listed"}</dd></div>
            </dl>`}
        </div>
      </div>`;
  }

  function renderWatch(channel) {
    if (!channel) return null;
    const source = resolveSource(channel);
    const saved = isSaved(channel.id);
    const others = channelsIn(channel.category).filter((c) => c.id !== channel.id).slice(0, 5);
    const cat = categoryById(channel.category);
    const officialUrl = isSafeHttpUrl(channel.officialUrl) ? channel.officialUrl : null;

    return `
      <div class="container">
        <div class="watch-layout">
          <div class="watch-main">
            <nav class="breadcrumb" aria-label="Breadcrumb">
              <a href="#/">Home</a>${ICON_CHEV}
              <a href="#/category/${esc(channel.category)}">${esc(categoryName(channel.category))}</a>${ICON_CHEV}
              <span class="current">${esc(channel.name)}</span>
            </nav>

            <div class="player-frame" data-player data-channel="${esc(channel.id)}">
              ${source ? '<div class="player-loading"><span class="spinner" role="status" aria-label="Loading player"></span></div>' : playerEmptyHTML(channel)}
            </div>

            <div class="watch-title-row">
              <div>
                <h1>${esc(channel.name)}</h1>
                <div class="watch-sub">
                  <span class="pill">${esc(channel.quality)}</span>
                  <span class="pill">${esc(channel.country)}</span>
                  <span class="pill">${esc(channel.language)}</span>
                  <span class="pill pill--live">${source ? "Source ready" : "Official link"}</span>
                </div>
              </div>
              <div class="watch-actions">
                <button class="btn btn--ghost" type="button" data-watchlist-toggle="${esc(channel.id)}" aria-pressed="${saved}">
                  ${ICON_STAR}<span>${saved ? "Saved" : "Save"}</span>
                </button>
                ${source
                  ? `<button class="btn btn--ghost" type="button" data-retry-player>Reload</button>`
                  : `${officialUrl ? `<a class="btn btn--primary" href="${esc(officialUrl)}" target="_blank" rel="noopener noreferrer">Official site ${ICON_EXT}</a>` : ""}
                     <a class="btn btn--ghost" href="#/studio?channel=${esc(channel.id)}">Add source</a>`}
              </div>
            </div>

            ${watchPanelHTML(channel, source)}
          </div>

          <aside class="watch-side" aria-label="Channel details">
            <div class="panel">
              <h2>Channel details</h2>
              <dl>
                <div><dt>Category</dt><dd><a href="#/category/${esc(channel.category)}" style="color:var(--brand)">${esc(categoryName(channel.category))}</a></dd></div>
                <div><dt>Country</dt><dd>${esc(channel.country)}</dd></div>
                <div><dt>Language</dt><dd>${esc(channel.language)}</dd></div>
                <div><dt>Quality</dt><dd>${esc(channel.quality)}</dd></div>
                <div><dt>Source</dt><dd>${source ? "Added" : "Not added"}</dd></div>
              </dl>
              ${isSafeHttpUrl(channel.officialUrl) ? `<a class="link-out" href="${esc(channel.officialUrl)}" target="_blank" rel="noopener noreferrer">Official site ${ICON_EXT}</a>` : ""}
            </div>

            <div class="panel">
              <h2>More in ${esc(categoryName(channel.category))}</h2>
              <div class="side-list">
                ${others.map((item) => `
                  <a class="side-item" href="#/watch/${esc(item.id)}">
                    <span class="side-thumb" style="background:${esc(item.bg)};--logo-fg:${esc(item.fg)}">${esc(item.logoText)}</span>
                    <span class="side-meta"><strong>${esc(item.name)}</strong><span>${esc(item.country)}</span></span>
                  </a>`).join("")}
              </div>
              <a class="link-out" href="#/category/${esc(channel.category)}">All ${esc(categoryName(channel.category).toLowerCase())} channels ${ICON_CHEV}</a>
            </div>

            <div class="source-help">
              <strong>Owner tip:</strong> add authorised links once in <a href="#/studio">Stream Studio</a>, export <code>streams.js</code>, then upload it with the site. Every visitor gets those sources.
            </div>
          </aside>
        </div>

        ${cat ? `
          <section class="section">
            <div class="section-head">
              <div>
                <h2>More ${esc(cat.name.toLowerCase())} channels</h2>
                <p>Keep browsing the ${esc(cat.name.toLowerCase())} guide.</p>
              </div>
              <a class="section-link" href="#/category/${esc(cat.id)}">View all ${ICON_CHEV}</a>
            </div>
            <div class="rail">${others.concat(channelsIn(cat.id).slice(0, 8)).filter((item, i, arr) => item.id !== channel.id && arr.findIndex((x) => x.id === item.id) === i).map(cardHTML).join("")}</div>
          </section>` : ""}
      </div>`;
  }

  function showPlayerError(frame, message) {
    const retry = document.createElement("div");
    retry.className = "player-error";
    retry.innerHTML = `
      <div>
        <div class="player-icon" style="color:var(--danger);border-color:rgba(255,84,112,.3);background:rgba(255,84,112,.08);margin-inline:auto">${ICON_WARN}</div>
        <h2>Playback failed</h2>
        <p>${esc(message || "The source did not respond. It may be offline or geo-restricted.")}</p>
        <button class="btn btn--ghost btn--sm" type="button" data-retry-player>Try again</button>
      </div>`;
    frame.querySelector(".player-loading")?.remove();
    frame.querySelector(".player-error")?.remove();
    frame.appendChild(retry);
  }

  function destroyPlayer() {
    if (activeHls) {
      try { activeHls.destroy(); } catch (err) { /* already detached */ }
      activeHls = null;
    }
  }

  function initPlayer(channel) {
    destroyPlayer();
    const frame = document.querySelector("[data-player]");
    if (!frame) return;

    const source = resolveSource(channel);
    if (!source) return;

    frame.innerHTML = '<div class="player-loading"><span class="spinner" role="status" aria-label="Loading player"></span></div>';

    if (source.type === "youtube") {
      const id = youtubeId(source.url);
      if (!id) {
        showPlayerError(frame, "That YouTube link does not contain a playable video ID.");
        return;
      }
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1`;
      iframe.title = `${channel.name} player`;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.addEventListener("load", () => frame.querySelector(".player-loading")?.remove(), { once: true });
      frame.innerHTML = "";
      frame.appendChild(iframe);
      return;
    }

    const video = document.createElement("video");
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("aria-label", `${channel.name} player`);
    frame.innerHTML = "";
    frame.appendChild(video);

    const loading = document.createElement("div");
    loading.className = "player-loading";
    loading.innerHTML = '<span class="spinner" role="status" aria-label="Loading player"></span>';
    frame.appendChild(loading);

    const fail = (message) => showPlayerError(frame, message);

    video.addEventListener("playing", () => loading.remove(), { once: true });
    video.addEventListener("loadedmetadata", () => {
      const attempt = video.play();
      if (attempt && typeof attempt.catch === "function") attempt.catch(() => { /* user can press play */ });
    }, { once: true });
    video.addEventListener("error", () => fail("The stream could not be loaded. Check the source URL and try again."));

    if (source.type === "hls") {
      if (window.Hls && window.Hls.isSupported()) {
        activeHls = new window.Hls({ lowLatencyMode: true, backBufferLength: 30 });
        activeHls.loadSource(source.url);
        activeHls.attachMedia(video);
        activeHls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          const attempt = video.play();
          if (attempt && typeof attempt.catch === "function") attempt.catch(() => { /* controls available */ });
        });
        activeHls.on(window.Hls.Events.ERROR, (event, data) => {
          if (!data || !data.fatal) return;
          if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            try { activeHls.recoverMediaError(); return; } catch (err) { /* fall through */ }
          }
          fail(data.type === window.Hls.ErrorTypes.NETWORK_ERROR
            ? "The stream network request failed. It may be offline or blocked in your region."
            : "This stream could not be decoded.");
          activeHls.destroy();
          activeHls = null;
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source.url;
      } else {
        fail("HLS playback is not supported in this browser.");
      }
    } else {
      video.src = source.url;
    }

    pageCleanups.push(() => destroyPlayer());
  }

  /* ── Watchlist ───────────────────────────────────────────────────────── */

  function renderWatchlist() {
    const ids = getWatchlist();
    const list = ids.map(channelById).filter(Boolean);

    if (!list.length) {
      return `
        <div class="container page-shell">
          <header class="page-head">
            <div>
              <span class="eyebrow">Your space</span>
              <h1>My watchlist</h1>
            </div>
          </header>
          <div class="empty-state">
            <div class="empty-icon">${ICON_STAR}</div>
            <h2>Your watchlist is empty</h2>
            <p>Tap the star on any channel card to keep it here. Saved channels stay in this browser only.</p>
            <a class="btn btn--primary" href="#/live-tv">Browse live TV ${ICON_ARROW}</a>
          </div>
        </div>`;
    }

    return `
      <div class="container page-shell">
        <header class="page-head">
          <div>
            <span class="eyebrow">Your space</span>
            <h1>My watchlist</h1>
            <p>${list.length} saved channel${list.length === 1 ? "" : "s"}. Stored in this browser only.</p>
          </div>
          <button class="btn btn--danger btn--sm" type="button" data-clear-watchlist>Clear watchlist</button>
        </header>
        <div class="channel-grid">
          ${list.map(cardHTML).join("")}
        </div>
      </div>`;
  }

  /* ── Studio ──────────────────────────────────────────────────────────── */

  function studioRowsHTML() {
    const saved = getSavedStreams();
    const ids = Object.keys(saved).filter((id) => channelById(id));
    if (!ids.length) {
      return `<div class="empty-state" style="padding:36px 20px">
        <div class="empty-icon">${ICON_ANTENNA}</div>
        <h2>No local sources yet</h2>
        <p>Sources you add are saved in this browser first, so you can test them before publishing.</p>
      </div>`;
    }
    return `<div class="table-wrap">
      <table class="studio-table">
        <thead><tr><th>Channel</th><th>Source</th><th>Type</th><th></th></tr></thead>
        <tbody>
          ${ids.map((id) => {
            const channel = channelById(id);
            const source = normalizeSource(saved[id]);
            return `<tr>
              <td class="t-name">${esc(channel.name)}<br><span class="source-state is-ready"><span class="dot"></span>Ready</span></td>
              <td class="t-url" title="${esc(source ? source.url : "")}">${esc(source ? source.url : "Invalid source")}</td>
              <td>${esc(source ? source.type : "—")}</td>
              <td class="t-actions">
                <a class="mini-btn" href="#/watch/${esc(id)}">Test</a>
                <button class="mini-btn mini-btn--danger" type="button" data-remove-source="${esc(id)}">Remove</button>
              </td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
  }

  function renderStudio(selectedId) {
    const shipped = window.SW_STREAMS && typeof window.SW_STREAMS === "object" ? window.SW_STREAMS : {};
    const shippedCount = Object.keys(shipped).filter((id) => channelById(id) && normalizeSource(shipped[id])).length;
    const savedCount = Object.keys(getSavedStreams()).filter((id) => channelById(id)).length;
    const selected = channelById(selectedId) || CHANNELS[0];

    return `
      <div class="container page-shell">
        <header class="page-head">
          <div>
            <span class="eyebrow">Owner tools</span>
            <h1>Stream Studio</h1>
            <p>Attach authorised stream links to channels, test them, then export a <code>streams.js</code> file to publish with the site.</p>
          </div>
        </header>

        <div class="notice">
          ${ICON_WARN}
          <div><strong>Use authorised sources only.</strong> Sports Wave is a directory, not a broadcaster. Add HLS, MP4 or YouTube links that you own or are licensed to distribute. Sources saved here stay in this browser until you export them.</div>
        </div>

        <div class="studio-grid">
          <div>
            <section class="studio-card">
              <div class="studio-card-head">
                <div>
                  <h2>Add or update a source</h2>
                  <p>Paste a link, pick a type, and test it on the watch page.</p>
                </div>
                <span class="result-count">${savedCount} local</span>
              </div>
              <div class="studio-card-body">
                <form id="studioForm" class="studio-fields" novalidate>
                  <div>
                    <label class="field-label" for="studioChannel">Channel</label>
                    <select class="field-select" id="studioChannel" name="channel">
                      ${CATEGORIES.map((cat) => `
                        <optgroup label="${esc(cat.name)}">
                          ${channelsIn(cat.id).map((channel) => `<option value="${esc(channel.id)}"${channel.id === selected.id ? " selected" : ""}>${esc(channel.name)}</option>`).join("")}
                        </optgroup>`).join("")}
                    </select>
                  </div>

                  <div>
                    <label class="field-label" for="studioUrl">Stream URL</label>
                    <input class="field-input" id="studioUrl" name="url" type="url" inputmode="url"
                      placeholder="https://example.com/live/channel.m3u8" autocomplete="off" spellcheck="false">
                    <p class="field-help">HLS <code>.m3u8</code>, MP4, or a YouTube watch / live / embed link.</p>
                  </div>

                  <div class="field-row">
                    <div>
                      <label class="field-label" for="studioType">Source type</label>
                      <select class="field-select" id="studioType" name="type">
                        <option value="">Auto-detect</option>
                        <option value="hls">HLS (.m3u8)</option>
                        <option value="mp4">MP4 / WebM</option>
                        <option value="youtube">YouTube</option>
                      </select>
                    </div>
                    <div style="display:flex;align-items:flex-end">
                      <button class="btn btn--primary" type="submit" style="width:100%">Save source</button>
                    </div>
                  </div>
                </form>
              </div>
            </section>

            <section class="studio-card" style="margin-top:18px">
              <div class="studio-card-head">
                <div>
                  <h2>Local sources</h2>
                  <p>Tested in this browser. Export to make them permanent.</p>
                </div>
                <span class="result-count" id="studioTableCount">${savedCount} saved</span>
              </div>
              <div id="studioTableWrap">${studioRowsHTML()}</div>
            </section>
          </div>

          <aside class="studio-aside">
            <div class="panel">
              <h2>Publish workflow</h2>
              <ol class="steps">
                <li><strong>Add sources</strong>Pick a channel and paste an authorised link.</li>
                <li><strong>Test playback</strong>Open the watch page from the table.</li>
                <li><strong>Export streams.js</strong>Download the generated file.</li>
                <li><strong>Upload to your host</strong>Replace <code>assets/js/streams.js</code> and publish.</li>
              </ol>
            </div>

            <div class="panel">
              <h2>Export &amp; import</h2>
              <p style="font-size:12.5px;color:var(--muted);margin-bottom:12px">${shippedCount} source${shippedCount === 1 ? "" : "s"} currently shipped in <code>streams.js</code>.</p>
              <button class="btn btn--primary btn--sm" type="button" data-export-sources>Export streams.js</button>
              <button class="btn btn--ghost btn--sm" type="button" data-import-sources>Import JSON</button>
              <input type="file" id="importFile" accept="application/json,.json" hidden>
              <button class="btn btn--danger btn--sm" type="button" data-reset-sources>Clear local sources</button>
              <p class="field-help" style="margin-top:10px">Import accepts a JSON object keyed by channel id, e.g. <code>{"ptv-sports":"https://…m3u8"}</code>.</p>
            </div>

            <div class="panel">
              <h2>Need a source?</h2>
              <p>Contact each broadcaster's press or affiliate team for a licensed feed. Official websites for every channel are linked on its watch page.</p>
            </div>
          </aside>
        </div>
      </div>`;
  }

  function refreshStudioTable() {
    const wrap = document.getElementById("studioTableWrap");
    if (!wrap) return;
    wrap.innerHTML = studioRowsHTML();
    const count = document.getElementById("studioTableCount");
    if (count) {
      const n = Object.keys(getSavedStreams()).filter((id) => channelById(id)).length;
      count.textContent = `${n} saved`;
    }
  }

  function initStudio(selectedId) {
    const form = document.getElementById("studioForm");
    const urlInput = document.getElementById("studioUrl");
    const typeSelect = document.getElementById("studioType");
    const channelSelect = document.getElementById("studioChannel");
    const importBtn = document.querySelector("[data-import-sources]");
    const fileInput = document.getElementById("importFile");
    const ac = new AbortController();

    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const id = channelSelect.value;
        const raw = urlInput.value.trim();
        if (!id || !channelById(id)) {
          toast("Pick a channel first.");
          return;
        }
        if (!/^https?:\/\//i.test(raw)) {
          toast("Enter a full http(s) URL.");
          urlInput.focus();
          return;
        }
        const type = typeSelect.value;
        if (type === "youtube" && !youtubeId(raw)) {
          toast("That does not look like a YouTube video link.");
          urlInput.focus();
          return;
        }
        const saved = getSavedStreams();
        saved[id] = type ? { url: raw, type } : { url: raw };
        if (!writeJSON(STREAM_KEY, saved)) return;
        toast(`Source saved for ${channelById(id).name}.`);
        urlInput.value = "";
        typeSelect.value = "";
        refreshStudioTable();
      }, { signal: ac.signal });
    }

    const wrap = document.getElementById("studioTableWrap");
    if (wrap) {
      wrap.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-remove-source]");
        if (!btn) return;
        const id = btn.dataset.removeSource;
        const saved = getSavedStreams();
        delete saved[id];
        writeJSON(STREAM_KEY, saved);
        toast("Local source removed.");
        refreshStudioTable();
      }, { signal: ac.signal });
    }

    document.querySelector("[data-export-sources]")?.addEventListener("click", () => {
      const saved = getSavedStreams();
      const exportMap = {};
      Object.keys(saved).forEach((id) => {
        const source = normalizeSource(saved[id]);
        if (source && channelById(id)) exportMap[id] = source;
      });
      if (!Object.keys(exportMap).length) {
        toast("Add at least one source before exporting.");
        return;
      }
      const header = "/* Sports Wave stream sources — generated by Stream Studio.\n" +
        " * Publish only links you are authorised to distribute.\n" +
        " * Replace assets/js/streams.js with this file. */\n";
      const blob = new Blob([header, "window.SW_STREAMS = ", JSON.stringify(exportMap, null, 2), ";\n"], { type: "application/javascript" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "streams.js";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 4000);
      toast("streams.js exported.");
    }, { signal: ac.signal });

    importBtn?.addEventListener("click", () => fileInput?.click(), { signal: ac.signal });

    fileInput?.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("bad shape");
          const merged = getSavedStreams();
          let added = 0;
          Object.keys(parsed).forEach((id) => {
            if (!channelById(id)) return;
            const source = normalizeSource(parsed[id]);
            if (!source) return;
            merged[id] = source;
            added += 1;
          });
          if (!added) {
            toast("No valid channel sources found in that file.");
            return;
          }
          writeJSON(STREAM_KEY, merged);
          refreshStudioTable();
          toast(`Imported ${added} source${added === 1 ? "" : "s"}.`);
        } catch (err) {
          toast("That file is not valid JSON.");
        }
        fileInput.value = "";
      };
      reader.readAsText(file);
    }, { signal: ac.signal });

    document.querySelector("[data-reset-sources]")?.addEventListener("click", () => {
      if (!Object.keys(getSavedStreams()).length) {
        toast("There are no local sources to clear.");
        return;
      }
      if (!window.confirm("Remove all locally saved stream sources? This cannot be undone.")) return;
      writeJSON(STREAM_KEY, {});
      refreshStudioTable();
      toast("Local sources cleared.");
    }, { signal: ac.signal });

    pageCleanups.push(() => ac.abort());
  }

  /* ── Static pages ────────────────────────────────────────────────────── */

  function renderAbout() {
    return `
      <div class="container prose">
        <span class="eyebrow">About</span>
        <h1>The channel guide built for the way fans browse.</h1>
        <p class="lede">Sports Wave brings cricket, hockey, wildlife and cartoons into one fast, clean guide — without pretending to be something it isn't.</p>

        <h2>What this site is</h2>
        <p>Sports Wave is a directory of real broadcasters and media brands. It helps you find the right channel, check what it covers, save a watchlist and visit the broadcaster's official service.</p>
        <p>It is not a television network, and it does not host, record or rebroadcast any channel. Channel names, logos and marks belong to their respective owners.</p>

        <h2>How playback works</h2>
        <p>A channel only plays when an authorised stream source has been attached. Site owners can add sources for channels they are licensed to distribute; viewers can attach a source in Stream Studio for private testing in their own browser.</p>
        <p>Channels without an authorised source show an official-site hand-off instead of a player. That is deliberate. We would rather link you to the real broadcaster than invent a stream or point to unauthorised content.</p>

        <h2>What you'll find</h2>
        <ul>
          <li><strong>Cricket:</strong> PTV Sports, Star Sports, Sky Sports Cricket, Willow, Ten Sports and ICC TV.</li>
          <li><strong>Hockey:</strong> FIH Hockey, Eurosport, Sky Sports Action, Star Sports Select and TSN.</li>
          <li><strong>Wildlife &amp; Nature:</strong> Animal Planet, Discovery, Nat Geo Wild, BBC Earth, WildEarth and Love Nature.</li>
          <li><strong>Cartoons:</strong> Cartoon Network, Pogo, Nickelodeon, Disney Channel, Nick Jr. and PBS KIDS.</li>
        </ul>

        <h2>For operators</h2>
        <p>Stream sources are managed in <a href="#/studio">Stream Studio</a>. Save and test sources locally, then export a <code>streams.js</code> file and upload it with the site to publish them to every visitor.</p>

        <p class="meta-note">Sports Wave is an independent guide. It is not affiliated with, endorsed by or sponsored by any broadcaster listed on this site.</p>
      </div>`;
  }

  function renderTerms() {
    return `
      <div class="container prose">
        <span class="eyebrow">Legal</span>
        <h1>Terms of use</h1>
        <p class="lede">Plain-language terms for using Sports Wave.</p>

        <h2>1. The service</h2>
        <p>Sports Wave provides a channel directory and an interface for playing stream sources supplied by the site owner or by you. We do not supply television signals, and availability of any channel is not guaranteed.</p>

        <h2>2. Authorised sources only</h2>
        <p>You may only add stream links you own or are licensed to use. Do not use Stream Studio, <code>streams.js</code> or the player to distribute copyrighted broadcasts, circumvent geo-restrictions or share access you are not entitled to.</p>

        <h2>3. Third-party content</h2>
        <p>Channel names, logos and programming belong to their respective owners. Links to official websites are provided for convenience. Sports Wave is not responsible for third-party sites, players or streams.</p>

        <h2>4. No warranty</h2>
        <p>The service is provided “as is”. We do not guarantee that a channel, source or page will be available, uninterrupted or error-free.</p>

        <h2>5. Changes</h2>
        <p>These terms may be updated as the site evolves. Continued use after an update means you accept the revised terms.</p>

        <p class="meta-note">Last updated: November 2026. This page is a general template and is not legal advice; have your own counsel review it before commercial launch.</p>
      </div>`;
  }

  function renderPrivacy() {
    return `
      <div class="container prose">
        <span class="eyebrow">Privacy</span>
        <h1>Privacy</h1>
        <p class="lede">Sports Wave is built to work without accounts and without collecting more than it needs.</p>

        <h2>What we store</h2>
        <p>Your watchlist and any stream sources you add in Stream Studio are stored in your browser's local storage. They never leave your device unless you export them.</p>
        <ul>
          <li><code>sw_watchlist_v1</code> — the channel IDs you starred.</li>
          <li><code>sw_streams_v1</code> — stream sources you added for testing.</li>
        </ul>

        <h2>What we don't do</h2>
        <p>The shipped site has no analytics, no advertising trackers and no account system. It does not ask for an email address or payment details.</p>

        <h2>Third parties</h2>
        <p>When a stream uses an embedded player (for example YouTube), that provider may set its own cookies and process data under its own privacy policy. Visiting an official broadcaster website is likewise governed by that site's policy.</p>

        <h2>Clearing your data</h2>
        <p>Use “Clear local sources” in Stream Studio, remove channels from your watchlist, or clear site data in your browser settings. That removes everything Sports Wave has stored.</p>

        <h2>Contact</h2>
        <p>Questions about privacy can be sent to <a href="mailto:${esc(DATA.brand.email)}">${esc(DATA.brand.email)}</a>.</p>

        <p class="meta-note">Last updated: November 2026.</p>
      </div>`;
  }

  function renderNotFound() {
    return `
      <div class="container notfound">
        <div class="code">404</div>
        <h1>That channel slipped off the dial.</h1>
        <p>The page you're looking for doesn't exist, or the channel has moved.</p>
        <div class="hero-actions" style="justify-content:center">
          <a class="btn btn--primary" href="#/">Back to home ${ICON_ARROW}</a>
          <a class="btn btn--ghost" href="#/live-tv">Browse live TV</a>
        </div>
      </div>`;
  }

  /* ── Routing ─────────────────────────────────────────────────────────── */

  function parseHash() {
    let raw = window.location.hash.replace(/^#/, "");
    if (!raw) raw = "/";
    const qIndex = raw.indexOf("?");
    const pathPart = qIndex === -1 ? raw : raw.slice(0, qIndex);
    const query = new URLSearchParams(qIndex === -1 ? "" : raw.slice(qIndex + 1));
    const segments = pathPart.split("/").filter(Boolean);
    return { segments, query };
  }

  function setMeta(title, description) {
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && description) meta.setAttribute("content", description);
  }

  function updateChrome(routeName, categoryId) {
    document.querySelectorAll("[data-nav]").forEach((link) => {
      const nav = link.dataset.nav;
      let active = false;
      if (nav === "home") active = routeName === "home";
      else if (nav === "live-tv") active = routeName === "live-tv";
      else if (nav === "watchlist") active = routeName === "watchlist";
      else if (nav === "studio") active = routeName === "studio";
      else active = routeName === "category" && categoryId === nav;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function closeMobileMenu() {
    if (!mobileMenu || mobileMenu.hidden) return;
    mobileMenu.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open menu");
  }

  function cleanupPage() {
    destroyPlayer();
    pageCleanups.forEach((fn) => {
      try { fn(); } catch (err) { /* noop */ }
    });
    pageCleanups = [];
  }

  function buildPage(segments, query) {
    const [first, second] = segments;

    if (!first) {
      currentRoute = { name: "home" };
      return { html: renderHome(), init: initHome, title: "Sports Wave — Live cricket, hockey, wildlife & cartoons",
        description: "Browse real cricket, hockey, wildlife and cartoon channels in one clean guide." };
    }

    if (first === "live-tv") {
      currentRoute = { name: "live-tv" };
      return { html: renderLiveTV(), init: initGridFilter, title: "Live TV — Sports Wave",
        description: "Browse every cricket, hockey, wildlife and cartoon channel in the Sports Wave guide." };
    }

    if (first === "category" && second) {
      const html = renderCategory(second);
      if (html) {
        currentRoute = { name: "category", categoryId: second };
        return { html, init: initGridFilter, title: `${categoryName(second)} channels — Sports Wave`,
          description: `Browse ${categoryName(second).toLowerCase()} broadcasters in the Sports Wave channel guide.` };
      }
    }

    if (first === "watch" && second) {
      const channel = channelById(second);
      if (channel) {
        currentRoute = { name: "watch", channelId: second, categoryId: channel.category };
        return {
          html: renderWatch(channel),
          init: () => initPlayer(channel),
          title: `${channel.name} — Sports Wave`,
          description: `${channel.name}: ${channel.description}`
        };
      }
    }

    if (first === "watchlist") {
      currentRoute = { name: "watchlist" };
      return { html: renderWatchlist(), init: null, title: "My watchlist — Sports Wave",
        description: "Your saved channels on Sports Wave." };
    }

    if (first === "studio") {
      const wanted = query.get("channel");
      currentRoute = { name: "studio" };
      return { html: renderStudio(wanted), init: () => initStudio(wanted), title: "Stream Studio — Sports Wave",
        description: "Attach authorised stream sources to Sports Wave channels and export streams.js." };
    }

    if (first === "about") {
      currentRoute = { name: "about" };
      return { html: renderAbout(), init: null, title: "About — Sports Wave",
        description: "What Sports Wave is and how its channel guide works." };
    }

    if (first === "terms") {
      currentRoute = { name: "terms" };
      return { html: renderTerms(), init: null, title: "Terms of use — Sports Wave",
        description: "Terms of use for the Sports Wave channel guide." };
    }

    if (first === "privacy") {
      currentRoute = { name: "privacy" };
      return { html: renderPrivacy(), init: null, title: "Privacy — Sports Wave",
        description: "How Sports Wave handles local storage and privacy." };
    }

    currentRoute = { name: "notfound" };
    return { html: renderNotFound(), init: null, title: "Page not found — Sports Wave", description: "Page not found." };
  }

  function handleRoute(options) {
    const opts = options || {};
    cleanupPage();

    const { segments, query } = parseHash();
    const page = buildPage(segments, query);

    app.innerHTML = page.html;
    if (page.init) page.init();
    syncWatchlistCount();
    updateChrome(currentRoute.name, currentRoute.categoryId || currentRoute.channelId);
    setMeta(page.title, page.description);

    if (opts.scroll !== false) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    if (hasRendered && opts.focus !== false) {
      app.focus({ preventScroll: true });
    }
    hasRendered = true;
    closeMobileMenu();
    closeSearch(false);
  }

  /* ── Watchlist interactions ──────────────────────────────────────────── */

  function syncWatchlistCount() {
    const count = document.getElementById("watchCount");
    if (!count) return;
    const n = getWatchlist().length;
    count.textContent = String(n);
    count.dataset.count = String(n);
  }

  function syncWatchlistUI(id) {
    const saved = isSaved(id);
    document.querySelectorAll(`[data-star="${id}"]`).forEach((btn) => {
      btn.classList.toggle("is-saved", saved);
      btn.setAttribute("aria-pressed", String(saved));
      const channel = channelById(id);
      btn.setAttribute("aria-label", `${saved ? "Remove" : "Save"} ${channel ? channel.name : "channel"} ${saved ? "from" : "to"} watchlist`);
    });
    document.querySelectorAll(`[data-watchlist-toggle="${id}"]`).forEach((btn) => {
      btn.setAttribute("aria-pressed", String(saved));
      const span = btn.querySelector("span");
      if (span) span.textContent = saved ? "Saved" : "Save";
    });
  }

  function toggleWatchlist(id) {
    const channel = channelById(id);
    if (!channel) return;
    const list = getWatchlist();
    const index = list.indexOf(id);
    if (index === -1) {
      list.push(id);
      writeJSON(WATCHLIST_KEY, list);
      toast(`Saved ${channel.name} to your watchlist.`);
    } else {
      list.splice(index, 1);
      writeJSON(WATCHLIST_KEY, list);
      toast(`Removed ${channel.name} from your watchlist.`);
    }
    syncWatchlistCount();
    syncWatchlistUI(id);

    if (currentRoute && currentRoute.name === "watchlist") {
      const y = window.scrollY;
      handleRoute({ scroll: false, focus: false });
      window.scrollTo(0, y);
    }
  }

  /* ── Search ──────────────────────────────────────────────────────────── */

  const searchOverlay = document.getElementById("searchOverlay");
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  const searchBtn = document.getElementById("searchBtn");
  let searchIndex = -1;

  function searchRows(list) {
    return list.map((channel) => {
      const cat = categoryById(channel.category);
      return `
        <a class="search-row" href="#/watch/${esc(channel.id)}" data-search-row>
          <span class="thumb" style="background:${esc(channel.bg)};--logo-fg:${esc(channel.fg)}">${esc(channel.logoText)}</span>
          <span class="info"><strong>${esc(channel.name)}</strong><span>${esc(cat ? cat.name : "")} · ${esc(channel.country)}</span></span>
          <span class="go">${ICON_CHEV}</span>
        </a>`;
    }).join("");
  }

  function runSearch(value) {
    const query = value.trim().toLowerCase();
    if (!query) {
      searchIndex = -1;
      searchResults.innerHTML = `
        <p class="search-hint">Try “cricket”, “wildlife”, “Sky” or a country.</p>
        <p class="search-group-label">Browse categories</p>
        ${CATEGORIES.map((cat) => `
          <a class="search-row" href="#/category/${esc(cat.id)}">
            <span class="thumb" style="background:linear-gradient(135deg,#1b2733,#0e151d);--logo-fg:#fff">${channelsIn(cat.id).length}</span>
            <span class="info"><strong>${esc(cat.name)}</strong><span>${esc(cat.blurb)}</span></span>
            <span class="go">${ICON_CHEV}</span>
          </a>`).join("")}`;
      return;
    }

    const list = CHANNELS.filter((channel) => gridSearchText(channel).includes(query));
    if (!list.length) {
      searchIndex = -1;
      searchResults.innerHTML = `<p class="search-hint">No channels match “${esc(value.trim())}”. Try a broadcaster name or category.</p>`;
      return;
    }
    searchIndex = 0;
    searchResults.innerHTML = `
      <p class="search-group-label">${list.length} result${list.length === 1 ? "" : "s"}</p>
      ${searchRows(list.slice(0, 10))}
      ${list.length > 10 ? `<p class="search-hint">Showing the first 10. Refine your search for more.</p>` : ""}`;
    focusSearchRow(0);
  }

  function focusSearchRow(index) {
    const rows = Array.from(searchResults.querySelectorAll("[data-search-row]"));
    if (!rows.length) return;
    searchIndex = (index + rows.length) % rows.length;
    rows.forEach((row, i) => row.classList.toggle("is-focused", i === searchIndex));
    rows[searchIndex].scrollIntoView({ block: "nearest" });
  }

  function openSearch() {
    if (!searchOverlay) return;
    searchOverlay.hidden = false;
    document.body.classList.add("is-locked");
    searchInput.value = "";
    runSearch("");
    window.setTimeout(() => searchInput.focus(), 30);
  }

  function closeSearch(restoreFocus) {
    if (!searchOverlay || searchOverlay.hidden) return;
    searchOverlay.hidden = true;
    document.body.classList.remove("is-locked");
    if (restoreFocus !== false && searchBtn) searchBtn.focus();
  }

  function initSearch() {
    if (!searchOverlay) return;

    searchBtn.addEventListener("click", openSearch);

    document.getElementById("searchClose").addEventListener("click", () => closeSearch(true));

    searchOverlay.addEventListener("click", (event) => {
      if (event.target === searchOverlay) closeSearch(true);
    });

    searchInput.addEventListener("input", () => runSearch(searchInput.value));

    searchInput.addEventListener("keydown", (event) => {
      const rows = Array.from(searchResults.querySelectorAll("[data-search-row]"));
      if (event.key === "ArrowDown" && rows.length) {
        event.preventDefault();
        focusSearchRow(searchIndex + 1);
      } else if (event.key === "ArrowUp" && rows.length) {
        event.preventDefault();
        focusSearchRow(searchIndex - 1);
      } else if (event.key === "Enter") {
        const target = rows[searchIndex] || rows[0];
        if (target) {
          event.preventDefault();
          window.location.hash = target.getAttribute("href").replace(/^#/, "");
        }
      } else if (event.key === "Escape") {
        closeSearch(true);
      }
    });

    document.addEventListener("keydown", (event) => {
      const tag = (event.target.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || tag === "select" || event.target.isContentEditable;
      if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        openSearch();
      } else if (event.key === "/" && !typing && searchOverlay.hidden) {
        event.preventDefault();
        openSearch();
      } else if (event.key === "Escape") {
        if (!searchOverlay.hidden) closeSearch(true);
        closeMobileMenu();
      }
    });
  }

  /* ── Toast ───────────────────────────────────────────────────────────── */

  function toast(message) {
    const region = document.getElementById("toastRegion");
    if (!region) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span class="t-dot"></span>${esc(message)}`;
    region.appendChild(el);
    window.setTimeout(() => {
      el.classList.add("is-out");
      window.setTimeout(() => el.remove(), 260);
    }, 2600);
  }

  /* ── Global chrome ───────────────────────────────────────────────────── */

  function initChrome() {
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    window.addEventListener("scroll", () => {
      header?.classList.toggle("is-scrolled", window.scrollY > 8);
    }, { passive: true });
    header?.classList.toggle("is-scrolled", window.scrollY > 8);

    menuBtn?.addEventListener("click", () => {
      const open = mobileMenu.hidden;
      mobileMenu.hidden = !open;
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    document.addEventListener("click", (event) => {
      const star = event.target.closest("[data-star]");
      if (star) {
        event.preventDefault();
        toggleWatchlist(star.dataset.star);
        return;
      }
      const toggle = event.target.closest("[data-watchlist-toggle]");
      if (toggle) {
        event.preventDefault();
        toggleWatchlist(toggle.dataset.watchlistToggle);
        return;
      }
      if (event.target.closest("[data-clear-watchlist]")) {
        if (!window.confirm("Remove every channel from your watchlist?")) return;
        writeJSON(WATCHLIST_KEY, []);
        toast("Watchlist cleared.");
        handleRoute({ scroll: false, focus: false });
        return;
      }
      if (event.target.closest("[data-retry-player]")) {
        const channel = currentRoute && currentRoute.name === "watch" ? channelById(currentRoute.channelId) : null;
        if (channel) initPlayer(channel);
        else handleRoute({ scroll: false, focus: false });
        return;
      }
      const link = event.target.closest('a[href^="#/"]');
      if (link) closeMobileMenu();
    });

    initSearch();
    window.addEventListener("hashchange", () => handleRoute());
  }

  initChrome();
  handleRoute({ focus: false });
})();
