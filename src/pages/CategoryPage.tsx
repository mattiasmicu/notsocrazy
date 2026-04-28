import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { allGames } from "@/data/games";

const hideScrollbarStyle = `.hide-scrollbar::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}`;

const Logo = () => (
  <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
    <img src="/logo.svg" alt="" style={{ width: '36px', height: '36px' }} />
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
      <span style={{ fontSize: '18px', fontWeight: 800, color: '#F9FAFF', fontFamily: '"Nunito", sans-serif' }}>not so</span>
      <span style={{ fontSize: '18px', fontWeight: 800, color: '#F9FAFF', fontFamily: '"Nunito", sans-serif' }}>crazy</span>
    </div>
  </Link>
);

const TopSearch = () => {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  
  const filteredGames = query.length > 0 
    ? allGames.filter(game => 
        game.title?.toLowerCase().includes(query.toLowerCase()) ||
        game.description?.toLowerCase().includes(query.toLowerCase()) ||
        game.category?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
      <div style={{
        position: 'absolute', left: '14px', top: '50%',
        transform: 'translateY(-50%)', color: '#AAADBE', zIndex: 2, pointerEvents: 'none'
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search games..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowResults(e.target.value.length > 0);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Tab' && filteredGames.length > 0) {
            e.preventDefault();
            const firstGame = filteredGames[0];
            if (firstGame) {
              window.location.href = `/game/${firstGame.id}`;
            }
          }
        }}
        onFocus={() => setShowResults(query.length > 0)}
        onBlur={() => setTimeout(() => setShowResults(false), 300)}
        style={{
          width: '100%', padding: '10px 36px 10px 42px', borderRadius: '30px',
          border: '2px solid #2F3148', background: '#212233', color: '#F9FAFF',
          fontSize: '14px', outline: 'none', fontFamily: '"Nunito", sans-serif',
          fontWeight: 600, transition: 'border-color 0.15s'
        }}
      />
      {query && (
        <button onClick={() => { setQuery(''); setShowResults(false); }} style={{
          position: 'absolute', right: '12px', top: '50%',
          transform: 'translateY(-50%)', background: '#2F3148', border: 'none',
          color: '#AAADBE', cursor: 'pointer', borderRadius: '50%',
          width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>×</button>
      )}
      
      {showResults && filteredGames.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          marginTop: '8px', background: '#1A1B26', borderRadius: '12px',
          border: '1px solid #2F3148', maxHeight: '400px', overflowY: 'auto',
          zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          {filteredGames.map((game) => (
            <Link
              key={game.id}
              to={`/game/${game.id}`}
              onClick={() => { setQuery(''); setShowResults(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px', textDecoration: 'none', color: '#F9FAFF',
                borderBottom: '1px solid #2F3148', transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#212233'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; }}
            >
              <img
                src={game.thumbnail || `/games/${game.id}/thumbnail.jpg`}
                alt={game.title}
                style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', fontFamily: '"Nunito", sans-serif' }}>
                  {game.title}
                </div>
                <div style={{ fontSize: '12px', color: '#AAADBE', fontFamily: '"Nunito", sans-serif' }}>
                  {game.category}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {showResults && query.length > 0 && filteredGames.length === 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          marginTop: '8px', background: '#1A1B26', borderRadius: '12px',
          border: '1px solid #2F3148', padding: '16px', textAlign: 'center',
          color: '#AAADBE', fontSize: '14px', fontFamily: '"Nunito", sans-serif',
          zIndex: 1000
        }}>
          No games found for "{query}"
        </div>
      )}
    </div>
  );
};

const Header = () => (
  <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: '64px', background: '#1A1B28', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '24px' }}>
    <Logo />
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
      <TopSearch />
    </div>
    <div style={{ width: '100px' }} />
  </header>
);

const Sidebar = ({ isExpanded, setIsExpanded }: { isExpanded: boolean; setIsExpanded: (v: boolean) => void }) => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = hideScrollbarStyle;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const menuItems = [
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Home.svg", label: "Home", path: "/" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Recent.svg", label: "Recently played", path: "/recent", disabled: true },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/New.svg", label: "New", path: "/new" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Trending.svg", label: "Popular Games", path: "/trending" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Updated.svg", label: "Updated", path: "/updated" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Originals.svg", label: "Originals", path: "/originals" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Multiplayer.svg", label: "Multiplayer", path: "/multiplayer-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Leaderboards.svg", label: "Leaderboards", path: "/leaderboards" },
    { divider: true },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Action.svg", label: "Action", path: "/action-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Adventure.svg", label: "Adventure", path: "/adventure-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Basketball.svg", label: "Basketball", path: "/basketball-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Bike.svg", label: "Bike", path: "/bike-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Car.svg", label: "Racing", path: "/racing-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Card.svg", label: "Card", path: "/card-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Casual.svg", label: "Casual", path: "/casual-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Clicker.svg", label: "Clicker", path: "/clicker-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Controller.svg", label: "Controller", path: "/controller-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Driving.svg", label: "Driving", path: "/driving-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Flash.svg", label: "Flash", path: "/flash-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/FPS.svg", label: "FPS", path: "/fps-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/IO.svg", label: ".io Games", path: "/io-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Mahjong.svg", label: "Mahjong", path: "/mahjong-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Minecraft.svg", label: "Minecraft", path: "/minecraft-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Pool.svg", label: "Pool", path: "/pool-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Puzzle.svg", label: "Puzzle", path: "/puzzle-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Shooting.svg", label: "Shooting", path: "/shooting-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Soccer.svg", label: "Soccer", path: "/soccer-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Sports.svg", label: "Sports", path: "/sports-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Stickman.svg", label: "Stickman", path: "/stickman-games" },
    { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/TowerDefense.svg", label: "Tower Defense", path: "/towerdefense-games" },
  ];

  return (
    <nav className="hide-scrollbar" style={{ position: 'fixed', left: 0, top: 64, bottom: 0, width: isExpanded ? '200px' : '64px', backgroundColor: '#0C0D14', zIndex: 200, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none', transition: 'width 0.2s ease', WebkitOverflowScrolling: 'touch', borderRight: '1px solid #2F3148' }} onMouseEnter={() => setIsExpanded(true)} onMouseLeave={() => setIsExpanded(false)}>
      <div style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px', width: isExpanded ? '200px' : '64px' }}>
        {menuItems.map((item, index) => {
          if (item.divider) return <div key={`divider-${index}`} style={{ height: '1px', backgroundColor: '#2F3148', margin: '8px 4px' }} />;
          return (
            <Link key={item.path} to={item.path || '/'} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '8px', textDecoration: 'none', cursor: item.disabled ? 'default' : 'pointer', opacity: item.disabled ? 0.5 : 1, pointerEvents: item.disabled ? 'none' : 'auto' }} onMouseEnter={(e) => { if (!item.disabled) (e.currentTarget as HTMLElement).style.backgroundColor = '#1A1B28'; }} onMouseLeave={(e) => { if (!item.disabled) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
              <img src={item.icon} alt="" loading="lazy" style={{ width: '28px', height: '28px', flexShrink: 0 }} />
              {isExpanded && <span style={{ fontSize: '14px', fontWeight: 700, color: '#AAADBE', whiteSpace: 'nowrap', fontFamily: '"Nunito", sans-serif' }}>{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

// Game Card with hover effect (title shows on hover)
const GameCard = ({ game, large = false }: { game: any; large?: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);
  if (!game) return null;

  return (
    <Link
      to={`/game/${game.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ aspectRatio: '16/9', background: '#212233', position: 'relative' }}>
          <img
            src={game.thumbnail || `/games/${game.id}/thumbnail.jpg`}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => { 
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100%25" height="100%25"%3E%3Crect fill="%23222" width="100%25" height="100%25"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
          />

          {/* Featured/Hot badges */}
          <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', flexDirection: 'row', gap: '4px' }}>
            {game.featured && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '2px',
                background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                color: '#fff', fontSize: '11px', fontWeight: 700,
                padding: '2px 6px', borderRadius: '4px'
              }}>
                <span style={{
                  display: 'inline-block', width: '20px', height: '20px',
                  backgroundImage: 'url(https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Originals.svg)',
                  backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
                  filter: 'brightness(0) invert(1)'
                }} />
                Originals
              </div>
            )}
            {game.trending && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '2px',
                background: 'linear-gradient(135deg, #FB923C, #FCD34D)',
                color: '#fff', fontSize: '11px', fontWeight: 700,
                padding: '2px 6px', borderRadius: '4px'
              }}>
                <span style={{
                  display: 'inline-block', width: '20px', height: '20px',
                  backgroundImage: 'url(https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Trending.svg)',
                  backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
                  filter: 'brightness(0) invert(1)'
                }} />
                Hot
              </div>
            )}
          </div>

          {/* Title on hover */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: large ? '16px' : '12px',
            background: isHovered ? 'rgba(12, 13, 20, 0.9)' : 'transparent',
            transform: isHovered ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.2s ease, background 0.2s ease',
            color: '#F9FAFF',
            fontSize: large ? '18px' : '15px',
            fontWeight: 700,
            fontFamily: "'Nunito', sans-serif"
          }}>
            {game.title}
          </div>
        </div>
      </div>
    </Link>
  );
};

type SortOption = 'popular' | 'newest' | 'rating' | 'name';

const CategoryPage = () => {
  const { category } = useParams();
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const categoryName = category?.replace('-games', '') || '';
  
  const isAllGames = !categoryName || categoryName === 'all' || categoryName === 'games' || categoryName === 'new' || categoryName === 'trending';
  
  const categoryGames = useMemo(() => {
    let filtered = isAllGames 
      ? [...allGames] 
      : allGames.filter(game => {
          if (!game.category) return false;
          const gameCategory = game.category.toLowerCase();
          const searchCategory = categoryName.toLowerCase();
          
          if (gameCategory === searchCategory) return true;
          if (gameCategory.includes(searchCategory) || searchCategory.includes(gameCategory)) return true;
          if (searchCategory === 'racing' && (gameCategory.includes('car') || gameCategory.includes('driving') || gameCategory.includes('bike'))) return true;
          if (searchCategory === 'action' && (gameCategory.includes('shooting') || gameCategory.includes('fps') || gameCategory.includes('fighting'))) return true;
          if (searchCategory === 'multiplayer' && (gameCategory.includes('2 player') || gameCategory.includes('pvp') || gameCategory.includes('online'))) return true;
          if (searchCategory === 'io' && (gameCategory.includes('.io') || gameCategory.includes('io'))) return true;
          if (searchCategory === 'puzzle' && (gameCategory.includes('puzzle') || gameCategory.includes('brain'))) return true;
          if (searchCategory === 'sports' && (gameCategory.includes('sports') || gameCategory.includes('basketball') || gameCategory.includes('soccer'))) return true;
          
          return false;
        });

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(game => 
        game.title?.toLowerCase().includes(query) ||
        game.description?.toLowerCase().includes(query) ||
        game.category?.toLowerCase().includes(query)
      );
    }

    // Sort games
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.plays || 0) - (a.plays || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'name':
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
    }

    return filtered;
  }, [categoryName, sortBy, isAllGames, searchQuery]);

  const formatCategoryName = (name: string) => {
    if (!name || name === 'all' || name === 'games') return 'All Games';
    if (name === 'new') return 'New Games';
    if (name === 'trending') return 'Popular Games';
    if (name === 'io') return '.io Games';
    return name.charAt(0).toUpperCase() + name.slice(1) + ' Games';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0C0D14' }}>
      <Header />
      <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      
      <div style={{ marginLeft: '64px', marginTop: '64px', padding: '24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F9FAFF', marginBottom: '8px', fontFamily: '"Nunito", sans-serif' }}>
                {formatCategoryName(categoryName)}
              </h1>
              <p style={{ fontSize: '16px', color: '#AAADBE', fontFamily: '"Nunito", sans-serif' }}>
                {categoryGames.length} games found
              </p>
            </div>
            
            {/* Search Bar */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#AAADBE', pointerEvents: 'none' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 36px 10px 42px',
                  borderRadius: '30px',
                  border: '2px solid #2F3148',
                  background: '#212233',
                  color: '#F9FAFF',
                  fontSize: '14px',
                  outline: 'none',
                  fontFamily: '"Nunito", sans-serif'
                }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: '#2F3148', border: 'none', color: '#AAADBE', cursor: 'pointer',
                    borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >×</button>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['popular', 'newest', 'rating', 'name'] as SortOption[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: sortBy === option ? '#6842FF' : '#1A1B28',
                    color: '#F9FAFF',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: '"Nunito", sans-serif',
                    cursor: 'pointer',
                  }}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Uniform grid like HomePage */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {categoryGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>

          {categoryGames.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ color: '#AAADBE', fontSize: '18px', marginBottom: '16px', fontFamily: '"Nunito", sans-serif' }}>
                No games found.
              </p>
              <Link 
                to="/" 
                style={{ 
                  display: 'inline-block', background: '#6842FF', color: '#fff', 
                  padding: '12px 24px', borderRadius: '8px', textDecoration: 'none',
                  fontWeight: 600, fontFamily: '"Nunito", sans-serif'
                }}
              >
                Go to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
