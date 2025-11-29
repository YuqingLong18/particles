import React, { useState } from 'react';
import Scene from './components/Scene';

function App() {
  const [mode, setMode] = useState('math'); // 'math' or 'molecule'
  const [shape, setShape] = useState('koch');
  const [moleculeType, setMoleculeType] = useState('H2O');
  const [useHandControl, setUseHandControl] = useState(false);
  const [showPanel, setShowPanel] = useState(true);

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
                  className={mode === 'galaxy' ? 'active' : ''}
                  onClick={() => setMode('galaxy')}
                >
                  Galaxy
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
        useHandControl={useHandControl}
      />
    </>
  );
}

export default App;
