// Client management module
import { db, saveDb } from './database.js';
import { getCurrentUser, isRoleAllowed, DIRECTOR_ONLY, FINANCE_ONLY, DIRECTOR_OR_FINANCE, ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES, PROFESSIONAL_ROLES, COORDINATOR_AND_HIGHER, checkTabAccess } from './auth.js'; // Import new constants
import { showNotification, updateGlobalSearchDatalist, switchTab } from './ui.js';
import { formatDuration } from './utils.js'; // Import the new utility function

export function renderClientList(filter = '', activityFilter = 'all', professionalFilter = 'all', unitFilter = 'all') {
    const clientListContainer = document.getElementById('client-list-container');
    if (!clientListContainer) return;

    clientListContainer.innerHTML = '';
    const lowerCaseFilter = filter.toLowerCase();
    const currentUser = getCurrentUser(); // Get the current user

    let clientsToShow = db.clients; // Start with all clients

    // Apply role-based filtering:
    // Professionals (staff, intern, musictherapist, etc.) only see clients assigned to them.
    // Roles like 'director', 'coordinator_madre', 'coordinator_floresta', 'receptionist' are not part of PROFESSIONAL_ROLES,
    // so for them, the `clientsToShow` array will remain `db.clients` (all clients),
    // which aligns with the requirement for 'director' and 'receptionist' to see all patients.
    if (isRoleAllowed(PROFESSIONAL_ROLES) && !isRoleAllowed(ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES)) {
        clientsToShow = clientsToShow.filter(client => 
            client.assignedProfessionalIds && client.assignedProfessionalIds.includes(currentUser.id)
        );
    } 
    // For other roles (Director, Coordinators, Receptionists), clientsToShow remains all clients.

    // Apply text search filter on the already role-filtered clients
    let filteredClients = clientsToShow.filter(client => 
        client.name.toLowerCase().includes(lowerCaseFilter) ||
        (client.cpf && client.cpf.includes(filter)) ||
        client.id.toString().includes(filter)
    );

    // Apply activity filter
    if (activityFilter === 'active') {
        filteredClients = filteredClients.filter(client => 
            client.appointments && client.appointments.length > 0
        );
    } else if (activityFilter === 'inactive') {
        filteredClients = filteredClients.filter(client => 
            !client.appointments || client.appointments.length === 0
        );
    }

    // Apply professional filter based on `assignedProfessionalIds`
    // This filter is only meaningful for roles that can see *all* clients and then filter them,
    // i.e., Director, Coordinators, and Receptionists. For professionals, the initial filtering already handled this.
    if (!isRoleAllowed(PROFESSIONAL_ROLES) || isRoleAllowed(ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES)) {
        if (professionalFilter === 'linked') {
            filteredClients = filteredClients.filter(client => 
                client.assignedProfessionalIds && client.assignedProfessionalIds.length > 0
            );
        } else if (professionalFilter === 'unlinked') {
            filteredClients = filteredClients.filter(client => 
                !client.assignedProfessionalIds || client.assignedProfessionalIds.length === 0
            );
        }
    }

    // NEW: Apply unit filter
    if (unitFilter !== 'all') {
        filteredClients = filteredClients.filter(client =>
            client.unit === unitFilter
        );
    }

    if (filteredClients.length === 0) {
        let message = 'Nenhum cliente corresponde à busca.';
        if (filter === '' && activityFilter === 'all' && professionalFilter === 'all' && unitFilter === 'all') {
             message = 'Nenhum cliente cadastrado ainda.';
        } else if (filter === '' && activityFilter === 'active') {
            message = 'Nenhum cliente ativo encontrado.';
        } else if (filter === '' && activityFilter === 'inactive') {
            message = 'Nenhum cliente inativo encontrado.';
        } else if (filter === '' && professionalFilter === 'linked') {
            message = 'Nenhum cliente vinculado a profissionais encontrado.';
        } else if (filter === '' && professionalFilter === 'unlinked') {
            message = 'Nenhum cliente não vinculado encontrado.';
        } else if (filter === '' && unitFilter !== 'all') { // New specific message for unit filter
            const unitMap = {
                'madre': 'Clínica Social (Madre)',
                'floresta': 'Neuro (Floresta)'
            };
            message = `Nenhum cliente encontrado para a unidade "${unitMap[unitFilter]}".`;
        }
        clientListContainer.innerHTML = `<p>${message}</p>`;
        return;
    }

    filteredClients.forEach(client => {
        const card = document.createElement('div');
        card.className = 'client-card';
        card.dataset.clientId = client.id;
        
        const type = client.type === 'adult' ? 'Adulto' : 'Menor';
        const contactInfo = client.type === 'adult' ? 
            (client.email || 'Sem email') : 
            `Pais: ${client.telefonePai || ''} / ${client.telefoneMae || ''}`;
        const idInfo = client.type === 'adult' ? 
            (client.cpf || 'Sem CPF') : 
            `${client.anoEscolar || 'Ano não informado'}`;

        let professionalInfo = '';
        if (client.assignedProfessionalIds && client.assignedProfessionalIds.length > 0) {
            const count = client.assignedProfessionalIds.length;
            professionalInfo = `<p><strong>Profissionais:</strong> ${count} vinculado(s)</p>`;
        } else {
            professionalInfo = `<p><strong>Profissionais:</strong> <span style="color: var(--danger-color); font-weight: 600;">Não vinculado</span></p>`;
        }
            
        // NEW: Unit information for client card
        const unitMap = {
            'madre': 'Clínica Social (Madre)',
            'floresta': 'Neuro (Floresta)'
        };
        const clientUnitDisplay = unitMap[client.unit] || 'N/A';
        const clientUnitInfo = `<p><strong>Unidade:</strong> ${clientUnitDisplay}</p>`;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <h3>${client.name} <span style="font-size: 0.8em; color: var(--secondary-color);">(${type})</span></h3>
                <span style="background: var(--primary-color); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold;">ID: ${client.id}</span>
            </div>
            <p><strong>Telefone:</strong> ${client.phone || (client.type === 'minor' ? (client.telefoneMae || 'N/A') : 'N/A')}</p>
            <p><strong>CPF:</strong> ${client.cpf || 'N/A'}</p>
            ${professionalInfo}
            ${clientUnitInfo}
        `;
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-delete')) return;
            showClientDetails(client.id);
        });

        clientListContainer.appendChild(card);
    });
}

export function showClientDetails(clientId) {
    const client = db.clients.find(c => c.id === clientId);
    if (!client) return;

    const currentUser = getCurrentUser();
    const canViewAll = checkTabAccess('historico', 'view');
    const isMyPatient = client.assignedProfessionalIds && client.assignedProfessionalIds.includes(currentUser.id) && checkTabAccess('meus-pacientes', 'view');

    if (!canViewAll && !isMyPatient) {
        showNotification('Você não tem permissão para ver os detalhes deste paciente.', 'error');
        return;
    }

    window.currentClientId = clientId;
    
    document.getElementById('modal-nome-cliente').innerHTML = `
        ${client.name} 
        <span style="background: var(--primary-color); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; margin-left: 10px;">ID: ${client.id}</span>
    `;
    
    if (client.type === 'adult') {
        document.getElementById('modal-email-cliente').textContent = client.email || 'N/A';
        document.getElementById('modal-telefone-cliente').textContent = client.phone || 'N/A';
        document.getElementById('modal-cpf-cliente').textContent = client.cpf || 'N/A';
        document.getElementById('modal-responsavel-cliente').textContent = client.contatoEmergencia || 'N/A';
    } else {
        document.getElementById('modal-email-cliente').textContent = 'N/A (Menor de idade)';
        document.getElementById('modal-telefone-cliente').textContent = `Pais: ${client.telefonePai || 'N/A'} / ${client.telefoneMae || 'N/A'}`;
        document.getElementById('modal-cpf-cliente').textContent = 'N/A (Menor de idade)';
        document.getElementById('modal-responsavel-cliente').textContent = `${client.nomePai || ''} / ${client.nomeMae || ''}`;
    }
    
    document.getElementById('modal-data-nascimento').textContent = client.birthDate ? new Date(client.birthDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A';
    document.getElementById('modal-cep-cliente').textContent = client.cep || 'N/A';
    document.getElementById('modal-logradouro-cliente').textContent = client.address || 'N/A';
    document.getElementById('modal-numero-cliente').textContent = client.number || 'S/N';
    document.getElementById('modal-bairro-cliente').textContent = client.neighborhood || '';
    document.getElementById('modal-cidade-estado-cliente').textContent = `${client.city || ''} / ${client.state || ''}`;
    document.getElementById('modal-observacoes-cliente').textContent = client.observations || 'Nenhuma observação.';
    
    // NEW: Display unit information
    const unitMap = {
        'madre': 'Clínica Social (Madre)',
        'floresta': 'Neuro (Floresta)'
    };
    document.getElementById('modal-unidade-cliente').textContent = unitMap[client.unit] || 'N/A';
    
    // NEW: Display clinical information if available
    const clinicalInfoSection = document.querySelector('.modal-obs');
    if (client.diagnosticoPrincipal || client.historicoMedico || client.queixaNeuropsicologica || client.expectativasTratamento) {
        let clinicalInfo = '';
        if (client.diagnosticoPrincipal) clinicalInfo += `<strong>Diagnóstico Principal:</strong> ${client.diagnosticoPrincipal}\n\n`;
        if (client.historicoMedico) clinicalInfo += `<strong>Histórico Médico:</strong> ${client.historicoMedico}\n\n`;
        if (client.queixaNeuropsicologica) clinicalInfo += `<strong>Queixa Neuropsicológica:</strong> ${client.queixaNeuropsicologica}\n\n`;
        if (client.expectativasTratamento) clinicalInfo += `<strong>Expectativas do Tratamento:</strong> ${client.expectativasTratamento}`;
        
        if (clinicalInfo) {
            const existingObs = client.observations || 'Nenhuma observação.';
            document.getElementById('modal-observacoes-cliente').innerHTML = `
                ${existingObs}
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                    <h4 style="color: var(--primary-color); margin-bottom: 10px;">Informações Clínicas</h4>
                    <div style="white-space: pre-line; line-height: 1.6;">${clinicalInfo}</div>
                </div>
            `;
        }
    }
    
    // NEW: Display assigned professional information
    const assignedProfessionalNameElement = document.getElementById('modal-assigned-professional-name');
    const assignedProfessionalContactElement = document.getElementById('modal-assigned-professional-contact');
    if (client.assignedProfessionalIds && client.assignedProfessionalIds.length > 0) {
        const professionalNames = client.assignedProfessionalIds.map(id => {
            const prof = db.users.find(u => u.id === id);
            return prof ? prof.name : 'Desconhecido';
        }).join(', ');
        assignedProfessionalNameElement.textContent = professionalNames;
        assignedProfessionalContactElement.textContent = `${client.assignedProfessionalIds.length} profissionais vinculados.`;
    } else {
        assignedProfessionalNameElement.textContent = 'Nenhum profissional vinculado.';
        assignedProfessionalContactElement.textContent = '';
    }

    renderAppointmentHistory(client.appointments);
    renderClientNotes(client.notes || []);
    renderClientDocuments(client.documents || []);
    renderClientChangeHistory(client.changeHistory || []); // NEW: Render client change history

    document.getElementById('modal-detalhes-cliente').style.display = 'flex';

    // Disable/enable "Vincular Profissional" button based on user role
    const assignButton = document.getElementById('btn-assign-professional-to-client');
    if (assignButton) {
        if (checkTabAccess('historico', 'edit')) {
            assignButton.style.display = 'inline-flex';
        } else {
            assignButton.style.display = 'none';
        }
    }
    
    // Also consider the "Excluir Cliente" button
    const deleteClientButton = document.getElementById('btn-delete-client');

    if (deleteClientButton) {
        if (checkTabAccess('historico', 'edit') && isRoleAllowed(DIRECTOR_ONLY)) { // Only Director can delete
            deleteClientButton.style.display = 'inline-flex';
        } else {
            deleteClientButton.style.display = 'none';
        }
    }

    // Show/hide "Editar Dados" button based on user role
    const editClientButton = document.getElementById('btn-edit-client');
    if (editClientButton) {
        if (checkTabAccess('historico', 'edit')) {
            editClientButton.style.display = 'inline-flex';
        } else {
            editClientButton.style.display = 'none';
        }
    }

    // NEW: Show/hide "Duplicar Cliente" button
    const duplicateClientButton = document.getElementById('btn-duplicate-client');
    if (duplicateClientButton) {
        if (checkTabAccess('cadastro', 'edit')) { // If they can access registration, they can duplicate
            duplicateClientButton.style.display = 'inline-flex';
        } else {
            duplicateClientButton.style.display = 'none';
        }
    }

    // Show/hide "Adicionar Nota" button
    const addNoteButton = document.getElementById('btn-add-note');
    if (addNoteButton) {
        if (checkTabAccess('historico', 'edit') || checkTabAccess('meus-pacientes', 'edit')) {
            addNoteButton.style.display = 'inline-flex';
        } else {
            addNoteButton.style.display = 'none';
        }
    }

    // Show/hide "Anexar Documento" button
    const addDocumentButton = document.getElementById('btn-add-document');
    if (addDocumentButton) {
        if (checkTabAccess('historico', 'edit') || checkTabAccess('meus-pacientes', 'edit')) {
            addDocumentButton.style.display = 'inline-flex';
        } else {
            addDocumentButton.style.display = 'none';
        }
    }

    // Show/hide "Adicionar ao Histórico" button
    const addHistoryButton = document.getElementById('btn-novo-atendimento');
    if (addHistoryButton) {
        if (checkTabAccess('historico', 'edit') || checkTabAccess('meus-pacientes', 'edit')) {
            addHistoryButton.style.display = 'inline-flex';
        } else {
            addHistoryButton.style.display = 'none';
        }
    }

    // Show/hide "Agendar Novo Atendimento" button
    const scheduleNewAppointmentButton = document.getElementById('btn-schedule-new-appointment');
    if (scheduleNewAppointmentButton) {
        if (checkTabAccess('agenda', 'edit')) {
            scheduleNewAppointmentButton.style.display = 'inline-flex';
        } else {
            scheduleNewAppointmentButton.style.display = 'none';
        }
    }
}

function renderAppointmentHistory(appointments) {
    const historicoContainer = document.getElementById('historico-atendimentos');
    historicoContainer.innerHTML = '';

    if (!appointments || appointments.length === 0) {
        // The empty state is now handled by CSS, so we don't need to add content here
        return;
    }
    
    const sortedAppointments = [...appointments].sort((a,b) => new Date(b.date) - new Date(a.date));

    sortedAppointments.forEach(app => {
        const anamnesis = db.anamnesisTypes.find(a => a.id === app.anamnesisTypeId);
        const card = document.createElement('div');
        card.className = 'atendimento-card';
        
        let attachmentsHtml = '';
        if (app.attachments && app.attachments.length > 0) {
            attachmentsHtml = `
                <div class="appointment-attachments">
                    <strong><i class="fa-solid fa-paperclip"></i> Anexos:</strong>
                    <div class="attachment-list">
                        ${app.attachments.map(attachment => `
                            <a href="${attachment.fileData}" download="${attachment.fileName}" class="attachment-link">
                                <i class="fa-solid fa-download"></i> ${attachment.fileName}
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        const appointmentDate = new Date(app.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
        const isRecent = (new Date() - new Date(app.date)) / (1000 * 60 * 60 * 24) <= 7; // Within 7 days
        
        card.innerHTML = `
            <div class="appointment-header">
                <strong><i class="fa-solid fa-calendar"></i> Data:</strong> ${appointmentDate}
                ${isRecent ? '<span class="recent-badge">RECENTE</span>' : ''}
            </div>
            <div class="appointment-details">
                <p><strong><i class="fa-solid fa-clipboard-list"></i> Sessão/Serviço:</strong> ${anamnesis ? anamnesis.name : (app.serviceType || 'Não especificado')}</p>
                <p><strong><i class="fa-solid fa-user-md"></i> Atendido por:</strong> ${app.attendedBy || 'Não informado'}</p>
                ${app.notes ? `<p><strong><i class="fa-solid fa-sticky-note"></i> Notas:</strong> ${app.notes}</p>` : ''}
                ${app.value !== undefined ? `<p><strong><i class="fa-solid fa-dollar-sign"></i> Valor:</strong> R$ ${(app.value || 0).toFixed(2).replace('.', ',')}</p>` : ''}
                ${app.durationHours !== undefined ? `<p><strong><i class="fa-solid fa-clock"></i> Duração:</strong> ${formatDuration(app.durationHours)}</p>` : ''}
            </div>
            ${attachmentsHtml}
        `;
        historicoContainer.appendChild(card);
    });
}

function renderClientNotes(notes) {
    const notesContainer = document.getElementById('client-notes-list');
    notesContainer.innerHTML = '';

    if (!notes || notes.length === 0) {
        notesContainer.innerHTML = '<p>Nenhuma nota registrada.</p>';
        return;
    }

    const sortedNotes = [...notes].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedNotes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.innerHTML = `
            <h4>${note.title}</h4>
            <div class="note-meta">
                ${new Date(note.date).toLocaleDateString('pt-BR')} - ${note.author || 'Sistema'}
            </div>
            <div class="note-content">${note.content}</div>
        `;
        notesContainer.appendChild(noteCard);
    });
}

function renderClientDocuments(documents) {
    const documentsContainer = document.getElementById('client-documents-list');
    documentsContainer.innerHTML = '';

    if (!documents || documents.length === 0) {
        documentsContainer.innerHTML = '<p>Nenhum documento anexado.</p>';
        return;
    }

    const sortedDocuments = [...documents].sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    sortedDocuments.forEach(doc => {
        const documentCard = document.createElement('div');
        documentCard.className = 'document-card';
        
        const typeLabels = {
            'pagamento': 'Comprovante de Pagamento',
            'laudo': 'Laudo Médico',
            'receita': 'Receita Médica',
            'exame': 'Resultado de Exame',
            'relatorio': 'Relatório de Atendimento',
            'outros': 'Outros'
        };

        const isImage = doc.fileName && /\.(jpe?g|png|gif|webp)$/i.test(doc.fileName);
        const previewButtonHtml = isImage ? `
            <button class="btn-preview" onclick="window.previewFile('${doc.title}', '${doc.fileData}', '${doc.fileName}')">
                <i class="fa-solid fa-eye"></i> Visualizar
            </button>
        ` : '';

        documentCard.innerHTML = `
            <div class="document-info">
                <h4>${doc.title}</h4>
                <div class="document-meta">
                    <span class="document-type">${typeLabels[doc.type] || doc.type}</span>
                    - ${new Date(doc.uploadDate).toLocaleDateString('pt-BR')} por ${doc.uploadedBy || 'Sistema'}
                </div>
                ${doc.description ? `<div class="document-description">${doc.description}</div>` : ''}
            </div>
            <div class="document-actions">
                ${previewButtonHtml}
                <a href="${doc.fileData}" download="${doc.fileName}" class="btn-download">
                    <i class="fa-solid fa-download"></i> Baixar
                </a>
                <button class="btn-delete-doc" onclick="deleteClientDocument(${doc.id})">
                    <i class="fa-solid fa-trash"></i> Excluir
                </button>
            </div>
        `;
        documentsContainer.appendChild(documentCard);
    });
}

export function addClientNote() {
    // Check if current user is allowed to add notes (anyone who can access client details modal should be allowed)
    const currentUserRole = getCurrentUser().role;
    if (!(checkTabAccess('historico', 'edit') || checkTabAccess('meus-pacientes', 'edit'))) {
        showNotification('Você não tem permissão para adicionar notas de cliente.', 'error');
        return;
    }

    const client = db.clients.find(c => c.id === window.currentClientId);
    if (!client) return;

    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();

    if (!title || !content) {
        showNotification('Por favor, preencha todos os campos da nota.', 'warning');
        return;
    }

    if (!client.notes) {
        client.notes = [];
    }

    client.notes.push({
        id: db.nextNoteId++,
        title: title,
        content: content,
        date: new Date().toISOString(),
        author: getCurrentUser().name
    });

    saveDb();
    document.getElementById('modal-add-note').style.display = 'none';
    showClientDetails(window.currentClientId);
    showNotification('Nota adicionada com sucesso!', 'success');
}

export function addClientDocument() {
    // Check if current user is allowed to add documents
    const currentUserRole = getCurrentUser().role;
    if (!(isRoleAllowed(ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES) || isRoleAllowed(PROFESSIONAL_ROLES))) {
        showNotification('Você não tem permissão para anexar documentos a clientes.', 'error');
        return;
    }

    const client = db.clients.find(c => c.id === window.currentClientId);
    if (!client) return;

    const title = document.getElementById('document-title').value.trim();
    const type = document.getElementById('document-type').value;
    const description = document.getElementById('document-description').value.trim();
    const fileInput = document.getElementById('document-file');

    if (!title || !type || !fileInput.files[0]) {
        showNotification('Por favor, preencha todos os campos obrigatórios e selecione um arquivo.', 'warning');
        return;
    }

    const file = fileInput.files[0];
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('O arquivo deve ter no máximo 5MB.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        if (!client.documents) {
            client.documents = [];
        }

        client.documents.push({
            id: db.nextDocumentId++,
            title: title,
            type: type,
            description: description,
            fileName: file.name,
            fileData: e.target.result,
            uploadDate: new Date().toISOString(),
            uploadedBy: getCurrentUser().name
        });

        saveDb();
        document.getElementById('modal-add-document').style.display = 'none';
        document.getElementById('form-add-document').reset();
        showClientDetails(window.currentClientId);
        showNotification('Documento anexado com sucesso!', 'success');
    };

    reader.onerror = function() {
        showNotification('Erro ao processar o arquivo. Tente novamente.', 'error');
    };

    reader.readAsDataURL(file);
}

export function deleteClientDocument(documentId) {
    // Only Director and Coordinators can delete client documents
    if (!isRoleAllowed(COORDINATOR_AND_HIGHER)) {
        showNotification('Você não tem permissão para excluir documentos de cliente.', 'error');
        return;
    }

    const client = db.clients.find(c => c.id === window.currentClientId);
    if (!client || !client.documents) return;

    client.documents = client.documents.filter(doc => doc.id !== documentId);
    saveDb();
    showClientDetails(window.currentClientId);
    showNotification('Documento excluído com sucesso!', 'success');
}

export function renderMeusPacientes(filter = '') {
    const currentUser = getCurrentUser();
    if (!isRoleAllowed(PROFESSIONAL_ROLES)) return; // Ensure only professionals can access this function
    
    const meusPacientesList = document.getElementById('meus-pacientes-list');
    if (!meusPacientesList) return;
    
    meusPacientesList.innerHTML = '';
    
    const lowerCaseFilter = filter.toLowerCase();

    // Filter clients that are *currently assigned* to the current intern/staff/musictherapist
    const filteredClients = db.clients.filter(client => {
        const isAssignedToMe = client.assignedProfessionalIds && client.assignedProfessionalIds.includes(currentUser.id);
        const matchesFilter = lowerCaseFilter === '' || 
                            client.name.toLowerCase().includes(lowerCaseFilter) ||
                            (client.cpf && client.cpf.includes(filter)) ||
                            client.id.toString().includes(filter);
        return isAssignedToMe && matchesFilter;
    });
    
    if (filteredClients.length === 0) {
        meusPacientesList.innerHTML = '<p>Nenhum paciente vinculado a você foi encontrado.</p>';
        return;
    }
    
    filteredClients.forEach(client => {
        const card = document.createElement('div');
        card.className = 'client-card';
        card.dataset.clientId = client.id;

        // Count *all* scheduled appointments for this client with this intern
        const professionalSchedulesCount = db.schedules.filter(s => 
            s.clientId === client.id && s.assignedToUserId === currentUser.id
        ).length;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <h3>${client.name}</h3>
                <span style="background: var(--primary-color); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold;">ID: ${client.id}</span>
            </div>
            <p>${client.email || 'Sem email'}</p>
            <p>${client.cpf || 'Sem CPF'}</p>
            <p><strong>Agendamentos Atribuídos:</strong> ${professionalSchedulesCount}</p>
        `;
        card.addEventListener('click', () => showClientDetails(client.id));
        meusPacientesList.appendChild(card);
    });
}

export function renderClientReport(selectedPeriod = 'all') {
    // The role check for renderClientReport needs to be updated to match the tab visibility
    // If the tab is visible to ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES, then the report should render for them.
    if (!isRoleAllowed(ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES)) { // Updated role check
        // If not allowed, clear the report dashboard and show a message
        const reportDashboard = document.querySelector('.client-report-dashboard');
        if (reportDashboard) {
            reportDashboard.innerHTML = '<p>Você não tem permissão para visualizar este relatório.</p>';
        }
        // Also ensure summary cards are reset or hidden if user doesn't have permission
        document.getElementById('total-clients-count').textContent = '0';
        document.getElementById('adult-clients-count').textContent = '0';
        document.getElementById('minor-clients-count').textContent = '0';
        document.getElementById('clients-with-appointments').textContent = '0';
        document.getElementById('clients-without-recent-appointments').textContent = '0';
        document.getElementById('clients-with-schedules').textContent = '0';
        const periodDisplayElement = document.getElementById('client-report-period-display');
        if (periodDisplayElement) {
             periodDisplayElement.textContent = 'Acesso Restrito';
        }
        // Hide professional statistics if not allowed
        const statsSection = document.getElementById('professional-statistics-section');
        if (statsSection) statsSection.innerHTML = ''; // Clear contents
        return;
    }
    
    let startDate = null;
    let endDate = new Date();
    
    // Calculate date range based on selected period
    switch (selectedPeriod) {
        case 'today':
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'current-week':
            const currentDay = endDate.getDay(); // 0 = Sunday, 1 = Monday...
            startDate = new Date(endDate);
            // Set to the beginning of the week (Monday)
            startDate.setDate(endDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
            startDate.setHours(0, 0, 0, 0);
            
            // Set to the end of the week (Sunday)
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'current-month':
            startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
            endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0); // Last day of current month
            break;
        case 'last-3-months':
            startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 2, 1); // Start 3 months ago (current month + 2 previous)
            endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
            break;
        case 'last-6-months':
            startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 5, 1); // Start 6 months ago
            endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
            break;
        case 'current-year':
            startDate = new Date(endDate.getFullYear(), 0, 1); // January 1st of current year
            endDate = new Date(endDate.getFullYear(), 11, 31); // December 31st of current year
            break;
        case 'all':
        default:
            // No specific date range, all periods
            startDate = null;
            endDate = null; // No upper bound if all periods selected
            break;
    }

    let totalClients = db.clients.length;
    let adultClients = db.clients.filter(client => client.type === 'adult').length;
    let minorClients = db.clients.filter(client => client.type === 'minor').length;
    
    let clientsWithAppointments = new Set();
    let clientsWithRecentAppointments = new Set();
    
    db.clients.forEach(client => {
        if (client.appointments) {
            client.appointments.forEach(app => {
                const appointmentDate = new Date(app.date);
                // Ensure appointment date is valid before comparison
                if (isNaN(appointmentDate.getTime())) {
                    console.warn(`Invalid appointment date for client ${client.id}: ${app.date}`);
                    return;
                }
                
                clientsWithAppointments.add(client.id);

                if (startDate && endDate) { // Only check date range if startDate is defined
                    if (appointmentDate >= startDate && appointmentDate <= endDate) {
                        clientsWithRecentAppointments.add(client.id);
                    }
                } else { // If no specific date range, all are considered "recent" for counting purposes
                    clientsWithRecentAppointments.add(client.id);
                }
            });
        }
    });

    // The 'activeClientsCount' should correctly reflect clients with appointments within the *selected period*
    const activeClientsCount = startDate ? clientsWithRecentAppointments.size : clientsWithAppointments.size;
    const inactiveClientsCount = totalClients - activeClientsCount;

    // Calculate clients with future schedules
    const today = new Date().toISOString().split('T')[0];
    const clientsWithSchedulesSet = new Set();
    db.schedules.forEach(schedule => {
        const client = db.clients.find(c => c.id === schedule.clientId); // Get client for schedule
        if (client && // Ensure client exists
            schedule.date >= today && 
            schedule.status !== 'cancelado'
        ) {
            clientsWithSchedulesSet.add(schedule.clientId);
        }
    });
    const clientsWithSchedules = clientsWithSchedulesSet.size;
    
    // Update summary cards
    document.getElementById('total-clients-count').textContent = totalClients;
    document.getElementById('adult-clients-count').textContent = adultClients;
    document.getElementById('minor-clients-count').textContent = minorClients;
    document.getElementById('clients-with-appointments').textContent = activeClientsCount;
    document.getElementById('clients-without-recent-appointments').textContent = inactiveClientsCount;
    document.getElementById('clients-with-schedules').textContent = clientsWithSchedules;
    
    // Update period display
    const periodNames = {
        'today': 'Hoje',
        'current-week': 'Esta semana',
        'all': 'Todos os períodos',
        'current-month': 'Mês atual',
        'last-3-months': 'Últimos 3 meses',
        'last-6-months': 'Últimos 6 meses',
        'current-year': 'Ano atual'
    };
    
    const periodDisplayElement = document.getElementById('client-report-period-display');
    if (periodDisplayElement) {
        periodDisplayElement.textContent = periodNames[selectedPeriod] || 'Todos os períodos';
    }
    
    // Get search filters
    const professionalFilter = document.getElementById('search-professional-report') ? document.getElementById('search-professional-report').value : '';
    const clientFilter = document.getElementById('search-client-report') ? document.getElementById('search-client-report').value : '';

    // Render professional statistics with filter
    renderProfessionalStatistics(professionalFilter, startDate, endDate);
    
    // Render client details with filter
    renderClientReportDetails(startDate, endDate, clientFilter);

    // NEW: Populate datalists for report search bars
    const clientDatalist = document.getElementById('client-report-datalist');
    if (clientDatalist) {
        clientDatalist.innerHTML = '';
        db.clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.name;
            clientDatalist.appendChild(option);
        });
    }

    const professionalDatalist = document.getElementById('professional-report-datalist');
    if (professionalDatalist) {
        professionalDatalist.innerHTML = '';
        const professionals = db.users.filter(user => PROFESSIONAL_ROLES.includes(user.role));
        professionals.forEach(prof => {
            const option = document.createElement('option');
            option.value = prof.name;
            professionalDatalist.appendChild(option);
        });
    }
}

function renderProfessionalStatistics(filter = '', startDate, endDate) {
    // Check if statistics section already exists, if not create it
    let statsSection = document.getElementById('professional-statistics-section');
    if (!statsSection) {
        statsSection = document.createElement('div');
        statsSection.id = 'professional-statistics-section';
        statsSection.className = 'intern-statistics-section'; // Reuse styling
        
        // Insert after client summary grid but before client details
        const clientDetailsSection = document.querySelector('.client-details-section');
        if (clientDetailsSection) {
            clientDetailsSection.parentNode.insertBefore(statsSection, clientDetailsSection);
        } else {
            // Fallback for unexpected DOM structure (shouldn't happen with current HTML)
            const reportDashboard = document.getElementById('client-report-dashboard');
            if (reportDashboard) {
                reportDashboard.prepend(statsSection);
            }
        }
    }
    
    // Get all professionals (staff and interns)
    const professionals = db.users.filter(user => PROFESSIONAL_ROLES.includes(user.role)); // Use imported constant
    
    if (professionals.length === 0) {
        statsSection.innerHTML = '<h3>Estatísticas dos Profissionais</h3><p>Nenhum funcionário cadastrado.</p>';
        return;
    }

    const lowerCaseFilter = filter.toLowerCase();
    const filteredProfessionals = professionals.filter(prof => prof.name.toLowerCase().includes(lowerCaseFilter));
    
    // Calculate statistics for each professional
    const professionalStats = filteredProfessionals.map(professional => {
        // Get unique clients *currently assigned* to this professional
        const assignedClients = db.clients.filter(client => 
            client.assignedProfessionalIds && client.assignedProfessionalIds.includes(professional.id)
        );
        
        // Get all appointments performed by this professional
        const attendedAppointments = [];
        db.clients.forEach(client => {
            if (client.appointments) {
                client.appointments.forEach(app => {
                    const attendedByUser = db.users.find(u => u.name === app.attendedBy);
                    if (attendedByUser && attendedByUser.id === professional.id) {
                        const appointmentDate = new Date(app.date);
                        if (isNaN(appointmentDate.getTime())) return;

                        if ((!startDate || appointmentDate >= startDate) && (!endDate || appointmentDate <= endDate)) {
                            attendedAppointments.push({ ...app, clientName: client.name, clientId: client.id });
                        }
                    }
                });
            }
        });

        const appointmentsCount = attendedAppointments.length;
        const totalHoursAttended = attendedAppointments.reduce((total, app) => total + (app.durationHours || 0), 0);
        
        // Count active schedules
        const today = new Date().toISOString().split('T')[0];
        const activeSchedules = db.schedules.filter(schedule => 
            schedule.assignedToUserId === professional.id &&
            schedule.date >= today &&
            schedule.status !== 'cancelado'
        ).length;
        
        return {
            professional,
            assignedClients,
            clientsCount: assignedClients.length,
            appointmentsCount,
            attendedAppointments, // Add this to the returned object
            totalHoursAttended, 
            activeSchedules
        };
    });
    
    statsSection.innerHTML = `
        <div class="report-section-header">
             <h3>Estatísticas dos Profissionais</h3>
             <div class="search-container">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" id="search-professional-report" placeholder="Buscar profissional..." value="${filter}" list="professional-report-datalist">
                <datalist id="professional-report-datalist"></datalist>
            </div>
        </div>
        <div class="intern-stats-grid">
            ${professionalStats.length > 0 ? professionalStats.map(stat => `
                <div class="intern-stat-card">
                    <div class="intern-header">
                        <h4>${stat.professional.name} <small>(${stat.professional.role === 'staff' ? 'Funcionário' : (stat.professional.role === 'intern' ? 'Estagiário' : 'Musicoterapeuta')})</small></h4>
                        <div class="intern-badges">
                            <span class="badge clients-badge">${stat.clientsCount} pacientes</span>
                            <span class="badge schedules-badge">${stat.activeSchedules} agendados</span>
                        </div>
                    </div>
                    <div class="intern-metrics">
                        <div class="metric">
                            <i class="fa-solid fa-users"></i>
                            <span>Pacientes Vinculados</span>
                            <strong>${stat.clientsCount}</strong>
                        </div>
                        <div class="metric">
                            <i class="fa-solid fa-calendar-check"></i>
                            <span>Atendimentos (Período)</span>
                            <strong>${stat.appointmentsCount}</strong>
                        </div>
                        <div class="metric">
                            <i class="fa-solid fa-hourglass-half"></i>
                            <span>Horas (Período)</span>
                            <strong>${stat.totalHoursAttended > 0 ? formatDuration(stat.totalHoursAttended) : '0min'}</strong>
                        </div>
                        <div class="metric">
                            <i class="fa-solid fa-clock"></i>
                            <span>Agendamentos Ativos</span>
                            <strong>${stat.activeSchedules}</strong>
                        </div>
                    </div>
                    ${stat.assignedClients.length > 0 ? `
                        <div class="professional-appointments">
                            <h5>Pacientes Vinculados:</h5>
                            <div class="appointments-list">
                                ${stat.assignedClients.sort((a,b) => a.name.localeCompare(b.name)).slice(0, 5).map(client => `
                                    <div class="appointment-item" onclick="window.showClientDetails(${client.id})">
                                        <div class="appointment-item-info">
                                            <span class="client-name">${client.name}</span>
                                        </div>
                                    </div>
                                `).join('')}
                                ${stat.assignedClients.length > 5 ? `<div class="more-appointments-indicator">... e mais ${stat.assignedClients.length - 5}</div>` : ''}
                            </div>
                        </div>
                    ` : `
                        <div class="intern-clients">
                            <p class="no-clients">Nenhum paciente vinculado</p>
                        </div>
                    `}
                    <div class="intern-card-footer">
                        <button class="btn-secondary btn-generate-report" onclick="window.showEmployeeReport(${stat.professional.id})">
                            <i class="fa-solid fa-file-invoice"></i> Gerar Relatório
                        </button>
                    </div>
                </div>
            `).join('') : '<p class="empty-state-message">Nenhum profissional encontrado.</p>'}
        </div>
    `;

    // Add event listener to the newly created search input
    const searchInput = document.getElementById('search-professional-report');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const currentPeriod = document.getElementById('client-report-period').value;
            renderClientReport(currentPeriod);
        });
    }
}

function renderClientReportDetails(startDate, endDate, filter = '') {
    const clientReportList = document.getElementById('client-report-list');
    clientReportList.innerHTML = '';
    
    if (db.clients.length === 0) {
        clientReportList.innerHTML = '<p>Nenhum cliente cadastrado.</p>';
        return;
    }
    
    const lowerCaseFilter = filter.toLowerCase();
    const filteredClients = db.clients.filter(client => client.name.toLowerCase().includes(lowerCaseFilter));

    if (filteredClients.length === 0) {
        clientReportList.innerHTML = '<p class="empty-state-message">Nenhum cliente encontrado.</p>';
        return;
    }

    filteredClients.forEach(client => {
        let totalAppointments = 0;
        let totalValue = 0;
        let periodAppointments = 0;
        let periodValue = 0;
        
        if (client.appointments) {
            client.appointments.forEach(appointment => {
                const appointmentDate = new Date(appointment.date);
                 if (isNaN(appointmentDate.getTime())) { // Skip invalid dates
                    console.warn(`Invalid appointment date in report for client ${client.id}: ${appointment.date}`);
                    return;
                }

                totalAppointments++;
                totalValue += appointment.value || 0;
                
                if (!startDate || (appointmentDate >= startDate && appointmentDate <= endDate)) {
                    periodAppointments++;
                    periodValue += appointment.value || 0;
                }
            });
        }
        
        // Count future schedules for this client
        const today = new Date().toISOString().split('T')[0];
        const clientsWithSchedulesSet = new Set();
        db.schedules.forEach(schedule => {
            if (schedule.clientId === client.id && 
                schedule.date >= today && 
                schedule.status !== 'cancelado'
            ) {
                clientsWithSchedulesSet.add(schedule.clientId);
            }
        });
        const clientsWithSchedules = clientsWithSchedulesSet.size;
        
        // Get assigned professional information from client.assignedProfessionalIds
        let assignedProfessionalNameDisplay = 'Não Vinculado';
        if (client.assignedProfessionalIds && client.assignedProfessionalIds.length > 0) {
            const profNames = client.assignedProfessionalIds.map(id => {
                const prof = db.users.find(u => u.id === id);
                return prof ? prof.name.split(' ')[0] : 'Desconhecido';
            }).join(', ');
            assignedProfessionalNameDisplay = profNames;
        }
        
        // Get unit display name
        const unitMap = {
            'madre': 'Clínica Social (Madre)',
            'floresta': 'Neuro (Floresta)'
        };
        const clientUnitDisplay = unitMap[client.unit] || 'N/A';
        
        // Get last appointment date
        let lastAppointmentDate = 'Nunca';
        if (client.appointments && client.appointments.length > 0) {
            const sortedAppointments = [...client.appointments].sort((a, b) => new Date(b.date) - new Date(a.date));
            const lastValidAppointment = sortedAppointments.find(app => !isNaN(new Date(app.date).getTime()));
            if (lastValidAppointment) {
                lastAppointmentDate = new Date(lastValidAppointment.date).toLocaleDateString('pt-BR');
            }
        }
        
        const card = document.createElement('div');
        card.className = 'client-report-card';
        card.innerHTML = `
            <div class="card-header">
                <h4>
                    ${client.name}
                    <span class="client-type-badge ${client.type === 'minor' ? 'minor' : ''}">${client.type === 'adult' ? 'Adulto' : 'Menor'}</span>
                </h4>
                <div class="assigned-interns">
                    <i class="fa-solid fa-user-graduate"></i>
                    <span>Profissional: ${assignedProfessionalNameDisplay}</span>
                </div>
            </div>
            <div class="client-report-metrics">
                <div class="metric-item">
                    <i class="fa-solid fa-house-medical"></i>
                    <span>Unidade</span>
                    <strong>${clientUnitDisplay}</strong>
                </div>
                <div class="metric-item">
                    <i class="fa-solid fa-calendar-check"></i>
                    <span>Atendimentos (Período)</span>
                    <strong>${periodAppointments}</strong>
                </div>
                <div class="metric-item">
                    <i class="fa-solid fa-calendar-alt"></i>
                    <span>Atendimentos (Total)</span>
                    <strong>${totalAppointments}</strong>
                </div>
                <div class="metric-item">
                    <i class="fa-solid fa-money-bill-wave"></i>
                    <span>Valor (Período)</span>
                    <strong>R$ ${periodValue.toFixed(2).replace('.', ',')}</strong>
                </div>
                <div class="metric-item">
                    <i class="fa-solid fa-dollar-sign"></i>
                    <span>Valor (Total)</span>
                    <strong>R$ ${totalValue.toFixed(2).replace('.', ',')}</strong>
                </div>
                <div class="metric-item">
                    <i class="fa-solid fa-clock"></i>
                    <span>Último Atendimento</span>
                    <strong>${lastAppointmentDate}</strong>
                </div>
                <div class="metric-item">
                    <i class="fa-solid fa-calendar-plus"></i>
                    <span>Agendamentos Futuros</span>
                    <strong>${clientsWithSchedules}</strong>
                </div>
            </div>
        `;
        
        // Add click handler to show client details
        card.addEventListener('click', () => showClientDetails(client.id));
        card.style.cursor = 'pointer';
        
        clientReportList.appendChild(card);
    });
}

// NEW FUNCTIONALITY: Assign/Unassign professional to client
export function showAssignProfessionalModal(clientId) {
    const client = db.clients.find(c => c.id === clientId);
    if (!client) return;

    window.currentClientToAssign = clientId; // Store current client ID
    
    const clientInfoElement = document.getElementById('assign-professional-client-info');
    if (clientInfoElement) {
        clientInfoElement.textContent = `Paciente: ${client.name} (ID: ${client.id})`;
    }

    const professionalsListContainer = document.getElementById('assign-professionals-list');
    professionalsListContainer.innerHTML = ''; // Clear previous content
    professionalsListContainer.className = 'assign-professionals-grid'; // Use grid layout

    const professionals = db.users.filter(user => PROFESSIONAL_ROLES.includes(user.role)).sort((a,b) => a.name.localeCompare(b.name));
    
    if (professionals.length === 0) {
        professionalsListContainer.innerHTML = '<p>Nenhum profissional cadastrado.</p>';
    } else {
        const roleMap = {
            'staff': 'Funcionário(a) Geral',
            'intern': 'Estagiário(a)',
            'musictherapist': 'Musicoterapeuta',
            'psychologist': 'Psicólogo(a)',
            'psychopedagogue': 'Psicopedagogo(a)',
            'speech_therapist': 'Fonoaudiólogo(a)',
            'nutritionist': 'Nutricionista',
            'physiotherapist': 'Fisioterapeuta'
        };

        professionals.forEach(prof => {
            const isChecked = client.assignedProfessionalIds && client.assignedProfessionalIds.includes(prof.id);
            const card = document.createElement('div');
            card.className = `professional-assignment-card ${isChecked ? 'selected' : ''}`;
            const checkboxId = `prof-assign-${prof.id}`;

            card.innerHTML = `
                <div class="prof-info">
                    <span class="prof-name">${prof.name}</span>
                    <span class="prof-role">${roleMap[prof.role] || prof.role}</span>
                </div>
                <div class="custom-checkbox"></div>
                <input type="checkbox" id="${checkboxId}" value="${prof.id}" ${isChecked ? 'checked' : ''} style="display:none;">
            `;

            // Event listener for the whole card
            card.addEventListener('click', () => {
                const checkbox = card.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                card.classList.toggle('selected', checkbox.checked);
            });
            
            professionalsListContainer.appendChild(card);
        });
    }

    document.getElementById('modal-detalhes-cliente').style.display = 'none'; // Hide client details
    document.getElementById('modal-assign-professional').style.display = 'flex';
}

export function assignProfessionalToClient() { // This function is now for saving the assignments
    const clientId = window.currentClientToAssign;
    const client = db.clients.find(c => c.id === clientId);
    if (!client) {
        showNotification('Erro: Paciente não encontrado.', 'error');
        return;
    }

    const checkboxes = document.querySelectorAll('#assign-professionals-list input[type="checkbox"]:checked');
    const newAssignedIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    const oldAssignedIds = client.assignedProfessionalIds || [];
    
    // Find newly added and removed professionals for history and notifications
    const addedProfIds = newAssignedIds.filter(id => !oldAssignedIds.includes(id));
    const removedProfIds = oldAssignedIds.filter(id => !newAssignedIds.includes(id));

    if (addedProfIds.length === 0 && removedProfIds.length === 0) {
        showNotification('Nenhuma alteração nos vínculos foi feita.', 'info');
        document.getElementById('modal-assign-professional').style.display = 'none';
        showClientDetails(clientId);
        return;
    }

    const getProfNames = (ids) => ids.map(id => {
        const prof = db.users.find(u => u.id === id);
        return prof ? prof.name : 'Desconhecido';
    }).join(', ') || 'Nenhum';
    
    // Add change history
    if (!client.changeHistory) client.changeHistory = [];
    client.changeHistory.push({
        id: db.nextChangeId++,
        date: new Date().toISOString(),
        changedBy: getCurrentUser().name,
        changes: [{
            field: 'Profissionais Vinculados',
            oldValue: getProfNames(oldAssignedIds),
            newValue: getProfNames(newAssignedIds)
        }]
    });

    // Send notifications to newly assigned professionals
    addedProfIds.forEach(profId => {
        if (!db.notifications) db.notifications = [];
        db.notifications.push({
            id: db.nextNotificationId++,
            userId: profId,
            type: 'client_assignment',
            title: 'Novo Paciente Vinculado',
            message: `Você foi vinculado como profissional responsável pelo paciente: ${client.name}.`,
            relatedId: client.id,
            createdAt: new Date().toISOString(),
            isRead: false
        });
    });

    // Update client data
    client.assignedProfessionalIds = newAssignedIds;

    saveDb();
    document.getElementById('modal-assign-professional').style.display = 'none';
    showClientDetails(clientId); // Refresh client details
    renderClientList(); // Refresh client list to show updated count
    showNotification(`Vínculos do paciente atualizados com sucesso!`, 'success');
}

export function unassignProfessionalFromClient() {
    // This function is now deprecated and combined into assignProfessionalToClient.
    // Kept here to avoid breaking old onclicks, but it can be removed.
    console.warn('unassignProfessionalFromClient is deprecated.');
}

// NEW: Delete client (Coordinator only)
export function deleteClient(clientId) {
    if (!checkTabAccess('historico', 'edit') || !isRoleAllowed(DIRECTOR_ONLY)) { // Only Director can delete
        showNotification('Você não tem permissão para excluir clientes.', 'error');
        return;
    }

    const clientToDelete = db.clients.find(c => c.id === clientId);
    if (!clientToDelete) {
        showNotification('Cliente não encontrado.', 'error');
        return;
    }

    const clientName = clientToDelete.name;

    // Remove client from clients array
    db.clients = db.clients.filter(c => c.id !== clientId);

    // Remove any schedules associated with this client
    db.schedules = db.schedules.filter(s => s.clientId !== clientId);

    // Appointments are stored *within* the client object, so they are removed automatically.
    
    saveDb();
    document.getElementById('modal-detalhes-cliente').style.display = 'none'; // Close details modal
    renderClientList(); // Re-render the client list
    showNotification(`Cliente "${clientName}" excluído com sucesso!`, 'success');
    updateGlobalSearchDatalist();
}

// NEW FUNCTION: Render Client Change History
function renderClientChangeHistory(history) {
    const historyContainer = document.getElementById('client-change-history-list');
    if (!historyContainer) return; // Ensure the container exists

    historyContainer.innerHTML = ''; // Clear previous content

    if (!history || history.length === 0) {
        historyContainer.innerHTML = '<p>Nenhuma alteração registrada para este paciente.</p>';
        return;
    }

    const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date (newest first)

    sortedHistory.forEach(entry => {
        const changeCard = document.createElement('div');
        changeCard.className = 'change-card';
        
        const changesList = entry.changes.map(change => 
            `<li><strong>${change.field}:</strong> De "${change.oldValue || 'Vazio'}" para "${change.newValue || 'Vazio'}"</li>`
        ).join('');

        changeCard.innerHTML = `
            <div class="change-meta">
                Alterado em ${new Date(entry.date).toLocaleString('pt-BR')} por ${entry.changedBy}
            </div>
            <ul class="change-details">${changesList}</ul>
        `;
        historyContainer.appendChild(changeCard);
    });
}

// NEW FUNCTION: Duplicate Client
export function duplicateClient(clientId) {
    const client = db.clients.find(c => c.id === clientId);
    if (!client) {
        showNotification('Cliente não encontrado para duplicação.', 'error');
        return;
    }

    // Close modal
    document.getElementById('modal-detalhes-cliente').style.display = 'none';

    // Switch to registration tab
    switchTab('cadastro');

    if (client.type === 'adult') {
        // Show adult form
        document.querySelector('input[name="age-type"][value="adult"]').checked = true;
        document.getElementById('form-novo-cliente-adulto').style.display = 'block';
        document.getElementById('form-novo-cliente-menor').style.display = 'none';
        
        // Populate adult form
        document.getElementById('nome-cliente-adulto').value = `${client.name} (Cópia)`;
        document.getElementById('data-nascimento-adulto').value = client.birthDate || '';
        document.getElementById('genero-adulto').value = client.gender || '';
        document.getElementById('cpf-cliente-adulto').value = ''; // Clear unique field
        document.getElementById('rg-adulto').value = client.rg || '';
        document.getElementById('naturalidade-adulto').value = client.naturalidade || '';
        document.getElementById('estado-civil-adulto').value = client.estadoCivil || '';
        document.getElementById('escolaridade-adulto').value = client.escolaridade || '';
        document.getElementById('profissao-adulto').value = client.profissao || '';
        document.getElementById('email-cliente-adulto').value = client.email || '';
        document.getElementById('telefone-cliente-adulto').value = client.phone || '';
        document.getElementById('contato-emergencia-adulto').value = client.contatoEmergencia || '';
        document.getElementById('unidade-atendimento-adulto').value = client.unit || '';
        document.getElementById('cep-cliente-adulto').value = client.cep || '';
        document.getElementById('logradouro-cliente-adulto').value = client.address || '';
        document.getElementById('numero-cliente-adulto').value = client.number || '';
        document.getElementById('complemento-cliente-adulto').value = client.complement || '';
        document.getElementById('bairro-cliente-adulto').value = client.neighborhood || '';
        document.getElementById('cidade-cliente-adulto').value = client.city || '';
        document.getElementById('estado-cidade-adulto').value = client.state || '';
        document.getElementById('observacoes-cliente-adulto').value = client.observations || '';
        document.getElementById('diagnostico-principal-adulto').value = client.diagnosticoPrincipal || '';
        document.getElementById('historico-medico-adulto').value = client.historicoMedico || '';
        document.getElementById('queixa-neuropsicologica-adulto').value = client.queixaNeuropsicologica || '';
        document.getElementById('expectativas-tratamento-adulto').value = client.expectativasTratamento || '';
    } else { // minor
        // Show minor form
        document.querySelector('input[name="age-type"][value="minor"]').checked = true;
        document.getElementById('form-novo-cliente-adulto').style.display = 'none';
        document.getElementById('form-novo-cliente-menor').style.display = 'block';

        // Populate minor form
        document.getElementById('nome-cliente-menor').value = `${client.name} (Cópia)`;
        document.getElementById('data-nascimento-menor').value = client.birthDate || '';
        document.getElementById('genero-menor').value = client.gender || '';
        document.getElementById('escola-menor').value = client.escola || '';
        document.getElementById('tipo-escola-menor').value = client.tipoEscola || '';
        document.getElementById('ano-escolar-menor').value = client.anoEscolar || '';
        document.getElementById('unidade-atendimento-menor').value = client.unit || '';
        document.getElementById('nome-pai').value = client.nomePai || '';
        document.getElementById('idade-pai').value = client.idadePai || '';
        document.getElementById('profissao-pai').value = client.profissaoPai || '';
        document.getElementById('telefone-pai').value = client.telefonePai || '';
        document.getElementById('nome-mae').value = client.nomeMae || '';
        document.getElementById('idade-mae').value = client.idadeMae || '';
        document.getElementById('profissao-mae').value = client.profissaoMae || '';
        document.getElementById('telefone-mae').value = client.telefoneMae || '';
        document.getElementById('responsavel-financeiro').value = client.responsavelFinanceiro || '';
        document.getElementById('outro-responsavel').value = client.outroResponsavel || '';
        document.getElementById('cep-cliente-menor').value = client.cep || '';
        document.getElementById('logradouro-cliente-menor').value = client.address || '';
        document.getElementById('numero-cliente-menor').value = client.number || '';
        document.getElementById('complemento-cliente-menor').value = client.complement || '';
        document.getElementById('bairro-cliente-menor').value = client.neighborhood || '';
        document.getElementById('cidade-cliente-menor').value = client.city || '';
        document.getElementById('estado-cliente-menor').value = client.state || '';
        document.getElementById('observacoes-cliente-menor').value = client.observations || '';
        document.getElementById('diagnostico-principal-menor').value = client.diagnosticoPrincipal || '';
        document.getElementById('historico-medico-menor').value = client.historicoMedico || '';
        document.getElementById('queixa-neuropsicologica-menor').value = client.queixaNeuropsicologica || '';
        document.getElementById('expectativas-tratamento-menor').value = client.expectativasTratamento || '';
    }

    showNotification('Dados do cliente pré-preenchidos. Edite e salve como um novo cliente.', 'info', 'Cliente Duplicado', 7000);
    window.scrollTo(0, 0);
}

// NEW FUNCTION: Show Client Report Modal
export function showClientReportModal(clientId) {
    if (!checkTabAccess('relatorios', 'view')) {
        showNotification('Você não tem permissão para gerar relatórios de clientes.', 'error');
        return;
    }

    window.currentClientReportId = clientId;

    const mainPeriodSelector = document.getElementById('client-report-period');
    const selectedPeriod = mainPeriodSelector ? mainPeriodSelector.value : 'all';

    const clientPeriodSelector = document.getElementById('client-report-period-selector-modal');
    if (clientPeriodSelector) {
        clientPeriodSelector.value = selectedPeriod;
    }

    generateClientReport(clientId, selectedPeriod);

    document.getElementById('modal-client-report').style.display = 'flex';
}

// NEW FUNCTION: Generate Client Report
export function generateClientReport(clientId, selectedPeriod) {
    const reportContent = document.getElementById('client-report-content');
    const reportTitle = document.getElementById('client-report-title');
    if (!reportContent || !reportTitle) return;

    const client = db.clients.find(c => c.id === clientId);
    if (!client) {
        reportContent.innerHTML = '<p>Paciente não encontrado.</p>';
        return;
    }

    // Date range calculation
    let startDate = null;
    let endDate = new Date();
    
    switch (selectedPeriod) {
        case 'today': startDate = new Date(); startDate.setHours(0, 0, 0, 0); endDate = new Date(); endDate.setHours(23, 59, 59, 999); break;
        case 'current-week': const currentDay = endDate.getDay(); startDate = new Date(endDate); startDate.setDate(endDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1)); startDate.setHours(0, 0, 0, 0); endDate = new Date(startDate); endDate.setDate(startDate.getDate() + 6); endDate.setHours(23, 59, 59, 999); break;
        case 'current-month': startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1); endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0); break;
        case 'last-3-months': startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 2, 1); endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0); break;
        case 'last-6-months': startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 5, 1); endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0); break;
        case 'current-year': startDate = new Date(endDate.getFullYear(), 0, 1); endDate = new Date(endDate.getFullYear(), 11, 31); break;
        case 'all': default: startDate = null; endDate = null; break;
    }

    const periodNames = {
        'today': 'Hoje', 'current-week': 'Esta semana', 'all': 'Todos os períodos',
        'current-month': 'Mês atual', 'last-3-months': 'Últimos 3 meses',
        'last-6-months': 'Últimos 6 meses', 'current-year': 'Ano atual'
    };
    reportTitle.textContent = `Relatório do Paciente: ${client.name} (${periodNames[selectedPeriod]})`;

    // --- Gather Data ---
    // 1. Appointments in period
    const periodAppointments = (client.appointments || []).filter(app => {
        const appointmentDate = new Date(app.date);
        if (isNaN(appointmentDate.getTime())) return false;
        return (!startDate || appointmentDate >= startDate) && (!endDate || appointmentDate <= endDate);
    });

    // 2. Summary Stats
    const appointmentsCount = periodAppointments.length;
    const totalHoursAttended = periodAppointments.reduce((total, app) => total + (app.durationHours || 0), 0);
    const totalRevenueGenerated = periodAppointments.reduce((total, app) => total + (app.value || 0), 0);

    // 3. Assigned Professionals
    const assignedProfessionals = (client.assignedProfessionalIds || [])
        .map(id => db.users.find(u => u.id === id))
        .filter(Boolean); // Filter out any undefined users

    // 4. Client Notes in period
    const periodNotes = (client.notes || []).filter(note => {
        const noteDate = new Date(note.date);
        if (isNaN(noteDate.getTime())) return false;
        return (!startDate || noteDate >= startDate) && (!endDate || noteDate <= endDate);
    });

    // 5. Change History in period
    const periodChanges = (client.changeHistory || []).filter(change => {
        const changeDate = new Date(change.date);
        if (isNaN(changeDate.getTime())) return false;
        return (!startDate || changeDate >= startDate) && (!endDate || changeDate <= endDate);
    });

    // --- Render Report ---
    reportContent.innerHTML = `
        <div class="report-header-print-only" style="display: none; text-align: center; margin-bottom: 20px;">
            <img src="/a/49d033c0-1aa2-45a1-9af1-c94e6e9ce71d" alt="Logo" style="max-height: 60px; margin-bottom: 10px;">
            <h2>${reportTitle.textContent}</h2>
            <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>

        <div class="report-section">
            <h3>Dados do Paciente</h3>
            <div class="client-report-data-grid">
                <p><strong>Nome:</strong> ${client.name}</p>
                <p><strong>ID:</strong> ${client.id}</p>
                <p><strong>Data de Nasc.:</strong> ${new Date(client.birthDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                <p><strong>CPF:</strong> ${client.cpf || 'N/A'}</p>
                <p><strong>Telefone:</strong> ${client.phone || (client.telefoneMae || 'N/A')}</p>
                <p><strong>Email:</strong> ${client.email || 'N/A'}</p>
                <p><strong>Endereço:</strong> ${client.address || ''}, ${client.number || 'S/N'} - ${client.neighborhood || ''}, ${client.city || ''}</p>
                <p><strong>Profissionais Vinculados:</strong> ${assignedProfessionals.length > 0 ? assignedProfessionals.map(p => p.name).join(', ') : 'Nenhum'}</p>
            </div>
        </div>
        
        <div class="report-section">
            <h3>Informações Clínicas</h3>
            <div class="client-report-clinical-info">
                <p><strong>Diagnóstico Principal:</strong> ${client.diagnosticoPrincipal || 'Não informado'}</p>
                <p><strong>Histórico Médico Relevante:</strong> ${client.historicoMedico || 'Não informado'}</p>
                <p><strong>Queixa Principal Neuropsicológica:</strong> ${client.queixaNeuropsicologica || 'Não informada'}</p>
                <p><strong>Expectativas do Tratamento:</strong> ${client.expectativasTratamento || 'Não informadas'}</p>
            </div>
        </div>

        <div class="report-summary" style="margin-bottom: 2rem;">
            <h3>Resumo do Período</h3>
            <div class="report-summary-grid">
                <div class="report-summary-item">
                    <h4><i class="fa-solid fa-calendar-check"></i> Atendimentos</h4>
                    <div class="summary-value">${appointmentsCount}</div>
                </div>
                <div class="report-summary-item">
                    <h4><i class="fa-solid fa-hourglass-half"></i> Horas de Atendimento</h4>
                    <div class="summary-value">${formatDuration(totalHoursAttended)}</div>
                </div>
                <div class="report-summary-item revenue">
                    <h4><i class="fa-solid fa-money-bill-wave"></i> Valor Total</h4>
                    <div class="summary-value">R$ ${totalRevenueGenerated.toFixed(2).replace('.', ',')}</div>
                </div>
            </div>
        </div>

        <div class="report-section">
            <h3>Detalhes dos Atendimentos no Período</h3>
            ${appointmentsCount > 0 ? `
                <div class="report-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Serviço</th>
                                <th>Profissional</th>
                                <th>Duração</th>
                                <th>Valor (R$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${periodAppointments.sort((a,b) => new Date(b.date) - new Date(a.date)).map(app => `
                                <tr>
                                    <td>${new Date(app.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                    <td>${app.anamnesisTypeId || (app.serviceType ? db.serviceNames[app.serviceType] : 'N/A')}</td>
                                    <td>${app.attendedBy || 'N/A'}</td>
                                    <td>${formatDuration(app.durationHours)}</td>
                                    <td>R$ ${(app.value || 0).toFixed(2).replace('.', ',')}</td>
                                </tr>
                                ${app.notes ? `
                                <tr class="appointment-notes-row">
                                    <td colspan="5">
                                        <div class="appointment-notes-content"><strong>Anotações:</strong> ${app.notes}</div>
                                    </td>
                                </tr>
                                ` : ''}
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p>Nenhum atendimento realizado no período selecionado.</p>'}
        </div>
        
        <div class="report-section">
            <h3>Notas do Paciente no Período</h3>
            ${periodNotes.length > 0 ? `
                <div class="report-notes-list">
                    ${periodNotes.sort((a,b) => new Date(b.date) - new Date(a.date)).map(note => `
                        <div class="report-note-item">
                            <div class="note-date-title">
                                <span class="note-date">${new Date(note.date).toLocaleDateString('pt-BR')}</span>
                                <span class="note-title">${note.title}</span>
                            </div>
                            <div class="note-content">${note.content}</div>
                            <small class="note-author">Por: ${note.author}</small>
                        </div>
                    `).join('')}
                </div>
            ` : '<p>Nenhuma nota registrada para este paciente no período selecionado.</p>'}
        </div>

        <div class="report-section">
            <h3>Histórico de Alterações no Período</h3>
             ${periodChanges.length > 0 ? `
                <div class="report-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Alterado por</th>
                                <th>Campo</th>
                                <th>Valor Antigo</th>
                                <th>Novo Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${periodChanges.flatMap(entry => 
                                entry.changes.map(change => `
                                    <tr>
                                        <td>${new Date(entry.date).toLocaleString('pt-BR')}</td>
                                        <td>${entry.changedBy}</td>
                                        <td>${change.field}</td>
                                        <td>${change.oldValue || 'Vazio'}</td>
                                        <td>${change.newValue || 'Vazio'}</td>
                                    </tr>
                                `).join('')
                            ).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p>Nenhuma alteração registrada para este paciente no período selecionado.</p>'}
        </div>

        <div class="report-footer" style="display: none;">
            <p>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
    `;
}

export function showEmployeeReport(employeeId) {
    // Store the current employee ID for the update button
    window.currentEmployeeReportId = employeeId;
    
    // Get the period from the main client report dashboard to sync them initially
    const mainPeriodSelector = document.getElementById('client-report-period');
    const selectedPeriod = mainPeriodSelector ? mainPeriodSelector.value : 'all';

    // Set the dropdown in the employee modal to match
    const employeePeriodSelector = document.getElementById('employee-report-period-selector');
    if (employeePeriodSelector) {
        employeePeriodSelector.value = selectedPeriod;
    }
    
    // Generate the report with the synced period
    generateEmployeeReport(employeeId, selectedPeriod);
    
    // Show the modal
    document.getElementById('modal-employee-report').style.display = 'flex';
}

function generateEmployeeReport(employeeId, selectedPeriod) {
    const reportContent = document.getElementById('employee-report-content');
    const reportTitle = document.getElementById('employee-report-title');
    if (!reportContent || !reportTitle) return;

    const employee = db.users.find(u => u.id === employeeId);
    if (!employee) {
        reportContent.innerHTML = '<p>Funcionário não encontrado.</p>';
        return;
    }

    // Date range calculation (copied from renderClientReport)
    let startDate = null;
    let endDate = new Date();
    switch (selectedPeriod) {
        case 'today': startDate = new Date(); startDate.setHours(0, 0, 0, 0); endDate = new Date(); endDate.setHours(23, 59, 59, 999); break;
        case 'current-week': const currentDay = endDate.getDay(); startDate = new Date(endDate); startDate.setDate(endDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1)); startDate.setHours(0, 0, 0, 0); endDate = new Date(startDate); endDate.setDate(startDate.getDate() + 6); endDate.setHours(23, 59, 59, 999); break;
        case 'current-month': startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1); endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0); break;
        case 'last-3-months': startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 2, 1); endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0); break;
        case 'last-6-months': startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 5, 1); endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0); break;
        case 'current-year': startDate = new Date(endDate.getFullYear(), 0, 1); endDate = new Date(endDate.getFullYear(), 11, 31); break;
        case 'all':
        default:
            startDate = null;
            endDate = null;
            break;
    }

    const periodNames = {
        'today': 'Hoje',
        'current-week': 'Esta semana',
        'all': 'Todos os períodos',
        'current-month': 'Mês atual',
        'last-3-months': 'Últimos 3 meses',
        'last-6-months': 'Últimos 6 meses',
        'current-year': 'Ano atual'
    };
    reportTitle.textContent = `Relatório de Atividade: ${employee.name} (${periodNames[selectedPeriod]})`;

    // --- Gather Data ---
    // 1. Assigned Clients (total, not period-dependent)
    const assignedClients = db.clients.filter(client => client.assignedProfessionalIds && client.assignedProfessionalIds.includes(employee.id));
    
    // 2. Appointments in period
    const attendedAppointments = [];
    db.clients.forEach(client => {
        if (client.appointments) {
            client.appointments.forEach(app => {
                const attendedByUser = db.users.find(u => u.name === app.attendedBy);
                if (attendedByUser && attendedByUser.id === employee.id) {
                    const appointmentDate = new Date(app.date);
                    if (isNaN(appointmentDate.getTime())) return;
                    if ((!startDate || appointmentDate >= startDate) && (!endDate || appointmentDate <= endDate)) {
                        attendedAppointments.push({ ...app, clientName: client.name, clientId: client.id });
                    }
                }
            });
        }
    });
    
    // 3. Summary Stats
    const appointmentsCount = attendedAppointments.length;
    const totalHoursAttended = attendedAppointments.reduce((total, app) => total + (app.durationHours || 0), 0);
    const totalRevenueGenerated = attendedAppointments.reduce((total, app) => total + (app.value || 0), 0);

    // --- Render Report ---
    reportContent.innerHTML = `
        <div class="report-header-print-only" style="display: none; text-align: center; margin-bottom: 20px;">
            <img src="/a/49d033c0-1aa2-45a1-9af1-c94e6e9ce71d" alt="Logo" style="max-height: 60px; margin-bottom: 10px;">
            <h2>${reportTitle.textContent}</h2>
            <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        <div class="report-summary" style="margin-bottom: 2rem;">
            <div class="report-summary-grid">
                <div class="report-summary-item">
                    <h4><i class="fa-solid fa-users"></i> Pacientes Vinculados</h4>
                    <div class="summary-value">${assignedClients.length}</div>
                </div>
                <div class="report-summary-item">
                    <h4><i class="fa-solid fa-calendar-check"></i> Atendimentos no Período</h4>
                    <div class="summary-value">${appointmentsCount}</div>
                </div>
                <div class="report-summary-item">
                    <h4><i class="fa-solid fa-hourglass-half"></i> Horas no Período</h4>
                    <div class="summary-value">${formatDuration(totalHoursAttended)}</div>
                </div>
                <div class="report-summary-item revenue">
                    <h4><i class="fa-solid fa-money-bill-wave"></i> Receita Gerada no Período</h4>
                    <div class="summary-value">R$ ${totalRevenueGenerated.toFixed(2).replace('.', ',')}</div>
                </div>
            </div>
        </div>

        <div class="report-section">
            <h3>Detalhes dos Atendimentos no Período</h3>
            ${appointmentsCount > 0 ? `
                <div class="report-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Paciente</th>
                                <th>Duração</th>
                                <th>Valor (R$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${attendedAppointments.sort((a,b) => new Date(b.date) - new Date(a.date)).map(app => `
                                <tr>
                                    <td>${new Date(app.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                    <td>${app.clientName}</td>
                                    <td>${formatDuration(app.durationHours)}</td>
                                    <td>R$ ${(app.value || 0).toFixed(2).replace('.', ',')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p>Nenhum atendimento realizado no período selecionado.</p>'}
        </div>

        <div class="report-section">
            <h3>Lista de Pacientes Vinculados</h3>
            ${assignedClients.length > 0 ? `
                <ul class="assigned-client-list">
                    ${assignedClients.map(client => `<li>${client.name}</li>`).join('')}
                </ul>
            ` : '<p>Nenhum paciente atualmente vinculado a este profissional.</p>'}
        </div>

        <div class="report-footer" style="display: none;">
            <p>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
    `;
}