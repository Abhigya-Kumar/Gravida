import { useState } from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { UserDashboard } from './components/user/UserDashboard';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [authState, setAuthState] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (email, password, role) => {
    // Mock authentication - in a real app, this would validate credentials
    const name = email.split('@')[0];
    const user = {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email,
      role
    };
    
    setCurrentUser(user);
    setAuthState('authenticated');
  };

  const handleSignup = (name, email, password, role) => {
    // Mock signup - in a real app, this would create a new account
    const user = {
      name,
      email,
      role
    };
    
    setCurrentUser(user);
    setAuthState('authenticated');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthState('login');
  };

  return (
    <>
      <div className="min-h-screen">
        {authState === 'login' && (
          <LoginPage
            onLogin={handleLogin}
            onSwitchToSignup={() => setAuthState('signup')}
          />
        )}

        {authState === 'signup' && (
          <SignupPage
            onSignup={handleSignup}
            onSwitchToLogin={() => setAuthState('login')}
          />
        )}

        {authState === 'authenticated' && currentUser && (
          <>
            {currentUser.role === 'user' ? (
              <UserDashboard
                userName={currentUser.name}
                onLogout={handleLogout}
              />
            ) : (
              <DoctorDashboard
                doctorName={currentUser.name}
                onLogout={handleLogout}
              />
            )}
          </>
        )}
      </div>
      <Toaster />
    </>
  );
}
