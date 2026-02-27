import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { supabase, getCurrentUser, getUserProfile } from '../config/supabase';

export default function ProtectedRoute({ role }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkUser();
  }, [role]);

  const checkUser = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      
      if (!currentUser) {
        setLoading(false);
        return;
      }

      const profile = await getUserProfile(currentUser.id);
      setUser(profile);

      // Check role
      if (role && profile.role !== role) {
        setAuthorized(false);
      } else {
        setAuthorized(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!authorized) {
    // Redirect to correct home based on user role
    const redirectPath = user.role === 'driver' ? '/driver/home' : '/client/home';
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet context={{ user }} />;
}
