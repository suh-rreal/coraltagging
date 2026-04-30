import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCoralBySlug } from '../data/corals';
import './CoralPage.css';

export default function CoralPage() {
  const { slug } = useParams();
  const coral = getCoralBySlug(slug);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [showAddPrompt, setShowAddPrompt] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [cameraError, setCameraError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [observations, setObservations] = useState(() => getStoredObservationLog(slug, coral));
  const [newObservation, setNewObservation] = useState({
    photo: '',
    health: 'Alive',
    bleaching: 'None',
    height: '',
    width: '',
    disease: 'Unsure',
    notes: '',
  });

  useEffect(() => () => stopCamera(), []);

  if (!coral) {
    return (
      <div className="coral-page coral-page--empty">
        <p>We don’t have a coral with that link.</p>
        <Link to="/">← Back to dashboard</Link>
      </div>
    );
  }

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const stepLabels = ['Photo', 'Health', 'Bleaching', 'Height', 'Width', 'Disease', 'Notes'];

  return (
    <article className="coral-page">
      <header className="coral-header">
        <h1 className="coral-title">{coral.coralId ?? 'Unassigned Coral ID'}</h1>
        <p className="coral-scientific">{coral.scientificName}</p>
      </header>

      <div className="coral-share">
        <span className="coral-share-label">Page link</span>
        <code className="coral-share-url">{pageUrl || `/coral/${coral.slug}`}</code>
        <p className="coral-share-hint">Copy the URL from your browser’s address bar to share this page.</p>
      </div>

      <section className="coral-observations">
        <h2 className="coral-observations-title">Observation Log ({observations.length})</h2>
        <div className="coral-observations-table-wrap">
          <table className="coral-observations-table">
            <thead>
              <tr>
                <th scope="col">Observer</th>
                <th scope="col">Observed at</th>
                <th scope="col">Photo</th>
                <th scope="col">Health</th>
                <th scope="col">Bleaching</th>
                <th scope="col">Height (cm)</th>
                <th scope="col">Width (cm)</th>
                <th scope="col">Disease</th>
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              {observations.map((entry) => (
                <tr key={`${coral.slug}-${entry.recordedAt}`}>
                  <td>{entry.observer}</td>
                  <td>{formatRecordedAt(entry.recordedAt)}</td>
                  <td>
                    {isPhotoValue(entry.photo) ? (
                      <img src={entry.photo} alt="Captured coral observation" className="observation-photo-thumb" />
                    ) : (
                      entry.photo ?? 'Not recorded'
                    )}
                  </td>
                  <td>{entry.health ?? 'Unknown'}</td>
                  <td>{entry.bleaching ?? 'Not recorded'}</td>
                  <td>{entry.height ?? 'Not recorded'}</td>
                  <td>{entry.width ?? 'Not recorded'}</td>
                  <td>{entry.disease ?? 'Not recorded'}</td>
                  <td>{entry.notes ?? 'Not recorded'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showAddPrompt && (
        <div className="observation-modal-backdrop" role="presentation">
          <div className="observation-modal" role="dialog" aria-modal="true" aria-labelledby="add-observation-title">
            <h3 id="add-observation-title">Add a new observation?</h3>
            <p>Would you like to add a new coral observation before viewing the page?</p>
            <div className="observation-modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowAddPrompt(false)}>No</button>
              <button type="button" className="btn-primary" onClick={startWizard}>Yes</button>
            </div>
          </div>
        </div>
      )}

      {showWizard && (
        <div className="observation-modal-backdrop" role="presentation">
          <div className="observation-modal observation-modal--wide" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
            <h3 id="wizard-title">New Observation ({wizardStep + 1}/{stepLabels.length}): {stepLabels[wizardStep]}</h3>

            {wizardStep === 0 && (
              <div className="wizard-block">
                <p>Take a picture of the coral.</p>
                {!isCameraActive && (
                  <button type="button" className="btn-secondary" onClick={startCamera}>Access camera</button>
                )}
                {cameraError && <p className="wizard-error">{cameraError}</p>}
                <video ref={videoRef} className="observation-camera" autoPlay playsInline muted />
                {isCameraActive && (
                  <div className="observation-modal-actions">
                    <button type="button" className="btn-secondary" onClick={capturePhoto}>Capture photo</button>
                  </div>
                )}
                {newObservation.photo && (
                  <img className="observation-photo-preview" src={newObservation.photo} alt="New observation preview" />
                )}
              </div>
            )}

            {wizardStep === 1 && (
              <div className="wizard-block">
                <p>Choose health status.</p>
                <div className="option-row">
                  <button type="button" className={newObservation.health === 'Alive' ? 'btn-primary' : 'btn-secondary'} onClick={() => setNewObservation((prev) => ({ ...prev, health: 'Alive' }))}>Alive</button>
                  <button type="button" className={newObservation.health === 'Dead' ? 'btn-primary' : 'btn-secondary'} onClick={() => setNewObservation((prev) => ({ ...prev, health: 'Dead' }))}>Dead</button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="wizard-block">
                <p>Choose bleaching level.</p>
                <div className="option-row">
                  {['None', 'Little', 'Moderate', 'Severe'].map((value) => (
                    <button key={value} type="button" className={newObservation.bleaching === value ? 'btn-primary' : 'btn-secondary'} onClick={() => setNewObservation((prev) => ({ ...prev, bleaching: value }))}>{value}</button>
                  ))}
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="wizard-block">
                <label htmlFor="height-display">Enter height (cm).</label>
                <input id="height-display" type="text" value={newObservation.height} readOnly aria-readonly="true" />
                <NumericKeypad
                  value={newObservation.height}
                  onChange={(nextValue) => setNewObservation((prev) => ({ ...prev, height: nextValue }))}
                />
              </div>
            )}

            {wizardStep === 4 && (
              <div className="wizard-block">
                <label htmlFor="width-display">Enter width (cm).</label>
                <input id="width-display" type="text" value={newObservation.width} readOnly aria-readonly="true" />
                <NumericKeypad
                  value={newObservation.width}
                  onChange={(nextValue) => setNewObservation((prev) => ({ ...prev, width: nextValue }))}
                />
              </div>
            )}

            {wizardStep === 5 && (
              <div className="wizard-block">
                <p>Disease observed?</p>
                <div className="option-row">
                  {['Yes', 'No', 'Unsure'].map((value) => (
                    <button key={value} type="button" className={newObservation.disease === value ? 'btn-primary' : 'btn-secondary'} onClick={() => setNewObservation((prev) => ({ ...prev, disease: value }))}>{value}</button>
                  ))}
                </div>
              </div>
            )}

            {wizardStep === 6 && (
              <div className="wizard-block">
                <label htmlFor="notes-input">Add notes.</label>
                <textarea id="notes-input" rows={4} value={newObservation.notes} onChange={(event) => setNewObservation((prev) => ({ ...prev, notes: event.target.value }))} />
              </div>
            )}

            <div className="observation-modal-actions">
              <button type="button" className="btn-secondary" onClick={cancelWizard}>Cancel</button>
              {wizardStep > 0 && <button type="button" className="btn-secondary" onClick={() => setWizardStep((prev) => prev - 1)}>Back</button>}
              {wizardStep < stepLabels.length - 1 ? (
                <button type="button" className="btn-primary" onClick={() => setWizardStep((prev) => prev + 1)}>Next</button>
              ) : (
                <button type="button" className="btn-primary" onClick={saveObservation}>Save observation</button>
              )}
            </div>
          </div>
        </div>
      )}

    </article>
  );

  function startWizard() {
    setShowAddPrompt(false);
    setShowWizard(true);
    setWizardStep(0);
  }

  async function startCamera() {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (error) {
      setCameraError('Camera access failed. You can continue and leave photo as Not recorded.');
      setIsCameraActive(false);
    }
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setNewObservation((prev) => ({ ...prev, photo: dataUrl }));
    stopCamera();
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }

  function cancelWizard() {
    stopCamera();
    setShowWizard(false);
  }

  function saveObservation() {
    const now = new Date();
    const entry = {
      recordedAt: now.toISOString(),
      observer: 'Citizen phone',
      photo: newObservation.photo || 'Not recorded',
      health: normalizeHealth(newObservation.health),
      bleaching: normalizeBleaching(newObservation.bleaching),
      height: newObservation.height || 'Not recorded',
      width: newObservation.width || 'Not recorded',
      disease: normalizeDisease(newObservation.disease),
      notes: newObservation.notes?.trim() || 'Not recorded',
    };
    const next = [entry, ...observations];
    setObservations(next);
    persistObservationLog(slug, next);
    stopCamera();
    setShowWizard(false);
    setNewObservation({
      photo: '',
      health: 'Alive',
      bleaching: 'None',
      height: '',
      width: '',
      disease: 'Unsure',
      notes: '',
    });
  }
}

function formatRecordedAt(value) {
  if (!value) return 'Not recorded';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

function getObservationLog(coral) {
  const rawObservations = Array.isArray(coral.observations) && coral.observations.length > 0
    ? coral.observations
    : [{
      recordedAt: coral.lastRecorded,
      photo: 'Not recorded',
      observer: 'Citizen phone',
      health: coral.lifeStatus,
      bleaching: coral.bleaching,
      height: parseSizePart(coral.colonySizeCm, 0),
      width: parseSizePart(coral.colonySizeCm, 1),
      disease: coral.diseaseSigns,
      notes: coral.notes,
    }];

  return [...rawObservations]
    .map((entry) => ({
      recordedAt: entry.recordedAt,
      observer: normalizeObserver(entry.observer, entry.phoneId),
      photo: entry.photo ?? 'Not recorded',
      health: normalizeHealth(entry.health ?? entry.lifeStatus),
      bleaching: normalizeBleaching(entry.bleaching),
      height: entry.height ?? parseSizePart(entry.colonySizeCm, 0) ?? 'Not recorded',
      width: entry.width ?? parseSizePart(entry.colonySizeCm, 1) ?? 'Not recorded',
      disease: normalizeDisease(entry.disease ?? entry.diseaseSigns),
      notes: entry.notes ?? 'Not recorded',
    }))
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
}

function getStoredObservationLog(slug, coral) {
  const fallback = getObservationLog(coral);
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = window.localStorage.getItem(storageKey(slug));
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

function persistObservationLog(slug, observations) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(observations));
  } catch {
    // ignore storage errors in readonly/private contexts
  }
}

function storageKey(slug) {
  return `coral-observations-${slug}`;
}

function isPhotoValue(value) {
  return typeof value === 'string' && value.startsWith('data:image');
}

function normalizeObserver(observer, phoneId) {
  if (observer) return observer;
  if (phoneId) return `Research phone (${phoneId})`;
  return 'Citizen phone';
}

function normalizeHealth(value) {
  if (!value) return 'Unknown';
  const lowered = String(value).toLowerCase();
  if (lowered.includes('dead')) return 'Dead';
  if (lowered.includes('alive')) return 'Alive';
  return value;
}

function normalizeBleaching(value) {
  if (!value) return 'None';
  const lowered = String(value).toLowerCase();
  if (lowered.includes('severe')) return 'Severe';
  if (lowered.includes('moderate')) return 'Moderate';
  if (lowered.includes('little') || lowered.includes('mild') || lowered.includes('localized') || lowered.includes('partial')) return 'Little';
  if (lowered.includes('none') || lowered.includes('no bleaching') || lowered.includes('no')) return 'None';
  return 'Little';
}

function normalizeDisease(value) {
  if (!value) return 'Unsure';
  const lowered = String(value).toLowerCase();
  if (lowered.includes('yes') || lowered.includes('disease') || lowered.includes('lesion') || lowered.includes('spot')) return 'Yes';
  if (lowered.includes('no') || lowered.includes('none')) return 'No';
  if (lowered.includes('unsure') || lowered.includes('unknown')) return 'Unsure';
  return 'Unsure';
}

function parseSizePart(colonySizeCm, partIndex) {
  if (!colonySizeCm) return undefined;
  const parts = String(colonySizeCm).split('x').map((part) => part.trim());
  return parts[partIndex];
}

function NumericKeypad({ value, onChange }) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div className="numeric-keypad" aria-label="Numeric keypad">
      {digits.map((digit) => (
        <button
          key={digit}
          type="button"
          className="numeric-keypad__digit"
          onClick={() => onChange(`${value}${digit}`)}
        >
          {digit}
        </button>
      ))}
      <button
        type="button"
        className="numeric-keypad__action"
        onClick={() => onChange(value.slice(0, -1))}
      >
        Del
      </button>
      <button
        type="button"
        className="numeric-keypad__action"
        onClick={() => onChange('')}
      >
        Clear
      </button>
    </div>
  );
}
