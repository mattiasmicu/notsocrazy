export interface Game {
  id: string;
  title: string;
  description: string;
  category: string;
  rating: number;
  plays: number;
  path: string;
  thumbnail?: string;
}
