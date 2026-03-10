import { useMemo, useState } from 'react';

export function useTaxiDraft() {
  const [pickup, setPickup] = useState({ latlng: null, address: '', entrance: '' });
  const [dest, setDest] = useState({ latlng: null, address: '' });
  const [waypoints, setWaypoints] = useState([]);
  const [comment, setComment] = useState('');
  const [scheduledTime, setScheduledTime] = useState(null);
  const [orderFor, setOrderFor] = useState('self');
  const [otherPhone, setOtherPhone] = useState('');
  const [wishes, setWishes] = useState({ ac: false, trunk: false, childSeat: false, smoking: 'no' });

  const draft = useMemo(() => ({ pickup, dest, waypoints, comment, scheduledTime, orderFor, otherPhone, wishes }), [pickup, dest, waypoints, comment, scheduledTime, orderFor, otherPhone, wishes]);

  return {
    draft,
    pickup,
    setPickup,
    dest,
    setDest,
    waypoints,
    setWaypoints,
    comment,
    setComment,
    scheduledTime,
    setScheduledTime,
    orderFor,
    setOrderFor,
    otherPhone,
    setOtherPhone,
    wishes,
    setWishes,
  };
}
