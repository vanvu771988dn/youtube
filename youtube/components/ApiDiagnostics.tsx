import React, { useState } from 'react';
import { runFullDiagnostics, getErrorSolutions, DiagnosticResult } from '../utils/apiDiagnostics';
import { config } from '../lib/config';

const ApiDiagnostics: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleRunTests = async () => {
    setTesting(true);
    setResults([]);
    
    try {
      const diagnosticResults = await runFullDiagnostics();
      setResults(diagnosticResults);
    } catch (error) {
      console.error('Diagnostics error:', error);
      setResults([{
        success: false,
        message: 'Failed to run diagnostics',
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setTesting(false);
    }
  };

  const hasErrors = results.some(r => !r.success);
  const allPassed = results.length > 0 && results.every(r => r.success);

  return (
    <div className="bg-slate-800 rounded-lg shadow-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🔍</span>
            <span>API Diagnostics</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Test YouTube API connectivity and configuration
          </p>
        </div>
        <button
          type="button"
          onClick={handleRunTests}
          disabled={testing}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 text-white px-4 py-2 rounded font-semibold transition"
        >
          {testing ? 'Testing...' : 'Run Tests'}
        </button>
      </div>

      {/* Current Configuration */}
      <div className="mb-4 p-3 bg-slate-900 rounded border border-slate-700">
        <div className="text-xs text-slate-400 mb-1">Configuration</div>
        <div className="text-sm text-slate-300">
          <div>API Key: {config.youtubeApiKey ? `${config.youtubeApiKey.substring(0, 10)}...` : '❌ Not configured'}</div>
          <div>Real Data Enabled: {config.features.useRealYouTubeData ? '✅ Yes' : '❌ No'}</div>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded border ${
                result.success 
                  ? 'bg-green-900/20 border-green-700' 
                  : 'bg-red-900/20 border-red-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className={`font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                    {result.message}
                  </div>
                  
                  {result.error && (
                    <div className="text-sm text-red-300 mt-1">
                      Error: {result.error}
                    </div>
                  )}

                  {result.details && showDetails && (
                    <pre className="text-xs text-slate-400 mt-2 p-2 bg-slate-950 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}

                  {/* Solutions */}
                  {!result.success && result.error && (
                    <div className="mt-3">
                      <div className="text-sm font-semibold text-yellow-400 mb-1">💡 Solutions:</div>
                      <ul className="text-sm text-slate-300 space-y-1">
                        {getErrorSolutions(result.error).map((solution, i) => (
                          <li key={i}>{solution}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className={`p-3 rounded text-center font-semibold ${
            allPassed 
              ? 'bg-green-900/30 text-green-400' 
              : hasErrors 
              ? 'bg-red-900/30 text-red-400'
              : 'bg-slate-900 text-slate-400'
          }`}>
            {allPassed && '✅ All tests passed! YouTube API is ready.'}
            {hasErrors && '❌ Some tests failed. Please fix the issues above.'}
          </div>

          {/* Toggle Details */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {results.length === 0 && !testing && (
        <div className="text-center text-slate-400 py-8">
          <p>Click "Run Tests" to check your YouTube API configuration</p>
        </div>
      )}
    </div>
  );
};

export default ApiDiagnostics;
