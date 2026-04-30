import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { corals } from '../data/corals';
import './AllCoralsPage.css';

export default function AllCoralsPage() {
  const [expandedCorals, setExpandedCorals] = useState({});
  const coralRows = corals.map((coral) => {
    const observations = getStoredObservationLog(coral.slug, coral);
    return {
      coral,
      latest: observations[0] ?? null,
      previous: observations.slice(1),
    };
  });

  return (
    <section className="all-corals-panel" aria-label="All corals table">
      <div className="all-corals-table-wrap">
        <table className="all-corals-table">
          <thead>
            <tr>
              <th scope="col">Coral ID</th>
              <th scope="col">Species</th>
              <th scope="col">Last observed</th>
              <th scope="col">Observer</th>
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
            {coralRows.map(({ coral, latest, previous }) => {
              const isExpanded = Boolean(expandedCorals[coral.slug]);
              return (
                <Fragment key={coral.slug}>
                  <tr>
                    <td>
                      <div className="coral-id-cell">
                        {previous.length > 0 ? (
                          <button
                            type="button"
                            className={`row-expand-btn ${isExpanded ? 'is-open' : ''}`}
                            onClick={() => toggleExpanded(coral.slug)}
                            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} previous observations for ${coral.coralId ?? coral.commonName}`}
                            aria-expanded={isExpanded}
                          >
                            ▶
                          </button>
                        ) : (
                          <span className="row-expand-spacer" aria-hidden="true" />
                        )}
                        <Link to={`/coral/${coral.slug}`}>{coral.coralId ?? 'Unassigned'}</Link>
                      </div>
                    </td>
                    <td>{coral.scientificName}</td>
                    <td>{formatRecordedAt(latest?.recordedAt ?? coral.lastRecorded)}</td>
                    <td>{latest?.observer ?? 'Citizen phone'}</td>
                    <td>{photoStatus(latest?.photo)}</td>
                    <td>{latest?.health ?? normalizeHealth(coral.lifeStatus)}</td>
                    <td>{latest?.bleaching ?? coral.bleaching ?? 'Not recorded'}</td>
                    <td>{latest?.height ?? parseSizePart(coral.colonySizeCm, 0) ?? 'Not recorded'}</td>
                    <td>{latest?.width ?? parseSizePart(coral.colonySizeCm, 1) ?? 'Not recorded'}</td>
                    <td>{latest?.disease ?? coral.diseaseSigns ?? 'Not recorded'}</td>
                    <td>{latest?.notes ?? 'Not recorded'}</td>
                  </tr>
                  {isExpanded && previous.map((entry) => (
                    <tr className="all-corals-table__history-row" key={`${coral.slug}-${entry.recordedAt}`}>
                      <td>
                        <span className="history-label" aria-hidden="true" />
                      </td>
                      <td />
                      <td>{formatRecordedAt(entry.recordedAt)}</td>
                      <td>{entry.observer}</td>
                      <td>{photoStatus(entry.photo)}</td>
                      <td>{entry.health ?? 'Unknown'}</td>
                      <td>{entry.bleaching ?? 'Not recorded'}</td>
                      <td>{entry.height ?? 'Not recorded'}</td>
                      <td>{entry.width ?? 'Not recorded'}</td>
                      <td>{entry.disease ?? 'Not recorded'}</td>
                      <td>{entry.notes ?? 'Not recorded'}</td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );

  function toggleExpanded(slug) {
    setExpandedCorals((prev) => ({ ...prev, [slug]: !prev[slug] }));
  }
}

function formatRecordedAt(value) {
  if (!value) return 'Unknown';
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

function storageKey(slug) {
  return `coral-observations-${slug}`;
}

function photoStatus(photo) {
  if (!photo) return 'Not recorded';
  if (String(photo).toLowerCase() === 'not recorded') return 'Not recorded';
  return 'Recorded';
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
