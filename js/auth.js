/**
 * Módulo de autenticação com integração ao Supabase
 * Gerencia o estado de autenticação do usuario e controle de acesso baseado em funções
 */

import { supabase } from './supabase.js'; // Correct import for the client
import { showNotification } from './ui.js';
import { db, saveDb } from './database.js';

import {
    PROFESSIONAL_ROLES,
    DIRECTOR_ONLY,
} from './roles.js';

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
        authUnsubscribe.unsubscribe();
    }

    // Configura o listener de mudanças de estado de autenticação
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Evento de autenticação:', event, session);

        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            // Usuário fez login ou a sessão foi restaurada
            if (session?.user) {
                const profile = await getUserProfile(session.user.id);
                if (!profile) {
                    console.error('Perfil não encontrado para o usuário:', session.user.id);
                    // Deslogar o usuário se o perfil não existe para evitar estado inconsistente
                    await logout();
                    return;
                }

                currentUser = {
                    ...session.user,
                    ...profile,
                    role: profile.role || 'staff' // Prioriza o perfil, fallback para 'staff'
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
    authUnsubscribe = data.subscription;
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
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) throw error;

        const profile = await getUserProfile(data.user.id);

        if (!profile) {
            console.error('Perfil não encontrado para o usuário:', data.user.id);
            throw new Error('Perfil de usuário não encontrado. Acesso negado.');
        }

        // Atualiza o usuario atual com os dados do perfil
        currentUser = {
            ...data.user,
            ...profile,
            role: profile.role || 'staff' // Prioriza o cargo do perfil
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
        const { error } = await supabase.auth.signOut();

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
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Erro ao verificar sessão:', error);
            return {isAuthenticated: false};
        }

        if (session?.user) {
            // Se há uma sessão ativa, busca os dados completos do usuario
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return {isAuthenticated: false};
            }

            const profile = await getUserProfile(user.id);

            if (!profile) {
                console.error('Perfil não encontrado para o usuário:', user.id);
                // Se não há perfil, a sessão pode ser inválida, então limpamos.
                await logout();
                return { isAuthenticated: false };
            }

            // Atualiza o usuario atual
            currentUser = {
                ...user,
                ...profile,
                role: profile.role || 'staff' // Prioriza o cargo do perfil
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
    if (!user) {
        user = getCurrentUser();
    }

    if (!user) return false;

    // 1. Acesso de Diretor (acesso total)
    if (user.role === 'director') return true;

    // 2. Verificar permissões personalizadas do usuário
    if (user.tabAccess && user.tabAccess[tabId]) {
        const userAccessLevel = user.tabAccess[tabId];
        if (requiredAccess === 'view') {
            // Se o usuário tem permissão de 'view' ou 'edit', ele pode visualizar.
            return userAccessLevel === 'view' || userAccessLevel === 'edit';
        }
        if (requiredAccess === 'edit') {
            // Apenas a permissão 'edit' concede acesso de edição.
            return userAccessLevel === 'edit';
        }
    }

    // 3. Fallback para permissões padrão baseadas no cargo (role)
    const defaultTabPermissions = {
        'cadastro': { view: ['director', 'coordinator', 'professional', 'staff', 'receptionist'], edit: ['director', 'coordinator', 'receptionist'] },
        'agenda': { view: ['director', 'coordinator', 'professional', 'staff', 'receptionist'], edit: ['director', 'coordinator', 'professional', 'receptionist'] },
        'historico': { view: ['director', 'coordinator', 'professional', 'staff', 'receptionist'], edit: ['director', 'coordinator'] },
        'meus-pacientes': { view: PROFESSIONAL_ROLES, edit: PROFESSIONAL_ROLES },
        'relatorios': { view: ['director', 'financeiro', 'coordinator'], edit: ['director'] },
        'financeiro': { view: ['director', 'financeiro'], edit: ['director', 'financeiro'] },
        'estoque': { view: ['director', 'financeiro', 'staff', 'coordinator'], edit: ['director', 'financeiro', 'coordinator'] },
        'funcionarios': { view: ['director', 'coordinator'], edit: ['director'] },
        'documentos': { view: ['director', 'coordinator'], edit: ['director', 'coordinator'] }
    };

    if (!defaultTabPermissions[tabId]) {
        console.warn(`Aba '${tabId}' não encontrada no mapeamento de permissões padrão.`);
        return false;
    }

    const requiredRoles = defaultTabPermissions[tabId][requiredAccess] || [];
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
            id: userId,
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
    return hasAnyRole(user, PROFESSIONAL_ROLES);
};

// Inicializa a autenticação quando o módulo for carregado
initAuth();

// Exporta as funções auxiliares para uso em outros módulos
export {
    hasAnyRole,
};

// Função para obter o perfil do usuário
async function getUserProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null; // Retorna null em caso de erro para ser tratado
    }
    return data;
}