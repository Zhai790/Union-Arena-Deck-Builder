import { useEffect } from 'react';
import { useDeckStore } from './stores/deck-store';
import { DeckInput } from './components/DeckInput';
import { ValidationResults } from './components/ValidationResults';
import { DeckExport } from './components/DeckExport';
import { DeckVisualizer } from './components/DeckVisualizer';
import { DeckAnalysis } from './components/DeckAnalysis';

function App() {
  const { cardsLoading, cardsError, initializeCards, loadSavedDecks, newDeck } = useDeckStore();

  useEffect(() => {
    initializeCards();
    loadSavedDecks();
  }, [initializeCards, loadSavedDecks]);

  if (cardsLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Union Arena Deck Builder</h1>
        <p>Loading card database...</p>
      </div>
    );
  }

  if (cardsError) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Union Arena Deck Builder</h1>
        <div style={{ color: '#d32f2f', marginTop: '2rem' }}>
          <h2>Error Loading Cards</h2>
          <p>{cardsError}</p>
          <button
            onClick={() => initializeCards()}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '2px solid #1976d2', paddingBottom: '1rem' }}>
        <h1 style={{ margin: 0, color: '#1976d2' }}>Union Arena Deck Builder</h1>
        <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
          Phase 2: Intelligent deck analysis & optimization
        </p>
      </header>

      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={newDeck}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ➕ New Deck
        </button>
      </div>

      <DeckInput />
      <ValidationResults />
      <DeckAnalysis />
      <DeckVisualizer />
      <DeckExport />

      <footer style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #ddd', color: '#666', fontSize: '14px' }}>
        <p>
          <strong>Rules Validated:</strong> 50 cards exactly | 4-copy limit | IP Lock (same series) | Mono-color (same primary energy)
        </p>
        <p>
          Card data from{' '}
          <a href="https://github.com/J-W-A-Ships/Union_Arena" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>
            J-W-A-Ships/Union_Arena
          </a>
          {' '}(20+ series including Tokyo Ghoul, BLEACH, Hunter x Hunter, JJK, and more)
        </p>
      </footer>
    </div>
  );
}

export default App;
