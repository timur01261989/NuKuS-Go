// Only change: Realtime toggle UI removed.
// Realtime subscription stays always ON internally.

import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function DriverFreightPage() {

  useEffect(() => {
    // realtime always active
    const channel = supabase
      .channel('cargo-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cargo_orders' },
        () => {
          console.log('Realtime update received');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div>
      {/* Realtime badge and toggle removed intentionally */}
      <h2>Yuk tashish (Haydovchi)</h2>
    </div>
  );
}
