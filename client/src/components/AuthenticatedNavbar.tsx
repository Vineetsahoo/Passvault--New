import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Settings, BarChart3, Lock, User } from 'lucide-react';
import { Wallet } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface UserData {
  name?: string;
  username?: string;
  email?: string;
}

const AuthenticatedNavbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState<UserData>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    setIsAuthenticated(authStatus);
    
    // Try all possible user data sources
    const userDataString = localStorage.getItem('userData') || 
                           localStorage.getItem('mockUser');
    if (userDataString) {
      try {
        const parsedData = JSON.parse(userDataString);
        setUserData(parsedData);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const handleLogout = async () => {
    // supabase.auth.signOut() ends the real session (so it can't silently
    // come back via auto-refresh) and triggers the onAuthStateChange
    // listener in supabaseClient.ts, which clears the compatibility
    // localStorage keys (token, userData, isAuthenticated, mockAuth,
    // mockUser, userToken) for us.
    await supabase.auth.signOut();
    navigate('/signin', { replace: true });
  };

  const displayName = userData.name || userData.username || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignIn = () => {
    navigate('/signin');
  };

  return (
    <nav className="fixed w-full z-50 bg-[#F9F9F7] border-b-2 border-[#111111]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-3 hover:bg-[#E5E5E0] px-3 py-2 transition-colors">
              <div className="border border-[#111111] p-2">
                <Wallet className="h-6 w-6 text-[#111111]" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  PASSVAULT
                </span>
                <span className="text-[0.65rem] uppercase tracking-widest font-mono text-[#525252]">
                  DASHBOARD
                </span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:gap-0">
            {isAuthenticated && (
              <>
                <Link to="/dashboard" className="px-4 py-2.5 text-xs font-bold tracking-widest uppercase text-[#111111] border-r border-[#111111] hover:bg-[#E5E5E0] transition-all flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Dashboard
                </Link>
                <Link to="/dashboard/passwords" className="px-4 py-2.5 text-xs font-bold tracking-widest uppercase text-[#111111] border-r border-[#111111] hover:bg-[#E5E5E0] transition-all flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Passwords
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold tracking-widest uppercase border-l border-[#111111] hover:bg-[#E5E5E0] transition-all"
                >
                  <div className="w-8 h-8 border border-[#111111] flex items-center justify-center text-[#111111] font-black">
                    {initial}
                  </div>
                  <span className="hidden md:inline text-[#111111]">{displayName}</span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-0 w-56 bg-[#F9F9F7] border-2 border-[#111111] shadow-lg z-50">
                    <div className="px-4 py-4 border-b-2 border-[#111111]">
                      <p className="text-xs font-black uppercase tracking-widest text-[#111111]">{displayName}</p>
                      <p className="text-xs text-[#525252] truncate mt-1" style={{ fontFamily: "'Lora', serif" }}>{userData.email}</p>
                    </div>
                    
                    <Link to="/dashboard" className="flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-widest uppercase text-[#111111] hover:bg-[#E5E5E0] border-b border-[#E5E5E0] transition-colors">
                      <BarChart3 className="h-4 w-4" /> Dashboard
                    </Link>
                    <Link to="/dashboard/user-profile" className="flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-widest uppercase text-[#111111] hover:bg-[#E5E5E0] border-b border-[#E5E5E0] transition-colors">
                      <User className="h-4 w-4" /> Profile
                    </Link>
                    <Link to="/dashboard/settings" className="flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-widest uppercase text-[#111111] hover:bg-[#E5E5E0] border-b border-[#E5E5E0] transition-colors">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-xs font-bold tracking-widest uppercase text-[#CC0000] hover:bg-[#FFE5E5] transition-colors flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="px-6 py-2.5 border-2 border-[#111111] text-[#111111] font-bold uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all flex items-center gap-2"
              >
                SIGN IN
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AuthenticatedNavbar;
