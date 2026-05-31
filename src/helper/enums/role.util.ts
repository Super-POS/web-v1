import { Role } from 'app/core/user/interface';
import { RoleEnum } from './role.enum';

/** Matches api-v1 RoleEnum.SUPER_USER = 4 */
export const SUPER_USER_ROLE_ID = 4;

export function isSuperUserRole(role: Pick<Role, 'id' | 'name' | 'slug'> | null | undefined): boolean {
    if (!role) {
        return false;
    }
    const slug = (role.slug ?? '').toLowerCase();
    return (
        role.id === SUPER_USER_ROLE_ID ||
        role.name === RoleEnum.SUPER_USER ||
        role.name === 'Super User' ||
        slug === 'super-user' ||
        slug === 'super_user'
    );
}

export function userHasSuperUserAccess(roles: Role[] | null | undefined): boolean {
    return (roles ?? []).some(isSuperUserRole);
}
