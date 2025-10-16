import React, { memo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import SettingsCard from '../SettingsCard';

interface BlockedIP {
    id: number;
    ip_address: string;
    reason: string;
    is_permanent: boolean;
    blocked_at: string;
    expires_at?: string;
    blocked_by?: {
        name: string;
        email: string;
    };
}

interface IPBlocklistProps {
    blockedIPs: BlockedIP[];
    onUnblockIP: (ip: string) => void;
    onBlockIP: (ip: string, reason: string, isPermanent: boolean, hours?: number) => void;
}

const IPBlocklist = memo(({ blockedIPs, onUnblockIP, onBlockIP }: IPBlocklistProps) => {
    const [showBlockForm, setShowBlockForm] = useState(false);
    const [newIP, setNewIP] = useState('');
    const [reason, setReason] = useState('');
    const [isPermanent, setIsPermanent] = useState(false);
    const [hours, setHours] = useState(24);

    const handleBlockIP = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newIP || !reason) return;
        
        onBlockIP(newIP, reason, isPermanent, isPermanent ? undefined : hours);
        setNewIP('');
        setReason('');
        setIsPermanent(false);
        setHours(24);
        setShowBlockForm(false);
    };

    const isExpired = (blockedIP: BlockedIP) => {
        if (blockedIP.is_permanent) return false;
        if (!blockedIP.expires_at) return false;
        return new Date(blockedIP.expires_at) <= new Date();
    };

    const activeBlockedIPs = blockedIPs.filter(ip => !isExpired(ip));
    const expiredBlockedIPs = blockedIPs.filter(ip => isExpired(ip));

    return (
        <SettingsCard>
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">IP Blocklist Management</h3>
            </div>
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="font-medium">Blocked IP Addresses</h4>
                    <button
                        onClick={() => setShowBlockForm(!showBlockForm)}
                        className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                    >
                        Block New IP
                    </button>
                </div>

                {showBlockForm && (
                    <form onSubmit={handleBlockIP} className="bg-gray-50 p-4 rounded-lg space-y-4">
                        <div>
                            <label htmlFor="ip" className="block text-sm font-medium text-gray-700 mb-1">
                                IP Address
                            </label>
                            <input
                                type="text"
                                id="ip"
                                value={newIP}
                                onChange={(e) => setNewIP(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                placeholder="192.168.1.1"
                                pattern="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
                                required
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                                Reason
                            </label>
                            <textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                placeholder="Reason for blocking this IP address..."
                                rows={2}
                                required
                            />
                        </div>

                        <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={isPermanent}
                                    onChange={(e) => setIsPermanent(e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <span className="ml-2 text-sm text-gray-700">Permanent block</span>
                            </label>

                            {!isPermanent && (
                                <div className="flex items-center space-x-2">
                                    <label htmlFor="hours" className="text-sm text-gray-700">Duration:</label>
                                    <input
                                        type="number"
                                        id="hours"
                                        value={hours}
                                        onChange={(e) => setHours(parseInt(e.target.value))}
                                        min="1"
                                        max="8760"
                                        className="border rounded px-2 py-1 text-sm w-20"
                                    />
                                    <span className="text-sm text-gray-700">hours</span>
                                </div>
                            )}
                        </div>

                        <div className="flex space-x-2">
                            <button
                                type="submit"
                                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                            >
                                Block IP
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowBlockForm(false)}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                <div className="space-y-3">
                    <h5 className="font-medium text-green-700">Active Blocks ({activeBlockedIPs.length})</h5>
                    {activeBlockedIPs.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No active IP blocks</p>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {activeBlockedIPs.map(ip => (
                                <div key={ip.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <code className="font-mono text-sm font-medium">{ip.ip_address}</code>
                                            {ip.is_permanent ? (
                                                <span className="px-2 py-1 text-xs bg-red-600 text-white rounded">
                                                    PERMANENT
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs bg-orange-600 text-white rounded">
                                                    TEMPORARY
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{ip.reason}</p>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Blocked {formatDistanceToNow(new Date(ip.blocked_at))} ago
                                            {!ip.is_permanent && ip.expires_at && (
                                                <span> • Expires in {formatDistanceToNow(new Date(ip.expires_at))}</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onUnblockIP(ip.ip_address)}
                                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 ml-4"
                                    >
                                        Unblock
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {expiredBlockedIPs.length > 0 && (
                    <div className="space-y-3">
                        <h5 className="font-medium text-gray-500">Expired Blocks ({expiredBlockedIPs.length})</h5>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {expiredBlockedIPs.map(ip => (
                                <div key={ip.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <code className="font-mono text-sm text-gray-600">{ip.ip_address}</code>
                                            <span className="px-2 py-1 text-xs bg-gray-400 text-white rounded">
                                                EXPIRED
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{ip.reason}</p>
                                        <div className="text-xs text-gray-400 mt-1">
                                            Expired {formatDistanceToNow(new Date(ip.expires_at!))} ago
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </SettingsCard>
    );
});

IPBlocklist.displayName = 'IPBlocklist';

export default IPBlocklist;