// Employee management module
import {supabase} from './supabase.js';
import {showNotification} from './ui.js';
import {
    getCurrentUser,
    isRoleAllowed,
    checkTabAccess,
} from './auth.js';
import {DIRECTOR_ONLY, COORDINATOR_AND_HIGHER, ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES} from './roles.js';
import {db, saveDb} from './database.js';

// --- Constants ---
const allSystemTabs = [
    {id: 'cadastro', label: 'Cadastrar Cliente'},
    {id: 'agenda', label: 'Agenda do Dia'},
    {id: 'historico', label: 'Todos os pacientes'},
    {id: 'meus-pacientes', label: 'Meus Pacientes'},
    {id: 'financeiro', label: 'Financeiro'},
    {id: 'relatorios', label: 'Relatórios'},
    {id: 'estoque', label: 'Estoque'},
    {id: 'funcionarios', label: 'Funcionários'},
    {id: 'documentos', label: 'Mural do Coordenador'}
];


// --- Helper Rendering Functions (Top Level) ---

/**
 * Renders the standard view for non-director users.
 */
function renderSimpleFuncionarioView(funcionarios, container) {
    container.innerHTML = '';
    container.classList.remove('permissions-grid');

    funcionarios.forEach(func => {
        const card = document.createElement('div');
        card.className = 'client-card';
        card.dataset.funcionarioId = func.id;

        const clientsAssignedCount = db.clients.filter(client =>
            client.assignedProfessionalId === func.id
        ).length;

        const customRole = db.roles.find(r => r.id === func.role);
        const roleDisplayText = customRole ? customRole.name : (func.role || 'N/A');

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <h3>${func.name}</h3>
                <span style="background: var(--secondary-color); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold;">${roleDisplayText}</span>
            </div>
            <p><strong>Email:</strong> ${func.email || 'N/A'}</p>
            <p><strong>Celular:</strong> ${func.phone || 'N/A'}</p>
            <p><strong>Pacientes Vinculados:</strong> ${clientsAssignedCount}</p>
        `;
        card.addEventListener('click', () => showFuncionarioDetails(func.id));
        container.appendChild(card);
    });
}

/**
 * Renders the detailed permissions view for directors.
 */
function renderPermissionsView(funcionarios, container, isSelfView = false) {
    if (!isSelfView) {
        container.innerHTML = ''; // Clear only if it's not the self-view being appended
    }
    container.className = 'permissions-grid';

    const currentUser = getCurrentUser();

    funcionarios.forEach(user => {
        const isSelf = user.id === currentUser.id;
        const card = document.createElement('div');
        card.className = 'permission-card';

        const customRole = db.roles.find(r => r.id === user.role);
        const roleDisplayText = customRole ? customRole.name : (user.role || 'N/A');

        card.innerHTML = `
            <div class="permission-card-header">
                <h3>${user.name}</h3>
                <span class="role-badge">${roleDisplayText}</span>
            </div>
            <div class="permission-access-container">
                <div id="tab-permissions-for-user-${user.id}" class="user-tab-permissions-container"></div>
            </div>
            <div class="permission-card-actions">
                <button class="btn-secondary btn-view-details"><i class="fa-solid fa-eye"></i> Ver Detalhes</button>
                <button class="btn-primary btn-save-permissions" ${isSelf ? 'disabled title="Você não pode alterar suas próprias permissões aqui."' : ''}><i class="fa-solid fa-save"></i> Salvar Permissões</button>
            </div>
        `;

        card.querySelector('.btn-view-details').addEventListener('click', () => showFuncionarioDetails(user.id));
        if (!isSelf) {
            card.querySelector('.btn-save-permissions').addEventListener('click', () => saveUserPermissions(user.id));
        }

        container.appendChild(card);
        populateTabPermissions(`tab-permissions-for-user-${user.id}`, user.tabAccess || {}, isSelf, user.role);
    });
}


/**
 * Populates the role filter dropdown with available roles.
 */
function populateFuncionarioRoleFilter() {
    const roleFilterSelect = document.getElementById('funcionario-role-filter');
    if (!roleFilterSelect) return;

    const currentFilterValue = roleFilterSelect.value;
    const roleMap = {
        'director': 'Diretoria',
        'coordinator': 'Coordenação',
        'professional': 'Profissional',
        'staff': 'Apoio',
        'financeiro': 'Financeiro'
    };
    const predefinedRoles = Object.keys(roleMap);
    const customRoleIds = db.roles.filter(r => r.isCustom).map(r => r.id);
    const allAvailableRoles = [...new Set([...predefinedRoles, ...customRoleIds])];

    allAvailableRoles.sort((a, b) => {
        const roleA = db.roles.find(r => r.id === a)?.name || roleMap[a] || a;
        const roleB = db.roles.find(r => r.id === b)?.name || roleMap[b] || b;
        return roleA.localeCompare(roleB);
    });

    roleFilterSelect.innerHTML = '<option value="all">Todos os Cargos</option>';
    allAvailableRoles.forEach(roleId => {
        const option = document.createElement('option');
        option.value = roleId;
        const customRole = db.roles.find(r => r.id === roleId);
        option.textContent = customRole ? customRole.name : (roleMap[roleId] || roleId);
        roleFilterSelect.appendChild(option);
    });

    if (Array.from(roleFilterSelect.options).some(opt => opt.value === currentFilterValue)) {
        roleFilterSelect.value = currentFilterValue;
    } else {
        roleFilterSelect.value = 'all';
    }
}

// --- Exported Functions ---

/**
 * Main function to render the list of employees based on filters and user role.
 */
export async function renderFuncionarioList(filter = '', roleFilter = 'all') {
    const funcionarioListContainer = document.getElementById('funcionario-list-container');
    if (!funcionarioListContainer) return;

    funcionarioListContainer.innerHTML = '<p>Carregando funcionários...</p>';
    populateFuncionarioRoleFilter();

    if (!checkTabAccess('funcionarios', 'view')) {
        funcionarioListContainer.innerHTML = '<p>Você não tem permissão para visualizar a lista de funcionários.</p>';
        return;
    }

    const isDirector = isRoleAllowed(DIRECTOR_ONLY);
    const permissionsInfo = document.getElementById('permissions-view-info');
    if (permissionsInfo) {
        permissionsInfo.style.display = isDirector ? 'flex' : 'none';
    }

    try {
        const {data: users, error} = await supabase.from('users').select('*');
        if (error) throw error;

        if (!users || users.length === 0) {
            funcionarioListContainer.innerHTML = '<p>Nenhum funcionário cadastrado ainda.</p>';
            return;
        }

        const lowerCaseFilter = filter.toLowerCase();
        let filteredFuncionarios = users.filter(user => {
            const nameMatch = user.name && user.name.toLowerCase().includes(lowerCaseFilter);
            const roleMatch = roleFilter === 'all' || user.role === roleFilter;
            return nameMatch && roleMatch;
        });

        const currentUser = getCurrentUser();
        let directorSelf = null;
        if (isDirector && currentUser) {
            directorSelf = filteredFuncionarios.find(user => user.id === currentUser.id);
            filteredFuncionarios = filteredFuncionarios.filter(user => user.id !== currentUser.id);
        }

        if (filteredFuncionarios.length === 0 && !directorSelf) {
            funcionarioListContainer.innerHTML = '<p>Nenhum funcionário encontrado com os filtros aplicados.</p>';
            return;
        }

        if (isDirector) {
            // Render other users first, then append the director's own card
            renderPermissionsView(filteredFuncionarios, funcionarioListContainer);
            if (directorSelf) {
                renderPermissionsView([directorSelf], funcionarioListContainer, true);
            }
        } else {
            renderSimpleFuncionarioView(filteredFuncionarios, funcionarioListContainer);
        }

    } catch (error) {
        console.error('Erro ao renderizar lista de funcionários:', error);
        funcionarioListContainer.innerHTML = '<p>Ocorreu um erro ao carregar os funcionários. Tente novamente.</p>';
    }
}

/**
 * Saves the permissions for a specific user.
 */
export function saveUserPermissions(userId) {
    if (!isRoleAllowed(DIRECTOR_ONLY)) {
        showNotification('Você não tem permissão para alterar permissões.', 'error');
        return;
    }

    const user = db.users.find(u => u.id === userId);
    if (!user) {
        showNotification('Usuário não encontrado.', 'error');
        return;
    }

    const currentUser = getCurrentUser();
    if (user.id === currentUser.id) {
        showNotification('Você não pode alterar suas próprias permissões aqui.', 'warning');
        return;
    }

    const newTabAccess = {};
    let hasCustomAccess = false;

    allSystemTabs.forEach(tab => {
        const selectElement = document.getElementById(`tab-permissions-for-user-${userId}-${tab.id}-select`);
        if (selectElement) {
            const accessLevel = selectElement.value;
            if (accessLevel !== 'default') {
                newTabAccess[tab.id] = accessLevel;
                hasCustomAccess = true;
            }
        }
    });

    user.tabAccess = hasCustomAccess ? newTabAccess : null;
    saveDb();
    showNotification(`Permissões de ${user.name} atualizadas com sucesso!`, 'success');
    renderFuncionarioList();
}

/**
 * Shows the details modal for a specific employee.
 */
export function showFuncionarioDetails(funcionarioId) {
    if (!checkTabAccess('funcionarios', 'view')) {
        showNotification('Você não tem permissão para visualizar detalhes de funcionários.', 'error');
        return;
    }

    const funcionario = db.users.find(f => f.id === funcionarioId);
    if (!funcionario) {
        showNotification('Funcionário não encontrado.', 'error');
        return;
    }

    // Logic to populate and show a modal with employee details
    // This part needs to be implemented based on your modal's HTML structure
    console.log('Showing details for:', funcionario);
    alert(`Detalhes de ${funcionario.name}`);
}

/**
 * Shows the modal for editing an employee's details.
 */
export function showEditFuncionarioModal(funcionarioId) {
    // TODO: Implementar a lógica para buscar o funcionário e preencher um modal de edição.
    console.log(`Editando funcionário com ID: ${funcionarioId}`);
    alert(`Placeholder para editar o funcionário ${funcionarioId}.`);
}

/**
 * Saves changes made to an employee's details.
 */
export function saveFuncionarioChanges(funcionarioId) {
    // TODO: Implementar a lógica para ler os dados do formulário e salvar no banco de dados.
    console.log(`Salvando alterações para o funcionário com ID: ${funcionarioId}`);
    alert(`Placeholder para salvar as alterações do funcionário ${funcionarioId}.`);
}

/**
 * Shows a confirmation and then deletes an employee.
 */
export function deleteFuncionario(funcionarioId) {
    // TODO: Implementar a lógica para confirmar e excluir o funcionário do banco de dados.
    console.log(`Excluindo funcionário com ID: ${funcionarioId}`);
    if (confirm('Tem certeza que deseja excluir este funcionário?')) {
        alert(`Placeholder para excluir o funcionário ${funcionarioId}.`);
    }
}

/**
 * Shows the modal for adding a new employee.
 */
export function addFuncionario() {
    // TODO: Implementar a lógica para mostrar um modal de adição de funcionário.
    console.log('Adicionando novo funcionário');
    alert('Placeholder para adicionar novo funcionário.');
}

/**
 * Shows the modal for editing a user's password.
 */
export function showEditPasswordModal(userId) {
    // TODO: Implementar a lógica para mostrar um modal de edição de senha.
    console.log(`Editando senha para o usuário com ID: ${userId}`);
    alert(`Placeholder para editar a senha do usuário ${userId}.`);
}