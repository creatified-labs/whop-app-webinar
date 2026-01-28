/**
 * Company Data Functions
 * Sync and manage companies from Whop
 */

import { createAdminClient } from '@/lib/supabase/server';
import type {
  Company,
  CompanyInsert,
  CompanyUpdate,
  CompanyMember,
  CompanyMemberInsert,
  CompanyRole,
} from '@/types/database';

/**
 * Get a company by its Whop company ID
 */
export async function getCompanyByWhopId(whopCompanyId: string): Promise<Company | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('whop_company_id', whopCompanyId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get company: ${error.message}`);
  }

  return data;
}

/**
 * Get a company by its internal ID
 */
export async function getCompanyById(id: string): Promise<Company | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get company: ${error.message}`);
  }

  return data;
}

/**
 * Get or create a company from Whop data
 * This is the primary function for syncing companies
 */
export async function getOrCreateCompany(whopCompany: {
  id: string;
  title: string;
  image_url?: string | null;
}): Promise<Company> {
  const supabase = createAdminClient();

  // Try to get existing company
  const existingCompany = await getCompanyByWhopId(whopCompany.id);

  if (existingCompany) {
    // Update if any data changed
    const updates: CompanyUpdate = {};
    let hasUpdates = false;

    if (whopCompany.title !== existingCompany.name) {
      updates.name = whopCompany.title;
      hasUpdates = true;
    }
    if (whopCompany.image_url !== undefined && whopCompany.image_url !== existingCompany.image_url) {
      updates.image_url = whopCompany.image_url;
      hasUpdates = true;
    }

    if (hasUpdates) {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', existingCompany.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update company: ${error.message}`);
      }

      return data;
    }

    return existingCompany;
  }

  // Create new company
  const newCompany: CompanyInsert = {
    whop_company_id: whopCompany.id,
    name: whopCompany.title,
    image_url: whopCompany.image_url ?? null,
  };

  const { data, error } = await supabase
    .from('companies')
    .insert(newCompany)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create company: ${error.message}`);
  }

  return data;
}

/**
 * Update a company
 */
export async function updateCompany(id: string, updates: CompanyUpdate): Promise<Company> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update company: ${error.message}`);
  }

  return data;
}

// ============================================
// Company Membership Functions
// ============================================

/**
 * Add or update a user's membership in a company
 */
export async function upsertCompanyMember(
  companyId: string,
  userId: string,
  role: CompanyRole = 'member'
): Promise<CompanyMember> {
  const supabase = createAdminClient();

  const memberData: CompanyMemberInsert = {
    company_id: companyId,
    user_id: userId,
    role,
  };

  const { data, error } = await supabase
    .from('company_members')
    .upsert(memberData, {
      onConflict: 'company_id,user_id',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert company member: ${error.message}`);
  }

  return data;
}

/**
 * Get a user's membership in a company
 */
export async function getCompanyMember(
  companyId: string,
  userId: string
): Promise<CompanyMember | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('company_members')
    .select('*')
    .eq('company_id', companyId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get company member: ${error.message}`);
  }

  return data;
}

/**
 * Check if a user has a specific role (or higher) in a company
 */
export async function checkCompanyRole(
  companyId: string,
  userId: string,
  requiredRole: CompanyRole
): Promise<boolean> {
  const member = await getCompanyMember(companyId, userId);
  if (!member) return false;

  const roleHierarchy: Record<CompanyRole, number> = {
    owner: 3,
    admin: 2,
    member: 1,
  };

  return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
}

/**
 * Get all members of a company
 */
export async function getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('company_members')
    .select('*')
    .eq('company_id', companyId);

  if (error) {
    throw new Error(`Failed to get company members: ${error.message}`);
  }

  return data;
}

/**
 * Get all companies a user is a member of
 */
export async function getUserCompanies(userId: string): Promise<(CompanyMember & { company: Company })[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('company_members')
    .select(`
      *,
      company:companies(*)
    `)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to get user companies: ${error.message}`);
  }

  return data as (CompanyMember & { company: Company })[];
}

/**
 * Remove a user from a company
 */
export async function removeCompanyMember(companyId: string, userId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('company_members')
    .delete()
    .eq('company_id', companyId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to remove company member: ${error.message}`);
  }
}

/**
 * Sync a user's company membership from Whop
 * Call this after verifying access via Whop SDK
 */
export async function syncCompanyMembership(
  whopCompanyId: string,
  whopUserId: string,
  whopCompanyData: { id: string; title: string; image_url?: string | null },
  whopUserData: {
    id: string;
    email?: string | null;
    name?: string | null;
    username?: string | null;
    profile_pic_url?: string | null;
  },
  role: CompanyRole = 'member'
): Promise<{
  company: Company;
  user: import('@/types/database').User;
  membership: CompanyMember;
}> {
  // Import here to avoid circular dependency
  const { getOrCreateUser } = await import('./users');

  // Sync company and user
  const [company, user] = await Promise.all([
    getOrCreateCompany(whopCompanyData),
    getOrCreateUser(whopUserData),
  ]);

  // Sync membership
  const membership = await upsertCompanyMember(company.id, user.id, role);

  return { company, user, membership };
}
