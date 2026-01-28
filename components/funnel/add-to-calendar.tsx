'use client';

import { Calendar, Download } from 'lucide-react';
import { Button } from '@whop/react/components';
import { formatInTimezone, getWebinarEndTime } from '@/lib/utils/date';

interface AddToCalendarProps {
  title: string;
  description?: string | null;
  startTime: string;
  durationMinutes: number;
  timezone: string;
  location?: string;
}

/**
 * Add to Calendar Buttons
 * Generate calendar links for Google, iCal, and Outlook
 */
export function AddToCalendar({
  title,
  description,
  startTime,
  durationMinutes,
  timezone,
  location = 'Online Webinar',
}: AddToCalendarProps) {
  const endTime = getWebinarEndTime(startTime, durationMinutes);

  // Format dates for calendar URLs (UTC)
  const formatForCalendar = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 15) + 'Z';
  };

  const start = formatForCalendar(startTime);
  const end = formatForCalendar(endTime);

  // Google Calendar URL
  const googleUrl = new URL('https://www.google.com/calendar/render');
  googleUrl.searchParams.set('action', 'TEMPLATE');
  googleUrl.searchParams.set('text', title);
  googleUrl.searchParams.set('dates', `${start}/${end}`);
  googleUrl.searchParams.set('details', description || '');
  googleUrl.searchParams.set('location', location);

  // Generate ICS file content
  const generateICS = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Webinar//EN',
      'BEGIN:VEVENT',
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${(description || '').replace(/\n/g, '\\n')}`,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return icsContent;
  };

  const downloadICS = () => {
    const icsContent = generateICS();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Outlook Web URL
  const outlookUrl = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
  outlookUrl.searchParams.set('subject', title);
  outlookUrl.searchParams.set('startdt', new Date(startTime).toISOString());
  outlookUrl.searchParams.set('enddt', endTime.toISOString());
  outlookUrl.searchParams.set('body', description || '');
  outlookUrl.searchParams.set('location', location);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Add to calendar:</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={googleUrl.toString()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Calendar className="h-4 w-4" />
          Google
        </a>
        <button
          onClick={downloadICS}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          iCal
        </button>
        <a
          href={outlookUrl.toString()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Calendar className="h-4 w-4" />
          Outlook
        </a>
      </div>
    </div>
  );
}
