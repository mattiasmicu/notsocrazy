import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { allGames } from "@/data/games";
import { Flame, Star as StarIcon, Sparkles, Zap, Puzzle, Trophy, Car, Target, Sword, Gamepad2, Heart } from "lucide-react";

const categoryIcons: Record<string, React.ElementType> = {
  Action: Zap,
  Puzzle: Puzzle,
  Sports: Trophy,
  Racing: Car,
  Shooter: Target,
  Adventure: Sword,
  Arcade: Gamepad2,
};

interface GamesPageProps {
  type?: "trending" | "featured" | "new" | "category";
}

export default function GamesPage({ type }: GamesPageProps) {
  const { category } = useParams();

  const { title, Icon, games } = useMemo(() => {
    switch (type) {
      case "trending":
        return {
          title: "Trending Games",
          Icon: Flame,
          games: allGames.filter((g) => g.trending).slice(0, 20),
        };
      case "featured":
        return {
          title: "Featured Games",
          Icon: StarIcon,
          games: allGames.filter((g) => g.featured).slice(0, 20),
        };
      case "new":
        return {
          title: "New Games",
          Icon: Sparkles,
          games: allGames.filter((g) => g.new).slice(0, 20),
        };
      case "category":
        const catIcon = category ? categoryIcons[category] || Gamepad2 : Gamepad2;
        return {
          title: category ? `${category} Games` : "Category",
          Icon: catIcon,
          games: category ? allGames.filter((g) => g.category === category) : allGames,
        };
      default:
        return { title: "Games", Icon: Gamepad2, games: allGames };
    }
  }, [type, category]);

  return (
    <div className="min-h-screen bg-background py-6 px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Icon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{title}</h1>
        <span className="text-muted-foreground">({games.length} games)</span>
      </div>

      {/* Games Grid */}
      {games.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No games found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {games.map((game) => (
            <a
              key={game.id}
              href={`/game/${game.id}`}
              className="game-card group relative overflow-hidden rounded-lg bg-card border shadow-sm hover:shadow-md transition-all"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={game.thumbnail}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm truncate">{game.title}</h3>
                <p className="text-xs text-muted-foreground">{game.category}</p>
                {game.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs">{game.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
