import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function DiagnosticPanel() {
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      const results: any = {
        timestamp: new Date().toISOString(),
        environment: {},
        supabase: {},
        network: {}
      };

      // Check environment variables
      results.environment = {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'MISSING',
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING',
        VITE_TMDB_API_KEY: import.meta.env.VITE_TMDB_API_KEY ? 'EXISTS' : 'MISSING',
        NODE_ENV: import.meta.env.NODE_ENV || 'unknown',
        MODE: import.meta.env.MODE || 'unknown'
      };

      // Test Supabase connection
      try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        results.supabase = {
          connection: error ? 'FAILED' : 'SUCCESS',
          error: error?.message || null,
          response: data ? 'DATA_RECEIVED' : 'NO_DATA'
        };
      } catch (err) {
        results.supabase = {
          connection: 'FAILED',
          error: err instanceof Error ? err.message : 'Unknown error',
          response: 'EXCEPTION'
        };
      }

      // Test auth endpoint
      try {
        const { data, error } = await supabase.auth.getSession();
        results.auth = {
          sessionCheck: error ? 'FAILED' : 'SUCCESS',
          error: error?.message || null,
          hasSession: !!data.session
        };
      } catch (err) {
        results.auth = {
          sessionCheck: 'FAILED',
          error: err instanceof Error ? err.message : 'Unknown error',
          hasSession: false
        };
      }

      // Network info
      results.network = {
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        url: window.location.href,
        protocol: window.location.protocol
      };

      setDiagnostics(results);
      setLoading(false);
    };

    runDiagnostics();
  }, []);

  if (loading) {
    return <div className="p-4 bg-gray-100 rounded">Running diagnostics...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded max-w-4xl mx-auto">
      <h3 className="text-lg font-bold mb-4">🔍 Deployment Diagnostics</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-green-600">✅ Environment Variables</h4>
          <pre className="bg-white p-2 rounded text-sm overflow-x-auto">
            {JSON.stringify(diagnostics.environment, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className={`font-semibold ${diagnostics.supabase.connection === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
            {diagnostics.supabase.connection === 'SUCCESS' ? '✅' : '❌'} Supabase Database
          </h4>
          <pre className="bg-white p-2 rounded text-sm overflow-x-auto">
            {JSON.stringify(diagnostics.supabase, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className={`font-semibold ${diagnostics.auth.sessionCheck === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
            {diagnostics.auth.sessionCheck === 'SUCCESS' ? '✅' : '❌'} Authentication
          </h4>
          <pre className="bg-white p-2 rounded text-sm overflow-x-auto">
            {JSON.stringify(diagnostics.auth, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold text-blue-600">🌐 Network Info</h4>
          <pre className="bg-white p-2 rounded text-sm overflow-x-auto">
            {JSON.stringify(diagnostics.network, null, 2)}
          </pre>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-100 rounded">
        <p className="text-sm">
          <strong>Next Steps:</strong>
          <br />
          1. If environment variables are MISSING → Set them in Vercel Dashboard
          <br />
          2. If Supabase connection FAILED → Check URL and run database setup script
          <br />
          3. If everything looks good → The issue might be in the database setup
        </p>
      </div>
    </div>
  );
}