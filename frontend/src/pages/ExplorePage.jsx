import { useState, useEffect } from 'react';
import { Alert, Badge, Button, Group, Paper, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { IconRefresh, IconSearch, IconSparkles } from '@tabler/icons-react';
import { fetchAllAnimals, fetchAnimalsBySpecies } from '../api/api';
import AnimalCard from '../components/AnimalCard';
import './ExplorePage.css';

const SPECIES_LIST = [
  { value: 'all', label: 'All' },
  { value: 'Pet', label: 'Pets' },
  { value: 'Wild', label: 'Wild' },
  { value: 'Bird', label: 'Birds' },
  { value: 'Sea', label: 'Sea' },
  { value: 'Farm', label: 'Farm' },
  { value: 'Insect', label: 'Insects' },
];

export default function ExplorePage() {
  const [animals, setAnimals] = useState([]);
  const [activeSpecies, setActiveSpecies] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnimals(activeSpecies);
  }, [activeSpecies]);

  async function loadAnimals(species) {
    setLoading(true);
    setError(null);
    try {
      const data = species === 'all'
        ? await fetchAllAnimals()
        : await fetchAnimalsBySpecies(species);
      setAnimals(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="explore-page page-wrapper">
      <Stack gap="lg">
        <Paper className="explore-header animate-fade-in-up" withBorder radius="lg" p="lg">
          <Stack gap={6}>
            <Badge color="teal" variant="light" leftSection={<IconSparkles size={14} />}>
              Animal voice safari
            </Badge>
            <Title order={1}>Discover Animals</Title>
            <Text c="dimmed" size="sm">
              Browse the collection, listen to description sounds, and open any animal for details.
            </Text>
          </Stack>
        </Paper>

        <div className="explore-filters animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <SegmentedControl
            value={activeSpecies}
            onChange={setActiveSpecies}
            data={SPECIES_LIST}
            fullWidth
            className="explore-filter-control"
          />
        </div>

        {loading ? (
          <div className="explore-grid stagger-children">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton skeleton-card animate-fade-in-up" />
            ))}
          </div>
        ) : error ? (
          <Alert color="red" radius="md" title="Something went wrong">
            <Group justify="space-between" align="center">
              <Text size="sm">{error}</Text>
              <Button size="xs" leftSection={<IconRefresh size={14} />} onClick={() => loadAnimals(activeSpecies)}>
                Try Again
              </Button>
            </Group>
          </Alert>
        ) : animals.length === 0 ? (
          <Paper withBorder radius="lg" p="xl" className="empty-state">
            <IconSearch size={36} />
            <Title order={3}>No animals found</Title>
            <Text c="dimmed" size="sm">Try selecting a different category.</Text>
          </Paper>
        ) : (
          <div className="explore-grid stagger-children">
            {animals.map((animal, i) => (
              <AnimalCard key={animal.id} animal={animal} index={i} />
            ))}
          </div>
        )}
      </Stack>
    </div>
  );
}
