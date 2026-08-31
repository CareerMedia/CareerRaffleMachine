import { useCallback, useEffect, useRef, useState } from 'react';
import csunCareerCenterLogo from '../../assets/csun-career-center-logo.png';
import { getRaffleService } from '../../services';
import type { BrandingSettings } from '../../types/branding';
import { DEFAULT_BRANDING } from '../../types/branding';
import './BrandingPage.css';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Could not read file.'));
    };
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

function isSvgFile(file: File): boolean {
  return file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
}

export function BrandingPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [logoAlt, setLogoAlt] = useState(DEFAULT_BRANDING.logoAlt);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadBranding = useCallback(async () => {
    const data = await getRaffleService().getBranding();
    setBranding(data);
    setLogoAlt(data.logoAlt);
  }, []);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    if (!isSvgFile(file)) {
      setError('Please upload an SVG file.');
      event.target.value = '';
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (!dataUrl.includes('image/svg+xml')) {
        setError('Invalid SVG file.');
        return;
      }
      setBranding((prev) => ({ ...prev, logoDataUrl: dataUrl }));
      setMessage('Logo preview updated. Click Save Branding to apply app-wide.');
    } catch {
      setError('Could not read SVG file.');
    } finally {
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await getRaffleService().updateBranding({
        logoDataUrl: branding.logoDataUrl,
        logoAlt: logoAlt.trim() || DEFAULT_BRANDING.logoAlt,
      });
      setBranding(updated);
      setMessage('Branding saved. Logo updated across admin and display.');
    } catch {
      setError('Could not save branding.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await getRaffleService().updateBranding({
        logoDataUrl: null,
        logoAlt: DEFAULT_BRANDING.logoAlt,
      });
      setBranding(updated);
      setLogoAlt(updated.logoAlt);
      setMessage('Restored default CSUN logo.');
    } catch {
      setError('Could not reset branding.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    const json = await getRaffleService().exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `career-raffle-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('Backup downloaded.');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await getRaffleService().importData(text);
      await loadBranding();
      setMessage('Backup imported successfully.');
    } catch {
      setError('Could not import backup file.');
    } finally {
      event.target.value = '';
    }
  };

  const previewSrc = branding.logoDataUrl ?? csunCareerCenterLogo;

  return (
    <div className="branding-page">
      <header className="branding-page__header">
        <div>
          <h1>Branding</h1>
          <p>Upload an SVG logo used across the admin portal and live display.</p>
        </div>
        <button
          type="button"
          className="branding-page__btn branding-page__btn--primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Branding'}
        </button>
      </header>

      {message && <p className="branding-page__message">{message}</p>}
      {error && <p className="branding-page__error">{error}</p>}

      <div className="branding-page__grid">
        <section className="branding-page__panel">
          <h2>Logo</h2>
          <label className="branding-page__field">
            <span>Alt text</span>
            <input
              type="text"
              value={logoAlt}
              onChange={(e) => setLogoAlt(e.target.value)}
            />
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,image/svg+xml"
            className="branding-page__file-input"
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="branding-page__btn"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload SVG Logo
          </button>
          <button
            type="button"
            className="branding-page__btn branding-page__btn--ghost"
            onClick={handleReset}
            disabled={saving}
          >
            Reset to Default
          </button>
        </section>

        <section className="branding-page__panel branding-page__panel--preview">
          <h2>Preview</h2>
          <div className="branding-page__preview branding-page__preview--light">
            <img src={previewSrc} alt={logoAlt} className="branding-page__preview-logo" />
          </div>
          <div className="branding-page__preview branding-page__preview--dark">
            <img src={previewSrc} alt={logoAlt} className="branding-page__preview-logo" />
          </div>
        </section>

        <section className="branding-page__panel branding-page__panel--wide">
          <h2>Data Backup</h2>
          <p className="branding-page__hint">
            With GitHub configured, every save writes to <code>data/app-state.json</code> in your
            repo. Use export/import below for manual snapshots or migration.
          </p>
          <div className="branding-page__backup-actions">
            <button type="button" className="branding-page__btn" onClick={handleExport}>
              Export Backup JSON
            </button>
            <label className="branding-page__import-label">
              Import Backup JSON
              <input
                type="file"
                accept="application/json,.json"
                className="branding-page__file-input"
                onChange={handleImport}
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
