import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { login } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login({ email, password });
      setUser(user);
      navigate('/');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage, { autoClose: 10000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-4 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Training Management</h1>
          <p className="text-primary-200">NMDC Training Compliance System</p>
        </div>

        {/* Login card */}
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <Input
                  label=""
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-5 h-5" />}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
                />

                <Input
                  label=""
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-5 h-5" />}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800"
              >
                Sign in
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-center text-sm text-primary-200 mb-3">Demo Credentials</p>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setEmail('admin@mining.com'); setPassword('password123'); }}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-primary-100 text-left transition-colors"
                >
                  <span className="font-medium">Admin:</span> admin@mining.com
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('officer@mining.com'); setPassword('password123'); }}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-primary-100 text-left transition-colors"
                >
                  <span className="font-medium">Training Officer:</span> officer@mining.com
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('manager@mining.com'); setPassword('password123'); }}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-primary-100 text-left transition-colors"
                >
                  <span className="font-medium">Mines Manager:</span> manager@mining.com
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-primary-300/50 mt-6">
          © 2024 Mining PSU. All rights reserved.
        </p>
      </div>
    </div>
  );
}
