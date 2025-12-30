'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { FaBug, FaUserSlash, FaCommentSlash, FaTrashAlt, FaTimes, FaRedo, FaUsers, FaRobot, FaMars, FaVenus, FaCrown } from 'react-icons/fa';

const API_URL = typeof window !== 'undefined' 
  ? `${window.location.protocol}//${window.location.hostname}:5000/api`
  : 'http://localhost:5000/api';

interface ActionResult {
  success: boolean;
  message: string;
}

export default function AdminDebugMenu() {
  const { user } = useUser();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only show on localhost
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || 
                          hostname === '127.0.0.1' || 
                          hostname.startsWith('192.168.') ||
                          hostname.startsWith('10.') ||
                          hostname.endsWith('.local');
      setIsVisible(isLocalhost);
    }
  }, []);

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = async (action: string, endpoint: string, method: string = 'DELETE') => {
    if (!confirm(`Are you sure you want to ${action}? This cannot be undone.`)) {
      return;
    }

    setLoading(endpoint);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/admin/${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);

      // Auto-hide result after 3 seconds
      setTimeout(() => setResult(null), 3000);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to connect to server',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleResetOnboarding = async () => {
    if (!user) {
      setResult({
        success: false,
        message: 'You must be logged in to reset onboarding',
      });
      return;
    }

    if (!confirm('Are you sure you want to reset your onboarding? Your profile will be deleted and you will need to complete onboarding again.')) {
      return;
    }

    setLoading('reset-onboarding');
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/admin/reset-onboarding/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Clear any cached onboarding state
        localStorage.removeItem('onboarding_state');
        
        // Redirect to onboarding after a brief delay
        setTimeout(() => {
          router.push('/onboarding');
        }, 1500);
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to connect to server',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateAIProfile = async (gender: 'male' | 'female') => {
    setShowAIMenu(false);
    setLoading(`generate-ai-${gender}`);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/admin/generate-ai-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gender }),
      });

      const data = await response.json();
      setResult(data);

      // Keep result visible longer for AI generation
      setTimeout(() => setResult(null), 5000);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to connect to server',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleTogglePremium = async () => {
    if (!user) {
      setResult({
        success: false,
        message: 'You must be logged in to toggle premium',
      });
      return;
    }

    setLoading('toggle-premium');
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/admin/toggle-premium/${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setIsPremium(data.isPremium);
      }

      setTimeout(() => setResult(null), 3000);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to connect to server',
      });
    } finally {
      setLoading(null);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
      {/* Result Toast */}
      {result && (
        <div
          className={`absolute bottom-20 right-0 w-72 p-3 rounded-lg shadow-lg text-sm ${
            result.success
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {result.message}
        </div>
      )}

      {/* Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-64 bg-gray-900 rounded-lg shadow-2xl border border-gray-700 overflow-hidden mb-2">
          <div className="p-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
            <span className="text-white font-semibold text-sm flex items-center gap-2">
              <FaBug className="text-yellow-400" />
              Debug Menu
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes size={14} />
            </button>
          </div>

          <div className="p-2">
            <button
              onClick={() => handleAction('reset all user connections', 'reset-connections')}
              disabled={loading !== null}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
            >
              <FaUserSlash className="text-orange-400" />
              <div>
                <div className="font-medium">Reset Connections</div>
                <div className="text-xs text-gray-400">Matches, likes, visits</div>
              </div>
              {loading === 'reset-connections' && (
                <div className="ml-auto animate-spin w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full" />
              )}
            </button>

            <button
              onClick={() => handleAction('reset all messages', 'reset-messages')}
              disabled={loading !== null}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
            >
              <FaCommentSlash className="text-blue-400" />
              <div>
                <div className="font-medium">Reset Messages</div>
                <div className="text-xs text-gray-400">Delete all messages</div>
              </div>
              {loading === 'reset-messages' && (
                <div className="ml-auto animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
              )}
            </button>

            <button
              onClick={handleResetOnboarding}
              disabled={loading !== null}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
            >
              <FaRedo className="text-purple-400" />
              <div>
                <div className="font-medium">Reset Onboarding</div>
                <div className="text-xs text-gray-400">Delete profile & restart</div>
              </div>
              {loading === 'reset-onboarding' && (
                <div className="ml-auto animate-spin w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full" />
              )}
            </button>

            <button
              onClick={() => handleAction('reset seed profiles', 'reset-seed', 'POST')}
              disabled={loading !== null}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
            >
              <FaUsers className="text-green-400" />
              <div>
                <div className="font-medium">Reset Seed Profiles</div>
                <div className="text-xs text-gray-400">Delete test profiles</div>
              </div>
              {loading === 'reset-seed' && (
                <div className="ml-auto animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full" />
              )}
            </button>

            {/* AI Profile Generation */}
            <div className="relative">
              <button
                onClick={() => setShowAIMenu(!showAIMenu)}
                disabled={loading !== null}
                className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
              >
                <FaRobot className="text-cyan-400" />
                <div>
                  <div className="font-medium">Generate AI Profile</div>
                  <div className="text-xs text-gray-400">OpenAI + Novita Flux</div>
                </div>
                {(loading === 'generate-ai-male' || loading === 'generate-ai-female') && (
                  <div className="ml-auto animate-spin w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full" />
                )}
              </button>
              
              {showAIMenu && !loading && (
                <div className="absolute left-0 right-0 mt-1 bg-gray-800 rounded-md border border-gray-600 overflow-hidden z-10">
                  <button
                    onClick={() => handleGenerateAIProfile('male')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                  >
                    <FaMars className="text-blue-400" />
                    Generate Male Profile
                  </button>
                  <button
                    onClick={() => handleGenerateAIProfile('female')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                  >
                    <FaVenus className="text-pink-400" />
                    Generate Female Profile
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleTogglePremium}
              disabled={loading !== null}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
            >
              <FaCrown className="text-yellow-400" />
              <div>
                <div className="font-medium">Toggle Premium</div>
                <div className="text-xs text-gray-400">
                  {isPremium === null ? 'Activate/deactivate' : isPremium ? 'Currently: Premium ✨' : 'Currently: Free'}
                </div>
              </div>
              {loading === 'toggle-premium' && (
                <div className="ml-auto animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full" />
              )}
            </button>

            <div className="my-1 border-t border-gray-700" />

            <button
              onClick={() => handleAction('reset everything (connections + messages)', 'reset-all')}
              disabled={loading !== null}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/30 rounded-md transition-colors disabled:opacity-50"
            >
              <FaTrashAlt className="text-red-400" />
              <div>
                <div className="font-medium">Reset Everything</div>
                <div className="text-xs text-red-300/70">Connections + Messages</div>
              </div>
              {loading === 'reset-all' && (
                <div className="ml-auto animate-spin w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full" />
              )}
            </button>
          </div>

          <div className="p-2 bg-gray-800/50 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">
              ⚠️ Debug only - localhost
            </p>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-red-500 hover:bg-red-600 rotate-180'
            : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
        }`}
      >
        <FaBug className="text-white text-xl" />
      </button>
    </div>
  );
}
