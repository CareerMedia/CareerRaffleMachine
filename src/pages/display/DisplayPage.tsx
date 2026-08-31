import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { RaffleDisplay } from '../../components/raffle/RaffleDisplay';
import { getRaffleService } from '../../services';

export function DisplayPage() {
  const { raffleId } = useParams<{ raffleId?: string }>();
  const [resolvedId, setResolvedId] = useState<string | null>(raffleId ?? null);
  const [loading, setLoading] = useState(!raffleId);

  useEffect(() => {
    if (raffleId) {
      setResolvedId(raffleId);
      setLoading(false);
      return;
    }

    getRaffleService()
      .getActiveRaffle()
      .then((raffle) => {
        if (raffle) {
          setResolvedId(raffle.id);
        } else {
          setResolvedId(null);
        }
      })
      .finally(() => setLoading(false));
  }, [raffleId]);

  if (loading) {
    return <div className="raffle-display raffle-display--loading">Loading…</div>;
  }

  if (!resolvedId) {
    return <Navigate to="/admin/raffles" replace />;
  }

  if (!raffleId && resolvedId) {
    return <Navigate to={`/display/${resolvedId}`} replace />;
  }

  return <RaffleDisplay raffleId={resolvedId} />;
}
