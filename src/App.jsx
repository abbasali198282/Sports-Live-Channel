import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import {
  Play, Radio, Tv, Search, Plus, Flame,
  Activity, Volume2, VolumeX, Maximize2,
  X, Sparkles, Lock, Eye, RefreshCw
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Cricket',
  'Football',
  'Hockey',
  'Cartoon',
  'Wildlife & Nature',
  'Science & Docs'
];

const INITIAL_CHANNELS = [
  // CRICKET CHANNELS
  {
    id: 'sw-cricket-hd',
    name: 'SPORTS WAVE CRICKET HD',
    category: 'Cricket',
    badge: 'FREE',
    quality: '1080p HD',
    viewers: '248.5K',
    currentEvent: 'LIVE: Pakistan vs South Africa - Final ODI',
    league: 'International Cricket',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    poster: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1000&q=80',
    epg: [
      { time: 'LIVE NOW', title: 'Pakistan vs South Africa - 3rd ODI Live' },
      { time: '21:00 PKT', title: 'The Pavilion - Post-Match Cricket Analysis' },
      { time: '22:30 PKT', title: 'PSL 2026 Greatest Finishes' }
    ]
  },
  {
    id: 'ptv-sports-cricket',
    name: 'PTV Sports Cricket',
    category: 'Cricket',
    badge: 'FREE',
    quality: '1080p60',
    viewers: '192.1K',
    currentEvent: 'LIVE: National T20 Cup & ICC Champions Trophy Preview',
    league: 'Pakistan Cricket',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    poster: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1000&q=80',
    epg: [
      { time: 'LIVE NOW', title: 'Game On Hai - Cricket Studio Live' },
      { time: '20:30 PKT', title: 'Hong Kong Sixes Full Highlights' }
    ]
  },
  {
    id: 'willow-cricket-4k',
    name: 'Willow Cricket 4K',
    category: 'Cricket',
    badge: 'PRO',
    quality: '4K 60FPS',
    viewers: '84.3K',
    currentEvent: 'AD-FREE: Australia vs India Border-Gavaskar Test Special',
    league: 'World Test Championship',
    streamUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    poster: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&w=1000&q=80',
    epg: [
      { time: 'LIVE NOW', title: 'Stump Mic 4K Feed: Test Series Live' },
      { time: '22:00 PKT', title: 'ICC T20 World Cup Classics' }
    ]
  },

  // FOOTBALL CHANNELS
  {
    id: 'sw-football-ultra',
    name: 'SPORTS WAVE FOOTBALL 4K',
    category: 'Football',
    badge: 'FREE',
    quality: '4K UHD',
    viewers: '176.4K',
    currentEvent: 'LIVE: Real Madrid vs Barcelona - El Clasico Build-Up & Match',
    league: 'LaLiga & European Football',
    streamUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    poster: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
    epg: [
      { time: 'LIVE NOW', title: 'European Football Matchday Live' },
      { time: '22:00 PKT', title: 'Premier League Super Sunday Live' }
    ]
  },
  {
    id: 'ten-football-hd',
    name: 'Ten Sports Football HD',
    category: 'Football',
    badge: 'PRO',
    quality: '1080p60',
    viewers: '112.9K',
    currentEvent: 'UEFA Champions League: Bayern Munich vs Arsenal',
    league: 'UEFA Champions League',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    poster: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1000&q=80',
    epg: [
      { time: 'LIVE NOW', title: 'UEFA Champions League Kickoff' },
      { time: '23:45 PKT', title: 'Goals of the Week Show' }
    ]
  },

  // HOCKEY CHANNELS
  {
    id: 'sw-hockey-hd',
    name: 'SPORTS WAVE HOCKEY HD',
    category: 'Hockey',
    badge: 'FREE',
    quality: '1080p HD',
    viewers: '68.7K',
    currentEvent: 'LIVE: Pakistan vs Netherlands - FIH Pro League 2026',
    league: 'FIH Field Hockey',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    poster: 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&w=1000&q=80',
    epg: [
      { time: 'LIVE NOW', title: 'FIH Men’s Hockey Pro League: PAK vs NED' },
      { time: '21:00 PKT', title: 'Sultan Azlan Shah Cup Highlights' }
    ]
  },
  {
    id: 'euro-hockey-pro',
    name: 'EuroHockey & NHL Arena',
    category: 'Hockey',
    badge: 'PRO',
    quality: '4K 60FPS',
    viewers: '41.2K',
    currentEvent: 'Asian Champions Trophy Hockey Final Replay & Live Turf Cam',
    league: 'World Hockey Federation',
    streamUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    poster: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?auto=format&fit=crop&w=1000&q=80',
    epg: [
      { time: 'LIVE NOW', title: 'Asian Champions Trophy: Pakistan vs India' },
      { time: '22:30 PKT', title: 'Golden Era of Green Shirts Documentary' }
    ]
  },

  // CARTOON CHANNELS
  {
    id: 'sw-toons-hd',
    name: 'SPORTS WAVE TOONS HD',
    category: 'Cartoon',
    badge: 'FREE',
    quality: '1080p HD',
    viewers: '134.0K',
    currentEvent: 'Big Buck Bunny & Classic Animated Adventures Marathon',
    league: '24/7 Kids & Animation',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    poster: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=1000&q=80',
    epg: [
      { time: 'LIVE NOW', title: 'Big Buck Bunny Full HD Movie' },
      { time: '20:00 PKT', title: 'Tom & Jerry Classic Chase Hour' },
      { time: '21:00 PKT', title: 'Dragon Ball Super Dubbed Marathon' }
    ]
  },
  {
    id: 'anime-action-4k',
    name: 'Cartoon & Anime 4K',
    category: 'Cartoon',
    badge: 'FREE',
    quality: '4K HDR',
    viewers: '95.8K',
    currentEvent: 'Sintel 4K Fantasy Animation & Sports Anime Block',
    league: 'Anime & Toons',
    streamUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1000&q=80',
    epg: [
      { time: 'LIVE NOW', title: 'Sintel 4K Animated Feature' },
      { time: '21:00 PKT', title: 'Blue Lock & Captain Tsubasa Football Anime' }
    ]
  },

  // WILDLIFE & NATURE CHANNELS
  {
    id: 'sw-wild-4k',
    name: 'SPORTS WAVE WILD 4K',
    category: 'Wildlife & Nature',
    badge: 'FREE',
    quality: '4K HDR',
    viewers: '74.9K',
    currentEvent: 'Snow Leopards of Gilgit & Karakoram Peaks',
    league: '4K Earth Expedition',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    poster: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=1000&q=80',
    epg: [
      { time: 'LIVE NOW', title: 'Apex Predators of the Himalayas' },
      { time: '20:30 PKT', title: 'Deosai Plains: Himalayan Brown Bears' }
    ]
  },
  {
    id: 'nat-geo-wild',
    name: 'Nat Geo Wild 4K',
    category: 'Wildlife & Nature',
    badge: 'PRO',
    quality: '4K UHD',
    viewers: '63.2K',
    currentEvent: 'Serengeti Lions: Night Hunt in Thermal 4K',
    league: 'Wildlife Documentary',
    streamUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    poster: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1000&q=80',
    epg: [
      { time: 'LIVE NOW', title: 'Serengeti Pride: Survival Instinct' },
      { time: '21:00 PKT', title: 'Amazon River Giants' }
    ]
  },

  // SCIENCE & DOCS CHANNELS
  {
    id: 'discovery-science',
    name: 'Discovery Science HD',
    category: 'Science & Docs',
    badge: 'FREE',
    quality: '1080p HD',
    viewers: '49.4K',
    currentEvent: 'How the Universe Works: James Webb Deep Field',
    league: 'Astrophysics & Tech',
    streamUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80',
    epg: [
      { time: 'LIVE NOW', title: 'Exoplanets & Deep Space Telescopes' },
      { time: '21:30 PKT', title: 'Mega Engineering: High Speed Rail' }
    ]
  },
  {
    id: 'nasa-uhd',
    name: 'NASA TV UHD Orbital',
    category: 'Science & Docs',
    badge: 'FREE',
    quality: '4K UHD',
    viewers: '52.0K',
    currentEvent: 'Live International Space Station Earth Cam',
    league: 'Space Telemetry',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    poster: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1000&q=80',
    epg: [
      { time: 'LIVE NOW', title: 'ISS Live External HD Telemetry' },
      { time: '22:00 PKT', title: 'Artemis Lunar Mission Briefing' }
    ]
  }
];

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
  const [channels, setChannels] = useState(() => {
    const saved = localStorage.getItem('sportswave_channels_v2');
    return saved ? JSON.parse(saved) : INITIAL_CHANNELS;
  });
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(INITIAL_CHANNELS[0]);
  const [isProUser, setIsProUser] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);
  const [showProModal, setShowProModal] = useState(false);
  const [showAddStreamModal, setShowAddStreamModal] = useState(false);

  // Live Multi-Sport Ticker State
  const [score, setScore] = useState({ runs: 286, wickets: 4, overs: 44, balls: 2, lastBall: '4 Runs' });

  // Custom stream form
  const [newStreamName, setNewStreamName] = useState('');
  const [newStreamCategory, setNewStreamCategory] = useState('Cricket');
  const [newStreamUrl, setNewStreamUrl] = useState('');

  useEffect(() => {
    if (adCountdown > 0) {
      const timer = setTimeout(() => setAdCountdown(adCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [adCountdown]);

  const handleSelectChannel = (channel) => {
    if (channel.badge === 'PRO' && !isProUser) {
      setShowProModal(true);
      return;
    }
    setSelectedChannel(channel);
    if (!isProUser) {
      setAdCountdown(5);
    }
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

  const handleAddStream = (e) => {
    e.preventDefault();
    if (!newStreamName.trim() || !newStreamUrl.trim()) return;
    const created = {
      id: 'custom-' + Date.now(),
      name: newStreamName.trim(),
      category: newStreamCategory,
      badge: 'FREE',
      quality: 'CUSTOM HLS',
      viewers: 'LIVE',
      currentEvent: `Live ${newStreamCategory} Broadcast`,
      league: newStreamCategory,
      streamUrl: newStreamUrl.trim(),
      poster: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1000&q=80',
      epg: [{ time: 'LIVE NOW', title: newStreamName.trim() }]
    };
    const updated = [created, ...channels];
    setChannels(updated);
    localStorage.setItem('sportswave_channels_v2', JSON.stringify(updated));
    setSelectedChannel(created);
    setNewStreamName('');
    setNewStreamUrl('');
    setShowAddStreamModal(false);
  };

  const filteredChannels = channels.filter((ch) => {
    const matchesCat = activeCategory === 'All' || ch.category === activeCategory;
    const matchesSearch =
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.currentEvent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

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
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold px-2 py-0.5 rounded hidden md:inline">
              FOOTBALL: RMA 2 - 1 BAR (78&apos;)
            </span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold px-2 py-0.5 rounded hidden lg:inline">
              HOCKEY: PAK 3 - 2 NED (Q4)
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
                onClick={() => setShowAddStreamModal(true)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> + Add .m3u8
              </button>

              <button
                onClick={() => setIsProUser(!isProUser)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  isProUser
                    ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isProUser ? 'PRO ACTIVE' : 'GO PRO'}
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
              <HlsVideoPlayer
                streamUrl={selectedChannel.streamUrl}
                poster={selectedChannel.poster}
                channelName={selectedChannel.name}
              />

              {/* Pre-Roll Sponsor Ad Simulation for Free Users */}
              {adCountdown > 0 && !isProUser && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center z-20">
                  <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full mb-3">
                    SPORTS WAVE SPONSOR PRE-ROLL • {adCountdown}s
                  </span>
                  <h3 className="text-xl font-extrabold text-white mb-2">
                    Upgrade to SPORTS WAVE PRO for Instant Zero-Ad 4K 60FPS Streams
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mb-5">
                    Your live stream of <span className="text-emerald-400 font-semibold">{selectedChannel.name}</span> will start in {adCountdown} seconds.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setIsProUser(true);
                        setAdCountdown(0);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition cursor-pointer"
                    >
                      Unlock Ad-Free PRO Now
                    </button>
                    <button
                      onClick={() => setAdCountdown(0)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
                    >
                      Skip Demo Ad
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Active Stream Metadata Bar */}
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
                <span className="text-[11px] text-emerald-400 font-bold">{selectedChannel.category}</span>
              </div>

              <div className="space-y-2 mb-5">
                {selectedChannel.epg?.map((slot, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border ${
                      i === 0
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                        : 'bg-slate-950/60 border-white/5 text-slate-400'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-emerald-400">{slot.time}</div>
                    <div className="text-xs font-semibold mt-0.5">{slot.title}</div>
                  </div>
                ))}
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
                      selectedChannel.id === ch.id
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
                onClick={() => setShowAddStreamModal(true)}
                className="text-emerald-400 font-black underline cursor-pointer"
              >
                Add Channel
              </button>
            </div>
          </div>
        </div>

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
                  selectedChannel.id === channel.id
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
                    {channel.badge === 'PRO' ? (
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> PRO
                      </span>
                    ) : (
                      <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded">
                        FREE
                      </span>
                    )}
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

      {/* PRO Upgrade Modal */}
      {showProModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-400/40 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full">
                SPORTS WAVE PRO 4K PASS
              </span>
              <button onClick={() => setShowProModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-xl font-black text-white">
              Unlock All 4K Cricket, Football, Hockey, Cartoon & Wildlife Channels
            </h3>
            <p className="text-xs text-slate-300">
              Get instant access to <strong>Willow Cricket 4K</strong>, <strong>Ten Sports Football HD</strong>, <strong>EuroHockey Arena</strong>, and <strong>Nat Geo Wild 4K</strong> with zero ads.
            </p>
            <button
              onClick={() => {
                setIsProUser(true);
                setShowProModal(false);
              }}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black py-3 rounded-xl text-sm cursor-pointer"
            >
              Activate Free Demo PRO Pass Now
            </button>
          </div>
        </div>
      )}

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
                placeholder="e.g., Cartoon Network HD or A Sports"
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
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs cursor-pointer"
            >
              Save & Watch Live
            </button>
          </form>
        </div>
      )}
    </div>
  );
}