import { useRef, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  FileInput,
  Group,
  Image,
  LoadingOverlay,
  Modal,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconEdit,
  IconDeviceFloppy,
  IconPhotoAi,
  IconPlayerPauseFilled,
  IconSend,
  IconSparkles,
  IconUpload,
  IconVolume2,
  IconX,
} from '@tabler/icons-react';
import {
  cancelAnimalRequest,
  editAiAnimal,
  generateAiAnimal,
  sendAnimalRequest,
} from '../api/api';
import './GeneratePage.css';

export default function GeneratePage() {
  const [name, setName] = useState('');
  const [style, setStyle] = useState('2d');
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [editOpened, setEditOpened] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    species: '',
    description: '',
    imageFile: null,
    audioFile: null,
  });
  const [descPlaying, setDescPlaying] = useState(false);
  const descAudioRef = useRef(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!name.trim() || !audioFile) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await generateAiAnimal(name.trim(), style, audioFile);
      setResult(data);
      notifications.show({
        color: 'teal',
        title: 'Animal generated',
        message: `${data.name} is ready to review.`,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openEdit() {
    if (!result) return;
    setEditForm({
      name: result.name || '',
      species: result.species || '',
      description: result.description || '',
      imageFile: null,
      audioFile: null,
    });
    setEditOpened(true);
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!result) return;
    setEditLoading(true);

    try {
      const updated = await editAiAnimal(result.id, editForm);
      setResult(updated);
      setEditOpened(false);
      notifications.show({
        color: 'teal',
        title: 'Changes saved',
        message: 'Your generated animal was updated.',
      });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Update failed', message: err.message });
    } finally {
      setEditLoading(false);
    }
  }

  async function handleSendRequest() {
    if (!result) return;
    try {
      await sendAnimalRequest(result.id);
      notifications.show({
        color: 'teal',
        title: 'Request sent',
        message: 'Admin can now review this animal.',
      });
      resetGeneratedState();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Request failed', message: err.message });
    }
  }

  async function handleCancel() {
    if (!result) return;
    try {
      await cancelAnimalRequest(result.id);
      notifications.show({
        color: 'gray',
        title: 'Generation cancelled',
        message: 'The AI animal was removed.',
      });
      resetGeneratedState();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Cancel failed', message: err.message });
    }
  }

  function resetGeneratedState() {
    setResult(null);
    setName('');
    setAudioFile(null);
    setDescPlaying(false);
    setAudioPlaying(false);
  }

  function toggleDescriptionAudio() {
    if (!descAudioRef.current) return;

    if (descPlaying) {
      descAudioRef.current.pause();
      setDescPlaying(false);
      return;
    }

    descAudioRef.current.play();
    setDescPlaying(true);
  }

  function toggleAudio() {
    if (!audioRef.current) return;

    if (audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
      return;
    }

    audioRef.current.play();
    setAudioPlaying(true);
  }

  return (
    <div className="generate-page page-wrapper">
      <Stack gap="lg">
        <section className="generate-header animate-fade-in-up">
          <Badge color="teal" variant="light" leftSection={<IconSparkles size={14} />}>
            AI animal studio
          </Badge>
          <Title order={1}>Generate a polished animal card</Title>
          <Text c="dimmed" size="sm">
            Create an animal, review its description sound, then edit or send it to admin.
          </Text>
        </section>

        <Paper
          component="form"
          className="generate-form animate-fade-in-up"
          onSubmit={handleGenerate}
          withBorder
          radius="lg"
          shadow="sm"
          p="lg"
          id="generate-form"
        >
          <LoadingOverlay visible={loading} overlayProps={{ radius: 'lg', blur: 2 }} />
          <Stack gap="md">
            <TextInput
              label="Animal name"
              placeholder="Penguin, red panda, axolotl..."
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              disabled={loading}
              required
              id="gen-name"
            />

            <SegmentedControl
              value={style}
              onChange={setStyle}
              data={[
                { label: '2D illustration', value: '2d' },
                { label: '3D render', value: '3d' },
              ]}
              fullWidth
              size="md"
              disabled={loading}
              id="image-style-control"
            />

            <FileInput
              label="Animal sound"
              description="Upload the sound file for this animal."
              placeholder="Choose audio file"
              accept="audio/*"
              leftSection={<IconUpload size={16} />}
              value={audioFile}
              onChange={setAudioFile}
              disabled={loading}
              required
              clearable
            />

            <Button
              type="submit"
              size="md"
              radius="md"
              leftSection={<IconPhotoAi size={18} />}
              disabled={loading || !name.trim() || !audioFile}
              id="generate-submit-btn"
            >
              {loading ? `Generating ${style.toUpperCase()} animal...` : `Generate ${style.toUpperCase()} Animal`}
            </Button>
          </Stack>
        </Paper>

        {error && (
          <Alert color="red" variant="light" radius="md" title="Generation failed">
            {error}
          </Alert>
        )}

        {result && (
          <Card withBorder radius="lg" shadow="md" padding="lg" className="generate-result-card animate-fade-in-up">
            <Stack gap="lg">
              <Card.Section className="generate-result-img-wrapper">
                <Image
                  src={result.image_url}
                  alt={result.name}
                  h="100%"
                  fit="cover"
                />
                <Badge className="generate-result-badge" color="teal" variant="filled">
                  {style === '3d' ? '3D' : '2D'} · {result.species}
                </Badge>
              </Card.Section>

              <Stack gap="xs">
                <Group justify="space-between" align="flex-start" gap="sm">
                  <div>
                    <Title order={2} className="generate-result-name">{result.name}</Title>
                    <Text c="dimmed" size="sm" tt="capitalize">{result.species}</Text>
                  </div>

                  <Group gap={8}>
                    {result.audio_url && (
                      <Tooltip label="Play animal sound">
                        <ActionIcon
                          size="lg"
                          radius="xl"
                          color={audioPlaying ? 'blue' : 'gray'}
                          variant="light"
                          onClick={toggleAudio}
                          aria-label="Play animal sound"
                        >
                          {audioPlaying ? <IconPlayerPauseFilled size={18} /> : <IconVolume2 size={18} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                    {result.desc_audio_url && (
                      <Tooltip label="Play description sound">
                        <ActionIcon
                          size="lg"
                          radius="xl"
                          color={descPlaying ? 'orange' : 'teal'}
                          variant="light"
                          onClick={toggleDescriptionAudio}
                          aria-label="Play description sound"
                        >
                          {descPlaying ? <IconPlayerPauseFilled size={18} /> : <IconVolume2 size={18} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                </Group>

                <Paper className="generate-description-panel" radius="md" p="md">
                  <Text size="sm" c="dimmed" fw={700} tt="uppercase">Description</Text>
                  <Text size="sm" mt={4}>{result.description}</Text>
                </Paper>
              </Stack>

              <Group grow className="generate-result-actions">
                <Button variant="light" color="blue" leftSection={<IconEdit size={18} />} onClick={openEdit}>
                  Edit
                </Button>
                <Button color="teal" leftSection={<IconSend size={18} />} onClick={handleSendRequest} id="send-request-btn">
                  Send Request
                </Button>
                <Button variant="light" color="red" leftSection={<IconX size={18} />} onClick={handleCancel} id="cancel-btn">
                  Cancel
                </Button>
              </Group>

              {result.audio_url && (
                <audio
                  ref={audioRef}
                  src={result.audio_url}
                  onEnded={() => setAudioPlaying(false)}
                  preload="metadata"
                />
              )}
              {result.desc_audio_url && (
                <audio
                  ref={descAudioRef}
                  src={result.desc_audio_url}
                  onEnded={() => setDescPlaying(false)}
                  preload="metadata"
                />
              )}
            </Stack>
          </Card>
        )}
      </Stack>

      <Modal opened={editOpened} onClose={() => setEditOpened(false)} title="Edit generated animal" centered radius="lg">
        <form onSubmit={handleEdit}>
          <Stack gap="md">
            <TextInput
              label="Name"
              value={editForm.name}
              onChange={(event) => setEditForm({ ...editForm, name: event.currentTarget.value })}
            />
            <TextInput
              label="Species"
              value={editForm.species}
              onChange={(event) => setEditForm({ ...editForm, species: event.currentTarget.value })}
            />
            <Textarea
              label="Description"
              minRows={4}
              value={editForm.description}
              onChange={(event) => setEditForm({ ...editForm, description: event.currentTarget.value })}
            />
            <FileInput
              label="Replace image"
              placeholder="Optional image file"
              accept="image/*"
              value={editForm.imageFile}
              onChange={(file) => setEditForm({ ...editForm, imageFile: file })}
              clearable
            />
            <FileInput
              label="Replace animal sound"
              placeholder="Optional audio file"
              accept="audio/*"
              value={editForm.audioFile}
              onChange={(file) => setEditForm({ ...editForm, audioFile: file })}
              clearable
            />
            <Group justify="flex-end">
              <Button variant="subtle" color="gray" onClick={() => setEditOpened(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={editLoading} leftSection={<IconDeviceFloppy size={18} />}>
                Save Changes
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </div>
  );
}
