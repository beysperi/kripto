
        document.addEventListener('DOMContentLoaded', function() {
            // Global variables
            let allCoins = [];
            let currentCurrency = 'usd';
            let currentPeriod = '24h';
            let selectedCoin = null;
            let coinChart = null;
            
            // Currency symbols
            const currencySymbols = {
                'usd': '$',
                'eur': '€',
                'try': '₺'
            };
            
            // Initialize the app
            init();
            
            function init() {
                // Set up event listeners
                document.getElementById('refreshButton').addEventListener('click', fetchData);
                document.getElementById('currencySelector').addEventListener('change', handleCurrencyChange);
                document.getElementById('searchInput').addEventListener('input', handleSearch);
                
                // Set up period buttons
                document.querySelectorAll('.period-button').forEach(button => {
                    button.addEventListener('click', () => {
                        document.querySelectorAll('.period-button').forEach(btn => {
                            btn.classList.remove('bg-blue-600');
                            btn.classList.add('bg-slate-700', 'hover:bg-slate-600');
                        });
                        button.classList.remove('bg-slate-700', 'hover:bg-slate-600');
                        button.classList.add('bg-blue-600');
                        currentPeriod = button.dataset.period;
                        updateTable();
                    });
                });
                
                // Set up chart period buttons
                document.querySelectorAll('.chart-period-button').forEach(button => {
                    button.addEventListener('click', () => {
                        document.querySelectorAll('.chart-period-button').forEach(btn => {
                            btn.classList.remove('bg-blue-600');
                            btn.classList.add('bg-slate-700', 'hover:bg-slate-600');
                        });
                        button.classList.remove('bg-slate-700', 'hover:bg-slate-600');
                        button.classList.add('bg-blue-600');
                        if (selectedCoin) {
                            fetchCoinChart(selectedCoin.id, button.dataset.chartPeriod);
                        }
                    });
                });
                
                // Set up sortable columns
                document.querySelectorAll('.sortable').forEach(header => {
                    header.addEventListener('click', () => {
                        const sortKey = header.dataset.sort;
                        sortTable(sortKey);
                    });
                });
                
                // Fetch initial data
                fetchData();
            }
            
            function handleCurrencyChange(e) {
                currentCurrency = e.target.value;
                fetchData();
            }
            
            function handleSearch(e) {
                const searchTerm = e.target.value.toLowerCase();
                const filteredCoins = allCoins.filter(coin => 
                    coin.name.toLowerCase().includes(searchTerm) || 
                    coin.symbol.toLowerCase().includes(searchTerm)
                );
                
                if (searchTerm.length > 0) {
                    renderTopCoins(filteredCoins.slice(0, 8));
                } else {
                    renderTopCoins(allCoins.slice(0, 8));
                }
            }
            
            async function fetchData() {
                showLoading(true);
                hideError();
                
                try {
                    const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currentCurrency}&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=1h,24h,7d,30d`);
                    
                    if (!response.ok) {
                        throw new Error('API request failed');
                    }
                    
                    allCoins = await response.json();
                    
                    // Update UI
                    updateLastUpdated();
                    renderTopCoins(allCoins.slice(0, 8));
                    renderCoinsTable(allCoins);
                    
                    // Show sections
                    document.getElementById('topCoinsSection').classList.remove('hidden');
                    document.getElementById('coinsTableSection').classList.remove('hidden');
                    
                    // If a coin was previously selected, update its data
                    if (selectedCoin) {
                        const updatedCoin = allCoins.find(coin => coin.id === selectedCoin.id);
                        if (updatedCoin) {
                            selectedCoin = updatedCoin;
                            showCoinDetails(selectedCoin);
                        }
                    }
                    
                    showLoading(false);
                } catch (error) {
                    console.error('Error fetching data:', error);
                    showError();
                    showLoading(false);
                }
            }
            
            function renderTopCoins(coins) {
                const container = document.getElementById('topCoins');
                container.innerHTML = '';
                
                coins.forEach(coin => {
                    const priceChangeClass = coin.price_change_percentage_24h >= 0 ? 'price-up' : 'price-down';
                    const priceChangeIcon = coin.price_change_percentage_24h >= 0 
                        ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>'
                        : '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>';
                    
                    // Create sparkline SVG from the sparkline data
                    const sparklineData = coin.sparkline_in_7d?.price || [];
                    let sparklinePath = '';
                    
                    if (sparklineData.length > 0) {
                        const min = Math.min(...sparklineData);
                        const max = Math.max(...sparklineData);
                        const range = max - min || 1;
                        
                        const points = sparklineData.map((price, index) => {
                            const x = (index / (sparklineData.length - 1)) * 100;
                            const y = 100 - ((price - min) / range) * 100;
                            return `${x},${y}`;
                        });
                        
                        sparklinePath = `M${points.join(' L')}`;
                    }
                    
                    const sparklineColor = coin.price_change_percentage_7d_in_currency >= 0 ? '#10b981' : '#ef4444';
                    
                    const card = document.createElement('div');
                    card.className = 'bg-slate-800 rounded-xl p-6 shadow-lg crypto-card';
                    card.innerHTML = `
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center">
                                <img src="${coin.image}" alt="${coin.name}" class="w-8 h-8 mr-3">
                                <div>
                                    <h3 class="font-semibold">${coin.name}</h3>
                                    <span class="text-sm text-gray-400">${coin.symbol.toUpperCase()}</span>
                                </div>
                            </div>
                            <div class="chart-container">
                                <svg class="chart" viewBox="0 0 100 50" preserveAspectRatio="none">
                                    <path d="${sparklinePath}" stroke="${sparklineColor}" stroke-width="2" fill="none"/>
                                </svg>
                            </div>
                        </div>
                        <div class="flex justify-between items-end">
                            <div>
                                <p class="text-2xl font-bold">${currencySymbols[currentCurrency]}${formatNumber(coin.current_price)}</p>
                                <p class="${priceChangeClass} text-sm font-medium flex items-center">
                                    ${priceChangeIcon}
                                    ${coin.price_change_percentage_24h?.toFixed(2) || 0}%
                                </p>
                            </div>
                            <button class="view-coin-btn bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg text-sm" data-coin-id="${coin.id}">Detay</button>
                        </div>
                    `;
                    
                    container.appendChild(card);
                    
                    // Add event listener to the detail button
                    card.querySelector('.view-coin-btn').addEventListener('click', () => {
                        showCoinDetails(coin);
                    });
                });
            }
            
            function renderCoinsTable(coins) {
                const tableBody = document.getElementById('coinsTableBody');
                tableBody.innerHTML = '';
                
                coins.forEach((coin, index) => {
                    const row = document.createElement('tr');
                    row.className = 'border-b border-gray-700 hover:bg-slate-700 cursor-pointer';
                    
                    // Determine price change percentage based on current period
                    let priceChangeKey;
                    switch(currentPeriod) {
                        case '1h':
                            priceChangeKey = 'price_change_percentage_1h_in_currency';
                            break;
                        case '7d':
                            priceChangeKey = 'price_change_percentage_7d_in_currency';
                            break;
                        case '30d':
                            priceChangeKey = 'price_change_percentage_30d_in_currency';
                            break;
                        default:
                            priceChangeKey = 'price_change_percentage_24h_in_currency';
                    }
                    
                    // Create sparkline SVG
                    const sparklineData = coin.sparkline_in_7d?.price || [];
                    let sparklinePath = '';
                    
                    if (sparklineData.length > 0) {
                        const min = Math.min(...sparklineData);
                        const max = Math.max(...sparklineData);
                        const range = max - min || 1;
                        
                        const points = sparklineData.map((price, index) => {
                            const x = (index / (sparklineData.length - 1)) * 100;
                            const y = 40 - ((price - min) / range) * 40;
                            return `${x},${y}`;
                        });
                        
                        sparklinePath = `M${points.join(' L')}`;
                    }
                    
                    const sparklineColor = coin.price_change_percentage_7d_in_currency >= 0 ? '#10b981' : '#ef4444';
                    
                    // Format price change classes
                    const priceChange1hClass = coin.price_change_percentage_1h_in_currency >= 0 ? 'price-up' : 'price-down';
                    const priceChange24hClass = coin.price_change_percentage_24h_in_currency >= 0 ? 'price-up' : 'price-down';
                    const priceChange7dClass = coin.price_change_percentage_7d_in_currency >= 0 ? 'price-up' : 'price-down';
                    
                    row.innerHTML = `
                        <td class="py-4">${index + 1}</td>
                        <td class="py-4">
                            <div class="flex items-center">
                                <img src="${coin.image}" alt="${coin.name}" class="w-6 h-6 mr-3">
                                <div>
                                    <p class="font-medium">${coin.name}</p>
                                    <p class="text-sm text-gray-400">${coin.symbol.toUpperCase()}</p>
                                </div>
                            </div>
                        </td>
                        <td class="py-4">${currencySymbols[currentCurrency]}${formatNumber(coin.current_price)}</td>
                        <td class="py-4 ${priceChange1hClass}">${coin.price_change_percentage_1h_in_currency?.toFixed(2) || 0}%</td>
                        <td class="py-4 ${priceChange24hClass}">${coin.price_change_percentage_24h_in_currency?.toFixed(2) || 0}%</td>
                        <td class="py-4 ${priceChange7dClass}">${coin.price_change_percentage_7d_in_currency?.toFixed(2) || 0}%</td>
                        <td class="py-4">${currencySymbols[currentCurrency]}${formatLargeNumber(coin.market_cap)}</td>
                        <td class="py-4">${currencySymbols[currentCurrency]}${formatLargeNumber(coin.total_volume)}</td>
                        <td class="py-4">
                            <svg class="w-24 h-12" viewBox="0 0 100 40" preserveAspectRatio="none">
                                <path d="${sparklinePath}" stroke="${sparklineColor}" stroke-width="2" fill="none"/>
                            </svg>
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                    
                    // Add event listener to the row
                    row.addEventListener('click', () => {
                        showCoinDetails(coin);
                    });
                });
            }
            
            function showCoinDetails(coin) {
                selectedCoin = coin;
                
                // Update UI elements
                document.getElementById('selectedCoinImage').src = coin.image;
                document.getElementById('selectedCoinName').textContent = `${coin.name} Fiyat Grafiği`;
                
                // Show the section
                document.getElementById('selectedCoinSection').classList.remove('hidden');
                
                // Scroll to the section
                document.getElementById('selectedCoinSection').scrollIntoView({ behavior: 'smooth' });
                
                // Update coin stats
                updateCoinStats(coin);
                
                // Fetch and display chart data
                const activePeriodButton = document.querySelector('.chart-period-button.bg-blue-600');
                const period = activePeriodButton ? activePeriodButton.dataset.chartPeriod : '1';
                fetchCoinChart(coin.id, period);
            }
            
            async function fetchCoinChart(coinId, days) {
                try {
                    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currentCurrency}&days=${days}`);
                    
                    if (!response.ok) {
                        throw new Error('Chart data fetch failed');
                    }
                    
                    const data = await response.json();
                    renderCoinChart(data.prices);
                } catch (error) {
                    console.error('Error fetching chart data:', error);
                }
            }
            
            function renderCoinChart(priceData) {
                const ctx = document.getElementById('coinChart').getContext('2d');
                
                // Destroy previous chart if it exists
                if (coinChart) {
                    coinChart.destroy();
                }
                
                // Format data for Chart.js
                const labels = priceData.map(price => {
                    const date = new Date(price[0]);
                    return date.toLocaleDateString('tr-TR', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                });
                
                const prices = priceData.map(price => price[1]);
                
                // Create gradient
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                
                // Create chart
                coinChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: `${selectedCoin.name} Fiyat`,
                            data: prices,
                            borderColor: '#3b82f6',
                            backgroundColor: gradient,
                            borderWidth: 2,
                            pointRadius: 0,
                            pointHoverRadius: 5,
                            pointHoverBackgroundColor: '#3b82f6',
                            pointHoverBorderColor: '#ffffff',
                            pointHoverBorderWidth: 2,
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: '#1e293b',
                                titleColor: '#e2e8f0',
                                bodyColor: '#e2e8f0',
                                borderColor: '#3b82f6',
                                borderWidth: 1,
                                padding: 10,
                                displayColors: false,
                                callbacks: {
                                    label: function(context) {
                                        return `${currencySymbols[currentCurrency]}${context.parsed.y.toFixed(2)}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    display: false,
                                    drawBorder: false
                                },
                                ticks: {
                                    color: '#94a3b8',
                                    maxRotation: 0,
                                    maxTicksLimit: 8
                                }
                            },
                            y: {
                                grid: {
                                    color: '#334155',
                                    drawBorder: false
                                },
                                ticks: {
                                    color: '#94a3b8',
                                    callback: function(value) {
                                        return `${currencySymbols[currentCurrency]}${formatNumber(value)}`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
            
            function updateCoinStats(coin) {
                const statsContainer = document.getElementById('coinStats').querySelector('.space-y-4');
                statsContainer.innerHTML = '';
                
                // Calculate 24h high/low
                const currentPrice = coin.current_price;
                const priceChange24h = coin.price_change_percentage_24h_in_currency / 100;
                const price24hAgo = currentPrice / (1 + priceChange24h);
                const high24h = Math.max(currentPrice, price24hAgo);
                const low24h = Math.min(currentPrice, price24hAgo);
                
                // Create stats items
                const stats = [
                    { label: `${coin.name} Fiyatı`, value: `${currencySymbols[currentCurrency]}${formatNumber(coin.current_price)}` },
                    { 
                        label: '24s Değişim', 
                        value: `${currencySymbols[currentCurrency]}${formatNumber(coin.price_change_24h)} (${coin.price_change_percentage_24h?.toFixed(2) || 0}%)`,
                        class: coin.price_change_percentage_24h >= 0 ? 'price-up' : 'price-down'
                    },
                    { label: '24s En Düşük / En Yüksek', value: `${currencySymbols[currentCurrency]}${formatNumber(low24h)} / ${currencySymbols[currentCurrency]}${formatNumber(high24h)}` },
                    { label: 'İşlem Hacmi (24s)', value: `${currencySymbols[currentCurrency]}${formatLargeNumber(coin.total_volume)}` },
                    { label: 'Piyasa Değeri', value: `${currencySymbols[currentCurrency]}${formatLargeNumber(coin.market_cap)}` },
                    { label: 'Piyasa Değeri Sıralaması', value: `#${coin.market_cap_rank}` },
                    { label: 'Dolaşımdaki Arz', value: `${formatLargeNumber(coin.circulating_supply)} ${coin.symbol.toUpperCase()}` }
                ];
                
                stats.forEach(stat => {
                    const div = document.createElement('div');
                    div.className = 'flex justify-between items-center pb-3 border-b border-gray-700';
                    div.innerHTML = `
                        <span class="text-gray-400">${stat.label}</span>
                        <span class="font-medium ${stat.class || ''}">${stat.value}</span>
                    `;
                    statsContainer.appendChild(div);
                });
                
                // Add buy/sell button
                const buttonDiv = document.createElement('div');
                buttonDiv.className = 'mt-6';
                buttonDiv.innerHTML = `
                    <button class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition">
                        ${coin.name} Al/Sat
                    </button>
                `;
                statsContainer.appendChild(buttonDiv);
            }
            
            function updateTable() {
                renderCoinsTable(allCoins);
            }
            
            function sortTable(sortKey) {
                allCoins.sort((a, b) => {
                    const valueA = a[sortKey] || 0;
                    const valueB = b[sortKey] || 0;
                    return valueB - valueA;
                });
                
                renderCoinsTable(allCoins);
            }
            
            function updateLastUpdated() {
                const now = new Date();
                const formattedTime = now.toLocaleTimeString('tr-TR');
                document.getElementById('updateTime').textContent = formattedTime;
                document.getElementById('lastUpdated').classList.remove('hidden');
            }
            
            function showLoading(isLoading) {
                document.getElementById('loadingIndicator').style.display = isLoading ? 'flex' : 'none';
            }
            
            function showError() {
                document.getElementById('errorMessage').classList.remove('hidden');
            }
            
            function hideError() {
                document.getElementById('errorMessage').classList.add('hidden');
            }
            
            // Helper functions
            function formatNumber(num) {
                if (num === null || num === undefined) return '0.00';
                
                if (num < 0.01) {
                    return num.toFixed(6);
                } else if (num < 1) {
                    return num.toFixed(4);
                } else if (num < 1000) {
                    return num.toFixed(2);
                } else {
                    return num.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
                }
            }
            
            function formatLargeNumber(num) {
                if (num === null || num === undefined) return '0';
                
                if (num >= 1000000000) {
                    return (num / 1000000000).toFixed(2) + ' Milyar';
                } else if (num >= 1000000) {
                    return (num / 1000000).toFixed(2) + ' Milyon';
                } else if (num >= 1000) {
                    return (num / 1000).toFixed(2) + ' Bin';
                } else {
                    return num.toLocaleString('tr-TR');
                }
            }
        });
    
(function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'95707cfca398e341',t:'MTc1MTE0ODM1NC4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();

