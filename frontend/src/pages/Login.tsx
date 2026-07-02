import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Lock, User, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import axios from 'axios';

export const Login: React.FC = () => {
  const { login, token, user, logoutReason, clearLogoutReason } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [usernameOrId, setUsernameOrId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotId, setForgotId] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Pre-fill Employee ID if "Remember Me" was checked previously
  useEffect(() => {
    const savedId = localStorage.getItem('remembered_id');
    if (savedId) {
      setUsernameOrId(savedId);
      setRememberMe(true);
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (token && user) {
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/employee');
      }
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    clearLogoutReason();

    if (!usernameOrId || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { usernameOrId, password });
      const { token: jwtToken, ...userData } = res.data;
      login(jwtToken, userData, rememberMe);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotId || !forgotEmail) {
      setForgotError('Please fill in all fields.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await axios.post('/api/auth/forgot-password', {
        employeeId: forgotId,
        email: forgotEmail
      });
      setForgotSuccess(res.data.message);
      setForgotId('');
      setForgotEmail('');
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Verification failed. Double check Employee ID and Email.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-background text-foreground transition-all duration-300 p-6 md:p-10 relative overflow-y-auto">
      
      {/* Header: Logo and Lang Toggle / Mode Switch */}
      <header className="flex justify-between items-center w-full max-w-7xl mx-auto">
        <div className="flex items-center">
          <img 
            src={theme === 'light' ? '/logo-dark.png' : '/logo-light.png'} 
            alt="ID Thirdeye" 
            className="h-20 w-auto object-contain"
          />
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={toggleTheme}
            className="p-2 border border-border/80 rounded-xl bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition duration-200"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          
          <div className="flex items-center space-x-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none transition">
            <span className="text-sm">🇬🇧</span>
            <span className="font-medium">En</span>
            <span className="text-[8px]">▼</span>
          </div>
        </div>
      </header>

      {/* Center: Greeting & Form Inputs (Beautiful Centered Card) */}
      <main className="my-auto py-8 max-w-[400px] w-full mx-auto space-y-6 bg-card border border-border/40 p-8 rounded-2xl shadow-sm backdrop-blur-xs">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Hello.</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            To log in to your account, please enter your identifier and password.
          </p>
        </div>

        {/* Messages */}
        {logoutReason && (
          <div className="p-3.5 rounded-xl border border-foreground/10 bg-muted flex items-start space-x-2 text-xs text-foreground/80 animate-in fade-in duration-200">
            <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-500" />
            <span>{logoutReason}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive flex items-start space-x-2 text-xs animate-in fade-in duration-200">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee ID Input */}
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Your username or employee ID"
              value={usernameOrId}
              onChange={(e) => setUsernameOrId(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border bg-muted/20 text-foreground placeholder-muted-foreground/75 focus:outline-none focus:ring-1 focus:ring-foreground transition duration-200 text-xs"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-11 py-3.5 rounded-xl border border-border bg-muted/20 text-foreground placeholder-muted-foreground/75 focus:outline-none focus:ring-1 focus:ring-foreground transition duration-200 text-xs"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition duration-200"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Remember Me Toggle */}
          <div className="flex items-center justify-start px-1 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-border bg-transparent text-foreground focus:ring-0 focus:ring-offset-0 cursor-pointer accent-foreground h-4 w-4"
              />
              <span className="text-muted-foreground text-[11px]">Remember me</span>
            </label>
          </div>

          {/* Forgot Password Link in Green */}
          <div className="text-left px-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setForgotError(null);
                setForgotSuccess(null);
                setShowForgotModal(true);
              }}
              className="text-[11px] text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold transition hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button - Glass Shine Effect */}
          <div 
            className="button-wrap relative z-10 rounded-full bg-transparent pointer-events-none mt-4 w-full flex justify-center"
            style={{ animation: 'fadeIn 1s ease-out 0.3s both' }}
          >
            <button 
              type="submit"
              disabled={loading}
              className="glass-button all-unset w-full cursor-pointer relative rounded-full pointer-events-auto z-30 outline-none focus:outline-none disabled:opacity-50 flex items-center justify-center"
            >
              <span className="button-text relative block select-none font-semibold tracking-tight px-6 py-3.5 text-neutral-800 dark:text-neutral-200 flex items-center justify-center space-x-2" style={{ fontSize: '17px' }}>
                {loading ? (
                  <div className="h-5 w-5 border-2 border-neutral-800 dark:border-neutral-200 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Sign In'
                )}
              </span>
              {/* Shine Effect */}
              <div className="button-shine"></div>
            </button>
            
            <style>{`
              @property --angle-1 {
                syntax: "<angle>";
                inherits: false;
                initial-value: -75deg;
              }

              @property --angle-2 {
                syntax: "<angle>";
                inherits: false;
                initial-value: -45deg;
              }

              .button-wrap {
                transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1);
              }

              .glass-button {
                background: linear-gradient(-75deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05));
                box-shadow:
                  inset 0 0.125em 0.125em rgba(0, 0, 0, 0.05),
                  inset 0 -0.125em 0.125em rgba(255, 255, 255, 0.5),
                  0 0.25em 0.125em -0.125em rgba(0, 0, 0, 0.2),
                  0 0 0.1em 0.25em rgba(255, 255, 255, 0.2) inset,
                  0 0 0 0 rgba(255, 255, 255, 1);
                backdrop-filter: blur(clamp(1px, 0.125em, 4px));
                transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1);
                border: none;
                width: 100%;
              }

              .dark .glass-button {
                background: linear-gradient(-75deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
                box-shadow:
                  inset 0 0.125em 0.125em rgba(0, 0, 0, 0.3),
                  inset 0 -0.125em 0.125em rgba(255, 255, 255, 0.1),
                  0 0.25em 0.125em -0.125em rgba(0, 0, 0, 0.5),
                  0 0 0.1em 0.25em rgba(255, 255, 255, 0.05) inset;
              }

              .glass-button:hover {
                transform: scale(0.975);
                backdrop-filter: blur(0.01em);
                box-shadow:
                  inset 0 0.125em 0.125em rgba(0, 0, 0, 0.05),
                  inset 0 -0.125em 0.125em rgba(255, 255, 255, 0.5),
                  0 0.15em 0.05em -0.1em rgba(0, 0, 0, 0.25),
                  0 0 0.05em 0.1em rgba(255, 255, 255, 0.5) inset,
                  0 0 0 0 rgba(255, 255, 255, 1);
              }

              .glass-button:active {
                transform: scale(0.95) rotate3d(1, 0, 0, 25deg);
                box-shadow:
                  inset 0 0.125em 0.125em rgba(0, 0, 0, 0.05),
                  inset 0 -0.125em 0.125em rgba(255, 255, 255, 0.5),
                  0 0.125em 0.125em -0.125em rgba(0, 0, 0, 0.2),
                  0 0 0.1em 0.25em rgba(255, 255, 255, 0.2) inset,
                  0 0.225em 0.05em 0 rgba(0, 0, 0, 0.05),
                  0 0.25em 0 0 rgba(255, 255, 255, 0.75),
                  inset 0 0.25em 0.05em 0 rgba(0, 0, 0, 0.15);
              }

              .button-text {
                text-shadow: 0em 0.25em 0.05em rgba(0, 0, 0, 0.1);
                transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1);
              }

              .glass-button:hover .button-text {
                text-shadow: 0.025em 0.025em 0.025em rgba(0, 0, 0, 0.12);
              }

              .glass-button:active .button-text {
                text-shadow: 0.025em 0.25em 0.05em rgba(0, 0, 0, 0.12);
              }

              .glass-button::after {
                content: '';
                position: absolute;
                inset: 0;
                border-radius: 999px;
                width: calc(100% + 2px);
                height: calc(100% + 2px);
                top: -1px;
                left: -1px;
                padding: 1px;
                box-sizing: border-box;
                background:
                  conic-gradient(from var(--angle-1) at 50% 50%, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0) 5% 40%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0) 60% 95%, rgba(0, 0, 0, 0.5)),
                  linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5));
                -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
                -webkit-mask-composite: xor;
                mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
                mask-composite: exclude;
                transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1), --angle-1 500ms ease;
                box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.5);
              }

              .dark .glass-button::after {
                background:
                  conic-gradient(from var(--angle-1) at 50% 50%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0) 5% 40%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0) 60% 95%, rgba(255, 255, 255, 0.3)),
                  linear-gradient(180deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.15));
              }

              .glass-button:hover::after {
                --angle-1: -125deg;
              }

              .glass-button:active::after {
                --angle-1: -75deg;
              }

              .button-shine {
                position: absolute;
                inset: 0;
                border-radius: 999px;
                width: calc(100% - 1px);
                height: calc(100% - 1px);
                top: 0.5px;
                left: 0.5px;
                background: linear-gradient(var(--angle-2), rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.5) 40% 50%, rgba(255, 255, 255, 0) 55%);
                mix-blend-mode: screen;
                pointer-events: none;
                background-size: 200% 200%;
                background-position: 0% 50%;
                background-repeat: no-repeat;
                transition: background-position 500ms cubic-bezier(0.25, 1, 0.5, 1), --angle-2 500ms cubic-bezier(0.25, 1, 0.5, 1);
              }

              .glass-button:hover .button-shine {
                background-position: 25% 50%;
              }

              .glass-button:active .button-shine {
                background-position: 50% 15%;
                --angle-2: -15deg;
              }

              @keyframes fadeIn {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        </form>

        {/* Contact Support Section in Green */}
        <div className="text-center text-xs pt-6 space-y-1">
          <p className="text-muted-foreground font-medium">Don't hesitate to contact us</p>
          <a href="mailto:support@idthirdeye.com" className="text-emerald-600 dark:text-emerald-500 font-semibold hover:underline">
            support@idthirdeye.com
          </a>
        </div>
      </main>

      {/* Footer: Legal Copyright */}
      <footer className="text-center text-[10px] text-muted-foreground/60 tracking-wide w-full pt-4">
        All rights reserved ID Thirdeye &copy; {new Date().getFullYear()}
      </footer>

      {/* Forgot Password Drawer Overlay */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-[400px] bg-card border border-border rounded-2xl p-6 shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold tracking-tight mb-2">Reset Password</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Enter your ID and registered email. We will log a request for the Admin to reset your credentials.
            </p>

            {forgotError && (
              <div className="mb-4 p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive text-xs">
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 p-3 rounded-lg border border-foreground/10 bg-muted text-foreground text-xs">
                {forgotSuccess}
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">Employee ID</label>
                <input
                  type="text"
                  placeholder="e.g. EMP001"
                  value={forgotId}
                  onChange={(e) => setForgotId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-transparent placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition duration-200 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">Registered Email</label>
                <input
                  type="email"
                  placeholder="e.g. employee@idthirdeye.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-transparent placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition duration-200 text-xs"
                  required
                />
              </div>

              <div className="flex space-x-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-medium transition duration-200 flex items-center justify-center"
                >
                  {forgotLoading ? (
                    <div className="h-3 w-3 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Verify & Send'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
