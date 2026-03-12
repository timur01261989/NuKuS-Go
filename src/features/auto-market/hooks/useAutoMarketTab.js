import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const TAB_BY_PATH = {
  '/auto-market': 'feed',
  '/market': 'feed',
  '/auto-market/favorites': 'favorites',
  '/market/favorites': 'favorites',
  '/auto-market/my-ads': 'my-ads',
  '/market/my-ads': 'my-ads',
  '/auto-market/compare': 'compare',
  '/market/compare': 'compare',
  '/auto-market/create': 'create',
  '/market/create': 'create',
  '/auto-market/vikup': 'vikup',
  '/market/vikup': 'vikup',
  '/auto-market/barter': 'barter',
  '/market/barter': 'barter',
  '/auto-market/garaj': 'garaj',
  '/market/garaj': 'garaj',
  '/auto-market/zapchast': 'zapchast',
  '/market/zapchast': 'zapchast',
  '/auto-market/razborka': 'razborka',
  '/market/razborka': 'razborka',
  '/auto-market/battle': 'battle',
  '/market/battle': 'battle',
  '/auto-market/analytics': 'analytics',
  '/market/analytics': 'analytics',
  '/auto-market/service-book': 'service-book',
  '/market/service-book': 'service-book',
  '/auto-market/topup': 'topup',
  '/market/topup': 'topup',
};

export function useAutoMarketTab() {
  const location = useLocation();

  return useMemo(() => {
    const pathname = location?.pathname || '/auto-market';
    if (TAB_BY_PATH[pathname]) return TAB_BY_PATH[pathname];
    if (/\/ad\//.test(pathname)) return 'details';
    return 'feed';
  }, [location?.pathname]);
}

export default useAutoMarketTab;
