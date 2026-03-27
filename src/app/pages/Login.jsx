import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Checkbox } from '../components/ui/checkbox.jsx';
import { Alert, AlertDescription } from '../components/ui/alert.jsx';
import { Eye, EyeOff, Loader2, Building2, UserCog, User } from 'lucide-react';
import mannaLogo from '../images/manna_logo.png';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // State for form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load saved email if "remember me" was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      // Attempt login
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();
      const user = await login(cleanEmail, cleanPassword);
      
      // Handle "remember me" functionality
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', cleanEmail);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // Store user preferences
      sessionStorage.setItem('lastLogin', new Date().toISOString());
      
      // Redirect based on user role with welcome message
      const roleMessages = {
        admin: 'Welcome back, Administrator!',
        staff: 'Welcome back, Staff Member!',
        tenant: `Welcome back to your commercial space, ${user.firstName || 'Tenant'}!`
      };
      
      // You could show a toast notification here
      console.log(roleMessages[user.role] || 'Welcome back!');
      
      // Navigate to appropriate dashboard
      switch (user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'staff':
          navigate('/staff');
          break;
        case 'tenant':
          navigate('/tenant');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="relative min-h-screen bg-amber-50 flex items-center justify-center p-4">

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, #fbbf24 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Center column */}
      <div className="relative w-full max-w-md flex flex-col items-center">

        {/* Logo / brand */}
        <div className="flex flex-col items-center justify-center gap-3 mb-8">
          <img 
            src={mannaLogo}
            alt="Company Logo" 
            className="w-24 h-24 object-contain drop-shadow-lg"
          />
          <span className="font-black text-2xl text-[#2E3192] tracking-wide">
            Manna Mall
          </span>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full shadow-xl">

          {/* Card heading */}
          <div className="text-center mb-6 space-y-1">
            <h1 className="text-2xl font-extrabold text-[#2E3192]">Welcome Back</h1>
            <p className="text-sm text-gray-500">Sign in to access your dashboard</p>
          </div>

          {/* Error alert */}
          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-50 border border-red-200 text-red-700">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email input */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold text-[#2E3192] uppercase tracking-wider"
              >
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                autoComplete="email"
                autoFocus
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F9E81B] focus:border-[#F9E81B] transition h-11"
              />
            </div>

            {/* Password input with show/hide toggle */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-[#2E3192] uppercase tracking-wider"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-sm text-[#ED1C24] hover:text-[#c41920] underline transition focus:outline-none"
                >
                  {showPassword ? (
                    <span className="flex items-center gap-1"><EyeOff className="w-3.5 h-3.5" /> Hide</span>
                  ) : (
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Show</span>
                  )}
                </button>
              </div>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F9E81B] focus:border-[#F9E81B] transition h-11"
              />
            </div>

            {/* Remember me checkbox */}
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={loading}
                  className="w-4 h-4 border-gray-300 data-[state=checked]:bg-[#2E3192] data-[state=checked]:border-[#2E3192]"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={loading}
              className={`
                w-full py-3 h-12 rounded-xl font-bold transition active:scale-95 shadow-lg mt-2 text-base
                ${loading
                  ? 'bg-[#F9E81B]/60 text-[#2E3192] cursor-wait'
                  : 'bg-[#F9E81B] hover:bg-[#e6d619] text-[#2E3192] cursor-pointer'
                }
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Forgot password link */}
          <div className="mt-4 text-center">
            <a href="#" className="text-sm text-[#ED1C24] hover:text-[#c41920] transition underline">
              Forgot your password?
            </a>
          </div>

        </div>{/* end card */}

        {/* Footer */}
        <div className="mt-6 flex flex-col items-center gap-1 text-center">
          <p className="text-xs text-gray-500">© 2026 Commercial Space Manager. All rights reserved.</p>
          <p className="text-xs text-gray-400">
            By signing in, you agree to our{' '}
            <a href="#" className="text-[#2E3192] hover:text-[#1f2170] transition underline">Terms</a>
            {' '}and{' '}
            <a href="#" className="text-[#2E3192] hover:text-[#1f2170] transition underline">Privacy Policy</a>
          </p>
        </div>

      </div>{/* end column */}
    </div>
  );
}
