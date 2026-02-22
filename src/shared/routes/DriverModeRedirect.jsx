import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';

/**
 * DriverModeRedirect
 * /driver-mode route ni handle qiladi va location state bilan
 * /driver/dashboard ga redirect qiladi
 */
export default function DriverModeRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    // location.state ni saqlash (ClientHome dan kelgan state)
    const fromPath = location.state?.from;
    
    // /driver/dashboard ga location state bilan redirect
    navigate('/driver/dashboard', {
      replace: true,
      state: { from: fromPath } // location state ni o'tish
    });
  }, [navigate, location.state]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <Spin size="large" />
    </div>
  );
}
