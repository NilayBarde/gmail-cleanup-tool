import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2 } from 'lucide-react';

const Dashboard = ({
    onSelectSender,
    data,
    loading,
    progress,
    fetchedCount,
    totalCount,
    error,
    onLoadData,
    onStop
}) => {
    const [fetchLimit, setFetchLimit] = useState(1000);
    const [fetchAll, setFetchAll] = useState(false);

    const handleStartAnalysis = () => {
        const limit = fetchAll ? 0 : fetchLimit;
        onLoadData(limit);
    };

    if (loading && (!data || data.total_emails === 0)) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Analyzing your inbox...</h3>
                <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <p className="mt-2 text-sm text-gray-500 mb-4">
                    Fetched {fetchedCount} of {totalCount} emails ({progress}%)
                </p>
                <button
                    onClick={onStop}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm font-medium"
                >
                    Stop and Show Results
                </button>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 p-4 bg-red-50 rounded-md">{error}</div>;
    }

    const topSenders = data?.senders.slice(0, 10) || [];

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold">Top Email Senders</h2>

                {/* Analysis Controls */}
                {!loading && (
                    <div className="flex items-center space-x-4 bg-gray-50 p-2 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-600">Analyze:</label>
                            <input
                                type="number"
                                value={fetchLimit}
                                onChange={(e) => setFetchLimit(Number(e.target.value))}
                                disabled={fetchAll}
                                className="w-20 px-2 py-1 border rounded text-sm disabled:opacity-50"
                            />
                            <span className="text-sm text-gray-600">emails</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="fetchAll"
                                checked={fetchAll}
                                onChange={(e) => setFetchAll(e.target.checked)}
                                className="rounded text-blue-600"
                            />
                            <label htmlFor="fetchAll" className="text-sm text-gray-600 select-none">Fetch All</label>
                        </div>
                        <button
                            onClick={handleStartAnalysis}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                        >
                            {data ? "Refresh Analysis" : "Start Analysis"}
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="flex items-center text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Fetching more... ({progress}%)
                        <button
                            onClick={onStop}
                            className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-xs font-medium"
                        >
                            Stop
                        </button>
                    </div>
                )}
            </div>

            <div className="h-64 sticky top-0 bg-white z-10" style={{ minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topSenders} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} onClick={(data) => onSelectSender(data)}>
                            {topSenders.map((entry, index) => (
                                <Cell key={`cell-${index}`} cursor="pointer" fill={index < 3 ? '#ef4444' : '#3b82f6'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
                Click on a bar to manage emails from that sender.
            </p>
            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">All Senders</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {(data?.senders || []).map((sender) => (
                                <tr key={sender.email} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {sender.name} <br />
                                        <span className="text-gray-400 text-xs">{sender.email}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {sender.count}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 cursor-pointer hover:underline" onClick={() => onSelectSender(sender)}>
                                        Manage
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
