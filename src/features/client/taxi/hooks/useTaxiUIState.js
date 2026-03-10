import { useState } from 'react';

export function useTaxiUIState() {
  const [step, setStep] = useState('main');
  const [darkMode, setDarkMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [podyezdOpen, setPodyezdOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [addStopOpen, setAddStopOpen] = useState(false);
  const [wishesOpen, setWishesOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  return {
    step, setStep,
    darkMode, setDarkMode,
    searchOpen, setSearchOpen,
    isDraggingMap, setIsDraggingMap,
    podyezdOpen, setPodyezdOpen,
    shareOpen, setShareOpen,
    addStopOpen, setAddStopOpen,
    wishesOpen, setWishesOpen,
    scheduleOpen, setScheduleOpen,
  };
}
