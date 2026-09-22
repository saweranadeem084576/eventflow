const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const TOKEN_KEY = 'eventFlowToken';

// Uploaded files are served from the API origin, outside the /api/v1 prefix.
const serverOrigin = apiUrl.replace(/\/api\/v\d+\/?$/, '');
export const assetUrl = (path) => (path?.startsWith('/uploads/') ? `${serverOrigin}${path}` : path);

export const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const logout = () => localStorage.removeItem(TOKEN_KEY);

// `body` is JSON-encoded; `rawBody` (e.g. FormData) is passed through untouched.
async function apiRequest(path, { body, rawBody, ...options } = {}) {
  const token = getToken();
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      ...(body && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: rawBody || (body && JSON.stringify(body)),
  });

  if (response.status === 204) return null;
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || 'Request failed');
  return payload;
}

const get = (path, params) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(query ? `${path}?${query}` : path);
};
const post = (path, body) => apiRequest(path, { method: 'POST', body });
const patch = (path, body) => apiRequest(path, { method: 'PATCH', body });
const del = (path) => apiRequest(path, { method: 'DELETE' });

// Auth
async function storeSession(payload) {
  setToken(payload.data.token);
  return payload.data.user;
}
export const login = (credentials) => post('/auth/login', credentials).then(storeSession);
export const register = (details) => post('/auth/register', details).then(storeSession);
export const getCurrentUser = () => get('/auth/me').then((p) => p.data.user);
export const requestPasswordReset = (email) => post('/auth/forgot-password', { email });
export const resetPassword = (token, newPassword) =>
  patch(`/auth/reset-password/${encodeURIComponent(token)}`, { newPassword });
export const changePassword = (passwords) => patch('/auth/password', passwords).then(storeSession);

// Events
export const listEvents = (filters) => get('/events', filters);
export const listMyEvents = () => get('/events/mine', { limit: 50 }).then((p) => p.data.events);
export const getEvent = (id) => get(`/events/${id}`).then((p) => p.data.event);
export const createEvent = (event) => post('/events', event).then((p) => p.data.event);
export const updateEvent = (id, updates) =>
  patch(`/events/${id}`, updates).then((p) => p.data.event);
export const deleteEvent = (id) => del(`/events/${id}`);
export const listEventBookings = (id) =>
  get(`/events/${id}/bookings`, { limit: 50 }).then((p) => p.data.bookings);

// Bookings & payments
export const listBookings = () => get('/bookings', { limit: 50 }).then((p) => p.data.bookings);
export const getBooking = (id) => get(`/bookings/${id}`).then((p) => p.data.booking);
export const createBooking = (eventId) =>
  post('/bookings', { event: eventId }).then((p) => p.data.booking);
export const cancelBooking = (id) => patch(`/bookings/${id}/cancel`).then((p) => p.data.booking);
export const createPaymentIntent = (bookingId) =>
  post('/payments/intent', { booking: bookingId }).then((p) => p.data);
export const confirmPayment = (paymentId) =>
  post(`/payments/${paymentId}/confirm`).then((p) => p.data.payment);

// Feedback
export const getEventFeedback = (eventId) =>
  get(`/feedback/event/${eventId}`).then((p) => ({
    items: p.data.feedback,
    summary: p.data.summary,
  }));
export const submitFeedback = (feedback) =>
  post('/feedback', feedback).then((p) => p.data.feedback);
export const listRecentFeedback = () => get('/feedback/recent').then((p) => p.data.feedback);

// Notifications
export const listNotifications = () => get('/notifications').then((p) => p.data);
export const markNotificationRead = (id) => patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => patch('/notifications/read-all');

// Users & complaints
export const listUsers = () => get('/users').then((p) => p.data.users);
export const updateUser = (id, updates) => patch(`/users/${id}`, updates).then((p) => p.data.user);
export const deleteUser = (id) => del(`/users/${id}`);
export const uploadAvatar = (file) => {
  const body = new FormData();
  body.append('avatar', file);
  // No Content-Type header: the browser sets the multipart boundary itself.
  return apiRequest('/users/me/avatar', { method: 'POST', rawBody: body }).then((p) => p.data.user);
};
export const listMyComplaints = () => get('/complaints').then((p) => p.data.complaints);
export const createComplaint = (complaint) =>
  post('/complaints', complaint).then((p) => p.data.complaint);

// Admin
export const getAdminOverview = () => get('/admin/overview').then((p) => p.data);
export const listAdminEvents = (filters) =>
  get('/admin/events', { limit: 100, ...filters }).then((p) => p.data.events);
export const approveEvent = (id) => patch(`/admin/events/${id}/approve`).then((p) => p.data.event);
export const listAdminBookings = () =>
  get('/admin/bookings', { limit: 100 }).then((p) => p.data.bookings);
export const listAdminComplaints = (filters) =>
  get('/admin/complaints', filters).then((p) => p.data.complaints);
export const resolveComplaint = (id, resolution) =>
  patch(`/admin/complaints/${id}/resolve`, { resolution }).then((p) => p.data.complaint);
