// UI management module
import { db } from './database.js';
import { getCurrentUser, isRoleAllowed, DIRECTOR_ONLY, FINANCE_ONLY, DIRECTOR_OR_FINANCE, COORDINATOR_AND_HIGHER, NON_FINANCE_ACCESS, ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES, PROFESSIONAL_ROLES, DIRECTOR_AND_PROFESSIONALS, DIRECTOR_AND_COORDINATORS_ONLY_DOCUMENTS, STOCK_MANAGERS, ALL_USERS, checkTabAccess } from './auth.js';

export function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
}

export function showMainApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    
    // Update user info
    const currentUser = getCurrentUser();
    document.getElementById('current-user-name').textContent = currentUser.name;
    let roleText;
    switch (currentUser.role) {
        case 'director':
            roleText = 'Diretoria';
            break;
        case 'coordinator_madre':
            roleText = 'Coordenador(a) Madre';
            break;
        case 'coordinator_floresta':
            roleText = 'Coordenador(a) Floresta';
            break;
        case 'staff':
            roleText = 'Funcionário(a) Geral';
            break;
        case 'intern':
            roleText = 'Estagiário(a)';
            break;
        case 'musictherapist':
            roleText = 'Musicoterapeuta';
            break;
        case 'financeiro':
            roleText = 'Financeiro';
            break;
        case 'receptionist':
            roleText = 'Recepcionista';
            break;
        case 'psychologist':
            roleText = 'Psicólogo(a)';
            break;
        case 'psychopedagogue':
            roleText = 'Psicopedagogo(a)';
            break;
        case 'speech_therapist':
            roleText = 'Fonoaudiólogo(a)';
            break;
        case 'nutritionist':
            roleText = 'Nutricionista';
            break;
        case 'physiotherapist':
            roleText = 'Fisioterapeuta';
            break;
        default:
            roleText = 'Usuário';
    }
    document.getElementById('current-user-role').textContent = `(${roleText})`;
    
    // NEW LOGIC: Tab visibility using checkTabAccess
    document.querySelectorAll('.tab-button').forEach(button => {
        const tabId = button.dataset.tab;
        const canView = checkTabAccess(tabId, 'view');
        button.style.display = canView ? 'flex' : 'none';
    });
}

export function switchTab(tabId) {
    const tabContents = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabContents.forEach(content => content.classList.remove('active'));
    tabButtons.forEach(button => button.classList.remove('active'));

    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

export function closeModal(modal) {
    modal.style.display = 'none';
}

export function updateCurrentDate() {
    const today = new Date();
    document.getElementById('current-date').textContent = today.toLocaleDateString('pt-BR');
    document.getElementById('date-selector').valueAsDate = today;
}

export function showNotification(message, type = 'info', title = null, duration = 5000) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const titles = {
        success: 'Sucesso',
        error: 'Erro',
        warning: 'Atenção',
        info: 'Informação'
    };

    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fa-solid ${icons[type]}"></i>
        </div>
        <div class="notification-content">
            ${title || titles[type] ? `<div class="notification-title">${title || titles[type]}</div>` : ''}
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">
            <i class="fa-solid fa-times"></i>
        </button>
    `;

    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        closeNotification(notification);
    });

    container.appendChild(notification);

    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                closeNotification(notification);
            }
        }, duration);
    }
}

function closeNotification(notification) {
    notification.classList.add('removing');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

export function updateGlobalSearchDatalist() {
    const searchDatalist = document.getElementById('global-search-datalist');
    if (!searchDatalist) return;

    searchDatalist.innerHTML = '';
    const currentUser = getCurrentUser();
    
    // Add Patients based on permissions
    if (checkTabAccess('historico', 'view')) {
        // User can see all clients
        db.clients.forEach(client => {
            const option = document.createElement('option');
            option.value = `Paciente: ${client.name} (ID: ${client.id})`;
            searchDatalist.appendChild(option);
        });
    } else if (checkTabAccess('meus-pacientes', 'view')) {
        // User can only see their own clients
        db.clients.forEach(client => {
            if (client.assignedProfessionalId === currentUser.id) {
                const option = document.createElement('option');
                option.value = `Paciente: ${client.name} (ID: ${client.id})`;
                searchDatalist.appendChild(option);
            }
        });
    }

    // Add Employees based on permissions
    if (checkTabAccess('funcionarios', 'view')) {
        db.users.forEach(user => {
            const option = document.createElement('option');
            option.value = `Funcionário: ${user.name} (ID: ${user.id})`;
            searchDatalist.appendChild(option);
        });
    }

    // Add Stock Items based on permissions
    if (checkTabAccess('estoque', 'view')) {
        db.stockItems.forEach(item => {
            const option = document.createElement('option');
            option.value = `Estoque: ${item.name} (ID: ${item.id})`;
            searchDatalist.appendChild(option);
        });
    }
}