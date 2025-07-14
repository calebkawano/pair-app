'use client';

import { createClient } from "@/lib/supabase/client";
import { createFoodRequestsTable, ensureDatabaseSetup } from "@/lib/supabase/setup";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { useState } from "react";

interface TestResult {
  test: string;
  status: 'success' | 'error';
  data?: unknown;
  error?: {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
    full: string;
  };
}

interface DatabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export default function DebugPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const runTest = async (testName: string, testFn: () => Promise<unknown>) => {
    setLoading(true);
    try {
      const result = await testFn();
      setResults(prev => [...prev, { test: testName, status: 'success', data: result }]);
    } catch (error) {
      const dbError = error as DatabaseError;
      setResults(prev => [...prev, { 
        test: testName, 
        status: 'error', 
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          details: dbError.details,
          hint: dbError.hint,
          code: dbError.code,
          full: JSON.stringify(error, null, 2)
        }
      }]);
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseSetup = () => runTest('Database Setup Check', async () => {
    return await ensureDatabaseSetup();
  });

  const showSetupInstructions = () => runTest('Setup Instructions', async () => {
    return await createFoodRequestsTable();
  });

  const testAuth = () => runTest('Auth Test', async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user: user ? { id: user.id, email: user.email } : null };
  });

  const testHouseholdsTable = () => runTest('Households Table', async () => {
    const { data, error } = await supabase
      .from('households')
      .select('*')
      .limit(1);
    if (error) throw error;
    return { count: data?.length || 0, sample: data?.[0] };
  });

  const testFoodRequestsTable = () => runTest('Food Requests Table', async () => {
    const { data, error } = await supabase
      .from('food_requests')
      .select('*')
      .limit(1);
    if (error) throw error;
    return { count: data?.length || 0, sample: data?.[0] };
  });

  const testHouseholdMembers = () => runTest('Household Members', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('household_members')
      .select('*')
      .eq('user_id', user.id);
    if (error) throw error;
    return { count: data?.length || 0, memberships: data };
  });

  const testRLSPolicies = () => runTest('RLS Policies Check', async () => {
    // Try to access tables with current user context
    const tests = [];
    
    // Test households access
    try {
      const { error } = await supabase.from('households').select('count(*)', { count: 'exact', head: true });
      tests.push({ table: 'households', accessible: !error, error: error?.message });
    } catch (e) {
      tests.push({ table: 'households', accessible: false, error: (e as Error).message });
    }

    // Test food_requests access
    try {
      const { error } = await supabase.from('food_requests').select('count(*)', { count: 'exact', head: true });
      tests.push({ table: 'food_requests', accessible: !error, error: error?.message });
    } catch (e) {
      tests.push({ table: 'food_requests', accessible: false, error: (e as Error).message });
    }

    return tests;
  });

  const clearResults = () => setResults([]);

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Database Debug Page</h1>
        <p className="text-muted-foreground mb-6">
          This page helps debug database connectivity and permissions issues.
        </p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Button onClick={testDatabaseSetup} disabled={loading} variant="default">
          Check Database Setup
        </Button>
        <Button onClick={showSetupInstructions} disabled={loading} variant="secondary">
          Show Setup SQL
        </Button>
        <Button onClick={testAuth} disabled={loading}>
          Test Auth
        </Button>
        <Button onClick={testHouseholdsTable} disabled={loading}>
          Test Households Table
        </Button>
        <Button onClick={testFoodRequestsTable} disabled={loading}>
          Test Food Requests Table
        </Button>
        <Button onClick={testHouseholdMembers} disabled={loading}>
          Test Household Members
        </Button>
        <Button onClick={testRLSPolicies} disabled={loading}>
          Test RLS Policies
        </Button>
        <Button onClick={clearResults} variant="outline">
          Clear Results
        </Button>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{result.test}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  result.status === 'success' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.status}
                </span>
              </div>
              
              {result.status === 'success' && (
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
              
              {result.status === 'error' && (
                <div className="space-y-2">
                  <p className="text-red-600 font-medium">Error: {result.error.message}</p>
                  {result.error.details && (
                    <p className="text-sm text-gray-600">Details: {result.error.details}</p>
                  )}
                  {result.error.hint && (
                    <p className="text-sm text-gray-600">Hint: {result.error.hint}</p>
                  )}
                  {result.error.code && (
                    <p className="text-sm text-gray-600">Code: {result.error.code}</p>
                  )}
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500">Full Error</summary>
                    <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto">
                      {result.error.full}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 