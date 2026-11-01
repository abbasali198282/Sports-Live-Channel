import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import {
  Play, Radio, Tv, Search, Plus, Flame,
  Activity, Volume2, VolumeX, Maximize2,
  X, Eye, RefreshCw
} from 'lucide-react';
import AdSlot from './components/AdSlot.jsx';
import { fetchChannels, insertChannel } from './lib/channels.js';

const CATEGORIES = [
  'All',
  'Cricket',
  'Football',
  'Hockey',
  'Cartoon',
  'Wildlife & Nature',
  'Science & Docs'
];

const PRE_ROLL_SECONDS = 5;

function HlsVideoPlayer({ streamUrl, poster, channelName }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [status, setStatus] = useState('LIVE STREAMING');

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    let hls;
    if (streamUrl.includes('.m3u8') && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        setStatus('HLS .M3U8 ACTIVE');
      });
    } else {
      video.src = streamUrl;
      video.play().catch(() => {});
      setStatus('DIRECT STREAM ACTIVE');
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [streamUrl]);

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const goFullscreen = () => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl">
      <video
        ref={videoRef}
        poster={poster}
        muted={muted}
        playsInline
        autoPlay
        loop
        controls
        className="w-full h-full object-cover"
      />
      <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
        <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
          <Radio className="w-3.5 h-3.5" /> {status}
        </span>
        <span className="bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-3 py-1 rounded-full">
          {channelName}
        </span>
      </div>
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={toggleMute}
          className="bg-slate-900/90 hover:bg-emerald-600 text-white p-2 rounded-full border border-white/15 transition cursor-pointer"
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <button
          onClick={goFullscreen}
          className="bg-slate-900/90 hover:bg-emerald-600 text-white p-2 rounded-full border border-white/15 transition cursor-pointer"
          title="Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [channels, setChannels] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [adCountdown, setAdCountdown] = useState(0);
  const [showAddStreamModal, setShowAddStreamModal] = useState(false);

  // Live Multi-Sport Ticker State
  const [score, setScore] = useState({ runs: 286, wickets: 4, overs: 44, balls: 2, lastBall: '4 Runs' });

  // Custom stream form
  const [newStreamName, setNewStreamName] = useState('');
  const [newStreamCategory, setNewStreamCategory] = useState('Cricket');
  const [newStreamUrl, setNewStreamUrl] = useState('');
  const [addError, setAddError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchChannels()
      .then((list) => {
        if (cancelled) return;
        setChannels(list);
        setSelectedChannel(list[0] ?? null);
        setLoadState('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err.message);
        setLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (adCountdown > 0) {
      const timer = setTimeout(() => setAdCountdown(adCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [adCountdown]);

  const handleSelectChannel = (channel) => {
    setSelectedChannel(channel);
    setAdCountdown(PRE_ROLL_SECONDS);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const simulateNextBall = () => {
    const outcomes = [
      { r: 0, w: 0, label: 'Dot Ball (145 kph)' },
      { r: 1, w: 0, label: '1 Run (Quick Single)' },
      { r: 4, w: 0, label: 'FOUR! Cover Drive' },
      { r: 6, w: 0, label: 'SIX! Over Mid-Wicket' },
      { r: 2, w: 0, label: '2 Runs (Deep Extra)' },
      { r: 0, w: 1, label: 'WICKET! Clean Bowled!' }
    ];
    const pick = outcomes[Math.floor(Math.random() * outcomes.length)];
    setScore((prev) => {
      const nextBalls = prev.balls + 1;
      const nextOvers = nextBalls === 6 ? prev.overs + 1 : prev.overs;
      return {
        runs: prev.runs + pick.r,
        wickets: Math.min(10, prev.wickets + pick.w),
        overs: nextOvers,
        balls: nextBalls === 6 ? 0 : nextBalls,
        lastBall: pick.label
      };
    });
  };

  const openAddStreamModal = () => {
    setAddError('');
    setShowAddStreamModal(true);
  };

  const handleAddStream = async (e) => {
    e.preventDefault();
    if (!newStreamName.trim() || !newStreamUrl.trim() || isSaving) return;
    setIsSaving(true);
    setAddError('');
    try {
      const created = await insertChannel({
        name: newStreamName.trim(),
        category: newStreamCategory,
        streamUrl: newStreamUrl.trim(),
      });
      setChannels((prev) => [created, ...prev]);
      setSelectedChannel(created);
      setNewStreamName('');
      setNewStreamUrl('');
      setShowAddStreamModal(false);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredChannels = channels.filter((ch) => {
    const matchesCat = activeCategory === 'All' || ch.category === activeCategory;
    const matchesSearch =
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.currentEvent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const playerMessage =
    loadState === 'loading'
      ? 'Loading channels...'
      : loadState === 'error'
        ? `Could not load channels: ${loadError}`
        : 'No channels yet. Add a stream to start watching.';

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Multi-Sport Live Scoreboard Ticker */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/20 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-emerald-500 text-black font-black px-2 py-0.5 rounded uppercase tracking-wider">
              CRICKET
            </span>
            <span className="font-bold text-white">
              PAK {score.runs}/{score.wickets} ({score.overs}.{score.balls})
            </span>
            <span className="text-emerald-400 font-medium hidden sm:inline">
              ({score.lastBall})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={simulateNextBall}
              className="flex items-center gap-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> +1 Ball Sim
            </button>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#070b12]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Activity className="w-6 h-6 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-white">
                    SPORTS <span className="text-emerald-400">WAVE</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    ALL-IN-ONE LIVE TV
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Cricket • Football • Hockey • Cartoon • Wildlife • Science
                </p>
              </div>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Cricket, Football, Cartoon..."
                  className="bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 sm:w-60"
                />
              </div>

              <button
                onClick={openAddStreamModal}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> + Add .m3u8
              </button>
            </div>
          </div>

          {/* Dedicated Category Navigation Bar */}
          <nav className="flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Theater + Live EPG Section */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Active Video Stream Player */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              {selectedChannel ? (
                <HlsVideoPlayer
                  streamUrl={selectedChannel.streamUrl}
                  poster={selectedChannel.poster}
                  channelName={selectedChannel.name}
                />
              ) : (
                <div className="w-full aspect-video bg-slate-950 rounded-2xl border border-white/10 flex items-center justify-center p-6 text-center text-sm text-slate-400">
                  {playerMessage}
                </div>
              )}

              {/* Pre-roll ad shown after switching channels */}
              {adCountdown > 0 && selectedChannel && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center z-20 space-y-4">
                  <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full">
                    ADVERTISEMENT • {adCountdown}s
                  </span>
                  <AdSlot size="video" className="max-w-sm" />
                  <p className="text-xs text-slate-400 max-w-md">
                    Your stream of <span className="text-emerald-400 font-semibold">{selectedChannel.name}</span> will start in {adCountdown} seconds.
                  </p>
                  <button
                    onClick={() => setAdCountdown(0)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Skip ad
                  </button>
                </div>
              )}
            </div>

            {/* Active Stream Metadata Bar */}
            {selectedChannel && (
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg font-black text-white">{selectedChannel.name}</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-md font-bold">
                      {selectedChannel.quality}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-emerald-400" /> {selectedChannel.viewers} watching
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1 font-medium">{selectedChannel.currentEvent}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-white/10">
                    Category: <strong className="text-emerald-400">{selectedChannel.category}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Channel EPG & Quick Switcher */}
          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">
                    Live Schedule (EPG)
                  </h2>
                </div>
                {selectedChannel && (
                  <span className="text-[11px] text-emerald-400 font-bold">{selectedChannel.category}</span>
                )}
              </div>

              <div className="space-y-2 mb-5">
                {selectedChannel && (
                  <div className="p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/40 text-white">
                    <div className="text-[11px] font-bold text-emerald-400">LIVE NOW</div>
                    <div className="text-xs font-semibold mt-0.5">{selectedChannel.currentEvent}</div>
                  </div>
                )}
              </div>

              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Quick Channel Switcher ({filteredChannels.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredChannels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => handleSelectChannel(ch)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      selectedChannel?.id === ch.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-slate-950/60 border-white/5 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        {ch.name}
                        <span className="text-[10px] text-emerald-400 font-normal">({ch.category})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{ch.currentEvent}</div>
                    </div>
                    <Play className="w-4 h-4 text-emerald-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200 flex items-center justify-between">
              <span>Have a custom .m3u8 stream?</span>
              <button
                onClick={openAddStreamModal}
                className="text-emerald-400 font-black underline cursor-pointer"
              >
                Add Channel
              </button>
            </div>
          </div>
        </div>

        <AdSlot size="banner" />

        {/* Filtered Channels Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-emerald-400" />
              {activeCategory === 'All'
                ? 'All Channels (Cricket, Football, Hockey, Cartoon, Wildlife & Science)'
                : `${activeCategory} Live Channels`}
              <span className="text-xs font-normal text-slate-400">({filteredChannels.length} channels)</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredChannels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => handleSelectChannel(channel)}
                className={`group bg-slate-900/80 rounded-2xl overflow-hidden border transition cursor-pointer hover:-translate-y-1 ${
                  selectedChannel?.id === channel.id
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'border-white/10 hover:border-emerald-500/50'
                }`}
              >
                <div className="relative aspect-video overflow-hidden bg-slate-950">
                  <img
                    src={channel.poster}
                    alt={channel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded">
                      LIVE
                    </span>
                    <span className="bg-slate-950/80 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded">
                      {channel.quality}
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded">
                      FREE
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="text-xs font-black text-white drop-shadow">{channel.name}</span>
                    <span className="text-[11px] text-emerald-300 font-semibold">{channel.viewers}</span>
                  </div>
                </div>
                <div className="p-3.5">
                  <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                    {channel.category}
                  </div>
                  <p className="text-xs text-slate-200 font-semibold line-clamp-1 mt-0.5">
                    {channel.currentEvent}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Custom .m3u8 Stream Modal */}
      {showAddStreamModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleAddStream}
            className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Add Custom Live .m3u8 Channel</h3>
              <button
                type="button"
                onClick={() => setShowAddStreamModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Channel Name</label>
              <input
                type="text"
                required
                placeholder="e.g., My Live Channel"
                value={newStreamName}
                onChange={(e) => setNewStreamName(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Select Category</label>
              <select
                value={newStreamCategory}
                onChange={(e) => setNewStreamCategory(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Cricket">Cricket</option>
                <option value="Football">Football</option>
                <option value="Hockey">Hockey</option>
                <option value="Cartoon">Cartoon</option>
                <option value="Wildlife & Nature">Wildlife & Nature</option>
                <option value="Science & Docs">Science & Docs</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">HLS (.m3u8) or MP4 Stream URL</label>
              <input
                type="url"
                required
                placeholder="https://example.com/live/stream.m3u8"
                value={newStreamUrl}
                onChange={(e) => setNewStreamUrl(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            {addError && (
              <p className="text-xs text-red-400">Could not save channel: {addError}</p>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black py-2.5 rounded-xl text-xs cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save & Watch Live'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
