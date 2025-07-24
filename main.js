// Main application entry point
import { loadDb, saveDb, db } from './database.js';
import { login, logout, checkLogin, getCurrentUser, isRoleAllowed, DIRECTOR_ONLY, FINANCE_ONLY, DIRECTOR_OR_FINANCE, STOCK_MANAGERS, ALL_USERS, PROFESSIONAL_ROLES, COORDINATOR_AND_HIGHER, NON_FINANCE_ACCESS, ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES, DIRECTOR_AND_PROFESSIONALS, DIRECTOR_AND_COORDINATORS_ONLY_DOCUMENTS, checkTabAccess } from './auth.js'; 
import { showLoginScreen, showMainApp, switchTab, updateCurrentDate, showNotification } from './ui.js'; 
import { renderClientList, showClientDetails, addClientNote, addClientDocument, deleteClientDocument, renderMeusPacientes, renderClientReport, showAssignProfessionalModal, assignProfessionalToClient, unassignProfessionalFromClient, deleteClient } from './clients.js'; 
import { renderSchedule, updateScheduleStatus, initializeCalendar, renderCalendar, saveEditedSchedule, cancelScheduleWithReason, reassignSchedule, populateAssignableUsers, serviceNames, editSchedule, saveReassignedSchedule } from './schedule.js'; 
import { renderFinancialReport, renderDailyNotes, addDailyNote, generateDetailedFinancialReport, downloadDailyNotes, deleteDailyNote } from './financial.js'; 
import { setupFormHandlers } from './forms.js';
import { renderStockList, renderStockMovements, updateStockSummary, showDeleteStockItemConfirmation } from './stock.js';
import { renderFuncionarioList, showFuncionarioDetails, showEditFuncionarioModal, saveFuncionarioChanges, deleteFuncionario, addFuncionario, showEditPasswordModal, populateTabPermissions, saveUserPermissions, initRolesManagement, deleteRole } from './funcionarios.js'; 
import { convertTimeToDecimalHours } from './utils.js'; 

// --- Inactivity Logout Variables ---
let idleTimeout;
const IDLE_TIME = 60 * 60 * 1000; // 1 hour in milliseconds

// --- Inactivity Logout Functions ---
function resetIdleTimer() {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(logoutUser, IDLE_TIME);
}

function logoutUser() {
    logout(); // Perform the actual logout logic
    showLoginScreen(); // Show the login screen
    showNotification('Você foi desconectado(a) devido à inatividade.', 'info', 'Inatividade', 7000);
}

// Make necessary functions globally available for onclicks or direct access
window.showClientDetails = showClientDetails;
window.updateScheduleStatus = updateScheduleStatus;
window.deleteClientDocument = deleteClientDocument;
window.cancelScheduleWithReason = cancelScheduleWithReason;
window.editSchedule = editSchedule;
window.reassignSchedule = reassignSchedule; 
window.saveReassignedSchedule = saveReassignedSchedule; 
window.getCurrentUser = getCurrentUser;
window.showDeleteStockItemConfirmation = showDeleteStockItemConfirmation;
window.showFuncionarioDetails = showFuncionarioDetails; 
window.showEditFuncionarioModal = showEditFuncionarioModal; 
window.showEditPasswordModal = showEditPasswordModal; 
window.deleteFuncionario = deleteFuncionario; 
window.deleteMuralItem = (id) => { 
    const itemToDelete = db.generalDocuments.find(d => d.id === id);
    if (!itemToDelete) return;

    window.currentDeleteItem = id;
    window.currentDeleteItemType = 'generalDocument'; 

    const modal = document.getElementById('modal-confirm-delete');
    const message = document.getElementById('delete-confirmation-message');
    
    let confirmationText = '';
    if (itemToDelete.documentType === 'note') {
        confirmationText = `Tem certeza que deseja excluir a nota "${itemToDelete.title}"?`;
    } else if (itemToDelete.documentType === 'reuniao') {
        confirmationText = `Tem certeza que deseja excluir a reunião "${itemToDelete.title}"? Uma notificação será enviada aos participantes sobre o cancelamento.`;
    } else {
        confirmationText = `Tem certeza que deseja excluir o documento "${itemToDelete.title}"?`;
    }

    message.textContent = `${confirmationText} Esta ação é irreversível.`;
    
    modal.style.display = 'flex';
};
window.showAssignProfessionalModal = showAssignProfessionalModal; 
window.assignProfessionalToClient = assignProfessionalToClient; 
window.unassignProfessionalFromClient = unassignProfessionalFromClient; 
window.deleteClient = deleteClient; 
window.saveUserPermissions = saveUserPermissions;
window.deleteDailyNote = deleteDailyNote;
window.deleteRole = deleteRole;
window.duplicateClient = duplicateClient; // Make duplicate function globally accessible if needed, though listener is better

// NEW: Global file preview function
window.previewFile = (title, fileData, fileName) => {
    const preview = document.getElementById('preview-imagem-cancelamento');
    if (preview) {
        preview.src = fileData;
        preview.alt = fileName;
        preview.style.display = 'block';
    }
};

// Initialize mobile-specific functions
function setupMobileGestures() {
  const nav = document.querySelector('.nav-wrapper');
  if (!nav) return; 

  let touchStartX = 0;
  
  nav.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, false);

  nav.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].screenX;
    const diffX = touchStartX - touchEndX;
    
    if(Math.abs(diffX) > 50) { 
      const currentActive = nav.querySelector('.tab-button.active');
      if (!currentActive) return;

      const tabButtons = Array.from(nav.querySelectorAll('.tab-button'));
      const visibleTabButtons = tabButtons.filter(button => button.style.display !== 'none');
      const currentIndex = visibleTabButtons.indexOf(currentActive);

      if (diffX > 0) { 
        if (currentIndex < visibleTabButtons.length - 1) {
          visibleTabButtons[currentIndex + 1].click();
        }
      } else { 
        if (currentIndex > 0) {
          visibleTabButtons[currentIndex - 1].click();
        }
      }
    }
  }, false);
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadDb();
    
    if (checkLogin()) {
        showMainApp();
        initializeApp();
        checkNotifications(); 
    } else {
        showLoginScreen();
    }
    
    setupEventListeners();
    setupFormHandlers();
    setupMobileGestures(); 
    setupGlobalSearch(); // NEW: Setup global search
});

function initializeApp() {
    updateCurrentDate();
    initializeCalendar();
    
    const currentUser = getCurrentUser();
    
    // Determine initial tab based on user permissions
    let initialTab = 'cadastro'; // Default fallback

    const availableTabs = [
        'cadastro', 'agenda', 'historico', 'meus-pacientes', 'financeiro',
        'relatorios', 'estoque', 'funcionarios', 'documentos'
    ];

    // Find the first tab the user has view access to
    const firstAccessibleTab = availableTabs.find(tabId => checkTabAccess(tabId, 'view'));
    if (firstAccessibleTab) {
        initialTab = firstAccessibleTab;
    }
    
    // Render the content of the initial tab
    // This will trigger the respective render functions with their own permission checks
    switchTab(initialTab);

    // Call relevant render functions for initial load if they are not triggered by switchTab for the initial tab
    // This ensures all dashboards/lists that are part of the initial view are updated.
    if (checkTabAccess('historico', 'view')) { renderClientList(); }
    if (checkTabAccess('meus-pacientes', 'view')) { renderMeusPacientes(); }
    if (checkTabAccess('financeiro', 'view')) {
        const financialPeriodSelector = document.getElementById('financial-period-selector');
        if (financialPeriodSelector) {
            financialPeriodSelector.value = 'current-month';
            renderFinancialReport('current-month');
            renderDailyNotes('current-month');
        } else {
            renderFinancialReport();
            renderDailyNotes();
        }
    }
    if (checkTabAccess('estoque', 'view')) {
        renderStockList();
        renderStockMovements();
        updateStockSummary();
    }
    if (checkTabAccess('relatorios', 'view')) { renderClientReport(); }
    if (checkTabAccess('funcionarios', 'view')) { renderFuncionarioList(); }
    if (checkTabAccess('documentos', 'view')) {
        renderGeneralDocuments();
        const documentsControls = document.querySelector('.documents-controls');
        if (documentsControls) {
            if (checkTabAccess('documentos', 'edit')) { // Check for edit access to show controls
                documentsControls.style.display = 'flex';
            } else {
                documentsControls.style.display = 'none';
            }
        }
    }
}

// NEW: Setup for the global client search
function setupGlobalSearch() {
    const searchInput = document.getElementById('global-search-input');
    const searchDatalist = document.getElementById('global-search-datalist');
    const gotoButton = document.getElementById('btn-global-search');

    if (!searchInput || !searchDatalist || !gotoButton) return;

    const populateDatalist = () => {
        searchDatalist.innerHTML = '';
        
        // Add Patients
        db.clients.forEach(client => {
            const option = document.createElement('option');
            option.value = `Paciente: ${client.name} (ID: ${client.id})`;
            searchDatalist.appendChild(option);
        });

        // Add Employees
        db.users.forEach(user => {
            const option = document.createElement('option');
            option.value = `Funcionário: ${user.name} (ID: ${user.id})`;
            searchDatalist.appendChild(option);
        });

        // Add Stock Items
        db.stockItems.forEach(item => {
            const option = document.createElement('option');
            option.value = `Estoque: ${item.name} (ID: ${item.id})`;
            searchDatalist.appendChild(option);
        });
    };

    // Populate once on load
    populateDatalist();

    const executeGlobalSearch = () => {
        const query = searchInput.value.trim();
        if (!query) return;

        const match = query.match(/^(Paciente|Funcionário|Estoque): .+\(ID: (\d+)\)$/);

        if (match && match[1] && match[2]) {
            const type = match[1];
            const id = parseInt(match[2], 10);

            if (type === 'Paciente') {
                showClientDetails(id);
            } else if (type === 'Funcionário') {
                showFuncionarioDetails(id);
            } else if (type === 'Estoque') {
                switchTab('estoque');
                // Use a timeout to ensure the DOM is updated before scrolling
                setTimeout(() => {
                    const itemCard = document.getElementById(`stock-item-card-${id}`);
                    if (itemCard) {
                        itemCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        itemCard.classList.add('highlight');
                        setTimeout(() => itemCard.classList.remove('highlight'), 2500);
                    } else {
                        showNotification(`Item de estoque com ID ${id} não encontrado na lista.`, 'warning');
                    }
                }, 100);
            }
            searchInput.value = ''; // Clear input after search
        } else {
            showNotification(`Por favor, selecione um item válido da lista de busca.`, 'warning');
        }
    };

    gotoButton.addEventListener('click', executeGlobalSearch);
    
    // Also allow 'Enter' key to trigger the search
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission if it's in a form
            executeGlobalSearch();
        }
    });
}

function setupEventListeners() {
    // --- Inactivity Logout Event Listeners ---
    document.addEventListener('mousemove', resetIdleTimer);
    document.addEventListener('keydown', resetIdleTimer);
    document.addEventListener('click', resetIdleTimer);
    document.addEventListener('scroll', resetIdleTimer);
    // --- End Inactivity Logout Event Listeners ---

    document.getElementById('form-login').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (login(username, password)) {
            document.getElementById('form-login').reset();
            showMainApp();
            initializeApp();
            checkNotifications(); 
            resetIdleTimer(); // Start idle timer on successful login
        } else {
            showNotification('Usuário ou senha inválidos!', 'error');
        }
    });

    // NEW: Notification Bell click handler
    document.getElementById('notification-bell').addEventListener('click', () => {
        const dropdown = document.getElementById('notification-dropdown');
        dropdown.classList.toggle('active');

        if (dropdown.classList.contains('active')) {
            dropdown.style.display = 'block';
            markNotificationsAsRead(); 
        } else {
            // Use timeout to allow fade-out animation
            setTimeout(() => {
                if (!dropdown.classList.contains('active')) {
                    dropdown.style.display = 'none';
                }
            }, 200);
        }
    });

    // Close dropdown if clicked outside
    document.addEventListener('click', (event) => {
        const bellWrapper = document.querySelector('.notification-bell-wrapper');
        const dropdown = document.getElementById('notification-dropdown');
        // Check if the dropdown is active and the click was outside the bell wrapper
        if (dropdown.classList.contains('active') && !bellWrapper.contains(event.target)) {
            dropdown.classList.remove('active');
            setTimeout(() => {
                dropdown.style.display = 'none';
            }, 200);
        }
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        clearTimeout(idleTimeout); // Clear the idle timer on manual logout
        logout();
        showLoginScreen();
    });

    // Tab navigation
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            if (!checkTabAccess(tabId, 'view')) { // Check if user has view permission for the clicked tab
                showNotification(`Você não tem permissão para acessar a aba "${button.querySelector('span').textContent}".`, 'error');
                return; // Prevent switching if no permission
            }

            switchTab(tabId);
            
            // Refresh data when switching tabs - Ensure all rendering aligns with tab visibility
            if (tabId === 'historico') {
                const searchTerm = document.getElementById('search-cliente').value;
                const activityFilter = document.getElementById('client-activity-filter-select').value;
                const internFilter = document.getElementById('client-intern-filter-select').value;
                const unitFilter = document.getElementById('client-unit-filter-select').value;
                renderClientList(searchTerm, activityFilter, internFilter, unitFilter);
            } else if (tabId === 'agenda') {
                renderSchedule();
                renderCalendar();
            } else if (tabId === 'relatorios') {
                renderClientReport(document.getElementById('client-report-period').value);
            } else if (tabId === 'financeiro') {
                const selectedPeriod = document.getElementById('financial-period-selector').value;
                renderFinancialReport(selectedPeriod);
                renderDailyNotes(selectedPeriod);
            } else if (tabId === 'estoque') {
                renderStockList();
                renderStockMovements();
                updateStockSummary();
            } else if (tabId === 'meus-pacientes') {
                renderMeusPacientes();
            } else if (tabId === 'funcionarios') {
                renderFuncionarioList();
            } else if (tabId === 'documentos') {
                renderGeneralDocuments();
                const documentsControls = document.querySelector('.documents-controls');
                if (documentsControls) {
                    if (checkTabAccess('documentos', 'edit')) { // Show controls only if user has edit access for documents
                        documentsControls.style.display = 'flex';
                    } else {
                        documentsControls.style.display = 'none';
                    }
                }
            } else if (tabId === 'cadastro') {
                // No specific re-render needed, form state is maintained.
            }
        });
    });

    // Search functionality
    document.getElementById('search-cliente').addEventListener('input', (e) => {
        if (!checkTabAccess('historico', 'view')) return; // Check if user has view permission for the tab
        const activityFilter = document.getElementById('client-activity-filter-select').value;
        const internFilter = document.getElementById('client-intern-filter-select').value;
        const unitFilter = document.getElementById('client-unit-filter-select').value;
        renderClientList(e.target.value, activityFilter, internFilter, unitFilter);
    });

    const searchMeusPacientes = document.getElementById('search-meus-pacientes');
    if (searchMeusPacientes) {
        searchMeusPacientes.addEventListener('input', (e) => {
            if (!checkTabAccess('meus-pacientes', 'view')) return; // Check if user has view permission for the tab
            renderMeusPacientes(e.target.value);
        });
    }

    const searchFuncionario = document.getElementById('search-funcionario');
    if (searchFuncionario) {
        searchFuncionario.addEventListener('input', (e) => {
            if (!checkTabAccess('funcionarios', 'view')) return; // Check if user has view permission for the tab
            const roleFilter = document.getElementById('funcionario-role-filter').value;
            renderFuncionarioList(e.target.value, roleFilter);
        });
    }

    const searchClientReport = document.getElementById('search-client-report');
    if (searchClientReport) {
        searchClientReport.addEventListener('input', (e) => {
            if (!checkTabAccess('relatorios', 'view')) return;
            const currentPeriod = document.getElementById('client-report-period').value;
            renderClientReport(currentPeriod);
        });
    }

    const clientActivityFilterSelect = document.getElementById('client-activity-filter-select');
    if (clientActivityFilterSelect) {
        clientActivityFilterSelect.addEventListener('change', () => {
            if (!checkTabAccess('historico', 'view')) return; // Check if user has view permission for the tab
            const searchTerm = document.getElementById('search-cliente').value;
            const internFilter = document.getElementById('client-intern-filter-select').value;
            const unitFilter = document.getElementById('client-unit-filter-select').value;
            renderClientList(searchTerm, clientActivityFilterSelect.value, internFilter, unitFilter);
        });
    }

    const clientInternFilterSelect = document.getElementById('client-intern-filter-select');
    if (clientInternFilterSelect) {
        clientInternFilterSelect.addEventListener('change', () => {
            if (!checkTabAccess('historico', 'view')) return; // Check if user has view permission for the tab
            const searchTerm = document.getElementById('search-cliente').value;
            const activityFilter = document.getElementById('client-activity-filter-select').value;
            const unitFilter = document.getElementById('client-unit-filter-select').value;
            renderClientList(searchTerm, activityFilter, clientInternFilterSelect.value, unitFilter);
        });
    }

    const clientUnitFilterSelect = document.getElementById('client-unit-filter-select');
    if (clientUnitFilterSelect) {
        clientUnitFilterSelect.addEventListener('change', () => {
            if (!checkTabAccess('historico', 'view')) return; // Check if user has view permission for the tab
            const searchTerm = document.getElementById('search-cliente').value;
            const activityFilter = document.getElementById('client-activity-filter-select').value;
            const internFilter = document.getElementById('client-intern-filter-select').value;
            renderClientList(searchTerm, activityFilter, internFilter, clientUnitFilterSelect.value);
        });
    }

    document.getElementById('date-selector').addEventListener('change', (e) => {
        if (!checkTabAccess('agenda', 'view')) return; // Check if user has view permission for the tab
        renderSchedule(e.target.value);
        renderCalendar();
    });

    const financialPeriodSelector = document.getElementById('financial-period-selector');
    if (financialPeriodSelector) {
        financialPeriodSelector.addEventListener('change', (e) => {
            if (!checkTabAccess('financeiro', 'view')) return; // Check if user has view permission for the tab
            renderFinancialReport(e.target.value);
            renderDailyNotes(e.target.value);
        });
    }

    const btnUpdateFinancial = document.getElementById('btn-update-financial');
    if (btnUpdateFinancial) {
        btnUpdateFinancial.addEventListener('click', () => {
            if (!checkTabAccess('financeiro', 'view')) return; // Check if user has view permission for the tab
            const selectedPeriod = document.getElementById('financial-period-selector').value;
            renderFinancialReport(selectedPeriod);
            renderDailyNotes(selectedPeriod);
            showNotification('Relatório financeiro atualizado!', 'success');
        });
    }

    const stockMonthSelector = document.getElementById('stock-month-selector');
    if (stockMonthSelector) {
        const today = new Date();
        const currentMonthFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        stockMonthSelector.value = currentMonthFormatted;
    }

    const btnUpdateStockMovements = document.getElementById('btn-update-stock-movements');
    if (btnUpdateStockMovements) {
        btnUpdateStockMovements.addEventListener('click', () => {
            if (!checkTabAccess('estoque', 'view')) return; // Check if user has view permission for the tab
            const selectedMonth = document.getElementById('stock-month-selector').value;
            renderStockMovements(selectedMonth);
            showNotification('Movimentações de estoque filtradas por período!', 'success');
        });
    }

    const btnClearStockFilter = document.getElementById('btn-clear-stock-filter');
    if (btnClearStockFilter) {
        btnClearStockFilter.addEventListener('click', () => {
            if (!checkTabAccess('estoque', 'view')) return; // Check if user has view permission for the tab
            document.getElementById('stock-month-selector').value = '';
            renderStockMovements();
            showNotification('Filtro removido - mostrando todas as movimentações!', 'info');
        });
    }

    document.getElementById('btn-novo-agendamento').addEventListener('click', () => {
        if (!checkTabAccess('agenda', 'edit')) { showNotification('Você não tem permissão para adicionar agendamentos.', 'error'); return; }
        populateClientSelect();
        populateServiceTypes();
        populateAssignableUsers();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('data-agendamento').value = today;
        document.getElementById('modal-novo-agendamento').style.display = 'flex';
        document.getElementById('select-cliente-agenda').value = '';
    });

    document.getElementById('btn-schedule-new-appointment').addEventListener('click', () => {
        if (!checkTabAccess('agenda', 'edit') && !checkTabAccess('historico', 'edit') && !checkTabAccess('meus-pacientes', 'edit')) { // Check edit access for relevant tabs
            showNotification('Você não tem permissão para agendar novos atendimentos.', 'error');
            return;
        }
        const currentClientId = window.currentClientId;
        document.getElementById('modal-detalhes-cliente').style.display = 'none';

        populateClientSelect();
        populateServiceTypes();
        populateAssignableUsers();
        
        document.getElementById('select-cliente-agenda').value = currentClientId;
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('data-agendamento').value = today;
        document.getElementById('modal-novo-agendamento').style.display = 'flex';
    });

    document.getElementById('form-novo-agendamento').addEventListener('submit', (e) => {
        e.preventDefault();
        saveNewSchedule();
    });

    // New attendance button
    document.getElementById('btn-novo-atendimento').addEventListener('click', () => {
        if (!checkTabAccess('historico', 'edit') && !checkTabAccess('meus-pacientes', 'edit')) { // Check edit access for client related tabs
            showNotification('Você não tem permissão para adicionar atendimentos.', 'error');
            return;
        }
        // Close client details modal first for a cleaner transition
        document.getElementById('modal-detalhes-cliente').style.display = 'none';
        
        populateAnamnesisSelect();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('data-atendimento').value = today;
        document.getElementById('modal-novo-atendimento').style.display = 'flex';
    });

    document.getElementById('form-novo-atendimento').addEventListener('submit', (e) => {
        e.preventDefault();
        saveNewAttendance();
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal-overlay').style.display = 'none';
        });
    });

    document.getElementById('btn-add-note').addEventListener('click', () => {
        if (!checkTabAccess('historico', 'edit') && !checkTabAccess('meus-pacientes', 'edit')) { 
            showNotification('Você não tem permissão para adicionar notas de cliente.', 'error');
            return;
        }
        document.getElementById('form-add-note').reset();
        document.getElementById('modal-detalhes-cliente').style.display = 'none';
        document.getElementById('modal-add-note').style.display = 'flex';
    });

    document.getElementById('form-add-note').addEventListener('submit', (e) => {
        e.preventDefault();
        addClientNote();
    });

    document.getElementById('btn-add-document').addEventListener('click', () => {
        if (!checkTabAccess('historico', 'edit') && !checkTabAccess('meus-pacientes', 'edit')) {
            showNotification('Você não tem permissão para anexar documentos a clientes.', 'error');
            return;
        }
        document.getElementById('form-add-document').reset();
        document.getElementById('modal-detalhes-cliente').style.display = 'none';
        document.getElementById('modal-add-document').style.display = 'flex';
    });

    document.getElementById('form-add-document').addEventListener('submit', (e) => {
        e.preventDefault();
        addClientDocument();
    });

    document.getElementById('form-editar-agendamento').addEventListener('submit', (e) => {
        e.preventDefault();
        saveEditedSchedule();
    });

    document.getElementById('form-cancelar-agendamento').addEventListener('submit', (e) => {
        e.preventDefault();
        saveCancellation();
    });

    document.getElementById('imagem-cancelamento').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('img-preview-cancelamento').src = e.target.result;
                document.getElementById('preview-imagem-cancelamento').style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            document.getElementById('preview-imagem-cancelamento').style.display = 'none';
        }
    });

    document.getElementById('form-confirmar-atendimento').addEventListener('submit', (e) => {
        e.preventDefault();
        saveAttendanceConfirmation();
    });

    document.getElementById('btn-add-stock-item').addEventListener('click', () => {
        if (!checkTabAccess('estoque', 'edit')) { showNotification('Você não tem permissão para adicionar itens ao estoque.', 'error'); return; }
        document.getElementById('form-add-stock').reset();
        document.getElementById('modal-add-stock').style.display = 'flex';
    });

    document.getElementById('form-add-stock').addEventListener('submit', (e) => {
        e.preventDefault();
        addStockItem();
    });

    document.getElementById('form-adjust-stock').addEventListener('submit', (e) => {
        e.preventDefault();
        processStockAdjustment();
    });

    document.getElementById('btn-add-material').addEventListener('click', () => {
        if (!checkTabAccess('historico', 'edit') && !checkTabAccess('meus-pacientes', 'edit')) { return; } // Check edit access for client related tabs
        addMaterialSelection();
    });

    document.getElementById('btn-add-material-confirm').addEventListener('click', () => {
        if (!checkTabAccess('agenda', 'edit')) { return; } // Check edit access for agenda tab
        addMaterialSelection('confirm');
    });

    document.getElementById('btn-confirm-delete').addEventListener('click', () => {
        // Consolidated permission check for deletion actions
        if (window.currentDeleteItemType === 'stock') {
            const itemIdToDelete = window.currentDeleteItem;
            if (checkTabAccess('estoque', 'edit') && itemIdToDelete) { // Use checkTabAccess
                const itemIndex = db.stockItems.findIndex(item => item.id === itemIdToDelete);
                if (itemIndex !== -1) {
                    const itemToDelete = db.stockItems[itemIndex];
                     // Add a movement record for deletion
                    db.stockMovements.push({
                        id: db.nextMovementId++,
                        itemId: itemToDelete.id, 
                        itemName: itemToDelete.name,
                        type: 'exclusao',
                        quantity: itemToDelete.quantity, 
                        reason: 'Item excluído do estoque',
                        date: new Date().toISOString(),
                        user: getCurrentUser().name,
                        itemUnitValue: itemToDelete.unitValue,
                        purchaseNotes: null, 
                        purchaseFileData: null,
                        purchaseFileName: null
                    });
                    db.stockItems.splice(itemIndex, 1);
                    saveDb();
                    renderStockList();
                    renderStockMovements();
                    updateStockSummary();
                    showNotification(`Item "${itemToDelete.name}" excluído do estoque com sucesso!`, 'success');
                }
            } else {
                showNotification('Você não tem permissão para realizar esta exclusão.', 'error');
            }
        } else if (window.currentDeleteItemType === 'funcionario') {
            const funcIdToDelete = window.currentDeleteItem;
            if (checkTabAccess('funcionarios', 'edit') && funcIdToDelete) { // Use checkTabAccess
                deleteFuncionario(funcIdToDelete);
            } else {
                showNotification('Você não tem permissão para realizar esta exclusão.', 'error');
            }
        } else if (window.currentDeleteItemType === 'client') {
            const clientIdToDelete = window.currentDeleteItem;
            if (checkTabAccess('historico', 'edit') && clientIdToDelete) { // Use checkTabAccess
                deleteClient(clientIdToDelete);
            } else {
                showNotification('Você não tem permissão para realizar esta exclusão.', 'error');
            }
        } else if (window.currentDeleteItemType === 'generalDocument') {
            const docIdToDelete = window.currentDeleteItem;
            if (checkTabAccess('documentos', 'edit') && docIdToDelete) { // Use checkTabAccess
                deleteMuralItemConfirm(docIdToDelete);
            } else {
                showNotification('Você não tem permissão para excluir este item.', 'error');
            }
        } else {
            showNotification('Você não tem permissão para realizar esta exclusão.', 'error');
        }
        document.getElementById('modal-confirm-delete').style.display = 'none';
        window.currentDeleteItem = null;
        window.currentDeleteItemType = null;
    });

    document.getElementById('btn-cancel-delete').addEventListener('click', () => {
        document.getElementById('modal-confirm-delete').style.display = 'none';
        window.currentDeleteItem = null;
        window.currentDeleteItemType = null;
    });

    document.getElementById('form-reassign-schedule').addEventListener('submit', (e) => {
        e.preventDefault();
        saveReassignedSchedule();
    });

    // NEW: Edit Funcionario Button
    document.getElementById('btn-edit-funcionario').addEventListener('click', () => {
        // Permission check is inside showEditFuncionarioModal
        showEditFuncionarioModal(window.currentFuncionarioId);
    });

    // NEW: Edit Funcionario Form Submit
    document.getElementById('form-editar-funcionario').addEventListener('submit', (e) => {
        e.preventDefault();
        saveFuncionarioChanges();
    });

    // NEW: Edit Password Button
    document.getElementById('btn-edit-funcionario-password').addEventListener('click', () => {
        // Permission check is inside showEditPasswordModal
        showEditPasswordModal(window.currentFuncionarioId);
    });

    document.getElementById('form-edit-password').addEventListener('submit', (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value;
        const confirmNewPassword = document.getElementById('confirm-new-password').value;

        if (newPassword !== confirmNewPassword) {
            showNotification('As senhas não coincidem.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showNotification('A nova senha deve ter pelo menos 6 caracteres.', 'error');
            return;
        }

        const funcionarioId = window.currentFuncionarioId;
        if (updateUserPassword(funcionarioId, newPassword)) { // Permission check is inside updateUserPassword
            showNotification('Senha atualizada com sucesso!', 'success');
            document.getElementById('modal-edit-password').style.display = 'none';
        } else {
            showNotification('Erro ao atualizar a senha. Usuário não encontrado ou sem permissão.', 'error');
        }
    });

    // NEW: Delete Funcionario Button Handler
    const btnDeleteFuncionario = document.getElementById('btn-delete-funcionario');
    if (btnDeleteFuncionario) {
        btnDeleteFuncionario.addEventListener('click', () => {
            // Permission check is inside deleteFuncionario, but also show a notification here
            if (!checkTabAccess('funcionarios', 'edit')) { showNotification('Você não tem permissão para excluir funcionários.', 'error'); return; }
            const funcToDelete = db.users.find(u => u.id === parseInt(window.currentFuncionarioId));
            if (!funcToDelete) {
                showNotification('Funcionário não encontrado.', 'error');
                return;
            }
            window.currentDeleteItem = funcToDelete.id;
            window.currentDeleteItemType = 'funcionario';

            const modal = document.getElementById('modal-confirm-delete');
            const message = document.getElementById('delete-confirmation-message');
            message.textContent = `Tem certeza que deseja excluir o funcionário "${funcToDelete.name}"? Todos os agendamentos e pacientes vinculados a ele serão desvinculados. Esta ação é irreversível.`;
            modal.style.display = 'flex';
        });
    }

    // NEW: Add Funcionario Button Handler
    document.getElementById('btn-add-funcionario').addEventListener('click', () => {
        if (!checkTabAccess('funcionarios', 'edit')) { showNotification('Você não tem permissão para adicionar funcionários.', 'error'); return; }
        document.getElementById('form-add-funcionario').reset();
        // The container 'new-funcionario-tab-permissions' is for the NEW user being added.
        // It should always be editable, so disableSelfEdit is false here.
        populateTabPermissions('new-funcionario-tab-permissions', {}, false); 

        // Add event listener to show/hide academic fields based on role
        const roleSelect = document.getElementById('new-funcionario-role');
        const academicFields = document.getElementById('new-funcionario-academic-fields');

        const handleRoleChange = () => {
            if (PROFESSIONAL_ROLES.includes(roleSelect.value)) {
                academicFields.style.display = 'block';
            } else {
                academicFields.style.display = 'none';
            }
        };

        // Remove previous listener to avoid duplicates if modal is opened multiple times
        roleSelect.removeEventListener('change', handleRoleChange);
        roleSelect.addEventListener('change', handleRoleChange);
        handleRoleChange(); // Call once to set initial visibility

        document.getElementById('modal-add-funcionario').style.display = 'flex';
    });

    document.getElementById('form-add-funcionario').addEventListener('submit', (e) => {
        e.preventDefault();
        addNewFuncionario();
    });

    const clientReportPeriodSelector = document.getElementById('client-report-period');
    if (clientReportPeriodSelector) {
        clientReportPeriodSelector.addEventListener('change', (e) => {
            if (!checkTabAccess('relatorios', 'view')) return; // Check if user has view permission for the tab
            renderClientReport(e.target.value);
        });
    }

    const btnUpdateClientReport = document.getElementById('btn-update-client-report');
    if (btnUpdateClientReport) {
        btnUpdateClientReport.addEventListener('click', () => {
            if (!checkTabAccess('relatorios', 'view')) return; // Check if user has view permission for the tab
            const selectedPeriod = document.getElementById('client-report-period').value;
            renderClientReport(selectedPeriod);
            showNotification('Relatório de clientes atualizado!', 'success');
        });
    }

    document.getElementById('btn-add-daily-note').addEventListener('click', () => {
        if (!checkTabAccess('financeiro', 'edit')) { showNotification('Você não tem permissão para adicionar notas diárias financeiras.', 'error'); return; }
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('daily-note-date').value = today;
        document.getElementById('form-add-daily-note').reset();
        document.getElementById('daily-note-date').value = today;
        document.getElementById('modal-add-daily-note').style.display = 'flex';
    });

    document.getElementById('form-add-daily-note').addEventListener('submit', (e) => {
        e.preventDefault();
        addDailyNote();
    });

    document.getElementById('btn-generate-monthly-report').addEventListener('click', () => {
        if (!checkTabAccess('financeiro', 'view')) { showNotification('Você não tem permissão para gerar relatórios financeiros.', 'error'); return; }
        const selectedPeriod = document.getElementById('financial-period-selector').value ||
                             'current-month';
        document.getElementById('report-period-selector-modal').value = selectedPeriod;
        generateDetailedFinancialReport(selectedPeriod);
        document.getElementById('modal-monthly-report').style.display = 'flex';
    });

    document.getElementById('btn-update-monthly-report').addEventListener('click', () => {
        if (!checkTabAccess('financeiro', 'view')) { showNotification('Você não tem permissão para atualizar relatórios financeiros.', 'error'); return; }
        const selectedPeriod = document.getElementById('report-period-selector-modal').value;
        generateDetailedFinancialReport(selectedPeriod);
        showNotification('Relatório mensal atualizado!', 'success');
    });

    document.getElementById('btn-print-report').addEventListener('click', () => {
        const reportContent = document.getElementById('monthly-report-content');
        if (reportContent) {
            document.getElementById('printable-content').innerHTML = reportContent.innerHTML;
            window.print();
            document.getElementById('printable-content').innerHTML = '';
        }
    });

    document.getElementById('btn-print-employee-report').addEventListener('click', () => {
        const reportContent = document.getElementById('employee-report-content');
        if (reportContent) {
            document.getElementById('printable-content').innerHTML = reportContent.innerHTML;
            window.print();
            document.getElementById('printable-content').innerHTML = '';
        }
    });

    document.getElementById('btn-download-all-notes').addEventListener('click', () => {
        if (!checkTabAccess('financeiro', 'view')) {
            showNotification('Você não tem permissão para baixar notas diárias.', 'error');
            return;
        }
        const selectedPeriod = document.getElementById('financial-period-selector').value;
        downloadDailyNotes(selectedPeriod);
    });

    document.getElementById('btn-add-general-document').addEventListener('click', () => {
        if (!checkTabAccess('documentos', 'edit')) { showNotification('Você não tem permissão para adicionar documentos gerais.', 'error'); return; }
        document.getElementById('form-add-general-document').reset();
        document.getElementById('modal-add-general-document').style.display = 'flex';
    });

    document.getElementById('form-add-general-document').addEventListener('submit', (e) => {
        e.preventDefault();
        addGeneralDocument();
    });

    document.getElementById('btn-add-general-note').addEventListener('click', () => {
        if (!checkTabAccess('documentos', 'edit')) { showNotification('Você não tem permissão para adicionar notas gerais.', 'error'); return; }
        document.getElementById('form-add-general-note').reset();
        document.getElementById('modal-add-general-note').style.display = 'flex';
    });

    document.getElementById('form-add-general-note').addEventListener('submit', (e) => {
        e.preventDefault();
        addGeneralNote();
    });

    // NEW: Meeting Alert functionality
    document.getElementById('btn-add-meeting-alert').addEventListener('click', () => {
        if (!checkTabAccess('documentos', 'edit')) { showNotification('Você não tem permissão para agendar reuniões.', 'error'); return; }
        populateMeetingAttendees();
        document.getElementById('form-add-meeting-alert').reset();
        // Set default date/time for meeting
        const now = new Date();
        const futureTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
        document.getElementById('meeting-alert-date').value = now.toISOString().split('T')[0];
        document.getElementById('meeting-alert-time').value = futureTime.toTimeString().slice(0, 5);

        document.getElementById('modal-add-meeting-alert').style.display = 'flex';
    });

    document.getElementById('form-add-meeting-alert').addEventListener('submit', (e) => {
        e.preventDefault();
        addMeetingAlert();
    });

    // Search and filter for general documents (now handled by renderGeneralDocuments which includes permission checks)
    document.getElementById('search-documents').addEventListener('input', (e) => {
        renderGeneralDocuments(e.target.value, document.getElementById('documents-type-filter').value);
    });

    document.getElementById('documents-type-filter').addEventListener('change', (e) => {
        renderGeneralDocuments(document.getElementById('search-documents').value, e.target.value);
    });

    document.getElementById('btn-assign-professional-to-client').addEventListener('click', () => {
        if (!checkTabAccess('historico', 'edit') && !checkTabAccess('meus-pacientes', 'edit')) { // Check edit access for client related tabs
            showNotification('Você não tem permissão para vincular profissionais.', 'error');
            return;
        }
        showAssignProfessionalModal(window.currentClientId);
    });

    document.getElementById('form-assign-professional').addEventListener('submit', (e) => {
        e.preventDefault();
        assignProfessionalToClient();
    });

    document.getElementById('btn-unassign-professional').addEventListener('click', () => {
        if (!checkTabAccess('historico', 'edit') && !checkTabAccess('meus-pacientes', 'edit')) { // Check edit access for client related tabs
            showNotification('Você não tem permissão para desvincular profissionais.', 'error');
            return;
        }
        unassignProfessionalFromClient();
    });
    // NEW: Stock History Shortcut button
    document.getElementById('btn-goto-stock-history').addEventListener('click', () => {
        const historyFilters = document.getElementById('stock-history-filters');
        if (historyFilters) {
            historyFilters.scrollIntoView({ behavior: 'smooth' });
            historyFilters.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.4)';
            historyFilters.style.transition = 'box-shadow 0.3s ease-in-out';
            setTimeout(() => {
                historyFilters.style.boxShadow = 'none';
            }, 1500);
        }
    });
}

function populateClientSelect() {
    const select = document.getElementById('select-cliente-agenda');
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    
    const currentUser = getCurrentUser();
    let clientsForDropdown = [];

    // If the current user has 'view' access to 'historico' (all clients) or 'meus-pacientes' (their own clients)
    if (checkTabAccess('historico', 'view')) { // If can see all clients, show all
        clientsForDropdown = db.clients;
    } else if (checkTabAccess('meus-pacientes', 'view')) { // Otherwise if can only see own clients, filter
        clientsForDropdown = db.clients.filter(client =>
            client.createdByUserId === currentUser.id || // Clients created by current user
            client.assignedProfessionalId === currentUser.id // Clients assigned to current user
        );
    } else {
        // If no relevant view access, no clients
        clientsForDropdown = [];
    }

    clientsForDropdown.sort((a, b) => a.name.localeCompare(b.name));

    clientsForDropdown.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = `${client.name} (ID: ${client.id})`;
        select.appendChild(option);
    });
}

function populateServiceTypes() {
    const select = document.getElementById('tipo-servico');
    select.innerHTML = '';
    
    Object.entries(serviceNames).forEach(([value, text]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        select.appendChild(option);
    });
}

function populateAnamnesisSelect() {
    const select = document.getElementById('select-anamnese');
    select.innerHTML = '';
    
    db.anamnesisTypes.forEach(anamnesis => {
        const option = document.createElement('option');
        option.value = anamnesis.id;
        option.textContent = anamnesis.name;
        select.appendChild(option);
    });
}

async function saveNewSchedule() {
    const clientId = parseInt(document.getElementById('select-cliente-agenda').value);
    const date = document.getElementById('data-agendamento').value;
    const time = document.getElementById('hora-agendamento').value;
    const serviceType = document.getElementById('tipo-servico').value;
    const selectedProfessionalId = document.getElementById('select-assigned-professional').value;
    const observations = document.getElementById('observacoes-agendamento').value;
    const sendEmail = document.getElementById('send-email-confirmation').checked; 
    const currentUser = getCurrentUser();

    if (!clientId || !date || !time || !serviceType) {
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'warning');
        return;
    }

    let assignedToUserId = null;
    let assignedToUserName = null;

    if (selectedProfessionalId) {
        const selectedUser = db.users.find(u => u.id === parseInt(selectedProfessionalId));
        if (selectedUser) {
            assignedToUserId = selectedUser.id;
            assignedToUserName = selectedUser.name;
        }
    } else if (PROFESSIONAL_ROLES.includes(currentUser.role)) { // If current user is a professional, assign to them by default
        assignedToUserId = currentUser.id;
        assignedToUserName = currentUser.name;
    }

    const newSchedule = {
        id: db.nextScheduleId++,
        clientId: clientId,
        date: date,
        time: time,
        serviceType: serviceType,
        observations: observations,
        status: 'agendado',
        assignedToUserId: assignedToUserId,
        assignedToUserName: assignedToUserName
    };

    db.schedules.push(newSchedule);

    // NEW: Create a notification for the assigned professional
    if (assignedToUserId) {
        const client = db.clients.find(c => c.id === clientId);
        if (client) {
            if (!db.notifications) db.notifications = [];
            db.notifications.push({
                id: db.nextNotificationId++,
                userId: assignedToUserId,
                type: 'schedule_assignment',
                title: 'Novo Agendamento',
                message: `Um novo agendamento para o paciente ${client.name} foi atribuído a você.`,
                relatedId: newSchedule.id,
                createdAt: new Date().toISOString(),
                isRead: false
            });
        }
    }

    // Update client's assigned professional if applicable
    if (assignedToUserId && PROFESSIONAL_ROLES.includes(db.users.find(u => u.id === assignedToUserId)?.role)) {
        const client = db.clients.find(c => c.id === clientId);
        if (client) {
            const oldAssignedProfessionalName = client.assignedProfessionalName;
            const newAssignedProfessionalName = assignedToUserName;

            if (client.assignedProfessionalId !== assignedToUserId) {
                client.assignedProfessionalId = assignedToUserId;
                client.assignedProfessionalName = newAssignedProfessionalName;
                if (!client.changeHistory) client.changeHistory = [];
                client.changeHistory.push({
                    id: db.nextChangeId++,
                    date: new Date().toISOString(),
                    changedBy: getCurrentUser().name,
                    changes: [
                        {
                            field: 'Profissional Vinculado',
                            oldValue: oldAssignedProfessionalName || 'Nenhum',
                            newValue: newAssignedProfessionalName
                        }
                    ]
                });
            }
        }
    }

    saveDb();
    
    document.getElementById('form-novo-agendamento').reset();
    document.getElementById('modal-novo-agendamento').style.display = 'none';
    renderSchedule(document.getElementById('date-selector').value);
    renderCalendar();
    
    showNotification('Agendamento criado com sucesso!', 'success');

    if (sendEmail) {
        const client = db.clients.find(c => c.id === newSchedule.clientId);
        if (client && client.email) {
            await generateAndSendAppointmentEmail(newSchedule, client); 
        } else if (client && !client.email) {
            showNotification('Agendamento criado, mas não foi possível enviar a confirmação por email: Cliente sem email cadastrado.', 'warning');
        }
    }
}

async function generateAndSendAppointmentEmail(schedule, client) {
    const nomeCliente = client.name;
    const dataAgendamento = new Date(schedule.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
    const horaAgendamento = schedule.time;
    const nomeProfissional = schedule.assignedToUserName || 'Não Atribuído';
    const nomeUnidade = 'Clínica Neuropsico'; 
    const emailCliente = client.email; 

    if (!nomeCliente || !dataAgendamento || !horaAgendamento || !nomeProfissional || !emailCliente) {
        showNotification('Erro: Dados incompletos para gerar confirmação por email.', 'error', 'Erro de Envio de Email');
        console.error('Missing data for email confirmation:', { nomeCliente, dataAgendamento, horaAgendamento, nomeProfissional, emailCliente });
        return;
    }

    const prompt = `Gere o corpo de um email de confirmação de agendamento utilizando *exatamente* a seguinte estrutura, preenchendo os valores entre chaves duplas {{}}:

    Olá, {{nomeCliente}}!

    Seu agendamento está confirmado para o dia {{dataAgendamento}}, às {{horaAgendamento}}.
    Profissional responsável: {{nomeProfissional}}
    Unidade de atendimento: {{nomeUnidade}}

    Qualquer dúvida, estamos à disposição.

    Aqui estão os dados para preencher:
    nomeCliente: "${nomeCliente}"
    dataAgendamento: "${dataAgendamento}"
    horaAgendamento: "${horaAgendamento}"
    nomeProfissional: "${nomeProfissional}"
    nomeUnidade: "${nomeUnidade}"

    Não inclua nada além do corpo do email, sem saudações extras ou assinaturas.`;

    try {
        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Você é um assistente de IA que preenche um modelo de email com as informações fornecidas. O output deve ser *exatamente* o modelo fornecido, com os placeholders substituídos pelos valores. Não adicione introduções ou conclusões."
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.1, 
        });

        const emailBody = completion.content;
        
        showNotification(
            `A confirmação de agendamento para ${nomeCliente} foi 'enviada' de webmaster@fundacaodombosco.org para ${emailCliente}.`, 
            'success', 
            'Email de Confirmação Enviado (Simulado)',
            10000 
        );
        showNotification(
            `Assunto: Confirmação de Agendamento\n\n${emailBody}`,
            'info',
            'Corpo do Email',
            15000 
        );

    } catch (error) {
        console.error("Erro ao gerar email de confirmação:", error);
        showNotification('Erro ao gerar a confirmação por email. Tente novamente.', 'error', 'Erro de IA');
    }
}

function saveNewAttendance() {
    const client = db.clients.find(c => c.id === window.currentClientId);
    if (!client) return;

    const date = document.getElementById('data-atendimento').value;
    const anamnesisTypeId = document.getElementById('select-anamnese').value;
    const notes = document.getElementById('notas-atendimento').value;
    const value = parseFloat(document.getElementById('valor-atendimento').value) || 0;
    const durationTime = document.getElementById('duracao-atendimento').value; 
    const durationHours = convertTimeToDecimalHours(durationTime); 
    const attachments = document.getElementById('anexos-atendimento').files;

    if (!date || !anamnesisTypeId) {
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'warning');
        return;
    }

    if (!client.appointments) {
        client.appointments = [];
    }

    const newAppointment = {
        id: db.nextAppointmentId++,
        date: date,
        anamnesisTypeId: anamnesisTypeId,
        notes: notes,
        value: value,
        durationHours: durationHours,
        attendedBy: getCurrentUser().name,
        internId: getCurrentUser().role === 'intern' ? getCurrentUser().id : null
    };

    if (attachments.length > 0) {
        newAppointment.attachments = [];
        let filesProcessed = 0;
        
        Array.from(attachments).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                newAppointment.attachments.push({
                    fileName: file.name,
                    fileData: e.target.result,
                    uploadDate: new Date().toISOString()
                });
                
                filesProcessed++;
                if (filesProcessed === attachments.length) {
                    client.appointments.push(newAppointment);
                    saveDb();
                    
                    document.getElementById('form-novo-atendimento').reset();
                    document.getElementById('modal-novo-atendimento').style.display = 'none';
                    showClientDetails(window.currentClientId);
                    
                    showNotification('Histórico adicionado com sucesso!', 'success');
                }
            };
            reader.readAsDataURL(file);
        });
    } else {
        // No attachments, save directly
        client.appointments.push(newAppointment);
        saveDb();
        
        document.getElementById('form-novo-atendimento').reset();
        document.getElementById('modal-novo-atendimento').style.display = 'none';
        showClientDetails(window.currentClientId);
        
        showNotification('Histórico adicionado com sucesso!', 'success');
    }
}

function saveCancellation() {
    const schedule = db.schedules.find(s => s.id === window.currentCancellingScheduleId);
    if (!schedule) return;

    const reason = document.getElementById('motivo-cancelamento').value.trim();
    const imageFile = document.getElementById('imagem-cancelamento').files[0];

    if (!reason) {
        showNotification('Por favor, digite o motivo do cancelamento.', 'warning');
        return;
    }

    schedule.status = 'cancelado';
    schedule.cancelReason = reason;
    schedule.cancelDate = new Date().toISOString();
    schedule.canceledBy = getCurrentUser().name;

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            schedule.cancelImage = e.target.result;
            schedule.cancelImageName = imageFile.name;
            
            saveDb();
            document.getElementById('form-cancelar-agendamento').reset();
            document.getElementById('preview-imagem-cancelamento').style.display = 'none';
            document.getElementById('modal-cancelar-agendamento').style.display = 'none';
            renderSchedule(document.getElementById('date-selector').value);
            renderCalendar();
            showNotification('Agendamento cancelado com sucesso!', 'success');
        };
        reader.readAsDataURL(imageFile);
    } else {
        saveDb();
        document.getElementById('form-cancelar-agendamento').reset();
        document.getElementById('modal-cancelar-agendamento').style.display = 'none';
        renderSchedule(document.getElementById('date-selector').value);
        renderCalendar();
        showNotification('Agendamento cancelado com sucesso!', 'success');
    }
}

function saveAttendanceConfirmation() {
    const schedule = db.schedules.find(s => s.id === window.currentConfirmingScheduleId);
    if (!schedule) return;

    const client = db.clients.find(c => c.id === schedule.clientId);
    if (!client) return;

    const professional = document.getElementById('profissional-responsavel').value.trim();
    const observations = document.getElementById('observacoes-confirmacao').value.trim();
    const value = parseFloat(document.getElementById('valor-atendimento-confirmacao').value) || 0;
    const durationTime = document.getElementById('duracao-atendimento-confirmacao').value; 
    const durationHours = convertTimeToDecimalHours(durationTime); 
    const attachments = document.getElementById('anexos-confirmacao').files;

    if (!professional) {
        showNotification('Por favor, informe o profissional responsável.', 'warning');
        return;
    }

    const materialsUsed = [];
    const materialSelections = document.querySelectorAll('#materials-selection-confirm .material-selection');
    
    let hasInsufficientStock = false; 
    
    materialSelections.forEach(selection => {
        const itemId = parseInt(selection.querySelector('.material-item').value);
        const quantity = parseInt(selection.querySelector('.material-quantity').value) || 0;
        
        if (itemId && quantity > 0) {
            const stockItem = db.stockItems.find(item => item.id === itemId);
            if (stockItem) {
                if (stockItem.quantity >= quantity) {
                    materialsUsed.push({
                        itemId: itemId,
                        itemName: stockItem.name,
                        quantityUsed: quantity,
                        unit: stockItem.unit
                    });
                    
                    stockItem.quantity -= quantity;
                    
                    db.stockMovements.push({
                        id: db.nextMovementId++,
                        itemId: itemId,
                        itemName: stockItem.name,
                        type: 'saida',
                        quantity: quantity,
                        reason: `Atendimento - ${client.name}`,
                        date: new Date().toISOString(),
                        user: getCurrentUser().name,
                        scheduleId: schedule.id,
                        itemUnitValue: stockItem.unitValue,
                        purchaseNotes: null, 
                        purchaseFileData: null,
                        purchaseFileName: null
                    });
                } else {
                    showNotification(`Estoque insuficiente para ${stockItem.name}. Disponível: ${stockItem.quantity} unidades.`, 'error');
                    hasInsufficientStock = true;
                    return; 
                }
            }
        }
    });

    if (hasInsufficientStock) {
        return;
    }

    let internIdForAttendance = null;
    if (schedule.assignedToUserId) {
        const assignedUser = db.users.find(u => u.id === schedule.assignedToUserId);
        if (assignedUser && assignedUser.role === 'intern') {
            internIdForAttendance = assignedUser.id;
        }
    } else if (getCurrentUser().role === 'intern') {
        internIdForAttendance = getCurrentUser().id;
    }

    const newAppointment = {
        id: db.nextAppointmentId++,
        date: schedule.date,
        time: schedule.time,
        serviceType: schedule.serviceType,
        notes: observations,
        value: value,
        durationHours: durationHours,
        attendedBy: professional, 
        materialsUsed: materialsUsed,
        status: 'concluido',
        confirmedAt: new Date().toISOString(),
        internId: internIdForAttendance
    };

    if (attachments.length > 0) {
        newAppointment.attachments = [];
        let filesProcessed = 0;
        
        Array.from(attachments).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                newAppointment.attachments.push({
                    fileName: file.name,
                    fileData: e.target.result,
                    uploadDate: new Date().toISOString()
                });
                
                filesProcessed++;
                if (filesProcessed === attachments.length) {
                    finalizeConfirmation();
                }
            };
            reader.readAsDataURL(file);
        });
    } else {
        finalizeConfirmation();
    }

    function finalizeConfirmation() {
        client.appointments.push(newAppointment);
        schedule.status = 'concluido';
        schedule.confirmedAt = new Date().toISOString();
        schedule.attendanceId = newAppointment.id;

        saveDb();
        
        document.getElementById('form-confirmar-atendimento').reset();
        document.getElementById('modal-confirmar-atendimento').style.display = 'none';
        renderSchedule(document.getElementById('date-selector').value);
        renderCalendar();
        
        if (checkTabAccess('estoque', 'view') || checkTabAccess('financeiro', 'view')) { // Check permission for stock/finance tabs
            renderStockList();
            renderStockMovements();
            updateStockSummary();
            const selectedPeriod = document.getElementById('financial-period-selector').value;
            renderFinancialReport(selectedPeriod);
        }
        
        showNotification('Atendimento confirmado com sucesso!', 'success');
    }
}

function addMaterialSelection(modalType = 'default') {
    const containerId = modalType === 'confirm' ? 'materials-selection-confirm' : 'materials-selection';
    const container = document.getElementById(containerId);
    const selectionDiv = document.createElement('div');
    selectionDiv.className = 'material-selection';
    
    selectionDiv.innerHTML = `
        <div class="form-row">
            <div class="form-group form-group-large">
                <select class="material-item" required>
                    <option value="">Selecione um material</option>
                    ${db.stockItems.map(item => {
                        return `<option value="${item.id}">${item.name} - R$ ${item.unitValue.toFixed(2).replace('.', ',')} / ${item.quantity} unidades disponíveis</option>`;
                    }).join('')}
                </select>
            </div>
            <div class="form-group form-group-small">
                <input type="number" class="material-quantity" placeholder="Qtd" min="1" required>
            </div>
            <div class="form-group form-group-small">
                <button type="button" class="btn-delete btn-remove-material">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    selectionDiv.querySelector('.btn-remove-material').addEventListener('click', () => {
        selectionDiv.remove();
    });
    
    container.appendChild(selectionDiv);
}

function addStockItem() {
    if (!checkTabAccess('estoque', 'edit')) { 
        showNotification('Você não tem permissão para adicionar itens ao estoque.', 'error'); 
        return; 
    }

    const name = document.getElementById('stock-item-name').value.trim();
    const category = document.getElementById('stock-item-category').value;
    const quantity = parseInt(document.getElementById('stock-item-quantity').value);
    const minStock = parseInt(document.getElementById('stock-item-min-stock').value);
    const unitValue = parseFloat(document.getElementById('stock-item-unit-value').value);
    const description = document.getElementById('stock-item-description').value.trim();
    const purchaseNotes = document.getElementById('stock-purchase-notes').value.trim();
    const purchaseFileInput = document.getElementById('stock-purchase-file');
    const purchaseFile = purchaseFileInput.files[0];

    if (!name || !category || quantity < 0 || minStock < 0 || isNaN(unitValue) || unitValue < 0) {
        showNotification('Por favor, preencha todos os campos obrigatórios corretamente.', 'warning');
        return;
    }

    const newItem = {
        id: db.nextStockItemId++,
        name: name,
        category: category,
        quantity: quantity,
        minStock: minStock,
        unit: 'unidade', 
        unitValue: unitValue, 
        description: description,
        createdAt: new Date().toISOString(),
        createdBy: getCurrentUser().name
    };

    db.stockItems.push(newItem);
    
    const newMovement = { 
        id: db.nextMovementId++,
        itemId: newItem.id,
        itemName: newItem.name,
        type: 'entrada',
        quantity: quantity,
        reason: 'Adição inicial de estoque',
        date: new Date().toISOString(),
        user: getCurrentUser().name,
        itemUnitValue: newItem.unitValue, 
        purchaseNotes: purchaseNotes 
    };

    if (purchaseFile) {
        if (purchaseFile.size > 5 * 1024 * 1024) {
            showNotification('O comprovante de compra deve ter no máximo 5MB.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            newMovement.purchaseFileData = e.target.result;
            newMovement.purchaseFileName = purchaseFile.name;
            db.stockMovements.push(newMovement); 
            saveAndRefreshStockUI(); 
        };
        reader.onerror = function() {
            showNotification('Erro ao processar o arquivo de comprovante. Tente novamente.', 'error');
        };
        reader.readAsDataURL(purchaseFile);
    } else {
        db.stockMovements.push(newMovement);
        saveAndRefreshStockUI(); 
    }

    function saveAndRefreshStockUI() {
        saveDb();
        document.getElementById('form-add-stock').reset();
        document.getElementById('modal-add-stock').style.display = 'none';
        renderStockList();
        renderStockMovements();
        updateStockSummary();
        const selectedPeriod = document.getElementById('financial-period-selector').value;
        renderFinancialReport(selectedPeriod);
        showNotification('Item adicionado ao estoque com sucesso!', 'success');
    }
}

function processStockAdjustment() {
    if (!checkTabAccess('estoque', 'edit')) { 
        showNotification('Você não tem permissão para ajustar o estoque.', 'error'); 
        return; 
    }

    const { itemId, action } = window.currentStockAdjustment;
    const item = db.stockItems.find(item => item.id === itemId);
    if (!item) return;
    
    const quantity = parseInt(document.getElementById('adjust-stock-quantity').value);
    const reason = document.getElementById('adjust-stock-reason').value.trim();
    
    if (!quantity || quantity <= 0 || !reason) {
        showNotification('Por favor, preencha todos os campos corretamente.', 'warning');
        return;
    }
    
    if (action === 'remove' && item.quantity < quantity) {
        showNotification(`Quantidade insuficiente em estoque. Disponível: ${item.quantity} unidades.`, 'error');
        return;
    }
    
    if (action === 'add') {
        item.quantity += quantity;
    } else {
        item.quantity -= quantity;
    }
    
    db.stockMovements.push({
        id: db.nextMovementId++,
        itemId: itemId,
        itemName: item.name,
        type: action === 'add' ? 'entrada' : 'saida',
        quantity: quantity,
        reason: reason,
        date: new Date().toISOString(),
        user: getCurrentUser().name,
        itemUnitValue: item.unitValue,
        purchaseNotes: null, 
        purchaseFileData: null,
        purchaseFileName: null
    });
    
    saveDb();
    
    document.getElementById('modal-adjust-stock').style.display = 'none';
    renderStockList();
    renderStockMovements();
    updateStockSummary();
    const selectedPeriod = document.getElementById('financial-period-selector').value;
    renderFinancialReport(selectedPeriod);
    
    const actionText = action === 'add' ? 'adicionado ao' : 'removido do';
    showNotification(`${quantity} unidades ${actionText} estoque com sucesso!`, 'success');
}

function addNewFuncionario() {
    if (!checkTabAccess('funcionarios', 'edit')) { 
        showNotification('Você não tem permissão para adicionar funcionários.', 'error'); 
        return; 
    }

    const username = document.getElementById('new-funcionario-username').value.trim();
    const password = document.getElementById('new-funcionario-password').value.trim();
    const name = document.getElementById('new-funcionario-name').value.trim();
    const role = document.getElementById('new-funcionario-role').value;
    const cpf = document.getElementById('new-funcionario-cpf').value.trim();
    const phone = document.getElementById('new-funcionario-phone').value.trim();
    const email = document.getElementById('new-funcionario-email').value.trim();
    const address = document.getElementById('new-funcionario-address').value.trim();
    
    // Academic fields are conditional based on role
    let academicInfo = {};
    if (PROFESSIONAL_ROLES.includes(role)) {
        academicInfo = {
            institution: document.getElementById('new-funcionario-institution').value.trim(),
            graduationPeriod: document.getElementById('new-funcionario-graduation-period').value.trim(),
            education: document.getElementById('new-funcionario-education').value.trim(),
            discipline: document.getElementById('new-funcionario-discipline').value.trim()
        };
    }

    // Collect tab permissions from the dynamically generated selects
    const newTabAccess = {};
    let hasCustomAccess = false;
    document.querySelectorAll('#new-funcionario-tab-permissions select').forEach(select => {
        const tabId = select.id.split('-').pop(); // e.g., 'cadastro' from 'new-funcionario-tab-permissions-perm-cadastro'
        const accessLevel = select.value;
        if (accessLevel !== 'none') {
            newTabAccess[tabId] = accessLevel;
            hasCustomAccess = true;
        }
    });

    if (!username || !password || !name || !role) {
        showNotification('Usuário, senha, nome e cargo são campos obrigatórios.', 'warning');
        return;
    }

    const funcionarioData = {
        username,
        password,
        name,
        role,
        cpf,
        phone,
        email,
        address,
        academicInfo: academicInfo, // Use the collected academicInfo
        tabAccess: hasCustomAccess ? newTabAccess : null, // Set to null if no custom access
    };

    if (addFuncionario(funcionarioData)) { 
        document.getElementById('form-add-funcionario').reset();
        document.getElementById('modal-add-funcionario').style.display = 'none';
        renderFuncionarioList(); 
    }
}

function renderGeneralDocuments(filter = '', typeFilter = '') { 
    const documentsList = document.getElementById('general-documents-list');
    if (!documentsList) return;

    if (!checkTabAccess('documentos', 'view')) { // Check for general view access to the documents tab
        documentsList.innerHTML = '<p>Você não tem permissão para visualizar o mural.</p>';
        return;
    }

    documentsList.innerHTML = '';
    
    if (!db.generalDocuments || db.generalDocuments.length === 0) {
        documentsList.innerHTML = '<p class="empty-state-message">Nenhum item no mural. Clique em um dos botões acima para adicionar um documento, nota ou reunião.</p>';
        return;
    }

    const lowerCaseFilter = filter.toLowerCase();
    const currentUser = getCurrentUser(); // Get current user for meeting visibility

    let filteredDocuments = db.generalDocuments.filter(doc => {
        const matchesSearch = lowerCaseFilter === '' || 
                            doc.title.toLowerCase().includes(lowerCaseFilter) ||
                            (doc.description && doc.description.toLowerCase().includes(lowerCaseFilter)) ||
                            (doc.content && doc.content.toLowerCase().includes(lowerCaseFilter)) ||
                            (doc.createdBy && doc.createdBy.toLowerCase().includes(lowerCaseFilter)); 
        const matchesType = typeFilter === '' || (doc.documentType === typeFilter || doc.type === typeFilter);

        // NEW LOGIC: Meeting visibility restricted to attendees
        if (doc.documentType === 'reuniao') {
            // Only show meeting if user is an attendee OR if the user has edit access to the documents tab
            return matchesSearch && matchesType && (doc.attendees.includes(currentUser.id) || checkTabAccess('documentos', 'edit'));
        } else {
            // For other document types (file, note), apply general visibility
            return matchesSearch && matchesType;
        }
    });

    if (filteredDocuments.length === 0) {
        documentsList.innerHTML = '<p class="empty-state-message">Nenhum item corresponde à sua busca.</p>';
        return;
    }

    filteredDocuments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const typeInfo = {
        'documento': { label: 'Documento', icon: 'fa-file-alt', color: '#3b82f6' }, 
        'nota': { label: 'Nota', icon: 'fa-sticky-note', color: '#f59e0b' },      
        'relatorio': { label: 'Relatório', icon: 'fa-chart-pie', color: '#10b981' }, 
        'comprovante': { label: 'Comprovante', icon: 'fa-receipt', color: '#6366f1' }, 
        'contrato': { label: 'Contrato', icon: 'fa-file-signature', color: '#8b5cf6' }, 
        'lembrete': { label: 'Lembrete', icon: 'fa-bell', color: '#f59e0b' },      
        'procedimento': { label: 'Procedimento', icon: 'fa-list-check', color: '#0ea5e9' }, 
        'observacao': { label: 'Observação', icon: 'fa-eye', color: '#64748b' },    
        'reuniao': { label: 'Reunião', icon: 'fa-users', color: '#ef4444' },         
        'outros': { label: 'Outros', icon: 'fa-box-open', color: '#64748b' }        
    };

    filteredDocuments.forEach(doc => {
        const isMeeting = doc.documentType === 'reuniao';
        const docType = doc.type || 'outros';
        const info = typeInfo[docType] || typeInfo['outros'];

        const extraDetails = isMeeting ? `
            <div class="reuniao-details">
                <p><i class="fa-solid fa-calendar-alt"></i> ${new Date(doc.meetingDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} às ${doc.meetingTime}</p>
                ${doc.location ? `<p><i class="fa-solid fa-map-marker-alt"></i> ${doc.location}</p>` : ''}
            </div>
            <div class="reuniao-attendees">
                <strong>Participantes:</strong> ${doc.attendees.map(id => {
                    const user = db.users.find(u => u.id === id);
                    return `<span class="attendee-badge ${currentUser?.id === id ? 'current-user' : ''}">${user ? user.name.split(' ')[0] : 'ID desconhecido'}</span>`;
                }).join('')}
            </div>
        ` : '';

        const docCard = document.createElement('div');
        docCard.className = 'general-document-card';
        docCard.style.setProperty('--card-accent-color', info.color);
        
        docCard.innerHTML = `
            <div class="general-document-card-header">
                <div class="general-document-card-icon">
                    <i class="fa-solid ${info.icon}"></i>
                </div>
                <div class="general-document-card-title-group">
                    <h4>${doc.title}</h4>
                    <span class="general-document-card-type">${info.label}</span>
                </div>
                ${checkTabAccess('documentos', 'edit') ? `
                <button class="btn-delete-doc-small" onclick="window.deleteMuralItem(${doc.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
                ` : ''}
            </div>
            <div class="general-document-card-body">
                ${doc.description ? `<p class="general-document-card-description">${doc.description}</p>` : ''}
                ${doc.content ? `<div class="general-document-card-content">${doc.content}</div>` : ''}
                ${extraDetails}
            </div>
            <div class="general-document-card-footer">
                <div class="general-document-card-author">
                    <i class="fa-solid fa-user"></i>
                    <span>Por ${doc.createdBy} em ${new Date(doc.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <div class="general-document-card-actions">
                    ${doc.fileData ? `
                        <a href="${doc.fileData}" download="${doc.fileName}" class="btn-download">
                            <i class="fa-solid fa-download"></i> Baixar
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
        
        documentsList.appendChild(docCard);
    });
}

function addGeneralDocument() {
    if (!checkTabAccess('documentos', 'edit')) { 
        showNotification('Você não tem permissão para adicionar documentos gerais.', 'error'); 
        return; 
    }

    const title = document.getElementById('general-document-title').value.trim();
    const type = document.getElementById('general-document-type').value;
    const description = document.getElementById('general-document-description').value.trim();
    const fileInput = document.getElementById('general-document-file');

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
        if (!db.generalDocuments) {
            db.generalDocuments = [];
        }

        const newDocument = {
            id: db.nextGeneralDocumentId++,
            title: title,
            type: type,
            description: description,
            fileName: file.name,
            fileData: e.target.result,
            createdAt: new Date().toISOString(),
            createdBy: getCurrentUser().name,
            documentType: 'file'
        };

        db.generalDocuments.push(newDocument);
        saveDb();
        
        document.getElementById('modal-add-general-document').style.display = 'none';
        document.getElementById('form-add-general-document').reset();
        renderGeneralDocuments();
        showNotification('Documento adicionado com sucesso!', 'success');
    };

    reader.onerror = function() {
        showNotification('Erro ao processar o arquivo. Tente novamente.', 'error');
    };

    reader.readAsDataURL(file);
}

function addGeneralNote() {
    if (!checkTabAccess('documentos', 'edit')) { 
        showNotification('Você não tem permissão para adicionar notas gerais.', 'error'); 
        return; 
    }

    const title = document.getElementById('general-note-title').value.trim();
    const type = document.getElementById('general-note-type').value;
    const content = document.getElementById('general-note-content').value.trim();

    if (!title || !type || !content) {
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'warning');
        return;
    }

    if (!db.generalDocuments) {
        db.generalDocuments = [];
    }

    const newNote = {
        id: db.nextGeneralDocumentId++,
        title: title,
        type: type,
        content: content,
        createdAt: new Date().toISOString(),
        createdBy: getCurrentUser().name,
        documentType: 'note'
    };

    db.generalDocuments.push(newNote);
    saveDb();
    
    document.getElementById('modal-add-general-note').style.display = 'none';
    document.getElementById('form-add-general-note').reset();
    renderGeneralDocuments();
    showNotification('Nota adicionada com sucesso!', 'success');
}

// NEW: Function to check and show meeting notifications on login
function checkNotifications() {
    const notificationCheckDelay = 500;

    setTimeout(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        const notificationBell = document.getElementById('notification-bell');
        const notificationCountBadge = document.getElementById('notification-count');
        const notificationList = document.getElementById('notification-list');

        if (!notificationBell || !notificationCountBadge || !notificationList) return;

        const unreadNotifications = (db.notifications || []).filter(n => n.userId === currentUser.id && !n.isRead);
        
        const allUserNotifications = (db.notifications || [])
            .filter(n => n.userId === currentUser.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        notificationList.innerHTML = ''; 

        if (allUserNotifications.length > 0) {
            if (unreadNotifications.length > 0) {
                notificationCountBadge.textContent = unreadNotifications.length;
                notificationCountBadge.style.display = 'flex';
            } else {
                notificationCountBadge.style.display = 'none';
            }

            const notificationIcons = {
                'meeting_invite': 'fa-users',
                'meeting_cancellation': 'fa-calendar-times', 
                'schedule_assignment': 'fa-calendar-check',
                'client_assignment': 'fa-user-plus'
            };

            allUserNotifications.slice(0, 10).forEach(notification => { 
                const icon = notificationIcons[notification.type] || 'fa-bell';
                const item = document.createElement('div');
                item.className = `notification-item ${notification.isRead ? '' : 'unread'}`; 
                item.innerHTML = `
                    <div class="notification-item-icon"><i class="fa-solid ${icon}"></i></div>
                    <div class="notification-item-content">
                        <h5>${notification.title}</h5>
                        <p>${notification.message}</p>
                        <p class="notification-timestamp">${new Date(notification.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                `;
                notificationList.appendChild(item);
            });

        } else {
            notificationCountBadge.style.display = 'none';
            notificationList.innerHTML = '<p style="padding: 16px; text-align: center; color: var(--text-muted);">Nenhuma notificação.</p>';
        }
    }, notificationCheckDelay);
}

// NEW: Function to mark notifications as read
function markNotificationsAsRead() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    let madeChanges = false;
    db.notifications.forEach(n => {
        if (n.userId === currentUser.id && !n.isRead) {
            n.isRead = true;
            madeChanges = true;
        }
    });

    if (madeChanges) {
        saveDb();
        setTimeout(checkNotifications, 300);
    }
}

// NEW Function to populate meeting attendees
function populateMeetingAttendees() {
    const container = document.getElementById('meeting-alert-attendees-container');
    if (!container) return;

    container.innerHTML = ''; 

    const allUsers = [...db.users].sort((a, b) => a.name.localeCompare(b.name));

    allUsers.forEach(user => {
        const checkboxGroup = document.createElement('div');
        checkboxGroup.className = 'checkbox-group';

        const checkboxId = `attendee-${user.id}`;
        checkboxGroup.innerHTML = `
            <input type="checkbox" id="${checkboxId}" name="attendees" value="${user.id}">
            <label for="${checkboxId}">${user.name}</label>
        `;
        container.appendChild(checkboxGroup);
    });
}

// NEW Function to add a meeting alert
function addMeetingAlert() {
    if (!checkTabAccess('documentos', 'edit')) { 
        showNotification('Você não tem permissão para agendar reuniões.', 'error'); 
        return; 
    }

    const title = document.getElementById('meeting-alert-title').value.trim();
    const date = document.getElementById('meeting-alert-date').value;
    const time = document.getElementById('meeting-alert-time').value;
    const location = document.getElementById('meeting-alert-location').value.trim();
    const description = document.getElementById('meeting-alert-description').value.trim();
    
    const attendeesCheckboxes = document.querySelectorAll('#meeting-alert-attendees-container input[type="checkbox"]:checked');
    let attendees = Array.from(attendeesCheckboxes).map(checkbox => parseInt(checkbox.value));

    // Add the current user (creator) to the attendees list if not already present
    const currentUser = getCurrentUser();
    if (!attendees.includes(currentUser.id)) {
        attendees.push(currentUser.id);
    }

    if (!title || !date || !time || attendees.length === 0) { // Check length *after* adding creator
        showNotification('Título, data, horário e pelo menos um participante são obrigatórios.', 'warning');
        return;
    }

    if (!db.generalDocuments) {
        db.generalDocuments = [];
    }

    const newMeeting = {
        id: db.nextGeneralDocumentId++,
        documentType: 'reuniao',
        type: 'reuniao',
        title,
        description,
        meetingDate: date,
        meetingTime: time,
        location,
        attendees,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.name // Use currentUser.name as createdBy
    };

    db.generalDocuments.push(newMeeting);

    if (!db.notifications) db.notifications = [];
    attendees.forEach(attendeeId => {
        // Send notification to all attendees, including the creator if they weren't the one who triggered this branch
        // This ensures the creator gets a notification too, if that's desired.
        // If 'if (attendeeId !== currentUser.id)' is kept, the creator won't get a notification for their own meeting.
        // Based on "quero que a pessoa que marcou a reunião seja marcado automaticamente pelo sistema"
        // it means they should be part of the 'attendees' list and thus see the meeting and *could* receive a notification.
        // However, typically a user doesn't need a notification for something they just created.
        // I will keep the previous behavior of not notifying self, but ensure self is an attendee.
        if (attendeeId !== currentUser.id) { 
            db.notifications.push({
                id: db.nextNotificationId++,
                userId: attendeeId,
                type: 'meeting_invite',
                title: 'Convite para Reunião',
                message: `Você foi convidado(a) para a reunião: "${title}".`,
                relatedId: newMeeting.id,
                createdAt: new Date().toISOString(),
                isRead: false
            });
        }
    });

    saveDb();
    
    document.getElementById('modal-add-meeting-alert').style.display = 'none';
    document.getElementById('form-add-meeting-alert').reset();
    renderGeneralDocuments();
    showNotification('Reunião agendada com sucesso! Uma notificação será exibida para os participantes.', 'success');
    checkNotifications(); 
}