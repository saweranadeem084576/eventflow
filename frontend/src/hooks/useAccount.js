import { useCallback, useEffect, useState } from 'react';
import {
  cancelBooking,
  listBookings,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api';

export function useAccount() {
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [nextBookings, nextNotifications] = await Promise.all([
        listBookings(),
        listNotifications(),
      ]);
      setBookings(nextBookings);
      setNotifications(nextNotifications.notifications);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = (task) => task.then(load).catch((requestError) => setError(requestError.message));

  return {
    bookings,
    notifications,
    loading,
    error,
    cancel: (bookingId) => run(cancelBooking(bookingId)),
    markRead: (notificationId) => run(markNotificationRead(notificationId)),
    markAllRead: () => run(markAllNotificationsRead()),
  };
}
