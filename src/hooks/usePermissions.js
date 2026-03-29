import { useAuth } from '../context/AuthContext';

/**
 * Permission matrix per role.
 *
 * admin      — full access to everything
 * operations — load board, carriers (view only), carrier details (contracts/insurance/EDI/contacts),
 *              shippers (view), reports, finance, tracking, AI, help
 *              CANNOT: add/remove/verify carriers, manage users, edit settings, add/remove shippers
 */
const ROLE_PERMS = {
  admin: new Set([
    'users.manage',
    'carriers.create',
    'carriers.delete',
    'carriers.verify',
    'carriers.view',
    'carrier_details.edit',
    'shippers.create',
    'shippers.delete',
    'shippers.view',
    'loads.manage',
    'reports.view',
    'finance.view',
    'tracking.view',
    'settings.edit',
    'ai.use',
    'help.view',
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
  ]),
};

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role || 'operations';
  const perms = ROLE_PERMS[role] || ROLE_PERMS.operations;

  function can(permission) {
    return perms.has(permission);
  }

  function isAdmin() {
    return role === 'admin';
  }

  return { can, isAdmin, role };
}
