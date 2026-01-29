'use client';

import { useState, useTransition } from 'react';
import { MoreHorizontal, Shield, User, Crown, Trash2, Loader2 } from 'lucide-react';
import { Card, Heading, Text, Badge, Avatar, IconButton } from '@whop/react/components';
import { changeMemberRole, removeMember } from '@/app/actions/settings';
import type { CompanyMember, CompanyRole, User as UserType } from '@/types/database';

interface TeamMembersListProps {
  members: (CompanyMember & { user: UserType })[];
  currentUserId: string;
  isOwner: boolean;
  whopCompanyId: string;
}

const roleConfig: Record<CompanyRole, { label: string; color: 'orange' | 'blue' | 'gray'; icon: typeof Crown }> = {
  owner: { label: 'Owner', color: 'orange', icon: Crown },
  admin: { label: 'Admin', color: 'blue', icon: Shield },
  member: { label: 'Member', color: 'gray', icon: User },
};

export function TeamMembersList({
  members,
  currentUserId,
  isOwner,
  whopCompanyId,
}: TeamMembersListProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleRoleChange = (userId: string, newRole: CompanyRole) => {
    setError(null);
    setOpenMenuId(null);

    startTransition(async () => {
      const result = await changeMemberRole(whopCompanyId, userId, newRole);
      if (!result.success) {
        setError(result.error);
      }
    });
  };

  const handleRemove = (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    setError(null);
    setOpenMenuId(null);

    startTransition(async () => {
      const result = await removeMember(whopCompanyId, userId);
      if (!result.success) {
        setError(result.error);
      }
    });
  };

  return (
    <Card size="2">
      <div className="mb-4">
        <Heading size="4" weight="semi-bold">
          Team Members
        </Heading>
        <Text size="2" color="gray" className="mt-0.5">
          Manage who has access to this workspace
        </Text>
      </div>

      {error && (
        <div className="mb-4 rounded-2 bg-red-a3 px-3 py-2">
          <Text size="2" color="red">
            {error}
          </Text>
        </div>
      )}

      <div className="space-y-3">
        {members.map((member) => {
          const role = roleConfig[member.role];
          const Icon = role.icon;
          const isCurrentUser = member.user_id === currentUserId;
          const canManage = isOwner && !isCurrentUser && member.role !== 'owner';

          return (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-2 border border-gray-a4 p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  size="2"
                  src={member.user.profile_pic_url || undefined}
                  fallback={(member.user.name || member.user.username || 'U')[0].toUpperCase()}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Text size="2" weight="medium">
                      {member.user.name || member.user.username || 'Unknown'}
                    </Text>
                    {isCurrentUser && (
                      <Badge size="1" color="gray">
                        You
                      </Badge>
                    )}
                  </div>
                  <Text size="1" color="gray">
                    {member.user.email || member.user.username || 'No email'}
                  </Text>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge size="1" color={role.color}>
                  <Icon className="h-3 w-3" />
                  {role.label}
                </Badge>

                {canManage && (
                  <div className="relative">
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="gray"
                      onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </IconButton>

                    {openMenuId === member.id && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />

                        {/* Menu */}
                        <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-2 border border-gray-a4 bg-gray-1 py-1 shadow-3">
                          {member.role !== 'admin' && (
                            <button
                              onClick={() => handleRoleChange(member.user_id, 'admin')}
                              className="flex w-full items-center gap-2 px-3 py-2 text-2 text-gray-11 hover:bg-gray-a3"
                            >
                              <Shield className="h-4 w-4" />
                              Make Admin
                            </button>
                          )}
                          {member.role !== 'member' && (
                            <button
                              onClick={() => handleRoleChange(member.user_id, 'member')}
                              className="flex w-full items-center gap-2 px-3 py-2 text-2 text-gray-11 hover:bg-gray-a3"
                            >
                              <User className="h-4 w-4" />
                              Make Member
                            </button>
                          )}
                          <button
                            onClick={() => handleRemove(member.user_id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-2 text-red-11 hover:bg-red-a3"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {members.length === 0 && (
        <div className="flex flex-col items-center py-8">
          <Text size="2" color="gray">
            No team members found
          </Text>
        </div>
      )}
    </Card>
  );
}
