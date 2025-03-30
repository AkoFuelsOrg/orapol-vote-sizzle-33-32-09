
import React from 'react';
import ProfileSetup from './ProfileSetup';
import ProtectedRoute from '../components/ProtectedRoute';

const ProfileSetupWrapper = () => {
  return (
    <ProtectedRoute requireProfileSetup={true}>
      <ProfileSetup />
    </ProtectedRoute>
  );
};

export default ProfileSetupWrapper;
