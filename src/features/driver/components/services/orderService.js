import { useEffect } from 'react';
import { playAliceVoice } from '../utils/audioPlayer';

const OrderTracker = ({ orderStatus }) => {
  useEffect(() => {
    switch (orderStatus) {
      case 'searching':
        // Haydovchi qidirilmoqda
        break;
      case 'accepted':
        // Buyurtma qabul qilindi
        playAliceVoice('RouteStarted'); 
        break;
      case 'arrived':
        // Haydovchi yetib keldi
        playAliceVoice('Arrived');
        break;
      case 'on_ride':
        // Safar boshlandi
        playAliceVoice('RouteStarted');
        break;
      case 'finished':
        // Safar yakunlandi
        playAliceVoice('Arrived'); // Yoki 'Finish' papkasi bo'lsa shuni
        break;
      default:
        break;
    }
  }, [orderStatus]);

  return null; // Bu faqat mantiqiy komponent
};