// Configuração e autenticação do Supabase
import {createClient} from '@supabase/supabase-js';

// Configuração do cliente Supabase
console.log('Inicializando cliente Supabase...');

// Usar as variáveis de ambiente do Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = 'Erro: Variáveis de ambiente do Supabase não encontradas!\n' +
                   'Certifique-se de que as seguintes variáveis estão definidas no arquivo .env:\n' +
                   'VITE_SUPABASE_URL=seu_url_do_supabase\n' +
                   'VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase';
    
    console.error(errorMsg);
    throw new Error(errorMsg);
}

console.log('Variáveis de ambiente do Supabase encontradas!');
console.log('URL do Supabase:', supabaseUrl);
console.log('Chave Anônima do Supabase:', supabaseAnonKey ? '***' + supabaseAnonKey.slice(-4) : 'Não definida');

console.log('Criando instância do cliente Supabase...');
// Cria e exporta a instância do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

// =============================================
// Funções de Autenticação
// =============================================

/**
 * Função para fazer login com email e senha
 * @param {string} email - Email do usuario
 * @param {string} password - Senha do usuario
 * @returns {Promise<Object>} Dados do usuario e sessão
 */
export const signIn = async (email, password) => {
    try {
        const {data, error} = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // Busca o perfil do usuario após o login
        const userFuncionario = await getUserFuncionario(data.user.id);

        return {
            user: {...data.user, ...userFuncionario},
            session: data.session
        };
    } catch (error) {
        console.error('Erro ao fazer login:', error.message);
        throw error;
    }
};

/**
 * Função para fazer logout do usuario
 * @returns {Promise<void>}
 */
export const signOut = async () => {
    try {
        const {error} = await supabase.auth.signOut();
        if (error) throw error;

        // Limpa os dados do usuario do localStorage
        localStorage.removeItem('currentUser');
        console.log('Logout realizado com sucesso');
    } catch (error) {
        console.error('Erro ao fazer logout:', error.message);
        throw error;
    }
};

/**
 * Obtém a sessão atual do usuario
 * @returns {Promise<Object>} Sessão atual do usuario
 */
export const getCurrentSession = async () => {
    try {
        const {data, error} = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    } catch (error) {
        console.error('Erro ao obter sessão:', error.message);
        throw error;
    }
};

/**
 * Obtém o usuario atualmente autenticado
 * @returns {Promise<Object>} Dados do usuario autenticado
 */
export const getCurrentUser = async () => {
    try {
        const {data: {user}, error} = await supabase.auth.getUser();
        if (error) throw error;

        if (user) {
            // Busca o perfil do usuario
            const userFuncionario = await getUserFuncionario(user.id);
            return {...user, ...userFuncionario};
        }

        return null;
    } catch (error) {
        console.error('Erro ao obter usuario:', error.message);
        return null;
    }
};

/**
 * Obtém o perfil do usuário a partir do banco de dados
 * @param {string} userEmail - Email do usuário
 * @returns {Promise<Object>} Perfil do usuário
 */
export const getUserFuncionario = async (userEmail) => {
    if (!userEmail) {
        console.error('Email não fornecido para buscar o perfil do funcionário');
        return null;
    }

    console.log(`Buscando perfil do funcionário para o email: ${userEmail}`);
    
    try {
        const { data, error } = await supabase
            .from('funcionarios')
            .select('*')
            .eq('email', userEmail)
            .maybeSingle();
            
        if (error) {
            console.error('Erro ao buscar funcionário por email:', error);
            return null;
        }

        if (!data) {
            console.error('Nenhum perfil encontrado para o email:', userEmail);
            return null;
        }

        console.log('Perfil do funcionário encontrado:', data);
        return data;

    } catch (error) {
        console.error('Erro ao buscar perfil do funcionário:', error);
        return null;
    }
};

/**
 * Verifica se o usuario tem uma determinada função
 * @param {Object} user - Objeto do usuario
 * @param {string|Array} roles - Função ou array de funções permitidas
 * @returns {boolean} Verdadeiro se o usuario tiver a função
 */
export const hasRole = (user, roles) => {
    if (!user || !user.role) return false;
    if (Array.isArray(roles)) {
        return roles.includes(user.role);
    }
    return user.role === roles;
};

/**
 * Verifica se o usuario tem permissão para acessar uma aba específica
 * @param {Object} user - Objeto do usuario
 * @param {string} tabId - ID da aba
 * @param {string} requiredAccess - Nível de acesso necessário ('view' ou 'edit')
 * @returns {boolean} Verdadeiro se o usuario tiver permissão
 */
export const checkTabAccess = (user, tabId, requiredAccess = 'view') => {
    if (!user) return false;

    // Mapeamento de permissões para cada aba
    const tabPermissions = {
        'tab-cadastro': {
            view: ['director', 'coordinator', 'professional', 'staff'],
            edit: ['director', 'coordinator', 'professional']
        },
        'tab-agenda': {
            view: ['director', 'coordinator', 'professional', 'staff'],
            edit: ['director', 'coordinator', 'professional']
        },
        'tab-historico': {
            view: ['director', 'coordinator', 'professional', 'staff'],
            edit: ['director', 'coordinator', 'professional']
        },
        'tab-relatorios': {
            view: ['director', 'financeiro'],
            edit: ['director']
        },
        'tab-financeiro': {
            view: ['director', 'financeiro'],
            edit: ['director', 'financeiro']
        },
        'tab-estoque': {
            view: ['director', 'financeiro', 'staff'],
            edit: ['director', 'financeiro']
        },
        'tab-funcionarios': {
            view: ['director', 'coordinator'],
            edit: ['director']
        }
    };

    // Verifica se a aba existe no mapeamento
    if (!tabPermissions[tabId]) return false;

    // Obtém as permissões necessárias para o nível de acesso solicitado
    const requiredRoles = tabPermissions[tabId][requiredAccess] || [];

    // Se o usuario for administrador, tem acesso a tudo
    if (user.role === 'director') return true;

    // Verifica se o usuario tem alguma das funções necessárias
    return requiredRoles.includes(user.role);
};

/**
 * Inscreve-se para receber atualizações do estado de autenticação
 * @param {Function} callback - Função de callback que será chamada quando o estado mudar
 * @returns {Object} Objeto com o método para cancelar a inscrição
 */
export const onAuthStateChange = (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
        console.log('Mudança no estado de autenticação:', event);
        callback(event, session);
    });
};

/**
 * Função para atualizar o perfil do usuario
 * @param {string} userId - ID do usuario
 * @param {Object} updates - Campos para atualizar
 * @returns {Promise<Object>} Dados atualizados do usuario
 */
export const updateUserFuncionario = async (userId, updates) => {
    try {
        const {data, error} = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao atualizar perfil do usuario:', error.message);
        throw error;
    }
};

// =============================================
// Funções de Gerenciamento de Usuarios
// =============================================

/**
 * Busca todos os usuarios (apenas para administradores)
 * @returns {Promise<Array>} Lista de usuarios
 */
export const getAllUsers = async () => {
    try {
        const {data, error} = await supabase
            .from('users')
            .select('*');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao buscar usuarios:', error.message);
        return [];
    }
};

// =============================================
// Funções de Gerenciamento de Tarefas (Todos)
// =============================================

/**
 * Busca todas as tarefas
 * @returns {Promise<Array>} Lista de tarefas
 */
export const getTodos = async () => {
    try {
        const {data, error} = await supabase
            .from('todos')
            .select('*');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao buscar tarefas:', error.message);
        return [];
    }
};

/**
 * Adiciona uma nova tarefa
 * @param {Object} todo - Objeto contendo os dados da tarefa
 * @returns {Promise<Object>} Tarefa criada
 */
export const addTodo = async (todo) => {
    try {
        const {data, error} = await supabase
            .from('todos')
            .insert([
                {
                    title: todo.title,
                    completed: false,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao adicionar tarefa:', error.message);
        throw error;
    }
};

/**
 * Atualiza uma tarefa existente
 * @param {string} id - ID da tarefa
 * @param {Object} updates - Campos para atualizar
 * @returns {Promise<Object>} Tarefa atualizada
 */
export const updateTodo = async (id, updates) => {
    try {
        const {data, error} = await supabase
            .from('todos')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao atualizar tarefa:', error.message);
        throw error;
    }
};

/**
 * Remove uma tarefa
 * @param {string} id - ID da tarefa
 * @returns {Promise<boolean>} True se a exclusão for bem-sucedida
 */
export const deleteTodo = async (id) => {
    try {
        const {error} = await supabase
            .from('todos')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Erro ao excluir tarefa:', error.message);
        throw error;
    }
};
