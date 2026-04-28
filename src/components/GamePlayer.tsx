import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { allGames as games } from "@/data/games";

const CDN = "https://mattiasmicu.github.io/notsocrazy/public";

// Game Card with hover effect
const GameThumb = ({ game }: { game: typeof games[0] }) => {
  const [isHovered, setIsHovered] = useState(false);
  if (!game) return null;

  return (
    <Link
      to={`/game/${game.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ aspectRatio: '16/9', background: '#212233', position: 'relative' }}>
          <img
            src={`${CDN}/games/${game.id}/thumbnail.jpg`}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => { 
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />

          {/* Title slides up on hover */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '8px',
            background: isHovered ? 'rgba(12, 13, 20, 0.9)' : 'transparent',
            transform: isHovered ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.2s ease, background 0.2s ease',
            color: '#F9FAFF',
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: "'Nunito', sans-serif",
            lineHeight: 1.2
          }}>
            {game.title}
          </div>
        </div>
      </div>
    </Link>
  );
};

const Logo = () => (
  <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
    <img src="/logo.svg" style={{ width: 36, height: 36 }} />
    <div style={{ lineHeight: 1.1 }}>
      <div style={{ fontWeight: 800, color: "#F9FAFF" }}>not so</div>
      <div style={{ fontWeight: 800, color: "#F9FAFF" }}>crazy</div>
    </div>
  </Link>
);

const Header = () => (
  <div style={{
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    background: "#1A1B28",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    zIndex: 100
  }}>
    <Logo />
  </div>
);

const Sidebar = ({ expanded, setExpanded }: any) => {
  const menuItems = [
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Home.svg", label: "Home", path: "/" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Recent.svg", label: "Recently played", path: "/recent", disabled: true },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/New.svg", label: "New", path: "/new" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Trending.svg", label: "Popular Games", path: "/trending" },
    { divider: true },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Action.svg", label: "Action", path: "/action-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Adventure.svg", label: "Adventure", path: "/adventure-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Basketball.svg", label: "Basketball", path: "/basketball-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Bike.svg", label: "Bike", path: "/bike-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Car.svg", label: "Racing", path: "/racing-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Card.svg", label: "Card", path: "/card-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Casual.svg", label: "Casual", path: "/casual-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Puzzle.svg", label: "Puzzle", path: "/puzzle-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Shooting.svg", label: "Shooting", path: "/shooting-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Sports.svg", label: "Sports", path: "/sports-games" },
  ];

  return (
    <nav
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        position: "fixed",
        top: 64,
        left: 0,
        bottom: 0,
        width: expanded ? 200 : 64,
        backgroundColor: "#0C0D14",
        zIndex: 200,
        overflowY: "auto",
        overflowX: "hidden",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        transition: "width 0.2s ease",
        WebkitOverflowScrolling: "touch",
        borderRight: "1px solid #2F3148"
      }}
    >
      <div style={{
        padding: "12px 8px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        width: expanded ? 200 : 64
      }}>
        {menuItems.map((item, index) => {
          if (item.divider) {
            return <div key={`divider-${index}`} style={{ height: "1px", backgroundColor: "#2F3148", margin: "8px 4px" }} />;
          }
          return (
            <Link
              key={item.path}
              to={item.path || "/"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px",
                borderRadius: "8px",
                textDecoration: "none",
                cursor: item.disabled ? "default" : "pointer",
                opacity: item.disabled ? 0.5 : 1,
                pointerEvents: item.disabled ? "none" : "auto"
              }}
            >
              <img src={item.icon} alt="" loading="lazy" style={{ width: "28px", height: "28px", flexShrink: 0 }} />
              {expanded && (
                <span style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#AAADBE",
                  whiteSpace: "nowrap",
                  fontFamily: "'Nunito', sans-serif"
                }}>{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

const Btn = ({ children, onClick }: any) => (
  <button
    onClick={onClick}
    style={{
      width: 38,
      height: 38,
      borderRadius: 8,
      border: "none",
      background: "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#EFF0F7",
      cursor: "pointer"
    }}
  >
    {children}
  </button>
);

const IconFS = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} stroke="currentColor" fill="none" strokeWidth={2}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
  </svg>
);

const IconLike = ({ active }: any) => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill={active ? "#22c55e" : "none"} stroke={active ? "#22c55e" : "currentColor"} strokeWidth={2}>
    <path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>
  </svg>
);

const IconDislike = ({ active }: any) => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill={active ? "#ef4444" : "none"} stroke={active ? "#ef4444" : "currentColor"} strokeWidth={2}>
    <path d="M17 14V2M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/>
  </svg>
);

const IconHeart = ({ active }: any) => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill={active ? "#ef4444" : "none"} stroke={active ? "#ef4444" : "currentColor"} strokeWidth={2}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

export default function GamePlayer() {
  const { id } = useParams();
  const game = games.find(g => g.id === id);

  const iframeRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState<"up" | "down" | null>(null);
  const [fav, setFav] = useState(false);
  const [fs, setFs] = useState(false);
  const [hideBar, setHideBar] = useState(false);

  useEffect(() => {
    const f = () => {
      const isFullscreen = !!document.fullscreenElement;
      setFs(isFullscreen);
      if (!isFullscreen) {
        setHideBar(false);
      }
    };
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);

  if (!game) return <div style={{ color: "#fff" }}>Game not found</div>;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) iframeRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  const suggestions = games.filter(g => g.id !== game.id).slice(0, 12);

  return (
    <div style={{ background: "#0C0D14", minHeight: "100vh", color: "#fff" }}>
      <Header />
      <Sidebar expanded={expanded} setExpanded={setExpanded} />

      <div style={{ marginLeft: 64, marginTop: 64, padding: 20 }}>
        <div style={{ display: "flex", gap: 20 }}>

          <div style={{ flex: 1 }}>

            <div
              ref={iframeRef}
              style={{
                borderRadius: 12,
                overflow: "hidden",
                background: "#000",
                aspectRatio: "16/9",
                width: "100%",
                position: "relative"
              }}
            >
              <iframe
                src={game.path}
                style={{ width: "100%", height: "100%", border: "none" }}
                allowFullScreen
                allow="cross-origin-isolated"
              />
              <div style={{
                display: hideBar ? "none" : "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#212233",
                padding: "6px 10px",
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0
              }}>
                <div style={{ fontWeight: 700 }}>{game.title}</div>

                {fs && (
                  <Btn onClick={() => setHideBar(!hideBar)}>
                    {hideBar ? "Show" : "Hide"}
                  </Btn>
                )}

                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <Btn onClick={() => setLiked(liked === "up" ? null : "up")}>
                    <IconLike active={liked === "up"} />
                  </Btn>
                  <Btn onClick={() => setLiked(liked === "down" ? null : "down")}>
                    <IconDislike active={liked === "down"} />
                  </Btn>
                  <Btn onClick={() => setFav(!fav)}>
                    <IconHeart active={fav} />
                  </Btn>
                  <Btn onClick={toggleFullscreen}>
                    <IconFS />
                  </Btn>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>{game.title}</h1>

              <div style={{ color: "#AAADBE", margin: "8px 0", fontSize: "14px" }}>
                {game.category}
              </div>

              <p style={{ maxWidth: 700, lineHeight: 1.6, color: "#EFF0F7", fontSize: "15px" }}>{game.description}</p>
            </div>

          </div>

          <div style={{ width: 300 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Play next</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {suggestions.map(g => (
                <GameThumb key={g.id} game={g} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
