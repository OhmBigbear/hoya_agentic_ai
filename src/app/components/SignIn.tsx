import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface SignInProps {
  onSignIn: () => void;
}

export function SignIn({ onSignIn }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignIn();
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Agentic MES AI
          </h1>
          <p className="text-sm text-slate-400">
            Manufacturing Execution & Agentic AI System
          </p>
        </div>

        {/* Sign In Form */}
        <div className="bg-[#141b2e] rounded-lg border border-white/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#1e293b] border-white/10 text-white placeholder:text-slate-500 focus:border-[#00d4ff] focus:ring-[#00d4ff]"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-200">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#1e293b] border-white/10 text-white placeholder:text-slate-500 focus:border-[#00d4ff] focus:ring-[#00d4ff]"
                required
              />
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1e] font-medium py-2.5"
            >
              Sign In
            </Button>

            {/* SSO Option */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-[#141b2e] text-slate-500">or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-white/10 text-slate-300 hover:bg-[#1e293b] hover:text-white py-2.5"
            >
              Sign in with SSO (Azure AD)
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-500">
            © Agentic MES AI
          </p>
        </div>
      </div>
    </div>
  );
}