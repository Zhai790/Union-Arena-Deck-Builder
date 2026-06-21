import { useDeckStore } from '../stores/deck-store';
import { getValidationSummary } from '../lib/rules/deck-validator';

export function ValidationResults() {
  const { currentDeck, validationResult, cardIndex } = useDeckStore();

  if (!currentDeck) {
    return null;
  }

  if (!validationResult) {
    return <div>Validating...</div>;
  }

  const summary = getValidationSummary(validationResult);
  const totalCards = currentDeck.cards.reduce((sum, card) => sum + card.count, 0);

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2>Deck: {currentDeck.name}</h2>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Total Cards:</strong> {totalCards} / 50
      </div>

      <div
        style={{
          padding: '1rem',
          borderRadius: '4px',
          background: validationResult.valid ? '#e8f5e9' : '#ffebee',
          border: `2px solid ${validationResult.valid ? '#4caf50' : '#f44336'}`,
          marginBottom: '1rem',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          {summary}
        </div>
      </div>

      {validationResult.errors.length > 0 && (
        <div>
          <h3 style={{ color: '#d32f2f' }}>Errors:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {validationResult.errors.map((error, index) => (
              <li
                key={index}
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: '#ffebee',
                  borderLeft: '4px solid #d32f2f',
                  borderRadius: '4px',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  [{error.rule}]
                </div>
                <div>{error.message}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {validationResult.warnings.length > 0 && (
        <div>
          <h3 style={{ color: '#f57c00' }}>Warnings:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {validationResult.warnings.map((warning, index) => (
              <li
                key={index}
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: '#fff3e0',
                  borderLeft: '4px solid #f57c00',
                  borderRadius: '4px',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  [{warning.rule}]
                </div>
                <div>{warning.message}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {validationResult.valid && (
        <div>
          <h3>Deck List:</h3>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: '14px' }}>
            {currentDeck.cards.map((deckCard) => {
              const card = cardIndex.get(deckCard.id);
              return (
                <li
                  key={deckCard.id}
                  style={{
                    padding: '0.5rem',
                    marginBottom: '0.25rem',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    {deckCard.count}x {card?.name || `Unknown (${deckCard.id})`}
                  </span>
                  {card && (
                    <span style={{ color: '#666' }}>
                      AP: {card.ap} | BP: {card.bp} | {card.primaryColor}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
