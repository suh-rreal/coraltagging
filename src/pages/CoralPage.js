import { Link, useParams } from 'react-router-dom';
import { getCoralBySlug } from '../data/corals';
import './CoralPage.css';

export default function CoralPage() {
  const { slug } = useParams();
  const coral = getCoralBySlug(slug);

  if (!coral) {
    return (
      <div className="coral-page coral-page--empty">
        <p>We don’t have a coral with that link.</p>
        <Link to="/">← Back to dashboard</Link>
      </div>
    );
  }

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const observations = getObservationLog(coral);

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
                  <td>{entry.photo ?? 'Not recorded'}</td>
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

    </article>
  );
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
      disease: entry.disease ?? entry.diseaseSigns ?? 'Not recorded',
      notes: entry.notes ?? 'Not recorded',
    }))
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
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

function parseSizePart(colonySizeCm, partIndex) {
  if (!colonySizeCm) return undefined;
  const parts = String(colonySizeCm).split('x').map((part) => part.trim());
  return parts[partIndex];
}
