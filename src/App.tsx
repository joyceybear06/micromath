import { Routes, Route, Link } from "react-router-dom";
import Home from "./routes/Home";
import Play from "./routes/Play";
import Results from "./routes/Results";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-blue-600 text-white">
        <nav className="mx-auto max-w-5xl p-4 flex items-center gap-4">
          <Link to="/">Home</Link>
          <Link to="/play">Play</Link>
          <Link to="/results">Results</Link>
        </nav>
      </header>
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<Play />} />
          <Route path="/results" element={<Results />} />
          <Route path="*" element={<div className="p-6">404</div>} />
        </Routes>
      </main>
      <footer className="border-t">
        <div className="mx-auto max-w-5xl p-4 text-xs text-slate-500">
          © {new Date().getFullYear()} Micromath
        </div>
      </footer>
    </div>
  );
}
