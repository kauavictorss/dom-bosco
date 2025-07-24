// Stock management module
import { db, saveDb } from './database.js';
import { getCurrentUser, isRoleAllowed, DIRECTOR_ONLY, STOCK_MANAGERS } from './auth.js';

export function renderStockList() {
    const stockList = document.getElementById('stock-list');
    if (!stockList) return;
    
    // Only Director and Finance can view stock
    if (!isRoleAllowed(STOCK_MANAGERS)) {
        stockList.innerHTML = '<p>Você não tem permissão para visualizar o estoque.</p>';
        return;
    }

    stockList.innerHTML = '';
    
    if (db.stockItems.length === 0) {
        stockList.innerHTML = '<p>Nenhum item no estoque.</p>';
        return;
    }
    
    // Group items by category
    const categories = {};
    db.stockItems.forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = [];
        }
        categories[item.category].push(item);
    });
    
    const categoryNameMap = { 
        'papelaria': 'Papelaria',
        'testes': 'Testes Neuropsicológicos',
        'brinquedos': 'Brinquedos Terapêuticos',
        'jogos': 'Jogos e Quebra-cabeças',
        'tecnologia': 'Equipamentos Tecnológicos',
        'consumiveis': 'Materiais Consumíveis',
        'outros': 'Outros'
    };
    
    // Sort categories alphabetically for consistent display
    const sortedCategoryKeys = Object.keys(categories).sort((a, b) => {
        const nameA = categoryNameMap[a] || a;
        const nameB = categoryNameMap[b] || b;
        return nameA.localeCompare(nameB);
    });

    sortedCategoryKeys.forEach(category => {
        const categorySection = document.createElement('div');
        categorySection.className = 'stock-category';
        
        // Count normal and low stock items in category
        const lowStockInCategory = categories[category].filter(item => {
            return item.quantity > 0 && item.quantity <= item.minStock;
        }).length;
        const outOfStockInCategory = categories[category].filter(item => {
            return item.quantity === 0;
        }).length;
        const totalInCategory = categories[category].length;
        
        let categorySummaryHtml = `
            <span class="category-summary">
                <span class="category-total">${totalInCategory} itens</span>
        `;
        if (outOfStockInCategory > 0) {
            categorySummaryHtml += `<span class="category-low-stock out-of-stock-summary">🚫 ${outOfStockInCategory} sem estoque</span>`;
        }
        if (lowStockInCategory > 0) {
            categorySummaryHtml += `<span class="category-low-stock low-stock-summary">⚠️ ${lowStockInCategory} baixo estoque</span>`;
        }
        categorySummaryHtml += `</span>`;
        
        categorySection.innerHTML = `
            <h3>
                <i class="fa-solid fa-tag"></i>
                ${categoryNameMap[category] || category}
                ${categorySummaryHtml}
            </h3>
        `;
        
        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'stock-items-grid';
        
        // Sort items within each category by name
        const sortedItemsInCategory = [...categories[category]].sort((a, b) => a.name.localeCompare(b.name));

        sortedItemsInCategory.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.id = `stock-item-card-${item.id}`; // Add ID for global search
            
            // Display quantities directly in units
            const displayQuantity = item.quantity;
            const displayUnit = 'unidade';
            
            const isLowStock = item.quantity > 0 && item.quantity <= item.minStock;
            const isOutOfStock = item.quantity === 0;
            const stockStatus = isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'normal-stock';
            
            itemCard.className = `stock-item-card ${stockStatus}`;
            
            let stockBadge = '';
            if (isOutOfStock) {
                stockBadge = '<span class="stock-status-badge out-of-stock">🚫 SEM ESTOQUE</span>';
            } else if (isLowStock) {
                stockBadge = '<span class="stock-status-badge low-stock">⚠️ ESTOQUE BAIXO</span>';
            } else {
                stockBadge = '<span class="stock-status-badge normal-stock">✅ ESTOQUE OK</span>';
            }
            
            itemCard.innerHTML = `
                <div class="stock-item-header">
                    <h4>${item.name}</h4>
                    <div class="stock-info">
                        <span class="stock-quantity ${isLowStock ? 'low' : ''} ${isOutOfStock ? 'empty' : ''}">${displayQuantity} ${displayUnit}s</span>
                    </div>
                </div>
                <div class="stock-status-container">
                    ${stockBadge}
                </div>
                <div class="stock-item-details">
                    ${item.description ? `<p class="stock-description">${item.description}</p>` : ''}
                    <div class="stock-meta">
                        <small>Estoque mínimo: ${item.minStock} unidades</small>
                        <small>Valor unitário: R$ ${item.unitValue.toFixed(2).replace('.', ',')}</small>
                        <small>Valor total para ${displayQuantity} unidades: R$ ${(item.quantity * item.unitValue).toFixed(2).replace('.', ',')}</small>
                        ${isLowStock && !isOutOfStock ? `<span class="stock-deficit">Faltam ${item.minStock - item.quantity} unidades para atingir o mínimo.</span>` : ''}
                    </div>
                </div>
                <div class="stock-item-actions">
                    <button class="btn-stock-add" onclick="adjustStock(${item.id}, 'add')">
                        <i class="fa-solid fa-plus"></i> Adicionar
                    </button>
                    <button class="btn-stock-remove" onclick="adjustStock(${item.id}, 'remove')" ${item.quantity === 0 ? 'disabled' : ''}>
                        <i class="fa-solid fa-minus"></i> Remover
                    </button>
                    <button class="btn-stock-delete" onclick="showDeleteStockItemConfirmation(${item.id})">
                        <i class="fa-solid fa-trash"></i> Excluir
                    </button>
                </div>
            `;
            
            itemsGrid.appendChild(itemCard);
        });
        
        categorySection.appendChild(itemsGrid);
        stockList.appendChild(categorySection);
    });
}

export function renderStockMovements(selectedMonthYear = null) {
    const stockMovements = document.getElementById('stock-movements');
    if (!stockMovements) return;

    // Only Director and Finance can view stock movements
    if (!isRoleAllowed(STOCK_MANAGERS)) {
        stockMovements.innerHTML = '<p>Você não tem permissão para visualizar movimentações de estoque.</p>';
        return;
    }
    
    stockMovements.innerHTML = '';
    
    let filteredMovements = db.stockMovements;
    
    // Filter by month if selectedMonthYear is provided
    if (selectedMonthYear) {
        const [targetYear, targetMonth] = selectedMonthYear.split('-').map(Number);
        filteredMovements = db.stockMovements.filter(movement => {
            const movementDate = new Date(movement.date);
            return movementDate.getMonth() === (targetMonth - 1) && movementDate.getFullYear() === targetYear;
        });
    }
    
    // Sort movements by date (newest first)
    const sortedMovements = [...filteredMovements].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate month summary
    let monthEntries = 0;
    let monthExits = 0;
    let monthEntriesValue = 0;
    let monthExitsValue = 0;
    
    filteredMovements.forEach(movement => {
        const movementValue = (movement.quantity || 0) * (movement.itemUnitValue || 0);
        if (movement.type === 'entrada') {
            monthEntries++;
            monthEntriesValue += movementValue;
        } else if (movement.type === 'saida') {
            monthExits++;
            monthExitsValue += movementValue;
        }
    });
    
    // Add month summary if filtering by month or if there are any movements to show a total summary
    if (selectedMonthYear || db.stockMovements.length > 0) {
        const summaryCard = document.createElement('div');
        summaryCard.className = 'stock-month-summary';
        
        const summaryTitle = selectedMonthYear ? 'Resumo do Período' : 'Resumo Geral';

        summaryCard.innerHTML = `
            <h4>${summaryTitle}</h4>
            <div class="summary-grid">
                <div class="summary-item entrada">
                    <span class="summary-label">📥 Entradas</span>
                    <span class="summary-count">${monthEntries} movimentações</span>
                    <span class="summary-value">R$ ${monthEntriesValue.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="summary-item saida">
                    <span class="summary-label">📤 Saídas</span>
                    <span class="summary-count">${monthExits} movimentações</span>
                    <span class="summary-value">R$ ${monthExitsValue.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="summary-item total">
                    <span class="summary-label">💰 Saldo Líquido</span>
                    <span class="summary-count">${monthEntries + monthExits} total</span>
                    <span class="summary-value">R$ ${(monthEntriesValue - monthExitsValue).toFixed(2).replace('.', ',')}</span>
                </div>
            </div>
        `;
        stockMovements.appendChild(summaryCard);
    }

    if (filteredMovements.length === 0) {
        if (selectedMonthYear) {
            stockMovements.innerHTML += '<p style="text-align: center; color: var(--text-muted); margin-top: 20px;">Nenhuma movimentação registrada para o período selecionado.</p>';
        } else {
            stockMovements.innerHTML += '<p style="text-align: center; color: var(--text-muted); margin-top: 20px;">Nenhuma movimentação registrada.</p>';
        }
        return;
    }
    
    const displayLimit = selectedMonthYear ? sortedMovements.length : 20;
    sortedMovements.slice(0, displayLimit).forEach(movement => { // Show all movements for selected month, last 20 for all
        const movementCard = document.createElement('div');
        movementCard.className = `stock-movement-card ${movement.type}`;
        
        // Display quantity correctly, assuming all quantities are now in 'unidade'
        const displayQuantity = movement.quantity;
        const displayUnit = 'unidade';
        const movementValue = (movement.quantity * (movement.itemUnitValue || 0)).toFixed(2).replace('.', ',');
        
        let typeText = '';
        let typeClass = '';
        let purchaseInfoHtml = '';

        if (movement.type === 'entrada') {
            typeText = '📥 Entrada';
            typeClass = 'entrada';
            // Show purchase info for entry movements if it exists
            if (movement.purchaseNotes || movement.purchaseFileData) {
                purchaseInfoHtml = `
                    <div class="purchase-info">
                        ${movement.purchaseNotes ? `<p class="purchase-notes"><strong>Notas da Compra:</strong> ${movement.purchaseNotes}</p>` : ''}
                        ${movement.purchaseFileData ? `<a href="${movement.purchaseFileData}" download="${movement.purchaseFileName}" class="btn-download-small"><i class="fa-solid fa-file-invoice-dollar"></i> Ver Comprovante</a>` : ''}
                    </div>
                `;
            }
        } else if (movement.type === 'saida') {
            typeText = '📤 Saída';
            typeClass = 'saida';
        } else if (movement.type === 'exclusao') {
            typeText = '🗑️ Exclusão';
            typeClass = 'exclusao'; // Add a new class for deletion movements
        }

        movementCard.innerHTML = `
            <div class="movement-info">
                <h5>${movement.itemName || 'Item removido'}</h5>
                <div class="movement-details">
                    <span class="movement-type ${typeClass}">${typeText}</span>
                    ${movement.type !== 'exclusao' ? `<span class="movement-quantity">${displayQuantity} ${displayUnit}s - R$ ${movementValue}</span>` : ''}
                </div>
                <p class="movement-reason">${movement.reason}</p>
                ${purchaseInfoHtml}
            </div>
            <div class="movement-meta">
                <div class="movement-date">${new Date(movement.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                <div class="movement-user">${movement.user}</div>
            </div>
        `;
        
        stockMovements.appendChild(movementCard);
    });
}

export function updateStockSummary() {
    // Only Director and Finance can view stock summary
    if (!isRoleAllowed(STOCK_MANAGERS)) {
        return;
    }

    const totalItems = db.stockItems.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = db.stockItems.filter(item => item.quantity > 0 && item.quantity <= item.minStock).length;
    const outOfStockItems = db.stockItems.filter(item => item.quantity === 0).length;
    const totalStockValue = db.stockItems.reduce((sum, item) => sum + (item.quantity * item.unitValue), 0);
    const totalCategories = new Set(db.stockItems.map(item => item.category)).size;

    const totalItemsElement = document.getElementById('total-items');
    const lowStockItemsElement = document.getElementById('low-stock-items');
    const totalStockValueElement = document.getElementById('total-stock-value');
    const totalCategoriesElement = document.getElementById('total-categories');
    const lowStockAlertCard = document.querySelector('.low-stock-alert-card');

    if (totalItemsElement) {
        totalItemsElement.textContent = totalItems;
    }
    
    if (lowStockItemsElement) {
        lowStockItemsElement.textContent = lowStockItems + outOfStockItems; // Count both low and out of stock
    }

    if (totalStockValueElement) {
        totalStockValueElement.textContent = `R$ ${totalStockValue.toFixed(2).replace('.', ',')}`;
    }

    if (totalCategoriesElement) {
        totalCategoriesElement.textContent = totalCategories;
    }
    
    // Update summary card colors based on stock status
    if (lowStockAlertCard) {
        if (lowStockItems + outOfStockItems > 0) {
            lowStockAlertCard.classList.add('warning-card');
        } else {
            lowStockAlertCard.classList.remove('warning-card');
        }
    }
}

export function adjustStock(itemId, action) {
    // Only Director and Finance can adjust stock
    if (!isRoleAllowed(STOCK_MANAGERS)) { 
        showNotification('Você não tem permissão para ajustar o estoque.', 'error'); 
        return; 
    }

    const item = db.stockItems.find(item => item.id === itemId);
    if (!item) return;
    
    // Store the current adjustment data globally
    window.currentStockAdjustment = { itemId, action };
    
    // Update modal content based on action and item
    const modal = document.getElementById('modal-adjust-stock');
    const title = document.getElementById('adjust-stock-title');
    const quantityLabel = document.getElementById('adjust-stock-quantity-label');
    const unitInfo = document.getElementById('adjust-stock-unit-info');
    const submitBtn = document.getElementById('adjust-stock-submit-btn');
    const quantityInput = document.getElementById('adjust-stock-quantity');
    
    if (action === 'add') {
        title.textContent = `Adicionar - ${item.name}`;
        submitBtn.textContent = 'Adicionar ao Estoque';
        submitBtn.className = 'btn-primary';
        quantityInput.min = '1';
    } else { // action === 'remove'
        title.textContent = `Remover - ${item.name}`;
        submitBtn.textContent = 'Remover do Estoque';
        submitBtn.className = 'btn-primary btn-danger'; // Use btn-danger for remove action
        quantityInput.min = '1';
    }
    
    quantityLabel.textContent = `Quantidade em unidades para ${action === 'add' ? 'adicionar' : 'remover'}`;
    unitInfo.textContent = `Disponível: ${item.quantity} unidades`; // Always show in units
    
    // Reset form and show modal
    document.getElementById('form-adjust-stock').reset();
    modal.style.display = 'flex';
}

export function showDeleteStockItemConfirmation(itemId) {
    // Only Director and Finance can delete stock items
    if (!isRoleAllowed(STOCK_MANAGERS)) { 
        showNotification('Você não tem permissão para excluir itens do estoque.', 'error'); 
        return; 
    }

    const itemToDelete = db.stockItems.find(item => item.id === itemId);
    if (!itemToDelete) {
        showNotification('Item não encontrado no estoque.', 'error');
        return;
    }

    // Store the item ID and type to be deleted globally for the confirmation handler
    window.currentDeleteItem = itemId;
    window.currentDeleteItemType = 'stock'; 

    const modal = document.getElementById('modal-confirm-delete');
    const message = document.getElementById('delete-confirmation-message');
    message.textContent = `Tem certeza que deseja excluir o item "${itemToDelete.name}" do estoque? Esta ação é irreversível e o item será removido permanentemente.`;
    
    modal.style.display = 'flex';
}

// Make functions globally available
window.adjustStock = adjustStock;
window.showDeleteStockItemConfirmation = showDeleteStockItemConfirmation;