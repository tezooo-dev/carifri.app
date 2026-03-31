import { useAuth } from '../context/AuthContext';

/**
 * Permission matrix per role.
 *
 * super_admin — FreightLink IT team: sees all clients, manages everything,
 *               accesses client impersonation & troubleshooting tools
 * admin       — Per-company admin: full access within their company,
 *               can manage users & create custom roles
 * operations  — Regular staff: load board, carriers (view), reports, finance, tracking
 */

const ALL_PERMS = [
  'users.manage',
  'roles.manage',
  'clients.manage',
  'carriers.create', 'carriers.delete', 'carriers.verify', 'carriers.view',
  'carrier_details.edit',
  'shippers.create', 'shippers.delete', 'shippers.view',
  'loads.manage',
  'reports.view',
  'finance.view',
  'tracking.view',
  'settings.edit',
  'ai.use',
  'help.view',
  'tickets.view', 'tickets.manage',
  'billing.manage',
];

const ROLE_PERMS = {
  super_admin: new Set(ALL_PERMS),

  admin: new Set([
    'users.manage',
    'roles.manage',
    'carriers.create', 'carriers.delete', 'carriers.verify', 'carriers.view',
    'carrier_details.edit',
    'shippers.create', 'shippers.delete', 'shippers.view',
    'loads.manage',
    'reports.view',
    'finance.view',
    'tracking.view',
    'settings.edit',
    'ai.use',
    'help.view',
    'tickets.view', 'tickets.manage',
    'billing.manage',
  ]),

  operations: new Set([
    'carriers.view',
    'carrier_details.edit',
    'shippers.view',
    'loads.manage',
    'reports.view',
    'finance.view',
    'tracking.view',
    'ai.use',
    'help.view',
    'tickets.view',
  ]),
};

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role || 'operations';

  // Use built-in role permissions; custom roles stored in user.customPerms
  const builtIn = ROLE_PERMS[role] || ROLE_PERMS.operations;
  const custom  = user?.customPerms ? new Set(user.customPerms) : null;
  const perms   = custom || builtIn;

  function can(permission) {
    return perms.has(permission);
  }

  const isAdmin      = () => role === 'admin' || role === 'super_admin';
  const isSuperAdmin = () => role === 'super_admin';

  return { can, isAdmin, isSuperAdmin, role, allPerms: ALL_PERMS };
}
