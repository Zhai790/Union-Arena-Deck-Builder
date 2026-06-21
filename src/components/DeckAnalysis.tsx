import { useDeckStore } from '../stores/deck-store';
import { analyzeDeck } from '../lib/analysis/deck-scorer';
import { gradeForFormat, getFormatName, getFormatDescription, type DeckFormat } from '../lib/grading/format-grader';
import { useMemo, useState } from 'react';

export function DeckAnalysis() {
  const { currentDeck, cardIndex, validationResult, cards } = useDeckStore();
  const [selectedFormat, setSelectedFormat] = useState<DeckFormat>('rare-battles');

  const baseAnalysis = useMemo(() => {
    if (!currentDeck || !validationResult?.valid || cardIndex.size === 0) {
      return null;
    }
    return analyzeDeck(currentDeck, cardIndex, cards);
  }, [currentDeck, cardIndex, validationResult, cards]);

  const analysis = useMemo(() => {
    if (!baseAnalysis) return null;
    return gradeForFormat(baseAnalysis, selectedFormat);
  }, [baseAnalysis, selectedFormat]);

  if (!analysis || !baseAnalysis) {
    return null;
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#8bc34a';
    if (score >= 40) return '#ff9800';
    return '#f44336';
  };

  const getGradeLabel = (score: number): string => {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2>📊 Deck Analysis</h2>

      {/* Format Selector */}
      <div style={{
        background: '#f5f5f5',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
      }}>
        <label style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
          📋 Format:
        </label>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
          <button
            onClick={() => setSelectedFormat('rare-battles')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: selectedFormat === 'rare-battles' ? '#2196f3' : '#fff',
              color: selectedFormat === 'rare-battles' ? '#fff' : '#333',
              border: `2px solid ${selectedFormat === 'rare-battles' ? '#2196f3' : '#ddd'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            🎯 Rare Battles
          </button>
          <button
            onClick={() => setSelectedFormat('meta-tierlist')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: selectedFormat === 'meta-tierlist' ? '#2196f3' : '#fff',
              color: selectedFormat === 'meta-tierlist' ? '#fff' : '#333',
              border: `2px solid ${selectedFormat === 'meta-tierlist' ? '#2196f3' : '#ddd'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            ⚔️ Meta Tierlist
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
          {getFormatDescription(selectedFormat)}
        </p>
      </div>

      {/* Format-Specific Insights */}
      {analysis.formatInsights.length > 0 && (
        <div style={{
          background: '#e3f2fd',
          border: '2px solid #2196f3',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>
            {getFormatName(selectedFormat)} Insights
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {analysis.formatInsights.map((insight, i) => (
              <li key={i} style={{ marginBottom: '0.5rem' }}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Overall Score */}
      <div style={{
        background: '#f5f5f5',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: getScoreColor(analysis.overallScore) }}>
          {analysis.overallScore}
          <span style={{ fontSize: '24px', marginLeft: '8px' }}>
            / 100
          </span>
        </div>
        <div style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: getScoreColor(analysis.overallScore),
          marginTop: '8px',
        }}>
          Grade: {getGradeLabel(analysis.overallScore)}
        </div>
      </div>

      {/* Category Scores */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        {Object.entries(analysis.categoryScores).map(([category, score]) => (
          <div
            key={category}
            style={{
              background: '#fff',
              border: `2px solid ${getScoreColor(score)}`,
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center',
            }}
          >
            <div style={{
              fontSize: '14px',
              textTransform: 'capitalize',
              color: '#666',
              marginBottom: '8px',
            }}>
              {category}
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: getScoreColor(score),
            }}>
              {score}
            </div>
          </div>
        ))}
      </div>

      {/* Strengths & Weaknesses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ color: '#4caf50', marginBottom: '0.5rem' }}>💪 Strengths</h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {baseAnalysis.strengths.length > 0 ? (
              baseAnalysis.strengths.map((strength, i) => (
                <li key={i} style={{ marginBottom: '0.5rem' }}>{strength}</li>
              ))
            ) : (
              <li style={{ color: '#999' }}>No major strengths identified</li>
            )}
          </ul>
        </div>
        <div>
          <h3 style={{ color: '#f44336', marginBottom: '0.5rem' }}>⚠️ Weaknesses</h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {baseAnalysis.weaknesses.length > 0 ? (
              baseAnalysis.weaknesses.map((weakness, i) => (
                <li key={i} style={{ marginBottom: '0.5rem' }}>{weakness}</li>
              ))
            ) : (
              <li style={{ color: '#999' }}>No major weaknesses identified</li>
            )}
          </ul>
        </div>
      </div>

      {/* Curve Visualization */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3>📈 Mana Curve (Avg: {baseAnalysis.curveAnalysis.averageAP} AP)</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '150px' }}>
          {baseAnalysis.curveAnalysis.curveData.map((point) => {
            const maxCount = Math.max(...baseAnalysis.curveAnalysis.curveData.map(p => p.count));
            const heightPercent = (point.count / maxCount) * 100;

            return (
              <div
                key={point.apCost}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}
              >
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '4px',
                }}>
                  {point.count}
                </div>
                <div
                  style={{
                    width: '100%',
                    height: `${heightPercent}%`,
                    background: '#2196f3',
                    borderRadius: '4px 4px 0 0',
                    minHeight: '20px',
                  }}
                />
                <div style={{
                  marginTop: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}>
                  {point.apCost}
                </div>
              </div>
            );
          })}
        </div>
        {baseAnalysis.curveAnalysis.insights.length > 0 && (
          <div style={{ marginTop: '1rem', fontSize: '14px', color: '#666' }}>
            {baseAnalysis.curveAnalysis.insights.map((insight, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>{insight}</div>
            ))}
          </div>
        )}
      </div>

      {/* Synergies */}
      {baseAnalysis.synergyAnalysis.synergies.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3>🔗 Detected Synergies</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {baseAnalysis.synergyAnalysis.synergies.map((synergy, i) => (
              <div
                key={i}
                style={{
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{
                      background: '#2196f3',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      marginRight: '8px',
                    }}>
                      {synergy.type}
                    </span>
                    <span style={{ fontSize: '14px' }}>{synergy.description}</span>
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: getScoreColor(synergy.strength * 10),
                  }}>
                    {synergy.strength}/10
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem', fontSize: '14px', color: '#666' }}>
            {baseAnalysis.synergyAnalysis.insights.map((insight, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>{insight}</div>
            ))}
          </div>
        </div>
      )}

      {/* General Recommendations */}
      {baseAnalysis.recommendations.length > 0 && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>💡 General Recommendations</h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {baseAnalysis.recommendations.map((rec, i) => (
              <li key={i} style={{ marginBottom: '0.5rem' }}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Card-Specific Recommendations */}
      {baseAnalysis.cardRecommendations.length > 0 && (
        <div>
          <h3>🔄 Suggested Card Swaps</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '1rem' }}>
            Cards from the same IP that could improve your deck:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {baseAnalysis.cardRecommendations.map((rec, i) => {
              const removeImage = rec.remove.images?.small || rec.remove.images?.large;
              const addImage = rec.add.images?.small || rec.add.images?.large;

              return (
                <div
                  key={i}
                  style={{
                    background: '#fff',
                    border: `3px solid ${rec.impact === 'high' ? '#4caf50' : rec.impact === 'medium' ? '#ff9800' : '#999'}`,
                    borderRadius: '12px',
                    padding: '1.5rem',
                  }}
                >
                  {/* Impact Badge */}
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{
                      background: rec.impact === 'high' ? '#4caf50' : rec.impact === 'medium' ? '#ff9800' : '#999',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      fontWeight: 'bold',
                    }}>
                      {rec.impact} IMPACT
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '2rem', alignItems: 'start' }}>
                    {/* Remove card */}
                    <div>
                      <div style={{ fontSize: '14px', color: '#f44336', fontWeight: 'bold', marginBottom: '8px' }}>
                        ❌ REMOVE
                      </div>

                      {/* Card Image */}
                      {removeImage && (
                        <img
                          src={removeImage}
                          alt={rec.remove.name}
                          style={{
                            width: '100%',
                            maxWidth: '200px',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            border: '2px solid #ddd',
                          }}
                          loading="lazy"
                        />
                      )}

                      <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
                        {rec.remove.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                        {rec.remove.code}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                        <strong>AP:</strong> {rec.remove.ap} • <strong>BP:</strong> {rec.remove.bp}
                      </div>

                      {/* Full Effect */}
                      {rec.remove.effect && rec.remove.effect !== '-' && (
                        <div style={{
                          fontSize: '11px',
                          color: '#444',
                          background: '#f9f9f9',
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          marginBottom: '8px',
                        }}>
                          <strong>Effect:</strong> {rec.remove.effect}
                        </div>
                      )}

                      {rec.remove.trigger && rec.remove.trigger !== '-' && (
                        <div style={{
                          fontSize: '11px',
                          color: '#444',
                          background: '#fff3cd',
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid #ffc107',
                        }}>
                          <strong>Trigger:</strong> {rec.remove.trigger}
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <div style={{ fontSize: '48px', color: '#4caf50', alignSelf: 'center' }}>→</div>

                    {/* Add card */}
                    <div>
                      <div style={{ fontSize: '14px', color: '#4caf50', fontWeight: 'bold', marginBottom: '8px' }}>
                        ✅ ADD
                      </div>

                      {/* Card Image */}
                      {addImage && (
                        <img
                          src={addImage}
                          alt={rec.add.name}
                          style={{
                            width: '100%',
                            maxWidth: '200px',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            border: '2px solid #4caf50',
                          }}
                          loading="lazy"
                        />
                      )}

                      <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
                        {rec.add.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                        {rec.add.code}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                        <strong>AP:</strong> {rec.add.ap} • <strong>BP:</strong> {rec.add.bp}
                      </div>

                      {/* Full Effect */}
                      {rec.add.effect && rec.add.effect !== '-' && (
                        <div style={{
                          fontSize: '11px',
                          color: '#444',
                          background: '#f9f9f9',
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          marginBottom: '8px',
                        }}>
                          <strong>Effect:</strong> {rec.add.effect}
                        </div>
                      )}

                      {rec.add.trigger && rec.add.trigger !== '-' && (
                        <div style={{
                          fontSize: '11px',
                          color: '#444',
                          background: '#fff3cd',
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid #ffc107',
                        }}>
                          <strong>Trigger:</strong> {rec.add.trigger}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reason */}
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#e8f5e9',
                    borderRadius: '8px',
                    fontSize: '14px',
                    borderLeft: '4px solid #4caf50',
                  }}>
                    <strong>💡 Why this swap:</strong> {rec.reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
