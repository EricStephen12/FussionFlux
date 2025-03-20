'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Copy, RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { generateCronApiKey } from '@/utils/security';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function CronKeysPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!authLoading && user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists() && userDoc.data()?.role === 'admin') {
            setIsAdmin(true);
            await loadApiKey();
          } else {
            router.push('/dashboard');
          }
        } catch (err) {
          console.error('Error checking admin status:', err);
          setError('Failed to verify admin permissions');
        } finally {
          setLoading(false);
        }
      } else if (!authLoading && !user) {
        router.push('/auth/login');
      }
    };

    checkAdmin();
  }, [user, authLoading, router]);

  // Load existing API key if available
  const loadApiKey = async () => {
    try {
      const apiKeyDoc = await getDoc(doc(db, 'system_settings', 'cron_api_key'));
      
      if (apiKeyDoc.exists()) {
        setApiKey(apiKeyDoc.data().key);
        setLastGenerated(
          apiKeyDoc.data().generatedAt?.toDate 
            ? apiKeyDoc.data().generatedAt.toDate().toLocaleString() 
            : 'Unknown date'
        );
      }
    } catch (err) {
      console.error('Error loading API key:', err);
      setError('Failed to load existing API key');
    }
  };

  // Generate a new API key
  const handleGenerateKey = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      // Generate a new key
      const newKey = generateCronApiKey();
      
      // Save to Firestore
      await setDoc(doc(db, 'system_settings', 'cron_api_key'), {
        key: newKey,
        generatedAt: serverTimestamp(),
        generatedBy: user?.uid
      });
      
      // Update state
      setApiKey(newKey);
      setLastGenerated('Just now');
      
      // Log the action
      await setDoc(doc(db, 'system_logs', `cron_key_${Date.now()}`), {
        action: 'generate_cron_key',
        timestamp: serverTimestamp(),
        userId: user?.uid
      });
      
      setGenerating(false);
    } catch (err) {
      console.error('Error generating API key:', err);
      setError('Failed to generate and save new API key');
      setGenerating(false);
    }
  };

  // Copy API key to clipboard
  const handleCopyKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Cron API Key Management</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API Key for Cron Jobs</CardTitle>
          <CardDescription>
            This key is used to authenticate scheduled tasks. Keep it secure and don't share it.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="api-key">Current API Key</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="api-key"
                value={apiKey || 'No key generated yet'}
                readOnly
                className="font-mono"
                type="password"
              />
              
              <Button 
                variant="outline" 
                onClick={handleCopyKey}
                disabled={!apiKey}
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            {lastGenerated && (
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <Clock className="h-3 w-3 mr-1" /> Last generated: {lastGenerated}
              </p>
            )}
          </div>
        </CardContent>
        
        <CardFooter>
          <Button
            onClick={handleGenerateKey}
            disabled={generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate New Key
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>How to Use the Cron API Key</CardTitle>
          <CardDescription>
            Set up your cron jobs with the API key for authentication
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Add the key to your environment variables</h3>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm">
              CRON_API_KEY=your_api_key_here
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Call the API endpoint with the key</h3>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm overflow-auto">
              # Method 1: Using a header<br />
              curl -H "x-api-key: your_api_key_here" https://yourdomain.com/api/cron/fetchLeads
              <br /><br />
              # Method 2: Using a query parameter<br />
              curl https://yourdomain.com/api/cron/fetchLeads?key=your_api_key_here
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Setup in crontab</h3>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm overflow-auto">
              # Run every day at 2 AM<br />
              0 2 * * * curl -H "x-api-key: your_api_key_here" https://yourdomain.com/api/cron/fetchLeads
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 