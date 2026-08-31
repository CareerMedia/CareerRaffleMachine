import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { getRaffleService } from '../../services';
import { subscribeToStorageUpdates } from '../../services/storage/persistentStore';
import { getAppUrl } from '../../lib/appUrl';
import type { Raffle } from '../../types/raffle';
import './RaffleControlPage.css';

type ControlTab = 'settings' | 'participants' | 'winners' | 'display';

export function RaffleControlPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<Raffle['status']>('draft');
  const [prizeCount, setPrizeCount] = useState('10');
  const [participantsText, setParticipantsText] = useState('');
  const [activeTab, setActiveTab] = useState<ControlTab>('settings');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadRaffle = useCallback(async () => {
    if (!id) return;
    const data = await getRaffleService().getRaffle(id);
    if (data) {
      setRaffle(data);
      setTitle(data.title);
      setStatus(data.status);
      setPrizeCount(String(data.prizeCount));
      const eligible = data.participants.filter((p) => p.eligible).map((p) => p.name);
      setParticipantsText(eligible.join('\n'));
    } else {
      setRaffle(null);
    }
  }, [id]);

  useEffect(() => {
    loadRaffle();
    return subscribeToStorageUpdates(() => {
      loadRaffle();
    });
  }, [loadRaffle]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await getRaffleService().updateRaffle(id, {
        title,
        status,
        prizeCount: Number(prizeCount),
        participantsText,
      });
      await loadRaffle();
      setMessage('Raffle settings saved.');
    } catch {
      setError('Could not save raffle settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !raffle) return;
    const confirmed = window.confirm(
      `Delete "${raffle.title}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await getRaffleService().deleteRaffle(id);
      navigate('/admin/raffles');
    } catch {
      setError('Could not delete raffle.');
    }
  };

  if (!raffle) {
    return (
      <div className="control-page">
        <p className="control-page__empty">Raffle not found.</p>
        <Link to="/admin/raffles" className="control-page__back">
          ← Back to Raffles
        </Link>
      </div>
    );
  }

  const eligible = raffle.participants.filter((p) => p.eligible);
  const displayPath = `/display/${raffle.id}`;

  return (
    <div className="control-page">
      <Link to="/admin/raffles" className="control-page__back">
        ← Back to Raffles
      </Link>

      <header className="control-page__header">
        <div className="control-page__header-main">
          <h1>{title || raffle.title}</h1>
          <span className={`control-page__status control-page__status--${status}`}>
            {status}
          </span>
        </div>
        <div className="control-page__header-actions">
          <button
            type="button"
            className="control-page__btn control-page__btn--primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Raffle Settings'}
          </button>
          <button
            type="button"
            className="control-page__btn control-page__btn--danger"
            onClick={handleDelete}
          >
            Delete Raffle
          </button>
        </div>
      </header>

      {message && <p className="control-page__message">{message}</p>}
      {error && <p className="control-page__error">{error}</p>}

      <nav className="control-page__tabs" aria-label="Raffle editor sections">
        {(
          [
            ['settings', 'Settings'],
            ['participants', 'Participants'],
            ['winners', 'Winners'],
            ['display', 'Display'],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            className={`control-page__tab${activeTab === tab ? ' control-page__tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="control-page__panel-area">
        {activeTab === 'settings' && (
          <section className="control-page__panel">
            <h2>Raffle Settings</h2>
            <label className="control-page__field control-page__field--name">
              <span>Raffle Name</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fall Career Fair Giveaway"
              />
              <small>Shown on the live display screen. Edit anytime, then save.</small>
            </label>
            <label className="control-page__field">
              <span>Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Raffle['status'])}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label className="control-page__field">
              <span>Total prizes for this raffle</span>
              <input
                type="number"
                min={1}
                value={prizeCount}
                onChange={(e) => setPrizeCount(e.target.value)}
              />
            </label>
            <dl className="control-page__stats">
              <div>
                <dt>In the Running</dt>
                <dd>{eligible.length}</dd>
              </div>
              <div>
                <dt>Prizes Remaining</dt>
                <dd>{Math.max(0, raffle.prizeCount - raffle.winners.length)}</dd>
              </div>
              <div>
                <dt>Current Draw</dt>
                <dd>
                  {String(raffle.winners.length + 1).padStart(2, '0')} / {raffle.prizeCount}
                </dd>
              </div>
              <div>
                <dt>Total Winners</dt>
                <dd>{raffle.winners.length}</dd>
              </div>
            </dl>
          </section>
        )}

        {activeTab === 'participants' && (
          <section className="control-page__panel control-page__panel--wide">
            <h2>Wheel Participants</h2>
            <p className="control-page__hint">
              One name per line (or comma-separated). The display wheel uses this list.
            </p>
            <textarea
              className="control-page__textarea"
              value={participantsText}
              onChange={(e) => setParticipantsText(e.target.value)}
              rows={16}
              placeholder="Jordan Martinez&#10;Emily Parker&#10;..."
            />
            <p className="control-page__count">
              {participantsText.split(/[\n,]+/).filter((n) => n.trim()).length} participants
            </p>
          </section>
        )}

        {activeTab === 'winners' && (
          <section className="control-page__panel control-page__panel--wide">
            <h2>Winners</h2>
            {raffle.winners.length === 0 ? (
              <p className="control-page__empty">No winners yet.</p>
            ) : (
              <ul className="control-page__winners">
                {raffle.winners.map((w) => (
                  <li key={w.id}>
                    <span className="control-page__winner-draw">
                      Draw {String(w.drawNumber).padStart(2, '0')}
                    </span>
                    <span className="control-page__winner-name">{w.participantName}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {activeTab === 'display' && (
          <section className="control-page__panel control-page__panel--action">
            <h2>Live Display</h2>
            <p>Open this raffle&apos;s standalone presentation screen.</p>
            <p className="control-page__display-url">
              URL: <code>{getAppUrl(displayPath)}</code>
            </p>
            <a
              href={getAppUrl(displayPath)}
              className="control-page__launch"
              target="_blank"
              rel="noreferrer"
            >
              Launch Display Mode
            </a>
          </section>
        )}
      </div>
    </div>
  );
}
