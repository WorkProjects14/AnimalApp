

const API_BASE = import.meta.env.VITE_API_BASE;

/**
 * Core request function with optional auth token.
 */
async function request(endpoint, options = {}, token = null) {
  // const url = `${API_BASE}${endpoint}`;

  const url = `${API_BASE}${endpoint}`;

  console.log("endpoint", endpoint);
  console.log("url", url);

  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type for JSON bodies (not FormData)
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config = { ...options, headers };

  const response = await fetch(url, config);

  // Handle non-JSON responses (like audio streams)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('audio/')) {
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.blob();
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Error: ${response.status}`);
  }

  return response.json();
}

/** Build a full static URL */
export function staticUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE}/${path}`;
}

// ========================
// User Endpoints (public)
// ========================

export async function fetchAllAnimals() {
  return request('/user/all_animals');
}

export async function fetchAnimalsBySpecies(species) {
  return request(`/user/animals_by_species/${encodeURIComponent(species)}`);
}

export async function fetchAnimal(id) {
  return request(`/user/animal/${id}`);
}

export async function fetchAnimalAudio(id) {
  return request(`/user/animal_audio/${id}`);
}

export async function generateAiAnimal(name, style = '2d', audioFile, token = null, scope = 'user') {
  const formData = new FormData();
  if (audioFile) {
    formData.append('audio_file', audioFile);
  }

  const params = new URLSearchParams({ name, style });
  return request(`/${scope}/generate_ai_animal?${params.toString()}`, {
    method: 'POST',
    body: formData,
  }, token);
}

export async function sendAnimalRequest(animalId) {
  return request(`/user/animal/send_request/${animalId}`, {
    method: 'POST',
  });
}

export async function cancelAnimalRequest(animalId) {
  return request(`/user/animal/cancel_request/${animalId}`, {
    method: 'POST',
  });
}

export async function editAiAnimal(animalId, data, token = null, scope = 'user') {
  const formData = new FormData();
  const params = new URLSearchParams();

  ['name', 'species', 'description'].forEach((key) => {
    if (data[key]?.trim()) params.append(key, data[key].trim());
  });

  if (data.imageFile) formData.append('image_file', data.imageFile);
  if (data.audioFile) formData.append('audio_file', data.audioFile);

  return request(`/${scope}/edit_ai_animal/${animalId}?${params.toString()}`, {
    method: 'PATCH',
    body: formData,
  }, token);
}

// ========================
// Admin Endpoints (auth required)
// ========================

export async function adminLogin(email, token) {
  return request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }, token);
}

export async function addAnimal(name, species, description, imageFile, audioFile, token) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('audio', audioFile);

  const params = new URLSearchParams({ name, species, description });

  return request(`/admin/add_animal?${params.toString()}`, {
    method: 'POST',
    body: formData,
  }, token);
}

export async function updateAnimal(animalId, data, token) {
  const formData = new FormData();
  const params = new URLSearchParams();

  ['name', 'species', 'description'].forEach((key) => {
    if (data[key]?.trim()) params.append(key, data[key].trim());
  });

  if (data.imageFile) formData.append('image_file', data.imageFile);
  if (data.audioFile) formData.append('audio_file', data.audioFile);

  return request(`/admin/update_animal/${animalId}?${params.toString()}`, {
    method: 'PATCH',
    body: formData,
  }, token);
}

export async function deleteAnimal(animalId, token) {
  return request(`/admin/delete_animal/${animalId}`, {
    method: 'DELETE',
  }, token);
}

export async function fetchPendingRequests(token) {
  return request('/admin/pending_requests', {}, token);
}

export async function approveAnimal(requestId, token) {
  return request(`/admin/animal/approval/${requestId}`, {
    method: 'POST',
  }, token);
}

export async function rejectAnimal(requestId, token) {
  return request(`/admin/animal/reject/${requestId}`, {
    method: 'POST',
  }, token);
}

export async function saveAiAnimalToMain(animalId, token) {
  return request(`/admin/add_ai_animal_to_main_database/${animalId}`, {
    method: 'POST',
  }, token);
}
