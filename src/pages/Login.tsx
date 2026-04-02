import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TreeDeciduous } from 'lucide-react';

export const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-sm border border-orange-100">
            <TreeDeciduous size={28} strokeWidth={2.5} />
          </div>
          <span className="text-3xl font-black tracking-tight text-stone-900">Panchayat</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-stone-900 tracking-tight">
          Welcome to Sabha
        </h2>
        <p className="mt-2 text-center text-sm text-stone-600">
          Sign in with your organization account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-stone-100 sm:rounded-3xl sm:px-10">
          <div className="space-y-6">
            {error && (
              <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
            
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-stone-200 rounded-xl shadow-sm text-sm font-bold text-stone-700 bg-white hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              {loading ? 'Connecting...' : 'Sign in with Google'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-100"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-stone-400">Restricted Access</span>
              </div>
            </div>

            <p className="text-center text-xs text-stone-400 leading-relaxed">
              Only registered emails can access the system. <br />
              Contact your Sarpanch for registration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
