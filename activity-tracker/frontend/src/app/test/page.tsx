'use client';

import { useState } from 'react';

export default function TestPage() {
  const [results, setResults] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    setLoading(true);
    setResults('Testing backend...');

    try {
      const response = await fetch('https://pactivities-backend-abdygcfedtfdavfh.canadacentral-01.azurewebsites.net/health');
      const data = await response.json();
      setResults(`✅ Backend Health Check Successful\n${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setResults(`❌ Backend Health Check Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDatabase = async () => {
    setLoading(true);
    setResults('Testing database connection...');

    try {
      const response = await fetch('https://pactivities-backend-abdygcfedtfdavfh.canadacentral-01.azurewebsites.net/db-connect');
      const data = await response.json();
      setResults(`${data.status === 'success' ? '✅' : '❌'} Database Test Result\n${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setResults(`❌ Database Test Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🎉 PActivities Frontend Test Page
        </h1>

        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          ✅ Frontend deployment is working!
        </div>

        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
          📅 Deployed: {new Date().toLocaleString()}
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Backend Connection Test</h2>

        <div className="space-x-4 mb-6">
          <button
            onClick={testBackend}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Backend Health'}
          </button>

          <button
            onClick={testDatabase}
            disabled={loading}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Database Connection'}
          </button>
        </div>

        {results && (
          <div className="bg-gray-100 border border-gray-300 rounded p-4 mb-6">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <pre className="whitespace-pre-wrap text-sm">{results}</pre>
          </div>
        )}

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Application Links</h2>
        <div className="space-x-4 mb-6">
          <a href="/" className="text-blue-600 hover:text-blue-800">🏠 Home Page</a>
          <a href="/login" className="text-blue-600 hover:text-blue-800">🔐 Login</a>
          <a href="/setup" className="text-blue-600 hover:text-blue-800">⚙️ Setup</a>
          <a href="/dashboard" className="text-blue-600 hover:text-blue-800">📊 Dashboard</a>
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Deployment Information</h2>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          ⚠️ Backend: Minimal mode (TypeORM disabled due to startup issues)
        </div>
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          🔗 Backend URL: https://pactivities-backend-abdygcfedtfdavfh.canadacentral-01.azurewebsites.net
        </div>
      </div>
    </div>
  );
}
