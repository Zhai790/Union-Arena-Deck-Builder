import { useDeckStore } from '../stores/deck-store';
import { exportDeckJSON } from '../lib/storage/deck-storage';

export function DeckExport() {
  const { currentDeck, validationResult, saveCurrentDeck, savedDecks } = useDeckStore();

  const handleExport = () => {
    if (!currentDeck) return;

    const json = exportDeckJSON(currentDeck);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDeck.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    saveCurrentDeck();
    alert(`Deck "${currentDeck?.name}" saved successfully!`);
  };

  const handleCopyJSON = () => {
    if (!currentDeck) return;
    const json = exportDeckJSON(currentDeck);
    navigator.clipboard.writeText(json);
    alert('Deck JSON copied to clipboard!');
  };

  if (!currentDeck) {
    return null;
  }

  const isValid = validationResult?.valid || false;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2>Actions</h2>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={handleSave}
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
          💾 Save Deck
        </button>

        <button
          onClick={handleExport}
          disabled={!isValid}
          style={{
            padding: '0.75rem 1.5rem',
            background: isValid ? '#1976d2' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isValid ? 'pointer' : 'not-allowed',
            fontSize: '16px',
          }}
        >
          📥 Export JSON File
        </button>

        <button
          onClick={handleCopyJSON}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          📋 Copy JSON
        </button>
      </div>

      {savedDecks.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Saved Decks</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {savedDecks.map((deck) => (
              <li
                key={deck.name}
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>{deck.name}</strong>
                  {deck.updatedAt && (
                    <span style={{ color: '#666', fontSize: '12px', marginLeft: '1rem' }}>
                      Updated: {new Date(deck.updatedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => useDeckStore.getState().loadDeck(deck.name)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Load
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
