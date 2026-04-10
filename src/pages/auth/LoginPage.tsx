import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, CircleDollarSign, Building2, LogIn, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UserRole } from '../../types';

type LoginStep = 'credentials' | 'otp';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('entrepreneur');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<LoginStep>('credentials');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  const { initiateTwoFactorLogin, verifyTwoFactorOtp, clearPendingLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      clearPendingLogin();
    };
  }, [clearPendingLogin]);

  const destinationPath = useMemo(
    () => (role === 'entrepreneur' ? '/dashboard/entrepreneur' : '/dashboard/investor'),
    [role]
  );

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const generatedOtp = await initiateTwoFactorLogin(email, password, role);
      setDemoOtp(generatedOtp);
      setStep('otp');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await verifyTwoFactorOtp(otp);
      navigate(destinationPath);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const newOtp = await initiateTwoFactorLogin(email, password, role);
      setDemoOtp(newOtp);
      setOtp('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (userRole: UserRole) => {
    if (userRole === 'entrepreneur') {
      setEmail('sarah@techwave.io');
      setPassword('password123');
    } else {
      setEmail('michael@vcinnovate.com');
      setPassword('password123');
    }
    setRole(userRole);
    setOtp('');
    setStep('credentials');
    setDemoOtp(null);
    setError(null);
    clearPendingLogin();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary-600 rounded-md flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
              <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {step === 'credentials' ? 'Sign in to Business Nexus' : 'Two-Factor Verification'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 'credentials'
            ? 'Connect with investors and entrepreneurs'
            : 'Enter the one-time code to complete sign in'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-error-50 border border-error-500 text-error-700 px-4 py-3 rounded-md flex items-start">
              <AlertCircle size={18} className="mr-2 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'credentials' ? (
            <form className="space-y-6" onSubmit={handleCredentialsSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  I am a
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className={`py-3 px-4 border rounded-md flex items-center justify-center transition-colors ${
                      role === 'entrepreneur'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setRole('entrepreneur')}
                  >
                    <Building2 size={18} className="mr-2" />
                    Entrepreneur
                  </button>

                  <button
                    type="button"
                    className={`py-3 px-4 border rounded-md flex items-center justify-center transition-colors ${
                      role === 'investor'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setRole('investor')}
                  >
                    <CircleDollarSign size={18} className="mr-2" />
                    Investor
                  </button>
                </div>
              </div>

              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                startAdornment={<User size={18} />}
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                leftIcon={<ShieldCheck size={18} />}
              >
                Continue to OTP
              </Button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleOtpSubmit}>
              <div className="rounded-md bg-secondary-50 border border-secondary-100 p-3 text-sm text-secondary-800">
                <p className="font-medium">2FA Mock Code (demo only):</p>
                <p className="mt-1 tracking-widest text-lg font-semibold">{demoOtp ?? '------'}</p>
              </div>

              <Input
                label="One-time password"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit code"
                required
                fullWidth
              />

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                leftIcon={<LogIn size={18} />}
              >
                Verify and Sign in
              </Button>

              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={handleResendOtp}
                  isLoading={isLoading}
                >
                  Resend OTP
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    setStep('credentials');
                    setOtp('');
                    setDemoOtp(null);
                    clearPendingLogin();
                  }}
                >
                  Back
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => fillDemoCredentials('entrepreneur')}
                leftIcon={<Building2 size={16} />}
              >
                Entrepreneur Demo
              </Button>

              <Button
                variant="outline"
                onClick={() => fillDemoCredentials('investor')}
                leftIcon={<CircleDollarSign size={16} />}
              >
                Investor Demo
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
