import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import GamePlayer from "./components/GamePlayer";
import SchoolMode from "./pages/SchoolMode";
import CategoryPage from "./pages/CategoryPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/school-mode" element={<SchoolMode onExit={() => {}} />} />
        <Route path="/game/:id" element={<GamePlayer />} />
        {/* All games page */}
        <Route path="/games" element={<CategoryPage />} />
        <Route path="/all" element={<CategoryPage />} />
        {/* All category pages use the same CategoryPage component */}
        <Route path="/:category-games" element={<CategoryPage />} />
        {/* Additional routes for specific category names */}
        <Route path="/io-games" element={<CategoryPage />} />
        <Route path="/fps-games" element={<CategoryPage />} />
        <Route path="/new" element={<CategoryPage />} />
        <Route path="/trending" element={<CategoryPage />} />
        <Route path="/updated" element={<CategoryPage />} />
        <Route path="/originals" element={<CategoryPage />} />
        <Route path="/leaderboards" element={<CategoryPage />} />
        <Route path="/recent" element={<CategoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
