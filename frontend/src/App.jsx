import { Navigate, Route, Routes } from 'react-router-dom';
import AboutPage from './components/AboutPage';
import AccountPage from './components/AccountPage';
import AdminPage from './components/AdminPage';
import AuthPage from './components/AuthPage';
import EventPage from './components/EventPage';
import ExplorePage from './components/ExplorePage';
import HomePage from './components/HomePage';
import Layout from './components/Layout';
import OrganizerPage from './components/OrganizerPage';
import PaymentPage from './components/PaymentPage';
import RequireAuth from './components/RequireAuth';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="events" element={<ExplorePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="events/:eventId" element={<EventPage />} />

        <Route element={<RequireAuth />}>
          <Route path="account" element={<AccountPage />} />
          <Route path="account/:section" element={<AccountPage />} />
          <Route path="bookings/:bookingId/pay" element={<PaymentPage />} />
        </Route>

        <Route element={<RequireAuth roles={['organizer', 'admin']} />}>
          <Route path="organizer" element={<OrganizerPage />} />
          <Route path="organizer/:section" element={<OrganizerPage />} />
        </Route>

        <Route element={<RequireAuth roles={['admin']} />}>
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/:section" element={<AdminPage />} />
        </Route>
      </Route>

      <Route path="login" element={<AuthPage type="login" />} />
      <Route path="signup" element={<AuthPage type="signup" />} />
      <Route path="forgot-password" element={<AuthPage type="forgot" />} />
      <Route path="reset-password" element={<AuthPage type="reset" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
