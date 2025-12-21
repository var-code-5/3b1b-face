import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from './AuthContext';
import { cn } from "@/lib/utils"
import Bitcoin from '../assets/bitcoin.jpeg';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { ArrowLeft, CheckCircle2, Mic } from 'lucide-react'
import VoiceRecorder from './VoiceRecorder';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Details, 2: Voice, 3: Success
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);

  const { signup, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleVoiceRecorded = (blob: Blob) => {
    setVoiceBlob(blob);
  };

  const handleFinalSignup = async () => {
    if (!voiceBlob) {
      setError('Please record your voice first');
      return;
    }

    const success = await signup(email, password, voiceBlob);
    if (success) {
      setStep(3);
    }
  };

  return (
    <div className="min-h-screen bg-[#191918] flex items-center justify-center">
      <div className={cn("flex flex-col gap-6 min-w-[60vw]")}>
        <Card className="overflow-hidden p-0 border-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">
              <Link to="/" className="mb-4 inline-block"><ArrowLeft className='text-muted-foreground hover:text-foreground transition-colors' /></Link>

              <div className="flex flex-col items-center gap-2 text-center mb-6">
                <h1 className="text-2xl font-bold">Create Account</h1>
                <p className="text-muted-foreground text-balance">
                  {step === 1 && "Enter your details to get started"}
                  {step === 2 && "Register your voice for secure access"}
                  {step === 3 && "Registration complete!"}
                </p>
              </div>

              {/* Step 1: Email & Password */}
              {step === 1 && (
                <form onSubmit={handleDetailsSubmit}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                      <Input
                        id="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </Field>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Field>
                      <Button type="submit" className="w-full">Continue</Button>
                    </Field>

                    <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                      Or continue with
                    </FieldSeparator>
                    <div className="grid grid-cols-3 gap-4">
                      {/* Social Buttons (Placeholder) */}
                      <Button variant="outline" type="button" disabled>Google</Button>
                      <Button variant="outline" type="button" disabled>Apple</Button>
                      <Button variant="outline" type="button" disabled>Meta</Button>
                    </div>

                    <FieldDescription className="text-center mt-4">
                      Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
                    </FieldDescription>
                  </FieldGroup>
                </form>
              )}

              {/* Step 2: Voice Registration */}
              {step === 2 && (
                <div className="flex flex-col gap-6">
                  <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground text-center">
                    <Mic className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p>We use voice biometrics to secure your account. Please record a short sample of your voice.</p>
                  </div>

                  <VoiceRecorder onRecordingComplete={handleVoiceRecorded} />

                  {(error || authError) && <p className="text-red-500 text-sm text-center">{error || authError}</p>}

                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                    <Button
                      onClick={handleFinalSignup}
                      disabled={!voiceBlob || isLoading}
                      className="flex-1"
                    >
                      {isLoading ? "Creating Account..." : "Complete Signup"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Success */}
              {step === 3 && (
                <div className="flex flex-col items-center gap-6 py-8">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold">Verify your email</h3>
                    <p className="text-muted-foreground">
                      We've sent a verification link to <span className="font-medium text-foreground">{email}</span>.
                      Please check your inbox to activate your account.
                    </p>
                  </div>
                  <Button onClick={() => navigate('/login')} className="w-full">
                    Go to Login
                  </Button>
                </div>
              )}

            </div>
            <div className="bg-muted relative hidden md:block">
              <img
                src={Bitcoin}
                alt="Image"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              />
            </div>
          </CardContent>
        </Card>
        <FieldDescription className="px-6 text-center">
          By clicking continue, you agree to our <a href="#" className="hover:underline">Terms of Service</a>{" "}
          and <a href="#" className="hover:underline">Privacy Policy</a>.
        </FieldDescription>
      </div>
    </div>
  );
};

export default Signup;
