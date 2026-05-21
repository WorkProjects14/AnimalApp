import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionIcon, Badge, Card, Group, Image, Stack, Text, Tooltip } from '@mantine/core';
import { IconBook2, IconPlayerPauseFilled, IconVolume2 } from '@tabler/icons-react';
import './AnimalCard.css';

export default function AnimalCard({ animal, index = 0 }) {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function handleCardClick() {
    navigate(`/animal/${animal.id}`);
  }

  function toggleDescriptionSound(event) {
    event.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    audioRef.current.play();
    setIsPlaying(true);
  }

  return (
    <Card
      withBorder
      shadow="sm"
      padding="sm"
      radius="lg"
      className="animal-card animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={handleCardClick}
      id={`animal-card-${animal.id}`}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') handleCardClick();
      }}
    >
      <Card.Section className="animal-card-img-wrapper">
        <Image
          src={animal.image_url}
          alt={animal.name}
          h="100%"
          fit="cover"
          loading="lazy"
        />
        <div className="animal-card-overlay" />
      </Card.Section>

      <Stack gap={8} className="animal-card-info">
        <Group justify="space-between" align="center" gap="xs" wrap="nowrap">
          <Badge color="teal" variant="light" size="sm">{animal.species}</Badge>
          {animal.desc_audio_url && (
            <Tooltip label="Description sound">
              <ActionIcon
                color={isPlaying ? 'orange' : 'teal'}
                variant="light"
                radius="xl"
                aria-label="Play description sound"
                onClick={toggleDescriptionSound}
              >
                {isPlaying ? <IconPlayerPauseFilled size={16} /> : <IconVolume2 size={16} />}
              </ActionIcon>
            </Tooltip>
          )}
        </Group>

        <div>
          <Group gap={6} align="center" wrap="nowrap">
            <IconBook2 size={16} className="animal-card-title-icon" />
            <Text component="h3" className="animal-card-name" lineClamp={1}>
              {animal.name}
            </Text>
          </Group>
          {animal.description && (
            <Text className="animal-card-description" lineClamp={2}>
              {animal.description}
            </Text>
          )}
        </div>
      </Stack>

      {animal.desc_audio_url && (
        <audio
          ref={audioRef}
          src={animal.desc_audio_url}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
        />
      )}
    </Card>
  );
}
