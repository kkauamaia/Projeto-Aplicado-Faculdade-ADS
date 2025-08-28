document.addEventListener('DOMContentLoaded', () => {
    let donors = JSON.parse(localStorage.getItem('donors')) || [];
    let donations = JSON.parse(localStorage.getItem('donations')) || [];
    let charts = {};
    let currentRole = null; 
    let currentDonorId = null;
  
    const ADMIN_PASSWORD = 'admin'; 

    const loginView = document.getElementById('login-view');
    const appContainer = document.getElementById('app-container');
    const allViews = document.querySelectorAll('#app-container .view');

    const goToDonorBtn = document.getElementById('go-to-donor');
    const goToAdminBtn = document.getElementById('go-to-admin');
    const logoutBtn = document.getElementById('logout-btn');

    const donationForm = document.getElementById('donation-form');
    const donorForm = document.getElementById('donor-form');
    const editDonorForm = document.getElementById('edit-donor-form');

    const donationList = document.getElementById('donation-list');
    const pendingDonationList = document.getElementById('pending-donation-list');
    const donorList = document.getElementById('donor-list');

    const donorSelect = document.getElementById('donor-select');

    const monthSelector = document.getElementById('month-selector');
    const monthlyReportContent = document.getElementById('monthly-report-content');
    const itemsChartCanvas = document.getElementById('items-chart').getContext('2d');
    const timelineChartCanvas = document.getElementById('timeline-chart').getContext('2d');

    const editDonorModal = document.getElementById('edit-donor-modal');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const editDonorId = document.getElementById('edit-donor-id');
    const editDonorName = document.getElementById('edit-donor-name');
    const editDonorContact = document.getElementById('edit-donor-contact');

    const adminLoginModal = document.getElementById('admin-login-modal');
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminPasswordInput = document.getElementById('admin-password');
    const adminLoginError = document.getElementById('admin-login-error');
    const closeAdminModalBtn = adminLoginModal.querySelector('.close-modal-btn');

    const donorLoginSelect = document.getElementById('donor-login-select');
    const newDonorFormLogin = document.getElementById('new-donor-form-login');
    const donorLoginBtn = document.getElementById('donor-login-btn');
    const donorWelcomeTitle = document.getElementById('donor-welcome-title');
    const donorPledgeForm = document.getElementById('donor-pledge-form');
    const donorDonationList = document.getElementById('donor-donation-list');
    

    const switchView = (targetViewId) => {
        allViews.forEach(view => {
            view.classList.toggle('active', view.id === targetViewId);
            view.classList.toggle('hidden', view.id !== targetViewId);
        });
        document.querySelectorAll('#app-nav .nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === targetViewId);
        });

        if (currentRole === 'admin' && targetViewId === 'reports-view') {
            renderAllReports();
        }
    };

    const setupUIForRole = (role) => {
        loginView.classList.add('hidden');
        appContainer.classList.remove('hidden');
        currentRole = role;
        
        const nav = document.getElementById('app-nav');
        nav.innerHTML = '';

        if (role === 'admin') {
            nav.innerHTML = `
                <button class="nav-btn active" data-view="register-view">Painel</button>
                <button class="nav-btn" data-view="donors-view">Doadores</button>
                <button class="nav-btn" data-view="reports-view">Relatórios</button>
            `;
            switchView('register-view');
            renderPendingDonations();
            renderDonations(); 
        } else if (role === 'donor') {
            renderDonorLogin();
            switchView('donor-login-view');
        }

        nav.querySelectorAll('.nav-btn').forEach(button => {
            button.addEventListener('click', () => switchView(button.dataset.view));
        });
    };
    
    const logout = () => {
        currentRole = null;
        currentDonorId = null;
        appContainer.classList.add('hidden');
        loginView.classList.remove('hidden');
        loginView.classList.add('active');
        allViews.forEach(v => v.classList.add('hidden'));
    };

    const renderDonors = (isLogin = false) => {
        const selectElement = isLogin ? donorLoginSelect : donorSelect;
        
        if (!isLogin) donorList.innerHTML = '';
        selectElement.innerHTML = '<option value="">Selecione um doador</option>';

        if (donors.length === 0 && !isLogin) {
            donorList.innerHTML = '<li class="placeholder">Nenhum doador cadastrado.</li>';
        }
        
        donors.forEach(donor => {
            const donorOption = document.createElement('option');
            donorOption.value = donor.id;
            donorOption.textContent = donor.name;
            selectElement.appendChild(donorOption);

            if (!isLogin) {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <div>
                        <span class="item">${donor.name}</span><br>
                        <span class="donor">${donor.contact || 'Sem contato'}</span>
                    </div>
                    <div class="donor-actions">
                        <button class="edit-btn" data-id="${donor.id}" title="Editar Doador">✏️</button>
                        <button class="delete-btn" data-id="${donor.id}" title="Excluir Doador">🗑️</button>
                    </div>
                `;
                donorList.appendChild(listItem);
            }
        });
    };

    const renderDonations = () => { 
        donationList.innerHTML = '';
        const confirmedDonations = donations.filter(d => d.status === 'confirmed');
        
        if (confirmedDonations.length === 0) {
            donationList.innerHTML = '<li class="placeholder">Ainda não há doações confirmadas.</li>';
            return;
        }

        const recentDonations = [...confirmedDonations].reverse().slice(0, 10);

        recentDonations.forEach(donation => {
            const donor = donors.find(d => d.id === donation.donorId);
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <div>
                    <span class="item">${donation.item}</span> - 
                    <span class="quantity">${donation.quantity}</span><br>
                    <span class="donor">Doado por: ${donor ? donor.name : 'Doador desconhecido'}</span>
                </div>
                <span class="donor">${new Date(donation.date).toLocaleDateString()}</span>
            `;
            donationList.appendChild(listItem);
        });
    };
    
    const renderPendingDonations = () => {
        pendingDonationList.innerHTML = '';
        const pending = donations.filter(d => d.status === 'pending');

        if (pending.length === 0) {
            pendingDonationList.innerHTML = '<li class="placeholder">Nenhuma doação pendente.</li>';
            return;
        }

        pending.forEach(donation => {
            const donor = donors.find(d => d.id === donation.donorId);
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <span class="item">${donation.quantity} ${donation.item}</span><br>
                    <span class="donor">Enviado por: ${donor ? donor.name : 'Desconhecido'} em ${new Date(donation.date).toLocaleDateString()}</span>
                </div>
                <div class="donation-actions">
                    <button class="confirm-btn" data-id="${donation.id}">Confirmar</button>
                </div>
            `;
            pendingDonationList.appendChild(li);
        });
    };
    
    const getConfirmedDonations = () => donations.filter(d => d.status === 'confirmed');

    const renderAllReports = () => {
        renderItemsChart();
        renderTimelineChart();
        renderMonthlyReport();
    };

    const renderItemsChart = () => {
        const confirmed = getConfirmedDonations();
        const itemCounts = confirmed.reduce((acc, donation) => {
            acc[donation.item] = (acc[donation.item] || 0) + parseInt(donation.quantity, 10);
            return acc;
        }, {});
        
        if (charts.items) charts.items.destroy();
        charts.items = new Chart(itemsChartCanvas, {
            type: 'bar',
            data: {
                labels: Object.keys(itemCounts),
                datasets: [{
                    label: 'Total de Itens Doados (Confirmados)',
                    data: Object.values(itemCounts),
                    backgroundColor: 'rgba(255, 159, 64, 0.6)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }]
            },
            options: { scales: { y: { beginAtZero: true } }, responsive: true }
        });
    };

    const renderTimelineChart = () => {
        const confirmed = getConfirmedDonations();
        const donationsByMonth = confirmed.reduce((acc, donation) => {
            const month = new Date(donation.date).toISOString().slice(0, 7);
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {});
        
        const sortedMonths = Object.keys(donationsByMonth).sort();
        const chartData = sortedMonths.map(month => donationsByMonth[month]);

        if (charts.timeline) charts.timeline.destroy();
        charts.timeline = new Chart(timelineChartCanvas, {
            type: 'line',
            data: {
                labels: sortedMonths,
                datasets: [{
                    label: 'Número de Doações por Mês (Confirmadas)',
                    data: chartData,
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: { responsive: true }
        });
    };

    const renderMonthlyReport = () => {
        const selectedMonth = monthSelector.value;
        if (!selectedMonth) {
            monthlyReportContent.innerHTML = '<p>Selecione um mês para ver o relatório detalhado.</p>';
            return;
        }

        const filteredDonations = getConfirmedDonations().filter(d => d.date.startsWith(selectedMonth));

        if (filteredDonations.length === 0) {
            monthlyReportContent.innerHTML = '<p>Nenhuma doação confirmada para este mês.</p>';
            return;
        }

        let reportHTML = '<ul>';
        filteredDonations.forEach(donation => {
            const donor = donors.find(d => d.id === donation.donorId);
            reportHTML += `<li><strong>${donation.quantity} ${donation.item}</strong> doado por ${donor ? donor.name : 'desconhecido'} em ${new Date(donation.date).toLocaleDateString()}.</li>`;
        });
        reportHTML += '</ul>';
        monthlyReportContent.innerHTML = reportHTML;
    };

    const openEditModal = (donorId) => {
        const donor = donors.find(d => d.id === donorId);
        if (donor) {
            editDonorId.value = donor.id;
            editDonorName.value = donor.name;
            editDonorContact.value = donor.contact;
            editDonorModal.classList.remove('hidden');
        }
    };

    const closeEditModal = () => {
        editDonorModal.classList.add('hidden');
    };
    
    const saveState = () => {
        localStorage.setItem('donors', JSON.stringify(donors));
        localStorage.setItem('donations', JSON.stringify(donations));
    };

    const addDonor = (name, contact) => {
        const newDonor = { id: crypto.randomUUID(), name, contact };
        donors.push(newDonor);
        saveState();
        renderDonors();
        if (currentRole === 'donor') renderDonors(true);
        return newDonor;
    };

    const deleteDonor = (donorId) => {
        if (confirm('Tem certeza que deseja excluir este doador? Todas as suas doações (pendentes e confirmadas) também serão removidas.')) {
            donors = donors.filter(d => d.id !== donorId);
            donations = donations.filter(d => d.donorId !== donorId);
            saveState();
            renderDonors();
            renderDonations();
            renderPendingDonations();
        }
    };

    const updateDonor = (donorId, newName, newContact) => {
        const donorIndex = donors.findIndex(d => d.id === donorId);
        if (donorIndex > -1) {
            donors[donorIndex].name = newName;
            donors[donorIndex].contact = newContact;
            saveState();
            renderDonors();
            renderDonations();
        }
    };

    const confirmDonation = (donationId) => {
        const donation = donations.find(d => d.id === donationId);
        if(donation) {
            donation.status = 'confirmed';
            saveState();
            renderPendingDonations();
            renderDonations();
        }
    };

    const renderDonorLogin = () => {
        renderDonors(true); 
    };

    const loginAsDonor = (donorId) => {
        currentDonorId = donorId;
        const donor = donors.find(d => d.id === currentDonorId);
        
        const nav = document.getElementById('app-nav');
        nav.innerHTML = `<button class="nav-btn active" data-view="donor-dashboard-view">Minhas Doações</button>`;
        nav.querySelector('.nav-btn').addEventListener('click', () => switchView('donor-dashboard-view'));

        donorWelcomeTitle.textContent = `Olá, ${donor.name}! Faça uma doação`;
        renderDonorDashboard();
        switchView('donor-dashboard-view');
    };
    
    const renderDonorDashboard = () => {
        donorDonationList.innerHTML = '';
        const myDonations = donations.filter(d => d.donorId === currentDonorId).reverse();
        
        if (myDonations.length === 0) {
            donorDonationList.innerHTML = '<li class="placeholder">Você ainda não fez doações.</li>';
            return;
        }

        myDonations.forEach(d => {
            const li = document.createElement('li');
            li.classList.add(d.status === 'pending' ? 'status-pending' : 'status-confirmed');
            li.innerHTML = `
                <div>
                    <span class="item">${d.quantity} ${d.item}</span><br>
                    <span class="donor">Enviado em: ${new Date(d.date).toLocaleDateString()}</span>
                </div>
                <strong>${d.status === 'pending' ? 'Pendente' : 'Confirmada'}</strong>
            `;
            donorDonationList.appendChild(li);
        });
    };

    goToAdminBtn.addEventListener('click', () => {
        adminLoginModal.classList.remove('hidden');
        adminPasswordInput.focus();
    });
    goToDonorBtn.addEventListener('click', () => setupUIForRole('donor'));
    logoutBtn.addEventListener('click', logout);
    
    donorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addDonor(
            document.getElementById('donor-name').value,
            document.getElementById('donor-contact').value
        );
        donorForm.reset();
    });

    donationForm.addEventListener('submit', (e) => { 
        e.preventDefault();
        donations.push({
            id: crypto.randomUUID(),
            donorId: donorSelect.value,
            item: document.getElementById('food-item').value,
            quantity: document.getElementById('quantity').value,
            date: new Date().toISOString(),
            status: 'confirmed' 
        });
        saveState();
        renderDonations();
        donationForm.reset();
    });
    
    monthSelector.addEventListener('change', renderMonthlyReport);

    document.body.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        if (button.closest('#donor-list')) {
            const donorId = button.dataset.id;
            if (button.classList.contains('delete-btn')) deleteDonor(donorId);
            if (button.classList.contains('edit-btn')) openEditModal(donorId);
            return;
        }
        
        if (button.closest('#pending-donation-list')) {
            if (button.classList.contains('confirm-btn')) {
                confirmDonation(button.dataset.id);
            }
            return;
        }
    });

 
    donorLoginBtn.addEventListener('click', () => {
        if(donorLoginSelect.value) {
            loginAsDonor(donorLoginSelect.value);
        } else {
            alert('Por favor, selecione um doador.');
        }
    });

    newDonorFormLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = document.getElementById('new-donor-name-login').value;
        if(newName) {
            const newDonor = addDonor(newName, '');
            newDonorFormLogin.reset();
            loginAsDonor(newDonor.id);
        }
    });

    donorPledgeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        donations.push({
            id: crypto.randomUUID(),
            donorId: currentDonorId,
            item: document.getElementById('donor-food-item').value,
            quantity: document.getElementById('donor-quantity').value,
            date: new Date().toISOString(),
            status: 'pending'
        });
        saveState();
        renderDonorDashboard();
        donorPledgeForm.reset();
    });

    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (adminPasswordInput.value === ADMIN_PASSWORD) {
            adminLoginModal.classList.add('hidden');
            adminPasswordInput.value = '';
            adminLoginError.classList.add('hidden');
            setupUIForRole('admin');
        } else {
            adminLoginError.classList.remove('hidden');
            adminPasswordInput.value = '';
        }
    });

    const closeAdminLoginModal = () => {
        adminLoginModal.classList.add('hidden');
        adminPasswordInput.value = '';
        adminLoginError.classList.add('hidden');
    };

    closeAdminModalBtn.addEventListener('click', closeAdminLoginModal);

    editDonorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updateDonor(editDonorId.value, editDonorName.value, editDonorContact.value);
        closeEditModal();
    });

    closeModalBtn.addEventListener('click', closeEditModal);

    window.addEventListener('click', (e) => {
        if (e.target === editDonorModal) closeEditModal();
        if (e.target === adminLoginModal) closeAdminLoginModal();
    });

    const initialize = () => {
        const today = new Date().toISOString().slice(0, 7);
        monthSelector.value = today;
    };

    initialize();
});