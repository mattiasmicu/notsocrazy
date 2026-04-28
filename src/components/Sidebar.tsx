import { Link, useLocation } from "react-router-dom";

// Exact menu from CrazyGames with real icon URLs
const menuItems = [
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Home.svg", label: "Home", path: "/" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Recent.svg", label: "Recently played", path: "/recent", disabled: true },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/New.svg", label: "New", path: "/new" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Trending.svg", label: "Popular Games", path: "/trending" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Updated.svg", label: "Updated", path: "/updated" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Originals.svg", label: "Originals", path: "/originals" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Multiplayer.svg", label: "Multiplayer", path: "/multiplayer" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Leaderboards.svg", label: "Leaderboards", path: "/leaderboards" },
  { divider: true },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Action.svg", label: "Action", path: "/category/Action" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Adventure.svg", label: "Adventure", path: "/category/Adventure" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Basketball.svg", label: "Basketball", path: "/category/Basketball" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Bike.svg", label: "Bike", path: "/category/Bike" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Car.svg", label: "Car", path: "/category/Car" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Card.svg", label: "Card", path: "/category/Card" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Casual.svg", label: "Casual", path: "/category/Casual" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Clicker.svg", label: "Clicker", path: "/category/Clicker" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Controller.svg", label: "Controller", path: "/category/Controller" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Driving.svg", label: "Driving", path: "/category/Driving" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Flash.svg", label: "Flash", path: "/category/Flash" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/FPS.svg", label: "FPS", path: "/category/FPS" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/io.svg", label: ".io", path: "/category/IO" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Mahjong.svg", label: "Mahjong", path: "/category/Mahjong" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Minecraft.svg", label: "Minecraft", path: "/category/Minecraft" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Pool.svg", label: "Pool", path: "/category/Pool" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Puzzle.svg", label: "Puzzle", path: "/category/Puzzle" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Shooting.svg", label: "Shooting", path: "/category/Shooting" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Soccer.svg", label: "Soccer", path: "/category/Soccer" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Sports.svg", label: "Sports", path: "/category/Sports" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/Stickman.svg", label: "Stickman", path: "/category/Stickman" },
  { icon: "https://imgs.crazygames.com/icon/mono-sidebar-icons-2/TowerDefense.svg", label: "Tower Defense", path: "/category/TowerDefense" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: "72px",
        backgroundColor: "#0C0D14",
        zIndex: 200,
        overflowY: "auto",
        overflowX: "hidden",
        transition: "width 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.width = "200px";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.width = "72px";
      }}
    >
      <div
        style={{
          padding: "16px 8px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          minWidth: "200px",
        }}
      >
        {menuItems.map((item, index) => {
          if (item.divider) {
            return (
              <div
                key={`divider-${index}`}
                style={{
                  height: "1px",
                  backgroundColor: "#2F3148",
                  margin: "8px 4px",
                }}
              />
            );
          }

          const isActive = item.path ? 
            (location.pathname === item.path || location.pathname.startsWith(item.path + "/")) : 
            false;

          const linkContent = (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px",
                borderRadius: "8px",
                cursor: item.disabled ? "default" : "pointer",
                opacity: item.disabled ? 0.5 : 1,
                backgroundColor: isActive ? "#6842FF" : "transparent",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive && !item.disabled) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#1A1B28";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive && !item.disabled) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }
              }}
            >
              <img
                src={item.icon}
                alt=""
                loading="lazy"
                style={{
                  width: "28px",
                  height: "28px",
                  flexShrink: 0,
                  filter: isActive ? "brightness(1.2)" : "none",
                }}
              />
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: isActive ? "#FFFFFF" : "#AAADBE",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                {item.label}
              </span>
            </div>
          );

          if (item.disabled || !item.path) {
            return <div key={item.label || index}>{linkContent}</div>;
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                textDecoration: "none",
                display: "block",
              }}
            >
              {linkContent}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
