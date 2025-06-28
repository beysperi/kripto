document.addEventListener('DOMContentLoaded', function () {
    // Game state
    const gameState = {
        day: 1,
        money: 10000,
        products: [],
        staff: {
            sales: 0,
            support: 0,
            warehouse: 0
        },
        platforms: {
            own: { active: false, commission: 0, monthlyFee: 300, visitors: 30, conversionRate: 0.02 },
            ecom1: { active: false, commission: 0.10, monthlyFee: 0, visitors: 200, conversionRate: 0.03 },
            ecom2: { active: false, commission: 0.15, monthlyFee: 0, visitors: 300, conversionRate: 0.04 }
        },
        events: [],
        dailyStats: {
            sales: 0,
            expenses: 0,
            profit: 0,
            itemsSold: 0
        },
        viralBoost: 0,
        viralMultiplier: 1.5,
        competitorPenalty: 0,
        competitorMultiplier: 0.7,
        competitorDefense: 0,
        activeCampaigns: [],
        totalRevenue: 0,
        totalOrders: 0,
        salesHistory: [],
        productSales: {},
        platformSales: {},
        seoBoost: false,
        randomEvents: [
            {
                title: "🎯 Tedarikçi İndirimi",
                text: "Tedarikçiniz size özel indirim teklif ediyor. 2500₺ karşılığında 3500₺ değerinde stok alabilirsiniz!",
                accept: function () {
                    if (gameState.money >= 2500 && gameState.products.length > 0) {
                        gameState.money -= 2500;
                        const randomProduct = gameState.products[Math.floor(Math.random() * gameState.products.length)];
                        const stockAmount = Math.floor(3500 / randomProduct.cost);
                        randomProduct.stock += stockAmount;
                        addEvent(`Tedarikçi indirimi kabul ettiniz. ${randomProduct.name} ürününe ${stockAmount} adet stok eklendi.`);
                        showNotification('success', 'Tedarikçi İndirimi', `${stockAmount} adet ${randomProduct.name} stoğu eklendi!`);
                    } else {
                        showNotification('error', 'Yetersiz Bakiye', 'Bu fırsatı değerlendirmek için yeterli paranız yok.');
                    }
                },
                decline: function () {
                    addEvent('Tedarikçi indirim teklifini reddettiniz.');
                }
            },
            {
                title: "🚀 Viral Ürün Fırsatı",
                text: "Ürünlerinizden biri viral olma potansiyeli gösteriyor! 1500₺ pazarlama yatırımı ile 3 gün boyunca %50 satış artışı sağlayabilirsiniz.",
                probability: 1,
                accept: function () {
                    if (gameState.money >= 1500) {
                        gameState.money -= 1500;
                        gameState.viralBoost = 3;
                        gameState.viralMultiplier = 1.5;
                        addEvent('Viral pazarlama kampanyasını başlattınız! 3 gün boyunca %50 satış artışı.');
                        showNotification('success', 'Viral Kampanya', '3 gün boyunca %50 satış artışı aktif!');
                    } else {
                        showNotification('error', 'Yetersiz Bakiye', 'Viral kampanya için yeterli paranız yok.');
                    }
                },
                decline: function () {
                    addEvent('Viral pazarlama fırsatını kaçırdınız.');
                }
            },
            {
                title: "😤 Müşteri Şikayeti",
                text: "Bir müşteri ürününden memnun kalmamış ve sosyal medyada şikayet ediyor. 800₺ iade ile sorunu çözebilir ve müşteri memnuniyetini artırabilirsiniz.",
                probability: 1,
                accept: function () {
                    if (gameState.money >= 800) {
                        gameState.money -= 800;
                        // Increase customer satisfaction (small sales boost for next few days)
                        gameState.customerSatisfactionBoost = 2;
                        addEvent('Müşteri şikayetini çözdünüz. Müşteri memnuniyeti arttı.');
                        showNotification('success', 'Müşteri Memnuniyeti', 'Şikayet çözüldü, memnuniyet arttı!');
                    } else {
                        showNotification('error', 'Yetersiz Bakiye', 'İade için yeterli paranız yok.');
                    }
                },
                decline: function () {
                    addEvent('Müşteri şikayetini görmezden geldiniz. Bu durum satışları olumsuz etkileyebilir.');
                    showNotification('warning', 'Müşteri Şikayeti', 'Çözülmeyen şikayet satışları etkileyebilir.');
                }
            },
            {
                title: "⚔️ Rakip Kampanya",
                text: "Rakipleriniz agresif bir indirim kampanyası başlattı! 1200₺ savunma kampanyası ile etkisini azaltabilirsiniz.",
                probability: 1,
                accept: function () {
                    if (gameState.money >= 1200) {
                        gameState.money -= 1200;
                        gameState.competitorDefense = 3;
                        addEvent('Rakip kampanyasına karşı savunma kampanyası başlattınız.');
                        showNotification('success', 'Savunma Kampanyası', 'Rakip etkisine karşı korunuyorsunuz!');
                    } else {
                        showNotification('error', 'Yetersiz Bakiye', 'Savunma kampanyası için yeterli paranız yok.');
                        // Apply competitor penalty anyway
                        gameState.competitorPenalty = 3;
                        addEvent('Rakip kampanyasına karşı koyamadınız. 3 gün boyunca satışlar %30 azalacak.');
                    }
                },
                decline: function () {
                    gameState.competitorPenalty = 3;
                    addEvent('Rakip kampanyasını görmezden geldiniz. 3 gün boyunca satışlar %30 azalacak.');
                    showNotification('warning', 'Rakip Kampanya', '3 gün boyunca satışlar %30 azalacak!');
                }
            },
            {
                title: "💰 Toplu Sipariş",
                text: "Büyük bir şirket toplu sipariş vermek istiyor! Anında 2500₺ kazanç elde edebilirsiniz.",
                accept: function () {
                    // Check if there's enough stock
                    const totalStock = gameState.products.reduce((sum, p) => sum + p.stock, 0);
                    if (totalStock >= 10) {
                        gameState.money += 2500;
                        gameState.totalRevenue += 2500;
                        gameState.totalOrders += 1;
                        // Remove some stock randomly
                        let stockToRemove = 10;
                        while (stockToRemove > 0 && gameState.products.some(p => p.stock > 0)) {
                            const availableProducts = gameState.products.filter(p => p.stock > 0);
                            const randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
                            const productIndex = gameState.products.findIndex(p => p === randomProduct);
                            gameState.products[productIndex].stock--;
                            stockToRemove--;
                        }
                        addEvent('Toplu siparişi tamamladınız! 2500₺ kazanç elde ettiniz.');
                        showNotification('success', 'Toplu Sipariş', '2500₺ kazanç elde ettiniz!');
                    } else {
                        showNotification('error', 'Yetersiz Stok', 'Toplu sipariş için yeterli stoğunuz yok (min 10 adet).');
                    }
                },
                decline: function () {
                    addEvent('Toplu sipariş fırsatını kaçırdınız.');
                }
            },
            {
                title: "🎁 Hediye Kampanyası",
                text: "Müşterilerinize hediye kampanyası düzenlemek ister misiniz? 1000₺ harcayarak 3 gün boyunca %25 satış artışı sağlayabilirsiniz.",
                accept: function () {
                    if (gameState.money >= 1000) {
                        gameState.money -= 1000;
                        gameState.activeCampaigns.push({
                            type: 'gift',
                            name: 'Hediye Kampanyası',
                            description: 'Müşterilere özel hediye kampanyası',
                            effect: '+25% satış',
                            multiplier: 1.25,
                            remainingDays: 3,
                            totalDays: 3
                        });
                        addEvent('Hediye kampanyasını başlattınız! 3 gün boyunca %25 satış artışı.');
                        showNotification('success', 'Hediye Kampanyası', '3 gün boyunca %25 satış artışı aktif!');
                    } else {
                        showNotification('error', 'Yetersiz Bakiye', 'Hediye kampanyası için yeterli paranız yok.');
                    }
                },
                decline: function () {
                    addEvent('Hediye kampanyası fırsatını kaçırdınız.');
                }
            },
            {
                title: "📱 Teknoloji Yeniliği",
                text: "Yeni bir teknoloji çözümü işinizi hızlandırabilir. 1800₺ yatırım yaparak kalıcı olarak %15 daha fazla sipariş işleyebilirsiniz.",
                accept: function () {
                    if (gameState.money >= 1800) {
                        gameState.money -= 1800;
                        // Add permanent tech boost
                        if (!gameState.techBoost) gameState.techBoost = 1;
                        gameState.techBoost *= 1.15;
                        addEvent('Teknoloji yeniliğini kabul ettiniz! Kalıcı %15 sipariş artışı.');
                        showNotification('success', 'Teknoloji Yeniliği', 'Kalıcı %15 sipariş artışı aktif!');
                    } else {
                        showNotification('error', 'Yetersiz Bakiye', 'Teknoloji yeniliği için yeterli paranız yok.');
                    }
                },
                decline: function () {
                    addEvent('Teknoloji yeniliği fırsatını kaçırdınız.');
                }
            },
            {
                title: "🌟 Ünlü Müşteri",
                text: "Ünlü bir kişi ürününüzü beğendi ve sosyal medyada paylaştı! Bu bedava reklam 5 gün boyunca %40 satış artışı sağlayacak.",
                accept: function () {
                    gameState.activeCampaigns.push({
                        type: 'celebrity',
                        name: 'Ünlü Müşteri Etkisi',
                        description: 'Ünlü müşterinin sosyal medya paylaşımı',
                        effect: '+40% satış',
                        multiplier: 1.4,
                        remainingDays: 5,
                        totalDays: 5
                    });
                    addEvent('Ünlü müşteri etkisi başladı! 5 gün boyunca %40 satış artışı.');
                    showNotification('success', 'Ünlü Müşteri', '5 gün boyunca %40 satış artışı aktif!');
                },
                decline: function () {
                    addEvent('Ünlü müşteri etkisini görmezden geldiniz.');
                }
            }
        ]
    };

    // Utility functions
    function formatMoney(amount) {
        return '₺' + amount.toLocaleString('tr-TR');
    }

    function showNotification(type, title, message) {
        const notificationArea = document.getElementById('notification-area');
        const notification = document.createElement('div');

        const colors = {
            success: 'bg-green-100 border-green-500 text-green-700',
            error: 'bg-red-100 border-red-500 text-red-700',
            warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
            info: 'bg-blue-100 border-blue-500 text-blue-700'
        };

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        notification.className = `notification ${colors[type]} border-l-4 p-4 rounded-lg shadow-lg mb-2`;
        notification.innerHTML = `
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="fas ${icons[type]}"></i>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium">${title}</p>
              <p class="text-xs mt-1">${message}</p>
            </div>
          </div>
        `;

        notificationArea.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    function addEvent(text) {
        gameState.events.unshift({
            text: text,
            day: gameState.day
        });
        updateEventsDisplay();
    }

    function updateDisplay() {
        // Update header
        document.getElementById('day-counter').textContent = gameState.day;
        document.getElementById('money-display').textContent = formatMoney(gameState.money);

        // Update progress
        const progress = Math.min((gameState.money / 100000) * 100, 100);
        document.getElementById('progress-percentage').textContent = Math.floor(progress);
        document.getElementById('progress-bar').style.width = progress + '%';

        // Update dashboard stats
        document.getElementById('daily-sales').textContent = formatMoney(gameState.dailyStats.sales);
        document.getElementById('daily-expenses').textContent = formatMoney(gameState.dailyStats.expenses);
        document.getElementById('daily-profit').textContent = formatMoney(gameState.dailyStats.profit);
        document.getElementById('daily-items-sold').textContent = gameState.dailyStats.itemsSold + ' adet';

        // Update business stats
        const totalStaff = gameState.staff.sales + gameState.staff.support + gameState.staff.warehouse;
        const staffExpense = (gameState.staff.sales * 5000) + (gameState.staff.support * 4000) + (gameState.staff.warehouse * 3500);
        const activePlatforms = Object.values(gameState.platforms).filter(p => p.active).length;

        document.getElementById('staff-count').textContent = totalStaff;
        document.getElementById('staff-expense').textContent = formatMoney(staffExpense) + '/ay';
        document.getElementById('active-platforms').textContent = activePlatforms;

        // Update inventory stats
        const totalProducts = gameState.products.length;
        const totalStock = gameState.products.reduce((sum, p) => sum + p.stock, 0);
        const stockValue = gameState.products.reduce((sum, p) => sum + (p.stock * p.cost), 0);

        document.getElementById('total-products').textContent = totalProducts;
        document.getElementById('total-stock').textContent = totalStock + ' adet';
        document.getElementById('stock-value').textContent = formatMoney(stockValue);

        // Update staff counts
        document.getElementById('sales-staff-count').textContent = gameState.staff.sales;
        document.getElementById('support-staff-count').textContent = gameState.staff.support;
        document.getElementById('warehouse-staff-count').textContent = gameState.staff.warehouse;
    }

    function updateEventsDisplay() {
        const container = document.getElementById('events-container');
        container.innerHTML = '';

        gameState.events.slice(0, 10).forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'p-3 bg-blue-50 border-l-4 border-blue-500 rounded';
            eventDiv.innerHTML = `
            <p class="text-sm text-gray-700">${event.text}</p>
            <span class="text-xs text-gray-500">Gün ${event.day}</span>
          `;
            container.appendChild(eventDiv);
        });
    }

    function updateProductsDisplay() {
        const container = document.getElementById('products-container');
        const emptyState = document.getElementById('empty-products');

        if (gameState.products.length === 0) {
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';

        // Clear existing products except empty state
        const productCards = container.querySelectorAll('.product-card');
        productCards.forEach(card => card.remove());

        gameState.products.forEach((product, index) => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow';

            const categoryIcons = {
                electronics: 'fa-laptop',
                clothing: 'fa-tshirt',
                home: 'fa-home',
                beauty: 'fa-spa',
                other: 'fa-box'
            };

            const stockStatus = product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-yellow-600' : 'text-green-600';

            productCard.innerHTML = `
            <div class="flex items-center mb-3">
              <div class="rounded-full bg-indigo-100 p-2 mr-3">
                <i class="fas ${categoryIcons[product.category]} text-indigo-600"></i>
              </div>
              <div class="flex-grow">
                <h4 class="font-medium text-gray-800">${product.name}</h4>
                <p class="text-xs text-gray-500 capitalize">${product.category}</p>
              </div>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Stok:</span>
                <span class="${stockStatus} font-medium">${product.stock} adet</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Alış:</span>
                <span class="font-medium">${formatMoney(product.cost)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Satış:</span>
                <span class="font-medium">${formatMoney(product.price)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Kar:</span>
                <span class="font-medium text-green-600">${formatMoney(product.price - product.cost)}</span>
              </div>
            </div>
            <div class="mt-4 flex space-x-2">
              <button class="add-stock-to-product flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs" data-index="${index}">
                <i class="fas fa-plus mr-1"></i> Stok Ekle
              </button>
              <button class="delete-product bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs" data-index="${index}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `;

            container.appendChild(productCard);
        });

        // Add event listeners for product actions using event delegation
        container.addEventListener('click', function (e) {
            if (e.target.classList.contains('add-stock-to-product') || e.target.closest('.add-stock-to-product')) {
                const btn = e.target.classList.contains('add-stock-to-product') ? e.target : e.target.closest('.add-stock-to-product');
                const index = parseInt(btn.dataset.index);
                const amount = prompt('Kaç adet stok eklemek istiyorsunuz?', '10');
                if (amount && !isNaN(amount) && parseInt(amount) > 0) {
                    const cost = gameState.products[index].cost * parseInt(amount);
                    if (gameState.money >= cost) {
                        gameState.money -= cost;
                        gameState.products[index].stock += parseInt(amount);
                        gameState.dailyStats.expenses += cost;
                        showNotification('success', 'Stok Eklendi', `${gameState.products[index].name} ürününe ${amount} adet stok eklendi.`);
                        addEvent(`${gameState.products[index].name} ürününe ${amount} adet stok eklediniz (${formatMoney(cost)}).`);
                        updateDisplay();
                        updateProductsDisplay();
                        updateInventoryDisplay();
                    } else {
                        showNotification('error', 'Yetersiz Bakiye', 'Stok eklemek için yeterli paranız yok.');
                    }
                }
            }

            if (e.target.classList.contains('delete-product') || e.target.closest('.delete-product')) {
                const btn = e.target.classList.contains('delete-product') ? e.target : e.target.closest('.delete-product');
                const index = parseInt(btn.dataset.index);
                if (confirm(`${gameState.products[index].name} ürününü silmek istediğinizden emin misiniz?`)) {
                    const deletedProduct = gameState.products.splice(index, 1)[0];
                    showNotification('info', 'Ürün Silindi', `${deletedProduct.name} ürünü silindi.`);
                    addEvent(`${deletedProduct.name} ürününü sattığınız ürünler listesinden çıkardınız.`);
                    updateDisplay();
                    updateProductsDisplay();
                    updateInventoryDisplay();
                }
            }
        });
    }

    function updateInventoryDisplay() {
        const tbody = document.getElementById('inventory-table-body');

        if (gameState.products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Henüz stok bulunmuyor. Ürün ekleyip stok girişi yapın.</td></tr>';
            return;
        }

        tbody.innerHTML = '';

        gameState.products.forEach((product, index) => {
            const row = document.createElement('tr');
            const stockStatus = product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-yellow-600' : 'text-green-600';

            row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">${product.name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900 capitalize">${product.category}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm ${stockStatus} font-medium">${product.stock} adet</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">${formatMoney(product.cost)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">${formatMoney(product.price)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button class="add-stock-inventory text-indigo-600 hover:text-indigo-900 mr-3" data-index="${index}">
                <i class="fas fa-plus mr-1"></i> Stok Ekle
              </button>
              <button class="edit-product text-blue-600 hover:text-blue-900" data-index="${index}">
                <i class="fas fa-edit mr-1"></i> Düzenle
              </button>
            </td>
          `;

            tbody.appendChild(row);
        });

        // Add event listeners for inventory actions using event delegation
        tbody.addEventListener('click', function (e) {
            if (e.target.classList.contains('add-stock-inventory') || e.target.closest('.add-stock-inventory')) {
                const btn = e.target.classList.contains('add-stock-inventory') ? e.target : e.target.closest('.add-stock-inventory');
                const index = parseInt(btn.dataset.index);
                const amount = prompt('Kaç adet stok eklemek istiyorsunuz?', '10');
                if (amount && !isNaN(amount) && parseInt(amount) > 0) {
                    const cost = gameState.products[index].cost * parseInt(amount);
                    if (gameState.money >= cost) {
                        gameState.money -= cost;
                        gameState.products[index].stock += parseInt(amount);
                        gameState.dailyStats.expenses += cost;
                        showNotification('success', 'Stok Eklendi', `${gameState.products[index].name} ürününe ${amount} adet stok eklendi.`);
                        addEvent(`${gameState.products[index].name} ürününe ${amount} adet stok eklediniz (${formatMoney(cost)}).`);
                        updateDisplay();
                        updateProductsDisplay();
                        updateInventoryDisplay();
                    } else {
                        showNotification('error', 'Yetersiz Bakiye', 'Stok eklemek için yeterli paranız yok.');
                    }
                }
            }

            if (e.target.classList.contains('edit-product') || e.target.closest('.edit-product')) {
                const btn = e.target.classList.contains('edit-product') ? e.target : e.target.closest('.edit-product');
                const index = parseInt(btn.dataset.index);
                const product = gameState.products[index];
                const newPrice = prompt(`${product.name} için yeni satış fiyatı:`, product.price);
                if (newPrice && !isNaN(newPrice) && parseInt(newPrice) > 0) {
                    const oldPrice = product.price;
                    product.price = parseInt(newPrice);
                    showNotification('success', 'Fiyat Güncellendi', `${product.name} fiyatı ${formatMoney(oldPrice)} → ${formatMoney(product.price)} olarak güncellendi.`);
                    addEvent(`${product.name} ürününün satış fiyatını ${formatMoney(product.price)} olarak güncellediniz.`);
                    updateDisplay();
                    updateProductsDisplay();
                    updateInventoryDisplay();
                }
            }
        });
    }

    function updateActiveCampaigns() {
        const container = document.getElementById('active-campaigns');

        if (gameState.activeCampaigns.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">Henüz aktif kampanya bulunmuyor</p>';
            return;
        }

        container.innerHTML = '';
        gameState.activeCampaigns.forEach((campaign, index) => {
            const campaignDiv = document.createElement('div');
            campaignDiv.className = 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4';
            campaignDiv.innerHTML = `
            <div class="flex justify-between items-center">
              <div>
                <h4 class="font-medium text-gray-800">${campaign.name}</h4>
                <p class="text-sm text-gray-600">${campaign.description}</p>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium text-blue-600">${campaign.remainingDays} gün kaldı</div>
                <div class="text-xs text-gray-500">${campaign.effect}</div>
              </div>
            </div>
          `;
            container.appendChild(campaignDiv);
        });
    }

    function startMarketingCampaign(type) {
        const campaigns = {
            social: { name: 'Sosyal Medya Kampanyası', cost: 2000, duration: 5, effect: '+30% satış', multiplier: 1.3, description: 'Sosyal medyada viral içerik paylaşımı' },
            google: { name: 'Google Reklamları', cost: 3500, duration: 7, effect: '+50% ziyaretçi', multiplier: 1.5, description: 'Arama motorlarında üst sıralarda görünüm' },
            influencer: { name: 'Influencer İşbirliği', cost: 5000, duration: 3, effect: '+80% satış', multiplier: 1.8, description: 'Ünlü influencer ile ürün tanıtımı' },
            email: { name: 'E-posta Pazarlama', cost: 800, duration: 10, effect: '+15% satış', multiplier: 1.15, description: 'Müşteri listesine özel kampanya e-postaları' },
            seo: { name: 'SEO Optimizasyonu', cost: 4000, duration: -1, effect: '+25% organik trafik', multiplier: 1.25, description: 'Web sitesi arama motoru optimizasyonu' },
            content: { name: 'İçerik Pazarlama', cost: 1500, duration: 14, effect: '+20% marka bilinirliği', multiplier: 1.2, description: 'Blog yazıları ve değerli içerik üretimi' }
        };

        const campaign = campaigns[type];

        if (gameState.money < campaign.cost) {
            showNotification('error', 'Yetersiz Bakiye', `Bu kampanya için ${formatMoney(campaign.cost)} gerekli.`);
            return;
        }

        // Check if SEO is already active
        if (type === 'seo' && gameState.seoBoost) {
            showNotification('warning', 'SEO Aktif', 'SEO optimizasyonu zaten aktif durumda.');
            return;
        }

        gameState.money -= campaign.cost;
        gameState.dailyStats.expenses += campaign.cost;

        if (type === 'seo') {
            gameState.seoBoost = true;
            showNotification('success', 'SEO Başlatıldı', 'SEO optimizasyonu kalıcı olarak aktifleştirildi!');
            addEvent(`SEO optimizasyonu başlatıldı. Artık organik trafiğiniz %25 daha fazla.`);
        } else {
            gameState.activeCampaigns.push({
                type: type,
                name: campaign.name,
                description: campaign.description,
                effect: campaign.effect,
                multiplier: campaign.multiplier,
                remainingDays: campaign.duration,
                totalDays: campaign.duration
            });

            showNotification('success', 'Kampanya Başlatıldı', `${campaign.name} başarıyla başlatıldı!`);
            addEvent(`${campaign.name} kampanyasını başlattınız (${formatMoney(campaign.cost)}).`);
        }

        updateDisplay();
        updateActiveCampaigns();
    }

    function updateAnalytics() {
        // Update key metrics
        document.getElementById('total-revenue').textContent = formatMoney(gameState.totalRevenue);
        document.getElementById('total-profit').textContent = formatMoney(gameState.totalRevenue - (gameState.totalRevenue * 0.3)); // Rough profit calculation
        document.getElementById('total-orders').textContent = gameState.totalOrders;
        document.getElementById('avg-order-value').textContent = gameState.totalOrders > 0 ? formatMoney(Math.floor(gameState.totalRevenue / gameState.totalOrders)) : '₺0';

        // Update financial overview
        document.getElementById('cash-amount').textContent = formatMoney(gameState.money);
        const inventoryValue = gameState.products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
        document.getElementById('inventory-value').textContent = formatMoney(inventoryValue);
        const monthlyExpenses = (gameState.staff.sales * 5000) + (gameState.staff.support * 4000) + (gameState.staff.warehouse * 3500);
        document.getElementById('monthly-expenses').textContent = formatMoney(monthlyExpenses);
        document.getElementById('net-worth').textContent = formatMoney(gameState.money + inventoryValue);

        // Update sales chart
        updateSalesChart();

        // Update product performance
        updateProductPerformance();

        // Update platform performance
        updatePlatformPerformance();
    }

    function updateSalesChart() {
        const chartContainer = document.getElementById('sales-chart');
        chartContainer.innerHTML = '';

        const maxDays = Math.min(gameState.salesHistory.length, 14);
        const maxSales = Math.max(...gameState.salesHistory.slice(-maxDays).map(day => day.sales), 1);

        if (maxDays === 0) {
            chartContainer.innerHTML = '<p class="text-gray-500 text-center w-full">Henüz satış verisi bulunmuyor</p>';
            return;
        }

        gameState.salesHistory.slice(-maxDays).forEach((day, index) => {
            const height = (day.sales / maxSales) * 200;
            const bar = document.createElement('div');
            bar.className = 'bg-gradient-to-t from-blue-500 to-blue-300 rounded-t flex-1 relative group cursor-pointer';
            bar.style.height = height + 'px';
            bar.innerHTML = `
            <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Gün ${day.day}<br>${formatMoney(day.sales)}
            </div>
          `;
            chartContainer.appendChild(bar);
        });
    }

    function updateProductPerformance() {
        const container = document.getElementById('product-performance');

        if (Object.keys(gameState.productSales).length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">Henüz satış verisi bulunmuyor</p>';
            return;
        }

        container.innerHTML = '';

        // Sort products by sales
        const sortedProducts = Object.entries(gameState.productSales)
            .sort(([, a], [, b]) => b.revenue - a.revenue)
            .slice(0, 10);

        sortedProducts.forEach(([productName, data]) => {
            const performanceDiv = document.createElement('div');
            performanceDiv.className = 'flex justify-between items-center p-3 bg-gray-50 rounded';
            performanceDiv.innerHTML = `
            <div>
              <div class="font-medium text-gray-800">${productName}</div>
              <div class="text-sm text-gray-600">${data.quantity} adet satıldı</div>
            </div>
            <div class="text-right">
              <div class="font-medium text-green-600">${formatMoney(data.revenue)}</div>
              <div class="text-xs text-gray-500">gelir</div>
            </div>
          `;
            container.appendChild(performanceDiv);
        });
    }

    function updatePlatformPerformance() {
        const container = document.getElementById('platform-performance');

        if (Object.keys(gameState.platformSales).length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">Platform verileri yükleniyor...</p>';
            return;
        }

        container.innerHTML = '';

        Object.entries(gameState.platformSales).forEach(([platform, data]) => {
            const platformNames = {
                own: 'Kendi Web Siteniz',
                ecom1: 'E-Ticaret A',
                ecom2: 'E-Ticaret B'
            };

            const performanceDiv = document.createElement('div');
            performanceDiv.className = 'flex justify-between items-center p-3 bg-gray-50 rounded';
            performanceDiv.innerHTML = `
            <div>
              <div class="font-medium text-gray-800">${platformNames[platform]}</div>
              <div class="text-sm text-gray-600">${data.orders} sipariş</div>
            </div>
            <div class="text-right">
              <div class="font-medium text-blue-600">${formatMoney(data.revenue)}</div>
              <div class="text-xs text-gray-500">gelir</div>
            </div>
          `;
            container.appendChild(performanceDiv);
        });
    }

    function updateStockProductSelect() {
        const select = document.getElementById('stock-product');
        const noProductsMessage = document.getElementById('no-products-message');
        const form = document.getElementById('add-stock-form');

        if (gameState.products.length === 0) {
            noProductsMessage.classList.remove('hidden');
            form.classList.add('hidden');
            return;
        }

        noProductsMessage.classList.add('hidden');
        form.classList.remove('hidden');

        select.innerHTML = '';
        gameState.products.forEach((product, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${product.name} (Mevcut: ${product.stock} adet)`;
            select.appendChild(option);
        });
    }

    function checkRandomEvent() {
        // Only trigger random events after day 2 and if there are products
        if (gameState.day < 2 || gameState.products.length === 0) return;

        // 30% chance of random event each day
        if (Math.random() < 0.3) {
            const randomEvent = gameState.randomEvents[Math.floor(Math.random() * gameState.randomEvents.length)];
            showRandomEvent(randomEvent);
        }
    }

    function showRandomEvent(event) {
        const eventCard = document.getElementById('random-event-card');
        const eventTitle = document.getElementById('random-event-title');
        const eventText = document.getElementById('random-event-text');
        const acceptBtn = document.getElementById('random-event-accept');
        const declineBtn = document.getElementById('random-event-decline');

        eventTitle.textContent = event.title;
        eventText.textContent = event.text;

        // Clear any existing event listeners by cloning elements
        const newAcceptBtn = acceptBtn.cloneNode(true);
        const newDeclineBtn = declineBtn.cloneNode(true);
        acceptBtn.parentNode.replaceChild(newAcceptBtn, acceptBtn);
        declineBtn.parentNode.replaceChild(newDeclineBtn, declineBtn);

        // Update references to new elements
        const currentAcceptBtn = document.getElementById('random-event-accept');
        const currentDeclineBtn = document.getElementById('random-event-decline');

        // Add new event listeners
        currentAcceptBtn.addEventListener('click', () => {
            try {
                event.accept();
                eventCard.classList.add('hidden');
                updateDisplay();
                updateProductsDisplay();
                updateInventoryDisplay();
                updateActiveCampaigns();
                updateAnalytics();
            } catch (error) {
                console.error('Error in event accept:', error);
                eventCard.classList.add('hidden');
            }
        });

        currentDeclineBtn.addEventListener('click', () => {
            try {
                event.decline();
                eventCard.classList.add('hidden');
                updateDisplay();
            } catch (error) {
                console.error('Error in event decline:', error);
                eventCard.classList.add('hidden');
            }
        });

        eventCard.classList.remove('hidden');

        // Auto-hide after 20 seconds
        const autoHideTimer = setTimeout(() => {
            if (!eventCard.classList.contains('hidden')) {
                try {
                    event.decline();
                    eventCard.classList.add('hidden');
                    updateDisplay();
                    showNotification('warning', 'Fırsat Kaçırıldı', 'Zaman doldu, fırsat kaçırıldı.');
                } catch (error) {
                    console.error('Error in auto-decline:', error);
                    eventCard.classList.add('hidden');
                }
            }
        }, 20000);

        // Clear timer if user makes a choice
        currentAcceptBtn.addEventListener('click', () => clearTimeout(autoHideTimer), { once: true });
        currentDeclineBtn.addEventListener('click', () => clearTimeout(autoHideTimer), { once: true });
    }

    function simulateDailySales() {
        if (gameState.products.length === 0) return;

        let totalSales = 0;
        let totalItemsSold = 0;
        let totalExpenses = 0;

        // Calculate platform effects
        const activePlatforms = Object.entries(gameState.platforms).filter(([key, platform]) => platform.active);

        if (activePlatforms.length === 0) {
            addEvent('Aktif satış platformunuz olmadığı için satış gerçekleşmedi.');
            return;
        }

        // Calculate staff effects
        const salesBoost = 1 + (gameState.staff.sales * 0.1);
        const supportBoost = 1 + (gameState.staff.support * 0.05);

        // Calculate marketing campaign effects
        let campaignMultiplier = 1;
        gameState.activeCampaigns.forEach(campaign => {
            campaignMultiplier *= campaign.multiplier;
        });

        // Add SEO boost
        if (gameState.seoBoost) {
            campaignMultiplier *= 1.25;
        }

        // Apply special effects
        let specialMultiplier = 1;

        // Viral boost effect
        if (gameState.viralBoost > 0) {
            specialMultiplier *= gameState.viralMultiplier || 1.5;
            gameState.viralBoost--;
            if (gameState.viralBoost === 0) {
                addEvent('Viral kampanya etkisi sona erdi.');
            }
        }

        // Competitor penalty effect
        if (gameState.competitorPenalty > 0) {
            if (!gameState.competitorDefense) {
                specialMultiplier *= gameState.competitorMultiplier || 0.7;
            }
            gameState.competitorPenalty--;
            if (gameState.competitorPenalty === 0) {
                addEvent('Rakip kampanya etkisi sona erdi.');
            }
        }

        // Reduce competitor defense
        if (gameState.competitorDefense > 0) {
            gameState.competitorDefense--;
            if (gameState.competitorDefense === 0) {
                addEvent('Savunma kampanyanız sona erdi.');
            }
        }

        activePlatforms.forEach(([platformKey, platform]) => {
            // Monthly fees
            if (platform.monthlyFee > 0) {
                const dailyFee = platform.monthlyFee / 30;
                totalExpenses += dailyFee;
            }

            // Calculate potential sales with tech boost
            const techMultiplier = gameState.techBoost || 1;
            const dailyVisitors = platform.visitors * salesBoost * supportBoost * specialMultiplier * campaignMultiplier * techMultiplier;
            const potentialSales = Math.floor(dailyVisitors * platform.conversionRate * (0.5 + Math.random() * 0.5));

            for (let i = 0; i < potentialSales; i++) {
                // Select random product with stock
                const availableProducts = gameState.products.filter(p => p.stock > 0);
                if (availableProducts.length === 0) break;

                const randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
                const productIndex = gameState.products.findIndex(p => p === randomProduct);

                // Sell the product
                gameState.products[productIndex].stock--;
                const salePrice = randomProduct.price;
                const commission = salePrice * platform.commission;
                const netSale = salePrice - commission;

                totalSales += netSale;
                totalItemsSold++;

                // Track sales for analytics
                gameState.totalRevenue += netSale;
                gameState.totalOrders++;

                // Track product sales
                if (!gameState.productSales[randomProduct.name]) {
                    gameState.productSales[randomProduct.name] = { quantity: 0, revenue: 0 };
                }
                gameState.productSales[randomProduct.name].quantity++;
                gameState.productSales[randomProduct.name].revenue += netSale;

                // Track platform sales
                if (!gameState.platformSales[platformKey]) {
                    gameState.platformSales[platformKey] = { orders: 0, revenue: 0 };
                }
                gameState.platformSales[platformKey].orders++;
                gameState.platformSales[platformKey].revenue += netSale;
            }
        });

        // Staff salaries (daily portion)
        const dailyStaffCost = ((gameState.staff.sales * 5000) + (gameState.staff.support * 4000) + (gameState.staff.warehouse * 3500)) / 30;
        totalExpenses += dailyStaffCost;

        // Update daily stats
        gameState.dailyStats.sales = totalSales;
        gameState.dailyStats.expenses = totalExpenses;
        gameState.dailyStats.profit = totalSales - totalExpenses;
        gameState.dailyStats.itemsSold = totalItemsSold;

        // Update money
        gameState.money += gameState.dailyStats.profit;

        // Add to sales history
        gameState.salesHistory.push({
            day: gameState.day,
            sales: totalSales,
            profit: gameState.dailyStats.profit,
            orders: totalItemsSold
        });

        // Update active campaigns
        gameState.activeCampaigns = gameState.activeCampaigns.filter(campaign => {
            campaign.remainingDays--;
            if (campaign.remainingDays <= 0) {
                addEvent(`${campaign.name} kampanyası sona erdi.`);
                return false;
            }
            return true;
        });

        if (totalItemsSold > 0) {
            addEvent(`${totalItemsSold} adet ürün sattınız. Net kazanç: ${formatMoney(gameState.dailyStats.profit)}`);
            showNotification('success', 'Günlük Satış', `${totalItemsSold} ürün satıldı, ${formatMoney(gameState.dailyStats.profit)} kazanç elde ettiniz.`);
        } else {
            addEvent('Bugün hiç satış gerçekleşmedi. Stok durumunuzu ve platformlarınızı kontrol edin.');
        }
    }

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const targetTab = this.dataset.tab;

            // Update tab buttons
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('border-indigo-600');
                b.classList.add('border-transparent');
            });
            this.classList.add('border-indigo-600');
            this.classList.remove('border-transparent');

            // Update tab contents
            document.querySelectorAll('[data-tab-content]').forEach(content => {
                content.classList.add('hidden');
            });
            document.querySelector(`[data-tab-content="${targetTab}"]`).classList.remove('hidden');
        });
    });

    // Modal handling
    function openModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    function closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function () {
            this.closest('.fixed').classList.add('hidden');
        });
    });

    // Add Product Form
    document.getElementById('add-product-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const name = document.getElementById('product-name').value;
        const category = document.getElementById('product-category').value;
        const cost = parseInt(document.getElementById('product-cost').value);
        const price = parseInt(document.getElementById('product-price').value);
        const stock = parseInt(document.getElementById('product-stock').value);

        if (price <= cost) {
            showNotification('error', 'Fiyat Hatası', 'Satış fiyatı alış fiyatından yüksek olmalıdır.');
            return;
        }

        const totalCost = cost * stock;
        if (gameState.money < totalCost) {
            showNotification('error', 'Yetersiz Bakiye', `Bu ürünü eklemek için ${formatMoney(totalCost)} gerekli.`);
            return;
        }

        // Add product
        gameState.products.push({
            name: name,
            category: category,
            cost: cost,
            price: price,
            stock: stock
        });

        gameState.money -= totalCost;
        gameState.dailyStats.expenses += totalCost;

        showNotification('success', 'Ürün Eklendi', `${name} ürünü başarıyla eklendi.`);
        addEvent(`${name} ürününü ${stock} adet stokla eklendi (${formatMoney(totalCost)}).`);

        // Reset form and close modal
        this.reset();
        closeModal('add-product-modal');

        updateDisplay();
        updateProductsDisplay();
        updateInventoryDisplay();
        updateActiveCampaigns();
        updateAnalytics();
        updateStockProductSelect();
    });

    // Add Stock Form
    document.getElementById('add-stock-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const productIndex = parseInt(document.getElementById('stock-product').value);
        const amount = parseInt(document.getElementById('stock-amount').value);

        const product = gameState.products[productIndex];
        const totalCost = product.cost * amount;

        if (gameState.money < totalCost) {
            showNotification('error', 'Yetersiz Bakiye', `Bu stok için ${formatMoney(totalCost)} gerekli.`);
            return;
        }

        product.stock += amount;
        gameState.money -= totalCost;
        gameState.dailyStats.expenses += totalCost;

        showNotification('success', 'Stok Eklendi', `${product.name} ürününe ${amount} adet stok eklendi.`);
        addEvent(`${product.name} ürününe ${amount} adet stok eklediniz (${formatMoney(totalCost)}).`);

        // Reset form and close modal
        this.reset();
        closeModal('add-stock-modal');

        updateDisplay();
        updateProductsDisplay();
        updateInventoryDisplay();
        updateActiveCampaigns();
        updateAnalytics();
        updateStockProductSelect();
    });

    // Platform toggles
    document.querySelectorAll('.toggle-platform').forEach(btn => {
        btn.addEventListener('click', function () {
            const platformKey = this.dataset.platform;
            const platform = gameState.platforms[platformKey];
            const card = this.closest('.platform-card');
            const status = document.getElementById(`${platformKey}-status`);

            if (platform.active) {
                // Deactivate
                platform.active = false;
                card.classList.remove('active');
                status.textContent = 'Pasif';
                status.className = 'text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded';
                this.textContent = 'Aktifleştir';
                addEvent(`${card.querySelector('h3').textContent} platformunu devre dışı bıraktınız.`);
            } else {
                // Check if can afford monthly fee
                if (platform.monthlyFee > 0 && gameState.money < platform.monthlyFee) {
                    showNotification('error', 'Yetersiz Bakiye', `Bu platformu aktifleştirmek için ${formatMoney(platform.monthlyFee)} aylık ücret gerekli.`);
                    return;
                }

                // Activate
                platform.active = true;
                card.classList.add('active');
                status.textContent = 'Aktif';
                status.className = 'text-xs bg-green-100 text-green-800 px-2 py-1 rounded';
                this.textContent = 'Devre Dışı Bırak';
                addEvent(`${card.querySelector('h3').textContent} platformunu aktifleştirdiniz.`);
            }

            updateDisplay();
        });
    });

    // Marketing campaign event listeners
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('start-campaign') || e.target.closest('.start-campaign')) {
            const btn = e.target.classList.contains('start-campaign') ? e.target : e.target.closest('.start-campaign');
            const campaignType = btn.dataset.type;
            startMarketingCampaign(campaignType);
        }
    });

    // Staff hiring - use event delegation to handle dynamically added buttons
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('hire-staff') || e.target.closest('.hire-staff')) {
            const btn = e.target.classList.contains('hire-staff') ? e.target : e.target.closest('.hire-staff');
            const staffType = btn.dataset.type;
            const salaries = { sales: 5000, support: 4000, warehouse: 3500 };
            const salary = salaries[staffType];

            if (gameState.money < salary) {
                showNotification('error', 'Yetersiz Bakiye', `Personel işe almak için ${formatMoney(salary)} maaş bütçesi gerekli.`);
                return;
            }

            // Deduct salary advance when hiring
            gameState.money -= salary;
            gameState.dailyStats.expenses += salary;
            gameState.staff[staffType]++;

            showNotification('success', 'Personel İşe Alındı', `Yeni ${staffType === 'sales' ? 'satış personeli' : staffType === 'support' ? 'müşteri hizmetleri personeli' : 'depo personeli'} işe alındı.`);
            addEvent(`Yeni ${staffType === 'sales' ? 'satış personeli' : staffType === 'support' ? 'müşteri hizmetleri personeli' : 'depo personeli'} işe aldınız (${formatMoney(salary)} maaş avansı ödendi).`);

            updateDisplay();
        }
    });

    // Staff firing - use event delegation to handle dynamically added buttons
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('fire-staff') || e.target.closest('.fire-staff')) {
            const btn = e.target.classList.contains('fire-staff') ? e.target : e.target.closest('.fire-staff');
            const staffType = btn.dataset.type;

            if (gameState.staff[staffType] === 0) {
                showNotification('warning', 'Personel Yok', 'İşten çıkaracak personel bulunmuyor.');
                return;
            }

            if (confirm('Personeli işten çıkarmak istediğinizden emin misiniz?')) {
                gameState.staff[staffType]--;
                showNotification('info', 'Personel İşten Çıkarıldı', `${staffType === 'sales' ? 'Satış personeli' : staffType === 'support' ? 'Müşteri hizmetleri personeli' : 'Depo personeli'} işten çıkarıldı.`);
                addEvent(`${staffType === 'sales' ? 'Satış personeli' : staffType === 'support' ? 'Müşteri hizmetleri personeli' : 'Depo personeli'}ni işten çıkardınız.`);

                updateDisplay();
            }
        }
    });

    // Next day button
    document.getElementById('next-day-btn').addEventListener('click', function () {
        gameState.day++;

        // Reset daily stats
        gameState.dailyStats = {
            sales: 0,
            expenses: 0,
            profit: 0,
            itemsSold: 0
        };

        // Simulate daily sales
        simulateDailySales();

        // Check for random events
        checkRandomEvent();

        // Check win condition
        if (gameState.money >= 100000) {
            showNotification('success', 'Tebrikler!', 'Hedefinize ulaştınız! 100,000₺ kazandınız!');
            addEvent('🎉 Tebrikler! E-ticaret hedefinize ulaştınız ve 100,000₺ kazandınız!');
        }

        // Check lose condition
        if (gameState.money < 0) {
            showNotification('error', 'Oyun Bitti', 'Paranız bitti! Oyunu yeniden başlatmanız gerekiyor.');
            addEvent('💸 Paranız bitti. E-ticaret maceranız sona erdi.');
        }

        updateDisplay();
        updateProductsDisplay();
        updateInventoryDisplay();
        updateActiveCampaigns();
        updateAnalytics();
    });

    // Quick action buttons
    document.getElementById('quick-add-product').addEventListener('click', () => openModal('add-product-modal'));
    document.getElementById('add-product-btn').addEventListener('click', () => openModal('add-product-modal'));
    document.getElementById('add-first-product').addEventListener('click', () => openModal('add-product-modal'));

    document.getElementById('quick-add-stock').addEventListener('click', () => {
        updateStockProductSelect();
        openModal('add-stock-modal');
    });
    document.getElementById('add-stock-btn').addEventListener('click', () => {
        updateStockProductSelect();
        openModal('add-stock-modal');
    });

    document.getElementById('quick-platforms').addEventListener('click', () => {
        // Switch to platforms tab
        document.querySelector('[data-tab="platforms"]').click();
    });

    document.getElementById('quick-hire-staff').addEventListener('click', () => {
        // Switch to staff tab
        document.querySelector('[data-tab="staff"]').click();
    });
    document.getElementById('hire-staff-btn-tab').addEventListener('click', () => {
        // Switch to staff tab
        document.querySelector('[data-tab="staff"]').click();
    });

    document.getElementById('go-add-product').addEventListener('click', () => {
        closeModal('add-stock-modal');
        openModal('add-product-modal');
    });

    document.getElementById('quick-marketing').addEventListener('click', () => {
        // Switch to marketing tab
        document.querySelector('[data-tab="marketing"]').click();
    });

    document.getElementById('quick-analytics').addEventListener('click', () => {
        // Switch to analytics tab
        document.querySelector('[data-tab="analytics"]').click();
    });

    // Initialize display
    addEvent('E-ticaret maceranıza başladınız! İlk ürünlerinizi ekleyin ve satışa başlayın.');
    updateDisplay();
    updateProductsDisplay();
    updateInventoryDisplay();
    updateStockProductSelect();
    updateActiveCampaigns();
    updateAnalytics();
});

(function () { function c() { var b = a.contentDocument || a.contentWindow.document; if (b) { var d = b.createElement('script'); d.innerHTML = "window.__CF$cv$params={r:'95705ecac6d09904',t:'MTc1MTE0NzExNy4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);"; b.getElementsByTagName('head')[0].appendChild(d) } } if (document.body) { var a = document.createElement('iframe'); a.height = 1; a.width = 1; a.style.position = 'absolute'; a.style.top = 0; a.style.left = 0; a.style.border = 'none'; a.style.visibility = 'hidden'; document.body.appendChild(a); if ('loading' !== document.readyState) c(); else if (window.addEventListener) document.addEventListener('DOMContentLoaded', c); else { var e = document.onreadystatechange || function () { }; document.onreadystatechange = function (b) { e(b); 'loading' !== document.readyState && (document.onreadystatechange = e, c()) } } } })();

