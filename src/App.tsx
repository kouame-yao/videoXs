import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  CircleUserRound,
  Globe2,
  Heart,
  Menu,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Scissors,
  Settings2,
  Share2,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';

type ShowcaseSettings = {
  id: string;
  video_url: string;
  poster_url: string;
  title: string;
  views_label: string;
  published_label: string;
  likes_label: string;
  channel_name: string;
  channel_subscribers: string;
  channel_videos: string;
  username: string;
  profile_image: string;
};

const defaultSettings: ShowcaseSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  video_url: '',
  poster_url: 'https://images.pexels.com/photos/6800204/pexels-photo-6800204.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  title: "Réaliser Le Fantasme De Ma Femme D’amour",
  views_label: '0 Vues',
  published_label: 'À l’instant',
  likes_label: '0',
  channel_name: 'Lusthub',
  channel_subscribers: '10K Abonnés',
  channel_videos: '32 Vidéos',
  username: 'Lusthub',
  profile_image: '',
};

const storageKey = 'video-showcase-settings';
const databaseName = 'video-showcase';
const settingsStoreName = 'settings';

function openSettingsDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 3);
    request.onupgradeneeded = (event) => {
      const database = request.result;
      const transaction = request.transaction;
      if (!database.objectStoreNames.contains(settingsStoreName)) {
        database.createObjectStore(settingsStoreName);
      }
      if (event.oldVersion < 2 && event.oldVersion > 0 && transaction) {
        const store = transaction.objectStore(settingsStoreName);
        const savedSettingsRequest = store.get('current') as IDBRequest<ShowcaseSettings | undefined>;
        savedSettingsRequest.onsuccess = () => {
          if (!savedSettingsRequest.result) return;
          store.put({
            ...savedSettingsRequest.result,
            published_label: defaultSettings.published_label,
            likes_label: defaultSettings.likes_label,
          }, 'current');
        };
      }
      if (event.oldVersion < 3 && event.oldVersion > 0 && transaction) {
        const store = transaction.objectStore(settingsStoreName);
        const savedSettingsRequest = store.get('current') as IDBRequest<ShowcaseSettings | undefined>;
        savedSettingsRequest.onsuccess = () => {
          if (!savedSettingsRequest.result) return;
          store.put({
            ...savedSettingsRequest.result,
            views_label: defaultSettings.views_label,
          }, 'current');
        };
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Impossible d’ouvrir la base de données.'));
    request.onblocked = () => reject(new Error('La base de données est bloquée par un autre onglet.'));
  });
}

async function readSettingsFromDatabase(): Promise<ShowcaseSettings | undefined> {
  const database = await openSettingsDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(settingsStoreName, 'readonly');
      const request = transaction.objectStore(settingsStoreName).get('current') as IDBRequest<ShowcaseSettings | undefined>;
      let settings: ShowcaseSettings | undefined;
      request.onsuccess = () => {
        settings = request.result;
      };
      transaction.oncomplete = () => resolve(settings);
      transaction.onerror = () => reject(transaction.error ?? new Error('Impossible de lire les paramètres.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('La lecture des paramètres a été interrompue.'));
    });
  } finally {
    database.close();
  }
}

async function writeSettingsToDatabase(settings: ShowcaseSettings): Promise<void> {
  const database = await openSettingsDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(settingsStoreName, 'readwrite');
      transaction.objectStore(settingsStoreName).put(settings, 'current');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Impossible d’enregistrer les paramètres.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('L’enregistrement des paramètres a été interrompu.'));
    });
  } finally {
    database.close();
  }
}

async function loadStoredSettings(): Promise<ShowcaseSettings | null> {
  const savedSettings = await readSettingsFromDatabase();
  if (savedSettings) return { ...defaultSettings, ...savedSettings };

  const legacySettings = localStorage.getItem(storageKey);
  if (!legacySettings) return null;

  let migratedSettings: ShowcaseSettings;
  try {
    migratedSettings = {
      ...defaultSettings,
      ...JSON.parse(legacySettings),
      views_label: defaultSettings.views_label,
      published_label: defaultSettings.published_label,
      likes_label: defaultSettings.likes_label,
    } as ShowcaseSettings;
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }

  await writeSettingsToDatabase(migratedSettings);
  localStorage.removeItem(storageKey);
  return migratedSettings;
}

function App() {
  const [settings, setSettings] = useState<ShowcaseSettings>(defaultSettings);
  const [draft, setDraft] = useState<ShowcaseSettings>(defaultSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [localVideoUrl, setLocalVideoUrl] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);

  useEffect(() => {
    loadStoredSettings().then((savedSettings) => {
      if (savedSettings) {
        setSettings(savedSettings);
        setDraft(savedSettings);
      }
    }).catch((error: unknown) => {
      setSaveMessage(error instanceof Error ? `Impossible de charger les paramètres : ${error.message}` : 'Impossible de charger les paramètres enregistrés.');
    });
  }, []);

  const updateDraft = (field: keyof ShowcaseSettings, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Impossible de lire ce fichier.'));
    reader.readAsDataURL(file);
  });

  const handleVideoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setLocalVideoUrl(objectUrl);
    setVideoError(false);
    setIsPlaying(false);
    setIsReadingFile(true);
    try {
      updateDraft('video_url', await readFileAsDataUrl(file));
      setSaveMessage('');
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Impossible de lire cette vidéo.');
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleProfileImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsReadingFile(true);
    try {
      updateDraft('profile_image', await readFileAsDataUrl(file));
      setSaveMessage('');
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Impossible de lire cette photo.');
    } finally {
      setIsReadingFile(false);
    }
  };

  const handlePosterImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSaveMessage('Veuillez choisir un fichier image.');
      return;
    }

    setIsReadingFile(true);
    try {
      updateDraft('poster_url', await readFileAsDataUrl(file));
      setSaveMessage('');
    } catch {
      setSaveMessage('Impossible de lire cette image. Veuillez réessayer.');
    } finally {
      setIsReadingFile(false);
    }
  };

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveMessage('');

    const nextSettings = { ...draft, video_url: draft.video_url.trim() };
    try {
      await writeSettingsToDatabase(nextSettings);
      setSettings(nextSettings);
      setDraft(nextSettings);
      setVideoError(false);
      try {
        localStorage.removeItem(storageKey);
        setSaveMessage('Paramètres enregistrés sur cet appareil');
      } catch {
        setSaveMessage('Paramètres enregistrés. Une ancienne copie locale n’a pas pu être supprimée.');
      }
    } catch (error) {
      setSaveMessage(error instanceof Error ? `Échec de l’enregistrement : ${error.message}` : 'Échec de l’enregistrement des paramètres.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await writeSettingsToDatabase(defaultSettings);
      setSettings(defaultSettings);
      setDraft(defaultSettings);
      setIsPlaying(false);
      setVideoError(false);
      if (localVideoUrl) URL.revokeObjectURL(localVideoUrl);
      setLocalVideoUrl('');
      try {
        localStorage.removeItem(storageKey);
        setSaveMessage('Modifications réinitialisées');
      } catch {
        setSaveMessage('Modifications réinitialisées, mais une ancienne copie locale n’a pas pu être supprimée.');
      }
    } catch (error) {
      setSaveMessage(error instanceof Error ? `Échec de la réinitialisation : ${error.message}` : 'Échec de la réinitialisation des paramètres.');
    } finally {
      setIsSaving(false);
    }
  };

  const videoSource = localVideoUrl || settings.video_url;

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="icon-button menu-button" aria-label="Ouvrir le menu"><Menu size={32} /></button>
        <div className="brand" aria-label="Pornhub"><span>Porn</span><strong>hub</strong></div>
        <div className="top-actions">
          <button className="icon-button" aria-label="Rechercher"><Search size={31} /></button>
          <button className="icon-button" aria-label="Notifications"><Bell size={23} /></button>
          <button className="icon-button profile-button" aria-label="Profil">{settings.profile_image ? <img src={settings.profile_image} alt="Profil" /> : <CircleUserRound size={34} />}</button>
        </div>
      </header>

      <nav className="category-nav" aria-label="Catégories">
        {['LIVE CAMS', 'BET360 FREEBET', '1WIN', 'PRENDS $500'].map((item) => <span key={item}>{item}</span>)}
      </nav>

      <section className="ad-slot">
        <div className="ad-copy"><small>Ad</small><b>bet360</b><strong>FREEBET<br /><em>A GOGO</em></strong><button>Jouer maintenant</button></div>
        <button className="remove-ads">Supprimer les pubs</button>
      </section>

      <div className="content-wrap">
        <div className="tag-row">
          {['Cocu', 'Fait Maison', 'Sexe', 'Devant Son Mari'].map((tag) => <button key={tag}>{tag}</button>)}
        </div>

        <section className="video-card">
          <div className="video-frame">
            {videoError ? <div className="video-error"><strong>Cette vidéo ne peut pas être lue ici</strong><span>Le navigateur ne reconnaît pas ce format ou ce codec.</span></div> : videoSource && isPlaying ? (
              <video className="video-player" src={videoSource} controls autoPlay playsInline onEnded={() => setIsPlaying(false)} onError={() => setVideoError(true)} />
            ) : (
              <>
                <img src={settings.poster_url || defaultSettings.poster_url} alt="Aperçu de la vidéo" />
                <div className="video-shade" />
                <button className="play-button" aria-label="Lire la vidéo" onClick={() => setIsPlaying(true)}><Play size={42} fill="white" /></button>
                <div className="video-time"><span>00:00</span><div className="progress-line"><i /></div><span>16:12</span></div>
              </>
            )}
          </div>
          <div className="title-line"><h1>{settings.title}</h1><button className="globe-button" aria-label="Langue"><Globe2 size={29} /></button></div>
          <div className="meta-line"><span>{settings.views_label}</span><b>•</b><span>{settings.published_label}</span><b>|</b><span className="verified"><Check size={15} strokeWidth={4} /> ID Verified</span></div>
          <div className="action-row">
            <button className="vote-group"><ThumbsUp size={28} fill="currentColor" /><span>{settings.likes_label}</span><i /><ThumbsDown size={27} fill="currentColor" /></button>
            <button aria-label="J'aime"><Heart size={31} fill="currentColor" /></button>
            <button aria-label="Partager"><Share2 size={31} fill="currentColor" /></button>
            <button className="clip-button"><ScissorsIcon /> <span>Clip</span></button>
            <button aria-label="Ajouter"><Plus size={33} strokeWidth={3} /></button>
          </div>
        </section>

        <section className="channel-row">
          <div className="channel-avatar">{settings.profile_image ? <img src={settings.profile_image} alt="Photo de profil" /> : <><span>{settings.username.slice(0, 1).toUpperCase()}</span></>}</div>
          <div><h2>{settings.channel_name} <span className="channel-badge">▻</span></h2><p>{settings.channel_subscribers} <b>•</b> {settings.channel_videos}</p></div>
          <button className="follow-button">S’abonner <ChevronDown size={17} /></button>
          <button className="more-button" aria-label="Plus d'options"><MoreHorizontal size={27} /></button>
        </section>

        <button className="settings-launcher" onClick={() => setIsSettingsOpen(true)}><Settings2 size={18} /> Modifier l’affichage</button>
      </div>

      {isSettingsOpen && <div className="modal-backdrop" onClick={() => setIsSettingsOpen(false)}>
        <form className="settings-panel" onSubmit={saveSettings} onClick={(event) => event.stopPropagation()}>
          <div className="panel-header"><div><p className="eyebrow">ESPACE CRÉATEUR</p><h2>Modifier la vidéo</h2></div><button type="button" className="close-button" onClick={() => setIsSettingsOpen(false)}><X size={22} /></button></div>
          <label>Adresse de la vidéo<input value={draft.video_url} onChange={(event) => updateDraft('video_url', event.target.value)} placeholder="https://.../ma-video.mp4" /></label>
          <div className="file-field"><span>Ou choisir un fichier sur cet appareil</span><label className="file-button">Parcourir<input type="file" accept="video/*" onChange={handleVideoFile} /></label></div>
          <label>Adresse de l’image d’aperçu<input value={draft.poster_url} onChange={(event) => updateDraft('poster_url', event.target.value)} placeholder="https://.../image.jpg" /></label>
          <div className="file-field poster-file-field"><span>Ou ajouter une image depuis votre appareil</span><label className="file-button">Choisir une image<input type="file" accept="image/*" onChange={handlePosterImage} /></label></div>
          <img className="poster-preview" src={draft.poster_url || defaultSettings.poster_url} alt="Aperçu de l’image sélectionnée" />
          <label>Titre<input value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} /></label>
          <div className="field-grid"><label>Vues<input value={draft.views_label} onChange={(event) => updateDraft('views_label', event.target.value)} /></label><label>J'aime<input value={draft.likes_label} onChange={(event) => updateDraft('likes_label', event.target.value)} /></label></div>
          <div className="field-grid"><label>Publié<input value={draft.published_label} onChange={(event) => updateDraft('published_label', event.target.value)} /></label><label>Nom de la chaîne<input value={draft.channel_name} onChange={(event) => updateDraft('channel_name', event.target.value)} /></label></div>
          <label>Pseudo affiché<input value={draft.username} onChange={(event) => updateDraft('username', event.target.value)} /></label>
          <div className="file-field"><span>Photo de profil</span><label className="file-button">Choisir une photo<input type="file" accept="image/*" onChange={handleProfileImage} /></label></div>
          {saveMessage && <p className="save-message">{saveMessage}</p>}
          <div className="settings-actions">
            <button className="reset-button" type="button" onClick={resetSettings} disabled={isSaving || isReadingFile}>{isSaving ? 'Réinitialisation…' : 'Réinitialiser'}</button>
            <button className="save-button" type="submit" disabled={isSaving || isReadingFile}>{isReadingFile ? 'Lecture du fichier…' : isSaving ? 'Enregistrement…' : 'Enregistrer les changements'}</button>
          </div>
        </form>
      </div>}
    </main>
  );
}

function ScissorsIcon() {
  return <Scissors size={28} />;
}

export default App;
