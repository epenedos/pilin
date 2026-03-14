import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { userApi } from '../api/user.api';
import { CurrencySelector } from '../components/ui/CurrencySelector';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [selectedCurrency, setSelectedCurrency] = useState(user?.defaultCurrency || 'USD');
  const [currencyError, setCurrencyError] = useState('');
  const [currencySuccess, setCurrencySuccess] = useState('');
  const [currencyLoading, setCurrencyLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await userApi.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCurrencyChange = async () => {
    if (selectedCurrency === user?.defaultCurrency) return;

    setCurrencyError('');
    setCurrencySuccess('');
    setCurrencyLoading(true);

    try {
      await userApi.updateCurrency({ currency: selectedCurrency });
      await refreshUser();
      setCurrencySuccess('Default currency updated successfully');
    } catch (err: any) {
      setCurrencyError(err.response?.data?.error || 'Failed to update currency');
      setSelectedCurrency(user?.defaultCurrency || 'USD');
    } finally {
      setCurrencyLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>

      <div className="space-y-6">
        {/* Account Information Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Account Information</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1 text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Display Name</label>
              <p className="mt-1 text-gray-900">{user?.displayName}</p>
            </div>
          </div>
        </div>

        {/* Password Change Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Change Password</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
                minLength={8}
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {passwordError && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-green-600">{passwordSuccess}</p>
            )}

            <button
              type="submit"
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Currency Settings Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Currency Settings</h3>
          <p className="text-sm text-gray-600 mb-4">
            Set your default currency for new accounts and transactions.
          </p>
          <div className="space-y-4">
            <CurrencySelector
              value={selectedCurrency}
              onChange={setSelectedCurrency}
              label="Default Currency"
            />

            {currencyError && (
              <p className="text-sm text-red-600">{currencyError}</p>
            )}
            {currencySuccess && (
              <p className="text-sm text-green-600">{currencySuccess}</p>
            )}

            <button
              onClick={handleCurrencyChange}
              disabled={currencyLoading || selectedCurrency === user?.defaultCurrency}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currencyLoading ? 'Saving...' : 'Save Currency'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
