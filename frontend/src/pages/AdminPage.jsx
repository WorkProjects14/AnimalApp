import { useEffect, useRef, useState } from 'react';
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
  PasswordInput,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconDeviceFloppy,
  IconEdit,
  IconLock,
  IconLogout,
  IconPhotoAi,
  IconPlus,
  IconSparkles,
  IconTrash,
  IconUpload,
  IconVolume2,
  IconX,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import {
  addAnimal,
  adminLogin,
  approveAnimal,
  deleteAnimal,
  editAiAnimal,
  fetchAllAnimals,
  fetchPendingRequests,
  generateAiAnimal,
  rejectAnimal,
  saveAiAnimalToMain,
  updateAnimal,
} from '../api/api';
import './AdminPage.css';

export default function AdminPage() {
  const { user, token, login, logout } = useAuth();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [tab, setTab] = useState('animals');
  const [animals, setAnimals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', species: '', description: '' });
  const [addImage, setAddImage] = useState(null);
  const [addAudio, setAddAudio] = useState(null);
  const [addLoading, setAddLoading] = useState(false);

  const [editAnimalData, setEditAnimalData] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', species: '', description: '', imageFile: null, audioFile: null });
  const [editLoading, setEditLoading] = useState(false);

  const [aiName, setAiName] = useState('');
  const [aiStyle, setAiStyle] = useState('2d');
  const [aiAudio, setAiAudio] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiEditOpened, setAiEditOpened] = useState(false);
  const [aiEditLoading, setAiEditLoading] = useState(false);
  const [aiEditForm, setAiEditForm] = useState({
    name: '',
    species: '',
    description: '',
    imageFile: null,
    audioFile: null,
  });
  const descAudioRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      loadData();
    }
  }, [isAuthenticated, token]);

  async function loadData() {
    setLoading(true);
    try {
      const [animalData, reqData] = await Promise.all([
        fetchAllAnimals(),
        fetchPendingRequests(token),
      ]);
      setAnimals(animalData);
      setRequests(reqData);
    } catch (err) {
      flash(err.message, 'red');
    } finally {
      setLoading(false);
    }
  }

  function flash(message, color = 'teal', title = color === 'red' ? 'Something went wrong' : 'Done') {
    notifications.show({ color, title, message });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      await login(loginEmail, loginPassword);
      const { getAuth } = await import('firebase/auth');
      const freshToken = await getAuth().currentUser.getIdToken();
      await adminLogin(loginEmail, freshToken);
      setIsAuthenticated(true);
    } catch (err) {
      setLoginError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    logout();
    setIsAuthenticated(false);
    setLoginEmail('');
    setLoginPassword('');
    setAnimals([]);
    setRequests([]);
    setAiResult(null);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!addImage || !addAudio) {
      flash('Please select both image and audio files.', 'red');
      return;
    }

    setAddLoading(true);
    try {
      await addAnimal(addForm.name, addForm.species, addForm.description, addImage, addAudio, token);
      flash('Animal added successfully.');
      setShowAdd(false);
      setAddForm({ name: '', species: '', description: '' });
      setAddImage(null);
      setAddAudio(null);
      loadData();
    } catch (err) {
      flash(err.message, 'red');
    } finally {
      setAddLoading(false);
    }
  }

  function openEdit(animal) {
    setEditAnimalData(animal);
    setEditForm({ name: animal.name, species: animal.species, description: animal.description, imageFile: null, audioFile: null });
  }

  async function handleEdit(e) {
    e.preventDefault();
    setEditLoading(true);
    try {
      await updateAnimal(editAnimalData.id, editForm, token);
      flash('Animal updated successfully.');
      setEditAnimalData(null);
      loadData();
    } catch (err) {
      flash(err.message, 'red');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this animal?')) return;
    try {
      await deleteAnimal(id, token);
      flash('Animal deleted.');
      loadData();
    } catch (err) {
      flash(err.message, 'red');
    }
  }

  async function handleApprove(id) {
    try {
      await approveAnimal(id, token);
      flash('Request approved.');
      loadData();
    } catch (err) {
      flash(err.message, 'red');
    }
  }

  async function handleReject(id) {
    try {
      await rejectAnimal(id, token);
      flash('Request rejected.', 'gray');
      loadData();
    } catch (err) {
      flash(err.message, 'red');
    }
  }

  async function handleAdminAiGenerate(e) {
    e.preventDefault();
    if (!aiName.trim() || !aiAudio) return;
    setAiLoading(true);
    setAiResult(null);

    try {
      const data = await generateAiAnimal(aiName.trim(), aiStyle, aiAudio, token, 'admin');
      setAiResult(data);
      flash(`${data.name} is ready to review.`);
    } catch (err) {
      flash(err.message, 'red');
    } finally {
      setAiLoading(false);
    }
  }

  function openAiEdit() {
    if (!aiResult) return;
    setAiEditForm({
      name: aiResult.name || '',
      species: aiResult.species || '',
      description: aiResult.description || '',
      imageFile: null,
      audioFile: null,
    });
    setAiEditOpened(true);
  }

  async function handleAiEdit(e) {
    e.preventDefault();
    setAiEditLoading(true);

    try {
      const updated = await editAiAnimal(aiResult.id, aiEditForm, token, 'admin');
      setAiResult(updated);
      setAiEditOpened(false);
      flash('AI animal updated.');
    } catch (err) {
      flash(err.message, 'red');
    } finally {
      setAiEditLoading(false);
    }
  }

  async function handleSaveAiAnimal() {
    if (!aiResult) return;
    try {
      await saveAiAnimalToMain(aiResult.id, token);
      flash('AI animal saved to the main collection.');
      setAiResult(null);
      setAiName('');
      setAiAudio(null);
      loadData();
    } catch (err) {
      flash(err.message, 'red');
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-page">
        <div className="admin-login-wrapper">
          <Paper
            component="form"
            onSubmit={handleLogin}
            className="admin-login-card animate-fade-in-up"
            withBorder
            radius="lg"
            shadow="md"
            p="xl"
            id="admin-login-form"
          >
            <Stack gap="lg">
              <Stack gap={4} align="center">
                <Badge color="red" variant="light" leftSection={<IconLock size={14} />}>
                  Restricted access
                </Badge>
                <Title order={1}>Admin Dashboard</Title>
                <Text c="dimmed" size="sm" ta="center">
                  Sign in to manage animals, AI generations, and user requests.
                </Text>
              </Stack>

              {loginError && (
                <Alert color="red" radius="md" title="Login failed" id="login-error">
                  {loginError}
                </Alert>
              )}

              <TextInput
                id="admin-email"
                type="email"
                label="Email address"
                placeholder="admin@example.com"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.currentTarget.value)}
              />

              <PasswordInput
                id="admin-password"
                label="Password"
                placeholder="Password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.currentTarget.value)}
              />

              <Button type="submit" loading={loginLoading} size="md" id="admin-login-submit">
                Sign In
              </Button>
            </Stack>
          </Paper>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page page-wrapper">
      <Stack gap="lg">
        <Paper className="admin-header animate-fade-in-up" withBorder radius="lg" p="lg">
          <Group justify="space-between" align="flex-start" gap="md">
            <div>
              <Badge color="teal" variant="light">Control center</Badge>
              <Title order={1} mt={6}>Admin Dashboard</Title>
              <Text c="dimmed" size="sm">{user?.email}</Text>
            </div>
            <Button
              variant="light"
              color="red"
              leftSection={<IconLogout size={18} />}
              onClick={handleLogout}
              id="admin-logout-btn"
            >
              Logout
            </Button>
          </Group>
        </Paper>

        <Tabs value={tab} onChange={setTab} radius="md" className="admin-tabs">
          <Tabs.List grow>
            <Tabs.Tab value="animals" leftSection={<IconPhotoAi size={16} />}>
              Animals <Badge size="xs" ml={6}>{animals.length}</Badge>
            </Tabs.Tab>
            <Tabs.Tab value="requests" leftSection={<IconSparkles size={16} />}>
              Requests <Badge size="xs" ml={6} color="yellow">{requests.length}</Badge>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="animals" pt="lg">
            <Stack gap="lg">
              <Card withBorder radius="lg" shadow="sm" p="lg" className="admin-ai-card">
                <LoadingOverlay visible={aiLoading} overlayProps={{ radius: 'lg', blur: 2 }} />
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Badge color="teal" variant="light" leftSection={<IconSparkles size={14} />}>
                        Admin AI generator
                      </Badge>
                      <Title order={2} mt={6}>Create and save directly</Title>
                    </div>
                  </Group>

                  <form onSubmit={handleAdminAiGenerate}>
                    <Stack gap="md">
                      <TextInput
                        label="Animal name"
                        placeholder="Lion, dolphin, panda..."
                        value={aiName}
                        onChange={(event) => setAiName(event.currentTarget.value)}
                        required
                      />
                      <SegmentedControl
                        value={aiStyle}
                        onChange={setAiStyle}
                        data={[
                          { label: '2D illustration', value: '2d' },
                          { label: '3D render', value: '3d' },
                        ]}
                        fullWidth
                      />
                      <FileInput
                        label="Animal sound"
                        placeholder="Upload audio file"
                        accept="audio/*"
                        leftSection={<IconUpload size={16} />}
                        value={aiAudio}
                        onChange={setAiAudio}
                        required
                        clearable
                      />
                      <Button
                        type="submit"
                        leftSection={<IconPhotoAi size={18} />}
                        disabled={!aiName.trim() || !aiAudio || aiLoading}
                      >
                        Generate Animal
                      </Button>
                    </Stack>
                  </form>

                  {aiResult && (
                    <Card withBorder radius="md" p="md" className="admin-ai-result">
                      <Group align="stretch" gap="md">
                        <Image src={aiResult.image_url} alt={aiResult.name} className="admin-ai-result-img" />
                        <Stack gap={8} flex={1}>
                          <Group justify="space-between" align="flex-start">
                            <div>
                              <Title order={3}>{aiResult.name}</Title>
                              <Badge color="teal" variant="light">{aiResult.species}</Badge>
                            </div>
                            <Group gap={8}>
                              {aiResult.audio_url && (
                                <Tooltip label="Animal sound">
                                  <ActionIcon
                                    variant="light"
                                    color="blue"
                                    radius="xl"
                                    onClick={() => audioRef.current?.play()}
                                    aria-label="Play animal sound"
                                  >
                                    <IconVolume2 size={18} />
                                  </ActionIcon>
                                </Tooltip>
                              )}
                              {aiResult.desc_audio_url && (
                                <Tooltip label="Description sound">
                                  <ActionIcon
                                    variant="light"
                                    color="teal"
                                    radius="xl"
                                    onClick={() => descAudioRef.current?.play()}
                                    aria-label="Play description sound"
                                  >
                                    <IconVolume2 size={18} />
                                  </ActionIcon>
                                </Tooltip>
                              )}
                            </Group>
                          </Group>
                          <Text size="sm" c="dimmed">{aiResult.description}</Text>
                          <Group grow>
                            <Button variant="light" color="blue" leftSection={<IconEdit size={18} />} onClick={openAiEdit}>
                              Edit
                            </Button>
                            <Button color="teal" leftSection={<IconDeviceFloppy size={18} />} onClick={handleSaveAiAnimal}>
                              Save
                            </Button>
                          </Group>
                          {aiResult.audio_url && (
                            <audio ref={audioRef} src={aiResult.audio_url} preload="metadata" />
                          )}
                          {aiResult.desc_audio_url && (
                            <audio ref={descAudioRef} src={aiResult.desc_audio_url} preload="metadata" />
                          )}
                        </Stack>
                      </Group>
                    </Card>
                  )}
                </Stack>
              </Card>

              <Group justify="space-between" align="center">
                <Title order={2}>Animal Library</Title>
                <Button leftSection={<IconPlus size={18} />} onClick={() => setShowAdd(true)} id="add-animal-btn">
                  Add Animal
                </Button>
              </Group>

              {loading ? (
                <div className="loading-center">
                  <div className="spinner" />
                  <p className="loading-text">Loading animals...</p>
                </div>
              ) : animals.length === 0 ? (
                <EmptyState title="No animals yet" text="Add your first animal to get started." />
              ) : (
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {animals.map((animal) => (
                    <Card key={animal.id} withBorder radius="lg" shadow="sm" p="md" className="admin-animal-item">
                      <Group align="flex-start" wrap="nowrap">
                        <Image src={animal.image_url} alt={animal.name} className="admin-animal-thumb" />
                        <Stack gap={6} flex={1}>
                          <Group justify="space-between" align="flex-start" gap="xs">
                            <div>
                              <Title order={3} className="admin-animal-name">{animal.name}</Title>
                              <Badge color="teal" variant="light">{animal.species}</Badge>
                            </div>
                            <Group gap={6} wrap="nowrap">
                              <Tooltip label="Edit">
                                <ActionIcon variant="light" color="blue" onClick={() => openEdit(animal)}>
                                  <IconEdit size={16} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Delete">
                                <ActionIcon variant="light" color="red" onClick={() => handleDelete(animal.id)}>
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Group>
                          <Text size="sm" c="dimmed" lineClamp={3}>{animal.description}</Text>
                        </Stack>
                      </Group>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="requests" pt="lg">
            {loading ? (
              <div className="loading-center">
                <div className="spinner" />
                <p className="loading-text">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <EmptyState title="No pending requests" text="All submissions have been reviewed." />
            ) : (
              <Stack gap="md">
                {requests.map((request) => (
                  <Card key={request.id} withBorder radius="lg" shadow="sm" p="md" className="admin-request-item">
                    <Group align="stretch" gap="md">
                      <Image src={request.image_url} alt={request.name} className="admin-request-img" />
                      <Stack gap={8} flex={1}>
                        <Group justify="space-between" align="flex-start">
                          <div>
                            <Title order={3}>{request.name}</Title>
                            <Group gap={8} mt={4}>
                              <Badge color="teal" variant="light">{request.species}</Badge>
                              <Badge color="yellow" variant="light">{request.status}</Badge>
                            </Group>
                          </div>
                        </Group>
                        <Text size="sm" c="dimmed">{request.description}</Text>
                        <Group>
                          <Button size="sm" color="teal" leftSection={<IconCheck size={16} />} onClick={() => handleApprove(request.id)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="light" color="red" leftSection={<IconX size={16} />} onClick={() => handleReject(request.id)}>
                            Reject
                          </Button>
                        </Group>
                      </Stack>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <Modal opened={showAdd} onClose={() => setShowAdd(false)} title="Add New Animal" centered radius="lg">
        <form onSubmit={handleAdd} id="add-animal-form">
          <Stack gap="md">
            <TextInput label="Name" required value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.currentTarget.value })} />
            <TextInput label="Species" required value={addForm.species} onChange={(e) => setAddForm({ ...addForm, species: e.currentTarget.value })} />
            <Textarea label="Description" minRows={3} required value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.currentTarget.value })} />
            <FileInput label="Image" accept="image/*" required value={addImage} onChange={setAddImage} clearable />
            <FileInput label="Animal sound" accept="audio/*" required value={addAudio} onChange={setAddAudio} clearable />
            <Button type="submit" loading={addLoading} leftSection={<IconPlus size={18} />}>
              Add Animal
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal opened={!!editAnimalData} onClose={() => setEditAnimalData(null)} title="Edit Animal" centered radius="lg">
        <form onSubmit={handleEdit} id="edit-animal-form">
          <Stack gap="md">
            <TextInput label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.currentTarget.value })} />
            <TextInput label="Species" value={editForm.species} onChange={(e) => setEditForm({ ...editForm, species: e.currentTarget.value })} />
            <Textarea label="Description" minRows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.currentTarget.value })} />
            <FileInput label="Replace image" accept="image/*" value={editForm.imageFile} onChange={(file) => setEditForm({ ...editForm, imageFile: file })} clearable />
            <FileInput label="Replace animal sound" accept="audio/*" value={editForm.audioFile} onChange={(file) => setEditForm({ ...editForm, audioFile: file })} clearable />
            <Button type="submit" loading={editLoading} leftSection={<IconDeviceFloppy size={18} />}>
              Save Changes
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal opened={aiEditOpened} onClose={() => setAiEditOpened(false)} title="Edit AI Animal" centered radius="lg">
        <form onSubmit={handleAiEdit}>
          <Stack gap="md">
            <TextInput label="Name" value={aiEditForm.name} onChange={(e) => setAiEditForm({ ...aiEditForm, name: e.currentTarget.value })} />
            <TextInput label="Species" value={aiEditForm.species} onChange={(e) => setAiEditForm({ ...aiEditForm, species: e.currentTarget.value })} />
            <Textarea label="Description" minRows={4} value={aiEditForm.description} onChange={(e) => setAiEditForm({ ...aiEditForm, description: e.currentTarget.value })} />
            <FileInput label="Replace image" accept="image/*" value={aiEditForm.imageFile} onChange={(file) => setAiEditForm({ ...aiEditForm, imageFile: file })} clearable />
            <FileInput label="Replace animal sound" accept="audio/*" value={aiEditForm.audioFile} onChange={(file) => setAiEditForm({ ...aiEditForm, audioFile: file })} clearable />
            <Button type="submit" loading={aiEditLoading} leftSection={<IconDeviceFloppy size={18} />}>
              Save Changes
            </Button>
          </Stack>
        </form>
      </Modal>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <Paper withBorder radius="lg" p="xl" className="empty-state">
      <Title order={3}>{title}</Title>
      <Text c="dimmed" size="sm">{text}</Text>
    </Paper>
  );
}
