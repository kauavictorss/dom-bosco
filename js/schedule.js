// Schedule management module
import { db, saveDb } from './database.js';
import { getCurrentUser, isRoleAllowed, PROFESSIONAL_ROLES, COORDINATOR_AND_HIGHER, ALL_SCHEDULE_VIEW_EDIT_MANAGERS, checkTabAccess } from './auth.js'; // Import constants
import { showNotification } from './ui.js';
import { showClientDetails } from './clients.js'; // Import showClientDetails to re-render client modal

// Define and export service names for consistent display and use in other modules
export const serviceNames = {
    'avaliacao-neuropsicologica': 'Avaliação Neuropsicológica',
    'reabilitacao-cognitiva': 'Reabilitação Cognitiva',
    'terapia-cognitiva': 'Terapia Cognitiva',
    'orientacao-familiar': 'Orientação Familiar',
    'psicoterapia': 'Psicoterapia',
    'musicoterapia': 'Musicoterapia',
    'psicanalise': 'Psicanálise',
    'terapia-cognitivo-comportamental': 'Terapia Cognitivo-Comportamental (TCC)',
    'terapia-junguiana': 'Terapia Junguiana',
    'terapia-comportamental': 'Terapia Comportamental',
    'gestalt-terapia': 'Gestalt-terapia',
    'terapia-familiar': 'Terapia Familiar',
    'terapia-de-casal': 'Terapia de Casal',
    'outros': 'Outros'
};

export function initScheduleView() {
    const professionalFilterContainer = document.getElementById('professional-filter-container');
    const professionalFilterSelect = document.getElementById('professional-filter-select');
    const professionalRoleFilterContainer = document.getElementById('professional-role-filter-container');
    const professionalRoleFilterSelect = document.getElementById('professional-role-filter-select');
    const unitFilterContainer = document.getElementById('unit-filter-container');
    const unitFilterSelect = document.getElementById('unit-filter-select');

    if (!professionalFilterContainer || !professionalFilterSelect || !professionalRoleFilterContainer || !professionalRoleFilterSelect || !unitFilterContainer || !unitFilterSelect) return;

    const currentUser = getCurrentUser();
    const isManager = isRoleAllowed(ALL_SCHEDULE_VIEW_EDIT_MANAGERS);

    if (isManager) {
        professionalFilterContainer.style.display = 'block';
        professionalRoleFilterContainer.style.display = 'block';
        unitFilterContainer.style.display = 'block';
        
        populateProfessionalRoleFilter();
        populateProfessionalFilter();
        
        // Remove previous listeners to avoid duplicates
        const newRoleSelect = professionalRoleFilterSelect.cloneNode(true);
        professionalRoleFilterSelect.parentNode.replaceChild(newRoleSelect, professionalRoleFilterSelect);
        
        const newProfSelect = professionalFilterSelect.cloneNode(true);
        professionalFilterSelect.parentNode.replaceChild(newProfSelect, professionalFilterSelect);
        
        const newUnitSelect = unitFilterSelect.cloneNode(true);
        unitFilterSelect.parentNode.replaceChild(newUnitSelect, unitFilterSelect);

        newRoleSelect.addEventListener('change', () => {
            populateProfessionalFilter(); // Re-populate professionals based on role
            const selectedDate = document.getElementById('date-selector').value;
            renderSchedule(selectedDate);
            renderCalendar();
        });

        newProfSelect.addEventListener('change', () => {
            const selectedDate = document.getElementById('date-selector').value;
            renderSchedule(selectedDate);
            renderCalendar();
        });

        newUnitSelect.addEventListener('change', () => {
            const selectedDate = document.getElementById('date-selector').value;
            renderSchedule(selectedDate);
            renderCalendar();
        });

    } else {
        professionalFilterContainer.style.display = 'none';
        professionalRoleFilterContainer.style.display = 'none';
        unitFilterContainer.style.display = 'none';
    }
}

function populateProfessionalRoleFilter() {
    const select = document.getElementById('professional-role-filter-select');
    if (!select) return;

    select.innerHTML = '<option value="all">Todos os Cargos</option>';

    const predefinedRoleNames = {
        'psychologist': 'Psicólogo(a)',
        'psychopedagogue': 'Psicopedagogo(a)',
        'musictherapist': 'Musicoterapeuta',
        'speech_therapist': 'Fonoaudiólogo(a)',
        'nutritionist': 'Nutricionista',
        'physiotherapist': 'Fisioterapeuta',
        'intern': 'Estagiário(a)',
        'staff': 'Funcionário(a) Geral',
        'receptionist': 'Recepcionista',
    };

    // Create a comprehensive map of all role IDs to their display names
    const allRoleDisplayNames = { ...predefinedRoleNames };
    db.roles.forEach(role => {
        if (role.isCustom) {
            allRoleDisplayNames[role.id] = role.name; // Add custom roles
        }
    });

    // Get all unique roles that are assigned to at least one user, PLUS all custom roles
    const rolesAssignedToUsers = [...new Set(db.users.map(u => u.role))];
    const customRoleIds = db.roles.filter(r => r.isCustom).map(r => r.id);
    const rolesInSystem = [...new Set([...rolesAssignedToUsers, ...customRoleIds])];
    
    // Sort roles for consistent order in the dropdown
    rolesInSystem.sort((a, b) => {
        const nameA = allRoleDisplayNames[a] || a;
        const nameB = allRoleDisplayNames[b] || b;
        return nameA.localeCompare(nameB);
    });
    
    rolesInSystem.forEach(role => {
        const option = document.createElement('option');
        option.value = role;
        option.textContent = allRoleDisplayNames[role] || role; // Use display name or fall back to role ID
        select.appendChild(option);
    });
}

function populateProfessionalFilter() {
    const select = document.getElementById('professional-filter-select');
    if (!select) return;

    select.innerHTML = '<option value="all">Todos os Profissionais</option>';

    const roleFilter = document.getElementById('professional-role-filter-select').value;

    const professionals = db.users
        .filter(user => {
            const hasProfessionalRole = PROFESSIONAL_ROLES.includes(user.role);
            const matchesRoleFilter = (roleFilter === 'all' || user.role === roleFilter);
            return hasProfessionalRole && matchesRoleFilter;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    professionals.forEach(prof => {
        const option = document.createElement('option');
        option.value = prof.id;
        option.textContent = prof.name;
        select.appendChild(option);
    });
}

export function renderSchedule(selectedDate = null) {
    const agendaList = document.getElementById('agenda-list');
    const dateToShow = selectedDate || new Date().toISOString().split('T')[0];
    const currentUser = getCurrentUser();
    
    // Check if the user has view access to the 'agenda' tab
    if (!checkTabAccess('agenda', 'view')) {
        agendaList.innerHTML = '<p>Você não tem permissão para visualizar a agenda.</p>';
        return;
    }

    const isManager = isRoleAllowed(ALL_SCHEDULE_VIEW_EDIT_MANAGERS);
    let professionalIdFilter = 'all';
    let unitFilter = 'all';

    if (isManager) {
        const profFilterSelect = document.getElementById('professional-filter-select');
        if (profFilterSelect) professionalIdFilter = profFilterSelect.value;
        
        const unitFilterSelect = document.getElementById('unit-filter-select');
        if (unitFilterSelect) unitFilter = unitFilterSelect.value;
    }

    // Filter schedules:
    // ALL_SCHEDULE_VIEW_EDIT_MANAGERS see all schedules.
    // Other PROFESSIONAL_ROLES only see schedules assigned to them.
    const daySchedules = db.schedules.filter(schedule => {
        if (schedule.date !== dateToShow) return false;

        // Filter by unit
        if (unitFilter !== 'all') {
            const client = db.clients.find(c => c.id === schedule.clientId);
            if (!client || client.unit !== unitFilter) {
                return false;
            }
        }

        if (isManager) {
            // Managers can filter by professional.
            if (professionalIdFilter === 'all') {
                return true; // Show all schedules for the day
            } else {
                return schedule.assignedToUserId === parseInt(professionalIdFilter);
            }
        } else {
            // Professionals who are not managers only see their own schedules.
            return schedule.assignedToUserId === currentUser.id;
        }
        
    });
    
    agendaList.innerHTML = '';
    
    if (daySchedules.length === 0) {
        agendaList.innerHTML = '<p>Nenhum agendamento para este dia.</p>';
        return;
    }
    
    // Sort by time
    daySchedules.sort((a, b) => a.time.localeCompare(b.time));
    
    daySchedules.forEach(schedule => {
        const client = db.clients.find(c => c.id === schedule.clientId);
        
        let cancellationInfo = '';
        if (schedule.status === 'cancelado' && schedule.cancelReason) {
            cancellationInfo = `
                <div class="cancellation-info">
                    <h5>Motivo do Cancelamento:</h5>
                    <div class="cancellation-reason">${schedule.cancelReason}</div>
                    ${schedule.cancelImage ? `
                        <img src="${schedule.cancelImage}" alt="Comprovante do cancelamento" class="cancellation-image" onclick="window.open('${schedule.cancelImage}', '_blank')">
                    ` : ''}
                    <small>Cancelado em ${new Date(schedule.cancelDate).toLocaleDateString('pt-BR')} por ${schedule.canceledBy}</small>
                </div>
            `;
        }

        let buttonsHtml = '';
        const canEditAgenda = checkTabAccess('agenda', 'edit'); // Check for edit permission on agenda tab
        const isAssignedProfessional = schedule.assignedToUserId === currentUser.id;

        if (schedule.status === 'agendado') {
            if (canEditAgenda) { // If user has edit access to agenda, they can do all actions
                buttonsHtml = `
                    <button class="btn-confirm" onclick="updateScheduleStatus(${schedule.id}, 'confirmado')">Confirmar</button>
                    <button class="btn-edit" onclick="editSchedule(${schedule.id})">Editar</button>
                    <button class="btn-cancel" onclick="cancelScheduleWithReason(${schedule.id})">Cancelar</button>
                    <button class="btn-secondary btn-reassign" onclick="reassignSchedule(${schedule.id})">Redirecionar</button>
                `;
            } else if (isAssignedProfessional && checkTabAccess('agenda', 'view')) { // Assigned professional with only view access can still confirm/cancel their own
                buttonsHtml = `
                    <button class="btn-confirm" onclick="updateScheduleStatus(${schedule.id}, 'confirmado')">Confirmar</button>
                    <button class="btn-cancel" onclick="cancelScheduleWithReason(${schedule.id})">Cancelar</button>
                `;
            }
        } else if (schedule.status === 'concluido') {
            buttonsHtml = `
                <span class="status-message success-message">Atendimento Concluído</span>
            `;
        } else if (schedule.status === 'cancelado') {
            buttonsHtml = `
                <span class="status-message danger-message">Agendamento Cancelado</span>
            `;
        }
        
        const card = document.createElement('div');
        card.className = `schedule-card status-${schedule.status}`;
        
        card.innerHTML = `
            <div class="schedule-info">
                <h4>${schedule.time} - ${client ? `${client.name} (ID: ${client.id})` : 'Cliente não encontrado'}</h4>
                <p><strong>Serviço:</strong> ${serviceNames[schedule.serviceType] || schedule.serviceType}</p>
                <p><strong>Status:</strong> ${schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}</p>
                ${schedule.assignedToUserName ? `<p><strong>Atribuído a:</strong> ${schedule.assignedToUserName}</p>` : '<p><strong>Atribuído a:</strong> Não atribuído</p>'}
                ${schedule.observations ? `<p><strong>Obs:</strong> ${schedule.observations}</p>` : ''}
                ${cancellationInfo}
            </div>
            <div class="schedule-actions">
                ${buttonsHtml}
            </div>
        `;
        agendaList.appendChild(card);
    });
}

export function updateScheduleStatus(scheduleId, newStatus) {
    const schedule = db.schedules.find(s => s.id === scheduleId);
    if (schedule) {
        const currentUser = getCurrentUser();

        // Permission check for confirming
        // A user can confirm if they have 'edit' access to 'agenda' tab
        // OR if they have 'view' access and the schedule is assigned to them.
        const canConfirm = checkTabAccess('agenda', 'edit') ||
                           (checkTabAccess('agenda', 'view') && schedule.assignedToUserId === currentUser.id);

        if (newStatus === 'confirmado') {
            if (!canConfirm) {
                showNotification('Você não tem permissão para confirmar este agendamento.', 'error');
                return;
            }

            window.currentConfirmingScheduleId = scheduleId;
            const client = db.clients.find(c => c.id === schedule.clientId);
            
            // Pre-fill professional responsible field, preferring assigned user
            const profissionalResponsavelInput = document.getElementById('profissional-responsavel');
            
            // Reset form
            document.getElementById('form-confirmar-atendimento').reset();
            
            // Set professional responsible based on role
            // If user has edit access to agenda, they can select any professional.
            // Otherwise, if they only have view access and it's their own schedule, they can only set themselves.
            if (checkTabAccess('agenda', 'edit')) {
                profissionalResponsavelInput.value = schedule.assignedToUserName || currentUser.name;
                profissionalResponsavelInput.readOnly = false;
            } else if (checkTabAccess('agenda', 'view') && schedule.assignedToUserId === currentUser.id) {
                profissionalResponsavelInput.value = currentUser.name;
                profissionalResponsavelInput.readOnly = true;
            } else {
                showNotification('Você não tem permissão para confirmar este agendamento.', 'error');
                return;
            }
            
            document.getElementById('materials-selection-confirm').innerHTML = '';
            
            // Set client info in modal
            const clientInfoElement = document.getElementById('confirm-attendance-client-info');
            if (clientInfoElement && client) {
                clientInfoElement.textContent = `Cliente: ${client.name} (ID: ${client.id})`;
            }

            document.getElementById('modal-confirmar-atendimento').style.display = 'flex';
        } else {
            // General status update (e.g., if we had other statuses to set directly)
            // This path would only be taken if canConfirm is true.
            schedule.status = newStatus;
            saveDb();
            renderSchedule(document.getElementById('date-selector').value);
            showNotification(`Status do agendamento atualizado para ${newStatus}.`, 'success');
        }
    } else {
        showNotification('Agendamento não encontrado.', 'error');
    }
}

export function cancelScheduleWithReason(scheduleId) {
    const schedule = db.schedules.find(s => s.id === scheduleId);
    const currentUser = getCurrentUser();

    // Permission check for cancelling
    // A user can cancel if they have 'edit' access to 'agenda' tab
    const canCancel = checkTabAccess('agenda', 'edit') || (checkTabAccess('agenda', 'view') && schedule.assignedToUserId === currentUser.id);

    if (!canCancel) {
        showNotification('Você não tem permissão para cancelar este agendamento.', 'error');
        return;
    }

    window.currentCancellingScheduleId = scheduleId;
    
    // Reset form
    document.getElementById('form-cancelar-agendamento').reset();
    document.getElementById('preview-imagem-cancelamento').style.display = 'none';
    
    // Show modal
    document.getElementById('modal-cancelar-agendamento').style.display = 'flex';
}

export function editSchedule(scheduleId) {
    const schedule = db.schedules.find(s => s.id === scheduleId);
    if (!schedule) return;
    
    // Only users with 'edit' permission for the 'agenda' tab can edit schedules.
    if (!checkTabAccess('agenda', 'edit')) {
        showNotification('Você não tem permissão para editar agendamentos.', 'error');
        return;
    }

    window.currentEditingScheduleId = scheduleId;
    
    // Populate edit form - need to populate selects first
    populateEditClientSelectOptions();
    populateEditServiceTypeOptions();
    
    document.getElementById('edit-cliente-agenda').value = schedule.clientId;
    document.getElementById('edit-data-agendamento').value = schedule.date;
    document.getElementById('edit-hora-agendamento').value = schedule.time;
    document.getElementById('edit-tipo-servico').value = schedule.serviceType;
    document.getElementById('edit-observacoes-agendamento').value = schedule.observations || '';
    
    document.getElementById('modal-editar-agendamento').style.display = 'flex';
}

function populateEditClientSelectOptions() {
    const select = document.getElementById('edit-cliente-agenda');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    
    db.clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = `${client.name} (ID: ${client.id})`;
        select.appendChild(option);
    });
}

function populateEditServiceTypeOptions() {
    const select = document.getElementById('edit-tipo-servico');
    if (!select) return;
    
    select.innerHTML = '';
    
    // Use the exported serviceNames
    Object.entries(serviceNames).forEach(([value, text]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        select.appendChild(option);
    });
}

export function saveEditedSchedule() {
    const schedule = db.schedules.find(s => s.id === window.currentEditingScheduleId);
    if (!schedule) return;
    
    const clientId = parseInt(document.getElementById('edit-cliente-agenda').value);
    const date = document.getElementById('edit-data-agendamento').value;
    const time = document.getElementById('edit-hora-agendamento').value;
    const serviceType = document.getElementById('edit-tipo-servico').value;
    const observations = document.getElementById('edit-observacoes-agendamento').value;

    if (!clientId || !date || !time || !serviceType) {
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'warning');
        return;
    }

    schedule.clientId = clientId;
    schedule.date = date;
    schedule.time = time;
    schedule.serviceType = serviceType;
    schedule.observations = observations;

    saveDb();
    
    document.getElementById('modal-editar-agendamento').style.display = 'none';
    renderSchedule(document.getElementById('date-selector').value);
    renderCalendar();
    
    showNotification('Agendamento atualizado com sucesso!', 'success');
}

export function initializeCalendar() {
    const monthSelector = document.getElementById('month-selector');
    const today = new Date();
    const currentMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
    monthSelector.value = currentMonth;
    
    monthSelector.addEventListener('change', renderCalendar);
    renderCalendar();
}

export function renderCalendar() {
    const monthSelector = document.getElementById('month-selector');
    const calendarGrid = document.getElementById('calendar-grid');
    
    if (!monthSelector || !calendarGrid) return;
    
    const [year, month] = monthSelector.value.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const today = new Date();
    const selectedDate = document.getElementById('date-selector').value;
    const currentUser = getCurrentUser(); // Get current user

    // Determine which professional's appointments to show on the calendar
    const isManager = isRoleAllowed(ALL_SCHEDULE_VIEW_EDIT_MANAGERS);
    let professionalIdFilter = 'all';
    let unitFilter = 'all';
    if (isManager) {
        const profFilterSelect = document.getElementById('professional-filter-select');
        if (profFilterSelect) professionalIdFilter = profFilterSelect.value;
        const unitFilterSelect = document.getElementById('unit-filter-select');
        if (unitFilterSelect) unitFilter = unitFilterSelect.value;
    }

    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.textContent = day;
        header.style.fontWeight = 'bold';
        header.style.textAlign = 'center';
        header.style.padding = '8px';
        header.style.backgroundColor = 'var(--background-color)';
        calendarGrid.appendChild(header);
    });
    
    // Add empty cells for days before month starts
    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const currentDate = new Date(year, month - 1, day);
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Check if it's today
        if (currentDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Check if it's selected
        if (dateString === selectedDate) {
            dayElement.classList.add('selected');
        }
        
        // Check if it has appointments (filtered by user if applicable)
        const hasAppointments = db.schedules.some(schedule => {
            if (schedule.date !== dateString) return false;

            // Apply unit filter to calendar highlights
            if (unitFilter !== 'all') {
                const client = db.clients.find(c => c.id === schedule.clientId);
                if (!client || client.unit !== unitFilter) {
                    return false;
                }
            }

            if (isManager) {
                if (professionalIdFilter === 'all') {
                    return true;
                } else {
                    return schedule.assignedToUserId === parseInt(professionalIdFilter);
                }
            } else {
                return schedule.assignedToUserId === currentUser.id;
            }
        });

        if (hasAppointments) {
            dayElement.classList.add('has-appointments');
        }
        
        // Add click handler
        dayElement.addEventListener('click', () => {
            document.getElementById('date-selector').value = dateString;
            renderSchedule(dateString);
            renderCalendar(); // Re-render to update selection
        });
        
        calendarGrid.appendChild(dayElement);
    }
}

export function reassignSchedule(scheduleId) {
    // Only users with 'edit' permission for the 'agenda' tab can reassign schedules.
    if (!checkTabAccess('agenda', 'edit')) {
        showNotification('Você não tem permissão para redirecionar agendamentos.', 'error');
        return;
    }

    window.currentReassigningScheduleId = scheduleId;
    const schedule = db.schedules.find(s => s.id === scheduleId);
    if (!schedule) {
        showNotification('Agendamento não encontrado para redirecionamento.', 'error');
        return;
    }

    const client = db.clients.find(c => c.id === schedule.clientId);
    const clientName = client ? client.name : 'Cliente Desconhecido';

    document.getElementById('reassign-schedule-info').textContent = `Agendamento de ${clientName} (${schedule.time})`;
    
    // Populate the select dropdown with staff and intern users
    const selectAssignedUser = document.getElementById('select-assigned-user');
    selectAssignedUser.innerHTML = '<option value="">Selecione um profissional</option>';
    
    const assignableUsers = db.users.filter(user => PROFESSIONAL_ROLES.includes(user.role));
    assignableUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name} (${user.role === 'staff' ? 'Funcionário' : (user.role === 'intern' ? 'Estagiário' : 'Musicoterapeuta')})`;
        selectAssignedUser.appendChild(option);
    });

    // Pre-select if already assigned
    if (schedule.assignedToUserId) {
        selectAssignedUser.value = schedule.assignedToUserId;
    } else {
        selectAssignedUser.value = ''; // Ensure nothing is pre-selected if not assigned
    }

    document.getElementById('modal-reassign-schedule').style.display = 'flex';
}

export function saveReassignedSchedule() {
    const schedule = db.schedules.find(s => s.id === window.currentReassigningScheduleId);
    if (!schedule) {
        showNotification('Erro: Agendamento não encontrado.', 'error');
        return;
    }

    const client = db.clients.find(c => c.id === schedule.clientId);
    if (!client) {
        showNotification('Erro: Cliente do agendamento não encontrado.', 'error');
        return;
    }

    const newAssignedUserId = parseInt(document.getElementById('select-assigned-user').value);
    const newAssignedUser = db.users.find(u => u.id === newAssignedUserId);

    if (!newAssignedUser) {
        showNotification('Por favor, selecione um profissional válido.', 'warning');
        return;
    }

    const oldAssignedUserName = schedule.assignedToUserName;
    const newAssignedUserName = newAssignedUser.name;

    // NEW LOGIC: If re-assigning to a different user, create a notification
    if (schedule.assignedToUserId !== newAssignedUserId) {
        if (!db.notifications) db.notifications = [];
        db.notifications.push({
            id: db.nextNotificationId++,
            userId: newAssignedUserId,
            type: 'schedule_assignment',
            title: 'Agendamento Redirecionado',
            message: `O agendamento do paciente ${client.name} para ${new Date(schedule.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} às ${schedule.time} foi redirecionado para você.`,
            relatedId: schedule.id,
            createdAt: new Date().toISOString(),
            isRead: false
        });
    }

    // NEW LOGIC: If assigning to a professional, ADD this professional to the client's assigned professionals list
    if (PROFESSIONAL_ROLES.includes(newAssignedUser.role)) {
        if (!client.assignedProfessionalIds) {
            client.assignedProfessionalIds = [];
        }
        
        // Add the new professional if not already there
        if (!client.assignedProfessionalIds.includes(newAssignedUserId)) {
            const oldAssignedNames = client.assignedProfessionalIds.map(id => db.users.find(u => u.id === id)?.name || 'Desconhecido').join(', ');
            client.assignedProfessionalIds.push(newAssignedUserId);
            const newAssignedNames = client.assignedProfessionalIds.map(id => db.users.find(u => u.id === id)?.name || 'Desconhecido').join(', ');
            
            // Add a change history entry for the client's assignment
            if (!client.changeHistory) client.changeHistory = [];
            client.changeHistory.push({
                id: db.nextChangeId++,
                date: new Date().toISOString(),
                changedBy: getCurrentUser().name,
                changes: [
                    {
                        field: 'Profissionais Vinculados',
                        oldValue: oldAssignedNames || 'Nenhum',
                        newValue: newAssignedNames
                    }
                ]
            });
        }
    }

    schedule.assignedToUserId = newAssignedUserId;
    schedule.assignedToUserName = newAssignedUser.name;

    saveDb();
    document.getElementById('modal-reassign-schedule').style.display = 'none';
    renderSchedule(document.getElementById('date-selector').value);
    // If the client details modal is open (e.g., reassigning from there), refresh it
    if (document.getElementById('modal-detalhes-cliente').style.display === 'flex') {
        showClientDetails(client.id);
    }
    showNotification('Agendamento redirecionado com sucesso!', 'success');
}

export function populateAssignableUsers() {
    const select = document.getElementById('select-assigned-professional');
    if (!select) return;
    
    select.innerHTML = ''; // Clear existing options
    const currentUser = getCurrentUser();

    // If the user has 'edit' access to the 'agenda' tab, they can select any professional.
    if (checkTabAccess('agenda', 'edit')) {
        select.innerHTML = '<option value="">Nenhum (selecione)</option>'; // Default option
        const assignableUsers = db.users.filter(user => PROFESSIONAL_ROLES.includes(user.role));
        
        assignableUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.name} (${user.role === 'staff' ? 'Funcionário' : (user.role === 'intern' ? 'Estagiário' : 'Musicoterapeuta')})`;
            select.appendChild(option);
        });
        select.disabled = false;
        select.value = ''; // Ensure no default selection for directors/coordinators/receptionists
    } else if (checkTabAccess('agenda', 'view') && isRoleAllowed(PROFESSIONAL_ROLES)) {
        // If they only have view access and are a professional, they can only assign to themselves.
        const option = document.createElement('option');
        option.value = currentUser.id;
        option.textContent = `${currentUser.name} (${currentUser.role === 'staff' ? 'Funcionário' : (currentUser.role === 'intern' ? 'Estagiário' : 'Musicoterapeuta')})`;
        select.appendChild(option);
        select.value = currentUser.id; // Pre-select themselves
        select.disabled = true; // Disable the select box
    } else {
        // Other roles (e.g., financeiro, staff not in PROFESSIONAL_ROLES) or no access to agenda
        select.innerHTML = '<option value="">Nenhum</option>';
        select.disabled = true;
    }
}

// Make functions available globally for onclick handlers
window.cancelScheduleWithReason = cancelScheduleWithReason;
window.editSchedule = editSchedule;
window.reassignSchedule = reassignSchedule;
window.saveReassignedSchedule = saveReassignedSchedule;