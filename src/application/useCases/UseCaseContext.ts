export interface UseCaseContext {
  userId: string;
  tenantId: string;
  roles: UserRole[];
  permissions: Permission[];
  correlationId: string;
  metadata?: Record<string, unknown>;
}

export enum UserRole {
  ADMIN = 'admin',
  DENTIST = 'dentist',
  RECEPTIONIST = 'receptionist',
  ASSISTANT = 'assistant',
  VIEWER = 'viewer',
}

export enum Permission {
  CREATE_PATIENT = 'create:patient',
  READ_PATIENT = 'read:patient',
  UPDATE_PATIENT = 'update:patient',
  DELETE_PATIENT = 'delete:patient',
  CREATE_CONSULTATION = 'create:consultation',
  READ_CONSULTATION = 'read:consultation',
  UPDATE_CONSULTATION = 'update:consultation',
  DELETE_CONSULTATION = 'delete:consultation',
  CREATE_APPOINTMENT = 'create:appointment',
  READ_APPOINTMENT = 'read:appointment',
  UPDATE_APPOINTMENT = 'update:appointment',
  DELETE_APPOINTMENT = 'delete:appointment',
  READ_REPORTS = 'read:reports',
  EXPORT_REPORTS = 'export:reports',
  MANAGE_USERS = 'manage:users',
  MANAGE_ROLES = 'manage:roles',
  MANAGE_SETTINGS = 'manage:settings',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.CREATE_PATIENT,
    Permission.READ_PATIENT,
    Permission.UPDATE_PATIENT,
    Permission.DELETE_PATIENT,
    Permission.CREATE_CONSULTATION,
    Permission.READ_CONSULTATION,
    Permission.UPDATE_CONSULTATION,
    Permission.DELETE_CONSULTATION,
    Permission.CREATE_APPOINTMENT,
    Permission.READ_APPOINTMENT,
    Permission.UPDATE_APPOINTMENT,
    Permission.DELETE_APPOINTMENT,
    Permission.READ_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.MANAGE_SETTINGS,
  ],
  [UserRole.DENTIST]: [
    Permission.CREATE_PATIENT,
    Permission.READ_PATIENT,
    Permission.UPDATE_PATIENT,
    Permission.CREATE_CONSULTATION,
    Permission.READ_CONSULTATION,
    Permission.UPDATE_CONSULTATION,
    Permission.READ_APPOINTMENT,
    Permission.UPDATE_APPOINTMENT,
    Permission.READ_REPORTS,
  ],
  [UserRole.RECEPTIONIST]: [
    Permission.CREATE_PATIENT,
    Permission.READ_PATIENT,
    Permission.UPDATE_PATIENT,
    Permission.CREATE_APPOINTMENT,
    Permission.READ_APPOINTMENT,
    Permission.UPDATE_APPOINTMENT,
    Permission.DELETE_APPOINTMENT,
    Permission.READ_CONSULTATION,
  ],
  [UserRole.ASSISTANT]: [
    Permission.READ_PATIENT,
    Permission.READ_APPOINTMENT,
    Permission.READ_CONSULTATION,
  ],
  [UserRole.VIEWER]: [
    Permission.READ_PATIENT,
    Permission.READ_APPOINTMENT,
    Permission.READ_CONSULTATION,
  ],
};

export function hasPermission(context: UseCaseContext, permission: Permission): boolean {
  return context.permissions.includes(permission);
}

export function hasRole(context: UseCaseContext, role: UserRole): boolean {
  return context.roles.includes(role);
}

export function createUseCaseContext(options: {
  userId: string;
  tenantId: string;
  roles: UserRole[];
  correlationId: string;
  metadata?: Record<string, unknown>;
}): UseCaseContext {
  const permissions = options.roles.flatMap(role => 
    ROLE_PERMISSIONS[role] || []
  );
  
  const uniquePermissions = [...new Set(permissions)];
  
  return {
    userId: options.userId,
    tenantId: options.tenantId,
    roles: options.roles,
    permissions: uniquePermissions,
    correlationId: options.correlationId,
    metadata: options.metadata,
  };
}
