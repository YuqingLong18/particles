import React, { useState } from 'react';
import Scene from './components/Scene';
import { fetchMoleculeData } from './utils/aiMolecule';

function App() {
  const [mode, setMode] = useState('welcome'); // Default to welcome page
  const [shape, setShape] = useState('koch');
  const [moleculeType, setMoleculeType] = useState('H2O');
  const [useHandControl, setUseHandControl] = useState(false);
  const [showPanel, setShowPanel] = useState(true);

  // AI Molecule State
  const [customMolecule, setCustomMolecule] = useState(null);
  const [moleculeQuery, setMoleculeQuery] = useState('');
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const model = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-pro-1.5';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateMolecule = async () => {
    if (!moleculeQuery) {
      setError("Please enter a molecule name.");
      return;
    }

    if (!apiKey) {
      setError("API Key not found in environment variables.");
      return;
    }

    // Client-side validation
    if (moleculeQuery.length > 100) {
      setError("Molecule name is too long (max 100 characters).");
      return;
    }

    // Check for dangerous characters
    if (!/^[a-zA-Z0-9\s\-'.()]+$/.test(moleculeQuery)) {
      setError("Molecule name contains invalid characters. Please use only letters, numbers, spaces, and basic punctuation.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchMoleculeData(moleculeQuery, apiKey, model);
      setCustomMolecule(data);
      setMoleculeType('custom'); // Switch to custom type
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const mathShapes = [
    { id: 'koch', label: 'Koch Fractal' },
    { id: 'cardioid', label: 'Cardioid' },
    { id: 'butterfly', label: 'Butterfly' },
    { id: 'spiral', label: 'Archimedean Spiral' },
    { id: 'catenary', label: 'Catenary' },
    { id: 'lemniscate', label: 'Lemniscate' },
    { id: 'rose', label: 'Rose Curve' },
    { id: 'klein', label: 'Klein Bottle' },
    { id: 'lorenz', label: 'Lorenz Attractor' },
    { id: 'mandelbulb', label: 'Mandelbulb' },
    { id: 'orbitals', label: 'Electron Orbitals' },
    { id: 'julia', label: 'Quaternion Julia Set' },
  ];

  const molecules = [
    { id: 'H2O', label: 'Water (H₂O)' },
    { id: 'CO2', label: 'Carbon Dioxide (CO₂)' },
    { id: 'Methane', label: 'Methane (CH₄)' },
    { id: 'NH3', label: 'Ammonia (NH₃)' },
    { id: 'O2', label: 'Oxygen (O₂)' },
    { id: 'N2', label: 'Nitrogen (N₂)' },
    { id: 'HCl', label: 'Hydrogen Chloride (HCl)' },
    { id: 'Ethanol', label: 'Ethanol (C₂H₅OH)' },
    { id: 'Benzene', label: 'Benzene (C₆H₆)' },
  ];

  return (
    <>
      <div className={`ui-overlay ${!showPanel ? 'minimized' : ''}`}>
        <div className="ui-header">
          <div className="ui-title">Cosmic Particles</div>
          <button
            className="ui-toggle"
            onClick={() => setShowPanel(!showPanel)}
            title={showPanel ? "Hide Controls" : "Show Controls"}
          >
            {showPanel ? '−' : '+'}
          </button>
        </div>

        {showPanel && (
          <>
            <div className="ui-section">
              <span className="ui-label">Mode</span>
              <div className="ui-buttons">
                <button
                  className={mode === 'welcome' ? 'active' : ''}
                  onClick={() => setMode('welcome')}
                >
                  Welcome
                </button>
                <button
                  className={mode === 'math' ? 'active' : ''}
                  onClick={() => setMode('math')}
                >
                  Math
                </button>
                <button
                  className={mode === 'molecule' ? 'active' : ''}
                  onClick={() => setMode('molecule')}
                >
                  Chemistry
                </button>
                <button
                  className={mode === 'solarSystem' ? 'active' : ''}
                  onClick={() => setMode('solarSystem')}
                >
                  Solar System
                </button>
                <button
                  className={mode === 'artifact' ? 'active' : ''}
                  onClick={() => { setMode('artifact'); setShape('pyramid'); }}
                >
                  Artifacts
                </button>
                <button
                  className={mode === 'audio' ? 'active' : ''}
                  onClick={() => setMode('audio')}
                >
                  Audio
                </button>
              </div>
            </div>

            {mode === 'math' && (
              <div className="ui-section">
                <span className="ui-label">Curve</span>
                <div className="ui-buttons">
                  {mathShapes.map(s => (
                    <button
                      key={s.id}
                      className={shape === s.id ? 'active' : ''}
                      onClick={() => setShape(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'artifact' && (
              <div className="ui-section">
                <span className="ui-label">Artifact</span>
                <div className="ui-buttons">
                  <button className={shape === 'pyramid' ? 'active' : ''} onClick={() => setShape('pyramid')}>Pyramid</button>
                  <button className={shape === 'column' ? 'active' : ''} onClick={() => setShape('column')}>Greek Column</button>
                  <button className={shape === 'vase' ? 'active' : ''} onClick={() => setShape('vase')}>Vase</button>
                </div>
              </div>
            )}

            {mode === 'molecule' && (
              <div className="ui-section">
                <span className="ui-label">Molecule</span>
                <div className="ui-buttons">
                  {molecules.map(m => (
                    <button
                      key={m.id}
                      className={moleculeType === m.id ? 'active' : ''}
                      onClick={() => setMoleculeType(m.id)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                  <span className="ui-label">AI Generator</span>
                  <input
                    type="text"
                    placeholder="Enter molecule name (e.g., Caffeine, Glucose)"
                    value={moleculeQuery}
                    onChange={(e) => setMoleculeQuery(e.target.value)}
                    className="ui-input"
                  />
                  {/* API Key input removed, using env var */}
                  <button
                    onClick={handleGenerateMolecule}
                    disabled={isLoading}
                    style={{ width: '100%', marginTop: '5px', background: isLoading ? '#555' : 'rgba(255, 255, 255, 0.1)' }}
                  >
                    {isLoading ? 'Generating...' : 'Generate 3D Model'}
                  </button>
                  {error && <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '5px' }}>{error}</div>}
                </div>
              </div>
            )}

            <div className="ui-section">
              <span className="ui-label">Control</span>
              <div className="ui-buttons">
                <button
                  className={useHandControl ? 'active' : ''}
                  onClick={() => setUseHandControl(!useHandControl)}
                >
                  {useHandControl ? 'Hand Gestures On' : 'Mouse Control'}
                </button>
              </div>
              {useHandControl && (
                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>
                  • Pinch: Zoom<br />
                  • Fist: Rotate<br />
                  • Palm: Pan
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Scene
        mode={mode}
        shape={shape}
        moleculeType={moleculeType}
        customMolecule={customMolecule}
        useHandControl={useHandControl}
      />
    </>
  );
}

export default App;
