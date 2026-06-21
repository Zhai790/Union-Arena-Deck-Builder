import { useDeckStore } from '../stores/deck-store';

export function DeckVisualizer() {
  const { currentDeck, cardIndex } = useDeckStore();

  if (!currentDeck || currentDeck.cards.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2>Deck List ({currentDeck.cards.reduce((sum, c) => sum + c.count, 0)} cards)</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem',
        marginTop: '1rem'
      }}>
        {currentDeck.cards.map((deckCard) => {
          const card = cardIndex.get(deckCard.id);
          const imageUrl = card?.images?.small || card?.images?.large;

          return (
            <div
              key={deckCard.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '0.5rem',
                background: '#fff',
                position: 'relative',
              }}
            >
              {/* Count Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  zIndex: 1,
                }}
              >
                {deckCard.count}x
              </div>

              {/* Card Image */}
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={card?.name || deckCard.id}
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '4px',
                    display: 'block',
                  }}
                  loading="lazy"
                  onError={(e) => {
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '280px',
                    background: '#f0f0f0',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                  }}
                >
                  No Image
                </div>
              )}

              {/* Card Info */}
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                  {card?.name || deckCard.id}
                </div>
                {card && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    <div>{card.code}</div>
                    <div>
                      {card.type} • {card.primaryColor}
                    </div>
                    <div>
                      AP: {card.ap} • BP: {card.bp}
                    </div>
                    {card.rarity && (
                      <div style={{
                        marginTop: '4px',
                        padding: '2px 6px',
                        background: getRarityColor(card.rarity),
                        color: 'white',
                        borderRadius: '3px',
                        fontSize: '11px',
                        display: 'inline-block',
                      }}>
                        {card.rarity}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getRarityColor(rarity: string): string {
  const rarityLower = rarity.toLowerCase();
  if (rarityLower.includes('common')) return '#888';
  if (rarityLower.includes('uncommon')) return '#4caf50';
  if (rarityLower.includes('rare')) return '#2196f3';
  if (rarityLower.includes('super')) return '#9c27b0';
  if (rarityLower.includes('secret')) return '#ff9800';
  return '#666';
}
