import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Hotel, Eye, EyeOff } from 'lucide-react';
import { useLogin } from '../lib/hooks/useAuth';

export function LoginView() {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      console.log('[LoginView] Submitting login for:', email);
      const result = await login.mutateAsync({ email, password });
      console.log('[LoginView] Login mutation resolved, user:', result?.user?.email);
      console.log('[LoginView] Navigating to /');
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('[LoginView] Login error:', err);
      setError(err?.message || 'Identifiants incorrects');
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FAF9F6]">
      <div className="hidden lg:flex lg:w-1/2 bg-[#1A1A1A] relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] via-[#2a2a2a] to-[#1A1A1A]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#C5A059]/5 blur-3xl" />
        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#C5A059]/20 flex items-center justify-center mb-8">
            <Hotel className="w-10 h-10 text-[#C5A059]" />
          </div>
          <h1 className="text-5xl font-serif italic text-white tracking-tight mb-4">L'Éden</h1>
          <p className="text-white/40 text-sm uppercase tracking-[0.3em] font-medium">
            Système de Gestion
          </p>
          <div className="mt-12 space-y-3 text-white/30 text-xs uppercase tracking-[0.2em]">
            <p className="text-[#C5A059]/60">— Conçu pour l'excellence —</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10 lg:hidden">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#C5A059]/20 flex items-center justify-center mb-4">
              <Hotel className="w-7 h-7 text-[#C5A059]" />
            </div>
            <h1 className="text-3xl font-serif italic tracking-tight">L'Éden</h1>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#1A1A1A]/30 font-medium mt-1">
              Hôtel &amp; Lodge
            </p>
          </div>

          <h2 className="text-2xl font-serif mb-1">Connexion</h2>
          <p className="text-sm text-[#1A1A1A]/40 mb-8">
            Accédez à votre tableau de bord
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@eden-hotel.com"
                className="w-full px-4 py-3 bg-white border border-[#1A1A1A]/10 rounded-sm text-sm outline-none focus:border-[#C5A059] transition-colors placeholder:text-[#1A1A1A]/20"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-10 bg-white border border-[#1A1A1A]/10 rounded-sm text-sm outline-none focus:border-[#C5A059] transition-colors placeholder:text-[#1A1A1A]/20"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30 hover:text-[#1A1A1A]/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-sm px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full py-3 bg-[#1A1A1A] text-white text-xs uppercase tracking-[0.25em] font-semibold rounded-sm hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {login.isPending ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1A1A1A]/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#FAF9F6] px-4 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 font-medium">
                  ou
                </span>
              </div>
            </div>
            <Link
              to="/demo"
              target="_blank"
              className="inline-flex items-center gap-2.5 px-6 py-3 border border-[#C5A059]/30 text-[#C5A059] text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-[#C5A059]/5 transition-colors rounded-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              Voir la démo
            </Link>
            <p className="text-[10px] text-[#1A1A1A]/25 mt-3">
              Explorez le dashboard sans compte ni mot de passe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
