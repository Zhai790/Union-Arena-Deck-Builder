import { useState } from 'react';
import { importDeckJSON } from '../lib/storage/deck-storage';
import { useDeckStore } from '../stores/deck-store';

export function DeckInput() {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const setCurrentDeck = useDeckStore((state) => state.setCurrentDeck);

  const handleImport = () => {
    try {
      const deck = importDeckJSON(jsonInput);
      setCurrentDeck(deck);
      setError(null);
      setJsonInput(''); // Clear input after successful import
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import deck');
    }
  };

  const exampleDeck = {
    name: 'Example Deck',
    cards: [
      { id: 'UA01BT-001', count: 4 },
      { id: 'UA01BT-002', count: 3 },
      // Add more cards to reach 50 total
    ],
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2>Import Deck</h2>
      <p style={{ color: '#666', marginBottom: '1rem' }}>
        Paste your deck JSON below. Example format:
      </p>
      <pre
        style={{
          background: '#f5f5f5',
          padding: '1rem',
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto',
        }}
      >
        {JSON.stringify(exampleDeck, null, 2)}
      </pre>

      <textarea
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
        placeholder="Paste deck JSON here..."
        style={{
          width: '100%',
          minHeight: '200px',
          padding: '1rem',
          fontFamily: 'monospace',
          fontSize: '14px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          marginTop: '1rem',
        }}
      />

      {error && (
        <div
          style={{
            color: '#d32f2f',
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: '#ffebee',
            borderRadius: '4px',
          }}
        >
          Error: {error}
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={!jsonInput.trim()}
        style={{
          marginTop: '1rem',
          padding: '0.75rem 1.5rem',
          background: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: jsonInput.trim() ? 'pointer' : 'not-allowed',
          fontSize: '16px',
          opacity: jsonInput.trim() ? 1 : 0.5,
        }}
      >
        Import Deck
      </button>
    </div>
  );
}
