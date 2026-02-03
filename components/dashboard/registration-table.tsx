'use client';

import { useState, useTransition } from 'react';
import { Check, X, Trash2, Download, Search, Users, Mail, Calendar } from 'lucide-react';
import { deleteRegistration, exportRegistrations } from '@/app/actions/registration';
import { formatRelativeTime } from '@/lib/utils/date';
import type { Registration } from '@/types/database';

interface RegistrationTableProps {
  registrations: Registration[];
  webinarId: string;
}

/**
 * Registration Table
 * Modern table with search, filtering, and actions
 */
export function RegistrationTable({ registrations, webinarId }: RegistrationTableProps) {
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  const filteredRegistrations = registrations.filter(
    (r) =>
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.name && r.name.toLowerCase().includes(search.toLowerCase()))
  );

  const attendedCount = registrations.filter((r) => r.attended).length;
  const attendanceRate = registrations.length > 0
    ? Math.round((attendedCount / registrations.length) * 100)
    : 0;

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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total Registrations"
          value={registrations.length}
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard
          icon={Check}
          label="Attended"
          value={attendedCount}
          subtext={`${attendanceRate}% attendance rate`}
          gradient="from-emerald-500 to-teal-600"
        />
        <StatCard
          icon={Mail}
          label="Emails Sent"
          value={registrations.filter((r) => r.confirmation_sent).length}
          gradient="from-violet-500 to-purple-600"
        />
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-9" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-a4 bg-gray-a2 py-2.5 pl-11 pr-4 text-sm text-gray-12 placeholder:text-gray-9 transition-all focus:border-blue-8 focus:outline-none focus:ring-2 focus:ring-blue-a4"
          />
        </div>
        <button
          onClick={handleExport}
          disabled={isPending || registrations.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-a4 bg-gray-a2 px-4 py-2.5 text-sm font-medium text-gray-11 transition-all hover:bg-gray-a3 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-a4 bg-gray-a2">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-a4">
            <thead>
              <tr className="bg-gray-a3">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-11">
                  Registrant
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-11">
                  Registered
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-11">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-11">
                  Source
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-11">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-a3">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="rounded-2xl bg-gray-a3 p-4">
                        <Users className="h-8 w-8 text-gray-9" />
                      </div>
                      <p className="mt-4 font-medium text-gray-12">
                        {search ? 'No registrations match your search' : 'No registrations yet'}
                      </p>
                      <p className="mt-1 text-sm text-gray-11">
                        {search ? 'Try a different search term' : 'Registrations will appear here when people sign up'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((registration) => (
                  <tr key={registration.id} className="transition-colors hover:bg-gray-a3">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-a4 to-gray-a5 text-sm font-semibold text-gray-11">
                          {(registration.name || registration.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-12">
                            {registration.name || 'No name'}
                          </p>
                          <p className="text-sm text-gray-11">{registration.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-11">
                        <Calendar className="h-4 w-4" />
                        {formatRelativeTime(registration.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {registration.attended ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-a3 px-2.5 py-1 text-xs font-semibold text-green-11">
                          <Check className="h-3 w-3" />
                          Attended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-a3 px-2.5 py-1 text-xs font-semibold text-gray-11">
                          <X className="h-3 w-3" />
                          Not attended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-11">
                        {registration.source || 'Direct'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(registration.id)}
                        disabled={isPending}
                        className="rounded-lg p-2 text-gray-9 transition-colors hover:bg-red-a3 hover:text-red-11 disabled:opacity-50"
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
      </div>

      {/* Footer */}
      <p className="text-sm text-gray-11">
        Showing {filteredRegistrations.length} of {registrations.length} registrations
      </p>
    </div>
  );
}

interface StatCardProps {
  icon: typeof Users;
  label: string;
  value: number;
  subtext?: string;
  gradient: string;
}

function StatCard({ icon: Icon, label, value, subtext, gradient }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-a4 bg-gray-a2 p-5">
      <div className={`rounded-xl bg-gradient-to-br ${gradient} p-3 shadow-lg`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-12">{value}</p>
        <p className="text-sm text-gray-11">{label}</p>
        {subtext && <p className="text-xs text-gray-9">{subtext}</p>}
      </div>
    </div>
  );
}
