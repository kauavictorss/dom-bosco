// Database module for neuropsychology system
export const db = {
    clients: [],
    appointments: [],
    schedules: [],
    dailyNotes: [], // New array for daily financial notes
    generalDocuments: [], // New array for general documents, notes, and meetings
    notifications: [], // NEW: Centralized notifications
    roles: [], // NEW: For custom roles
    users: [
        {id: 1, username: 'director', password: 'admin123', name: 'Diretoria Geral', role: 'director'},
        {id: 3, username: 'financeiro', password: 'admin123', name: 'Financeiro', role: 'financeiro'},
        {id: 2, username: 'staff', password: 'staff123', name: 'Funcionário', role: 'staff'},
        {
            id: 18,
            username: 'raquel',
            password: 'admin123',
            name: 'Coordenadora Raquel (Floresta)',
            role: 'coordinator_floresta'
        },
        {id: 19, username: 'tatiana_admin', password: 'admin123', name: 'Tatiane', role: 'coordinator_madre'},
        {
            id: 4,
            username: 'tatiana_neuro',
            password: 'admin123',
            name: 'Coordenadora Tatiana (Floresta)',
            role: 'coordinator_floresta'
        },
        // Music Therapist
        {
            id: 21,
            username: 'musica',
            password: 'teste123',
            name: 'Maria Melodia',
            role: 'musictherapist',
            address: 'Rua da Harmonia, 123',
            institution: 'Conservatório Musical',
            graduationPeriod: 'Pós-graduação',
            education: 'Musicoterapia',
            discipline: 'Musicoterapia Clínica',
            phone: '(31) 98877-6655',
            email: 'maria.melodia@example.com',
            cpf: '111.222.333-44'
        },
        // Interns
        {
            id: 5,
            username: 'frances',
            password: 'intern123',
            name: 'Frances Jane Bifano Freddi',
            role: 'intern',
            address: 'rua Castelo de Windsor 475/301 - bairro Castelo - Belo Horizonte MG.',
            institution: 'IESLA',
            graduationPeriod: '5°',
            education: 'Análise e Desenvolvimento de Sistemas',
            discipline: 'Neuropsicologia Infantil',
            phone: '(31)99826-6514',
            email: 'fjanebifano@gmail.com',
            cpf: '629.398.156-15'
        },
        {
            id: 6,
            username: 'vanessa',
            password: 'intern123',
            name: 'Vanessa',
            role: 'intern',
            address: 'Av. B, 456',
            institution: 'Centro Universitário',
            graduationPeriod: '7º Semestre',
            education: 'Psicologia',
            discipline: 'Reabilitação Cognitiva',
            phone: '(21) 92222-2222',
            email: 'vanessa@example.com',
            cpf: '222.333.444-55'
        },
        {
            id: 7,
            username: 'luciana',
            password: 'intern123',
            name: 'Luciana Villela Moyses',
            role: 'intern',
            address: 'Rua Deputado Gregoriano Canedo 18 Trevo',
            institution: 'IESLA',
            graduationPeriod: '7º Semestre',
            education: 'Letras',
            discipline: 'Psicodiagnóstico',
            phone: '(31) 99745-2225',
            email: 'luttivillela@gmail.com',
            cpf: '781.904.106-44'
        },
        {
            id: 8,
            username: 'debora',
            password: 'intern123',
            name: 'Debora',
            role: 'intern',
            address: 'Travessa D, 101',
            institution: 'Universidade Estadual',
            graduationPeriod: '8º Semestre',
            education: 'Psicologia',
            discipline: 'Neurociências',
            phone: '(21) 94444-4444',
            email: 'debora@example.com',
            cpf: '444.555.666-77'
        },
        {
            id: 9,
            username: 'renata',
            password: 'intern123',
            name: 'Renata',
            role: 'intern',
            address: 'Estrada E, 202',
            institution: 'Universidade Federal',
            graduationPeriod: '5º Semestre',
            education: 'Terapia Ocupacional',
            discipline: 'Cognição',
            phone: '(21) 95555-5555',
            email: 'renata@example.com',
            cpf: '555.666.777-88'
        },
        {
            id: 10,
            username: 'nathalia',
            password: 'intern123',
            name: 'Nathalia',
            role: 'intern',
            address: 'Rua F, 303',
            institution: 'Centro Universitário',
            graduationPeriod: '7º Semestre',
            education: 'Psicopedagogia',
            discipline: 'Aprendizagem',
            phone: '(21) 96666-6666',
            email: 'nathalia@example.com',
            cpf: '666.777.888-99'
        },
        {
            id: 11,
            username: 'walisson',
            password: 'intern123',
            name: 'Walisson',
            role: 'intern',
            address: 'Av. G, 404',
            institution: 'Faculdade Particular',
            graduationPeriod: '6º Semestre',
            education: 'Fonoaudiologia',
            discipline: 'Linguagem',
            phone: '(21) 97777-7777',
            email: 'walisson@example.com',
            cpf: '777.888.999-00'
        },
        {
            id: 12,
            username: 'tatiana',
            password: 'intern123',
            name: 'Tatiana',
            role: 'intern',
            address: 'Rua H, 505',
            institution: 'Universidade Estadual',
            graduationPeriod: '8º Semestre',
            education: 'Psicologia',
            discipline: 'Saúde Mental',
            phone: '(21) 98888-8888',
            email: 'tatiana@example.com',
            cpf: '888.999.000-11'
        },
        {
            id: 13,
            username: 'luiz',
            password: 'intern123',
            name: 'Luiz',
            role: 'intern',
            address: 'Alameda I, 606',
            institution: 'Universidade Federal',
            graduationPeriod: '5º Semestre',
            education: 'Psicologia',
            discipline: 'Avaliação Psicológica',
            phone: '(21) 99999-9999',
            email: 'luiz@example.com',
            cpf: '999.000.111-22'
        },
        {
            id: 14,
            username: 'pedro',
            password: 'intern123',
            name: 'Pedro',
            role: 'intern',
            address: 'Rua J, 707',
            institution: 'Centro Universitário',
            graduationPeriod: '7º Semestre',
            education: 'Psicologia',
            discipline: 'Neuropsicologia Adulto',
            phone: '(21) 90000-0000',
            email: 'pedro@example.com',
            cpf: '000.111.222-33'
        },
        {
            id: 15,
            username: 'pedro_alexandre',
            password: 'intern123',
            name: 'Pedro Alexandre Carneiro',
            role: 'intern',
            address: 'Rua Perdoes 781',
            institution: 'PUC Minas coração eucarístico',
            graduationPeriod: '4°',
            education: 'Psicologia',
            discipline: 'Neuropsicologia Adulto',
            phone: '(31)992384630',
            email: 'pedrinalex@gmail.com',
            cpf: '018.582.366-14',
            changeHistory: []
        },
        {
            id: 16,
            username: 'wallisson',
            password: 'intern123',
            name: 'Wallisson Henrique Santos',
            role: 'intern',
            address: 'Rua Higienópolis, 137, Piratininga. Ibirité',
            institution: 'Pós graduação - Fumec',
            graduationPeriod: 'N/A',
            education: 'Psicólogo',
            discipline: 'N/A',
            phone: '99889-7105 / 98693-3477',
            email: 'wallissonpsicologo@gmail.com',
            cpf: '011.922.196-12',
            changeHistory: []
        },
        {
            id: 20,
            username: 'renata_cantagalli',
            password: 'intern123',
            name: 'Renata Grichtolik Cantagalli Paiva',
            role: 'intern',
            address: 'Rua Bibliotecários, Bairro Alipio de Melo, BH/MG - 30840-070',
            institution: 'IESLA',
            graduationPeriod: 'Pós-Graduação / último semestre',
            education: '08/2025',
            discipline: 'N/A',
            phone: '(31) 98598-7608',
            email: 'renatacantagalli@gmail.com',
            cpf: '06050524688',
            changeHistory: []
        },
        {id: 22, username: 'rachel', password: 'rachel123', name: 'Rachel Silva', role: 'staff'},
        // NEW USERS: Re-assigning roles based on user request
        {id: 23, username: 'tatiane', password: 'tatiane123', name: 'Tatiane', role: 'coordinator_madre'},
        {id: 24, username: 'christopher', password: 'christopher123', name: 'Christopher', role: 'receptionist'},
        {id: 25, username: 'yuri', password: 'yuri123', name: 'Yuri', role: 'receptionist'},
        {id: 26, username: 'kimberly', password: 'kimberly123', name: 'Kimberly', role: 'psychologist'},
        {id: 27, username: 'beethoven', password: 'beethoven123', name: 'Beethoven', role: 'musictherapist'},
        {id: 28, username: 'cristine', password: 'cristine123', name: 'Cristine', role: 'psychopedagogue'},
        {id: 29, username: 'viviane', password: 'viviane123', name: 'Viviane', role: 'nutritionist'},
        {id: 30, username: 'renata_fono', password: 'renatafono123', name: 'Renata', role: 'speech_therapist'},
        {id: 31, username: 'daniella', password: 'daniella123', name: 'Daniella', role: 'speech_therapist'},
        {id: 32, username: 'jeferson', password: 'jeferson123', name: 'Jeferson', role: 'physiotherapist'}
    ],
    anamnesisTypes: [
        ...Array.from({length: 40}, (_, i) => ({id: `anamnese-${i + 1}`, name: `Sessão ${i + 1}`}))
    ],
    stockItems: [],
    stockMovements: [],
    nextClientId: 1,
    nextAppointmentId: 1,
    nextScheduleId: 1,
    nextNoteId: 1,
    nextChangeId: 1, // This is a general change ID for all history, including client and user changes
    nextDocumentId: 1,
    nextStockItemId: 1,
    nextMovementId: 1,
    nextUserId: 33,
    nextDailyNoteId: 1,
    nextGeneralDocumentId: 1,
    nextNotificationId: 1 // NEW: ID for notifications
};

export function saveDb() {
    localStorage.setItem('gestaoClientesDb', JSON.stringify(db));
}

export function loadDb() {
    const storedDb = localStorage.getItem('gestaoClientesDb');
    if (storedDb) {
        const parsedDb = JSON.parse(storedDb);

        // Ensure new fields are present after loading old data
        if (!parsedDb.schedules) parsedDb.schedules = [];
        if (!parsedDb.dailyNotes) parsedDb.dailyNotes = [];
        if (!parsedDb.nextDailyNoteId) parsedDb.nextDailyNoteId = 1;
        if (!parsedDb.generalDocuments) parsedDb.generalDocuments = [];
        if (!parsedDb.nextGeneralDocumentId) parsedDb.nextGeneralDocumentId = 1;
        if (!parsedDb.nextChangeId) parsedDb.nextChangeId = 1; // Ensure nextChangeId exists
        if (!parsedDb.notifications) parsedDb.notifications = []; // NEW: Initialize notifications
        if (!parsedDb.nextNotificationId) parsedDb.nextNotificationId = 1; // NEW: Initialize notification ID
        if (!parsedDb.roles) parsedDb.roles = []; // NEW: Initialize custom roles

        parsedDb.schedules.forEach(schedule => {
            if (schedule.assignedToUserId === undefined) {
                schedule.assignedToUserId = null;
                schedule.assignedToUserName = null;
            }
        });

        // NEW MIGRATION: from visibleTabs array to tabAccess object
        parsedDb.users.forEach(user => {
            if (user.visibleTabs && Array.isArray(user.visibleTabs)) {
                if (!user.tabAccess) { // Only set if tabAccess doesn't exist
                    user.tabAccess = {};
                    user.visibleTabs.forEach(tabId => {
                        user.tabAccess[tabId] = 'edit'; // Assume old visible tabs grant full edit access
                    });
                }
                delete user.visibleTabs; // Remove the old property
            } else if (user.visibleTabs === null) {
                // If visibleTabs was explicitly null, make tabAccess null too
                user.tabAccess = null;
            }

            if (user.tabAccess === undefined) {
                user.tabAccess = null; // Initialize if it doesn't exist at all
            }
        });

        // Merge users to ensure new demo users are added and roles are updated if needed
        // IMPORTANT: When merging, ensure existing custom roles from user-created entries are preserved.
        const defaultUsersMap = new Map(db.users.map(u => [u.id, u]));
        const updatedUsers = parsedDb.users.map(existingUser => {
            const defaultUser = defaultUsersMap.get(existingUser.id);
            if (defaultUser) {
                // For predefined roles, take the default role. For custom roles, keep the existing one.
                const roleToKeep = allPredefinedRoles().includes(existingUser.role) ? defaultUser.role : existingUser.role;

                const mergedUser = {
                    ...defaultUser,
                    ...existingUser,
                    role: roleToKeep // Prioritize default role if it's predefined
                };
                // Explicitly retain tabAccess and changeHistory from the existing user if they exist
                mergedUser.tabAccess = existingUser.tabAccess !== undefined ? existingUser.tabAccess : defaultUser.tabAccess;
                mergedUser.changeHistory = existingUser.changeHistory || [];
                return mergedUser;
            }
            return existingUser; // If no match in default, keep existing user as is (including custom roles)
        });

        // Add new default users that might not be in parsedDb.users
        defaultUsersMap.forEach((defaultUser, id) => {
            if (!updatedUsers.some(u => u.id === id)) {
                updatedUsers.push({
                    ...defaultUser,
                    changeHistory: [],
                    academicInfo: defaultUser.academicInfo || {},
                    tabAccess: defaultUser.tabAccess || null
                });
            }
        });
        parsedDb.users = updatedUsers;

        // Ensure all users have the new fields initialized (e.g., to empty string or empty array for history) if missing
        parsedDb.users.forEach(user => {
            user.address = user.address !== undefined ? user.address : '';
            user.academicInfo = user.academicInfo !== undefined ? user.academicInfo : {}; // Ensure academicInfo is an object
            user.academicInfo.institution = (user.academicInfo && user.academicInfo.institution) !== undefined ? user.academicInfo.institution : '';
            user.academicInfo.graduationPeriod = (user.academicInfo && user.academicInfo.graduationPeriod) !== undefined ? user.academicInfo.graduationPeriod : '';
            user.academicInfo.education = (user.academicInfo && user.academicInfo.education) !== undefined ? user.academicInfo.education : '';
            user.academicInfo.discipline = (user.academicInfo && user.academicInfo.discipline) !== undefined ? user.academicInfo.discipline : '';
            user.phone = user.phone !== undefined ? user.phone : '';
            user.email = user.email !== undefined ? user.email : '';
            user.cpf = user.cpf !== undefined ? user.cpf : '';
            user.changeHistory = user.changeHistory !== undefined ? user.changeHistory : []; // Initialize changeHistory
            user.tabAccess = user.tabAccess !== undefined ? user.tabAccess : null; // Initialize tabAccess
        });

        // Ensure stockItems have unitValue and unit as 'unidade'
        if (!parsedDb.stockItems) parsedDb.stockItems = [];
        parsedDb.stockItems.forEach(item => {
            if (item.unitValue === undefined) {
                item.unitValue = 0;
            }
            if (item.unit !== 'unidade') {
                const conversionFactor = {
                    'unidade': 1,
                    'pacote': 5,
                    'caixa': 10,
                    'resma': 15,
                    'kit': 20,
                    'lote': 25
                }[item.unit] || 1;
                item.quantity = item.quantity * conversionFactor;
                item.unit = 'unidade';
            }
        });

        // Ensure stockMovements have itemUnitValue and quantity adjusted if unit was converted
        if (!parsedDb.stockMovements) parsedDb.stockMovements = [];
        parsedDb.stockMovements.forEach(movement => {
            if (movement.itemUnitValue === undefined) {
                // Try to derive from stockItems if possible, otherwise default to 0
                const relatedItem = parsedDb.stockItems.find(item => item.id === movement.itemId);
                movement.itemUnitValue = relatedItem ? relatedItem.unitValue : 0;
            }
            // Migration: Ensure itemName exists for movements
            if (movement.itemName === undefined) {
                const relatedItem = parsedDb.stockItems.find(item => item.id === movement.itemId);
                movement.itemName = relatedItem ? relatedItem.name : (movement.type === 'exclusao' ? 'Item Removido' : 'Item Desconhecido');
            }
            // NEW: Initialize new fields
            if (movement.purchaseNotes === undefined) {
                movement.purchaseNotes = null;
            }
            if (movement.purchaseFileData === undefined) {
                movement.purchaseFileData = null;
            }
            if (movement.purchaseFileName === undefined) {
                movement.purchaseFileName = null;
            }
        });

        // Ensure appointments have durationHours
        if (!parsedDb.appointments) parsedDb.appointments = [];
        parsedDb.appointments.forEach(app => {
            if (app.durationHours === undefined) {
                app.durationHours = 0;
            }
        });

        // NEW: Ensure clients have assignedProfessionalId, assignedProfessionalName, unit, createdByUserId AND changeHistory
        parsedDb.clients.forEach(client => {
            if (client.assignedInternId !== undefined) {
                client.assignedProfessionalId = client.assignedInternId;
                delete client.assignedInternId;
            }
            if (client.assignedInternName !== undefined) {
                client.assignedProfessionalName = client.assignedInternName;
                delete client.assignedInternName;
            }
            if (client.assignedProfessionalId !== undefined) {
                // MIGRATION: from single professional to multiple
                if (client.assignedProfessionalIds === undefined) {
                    client.assignedProfessionalIds = [];
                    if (client.assignedProfessionalId !== null) {
                        client.assignedProfessionalIds.push(client.assignedProfessionalId);
                    }
                }
                delete client.assignedProfessionalId;
                delete client.assignedProfessionalName;
            }
            if (client.assignedProfessionalIds === undefined) {
                client.assignedProfessionalIds = [];
            }
            if (client.unit === undefined) {
                client.unit = null;
            }
            if (client.changeHistory === undefined) { // Initialize client changeHistory if missing
                client.changeHistory = [];
            }
            if (client.createdByUserId === undefined) { // Initialize createdByUserId if missing
                // This assumes old clients were created by director (ID 1) or no specific user
                client.createdByUserId = 1; // Default to director for old clients
            }
            // If old 'observacoes' daily notes type exists, change to 'nota'
            if (parsedDb.dailyNotes) {
                parsedDb.dailyNotes.forEach(note => {
                    if (note.type === 'observacao') {
                        note.type = 'nota';
                    }
                });
            }
        });

        Object.assign(db, parsedDb);

        // Calculate nextUserId based on the highest existing user ID
        const maxUserId = db.users.reduce((maxId, user) => Math.max(maxId, user.id), 0);
        db.nextUserId = Math.max(db.nextUserId, maxUserId + 1);

        // Ensure nextClientId is set correctly based on existing clients
        if (db.clients.length > 0) {
            const maxClientId = db.clients.reduce((maxId, client) => Math.max(maxId, client.id), 0);
            db.nextClientId = Math.max(db.nextClientId, maxClientId + 1);
        }

        saveDb(); // Save the updated state to localStorage
    } else {
        // If no storedDb, add simplified stock items and a test client for initial setup
        db.stockItems = [
            {
                id: 1,
                name: 'Lápis HB',
                category: 'papelaria',
                quantity: 50,
                minStock: 10,
                unit: 'unidade',
                description: 'Lápis para desenhos e escrita',
                unitValue: 1.50
            },
            {
                id: 2,
                name: 'Papel A4 (folhas)',
                category: 'papelaria',
                quantity: 375,
                minStock: 75,
                unit: 'unidade',
                description: 'Folhas de papel A4 branco para impressão',
                unitValue: 1.33
            },
            {
                id: 3,
                name: 'Teste WISC-IV (componentes)',
                category: 'testes',
                quantity: 60,
                minStock: 20,
                unit: 'unidade',
                description: 'Componentes avulsos da Escala de Inteligência Wechsler para Crianças',
                unitValue: 40.00
            },
            {
                id: 4,
                name: 'Blocos de Madeira (peças)',
                category: 'brinquedos',
                quantity: 80,
                minStock: 20,
                unit: 'unidade',
                description: 'Peças individuais de blocos coloridos para atividades lúdicas',
                unitValue: 4.50
            },
            {
                id: 5,
                name: 'Quebra-cabeça (unidades)',
                category: 'jogos',
                quantity: 75,
                minStock: 15,
                unit: 'unidade',
                description: 'Unidades de quebra-cabeças diversos temas',
                unitValue: 6.00
            },
            {
                id: 6,
                name: 'WISC-IV Protocolo de Aplicação Geral',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Protocolo para aplicação geral do WISC-IV',
                unitValue: 10.00
            },
            {
                id: 7,
                name: 'WISC-IV Protocolo de Aplicação Códigos e Procurar Símbolos',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Protocolo de aplicação para subtestes de Códigos e Procurar Símbolos do WISC-IV',
                unitValue: 10.00
            },
            {
                id: 8,
                name: 'WISC-IV Protocolo de Aplicação Cancelamento',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Protocolo de aplicação para o subteste de Cancelamento do WISC-IV',
                unitValue: 10.00
            },
            {
                id: 9,
                name: 'BPA-2 Livros de Aplicação - Atenção Alternada',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de aplicação para o teste BPA-2 - Atenção Alternada',
                unitValue: 30.00
            },
            {
                id: 10,
                name: 'BPA-2 Livros de Aplicação - Atenção Dividida',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de aplicação para o teste BPA-2 - Atenção Dividida',
                unitValue: 30.00
            },
            {
                id: 11,
                name: 'BPA-2 Livros de Aplicação - Atenção Concentrada',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de aplicação para o teste BPA-2 - Atenção Concentrada',
                unitValue: 30.00
            },
            {
                id: 12,
                name: 'RAVLT Livro de Aplicação - Vol. 2',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de aplicação para o teste RAVLT - Volume 2',
                unitValue: 25.00
            },
            {
                id: 13,
                name: 'TDE-II Livro de Aplicação Subteste Escrita 1º ao 9º ano VOL. 3',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de aplicação para o Subteste de Escrita do TDE-II (1º ao 9º ano)',
                unitValue: 35.00
            },
            {
                id: 14,
                name: 'TDE-II Livro de Avaliação Subteste Escrita 1º ao 4º ano VOL. 4',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de avaliação para o Subteste de Escrita do TDE-II (1º ao 4º ano)',
                unitValue: 35.00
            },
            {
                id: 15,
                name: 'TDE-II Livro de Avaliação Qualitativa Subteste Escrita 1º ao 4º ano VOL. 5',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de avaliação qualitativa para o Subteste de Escrita do TDE-II (1º ao 4º ano)',
                unitValue: 35.00
            },
            {
                id: 16,
                name: 'TDE-II Livro de Aplicação Subteste Aritmética 1º ao 5º ano VOL. 6',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de aplicação para o Subteste de Aritmética do TDE-II (1º ao 5º ano)',
                unitValue: 35.00
            },
            {
                id: 17,
                name: 'TDE-II Livro de Avaliação Subteste Aritmética 1º ao 5º ano VOL. 7',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de avaliação para o Subteste de Aritmética do TDE-II (1º ao 5º ano)',
                unitValue: 35.00
            },
            {
                id: 21,
                name: 'TDE-II Livro de Avaliação Subteste Leitura 1º ao 4º ano VOL. 8',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de avaliação para o Subteste de Leitura do TDE-II (1º ao 4º ano)',
                unitValue: 35.00
            },
            {
                id: 22,
                name: 'TDE-II Livro de Avaliação Subteste Escrita 5º ao 9º ano VOL. 9',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de avaliação para o Subteste de Escrita do TDE-II (5º ao 9º ano)',
                unitValue: 35.00
            },
            {
                id: 23,
                name: 'TDE-II Livro de Avaliação Qualitativa Subteste Escrita 5º ao 9º ano VOL. 10',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de avaliação qualitativa para o Subteste de Escrita do TDE-II (5º ao 9º ano)',
                unitValue: 35.00
            },
            {
                id: 24,
                name: 'TDE-II Livro de Aplicação Subteste Aritmética 6º ao 9º ano VOL. 11',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de aplicação para o Subteste de Aritmética do TDE-II (6º ao 9º ano)',
                unitValue: 35.00
            },
            {
                id: 25,
                name: 'TDE-II Livro de Avaliação Subteste Aritmética 6º ao 9º ano VOL. 12',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de avaliação para o Subteste de Aritmética do TDE-II (6º ao 9º ano)',
                unitValue: 35.00
            },
            {
                id: 26,
                name: 'TDE-II Livro de Avaliação Subteste Leitura 5º ao 9º ano VOL. 13',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de avaliação para o Subteste de Leitura do TDE-II (5º ao 9º ano)',
                unitValue: 35.00
            },
            {
                id: 27,
                name: 'TDE-II Livro de Avaliação Geral VOL. 14',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de avaliação geral para o TDE-II - Volume 14',
                unitValue: 40.00
            },
            {
                id: 28,
                name: 'THCP - Livro de Exercício I - VOL. 2',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de exercício I para THCP - Volume 2',
                unitValue: 20.00
            },
            {
                id: 29,
                name: 'THCP - Livro Protocolo de Registro para Respostas - VOL. 4',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Livro de protocolo de registro para respostas do THCP - Volume 4',
                unitValue: 15.00
            },
            {
                id: 30,
                name: 'TRIA - Livro de Aplicação VOL.2',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de aplicação para o teste TRIA - Volume 2',
                unitValue: 25.00
            },
            {
                id: 31,
                name: 'TRIC - Livro de Aplicação VOL.2',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de aplicação para o teste TRIC - Volume 2',
                unitValue: 25.00
            },
            {
                id: 32,
                name: 'MTL - Livro de Aplicação I',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de aplicação I para o teste MTL',
                unitValue: 30.00
            },
            {
                id: 33,
                name: 'PRONUMERO - Livro de Aplicação e Avaliação Tarefa de Cálculos Aritméticos Básicos (TCAB)',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de Aplicação e Avaliação Tarefa de Cálculos Aritméticos Básicos (TCAB)',
                unitValue: 30.00
            },
            {
                id: 34,
                name: 'PRONUMERO - Livro de Aplicação e Avaliação Tarefa de Problemas Aritmético Narrativos (TPAN)',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de Aplicação e Avaliação Tarefa de Problemas Aritméticos Narrativos (TPAN)',
                unitValue: 30.00
            },
            {
                id: 35,
                name: 'PRONUMERO - Livro de Aplicação e Avaliação Tarefa de Transcodificação Numérica (TTN)',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de Aplicação e Avaliação Tarefa de Transcodificação Numérica (TTN)',
                unitValue: 30.00
            },
            {
                id: 36,
                name: 'TISD - Livro de Aplicação VOL.4',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de Aplicação para o teste TISD - Volume 4',
                unitValue: 25.00
            },
            {
                id: 37,
                name: 'TISD - Livro de Aplicação VOL.5',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de Aplicação para o teste TISD - Volume 5',
                unitValue: 25.00
            },
            {
                id: 38,
                name: 'Perfil Sensorial 2 - Caderno Criança',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Caderno para aplicação do Perfil Sensorial 2 - Versão Criança',
                unitValue: 18.00
            },
            {
                id: 39,
                name: 'Perfil Sensorial 2 - Caderno Abreviado',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Caderno para aplicação do Perfil Sensorial 2 - Versão Abreviada',
                unitValue: 15.00
            },
            {
                id: 40,
                name: 'Perfil Sensorial 2 - Caderno Criança Pequena',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Caderno para aplicação do Perfil Sensorial 2 - Versão Criança Pequena',
                unitValue: 18.00
            },
            {
                id: 41,
                name: 'Perfil Sensorial 2 - Caderno Bebê',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Caderno para aplicação do Perfil Sensorial 2 - Versão Bebê',
                unitValue: 18.00
            },
            {
                id: 42,
                name: 'Perfil Sensorial 2 - Caderno Acompanhamento Escolar',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Caderno para aplicação do Perfil Sensorial 2 - Versão Acompanhamento Escolar',
                unitValue: 18.00
            },
            {
                id: 43,
                name: 'WASI - Protocolo De Registro',
                category: 'testes',
                quantity: 15,
                minStock: 7,
                unit: 'unidade',
                description: 'Protocolo de registro para o teste WASI',
                unitValue: 12.00
            },
            {
                id: 44,
                name: 'Vineland - 3 - Formulário Extensivo Pais',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Formulário Extensivo Vineland-3 para Pais',
                unitValue: 22.00
            },
            {
                id: 45,
                name: 'Vineland - 3 - Formulário Domínio Pais',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Formulário Domínio Vineland-3 para Pais',
                unitValue: 20.00
            },
            {
                id: 46,
                name: 'Vineland - 3 - Formulário Extensivo Professores',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Formulário Extensivo Vineland-3 para Professores',
                unitValue: 22.00
            },
            {
                id: 47,
                name: 'Vineland - 3 - Formulário Domínio Professores',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Formulário Domínio Vineland-3 para Professores',
                unitValue: 20.00
            },
            {
                id: 48,
                name: 'Vineland - 3 - Formulário de Entrevista Dos Níveis de Domínio',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Formulário de Entrevista Vineland-3 - Níveis de Domínio',
                unitValue: 25.00
            },
            {
                id: 49,
                name: 'Vineland - 3 - Formulário de Entrevista Extensivo',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Formulário de Entrevista Vineland-3 - Extensivo',
                unitValue: 25.00
            },
            {
                id: 50,
                name: 'IDADI - Livro de Aplicação 4 a 35 meses VOL. 2',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de Aplicação IDADI para 4 a 35 meses - Volume 2',
                unitValue: 30.00
            },
            {
                id: 51,
                name: 'IDADI - Livro de Aplicação 36 a 72 meses VOL. 3',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de Aplicação IDADI para 36 a 72 meses - Volume 3',
                unitValue: 30.00
            },
            {
                id: 52,
                name: 'IDADI - Livro de Avaliação VOL. 4',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Livro de Avaliação IDADI - Volume 4',
                unitValue: 30.00
            },
            {
                id: 53,
                name: 'D2-R - Folhas de Respostas',
                category: 'testes',
                quantity: 20,
                minStock: 10,
                unit: 'unidade',
                description: 'Folhas de respostas para o teste D2-R',
                unitValue: 8.00
            },
            {
                id: 54,
                name: 'FDT - Folha de Resposta',
                category: 'testes',
                quantity: 20,
                minStock: 10,
                unit: 'unidade',
                description: 'Folha de respostas para o teste FDT',
                unitValue: 7.00
            },
            {
                id: 55,
                name: 'CPM - RAVEN Folha da Respostas',
                category: 'testes',
                quantity: 20,
                minStock: 10,
                unit: 'unidade',
                description: 'Folha de respostas para o teste CPM - RAVEN',
                unitValue: 9.00
            },
            {
                id: 56,
                name: 'Ditado Balanceado - Ficha Individual de Avaliação',
                category: 'testes',
                quantity: 15,
                minStock: 7,
                unit: 'unidade',
                description: 'Ficha individual de avaliação para Ditado Balanceado',
                unitValue: 6.00
            },
            {
                id: 57,
                name: 'Ditado Balanceado - Ficha Individual de Avaliação Progressiva',
                category: 'testes',
                quantity: 15,
                minStock: 7,
                unit: 'unidade',
                description: 'Ficha individual de avaliação progressiva para Ditado Balanceado',
                unitValue: 6.00
            },
            {
                id: 58,
                name: 'Ditado Balanceado - Perfil Ortográfico da Turma',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Perfil ortográfico da turma para Ditado Balanceado',
                unitValue: 12.00
            },
            {
                id: 59,
                name: 'SRS-2 - Protocolo Pré-Escolar',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Protocolo Pré-Escolar para SRS-2',
                unitValue: 18.00
            },
            {
                id: 60,
                name: 'SRS-2 - Protocolo Escolar',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Protocolo Escolar para SRS-2',
                unitValue: 18.00
            },
            {
                id: 61,
                name: 'SRS-2 - Protocolo Adulto Autorrelato',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Protocolo Adulto (Autorrelato) para SRS-2',
                unitValue: 18.00
            },
            {
                id: 62,
                name: 'SRS-2 - Protocolo Adulto Heterorrelato',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Protocolo Adulto (Heterorrelato) para SRS-2',
                unitValue: 18.00
            },
            {
                id: 63,
                name: 'BFP - Folha de Resposta',
                category: 'testes',
                quantity: 20,
                minStock: 10,
                unit: 'unidade',
                description: 'Folha de Resposta para o teste BFP',
                unitValue: 7.50
            },
            {
                id: 64,
                name: 'BFP - Folha de Apuração',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Folha de Apuração para o teste BFP',
                unitValue: 9.00
            },
            {
                id: 65,
                name: 'SON-R 6-40 - Folha de Registro',
                category: 'testes',
                quantity: 15,
                minStock: 7,
                unit: 'unidade',
                description: 'Folha de Registro para o teste SON-R 6-40',
                unitValue: 10.00
            },
            {
                id: 66,
                name: 'SON-R 6-40 - Caderno Padrões',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Caderno de Padrões para o teste SON-R 6-40',
                unitValue: 28.00
            },
            {
                id: 67,
                name: 'SON-R 6-40 - Caderno Padrões',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Caderno de Padrões para o teste SON-R 6-40',
                unitValue: 28.00
            },
            {
                id: 68,
                name: 'SON-R 2-7 - Caderno Padrões',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Caderno de Padrões para o teste SON-R 2-7',
                unitValue: 28.00
            },
            {
                id: 69,
                name: 'SON-R 2-7 - Folha de Registro',
                category: 'testes',
                quantity: 15,
                minStock: 7,
                unit: 'unidade',
                description: 'Folha de Registro para o teste SON-R 2-7',
                unitValue: 10.00
            },
            {
                id: 70,
                name: 'Figura de Rey - Ficha de Anotação Figura A',
                category: 'testes',
                quantity: 20,
                minStock: 10,
                unit: 'unidade',
                description: 'Ficha de Anotação para Figura de Rey - Figura A',
                unitValue: 6.50
            },
            {
                id: 71,
                name: 'Figura de Rey - Ficha de Anotação Figura B',
                category: 'testes',
                quantity: 20,
                minStock: 10,
                unit: 'unidade',
                description: 'Ficha de Anotação para Figura de Rey - Figura B',
                unitValue: 6.50
            },
            {
                id: 72,
                name: 'Columbia 3 - Folha de Respostas',
                category: 'testes',
                quantity: 15,
                minStock: 7,
                unit: 'unidade',
                description: 'Folha de Respostas para o teste Columbia 3',
                unitValue: 9.50
            },
            {
                id: 73,
                name: 'PROLEC-SE-R - Folha de Respostas e Anotações',
                category: 'testes',
                quantity: 15,
                minStock: 7,
                unit: 'unidade',
                description: 'Folha de Respostas e Anotações para PROLEC-SE-R',
                unitValue: 11.00
            },
            {
                id: 74,
                name: 'PROLEC-SE-R - Folha de Respostas Rastreio',
                category: 'testes',
                quantity: 15,
                minStock: 7,
                unit: 'unidade',
                description: 'Folha de Respostas de Rastreio para PROLEC-SE-R',
                unitValue: 10.50
            },
            {
                id: 75,
                name: 'HUMOR-IJ - Folha de aplicação',
                category: 'testes',
                quantity: 15,
                minStock: 7,
                unit: 'unidade',
                description: 'Folha de aplicação para o teste HUMOR-IJ',
                unitValue: 8.00
            },
            {
                id: 76,
                name: 'FPT - Bloco de Respostas',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Bloco de Respostas para o teste FPT',
                unitValue: 12.00
            },
            {
                id: 77,
                name: 'WISC-IV - Protocolo de Avaliação Completo',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Protocolo de avaliação completo para a Escala Weschler de Inteligência para Crianças (WISC-IV)',
                unitValue: 150.00
            },
            {
                id: 78,
                name: 'WISC-IV - Caderno de Respostas - Bloco 1',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Caderno de respostas do WISC-IV, Bloco 1 de itens',
                unitValue: 25.00
            },
            {
                id: 79,
                name: 'WISC-IV - Caderno de Respostas - Bloco 2',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Caderno de respostas do WISC-IV, Bloco 2 de itens',
                unitValue: 25.00
            },
            {
                id: 80,
                name: 'BPA-2 - Manual Técnico',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual técnico da Bateria Psicológica para Avaliação da Atenção (BPA-2)',
                unitValue: 80.00
            },
            {
                id: 81,
                name: 'BPA-2 - Folha de Respostas Geral',
                category: 'testes',
                quantity: 20,
                minStock: 10,
                unit: 'unidade',
                description: 'Folha de respostas geral para a Bateria Psicológica para Avaliação da Atenção (BPA-2)',
                unitValue: 10.00
            },
            {
                id: 82,
                name: 'BPA-2 - Caderno de Aplicação I',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Primeiro caderno de aplicação da Bateria Psicológica para Avaliação da Atenção (BPA-2)',
                unitValue: 40.00
            },
            {
                id: 83,
                name: 'RAVLT - Manual de Instruções',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual de instruções para o Teste de Aprendizagem Auditivo Verbal de Rey (RAVLT)',
                unitValue: 70.00
            },
            {
                id: 84,
                name: 'TDE-II - Manual de Avaliação Qualitativa',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual de avaliação qualitativa para o Teste de Desempenho Escolar (TDE-II)',
                unitValue: 38.00
            },
            {
                id: 85,
                name: 'TDE-II - Livro de Respostas Leitura Oral',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Livro de respostas para o subteste de Leitura Oral do TDE-II',
                unitValue: 20.00
            },
            {
                id: 86,
                name: 'TDE-II - Caderno de Estímulos - Leitura',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Caderno de estímulos para o subteste de Leitura do TDE-II',
                unitValue: 30.00
            },
            {
                id: 87,
                name: 'TDE-II - Caderno de Estímulos - Escrita',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Caderno de estímulos para o subteste de Escrita do TDE-II',
                unitValue: 30.00
            },
            {
                id: 88,
                name: 'TDE-II - Caderno de Estímulos - Aritmética',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Caderno de estímulos para o subteste de Aritmética do TDE-II',
                unitValue: 30.00
            },
            {
                id: 89,
                name: 'TDE-II - Protocolo de Observação Comportamental',
                category: 'testes',
                quantity: 8,
                minStock: 4,
                unit: 'unidade',
                description: 'Protocolo para registro de observações comportamentais durante a aplicação do TDE-II',
                unitValue: 15.00
            },
            {
                id: 90,
                name: 'TDE-II - Folha de Registro de Erros - Leitura',
                category: 'testes',
                quantity: 15,
                minStock: 7,
                unit: 'unidade',
                description: 'Folha de registro detalhado para erros no subteste de Leitura do TDE-II',
                unitValue: 10.00
            },
            {
                id: 91,
                name: 'TDE-II - Folha de Registro de Erros - Escrita',
                category: 'testes',
                quantity: 15,
                minStock: 7,
                unit: 'unidade',
                description: 'Folha de registro detalhado para erros no subteste de Escrita do TDE-II',
                unitValue: 10.00
            },
            {
                id: 92,
                name: 'TDE-II - Folha de Registro de Erros - Aritmética',
                category: 'testes',
                quantity: 15,
                minStock: 7,
                unit: 'unidade',
                description: 'Folha de registro detalhado para erros no subteste de Aritmética do TDE-II',
                unitValue: 10.00
            },
            {
                id: 93,
                name: 'TDE-II - Escala de Desempenho Global',
                category: 'testes',
                quantity: 7,
                minStock: 3,
                unit: 'unidade',
                description: 'Escala para avaliação do desempenho global no Teste de Desempenho Escolar (TDE-II)',
                unitValue: 22.00
            },
            {
                id: 94,
                name: 'TDE-II - Relatório de Avaliação Padronizado',
                category: 'testes',
                quantity: 7,
                minStock: 3,
                unit: 'unidade',
                description: 'Formulário padronizado para elaboração de relatório de avaliação do TDE-II',
                unitValue: 28.00
            },
            {
                id: 95,
                name: 'TDE-II - Kit de Aplicação Rápida',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Kit de componentes essenciais para aplicação rápida do TDE-II',
                unitValue: 60.00
            },
            {
                id: 96,
                name: 'THCP - Manual de Correção',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual de correção para o Teste de Habilidades e Conhecimento Pré-Alfabetização (THCP)',
                unitValue: 30.00
            },
            {
                id: 97,
                name: 'THCP - Caderno de Estímulos',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Caderno de estímulos visuais para o Teste de Habilidades e Conhecimento Pré-Alfabetização (THCP)',
                unitValue: 25.00
            },
            {
                id: 98,
                name: 'TriA - Manual de Interpretação',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual de interpretação para a Triagem de Psicopatologia para Adultos (TriA)',
                unitValue: 40.00
            },
            {
                id: 99,
                name: 'TriC - Manual de Avaliação',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual de avaliação para a Triagem de Problemas Emocionais e Comportamentais em Crianças (TriC)',
                unitValue: 40.00
            },
            {
                id: 100,
                name: 'MTL-Brasil - Protocolo Completo',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Protocolo completo para a Bateria Montreal-Toulouse de Avaliação da Linguagem (MTL-Brasil)',
                unitValue: 100.00
            },
            {
                id: 101,
                name: 'PRONUMERO - Manual de Padronização',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual de padronização para a Bateria de Avaliação do Processamento Numérico e Cálculo (PRONUMERO)',
                unitValue: 45.00
            },
            {
                id: 102,
                name: 'PRONUMERO - Caderno de Respostas Geral',
                category: 'testes',
                quantity: 15,
                minStock: 7,
                unit: 'unidade',
                description: 'Caderno de respostas geral para a Bateria de Avaliação do Processamento Numérico e Cálculo (PRONUMERO)',
                unitValue: 15.00
            },
            {
                id: 103,
                name: 'PRONUMERO - Kit de Materiais Manipuláveis',
                category: 'testes',
                quantity: 2,
                minStock: 1,
                unit: 'unidade',
                description: 'Kit de materiais manipuláveis para aplicação do PRONUMERO',
                unitValue: 80.00
            },
            {
                id: 104,
                name: 'TISD - Manual de Correção e Interpretação',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual de correção e interpretação para o Teste para Identificação de Sinais de Dislexia (TISD)',
                unitValue: 35.00
            },
            {
                id: 105,
                name: 'TISD - Caderno de Respostas Escrita',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Caderno de respostas focado na escrita para o Teste para Identificação de Sinais de Dislexia (TISD)',
                unitValue: 12.00
            },
            {
                id: 106,
                name: 'Perfil Sensorial 2 - Manual Técnico',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual técnico completo para o Perfil Sensorial 2',
                unitValue: 90.00
            },
            {
                id: 107,
                name: 'Perfil Sensorial 2 - Protocolo de Registro Global',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Protocolo de registro global para a avaliação com o Perfil Sensorial 2',
                unitValue: 20.00
            },
            {
                id: 108,
                name: 'Perfil Sensorial 2 - Folha de Respostas para Pais',
                category: 'testes',
                quantity: 15,
                minStock: 7,
                unit: 'unidade',
                description: 'Folha de respostas específica para pais no Perfil Sensorial 2',
                unitValue: 15.00
            },
            {
                id: 109,
                name: 'Perfil Sensorial 2 - Folha de Respostas para Professores',
                category: 'testes',
                quantity: 15,
                minStock: 7,
                unit: 'unidade',
                description: 'Folha de respostas específica para professores no Perfil Sensorial 2',
                unitValue: 15.00
            },
            {
                id: 110,
                name: 'Perfil Sensorial 2 - Kit Completo de Avaliação',
                category: 'testes',
                quantity: 2,
                minStock: 1,
                unit: 'unidade',
                description: 'Kit completo de avaliação com todos os componentes do Perfil Sensorial 2',
                unitValue: 200.00
            },
            {
                id: 111,
                name: 'WASI - Manual de Aplicação e Interpretação',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual para aplicação e interpretação da Escala Weschler Abreviada de Inteligência (WASI)',
                unitValue: 75.00
            },
            {
                id: 112,
                name: 'Vineland-3 - Manual de Pontuação',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual detalhado para pontuação da Vineland Escala de Comportamentos Adaptativos - 3a Edição',
                unitValue: 60.00
            },
            {
                id: 113,
                name: 'Vineland - 3 - Caderno de Estímulos',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Caderno com materiais de estímulo para a Vineland-3',
                unitValue: 45.00
            },
            {
                id: 114,
                name: 'Vineland - 3 - Formulário para Cuidadores',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Formulário específico para avaliação de cuidadores na Vineland-3',
                unitValue: 20.00
            },
            {
                id: 115,
                name: 'Vineland - 3 - Relatório Interpretativo',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Formulário para geração de relatório interpretativo da Vineland-3',
                unitValue: 25.00
            },
            {
                id: 116,
                name: 'Vineland - 3 - Folha de Respostas Abreviada',
                category: 'testes',
                quantity: 15,
                minStock: 7,
                unit: 'unidade',
                description: 'Folha de respostas em formato abreviado para a Vineland-3',
                unitValue: 15.00
            },
            {
                id: 117,
                name: 'Vineland - 3 - Kit Básico',
                category: 'testes',
                quantity: 2,
                minStock: 1,
                unit: 'unidade',
                description: 'Kit básico com os componentes essenciais para a aplicação da Vineland-3',
                unitValue: 250.00
            },
            {
                id: 118,
                name: 'IDADI - Manual Técnico',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual técnico para o Inventário Dimensional de Avaliação do Desenvolvimento Infantil (IDADI)',
                unitValue: 50.00
            },
            {
                id: 119,
                name: 'IDADI - Caderno de Respostas Geral',
                category: 'testes',
                quantity: 15,
                minStock: 7,
                unit: 'unidade',
                description: 'Caderno de respostas geral para o Inventário Dimensional de Avaliação do Desenvolvimento Infantil (IDADI)',
                unitValue: 18.00
            },
            {
                id: 120,
                name: 'IDADI - Material Lúdico (Conjunto)',
                category: 'testes',
                quantity: 2,
                minStock: 1,
                unit: 'unidade',
                description: 'Conjunto de materiais lúdicos para a aplicação do IDADI',
                unitValue: 70.00
            },
            {
                id: 121,
                name: 'D2-R - Manual de Aplicação e Avaliação',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual para aplicação e avaliação do Teste D2 Revisado (D2-R)',
                unitValue: 40.00
            },
            {
                id: 122,
                name: 'FDT - Manual de Instruções',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual de instruções para o Teste dos Cinco Dígitos (FDT)',
                unitValue: 35.00
            },
            {
                id: 123,
                name: 'CPM-RAVEN - Manual de Aplicação',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual para aplicação das Matrizes Progressivas Coloridas de Raven (CPM-RAVEN)',
                unitValue: 60.00
            },
            {
                id: 124,
                name: 'Ditado Balanceado - Manual do Aplicador',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual para o aplicador do Ditado Balanceado - Avaliação da escrita alfabético-ortográfica',
                unitValue: 25.00
            },
            {
                id: 125,
                name: 'Ditado Balanceado - Ficha de Síntese Individual',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Ficha para síntese individual dos resultados do Ditado Balanceado',
                unitValue: 8.00
            },
            {
                id: 126,
                name: 'Ditado Balanceado - Kit de Figuras para Ditado',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Kit de figuras para uso no Ditado Balanceado',
                unitValue: 40.00
            },
            {
                id: 127,
                name: 'SRS-2 - Manual de Interpretação e Avaliação',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual para interpretação e avaliação da Escala de Responsividade Social (SRS-2)',
                unitValue: 70.00
            },
            {
                id: 128,
                name: 'SRS-2 - Protocolo para Educadores',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Protocolo da SRS-2 adaptado para uso por educadores',
                unitValue: 20.00
            },
            {
                id: 129,
                name: 'SRS-2 - Caderno de Casos Clínicos',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Caderno com exemplos de casos clínicos e aplicação da SRS-2',
                unitValue: 30.00
            },
            {
                id: 130,
                name: 'SRS-2 - Formulário de Follow-up',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Formulário para acompanhamento (follow-up) após a aplicação da SRS-2',
                unitValue: 15.00
            },
            {
                id: 131,
                name: 'BFP - Manual de Instruções',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual de instruções para a Bateria Fatorial de Personalidade (BFP)',
                unitValue: 50.00
            },
            {
                id: 132,
                name: 'BFP - Caderno de Questões',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Caderno contendo as questões da Bateria Fatorial de Personalidade (BFP)',
                unitValue: 20.00
            },
            {
                id: 133,
                name: 'SON-R 6-40 - Manual de Aplicação',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual para aplicação do Teste Não-Verbal de Inteligência (SON-R 6-40 anos)',
                unitValue: 65.00
            },
            {
                id: 134,
                name: 'SON-R 6-40 - Caderno de Itens',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Caderno contendo os itens para aplicação do Teste Não-Verbal de Inteligência (SON-R 6-40 anos)',
                unitValue: 40.00
            },
            {
                id: 135,
                name: 'SON-R 2-7 - Manual de Pontuação',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual para pontuação do Teste Não-Verbal de Inteligência (SON-R 2-7 anos)',
                unitValue: 65.00
            },
            {
                id: 136,
                name: 'SON-R 2-7 - Material de Blocos',
                category: 'testes',
                quantity: 2,
                minStock: 1,
                unit: 'unidade',
                description: 'Conjunto de blocos para a aplicação do Teste Não-Verbal de Inteligência (SON-R 2-7 anos)',
                unitValue: 120.00
            },
            {
                id: 137,
                name: 'Figura de Rey - Manual de Aplicação',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual para aplicação e interpretação da Figura Complexa de Rey',
                unitValue: 30.00
            },
            {
                id: 138,
                name: 'Figura de Rey - Folha de Registro para Análise de Erros',
                category: 'testes',
                quantity: 10,
                minStock: 5,
                unit: 'unidade',
                description: 'Folha de registro para análise detalhada de erros na Figura Complexa de Rey',
                unitValue: 9.00
            },
            {
                id: 139,
                name: 'Columbia 3 - Manual Completo',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual completo da Escala de Maturidade Mental Colúmbia 3',
                unitValue: 55.00
            },
            {
                id: 140,
                name: 'PROLEC-SE-R - Manual de Instruções',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual de instruções para as Provas de Avaliação dos Processos de Leitura (PROLEC-SE-R)',
                unitValue: 48.00
            },
            {
                id: 141,
                name: 'PROLEC-SE-R - Caderno de Leitura Texto',
                category: 'testes',
                quantity: 5,
                minStock: 2,
                unit: 'unidade',
                description: 'Caderno com textos para avaliação de leitura no PROLEC-SE-R',
                unitValue: 25.00
            },
            {
                id: 142,
                name: 'HUMOR-IJ - Manual de Avaliação',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual de avaliação da Bateria de Escalas de Sintomas Internalizantes Infantojuvenil (HUMOR-IJ)',
                unitValue: 42.00
            },
            {
                id: 143,
                name: 'Teste dos Cinco Pontos - Manual',
                category: 'testes',
                quantity: 3,
                minStock: 1,
                unit: 'unidade',
                description: 'Manual completo para o Teste dos Cinco Pontos',
                unitValue: 38.00
            }
        ];

        // Add a test client if no stored data exists (initial load)
        db.clients.push({
            id: 1, // Start with ID 1 for the test client
            type: 'adult',
            name: 'Cliente Teste',
            email: 'cliente.teste@example.com',
            phone: '(11) 98765-4321',
            birthDate: '1990-01-01',
            gender: 'outro',
            cpf: '123.456.789-00',
            rg: '12.345.678-9',
            naturalidade: 'São Paulo/SP',
            estadoCivil: 'solteiro',
            escolaridade: 'superior-completo',
            profissao: 'Engenheiro',
            contatoEmergencia: 'Contato Teste (11) 91234-5678',
            unit: 'madre',
            cep: '01000-000',
            address: 'Rua de Teste',
            number: '123',
            complement: 'Apto 101',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            observations: 'Este é um cliente de teste para demonstração do sistema.',
            diagnosticoPrincipal: 'Nenhum',
            historicoMedico: 'Nenhum',
            queixaNeuropsicologica: 'Nenhum',
            expectativasTratamento: 'Acompanhamento geral.',
            appointments: [],
            notes: [],
            documents: [],
            changeHistory: [], // Initialize change history for test client
            createdByUserId: 1, // Created by Director (ID 1)
            assignedProfessionalIds: [2], // Assign to 'staff' user (ID 2)
        });

        // NEW: Add a test notification for the staff user about the test client
        if (!db.notifications) db.notifications = [];
        db.notifications.push({
            id: db.nextNotificationId++,
            userId: 2, // For 'staff' user (ID: 2)
            type: 'client_assignment',
            title: 'Novo Paciente Vinculado',
            message: `O "Cliente Teste" foi vinculado a você.`,
            relatedId: 1, // client id
            createdAt: new Date().toISOString(),
            isRead: false
        });

        // Update nextClientId to be after the last client added (which is the test client, ID 1)
        db.nextClientId = 2; // Next available ID will be 2

        // Update nextStockItemId to be after the last new item added
        db.nextStockItemId = 144;

        // Calculate nextUserId based on the hardcoded users if no storedDb existed
        const maxUserId = db.users.reduce((maxId, user) => Math.max(maxId, user.id), 0);
        db.nextUserId = Math.max(db.nextUserId, maxUserId + 1);

        saveDb(); // Save the initial state with only users, anamnesis, and sample stock
    }
}

// Helper to get all predefined roles for migrations/checks
function allPredefinedRoles() {
    return [
        'director', 'coordinator_madre', 'coordinator_floresta', 'staff', 'intern',
        'musictherapist', 'financeiro', 'receptionist', 'psychologist',
        'psychopedagogue', 'speech_therapist', 'nutritionist', 'physiotherapist'
    ];
}