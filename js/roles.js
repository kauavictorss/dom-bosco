// Arquivo central para definir todas as constantes de funções e permissões.

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

// Funções que podem visualizar e gerenciar todos os agendamentos
export const SCHEDULE_MANAGERS = [
    'director', 'coordinator_madre', 'coordinator_floresta', 'receptionist'
];

// Funções que podem visualizar e gerenciar documentos
export const DOCUMENT_MANAGERS = [
    'director', 'coordinator_madre', 'coordinator_floresta', 'professional'
];

export const ALL_SCHEDULE_VIEW_EDIT_MANAGERS = ['director', 'coordinator_madre', 'coordinator_floresta', 'receptionist'];

// Roles que podem adicionar/editar/deletar documentos e reuniões gerais (Diretor e Coordenadores)
export const DIRECTOR_AND_COORDINATORS_ONLY_DOCUMENTS = ['director', 'coordinator_madre', 'coordinator_floresta'];

// Todos os usuários para visibilidade de abas (ex: visualização geral do "Mural do Coordenador")
export const ALL_USERS = ['director', 'coordinator_madre', 'coordinator_floresta', 'staff', 'intern', 'musictherapist', 'financeiro', 'receptionist', 'psychologist', 'psychopedagogue', 'speech_therapist', 'nutritionist', 'physiotherapist'];
