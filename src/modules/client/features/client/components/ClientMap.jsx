import React, { useEffect } from 'react';
import SearchRadar from '../../map/components/SearchRadar';
import RatingCelebration from '../../ui/components/RatingCelebration';
import { playSound } from '../../../utils/audioHelper';
import { playAliceVoice } from '../../../utils/AudioPlayer';

const ClientMap = ({ status }) => { // 'status' props yoki context orqali keladi
  useEffect(() => {
    if (status === 'on_ride') {
      playAliceVoice('RouteStarted');
    } else if (status === 'arrived') {
      playAliceVoice('Arrived');
    } else if (status === 'searching') {
      // playAliceVoice('Searching');
    }
  }, [status]);

  return (
    <div style={{ position: 'relative' }}>
      <SearchRadar isVisible={status === 'searching'} />
      {/* Xarita komponenti shu yerda bo'ladi */}
      <RatingCelebration />
    </div>
  );
};

export default ClientMap;
