import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  CircleUserRound,
  Download,
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
  views_label: '1.6M Vues',
  published_label: 'il y a 5 mois',
  likes_label: '5K',
  channel_name: 'Lusthub',
  channel_subscribers: '10K Abonnés',
  channel_videos: '32 Vidéos',
  username: 'Lusthub',
  profile_image: '',
};

const storageKey = 'video-showcase-settings';

function App() {
  const [settings, setSettings] = useState<ShowcaseSettings>(defaultSettings);
  const [draft, setDraft] = useState<ShowcaseSettings>(defaultSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [localVideoUrl, setLocalVideoUrl] = useState('');
  const [posterDownloadError, setPosterDownloadError] = useState('');

  useEffect(() => {
    const storedSettings = localStorage.getItem(storageKey);
    if (!storedSettings) return;
    try {
      const savedSettings = { ...defaultSettings, ...JSON.parse(storedSettings) } as ShowcaseSettings;
      setSettings(savedSettings);
      setDraft(savedSettings);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, []);

  const updateDraft = (field: keyof ShowcaseSettings, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleVideoFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setLocalVideoUrl(objectUrl);
    setVideoError(false);
    setIsPlaying(false);
    const reader = new FileReader();
    reader.onload = () => updateDraft('video_url', String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleProfileImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateDraft('profile_image', String(reader.result));
    reader.readAsDataURL(file);
  };

  const saveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    const nextSettings = { ...draft, video_url: draft.video_url.trim() };
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextSettings));
      setSettings(nextSettings);
      setDraft(nextSettings);
      setVideoError(false);
      setSaveMessage('Paramètres enregistrés sur cet appareil');
    } catch {
      setSaveMessage('Le fichier est trop volumineux pour le stockage local. Gardez cette page ouverte ou utilisez une adresse vidéo.');
    }
    setIsSaving(false);
  };

  const downloadPoster = async () => {
    setPosterDownloadError('');
    try {
      const response = await fetch(settings.poster_url || defaultSettings.poster_url);
      if (!response.ok) throw new Error(`Image request failed: ${response.status}`);
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = 'apercu-video';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      setPosterDownloadError('Téléchargement impossible. Vérifiez que l’image est accessible.');
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
            <div className="poster-download">
              <button type="button" onClick={downloadPoster}><Download size={17} /> Télécharger l’aperçu</button>
              {posterDownloadError && <span role="status">{posterDownloadError}</span>}
            </div>
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
          <div><h2>{settings.username} <span className="channel-badge">▻</span></h2><p>{settings.channel_subscribers} <b>•</b> {settings.channel_videos}</p></div>
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
          <label>Image d’aperçu<input value={draft.poster_url} onChange={(event) => updateDraft('poster_url', event.target.value)} placeholder="https://.../image.jpg" /></label>
          <label>Titre<input value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} /></label>
          <div className="field-grid"><label>Vues<input value={draft.views_label} onChange={(event) => updateDraft('views_label', event.target.value)} /></label><label>J'aime<input value={draft.likes_label} onChange={(event) => updateDraft('likes_label', event.target.value)} /></label></div>
          <div className="field-grid"><label>Publié<input value={draft.published_label} onChange={(event) => updateDraft('published_label', event.target.value)} /></label><label>Nom de la chaîne<input value={draft.channel_name} onChange={(event) => updateDraft('channel_name', event.target.value)} /></label></div>
          <label>Pseudo affiché<input value={draft.username} onChange={(event) => updateDraft('username', event.target.value)} /></label>
          <div className="file-field"><span>Photo de profil</span><label className="file-button">Choisir une photo<input type="file" accept="image/*" onChange={handleProfileImage} /></label></div>
          {saveMessage && <p className="save-message">{saveMessage}</p>}
          <button className="save-button" type="submit" disabled={isSaving}>{isSaving ? 'Enregistrement…' : 'Enregistrer les changements'}</button>
        </form>
      </div>}
    </main>
  );
}

function ScissorsIcon() {
  return <Scissors size={28} />;
}

export default App;
