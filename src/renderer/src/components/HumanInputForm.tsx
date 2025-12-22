import React, { useState, useEffect } from 'react';

const HumanInputPrompt = ({ eventSource, baseUrl = 'http://localhost:8080' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [interactionId, setInteractionId] = useState(null);
    const [response, setResponse] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!eventSource) return;

        const handleMessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'HUMAN_INPUT_REQUIRED') {
                    setQuestion(data.data.question);
                    setInteractionId(data.data.interaction_id);
                    setIsOpen(true);
                }
            } catch (e) {
                // Ignore parsing errors for non-JSON messages
            }
        };

        eventSource.addEventListener('message', handleMessage);

        return () => {
            eventSource.removeEventListener('message', handleMessage);
        };
    }, [eventSource]);

    const handleSubmit = async () => {
        if (!response.trim()) return;

        setIsSubmitting(true);
        try {
            await fetch(`${baseUrl}/llm/submit-input`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    interaction_id: interactionId,
                    response: response,
                }),
            });
            setIsOpen(false);
            setResponse('');
            setInteractionId(null);
        } catch (error) {
            console.error('Failed to submit input:', error);
            alert('Failed to submit response. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Input Required</h3>
                <p className="mb-4 text-gray-700 dark:text-gray-300">{question}</p>

                <input
                    type="text"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Type your response..."
                    autoFocus
                />

                <div className="flex justify-end space-x-2">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Sending...' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HumanInputPrompt;
