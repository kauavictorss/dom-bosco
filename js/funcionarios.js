// Employee management module
import {db, saveDb} from './database.js';
import {showNotification, updateGlobalSearchDatalist} from './ui.js';
import {
    getCurrentUser,
    isRoleAllowed,
    DIRECTOR_ONLY,
    PROFESSIONAL_ROLES,
    checkTabAccess
} from './auth.js'; // Import hasEditAccess
import {showClientDetails} from './clients.js'; // Import showClientDetails to re-render client modal
import {formatDuration} from './utils.js'; // Import duration formatting utility

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

function populateFuncionarioRoleFilter() {
    const roleFilterSelect = document.getElementById('funcionario-role-filter');
    if (!roleFilterSelect) return;

    const currentFilterValue = roleFilterSelect.value;

    const roleMap = {
        'director': 'Diretoria',
        'coordinator_madre': 'Coordenador(a) Madre',
        'coordinator_floresta': 'Coordenador(a) Floresta',
        'staff': 'Funcionário(a) Geral',
        'receptionist': 'Recepcionista',
        'psychologist': 'Psicólogo(a)',
        'psychopedagogue': 'Psicopedagogo(a)',
        'musictherapist': 'Musicoterapeuta',
        'speech_therapist': 'Fonoaudiólogo(a)',
        'nutritionist': 'Nutricionista',
        'physiotherapist': 'Fisioterapeuta',
        'financeiro': 'Financeiro'
    };

    // NEW LOGIC: Get all roles from roleMap and custom roles from db.roles
    const predefinedRoles = Object.keys(roleMap);
    const customRoleIds = db.roles.filter(r => r.isCustom).map(r => r.id);
    const allAvailableRoles = [...new Set([...predefinedRoles, ...customRoleIds])];

    // Sort roles for display
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
        option.textContent = customRole ? customRole.name : (roleMap[roleId] || roleId); // Use custom name, then mapped name, then raw role ID
        roleFilterSelect.appendChild(option);
    });

    // Restore the previously selected filter if it still exists in the new options
    if (Array.from(roleFilterSelect.options).some(opt => opt.value === currentFilterValue)) {
        roleFilterSelect.value = currentFilterValue;
    } else {
        roleFilterSelect.value = 'all';
    }
}

export async function renderFuncionarioList(filter = '', roleFilter = 'all') {
    const funcionarioListContainer = document.getElementById('funcionario-list-container');
    if (!funcionarioListContainer) return;

    // Exibe um indicador de carregamento
    funcionarioListContainer.innerHTML = '<p>Carregando funcionários...</p>';

    // Popula o dropdown de filtro de funções
    populateFuncionarioRoleFilter();

    // Verifica se o usuário tem permissão para visualizar a lista de funcionários
    if (!checkTabAccess('funcionarios', 'view')) {
        funcionarioListContainer.innerHTML = '<p>Você não tem permissão para visualizar a lista de funcionários.</p>';
        const permissionsInfo = document.getElementById('permissions-view-info');
        if (permissionsInfo) {
            permissionsInfo.style.display = 'none';
        }
        return;
    }

    const isDirector = isRoleAllowed(DIRECTOR_ONLY);
    const permissionsInfo = document.getElementById('permissions-view-info');
    if (permissionsInfo) {
        permissionsInfo.style.display = isDirector ? 'flex' : 'none';
    }

    try {
        // Busca todos os usuários do Supabase
        const {data: users, error} = await supabase
            .from('users')
            .select('*');

        if (error) throw error;

        // Se não houver usuários, exibe mensagem
        if (!users || users.length === 0) {
            funcionarioListContainer.innerHTML = '<p>Nenhum funcionário cadastrado ainda.</p>';
            return;
        }

        funcionarioListContainer.innerHTML = '';
        const lowerCaseFilter = filter.toLowerCase();

        // Filtra os usuários com base no filtro de texto e função
        let filteredFuncionarios = users.filter(user => {
            const nameMatch = user.name && user.name.toLowerCase().includes(lowerCaseFilter);
            const roleMatch = roleFilter === 'all' || user.role === roleFilter;
            return nameMatch && roleMatch;
        });

        // Separa o diretor atual da lista se estiver presente
        const currentUser = getCurrentUser();
        let directorSelf = null;
        if (isDirector && currentUser) {
            directorSelf = filteredFuncionarios.find(user => user.id === currentUser.id);
            filteredFuncionarios = filteredFuncionarios.filter(user => user.id !== currentUser.id);
        }

        if (filteredFuncionarios.length === 0) {
            let message = 'Nenhum funcionário encontrado.';
            if (filter === '' && roleFilter === 'all') {
                message = 'Nenhum funcionário cadastrado ainda.';
            }

            if (directorSelf) {
                // Se o diretor for o único ou nenhum outro corresponder ao filtro, mostra o próprio cartão desabilitado
                renderPermissionsView([directorSelf], true); // Passa true para indicar visualização própria/estado desabilitado
                return;
            }

            // Se não houver funcionários e não for o diretor, exibe a mensagem
            funcionarioListContainer.innerHTML = `<p>${message}</p>`;
            return;
        }
        funcionarioListContainer.innerHTML = `<p>${message}</p>`;
        return;
    } catch (error) {

        // Always render permissions view for director
        if (isDirector) {
            // If director is viewing, render everyone else, then potentially their own card
            renderPermissionsView(filteredFuncionarios);
            if (directorSelf) {
                renderPermissionsView([directorSelf], true); // Render director's card disabled, appended to the list
            }
        } else {
            renderSimpleFuncionarioView(filteredFuncionarios);
        }
    }

    function renderSimpleFuncionarioView(funcionarios) {
        const funcionarioListContainer = document.getElementById('funcionario-list-container');
        funcionarioListContainer.classList.remove('permissions-grid'); // Ensure correct class

        funcionarios.forEach(func => {
            const card = document.createElement('div');
            card.className = 'client-card'; // Reusing client-card style for consistency
            card.dataset.funcionarioId = func.id;

            const clientsAssignedCount = db.clients.filter(client =>
                client.assignedProfessionalId === func.id
            ).length;

            const roleText = {
                'staff': 'Funcionário(a) Geral',
                'intern': 'Estagiário(a)',
                'director': 'Diretoria',
                'coordinator_madre': 'Coordenador(a) Madre',
                'coordinator_floresta': 'Coordenador(a) Floresta',
                'musictherapist': 'Musicoterapeuta',
                'financeiro': 'Financeiro',
                'receptionist': 'Recepcionista',
                'psychologist': 'Psicólogo(a)',
                'psychopedagogue': 'Psicopedagogo(a)',
                'speech_therapist': 'Fonoaudiólogo(a)',
                'nutritionist': 'Nutricionista',
                'physiotherapist': 'Fisioterapeuta'
            }[func.role] || func.role; // Fallback to raw role if not in map

            const customRole = db.roles.find(r => r.id === func.role);
            const roleDisplayText = customRole ? customRole.name : (roleText || func.role);

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
            funcionarioListContainer.appendChild(card);
        });
    }

    function renderPermissionsView(funcionarios, isSelfView = false) {
        const funcionarioListContainer = document.getElementById('funcionario-list-container');
        // If it's a self-view being added to an existing list, don't clear the container
        if (!isSelfView) {
            funcionarioListContainer.innerHTML = ''; // Clear only if starting a fresh list
        }
        funcionarioListContainer.className = 'permissions-grid';

        const currentUser = getCurrentUser();

        funcionarios.forEach(user => {
            const isSelf = user.id === currentUser.id; // Still check for self to disable button
            const card = document.createElement('div');
            card.className = 'permission-card';

            const roleText = {
                'staff': 'Funcionário(a) Geral',
                'intern': 'Estagiário(a)',
                'director': 'Diretoria',
                'coordinator_madre': 'Coordenador(a) Madre',
                'coordinator_floresta': 'Coordenador(a) Floresta',
                'musictherapist': 'Musicoterapeuta',
                'financeiro': 'Financeiro',
                'receptionist': 'Recepcionista',
                'psychologist': 'Psicólogo(a)',
                'psychopedagogue': 'Psicopedagogo(a)',
                'speech_therapist': 'Fonoaudiólogo(a)',
                'nutritionist': 'Nutricionista',
                'physiotherapist': 'Fisioterapeuta'
            }[user.role] || user.role; // Fallback to raw role if not in map

            const customRole = db.roles.find(r => r.id === user.role);
            const roleDisplayText = customRole ? customRole.name : (roleText || user.role);

            card.innerHTML = `
            <div class="permission-card-header">
                <h3>${user.name}</h3>
                <span class="role-badge">${roleDisplayText}</span>
            </div>
            <div class="permission-access-container">
                <!-- Tab permissions will be populated here by populateTabPermissions -->
                <div id="tab-permissions-for-user-${user.id}" class="user-tab-permissions-container"></div>
            </div>
            <div class="permission-card-actions">
                <button class="btn-secondary" onclick="window.showFuncionarioDetails(${user.id})"><i class="fa-solid fa-eye"></i> Ver Detalhes</button>
                <button class="btn-primary" onclick="window.saveUserPermissions(${user.id})" ${isSelf ? 'disabled title="Você não pode alterar suas próprias permissões aqui. Use a interface de edição de perfil se necessário para outras informações de perfil."' : ''}><i class="fa-solid fa-save"></i> Salvar Permissões</button>
            </div>
        `;
            funcionarioListContainer.appendChild(card);

            // Populate the specific tab permissions for this user, disabling if it's the current user
            populateTabPermissions(`tab-permissions-for-user-${user.id}`, user.tabAccess || {}, isSelf, user.role);
        });
    }

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
            showNotification('Você não pode alterar suas próprias permissões diretamente aqui. Por favor, edite outras informações do perfil, se aplicável.', 'warning');
            return;
        }

        const newTabAccess = {};
        let hasCustomAccess = false;

        allSystemTabs.forEach(tab => {
            const selectElement = document.getElementById(`tab-permissions-for-user-${userId}-${tab.id}-select`);
            if (selectElement) {
                const accessLevel = selectElement.value;
                if (accessLevel !== 'default') { // 'default' means no custom override, rely on role
                    newTabAccess[tab.id] = accessLevel;
                    hasCustomAccess = true;
                }
            }
        });

        // Ensure consistent key order for stringify comparison
        const newAccessString = JSON.stringify(newTabAccess, Object.keys(newTabAccess).sort());
        const oldAccessObject = user.tabAccess || {};
        const oldAccessString = JSON.stringify(oldAccessObject, Object.keys(oldAccessObject).sort());

        if (newAccessString !== oldAccessString) {
            if (!user.changeHistory) {
                user.changeHistory = [];
            }
            user.changeHistory.push({
                id: db.nextChangeId++,
                date: new Date().toISOString(),
                changedBy: getCurrentUser().name,
                changes: [{
                    field: 'Permissões de Aba',
                    oldValue: oldAccessString === '{}' ? 'Padrão do Cargo' : oldAccessString,
                    newValue: newAccessString === '{}' ? 'Padrão do Cargo' : newAccessString
                }]
            });

            user.tabAccess = hasCustomAccess ? newTabAccess : null;
            saveDb();
            showNotification(`Permissões de ${user.name} atualizadas com sucesso!`, 'success');
            renderFuncionarioList();
        } else {
            showNotification('Nenhuma alteração de permissão foi feita.', 'info');
        }
    }

    export function showFuncionarioDetails(funcionarioId) {
        // Check if the current user has view access to the 'funcionarios' tab
        if (!checkTabAccess('funcionarios', 'view')) {
            showNotification('Você não tem permissão para visualizar detalhes de funcionários.', 'error');
            return;
        }

        const allUserRoles = ['director', 'coordinator_madre', 'coordinator_floresta', 'staff', 'intern', 'musictherapist', 'financeiro', 'receptionist', 'psychologist', 'psychopedagogue', 'speech_therapist', 'nutritionist', 'physiotherapist']; // All possible predefined roles
        // Find the user, allowing for custom roles not in the `allUserRoles` list
        const funcionario = db.users.find(u => u.id === funcionarioId);
        if (!funcionario) {
            showNotification('Funcionário não encontrado.', 'error');
            return;
        }

        window.currentFuncionarioId = funcionarioId;

        document.getElementById('modal-nome-funcionario').textContent = funcionario.name;
        document.getElementById('funcionario-modal-nome-completo').textContent = funcionario.name;
        document.getElementById('funcionario-modal-cpf').textContent = funcionario.cpf || 'N/A';
        document.getElementById('funcionario-modal-celular').textContent = funcionario.phone || 'N/A';
        document.getElementById('funcionario-modal-email').textContent = funcionario.email || 'N/A';
        document.getElementById('funcionario-modal-endereco').textContent = funcionario.address || 'N/A';

        const academicInfo = document.getElementById('funcionario-academic-info');
        // Check if the user's role is one of the predefined professional roles, or if they have academic info
        if (PROFESSIONAL_ROLES.includes(funcionario.role) || (funcionario.academicInfo && Object.keys(funcionario.academicInfo).some(key => funcionario.academicInfo[key]))) {
            document.getElementById('funcionario-modal-instituicao').textContent = (funcionario.academicInfo && funcionario.academicInfo.institution) || 'N/A';
            document.getElementById('funcionario-modal-periodo').textContent = (funcionario.academicInfo && funcionario.academicInfo.graduationPeriod) || 'N/A';
            document.getElementById('funcionario-modal-formacao').textContent = (funcionario.academicInfo && funcionario.academicInfo.education) || 'N/A';
            document.getElementById('funcionario-modal-disciplina').textContent = (funcionario.academicInfo && funcionario.academicInfo.discipline) || 'N/A';
            academicInfo.style.display = 'block';
        } else {
            academicInfo.style.display = 'none';
        }

        renderFuncionarioActivity(funcionario);
        renderFuncionarioChangeHistory(funcionario.changeHistory || []);

        document.getElementById('modal-detalhes-funcionario').style.display = 'flex';

        // Director can edit any employee (except their own permissions in grid, but full edit in modal)
        const canEditDirector = isRoleAllowed(DIRECTOR_ONLY);
        // Check if the current user has 'edit' access to the 'funcionarios' tab
        const canEditFuncionarioTab = checkTabAccess('funcionarios', 'edit');

        // Show/hide "Alterar Senha" button based on edit permission for the tab and if the user is a director
        const editPasswordButton = document.getElementById('btn-edit-funcionario-password');
        if (editPasswordButton) {
            editPasswordButton.style.display = canEditFuncionarioTab && canEditDirector ? 'inline-flex' : 'none';
        }

        // Show/hide "Editar Dados" button based on edit permission for the tab
        const editFuncionarioButton = document.getElementById('btn-edit-funcionario');
        if (editFuncionarioButton) {
            editFuncionarioButton.style.display = canEditFuncionarioTab ? 'inline-flex' : 'none';
        }

        // Show/hide "Excluir Funcionário" button based on edit permission for the tab and if the user is a director
        const deleteFuncionarioButton = document.getElementById('btn-delete-funcionario');
        if (deleteFuncionarioButton) {
            deleteFuncionarioButton.style.display = canEditFuncionarioTab && canEditDirector ? 'inline-flex' : 'none';
        }
    }

    function renderFuncionarioActivity(professional) {
        const activityContainer = document.getElementById('funcionario-activity-details');
        activityContainer.innerHTML = '';

        // Calculate Statistics
        const attendedAppointments = [];
        db.clients.forEach(client => {
            if (client.appointments) {
                client.appointments.forEach(app => {
                    // Match appointment to professional by ID if possible, otherwise by name
                    const attendedByUser = db.users.find(u => u.name === app.attendedBy);
                    if (attendedByUser && attendedByUser.id === professional.id) {
                        attendedAppointments.push({...app, clientName: client.name, clientId: client.id});
                    }
                });
            }
        });

        const appointmentsCount = attendedAppointments.length;
        const totalHoursAttended = attendedAppointments.reduce((total, app) => total + (app.durationHours || 0), 0);
        const assignedClients = db.clients.filter(client =>
            client.assignedProfessionalId === professional.id
        );

        // Render Stats Cards
        const statsHtml = `
        <div class="intern-metrics" style="margin-bottom: 24px;">
            <div class="metric">
                <i class="fa-solid fa-users"></i>
                <span>Pacientes Vinculados</span>
                <strong>${assignedClients.length}</strong>
            </div>
            <div class="metric">
                <i class="fa-solid fa-calendar-check"></i>
                <span>Atendimentos Realizados</span>
                <strong>${appointmentsCount}</strong>
            </div>
            <div class="metric">
                <i class="fa-solid fa-hourglass-half"></i>
                <span>Horas de Atendimento</span>
                <strong>${formatDuration(totalHoursAttended)}</strong>
            </div>
        </div>
    `;

        // Render Recent Appointments List
        const recentAppointmentsHtml = appointmentsCount > 0 ? `
        <div class="professional-appointments">
            <h5>Histórico de Atendimentos Recentes:</h5>
            <div class="appointments-list">
                ${attendedAppointments.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10).map(app => `
                    <div class="appointment-item" onclick="window.openClientDetailsFromFuncModal(${app.clientId})">
                        <div class="appointment-item-info">
                            <span class="client-name">${app.clientName}</span>
                            <span class="appointment-date">${new Date(app.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} ${app.time || ''}</span>
                        </div>
                        <div class="appointment-item-duration">
                            ${formatDuration(app.durationHours)}
                        </div>
                    </div>
                `).join('')}
                ${appointmentsCount > 10 ? `<div class="more-appointments-indicator">... e mais ${appointmentsCount - 10}</div>` : ''}
            </div>
        </div>
    ` : `<p>Nenhum atendimento realizado por este profissional.</p>`;

        activityContainer.innerHTML = statsHtml + recentAppointmentsHtml;
    }

// Helper function to bridge modal context
    window.openClientDetailsFromFuncModal = (clientId) => {
        document.getElementById('modal-detalhes-funcionario').style.display = 'none';
        showClientDetails(clientId);
    }

    function renderFuncionarioChangeHistory(history) {
        const historyContainer = document.getElementById('funcionario-change-history-list');
        historyContainer.innerHTML = '';

        if (!history || history.length === 0) {
            historyContainer.innerHTML = '<p>Nenhuma alteração registrada.</p>';
            return;
        }

        const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedHistory.forEach(entry => {
            const changeCard = document.createElement('div');
            changeCard.className = 'change-card';

            const changesList = entry.changes.map(change =>
                `<li><strong>${change.field}:</strong> De "${change.oldValue || 'Vazio'}" para "${change.newValue || 'Vazio'}"</li>`
            ).join('');

            changeCard.innerHTML = `
            <div class="change-meta">
                Alterado em ${new Date(entry.date).toLocaleDateString('pt-BR')} por ${entry.changedBy}
            </div>
            <ul class="change-details">${changesList}</ul>
        `;
            historyContainer.appendChild(changeCard);
        });
    }

    export function showEditFuncionarioModal(funcionarioId) {
        // Check if the current user has edit access to the 'funcionarios' tab
        if (!checkTabAccess('funcionarios', 'edit')) {
            showNotification('Você não tem permissão para editar funcionários.', 'error');
            return;
        }

        // `db.users.find` will find the user regardless of whether their role is predefined or custom.
        const funcionario = db.users.find(u => u.id === funcionarioId);
        if (!funcionario) return;

        window.currentFuncionarioId = funcionarioId;

        document.getElementById('edit-funcionario-name').value = funcionario.name || '';
        document.getElementById('edit-funcionario-cpf').value = funcionario.cpf || '';
        document.getElementById('edit-funcionario-phone').value = funcionario.phone || '';
        document.getElementById('edit-funcionario-email').value = funcionario.email || '';
        document.getElementById('edit-funcionario-address').value = funcionario.address || '';

        const roleInput = document.getElementById('edit-funcionario-role');
        roleInput.value = funcionario.role || '';

        const academicFields = document.getElementById('edit-funcionario-academic-fields');
        // Show academic fields if the role is a predefined professional role OR if the user has any academic info
        if (PROFESSIONAL_ROLES.includes(funcionario.role) || (funcionario.academicInfo && Object.keys(funcionario.academicInfo).some(key => funcionario.academicInfo[key]))) {
            document.getElementById('edit-funcionario-institution').value = (funcionario.academicInfo && funcionario.academicInfo.institution) || '';
            document.getElementById('edit-funcionario-graduation-period').value = (funcionario.academicInfo && funcionario.academicInfo.graduationPeriod) || '';
            document.getElementById('edit-funcionario-education').value = (funcionario.academicInfo && funcionario.academicInfo.education) || '';
            document.getElementById('edit-funcionario-discipline').value = (funcionario.academicInfo && funcionario.academicInfo.discipline) || '';
            academicFields.style.display = 'block';
        } else {
            academicFields.style.display = 'none';
        }

        const currentUser = getCurrentUser();
        // Disable editing tab permissions if the user is a director trying to edit themselves.
        const isEditingSelfAsDirector = (funcionario.id === currentUser.id && isRoleAllowed(DIRECTOR_ONLY));
        // Pass user.role to populateTabPermissions to determine default access
        populateTabPermissions('edit-funcionario-tab-permissions', funcionario.tabAccess || {}, isEditingSelfAsDirector, funcionario.role);

        const handleRoleChange = () => {
            // When editing, if a predefined professional role is selected, show academic fields.
            // If it changes to a non-professional role, hide them.
            const currentRole = roleInput.value;
            if (PROFESSIONAL_ROLES.includes(currentRole)) {
                academicFields.style.display = 'block';
            } else {
                academicFields.style.display = 'none';
            }
            // When role changes, also re-render permissions to show new defaults
            // (but only if not self-editing as director)
            if (!isEditingSelfAsDirector) {
                populateTabPermissions('edit-funcionario-tab-permissions', funcionario.tabAccess || {}, false, currentRole);
            }
        };

        roleInput.removeEventListener('input', handleRoleChange); // Remove old listener to prevent duplicates
        roleInput.addEventListener('input', handleRoleChange); // Add fresh listener

        document.getElementById('modal-detalhes-funcionario').style.display = 'none';
        document.getElementById('modal-editar-funcionario').style.display = 'flex';
    }

// NEW FUNCTION: Show Edit Password Modal
    export function showEditPasswordModal(funcionarioId) {
        // Check if the current user has edit access to the 'funcionarios' tab and is a director
        if (!checkTabAccess('funcionarios', 'edit') || !isRoleAllowed(DIRECTOR_ONLY)) {
            showNotification('Você não tem permissão para alterar a senha de funcionários.', 'error');
            return;
        }

        const funcionario = db.users.find(u => u.id === funcionarioId);
        if (!funcionario) {
            showNotification('Funcionário não encontrado.', 'error');
            return;
        }

        window.currentFuncionarioId = funcionarioId; // Store for form submission

        // Set user info in the password modal
        document.getElementById('edit-password-user-info').textContent = `Usuário: ${funcionario.name} (${funcionario.username})`;

        // Clear password fields
        document.getElementById('form-edit-password').reset();

        // Show modal
        document.getElementById('modal-detalhes-funcionario').style.display = 'none'; // Hide details modal
        document.getElementById('modal-edit-password').style.display = 'flex';
    }

    export async function saveFuncionarioChanges() {
        try {
            // Verifica se o usuário tem permissão para editar funcionários
            if (!checkTabAccess('funcionarios', 'edit')) {
                showNotification('Você não tem permissão para salvar alterações de funcionários.', 'error');
                return false;
            }

            // Busca o funcionário atual no banco de dados
            const {data: funcionario, error: fetchError} = await supabase
                .from('users')
                .select('*')
                .eq('id', window.currentFuncionarioId)
                .single();

            if (fetchError) throw fetchError;
            if (!funcionario) {
                showNotification('Funcionário não encontrado.', 'error');
                return false;
            }

            const currentUser = getCurrentUser();
            // Impede que diretores alterem suas próprias permissões para evitar bloqueio acidental
            const isEditingSelfAsDirector = (funcionario.id === currentUser.id && isRoleAllowed(DIRECTOR_ONLY));

            const changes = [];
            const updates = {};
            const originalFuncionario = {...funcionario};
            const originalAcademicInfo = {...(funcionario.academic_info || {})}; // Ajuste para academic_info

            // Obtém o novo cargo
            const role = document.getElementById('edit-funcionario-role').value;
            if (role !== funcionario.role) {
                changes.push({field: 'Cargo', oldValue: funcionario.role, newValue: role});
                updates.role = role;
            }

            // Mapeia os campos do formulário para as propriedades do usuário
            const fieldsToUpdate = [
                {id: 'edit-funcionario-name', prop: 'name', label: 'Nome Completo'},
                {id: 'edit-funcionario-cpf', prop: 'cpf', label: 'CPF'},
                {id: 'edit-funcionario-phone', prop: 'phone', label: 'Celular'},
                {id: 'edit-funcionario-email', prop: 'email', label: 'Email'},
                {id: 'edit-funcionario-address', prop: 'address', label: 'Endereço'},
            ];

            // Processa os campos básicos
            fieldsToUpdate.forEach(({id, prop, label}) => {
                const input = document.getElementById(id);
                if (input && input.value !== funcionario[prop]) {
                    changes.push({
                        field: label,
                        oldValue: funcionario[prop] || '',
                        newValue: input.value.trim()
                    });
                    updates[prop] = input.value.trim();
                }
            });

            // Processa as informações acadêmicas
            let newAcademicInfo = {};
            if (PROFESSIONAL_ROLES.includes(role) || (originalAcademicInfo && Object.keys(originalAcademicInfo).some(key => originalAcademicInfo[key]))) {
                newAcademicInfo = {
                    institution: document.getElementById('edit-funcionario-institution')?.value.trim() || '',
                    graduation_period: document.getElementById('edit-funcionario-graduation-period')?.value.trim() || '',
                    education: document.getElementById('edit-funcienario-education')?.value.trim() || '',
                    discipline: document.getElementById('edit-funcionario-discipline')?.value.trim() || ''
                };

                // Adiciona as informações acadêmicas ao objeto de atualizações
                updates.academic_info = newAcademicInfo;
            }

            // Compare and update academicInfo fields
            ['institution', 'graduationPeriod', 'education', 'discipline'].forEach(field => {
                const oldValue = originalAcademicInfo[field] || '';
                const newValue = newAcademicInfo[field] || '';
                if (newValue !== oldValue) {
                    changes.push({field: `Acadêmico: ${field}`, oldValue, newValue});
                }
            });
            // Always assign the new academicInfo object, even if it's empty (for non-professional roles)
            funcionario.academicInfo = newAcademicInfo;


            fieldsToUpdate.forEach(field => {
                const element = document.getElementById(field.id);
                if (element) {
                    const newValue = element.value.trim();
                    const oldValue = originalFuncionario[field.prop] || '';
                    if (newValue !== oldValue) {
                        changes.push({field: field.label, oldValue, newValue});
                        funcionario[field.prop] = newValue;
                    }
                }
            });

            const newTabAccess = {};
            let hasCustomAccess = false;

            // Only collect tab permissions if the current user is NOT the one being edited, OR if not a director
        } catch (error) {
            console.error('Erro ao salvar alterações de funcionário:', error);
            showNotification('Erro ao salvar alterações de funcionário.', 'error');
            return false;
        }

        // Processa as permissões de abas se não for o próprio diretor
        if (isEditingSelfAsDirector) {
            return;
        }
        const tabPermissions = {};
        const tabCheckboxes = document.querySelectorAll('#edit-funcionario-permissions input[type="checkbox"]');
        for (const checkbox of tabCheckboxes) {
            const tab = checkbox.dataset.tab;
            const permissionType = checkbox.dataset.permissionType;
            if (!tabPermissions[tab]) {
                tabPermissions[tab] = {view: false, edit: false};
                // Verifica se o usuário tem permissão para excluir funcionários
                if (!checkTabAccess('funcionarios', 'edit') || !isRoleAllowed(DIRECTOR_ONLY)) {
                    showNotification('Você não tem permissão para excluir funcionários.', 'error');
                    false;
                }

                // Verifica se o funcionário a ser excluído é o próprio usuário
                const currentUser = getCurrentUser();
                if (funcionarioId === currentUser.id) {
                    showNotification('Você não pode excluir a si mesmo.', 'error');
                    false;
                }

                // Busca o funcionário no Supabase para obter o nome antes de excluir
                const {data: funcionarioToDelete, error: fetchError} = await supabase
                    .from('users')
                    .select('name')
                    .eq('id', funcionarioId)
                    .single();

                if (fetchError) throw fetchError;
                if (!funcionarioToDelete) {
                    showNotification('Funcionário não encontrado.', 'error');
                    false;
                }

                const funcionarioName = funcionarioToDelete.name;

                // Exclui o usuário do Supabase
                const {error: deleteError} = await supabase
                    .from('users')
                    .delete()
                    .eq('id', funcionarioId);

                if (deleteError) throw deleteError;

                // Fecha o modal de detalhes se estiver aberto
                const modalDetalhes = document.getElementById('modal-detalhes-funcionario');
                if (modalDetalhes) {
                    modalDetalhes.style.display = 'none';
                }

                // Atualiza a lista de funcionários
                renderFuncionarioList();
                showNotification(`Funcionário "${funcionarioName}" excluído com sucesso!`, 'success');
                updateGlobalSearchDatalist();
            }

            // Atualiza o funcionário no Supabase
            const {error: updateError} = await supabase
                .from('users')
                .update(updates)
                .eq('id', window.currentFuncionarioId);

            if (updateError) throw updateError;

            // Atualiza as permissões de abas do funcionário
            if (!isEditingSelfAsDirector) {
                const {error: updateTabAccessError} = await supabase
                    .from('users')
                    .update({tabAccess: newTabAccess})
                    .eq('id', window.currentFuncionarioId);

                if (updateTabAccessError) throw updateTabAccessError;
            }

            // Renderiza a lista de funcionários atualizada
            renderFuncionarioList();

            // Mostra notificação de sucesso
            showNotification('Alterações salvas com sucesso!', 'success');

            true;
        }
        (error)
        {
            console.error('Erro ao salvar alterações de funcionário:', error);
            showNotification('Erro ao salvar alterações de funcionário.', 'error');
            false;
        }

// Function to add a new employee
        export async function addFuncionario(funcionarioData) {
            try {
                // Verifica se o usuário tem permissão para adicionar funcionários
                if (!checkTabAccess('funcionarios', 'edit')) {
                    showNotification('Você não tem permissão para adicionar funcionários.', 'error');
                    return false;
                }

                // Verifica se o email já está cadastrado
                const {data: existingUser, error: checkError} = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', funcionarioData.email)
                    .single();

                if (existingUser) {
                    showNotification('Este email já está cadastrado. Por favor, utilize outro email.', 'error');
                    return false;
                }

                // Prepara os dados do usuário para o Supabase
                const {data, error} = await supabase
                    .from('users')
                    .insert([
                        {
                            name: funcionarioData.name,
                            email: funcionarioData.email,
                            password: funcionarioData.password, // Em produção, use hash de senha
                            role: funcionarioData.role || 'staff',
                            cpf: funcionarioData.cpf || null,
                            phone: funcionarioData.phone || null,
                            address: funcionarioData.address || null,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }
                    ])
                    .select();

                if (error) throw error;

                if (data && data.length > 0) {
                    showNotification(`Funcionário "${funcionarioData.name}" cadastrado com sucesso!`, 'success');
                    return true;
                }

                return false;
            } catch (error) {
                console.error('Erro ao cadastrar funcionário:', error);
                showNotification('Erro ao cadastrar funcionário. Por favor, tente novamente.', 'error');
                return false;
            }
        }

// Function to populate tab permissions dropdowns (used in add and edit modals, and permissions grid)
        export function populateTabPermissions(containerId, currentPermissions = {}, disableSelect = false, userRoleForDefaults = null) {
            const container = document.getElementById(containerId);
            if (!container) return;
            // ...
            container.innerHTML = '';

            // Add informative text only for the 'funcionarios' tab permissions view
            if (containerId.startsWith('tab-permissions-for-user-') || containerId === 'new-funcionario-tab-permissions') {
                const infoParagraph = document.createElement('p');
                infoParagraph.className = 'permission-access-info-text';
                infoParagraph.innerHTML = 'Defina o nível de acesso para cada aba. "Padrão do Cargo" usa as permissões predefinidas para o cargo. "Sem Acesso" nega qualquer acesso a essa aba. As opções de "Ver" e "Editar" sobrepõem o padrão do cargo.';
                container.appendChild(infoParagraph);
            }

            allSystemTabs.forEach(tab => {
                const selectId = `${containerId}-${tab.id}-select`;
                const currentCustomAccess = currentPermissions[tab.id]; // 'none', 'view', 'edit' or undefined/null if 'default'

                let selectedValue = 'default'; // Default to "Padrão do Cargo"

                // Determine initial selected value based on custom permissions
                if (currentCustomAccess !== undefined && currentCustomAccess !== null) {
                    selectedValue = currentCustomAccess;
                }

                const accessGroup = document.createElement('div');
                accessGroup.className = 'permission-access-group';

                accessGroup.innerHTML = `
            <label for="${selectId}">${tab.label}</label>
            <select id="${selectId}" data-tab-id="${tab.id}" ${disableSelect ? 'disabled' : ''}>
                <option value="default">Padrão do Cargo</option>
                <option value="none">Sem Acesso</option>
                <option value="view">Ver</option>
                <option value="edit">Editar</option>
            </select>
        `;
                container.appendChild(accessGroup);

                const selectElement = document.getElementById(selectId);
                selectElement.value = selectedValue;

                // Optionally show the default access for the current role
                if (userRoleForDefaults && selectElement.value === 'default') {
                    const tempUser = {role: userRoleForDefaults, tabAccess: null}; // Simulate user with only role
                    const canViewDefault = checkTabAccess(tab.id, 'view', tempUser);
                    const canEditDefault = checkTabAccess(tab.id, 'edit', tempUser);

                    let defaultHint = '';
                    if (canEditDefault) {
                        defaultHint = '(Padrão: Editar)';
                    } else if (canViewDefault) {
                        defaultHint = '(Padrão: Ver)';
                    } else {
                        defaultHint = '(Padrão: Sem Acesso)';
                    }
                    const hintSpan = document.createElement('small');
                    hintSpan.className = 'default-access-hint';
                    hintSpan.textContent = defaultHint;
                    selectElement.parentNode.insertBefore(hintSpan, selectElement.nextSibling);
                }
            });
        }

// Moved outside to be accessible for export
        export function deleteRole(roleId) {
            db.roles = db.roles.filter(r => r.id !== roleId);
            // Note: This doesn't reassign users. An admin would need to manually edit them.
            saveDb();
            initRolesManagement(); // Re-render the roles list
            renderFuncionarioList(); // Re-render employee list to update roles
            showNotification('Cargo excluído com sucesso.', 'success');
        }

// NEW: Role Management Functionality
        export function initRolesManagement() {
            const editorContainer = document.getElementById('role-editor-container');
            const roleListContainer = document.getElementById('roles-list-container');
            const editorTitle = document.getElementById('role-editor-title');
            const form = document.getElementById('form-role-editor');
            const roleIdInput = document.getElementById('role-editor-id');
            const roleNameInput = document.getElementById('role-name');
            const cancelBtn = document.getElementById('btn-cancel-role-edit');

            const showEditor = (role = null) => {
                form.reset();
                if (role) {
                    editorTitle.textContent = 'Editar Cargo';
                    roleIdInput.value = role.id;
                    roleNameInput.value = role.name;
                    populateTabPermissions('role-tab-permissions', role.tabAccess, false);
                } else {
                    editorTitle.textContent = 'Criar Novo Cargo';
                    roleIdInput.value = '';
                    roleNameInput.value = '';
                    populateTabPermissions('role-tab-permissions', {}, false);
                }
                editorContainer.style.display = 'block';
                roleListContainer.classList.add('editor-active');
            };

            const hideEditor = () => {
                editorContainer.style.display = 'none';
                roleListContainer.classList.remove('editor-active');
                form.reset();
            };

            const renderRolesList = () => {
                roleListContainer.innerHTML = `
            <h4>Cargos Atuais</h4>
            <div class="roles-list-items">
                <!-- Role items will be injected here -->
            </div>
            <button id="btn-create-new-role" class="btn-primary">
                <i class="fa-solid fa-plus"></i> Criar Novo Cargo
            </button>
        `;
                const rolesListItemsContainer = roleListContainer.querySelector('.roles-list-items');
                const customRoles = db.roles.filter(r => r.isCustom).sort((a, b) => a.name.localeCompare(b.name));

                if (customRoles.length === 0) {
                    rolesListItemsContainer.innerHTML = '<p class="empty-state">Nenhum cargo personalizado criado.</p>';
                } else {
                    customRoles.forEach(role => {
                        const roleItem = document.createElement('div');
                        roleItem.className = 'role-list-item';
                        roleItem.innerHTML = `
                    <span class="role-name">${role.name}</span>
                    <div class="role-actions">
                        <button class="btn-icon-edit" data-id="${role.id}" title="Editar Cargo">
                            <i class="fa-solid fa-pencil-alt"></i>
                        </button>
                        <button class="btn-icon-delete" data-id="${role.id}" title="Excluir Cargo">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `;
                        rolesListItemsContainer.appendChild(roleItem);
                    });
                }

                document.getElementById('btn-create-new-role').addEventListener('click', () => showEditor());

                roleListContainer.querySelectorAll('.btn-icon-edit').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const roleId = e.currentTarget.dataset.id;
                        const role = db.roles.find(r => r.id === roleId);
                        // Highlight selected item
                        roleListContainer.querySelectorAll('.role-list-item').forEach(item => item.classList.remove('active'));
                        e.currentTarget.closest('.role-list-item').classList.add('active');
                        showEditor(role);
                    });
                });

                roleListContainer.querySelectorAll('.btn-icon-delete').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const roleId = e.currentTarget.dataset.id;
                        const role = db.roles.find(r => r.id === roleId);

                        window.currentDeleteItem = roleId;
                        window.currentDeleteItemType = 'role';

                        const modal = document.getElementById('modal-confirm-delete');
                        const message = document.getElementById('delete-confirmation-message');
                        message.textContent = `Tem certeza que deseja excluir o cargo "${role.name}"? Funcionários com este cargo precisarão ter um novo cargo atribuído.`;
                        modal.style.display = 'flex';
                    });
                });
            };

            const saveRole = () => {
                const roleId = roleIdInput.value;
                const roleName = roleNameInput.value.trim();

                if (!roleName) {
                    showNotification('O nome do cargo é obrigatório.', 'error');
                    return;
                }

                const newTabAccess = {};
                allSystemTabs.forEach(tab => {
                    const selectElement = document.getElementById(`role-tab-permissions-${tab.id}-select`);
                    if (selectElement && selectElement.value !== 'default' && selectElement.value !== 'none') {
                        newTabAccess[tab.id] = selectElement.value;
                    }
                });

                if (roleId) { // Editing existing role
                    const role = db.roles.find(r => r.id === roleId);
                    if (role) {
                        role.name = roleName;
                        role.tabAccess = newTabAccess;
                        showNotification(`Cargo "${roleName}" atualizado com sucesso.`, 'success');
                    }
                } else { // Creating new role
                    const newRoleId = roleName.toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, '');
                    if (db.roles.some(r => r.id === newRoleId) || ['director', 'staff', 'intern'].includes(newRoleId)) {
                        showNotification('Um cargo com este nome (ou um ID derivado) já existe.', 'error');
                        return;
                    }
                    db.roles.push({
                        id: newRoleId,
                        name: roleName,
                        tabAccess: newTabAccess,
                        isCustom: true
                    });
                    showNotification(`Cargo "${roleName}" criado com sucesso.`, 'success');
                }

                saveDb();
                renderRolesList();
                hideEditor();
                renderFuncionarioList(); // To update role displays if names changed
            };

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                saveRole();
            });

            cancelBtn.addEventListener('click', hideEditor);

            renderRolesList();
            hideEditor();
        }
    }
}