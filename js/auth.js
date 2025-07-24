// Authentication module
import { db, saveDb } from './database.js';

export let currentUser = null;

// New: Role-based access control helper constants
// These constants define the roles allowed for different features/tabs.
// 'financeiro' is intentionally excluded from all non-financial access groups.

// Roles with access to only Director-specific features (e.g., full stock control)
export const DIRECTOR_ONLY = ['director'];
// Roles with access to only Finance-specific features (e.g., daily financial notes)
export const FINANCE_ONLY = ['financeiro'];
// Roles with combined Director or Finance access (e.g., viewing main financial report)
export const DIRECTOR_OR_FINANCE = ['director', 'financeiro'];
// NEW: Roles with access to stock management features (Director and Finance)
export const STOCK_MANAGERS = ['director', 'financeiro'];
// Roles with Coordinator access and higher (Director included)
export const COORDINATOR_AND_HIGHER = ['director', 'coordinator_madre', 'coordinator_floresta'];
// Roles with access to non-finance operational features (e.g., Client Registration, General Agenda)
// This group explicitly excludes 'financeiro'.
export const NON_FINANCE_ACCESS = ['director', 'coordinator_madre', 'coordinator_floresta', 'staff', 'intern', 'musictherapist', 'receptionist', 'psychologist', 'psychopedagogue', 'speech_therapist', 'nutritionist', 'physiotherapist'];
// All professional roles that can be assigned to clients/schedules, or perform services
export const PROFESSIONAL_ROLES = ['staff', 'intern', 'musictherapist', 'receptionist', 'psychologist', 'psychopedagogue', 'speech_therapist', 'nutritionist', 'physiotherapist'];
// Roles for Director and all professional roles (e.g., 'Meus Pacientes' tab)
export const DIRECTOR_AND_PROFESSIONALS = ['director', ...PROFESSIONAL_ROLES];
// Roles that can view all clients and employees (Director, Coordinators, and Receptionists)
export const ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES = ['director', 'coordinator_madre', 'coordinator_floresta', 'receptionist'];
// New: Roles that can view AND manage ALL schedules (confirm/cancel any schedule)
export const ALL_SCHEDULE_VIEW_EDIT_MANAGERS = ['director', 'coordinator_madre', 'coordinator_floresta', 'receptionist'];
// NEW: Roles that can add/edit/delete general documents and meetings (Director and Coordinators only)
export const DIRECTOR_AND_COORDINATORS_ONLY_DOCUMENTS = ['director', 'coordinator_madre', 'coordinator_floresta'];
// NEW: All users, for tab visibility (e.g. general view for "Mural do Coordenador")
export const ALL_USERS = ['director', 'coordinator_madre', 'coordinator_floresta', 'staff', 'intern', 'musictherapist', 'financeiro', 'receptionist', 'psychologist', 'psychopedagogue', 'speech_therapist', 'nutritionist', 'physiotherapist'];

export function login(username, password) {
    const user = db.users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
    }
    return false;
}

export function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
}

export function checkLogin() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        return true;
    }
    return false;
}

export function getCurrentUser() {
    return currentUser;
}

// New: Role-based access control helper
export function isRoleAllowed(allowedRoles) {
    const user = getCurrentUser();
    if (!user) return false;
    // allowedRoles can be a single string or an array of strings
    if (Array.isArray(allowedRoles)) {
        return allowedRoles.includes(user.role);
    }
    return user.role === allowedRoles;
}

export function checkTabAccess(tabId, requiredAccess = 'view', user = getCurrentUser()) {
    if (!user) return false;

    let effectiveAccessLevel = null; // Can be 'none', 'view', 'edit' from custom settings, or null if no custom setting for this tab.

    // 1. Check for user-specific custom permissions first
    // If user.tabAccess is an object, check if it contains a specific override for this tabId.
    if (user.tabAccess && typeof user.tabAccess === 'object') {
        const customAccessForTab = user.tabAccess[tabId];
        if (customAccessForTab !== undefined) { // If there's an explicit custom setting for this tab (can be 'none', 'view', 'edit')
            effectiveAccessLevel = customAccessForTab;
        }
    }

    // Now, evaluate the determined `effectiveAccessLevel`
    if (effectiveAccessLevel === 'none') {
        return false; // Explicitly denied by custom permission
    } else if (effectiveAccessLevel === 'view') {
        return requiredAccess === 'view'; // Only view is allowed
    } else if (effectiveAccessLevel === 'edit') {
        return true; // Edit implies both view and edit are allowed
    }

    // 2. If no custom user override, check for custom role permissions
    const userRole = db.roles.find(r => r.id === user.role);
    if (userRole && userRole.tabAccess) {
        const roleAccessForTab = userRole.tabAccess[tabId];
        if (roleAccessForTab) { // If there's a setting in the custom role
            if (requiredAccess === 'view' && (roleAccessForTab === 'view' || roleAccessForTab === 'edit')) {
                return true;
            }
            if (requiredAccess === 'edit' && roleAccessForTab === 'edit') {
                return true;
            }
            return false;
        }
    }

    // 3. If still no specific permission, fall back to default hardcoded role-based permissions.
    const tabsConfig = {
        'cadastro': NON_FINANCE_ACCESS,
        'agenda': NON_FINANCE_ACCESS,
        'historico': ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES,
        'meus-pacientes': DIRECTOR_AND_PROFESSIONALS,
        'financeiro': DIRECTOR_OR_FINANCE,
        'relatorios': ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES,
        'estoque': STOCK_MANAGERS,
        'funcionarios': ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES,
        'documentos': ALL_USERS, 
    };

    const defaultRolesForTab = tabsConfig[tabId] || [];
    const hasDefaultAccess = isRoleAllowed(defaultRolesForTab); // This uses the current user's role unless `user` is passed

    if (requiredAccess === 'view') {
        return hasDefaultAccess;
    } else if (requiredAccess === 'edit') {
        return hasDefaultAccess;
    }
    return false; // Should not reach here for valid requiredAccess values.
}

export function hasEditAccess(tabId) {
    // This function is a simple wrapper to check for 'edit' permissions.
    return checkTabAccess(tabId, 'edit');
}

// NEW FUNCTION: Update User Password
export function updateUserPassword(userId, newPassword) {
    const user = db.users.find(u => u.id === userId);
    // Only Director can update passwords and only if they have 'edit' access to the 'funcionarios' tab
    if (user && hasEditAccess('funcionarios')) { 
        // No need to store old password, only a dummy value in history.
        user.password = newPassword;
        
        // Add to change history
        if (!user.changeHistory) user.changeHistory = [];
        user.changeHistory.push({
            id: db.nextChangeId++,
            date: new Date().toISOString(),
            changedBy: getCurrentUser().name,
            changes: [
                { field: 'Senha', oldValue: '********', newValue: '********' } // Mask passwords in history
            ]
        });
        
        saveDb();
        return true;
    }
    return false;
}