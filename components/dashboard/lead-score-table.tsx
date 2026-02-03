'use client';

import { useState, useTransition } from 'react';
import { Trophy, User, Eye, Play, Download, RefreshCw, Loader2 } from 'lucide-react';
import { Card, Heading, Text, Button, Badge, Table } from '@whop/react/components';
import type { LeadScoreWithRegistration, LeadScoreDistribution } from '@/lib/data/lead-scoring';

interface LeadScoreTableProps {
  webinarId: string;
  leaderboard: LeadScoreWithRegistration[];
  distribution: LeadScoreDistribution[];
  summary: {
    totalScored: number;
    avgScore: number;
    medianScore: number;
    maxScore: number;
    minScore: number;
  };
  onRecalculate?: () => Promise<void>;
  onExport?: () => Promise<string>;
}

function getScoreColor(score: number): 'red' | 'orange' | 'yellow' | 'green' | 'blue' {
  if (score >= 100) return 'green';
  if (score >= 50) return 'blue';
  if (score >= 25) return 'yellow';
  if (score >= 10) return 'orange';
  return 'red';
}

function getScoreLabel(score: number): string {
  if (score >= 100) return 'Hot';
  if (score >= 50) return 'Warm';
  if (score >= 25) return 'Interested';
  if (score >= 10) return 'Engaged';
  return 'Cold';
}

export function LeadScoreTable({
  webinarId,
  leaderboard,
  distribution,
  summary,
  onRecalculate,
  onExport,
}: LeadScoreTableProps) {
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);

  const handleRecalculate = () => {
    if (!onRecalculate) return;
    startTransition(async () => {
      await onRecalculate();
    });
  };

  const handleExport = async () => {
    if (!onExport) return;
    setIsExporting(true);
    try {
      const csv = await onExport();
      // Create download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lead-scores-${webinarId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card size="1" className="p-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <Text size="1" color="gray">Total Scored</Text>
          </div>
          <Text size="5" weight="bold" className="mt-1">
            {summary.totalScored}
          </Text>
        </Card>

        <Card size="1" className="p-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-500" />
            <Text size="1" color="gray">Avg Score</Text>
          </div>
          <Text size="5" weight="bold" className="mt-1">
            {summary.avgScore}
          </Text>
        </Card>

        <Card size="1" className="p-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-green-500" />
            <Text size="1" color="gray">Max Score</Text>
          </div>
          <Text size="5" weight="bold" className="mt-1">
            {summary.maxScore}
          </Text>
        </Card>

        <Card size="1" className="p-4">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-purple-500" />
            <Text size="1" color="gray">Median</Text>
          </div>
          <Text size="5" weight="bold" className="mt-1">
            {summary.medianScore}
          </Text>
        </Card>
      </div>

      {/* Distribution */}
      {distribution.length > 0 && (
        <Card size="2">
          <Heading size="4" weight="semi-bold" className="mb-4">
            Score Distribution
          </Heading>
          <div className="flex gap-2">
            {distribution.map((d) => (
              <div key={d.range} className="flex-1">
                <div
                  className="rounded bg-blue-500/20"
                  style={{
                    height: `${Math.max(d.percentage * 2, 10)}px`,
                  }}
                />
                <Text size="1" color="gray" className="mt-1 text-center">
                  {d.range}
                </Text>
                <Text size="1" weight="medium" className="text-center">
                  {d.count} ({d.percentage}%)
                </Text>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Leaderboard */}
      <Card size="2">
        <div className="mb-4 flex items-center justify-between">
          <Heading size="4" weight="semi-bold">
            Lead Scores
          </Heading>
          <div className="flex gap-2">
            {onRecalculate && (
              <Button
                size="1"
                variant="soft"
                onClick={handleRecalculate}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Recalculate
              </Button>
            )}
            {onExport && (
              <Button
                size="1"
                variant="soft"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
                Export CSV
              </Button>
            )}
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="rounded-2 border border-dashed border-gray-a6 p-8 text-center">
            <Trophy className="mx-auto h-8 w-8 text-gray-a8" />
            <Text size="2" color="gray" className="mt-2">
              No lead scores yet. Scores are calculated based on engagement.
            </Text>
          </div>
        ) : (
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Rank</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Attendee</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Score</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Engagement</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Watch Time</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Attended</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {leaderboard.map((item, index) => (
                <Table.Row key={item.id}>
                  <Table.Cell>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-a3 text-xs font-medium">
                      {index + 1}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div>
                      <Text size="2" weight="medium">
                        {item.registration.name || 'Anonymous'}
                      </Text>
                      <Text size="1" color="gray">
                        {item.registration.email}
                      </Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="3" weight="bold">
                      {item.total_score}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={getScoreColor(item.total_score)} size="1">
                      {getScoreLabel(item.total_score)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">{item.engagement_score}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">{item.watch_time_score}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    {item.registration.attended ? (
                      <Badge color="green" size="1">Yes</Badge>
                    ) : item.registration.watched_replay ? (
                      <Badge color="blue" size="1">Replay</Badge>
                    ) : (
                      <Badge color="gray" size="1">No</Badge>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Card>
    </div>
  );
}
