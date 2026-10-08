import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import FeatureHeader from '../components/FeatureHeader.jsx';
import { useVoiceAssistant } from '../context/VoiceAssistantContext.jsx';
import { extractKnowledgeQuery } from '../services/voiceCommands.js';
import { findKnowledgeEntry, searchKnowledgeEntries } from '../services/knowledgeBase.js';

export default function KnowledgePage() {
  const location = useLocation();
  const voice = useVoiceAssistant();
  const [query, setQuery] = useState('');
  const [entry, setEntry] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const explain = useCallback((value) => {
    const match = findKnowledgeEntry(value);
    setEntry(match || null);
    setNotFound(!match);
    if (match) voice.speak(`${match.name}. ${match.category}. ${match.description}`);
    else voice.speak(`I could not find ${value} in the offline starter library. Try one of the examples on this page.`);
  }, [voice.speak]);

  useEffect(() => {
    if (location.state?.voiceIntent !== 'KNOWLEDGE_LOOKUP') return;
    const nextQuery = extractKnowledgeQuery(location.state.voicePhrase || '');
    if (!nextQuery) return;
    setQuery(nextQuery);
    explain(nextQuery);
  }, [explain, location.key, location.state]);

  const results = searchKnowledgeEntries(query);

  return (
    <div className="tool-page">
      <FeatureHeader
        titleKey="knowledgeTitle"
        description="Ask about common animals, plants, materials, and natural resources. This small, curated starter library works offline; it is not a complete encyclopedia."
        icon={BookOpen}
      />
      <section className="tool-card knowledge-search">
        <h2>Ask BALA about an item</h2>
        <p className="muted-copy">Try “What is a dog?”, “Tell me about water”, or “Explain forests”. The answer comes from this on-device reference set.</p>
        <form className="destination-form" onSubmit={(event) => { event.preventDefault(); if (query.trim()) explain(query.trim()); }}>
          <label htmlFor="knowledge-query">Animal, plant, material, or resource</label>
          <input id="knowledge-query" value={query} onChange={(event) => { setQuery(event.target.value); setNotFound(false); }} maxLength={100} placeholder="For example, sunflower" />
          <button className="button button-lime" type="submit" disabled={!query.trim()}><Search size={16} />Explain this item</button>
        </form>
        {entry && <article className="knowledge-result" aria-live="polite">
          <div className="result-heading"><strong>{entry.name}</strong><span>{entry.category}</span></div>
          <p>{entry.description}</p>
          <button className="text-button" type="button" onClick={() => voice.speak(`${entry.name}. ${entry.description}`)}>Read this aloud</button>
        </article>}
        {notFound && <p className="knowledge-not-found" role="status">That item is not in the offline starter set yet. Try a suggested item below.</p>}
      </section>
      <section className="knowledge-browse" aria-labelledby="knowledge-browse-heading">
        <div className="section-subheading"><div><h2 id="knowledge-browse-heading">{query.trim() ? 'Matching items' : 'Browse the starter set'}</h2><p>{results.length} items available on this device</p></div></div>
        {results.length ? <ul className="knowledge-list">{results.map((item) => <li key={item.name}>
          <button type="button" onClick={() => { setQuery(item.name); explain(item.name); }}>
            <strong>{item.name}</strong><span>{item.category}</span>
          </button>
        </li>)}</ul> : <p className="empty-state">No matching items in the offline starter library.</p>}
      </section>
      <p className="privacy-note knowledge-privacy"><BookOpen size={15} />Information is stored in the app bundle and is available without an internet connection. BALA does not identify a real-world object from a camera in this feature.</p>
    </div>
  );
}
