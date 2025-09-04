'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { authAPI } from '@/lib/api';

interface AdminPasswordChangeProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPasswordChange({ isOpen, onClose }: AdminPasswordChangeProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar,
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
    };
  };

  const passwordValidation = validatePassword(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordValidation.isValid) {
      toast.error('Password does not meet security requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Log password change attempt to console for admin tracking
      console.log('=== ADMIN PASSWORD CHANGE ATTEMPT ===');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Admin User:', 'admin@test.com'); // In real app, get from auth store
      console.log('IP Address:', 'localhost'); // In real app, get actual IP
      console.log('User Agent:', navigator.userAgent);
      console.log('Password Strength:', {
        length: newPassword.length,
        hasUppercase: passwordValidation.hasUppercase,
        hasLowercase: passwordValidation.hasLowercase,
        hasNumber: passwordValidation.hasNumber,
        hasSpecialChar: passwordValidation.hasSpecialChar,
      });

      // Call real API
      await authAPI.changePassword(currentPassword, newPassword);

      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error: any) {
      console.error('Password change failed:', error.message);
      console.log('=====================================');
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Admin Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        {newPassword && (
          <div className="text-sm space-y-1">
            <p className="font-medium text-gray-700">Password Requirements:</p>
            <div className="grid grid-cols-2 gap-1">
              <span className={passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}>
                ✓ 8+ characters
              </span>
              <span className={passwordValidation.hasUppercase ? 'text-green-600' : 'text-red-600'}>
                ✓ Uppercase letter
              </span>
              <span className={passwordValidation.hasLowercase ? 'text-green-600' : 'text-red-600'}>
                ✓ Lowercase letter
              </span>
              <span className={passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}>
                ✓ Number
              </span>
              <span className={passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-red-600'}>
                ✓ Special character
              </span>
            </div>
          </div>
        )}

        <Input
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !passwordValidation.isValid || newPassword !== confirmPassword}
          >
            {isLoading ? 'Changing...' : 'Change Password'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
