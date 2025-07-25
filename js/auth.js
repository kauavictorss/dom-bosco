/**
 * Módulo de autenticação com integração ao Supabase
 * Gerencia o estado de autenticação do usuario e controle de acesso baseado em funções
 */

import {
    supabase,
    getCurrentUser as getSupabaseUser,
    getUserProfile,
    onAuthStateChange,
    signIn as supabaseSignIn,
    signOut as supabaseSignOut,
    hasRole as supabaseHasRole,
    DIRECTOR_ONLY,
    FINANCE_ONLY,
    DIRECTOR_OR_FINANCE,
    STOCK_MANAGERS,
    COORDINATOR_AND_HIGHER,
    ALL_USERS,
    PROFESSIONAL_ROLES,
    NON_FINANCE_ACCESS,
    ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES,
    DIRECTOR_AND_PROFESSIONALS,
    DIRECTOR_AND_COORDINATORS_ONLY_DOCUMENTS
} from './supabase.js';

// Exporta as constantes de controle de acesso para uso em outros módulos
export {
    DIRECTOR_ONLY,
    FINANCE_ONLY,
    DIRECTOR_OR_FINANCE,
    STOCK_MANAGERS,
    COORDINATOR_AND_HIGHER,
    ALL_USERS,
    PROFESSIONAL_ROLES,
    NON_FINANCE_ACCESS,
    ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES,
    DIRECTOR_AND_PROFESSIONALS,
    DIRECTOR_AND_COORDINATORS_ONLY_DOCUMENTS
};

// Estado global do usuario autenticado
export let currentUser = null;

// Inicializa o listener de estado de autenticação
let authUnsubscribe = null;

/**
 * Inicializa o gerenciamento de autenticação
 * Configura os listeners para mudanças de estado de autenticação
 */
export const initAuth = () => {
    // Limpa qualquer listener existente
    if (authUnsubscribe) {
        authUnsubscribe();
    }

    // Configura o listener de mudanças de estado de autenticação
    authUnsubscribe = onAuthStateChange(async (event, session) => {
        console.log('Evento de autenticação:', event);

        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            // Usuário fez login ou a sessão foi restaurada
            const user = await getSupabaseUser();
            if (user) {
                const profile = await getUserProfile(user.id);
                currentUser = {
                    ...user,
                    ...profile,
                    role: user.role || profile.role || 'staff' // Função padrão se não estiver definida
                };
                // Armazena os dados do usuario no localStorage para persistência
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                console.log('Usuário autenticado:', currentUser);
            }
        } else if (event === 'SIGNED_OUT') {
            // Usuário fez logout
            currentUser = null;
            localStorage.removeItem('currentUser');
            console.log('Usuário deslogado');
        }
    });
};

/**
 * Realiza o login do usuario
 * @param {string} email - Email do usuario
 * @param {string} password - Senha do usuario
 * @returns {Promise<Object>} Objeto com o resultado do login
 */
export const login = async (email, password) => {
    try {
        // Validação dos parâmetros
        if (!email || !password) {
            throw new Error('Email e senha são obrigatórios');
        }

        // Tenta fazer login usando o Supabase
        const {user, error} = await supabaseSignIn(email, password);

        if (error) throw error;

        // Obtém o perfil do usuario após o login
        const profile = await getUserProfile(user.id);

        // Atualiza o usuario atual com os dados do perfil
        currentUser = {
            ...user,
            ...profile,
            role: user.role || profile?.role || 'staff' // Função padrão se não estiver definida
        };

        // Armazena os dados do usuario no localStorage para persistência
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        return {success: true, user: currentUser};

    } catch (error) {
        console.error('Erro ao fazer login:', error.message);
        return {
            success: false,
            error: error.message || 'Falha ao fazer login. Verifique suas credenciais.'
        };
    }
};

/**
 * Realiza o logout do usuario
 * @returns {Promise<Object>} Resultado da operação de logout
 */
export const logout = async () => {
    try {
        // Faz logout no Supabase
        const {error} = await supabaseSignOut();

        if (error) throw error;

        // Limpa o usuario atual
        currentUser = null;
        localStorage.removeItem('currentUser');

        console.log('Logout realizado com sucesso');
        return {success: true};

    } catch (error) {
        console.error('Erro ao fazer logout:', error.message);
        return {
            success: false,
            error: error.message || 'Erro ao fazer logout'
        };
    }
};

/**
 * Verifica se o usuario está autenticado
 * @returns {Promise<Object>} Status de autenticação e dados do usuario
 */
export const checkLogin = async () => {
    try {
        // Primeiro, verifica se há um usuario armazenado no localStorage
        const storedUser = localStorage.getItem('currentUser');

        if (storedUser) {
            const user = JSON.parse(storedUser);
            currentUser = user;
            return {isAuthenticated: true, user};
        }

        // Se não há usuario armazenado, verifica se há uma sessão ativa no Supabase
        const {data: {session}, error} = await supabase.auth.getSession();

        if (error) {
            console.error('Erro ao verificar sessão:', error);
            return {isAuthenticated: false};
        }

        if (session?.user) {
            // Se há uma sessão ativa, busca os dados completos do usuario
            const user = await getSupabaseUser();

            if (!user) {
                return {isAuthenticated: false};
            }

            // Busca o perfil do usuario
            const profile = await getUserProfile(user.id);

            // Atualiza o usuario atual
            currentUser = {
                ...user,
                ...profile,
                role: user.role || profile?.role || 'staff' // Função padrão se não estiver definida
            };

            // Armazena os dados do usuario no localStorage para persistência
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            return {isAuthenticated: true, user: currentUser};
        }

        return {isAuthenticated: false};

    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        return {
            isAuthenticated: false,
            error: error.message || 'Erro ao verificar autenticação'
        };
    }
};

/**
 * Obtém o usuario atualmente autenticado
 * @returns {Object|null} Dados do usuario ou null se não estiver autenticado
 */
export const getCurrentUser = () => {
    // Tenta obter do estado atual
    if (currentUser) return currentUser;

    // Se não estiver no estado, tenta obter do localStorage
    try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            return currentUser;
        }
    } catch (e) {
        console.error('Erro ao recuperar usuario do localStorage:', e);
    }

    return null;
};

/**
 * Verifica se o usuario atual tem uma determinada função
 * @param {string|Array} allowedRoles - Função ou array de funções permitidas
 * @returns {boolean} Verdadeiro se o usuario tiver permissão
 */
export const isRoleAllowed = (allowedRoles) => {
    const user = getCurrentUser();
    if (!user) return false;

    // Se for um array, verifica se o usuario tem alguma das funções
    if (Array.isArray(allowedRoles)) {
        return allowedRoles.some(role => {
            if (role === 'authenticated') return true;
            return user.role === role;
        });
    }

    // Se for uma string, verifica se o usuario tem essa função específica
    if (typeof allowedRoles === 'string') {
        if (allowedRoles === 'authenticated') return true;
        return user.role === allowedRoles;
    }

    return false;
};

/**
 * Verifica se o usuario tem permissão para acessar uma aba específica
 * @param {string} tabId - ID da aba
 * @param {string} requiredAccess - Nível de acesso necessário ('view' ou 'edit')
 * @param {Object} user - Usuário a ser verificado (opcional, pega o usuario atual se não informado)
 * @returns {boolean} Verdadeiro se o usuario tiver permissão
 */
export const checkTabAccess = (tabId, requiredAccess = 'view', user = null) => {
    // Se não foi passado um usuario, tenta obter o usuario atual
    if (!user) {
        user = getCurrentUser();
    }

    // Se ainda não tem usuario, não tem acesso
    if (!user) return false;

    // Se for administrador, tem acesso a tudo
    if (user.role === 'director') return true;

    // Mapeamento de permissões para cada aba
    const tabPermissions = {
        'cadastro': {
            view: ['director', 'coordinator', 'professional', 'staff'],
            edit: ['director', 'coordinator', 'professional']
        },
        'agenda': {
            view: ['director', 'coordinator', 'professional', 'staff'],
            edit: ['director', 'coordinator', 'professional']
        },
        'historico': {
            view: ['director', 'coordinator', 'professional', 'staff'],
            edit: ['director', 'coordinator', 'professional']
        },
        'relatorios': {
            view: ['director', 'financeiro'],
            edit: ['director']
        },
        'financeiro': {
            view: ['director', 'financeiro'],
            edit: ['director', 'financeiro']
        },
        'estoque': {
            view: ['director', 'financeiro', 'staff'],
            edit: ['director', 'financeiro']
        },
        'funcionarios': {
            view: ['director', 'coordinator'],
            edit: ['director']
        }
    };

    // Verifica se a aba existe no mapeamento
    if (!tabPermissions[tabId]) {
        console.warn(`Aba '${tabId}' não encontrada no mapeamento de permissões`);
        return false;
    }

    // Obtém as permissões necessárias para o nível de acesso solicitado
    const requiredRoles = tabPermissions[tabId][requiredAccess] || [];

    // Verifica se o usuario tem alguma das funções necessárias
    return requiredRoles.includes(user.role);
};

/**
 * Verifica se o usuario tem permissão para editar uma aba específica
 * @param {string} tabId - ID da aba
 * @returns {boolean} Verdadeiro se o usuario tiver permissão de edição
 */
export const hasEditAccess = (tabId) => {
    return checkTabAccess(tabId, 'edit');
};

/**
 * Atualiza a senha do usuario
 * @param {string} userId - ID do usuario
 * @param {string} newPassword - Nova senha
 * @returns {Promise<Object>} Resultado da operação
 */
export const updateUserPassword = async (userId, newPassword) => {
    try {
        // Validação dos parâmetros
        if (!userId || !newPassword) {
            throw new Error('ID do usuario e nova senha são obrigatórios');
        }

        // Verifica se o usuario atual tem permissão para atualizar a senha
        const currentUser = getCurrentUser();
        if (!currentUser || (currentUser.id !== userId && !isRoleAllowed(DIRECTOR_ONLY))) {
            throw new Error('Sem permissão para atualizar esta senha');
        }

        // Atualiza a senha usando o Supabase
        const {data, error} = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        // Registra a alteração no histórico, se disponível
        if (currentUser.changeHistory) {
            currentUser.changeHistory.push({
                id: Date.now(),
                date: new Date().toISOString(),
                changedBy: getCurrentUser()?.name || 'Sistema',
                changes: [
                    {field: 'password', oldValue: '********', newValue: '********'}
                ]
            });

            // Atualiza o usuario no localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }

        return {
            success: true,
            message: 'Senha atualizada com sucesso'
        };

    } catch (error) {
        console.error('Erro ao atualizar senha:', error);
        return {
            success: false,
            error: error.message || 'Erro ao atualizar a senha'
        };
    }
};

// Funções auxiliares para verificação de funções
const hasAnyRole = (user, roles) => {
    if (!user || !user.role) return false;
    return roles.includes(user.role);
};

// Função para verificar se o usuario tem permissão para acessar recursos financeiros
export const hasFinanceAccess = (user) => {
    return hasAnyRole(user, ['director', 'financeiro']);
};

// Função para verificar se o usuario é um administrador
export const isAdmin = (user) => {
    return hasAnyRole(user, ['director']);
};

// Função para verificar se o usuario é um coordenador ou superior
export const isCoordinatorOrHigher = (user) => {
    return hasAnyRole(user, ['director', 'coordinator_madre', 'coordinator_floresta']);
};

// Função para verificar se o usuario é um profissional
export const isProfessional = (user) => {
    return hasAnyRole(user, ['musictherapist', 'psychologist', 'psychopedagogue', 'speech_therapist', 'nutritionist', 'physiotherapist']);
};
// Definição de constantes de funções para uso em todo o sistema
export const PROFESSIONAL_ROLES = [
    'staff', 'intern', 'musictherapist', 'receptionist',
    'psychologist', 'psychopedagogue', 'speech_therapist',
    'nutritionist', 'physiotherapist'
];

// Definição de constantes para controle de acesso
export const DIRECTOR_ONLY = ['director'];
export const FINANCE_ONLY = ['financeiro'];
export const DIRECTOR_OR_FINANCE = ['director', 'financeiro'];
export const STOCK_MANAGERS = ['director', 'financeiro', 'staff'];
export const COORDINATOR_AND_HIGHER = ['director', 'coordinator_madre', 'coordinator_floresta'];
export const ALL_USERS = ['*'];

// Grupos de funções para controle de acesso específico
export const NON_FINANCE_ACCESS = [
    'director', 'coordinator_madre', 'coordinator_floresta', 'staff',
    'intern', 'musictherapist', 'receptionist', 'psychologist',
    'psychopedagogue', 'speech_therapist', 'nutritionist', 'physiotherapist'
];

export const DIRECTOR_AND_PROFESSIONALS = ['director', ...PROFESSIONAL_ROLES];
export const ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES = [
    'director', 'coordinator_madre', 'coordinator_floresta', 'receptionist'
];

// Funções que podem ser visualizadas e gerenciadas todos os agendamentos
export const SCHEDULE_MANAGERS = [
    'director', 'coordinator_madre', 'coordinator_floresta', 'receptionist'
];

// Funções que podem ser visualizadas e gerenciadas documentos
export const DOCUMENT_MANAGERS = [
    'director', 'coordinator_madre', 'coordinator_floresta', 'professional'
];
export const ALL_SCHEDULE_VIEW_EDIT_MANAGERS = ['director', 'coordinator_madre', 'coordinator_floresta', 'receptionist'];
// NEW: Roles that can add/edit/delete general documents and meetings (Director and Coordinators only)
export const DIRECTOR_AND_COORDINATORS_ONLY_DOCUMENTS = ['director', 'coordinator_madre', 'coordinator_floresta'];
// NEW: All users, for tab visibility (e.g. general view for "Mural do Coordenador")
export const ALL_USERS = ['director', 'coordinator_madre', 'coordinator_floresta', 'staff', 'intern', 'musictherapist', 'financeiro', 'receptionist', 'psychologist', 'psychopedagogue', 'speech_therapist', 'nutritionist', 'physiotherapist'];

// Inicializa a autenticação quando o módulo for carregado
initAuth();

// Exporta as constantes de controle de acesso para uso em outros módulos
export {
    NON_FINANCE_ACCESS,
    PROFESSIONAL_ROLES,
    ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES,
    DIRECTOR_AND_PROFESSIONALS,
    DIRECTOR_AND_COORDINATORS_ONLY_DOCUMENTS,
    ALL_USERS,
    // Exportando funções auxiliares
    hasAnyRole,
    hasFinanceAccess,
    isAdmin,
    isCoordinatorOrHigher,
    isProfessional
};