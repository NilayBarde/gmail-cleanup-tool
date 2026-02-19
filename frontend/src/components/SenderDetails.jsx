import React, { useState } from 'react';
import { deleteEmails, unsubscribe } from '../api';
import { Trash2, Ban, Mail, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';

const SenderDetails = ({ sender, onBack, onDelete }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUnsubscribing, setIsUnsubscribing] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState(null);
    const [unsubscribeMessage, setUnsubscribeMessage] = useState(null);

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${sender.count} emails from ${sender.name}? This cannot be undone.`)) return;

        setIsDeleting(true);
        setDeleteMessage(null);
        try {
            await deleteEmails(sender.ids);
            setDeleteMessage({ type: 'success', text: `Deleted ${sender.count} emails.` });

            // Wait a moment so user sees success, then remove from list
            setTimeout(() => {
                if (onDelete) onDelete();
            }, 1000);
        } catch (err) {
            console.error(err);
            setDeleteMessage({ type: 'error', text: 'Failed to delete emails. Please try again.' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUnsubscribe = async (link) => {
        setIsUnsubscribing(true);
        setUnsubscribeMessage(null);
        try {
            const result = await unsubscribe(link);
            if (result.success) {
                if (result.method === 'url') {
                    window.open(result.link, '_blank');
                    setUnsubscribeMessage({ type: 'info', text: 'Opened unsubscribe page in new tab.' });
                } else {
                    setUnsubscribeMessage({ type: 'success', text: 'Unsubscribe request sent successfully!' });
                }
            } else {
                setUnsubscribeMessage({ type: 'error', text: `Failed: ${result.error}` });
            }
        } catch (err) {
            setUnsubscribeMessage({ type: 'error', text: 'Failed to unsubscribe.' });
        } finally {
            setIsUnsubscribing(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-700 mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </button>

            <div className="flex items-start justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{sender.name}</h2>
                    <div className="flex items-center text-gray-500 mt-1">
                        <Mail className="w-4 h-4 mr-2" />
                        {sender.email}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">{sender.count}</div>
                    <div className="text-sm text-gray-500">emails found</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Unsubscribe Section */}
                <div className="p-5 border border-gray-200 bg-gray-50 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                        <Ban className="w-5 h-5 mr-2" /> Unsubscribe
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 h-10">
                        Attempt to unsubscribe from future emails.
                    </p>

                    {sender.unsubscribe_link ? (
                        <button
                            onClick={() => handleUnsubscribe(sender.unsubscribe_link)}
                            disabled={isUnsubscribing}
                            className="w-full py-2.5 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 transition-colors font-medium flex justify-center items-center"
                        >
                            {isUnsubscribing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...
                                </>
                            ) : 'Unsubscribe'}
                        </button>
                    ) : (
                        <div className="w-full py-2.5 px-4 bg-gray-200 text-gray-500 rounded-lg text-center text-sm font-medium cursor-not-allowed">
                            No unsubscribe link found
                        </div>
                    )}

                    {unsubscribeMessage && (
                        <div className={`mt-3 text-sm p-2 rounded ${unsubscribeMessage.type === 'success' ? 'bg-green-100 text-green-800' :
                                unsubscribeMessage.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                            {unsubscribeMessage.text}
                        </div>
                    )}
                </div>

                {/* Delete Section */}
                <div className="p-5 border border-red-100 bg-red-50 rounded-xl">
                    <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center">
                        <Trash2 className="w-5 h-5 mr-2" /> Clean Up
                    </h3>
                    <p className="text-sm text-red-600 mb-4 h-10">
                        Permanently delete all {sender.count} emails from this sender.
                    </p>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting || deleteMessage?.type === 'success'}
                        className="w-full py-2.5 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium flex justify-center items-center"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Deleting...
                            </>
                        ) : deleteMessage?.type === 'success' ? 'Deleted' : 'Delete All Emails'}
                    </button>

                    {deleteMessage && (
                        <div className={`mt-3 text-sm p-2 rounded ${deleteMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {deleteMessage.text}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="font-semibold text-gray-700 mb-3">Subject Lines Preview</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 bg-gray-50 p-4 rounded-lg">
                    {sender.example_subjects.map((subj, i) => (
                        <li key={i} className="truncate">{subj}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SenderDetails;
