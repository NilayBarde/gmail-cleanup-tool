import React, { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import SenderDetails from './components/SenderDetails';
import { checkAuthStatus, fetchEmailIds, fetchEmailDetailsBatch } from './api';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedSender, setSelectedSender] = useState(null);

  // Lifted state for Dashboard persistence
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fetchedCount, setFetchedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);
  const stopFetchingRef = useRef(false);

  const handleStop = () => {
    stopFetchingRef.current = true;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const status = await checkAuthStatus();
    setIsAuthenticated(status);
  };

  const performAnalysis = (emails) => {
    const senderCounts = {};

    emails.forEach(email => {
      const senderEmail = email.sender_email ? email.sender_email.toLowerCase() : 'unknown';

      if (!senderCounts[senderEmail]) {
        senderCounts[senderEmail] = {
          name: email.sender,
          email: senderEmail,
          count: 0,
          example_subjects: [],
          ids: [],
          has_unsubscribe: !!email.unsubscribe_link,
          unsubscribe_link: email.unsubscribe_link
        };
      }

      // Update stats
      senderCounts[senderEmail].count += 1;
      senderCounts[senderEmail].ids.push(email.id);
      if (email.unsubscribe_link && !senderCounts[senderEmail].unsubscribe_link) {
        senderCounts[senderEmail].unsubscribe_link = email.unsubscribe_link;
        senderCounts[senderEmail].has_unsubscribe = true;
      }
      if (senderCounts[senderEmail].example_subjects.length < 3) {
        senderCounts[senderEmail].example_subjects.push(email.subject);
      }
    });

    // Convert to array and sort
    const sorted = Object.values(senderCounts).sort((a, b) => b.count - a.count);
    return { total_emails: emails.length, senders: sorted };
  };

  const loadDashboardData = async (limit = 1000, query = "") => {
    // If not loading and not data, or if force reload? 
    // Actually we want to allow reload.

    try {
      setLoading(true);
      setError(null);
      stopFetchingRef.current = false;

      // 1. Fetch IDs
      const { ids } = await fetchEmailIds(limit, query); // Fetch limited IDs with optional query

      if (stopFetchingRef.current) {
        setLoading(false);
        return;
      }

      setTotalCount(ids.length);

      if (ids.length === 0) {
        setDashboardData({ total_emails: 0, senders: [] });
        setLoading(false);
        return;
      }

      // 2. Fetch details in chunks
      const chunkSize = 20;
      let allEmails = [];

      for (let i = 0; i < ids.length; i += chunkSize) {
        if (stopFetchingRef.current) {
          break;
        }
        const chunkIds = ids.slice(i, i + chunkSize);
        const chunkDetails = await fetchEmailDetailsBatch(chunkIds);

        allEmails = [...allEmails, ...chunkDetails];

        // Update progress
        const currentCount = Math.min(i + chunkSize, ids.length);
        setFetchedCount(currentCount);
        setProgress(Math.round((currentCount / ids.length) * 100));

        // Incremental UI update (optional, but good for "seeing results")
        // We can update the dashboardData periodically or just at the end.
        // Updating at every chunk might be too heavy for the graph re-render if 10k items.
        // Let's update every 100 items (5 chunks) to balance responsiveness and performance.
        if (i % 100 === 0 || i + chunkSize >= ids.length) {
          const incrementalAnalysis = performAnalysis(allEmails);
          setDashboardData(incrementalAnalysis);
        }
      }

      // Final robust update
      const finalAnalysis = performAnalysis(allEmails);
      setDashboardData(finalAnalysis);

    } catch (err) {
      console.error(err);
      setError("Failed to load email data. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleSenderDeleted = (senderEmail) => {
    setDashboardData(prevData => {
      if (!prevData) return null;
      const newSenders = prevData.senders.filter(s => s.email !== senderEmail);
      return {
        ...prevData,
        senders: newSenders,
        total_emails: prevData.total_emails - (prevData.senders.find(s => s.email === senderEmail)?.count || 0)
      };
    });
    setSelectedSender(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Gmail Cleanup Tool
          </h1>
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <span className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4 mr-1" /> Connected
              </span>
            ) : (
              <span className="flex items-center text-amber-600 text-sm font-medium bg-amber-50 px-3 py-1 rounded-full">
                <AlertTriangle className="w-4 h-4 mr-1" /> Not Connected
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {!isAuthenticated && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  Backend not connected. Please run <code className="bg-amber-100 px-1 rounded">uvicorn main:app --reload</code> in the backend folder and ensure you have authenticated.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedSender ? (
          <SenderDetails
            sender={selectedSender}
            onBack={() => setSelectedSender(null)}
            onDelete={() => handleSenderDeleted(selectedSender.email)}
          />
        ) : (
          <Dashboard
            onSelectSender={setSelectedSender}
            data={dashboardData}
            loading={loading}
            progress={progress}
            fetchedCount={fetchedCount}
            totalCount={totalCount}
            error={error}
            onLoadData={loadDashboardData}
            onStop={handleStop}
          />
        )}
      </main>
    </div>
  );
}

export default App;
