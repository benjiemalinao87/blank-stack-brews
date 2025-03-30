import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { workspaceService } from '../services/workspace';

const WorkspaceTest = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check session on component mount
    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        console.log('No active session found in WorkspaceTest');
        navigate('/login', { state: { from: '/test-workspace' }, replace: true });
        return;
      }
      setSession(currentSession);
      runTests(currentSession);
    };

    checkSession();
  }, [navigate]);

  const addLog = (message, data = null) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    }]);
  };

  const runTests = async (currentSession) => {
    try {
      if (!currentSession?.user) {
        throw new Error('No authenticated user found');
      }

      addLog('Starting tests with user:', currentSession.user);

      // 1. Get user's workspaces
      const workspaces = await workspaceService.getUserWorkspaces();
      addLog('User workspaces:', workspaces);

      // 2. Create a new workspace
      const newWorkspace = await workspaceService.createWorkspace('Test Workspace ' + new Date().toISOString());
      addLog('Created new workspace:', newWorkspace);

      // 3. Get workspace members
      const members = await workspaceService.getWorkspaceMembers(newWorkspace.id);
      addLog('Workspace members:', members);

      // 4. Create an invitation
      const invite = await workspaceService.inviteToWorkspace(newWorkspace.id, 'test@example.com', 'agent');
      addLog('Created invitation:', invite);

      // 5. Get pending invites
      const invites = await workspaceService.getWorkspaceInvites(newWorkspace.id);
      addLog('Pending invites:', invites);

      addLog('All tests completed successfully!');
    } catch (error) {
      console.error('Test error:', error);
      addLog('Test failed:', error);
      
      if (error.message?.includes('auth') || error.message?.includes('authenticated')) {
        navigate('/login', { state: { from: '/test-workspace' }, replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Workspace Functionality Test</h1>
      
      {loading && (
        <div className="flex items-center gap-2 mb-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span>Running tests...</span>
        </div>
      )}

      <div className="space-y-4">
        {logs.map((log, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-500 text-sm">{log.timestamp}</span>
              <span className="font-medium">{log.message}</span>
            </div>
            {log.data && (
              <pre className="bg-white p-2 rounded border text-sm overflow-auto">
                {log.data}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkspaceTest; 