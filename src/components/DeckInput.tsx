import { useState } from 'react';
import { importDeckJSON } from '../lib/storage/deck-storage';
import { parseTextDeck, detectDeckFormat } from '../lib/storage/text-deck-parser';
import { useDeckStore } from '../stores/deck-store';

export function DeckInput() {
  const [deckInput, setDeckInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const setCurrentDeck = useDeckStore((state) => state.setCurrentDeck);

  const handleImport = () => {
    try {
      const format = detectDeckFormat(deckInput);

      let deck;
      if (format === 'json') {
        deck = importDeckJSON(deckInput);
      } else {
        deck = parseTextDeck(deckInput);
      }

      setCurrentDeck(deck);
      setError(null);
      setDeckInput(''); // Clear input after successful import
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import deck');
    }
  };

  const exampleText = `// Main Deck
4 x TKG-1-080
4 x TKG-1-081
3 x TKG-1-084

// Also supports full format:
4 x UA47BT-TKG-1-080`;

  const exampleJSON = {
    name: 'Example Deck',
    cards: [
      { id: 'TKG-1-001', count: 4 },
      { id: 'TKG-1-002', count: 3 },
    ],
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2>Import Deck</h2>
      <p style={{ color: '#666', marginBottom: '0.5rem' }}>
        Paste your deck below. Supports <strong>text format</strong> or JSON.
      </p>
      <p style={{ color: '#1976d2', fontSize: '13px', marginBottom: '0.5rem', fontWeight: 'bold' }}>
        💡 Tip: Use <strong>short format</strong> (TKG-1-080) or <strong>full format</strong> (UA47BT-TKG-1-080).
        Match the format from your deck export tool.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '0.5rem' }}>Text Format:</p>
          <pre
            style={{
              background: '#f5f5f5',
              padding: '0.75rem',
              borderRadius: '4px',
              fontSize: '11px',
              overflow: 'auto',
              margin: 0,
            }}
          >
            {exampleText}
          </pre>
        </div>
        <div>
          <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '0.5rem' }}>JSON Format:</p>
          <pre
            style={{
              background: '#f5f5f5',
              padding: '0.75rem',
              borderRadius: '4px',
              fontSize: '11px',
              overflow: 'auto',
              margin: 0,
            }}
          >
            {JSON.stringify(exampleJSON, null, 2)}
          </pre>
        </div>
      </div>

      <textarea
        value={deckInput}
        onChange={(e) => setDeckInput(e.target.value)}
        placeholder="Paste deck here (text or JSON format)..."
        style={{
          width: '100%',
          minHeight: '200px',
          padding: '1rem',
          fontFamily: 'monospace',
          fontSize: '14px',
          border: '1px solid #ddd',
          borderRadius: '4px',
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
        disabled={!deckInput.trim()}
        style={{
          marginTop: '1rem',
          padding: '0.75rem 1.5rem',
          background: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: deckInput.trim() ? 'pointer' : 'not-allowed',
          fontSize: '16px',
          opacity: deckInput.trim() ? 1 : 0.5,
        }}
      >
        Import Deck
      </button>
    </div>
  );
}
