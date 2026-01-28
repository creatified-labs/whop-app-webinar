'use client';

import { useState, useTransition } from 'react';
import { Check, X, Trash2, Download, Search } from 'lucide-react';
import { Button } from '@whop/react/components';
import { deleteRegistration, exportRegistrations } from '@/app/actions/registration';
import { formatRelativeTime } from '@/lib/utils/date';
import type { Registration } from '@/types/database';

interface RegistrationTableProps {
  registrations: Registration[];
  webinarId: string;
}

/**
 * Registration Table
 * Table showing all registrations with search and actions
 */
export function RegistrationTable({ registrations, webinarId }: RegistrationTableProps) {
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  const filteredRegistrations = registrations.filter(
    (r) =>
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.name && r.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleExport = () => {
    startTransition(async () => {
      const result = await exportRegistrations(webinarId);
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `registrations-${webinarId}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  };

  const handleDelete = (registrationId: string) => {
    if (!confirm('Are you sure you want to delete this registration?')) return;
    startTransition(async () => {
      await deleteRegistration(webinarId, registrationId);
    });
  };

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <Button variant="soft" onClick={handleExport} disabled={isPending}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Registered
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Attended
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Source
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRegistrations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {search ? 'No registrations match your search' : 'No registrations yet'}
                </td>
              </tr>
            ) : (
              filteredRegistrations.map((registration) => (
                <tr key={registration.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {registration.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {registration.name || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatRelativeTime(registration.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {registration.attended ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <Check className="h-4 w-4" />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <X className="h-4 w-4" />
                        No
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {registration.source || 'direct'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(registration.id)}
                      disabled={isPending}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-500">
        Showing {filteredRegistrations.length} of {registrations.length} registrations
      </p>
    </div>
  );
}
