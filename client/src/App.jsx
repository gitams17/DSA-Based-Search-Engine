import { useState } from 'react';
import axios from 'axios';
import { Search, Loader2 } from 'lucide-react';
import ProblemCard from './components/ProblemCard';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      // Assuming backend runs on port 3000
      const { data } = await axios.get(`http://localhost:3000/search?q=${encodeURIComponent(query)}`);
      setResults(data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          DSA Search Engine
        </h1>
        <p className="text-lg text-gray-500">
          Find coding problems across LeetCode, Codeforces, AtCoder, CSES, and CodeChef.
        </p>
      </header>

      <form onSubmit={handleSearch} className="mb-10 relative">
        <div className="relative">
          <input
            type="text"
            className="w-full p-4 pl-12 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg"
            placeholder="Search for 'dynamic programming', 'graph', 'knapsack'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-6 rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Search'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {loading && <div className="text-center text-gray-500 py-8">Searching the corpus...</div>}
        
        {!loading && hasSearched && results.length === 0 && (
          <div className="text-center text-gray-500 py-8">No results found. Try different keywords.</div>
        )}

        <div className="grid gap-4 md:grid-cols-1">
          {results.map((problem, idx) => (
            <ProblemCard key={idx} problem={problem} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;