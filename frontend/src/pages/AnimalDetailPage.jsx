import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ActionIcon, Group, Text, Tooltip } from '@mantine/core';
import { IconPlayerPauseFilled, IconVolume2 } from '@tabler/icons-react';
import { fetchAnimal} from '../api/api';
import './AnimalDetailPage.css';

export default function AnimalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDescPlaying, setIsDescPlaying] = useState(false);
  const audioRef = useRef(null);
  const descAudioRef = useRef(null);

  useEffect(() => {
    loadAnimal();
  }, [id]);

  async function loadAnimal() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAnimal(id);
      setAnimal(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleAudio() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }

  function toggleDescriptionAudio() {
    if (!descAudioRef.current) return;
    if (isDescPlaying) {
      descAudioRef.current.pause();
      setIsDescPlaying(false);
    } else {
      descAudioRef.current.play();
      setIsDescPlaying(true);
    }
  }

  if (loading) {
    return (
      <div className="detail-page page-wrapper">
        <div className="loading-center">
          <div className="spinner" />
          <p className="loading-text">Loading animal...</p>
        </div>
      </div>
    );
  }

  if (error || !animal) {
    return (
      <div className="detail-page page-wrapper">
        <div className="empty-state">
          <div className="empty-state-icon">😿</div>
          <h3>Animal not found</h3>
          <p>{error || 'This animal does not exist.'}</p>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/')}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page page-wrapper">
      <div className="detail-card glass-card-static">
        {/* Hero Image */}
        <div className="detail-hero animate-fade-in">
          <img
            src={animal.image_url}
            alt={animal.name}
            className="detail-hero-img"
          />
          <div className="detail-hero-overlay" />
          <button
            className="detail-back-btn"
            onClick={() => navigate(-1)}
            id="detail-back-btn"
            aria-label="Go back"
          >
            ←
          </button>
        </div>

        {/* Info Card */}
        <div className="detail-info animate-fade-in-up">
          <div className="detail-section detail-identity">
            <div className="detail-identity-header">
              <span className="badge badge-species">{animal.species}</span>
            </div>
            <h1 className="detail-name">{animal.name}</h1>
          </div>

          <div className="detail-divider" />

          {animal.audio_url && (
            <>
              <div className="detail-section detail-audio-section">
                <h3 className="detail-section-title">Voice</h3>
                <div className="audio-card" onClick={toggleAudio}>
                  <div className="audio-card-icon">
                    <button
                      className={`detail-audio-btn ${isPlaying ? 'detail-audio-btn--playing' : ''}`}
                      id="detail-audio-btn"
                      aria-label="Play sound"
                      onClick={(e) => { e.stopPropagation(); toggleAudio(); }}
                    >
                      {isPlaying ? '⏸️' : '🔊'}
                    </button>
                  </div>
                  <div className="audio-card-text">
                    <p className="audio-title">Animal Sound</p>
                    <p className="audio-subtitle">{isPlaying ? 'Playing...' : 'Tap to listen'}</p>
                  </div>
                  {isPlaying && (
                    <div className="audio-wave-anim">
                      <span className="wave"></span>
                      <span className="wave"></span>
                      <span className="wave"></span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-divider" />
            </>
          )}

          <div className="detail-section detail-description-section">
            <Group justify="space-between" align="center" className="detail-description-heading">
              <h3 className="detail-section-title">About</h3>
              {animal.desc_audio_url && (
                <Tooltip label="Description sound">
                  <ActionIcon
                    color={isDescPlaying ? 'orange' : 'teal'}
                    variant="light"
                    radius="xl"
                    aria-label="Play description sound"
                    onClick={toggleDescriptionAudio}
                  >
                    {isDescPlaying ? <IconPlayerPauseFilled size={18} /> : <IconVolume2 size={18} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
            <div className="description-card">
              <Text size="sm">{animal.description}</Text>
            </div>
          </div>

          {animal.audio_url && (
            <audio
              ref={audioRef}
              src={animal.audio_url}
              onEnded={() => setIsPlaying(false)}
              preload="metadata"
            />
          )}

          {animal.desc_audio_url && (
            <audio
              ref={descAudioRef}
              src={animal.desc_audio_url}
              onEnded={() => setIsDescPlaying(false)}
              preload="metadata"
            />
          )}
        </div>
      </div>
    </div>
  );
}
