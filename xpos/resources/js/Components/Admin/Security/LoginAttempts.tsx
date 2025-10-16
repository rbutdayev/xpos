import React, { memo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import SettingsCard from '../SettingsCard';

interface LoginAttempt {
    id: number;
    email: string;
    ip_address: string;
    success: boolean;
    user_agent?: string;
    attempted_at: string;
}

interface LoginAttemptsProps {
    attempts: LoginAttempt[];
    onBlockIP: (ip: string) => void;
}

const LoginAttempts = memo(({ attempts, onBlockIP }: LoginAttemptsProps) => {
    const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

    const filteredAttempts = attempts.filter(attempt => {
        if (filter === 'success') return attempt.success;
        if (filter === 'failed') return !attempt.success;
        return true;
    });

    return (
        <SettingsCard>
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Login Attempts</h3>
            </div>
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="font-medium">Login Activity</h4>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as typeof filter)}
                        className="text-sm border rounded px-3 py-1 bg-white"
                    >
                        <option value="all">All Attempts</option>
                        <option value="success">Successful</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <div className="max-h-96 overflow-y-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="text-left py-2 px-3 font-medium text-gray-700">Email</th>
                                    <th className="text-left py-2 px-3 font-medium text-gray-700">IP Address</th>
                                    <th className="text-left py-2 px-3 font-medium text-gray-700">Status</th>
                                    <th className="text-left py-2 px-3 font-medium text-gray-700">Time</th>
                                    <th className="text-left py-2 px-3 font-medium text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredAttempts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-gray-500">
                                            No login attempts found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAttempts.map(attempt => (
                                        <tr key={attempt.id} className="hover:bg-gray-50">
                                            <td className="py-3 px-3">
                                                <div className="font-medium truncate max-w-48">
                                                    {attempt.email}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                    {attempt.ip_address}
                                                </code>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    attempt.success
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {attempt.success ? 'Success' : 'Failed'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-gray-600">
                                                <div className="flex flex-col">
                                                    <span>
                                                        {formatDistanceToNow(new Date(attempt.attempted_at))} ago
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(attempt.attempted_at).toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                {!attempt.success && (
                                                    <button
                                                        onClick={() => onBlockIP(attempt.ip_address)}
                                                        className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                                                        title={`Block IP ${attempt.ip_address}`}
                                                    >
                                                        Block IP
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600 pt-2 border-t">
                    <span>Showing {filteredAttempts.length} of {attempts.length} attempts</span>
                    <div className="flex space-x-4">
                        <span className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                            {attempts.filter(a => a.success).length} successful
                        </span>
                        <span className="flex items-center">
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                            {attempts.filter(a => !a.success).length} failed
                        </span>
                    </div>
                </div>
            </div>
        </SettingsCard>
    );
});

LoginAttempts.displayName = 'LoginAttempts';

export default LoginAttempts;