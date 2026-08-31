import { useEffect, useState, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRaffleService } from '../../services';
import { subscribeToStorageUpdates } from '../../services/storage/persistentStore';
import { getAppPath } from '../../lib/appUrl';
import type { Raffle } from '../../types/raffle';
import './RafflesPage.css';

export function RafflesPage() {
  const navigate = useNavigate();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');

  const loadRaffles = async () => {
    const list = await getRaffleService().listRaffles();
    setRaffles(list);
  };

  useEffect(() => {
    loadRaffles();
    return subscribeToStorageUpdates(() => {
      loadRaffles();
    });
  }, []);

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) {
      setError('Enter a raffle title.');
      return;
    }

    setCreating(true);
    setError('');
    try {
      const raffle = await getRaffleService().createRaffle({ title, status: 'draft' });
      setNewTitle('');
      await loadRaffles();
      navigate(`/admin/raffles/${raffle.id}`);
    } catch {
      setError('Could not create raffle.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (raffle: Raffle, event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const confirmed = window.confirm(
      `Delete "${raffle.title}"? This removes participants, winners, and its display link.`,
    );
    if (!confirmed) return;

    try {
      await getRaffleService().deleteRaffle(raffle.id);
      await loadRaffles();
    } catch {
      setError('Could not delete raffle.');
    }
  };

  return (
    <div className="raffles-page">
      <header className="raffles-page__header">
        <div>
          <h1>Raffles</h1>
          <p>Create and manage raffle events. Changes save to GitHub automatically.</p>
        </div>
        <div className="raffles-page__create">
          <input
            type="text"
            className="raffles-page__create-input"
            placeholder="New raffle title…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
          />
          <button
            type="button"
            className="raffles-page__create-btn"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? 'Creating…' : 'Create Raffle'}
          </button>
        </div>
      </header>

      {error && <p className="raffles-page__error">{error}</p>}

      <div className="raffles-page__list">
        {raffles.map((raffle) => (
          <Link
            key={raffle.id}
            to={`/admin/raffles/${raffle.id}`}
            className="raffles-page__card"
          >
            <div className="raffles-page__card-main">
              <h2>{raffle.title}</h2>
              <div className="raffles-page__meta">
                <span>{raffle.totalParticipants} participants</span>
                <span>{raffle.prizeCount} prizes</span>
                <span className={`raffles-page__status raffles-page__status--${raffle.status}`}>
                  {raffle.status}
                </span>
              </div>
              <p className="raffles-page__display-url">
                Display: <code>{getAppPath(`/display/${raffle.id}`)}</code>
              </p>
            </div>
            <button
              type="button"
              className="raffles-page__delete"
              onClick={(e) => handleDelete(raffle, e)}
              aria-label={`Delete ${raffle.title}`}
            >
              Delete
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
