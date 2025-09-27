// Global variables to store simulation data
let rewardIdCounter = 0;
let pityIdCounter = 0;
let charts = {}; // Store chart instances for cleanup

function addRewardRow(tokens=10,probability=10) {
    rewardIdCounter++;
    const rewardsContainer = document.getElementById('rewardsContainer');
    
    const rowDiv = document.createElement('div');
    rowDiv.className = 'reward-row';
    rowDiv.id = `reward-${rewardIdCounter}`;
    
    rowDiv.innerHTML = `
        <input type="number" min="1" value="${tokens}" onchange="updateSummary()" style="text-align: right; width: 120px;"> <span>💰 Tokens</span>
        <input type="number" min="0" max="100" step="0.1" value="${probability}" onchange="updateSummary()" placeholder="0.0" style="text-align: right; width: 90px;">
        <span>%</span>
        
        <button class="remove-btn" onclick="removeRewardRow('reward-${rewardIdCounter}')">Remove</button>
    `;
    
    rewardsContainer.appendChild(rowDiv);
    updateSummary();
}

function removeRewardRow(rowId) {
    const row = document.getElementById(rowId);
    row.remove();
    updateSummary();
}

function updateSummary() {
    let totalProbability = 0;
    const rewardRows = document.querySelectorAll('.reward-row');
    rewardRows.forEach((row, index) => {
        const probabilityInput = row.querySelector('input[type="number"]:last-of-type');
        const probability = parseFloat(probabilityInput.value) || 0;
        totalProbability += probability;
    });
    totalProbability = 100-totalProbability;
    document.getElementById("probablityNull").value = totalProbability;
    document.getElementById("oddsNumber").innerHTML = averageSpin();
}

function addPityRow(tokens=1,tickets=10) {
    pityIdCounter++;
    const pityContainer = document.getElementById('pityContainer');
    
    const rowDiv = document.createElement('div');
    rowDiv.className = 'pity-row';
    rowDiv.id = `pity-${rewardIdCounter}`;
    
    rowDiv.innerHTML = `
        <input type="number" min="1" value="${tokens}" step="1" style="text-align: right; width: 120px;"> <span>💰 Tokens</span>
        <input type="number" min="0" max="100" step="1" value="${tickets}" onchange="updatePity()" placeholder="0.0" style="text-align: right; width: 90px;">
        <span> spins</span>
        
        <button class="remove-btn" onclick="removePityRow('pity-${rewardIdCounter}')">Remove</button>
    `;
    pityContainer.appendChild(rowDiv);
}

function removePityRow(rowId) {
    const row = document.getElementById(rowId);
    row.remove();
}

async function runSimulation() {
    await runEarningsSimulation();
}

class rewardChance {
    constructor(reward, probability) {
        this.reward = reward;
        this.probability = probability*10;
    }
}

function defaultWheels() {
    document.getElementById('pityContainer').innerHTML = "";
    document.getElementById('rewardsContainer').innerHTML = "";
    addPityRow(250,10);
    addPityRow(750,25);
    addPityRow(1500,50);
    addPityRow(4000,100);
    addRewardRow(50,21);
    addRewardRow(75,14);
    addRewardRow(100,12);
    addRewardRow(150,8);
    addRewardRow(400,3);
    addRewardRow(1000,1);
    addRewardRow(1000,1);
    document.getElementById('numSimulations').value = 5000;
    document.getElementById('numTickets').value = 0;
    document.getElementById('ticketsToRun').value = 56;
    document.getElementById('currentTokens').value = 0;
}

function getRewards(flat) {
    const rewards = [];
    let probabilityLeft = 100;
    const rewardRows = document.querySelectorAll('.reward-row');
    rewardRows.forEach((row, index) => {
        const reward = parseInt(row.querySelector('input[type="number"]:first-of-type').value);
        const probability = parseFloat(row.querySelector('input[type="number"]:last-of-type').value);
        probabilityLeft -= probability;
        if (probabilityLeft !== 0) rewards.push(new rewardChance(reward,probability));
    });
    rewards.push(new rewardChance(0,probabilityLeft));
    if (flat) {
        const formatted = [];
        rewards.forEach(row => {
            if (row.reward > 0) formatted.push([row.reward,row.probability]);
        })
        return formatted;
    }
    return rewards;
}

function averageSpin() {
    let avg = 0;
    const rewardRows = document.querySelectorAll('.reward-row');
    rewardRows.forEach((row, index) => {
        const reward = parseInt(row.querySelector('input[type="number"]:first-of-type').value);
        const probability = parseFloat(row.querySelector('input[type="number"]:last-of-type').value);
        avg += reward*probability/100
    });
    return avg;
}

function getPity() {
    const pityList = [];
    const pityRow = document.querySelectorAll('.pity-row');
    pityRow.forEach((row, index) => {
        const reward = parseInt(row.querySelector('input[type="number"]:first-of-type').value);
        const tickets = parseFloat(row.querySelector('input[type="number"]:last-of-type').value);
        pityList.push([reward,tickets]);
        pityList.sort(function(a, b) {
            return a[1] - b[1];
        });
    });
    return pityList;
}

async function runEarningsSimulation() {
    const numTickets = parseInt(document.getElementById('numTickets').value);
    const ticketsToRun = parseInt(document.getElementById('ticketsToRun').value);
    const currentTokens = parseInt(document.getElementById('currentTokens').value);
    const numSimulations = parseInt(document.getElementById('numSimulations').value);
    
    const rewards = getRewards();

    //no rewards
    if (rewards.length === 1) {
        alert('Please add at least one reward type.');
        return;
    }
    
    //wrong probabilities
    rewards.forEach(reward => {
        if (reward.probability < 0) {
            alert('Probabilities must sum to 1.0 before running simulation.');
            return;
        }
    });

    //nothing useful
    if (ticketsToRun <= 0 || numSimulations <= 0) {
        alert('Number of tickets and simulations must be positive.');
        return;
    }
    
    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    
    // Allow UI to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Run simulations
    const simulationResults = [];
    
    for (let sim = 0; sim < numSimulations; sim++) {
        let totalValue = currentTokens;

        
        // Simulate tickets for this run
        for (let ticket = 0; ticket < ticketsToRun; ticket++) {
            const result = simulateTicket(rewards);
            totalValue += result;
        }

        //add pity prizes:
        const pity = getPity();
        const earnedPity = pity.filter((pityPrize) => pityPrize[1] > numTickets && pityPrize[1] <= numTickets+ticketsToRun);
        addedTokens = earnedPity.reduce((sum, sub) => sum + (sub[0] ?? 0), 0);

        //add in the pity
        totalValue += addedTokens
                
        // Update progress occasionally
        if (sim % Math.max(1, Math.floor(numSimulations / 100)) === 0) {
            await new Promise(resolve => setTimeout(resolve, 1));
        }

        simulationResults.push(totalValue);
    }
    
    // Display results
    updateChart(simulationResults);
    
    // Hide loading
    document.getElementById('loading').style.display = 'none';
    document.getElementById('results').style.display = 'block';
}


// Run a single ticket simulation - returns result with value
function simulateTicket(rewards) {
    const random = Math.floor(Math.random()*1000)
    let cumulativeProbability = 0;
    
    for (const reward of rewards) {
        cumulativeProbability += reward.probability;
        if (random <= cumulativeProbability) {
            return reward.reward;
        }
    }

    // Fallback (shouldn't happen if probabilities sum to 1)
    return 0;
}


//CHART STUFF!

let chart = null;

function createBins(data, numBins) {
    if (data.length === 0) return { bins: [], counts: [] };
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / numBins;
    
    const bins = [];
    const counts = new Array(numBins).fill(0);
    
    // Create bin labels
    for (let i = 0; i < numBins; i++) {
        const binStart = min + (i * binWidth);
        const binEnd = min + ((i + 1) * binWidth);
        if (binStart !== binEnd) bins.push(`${Math.floor(binStart)}-${Math.ceil(binEnd)}`);
        else bins.push(`${Math.floor(binStart)}`);        
    }
    
    // Count data points in each bin
    data.forEach(value => {
        let binIndex = Math.floor((value - min) / binWidth);
        // Handle edge case where value equals max
        if (binIndex >= numBins) binIndex = numBins - 1;
        counts[binIndex]++;
    });
    
    return { bins, counts };
}

function calculateStats(data) {
    if (data.length === 0) return {};
    
    const sorted = [...data].sort((a, b) => a - b);
    const count = data.length;
    const sum = data.reduce((a, b) => a + b, 0);
    const mean = sum / count;
    const median = count % 2 === 0 
        ? (sorted[count/2 - 1] + sorted[count/2]) / 2 
        : sorted[Math.floor(count/2)];
    const min = sorted[0];
    const max = sorted[count - 1];
    const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);
    
    return { count, mean, median, min, max, stdDev };
}

function updateStats(data) {
    const stats = calculateStats(data);
    document.getElementById('count').textContent = stats.count || '-';
    document.getElementById('mean').textContent = stats.mean ? stats.mean.toFixed(2) : '-';
    document.getElementById('median').textContent = stats.median ? stats.median.toFixed(2) : '-';
    document.getElementById('min').textContent = stats.min !== undefined ? stats.min.toFixed(2) : '-';
    document.getElementById('max').textContent = stats.max !== undefined ? stats.max.toFixed(2) : '-';
    document.getElementById('stdDev').textContent = stats.stdDev ? stats.stdDev.toFixed(2) : '-';
}

function updateChart(data) {
    const numBins = Math.floor(Math.log2(data.length))+1;
    const chartType = "bar";
    const color = "#ffb300";
    
    if (data.length === 0) {
        alert('Please enter valid numeric data');
        return;
    }

    const { bins, counts } = createBins(data, numBins);
    updateStats(data);

    const ctx = document.getElementById('histogramChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: bins,
            datasets: [{
                label: 'Frequency',
                data: counts,
                backgroundColor: color + '80',
                borderColor: color,
                borderWidth: 2,
                fill: chartType === 'line' ? false : true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Data Histogram (${data.length} data points)`
                },
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Frequency'
                    },
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Value Range'
                    }
                }
            }
        }
    });
}

// Auto-save current state periodically
function enableAutoSave() {
    setInterval(() => {
        saveConfig();
    }, 1000); // Save every 30 seconds
}

// Load auto-save on startup
function loadAutoSave() {
    const autoSave = localStorage.getItem('wheelConfig');
    loadConfig(autoSave);
}

function saveMiscValue() {
    const miscValues = [];
    miscValues.push(document.getElementById('numTickets').value);
    miscValues.push(document.getElementById('ticketsToRun').value);
    miscValues.push(document.getElementById('currentTokens').value);
    return miscValues;
}

function loadMiscValues(miscValues) {
    document.getElementById('numTickets').value = miscValues[0];
    document.getElementById('ticketsToRun').value = miscValues[1];
    document.getElementById('currentTokens').value = miscValues[2];
}

function saveConfig() {
    const rewards = getRewards(true);
    const pity = getPity();
    localStorage.setItem("rewards", JSON.stringify(rewards));
    localStorage.setItem("pity", JSON.stringify(pity));
    localStorage.setItem("misc", JSON.stringify(saveMiscValue()));
}

function loadConfig() {
    const rewards = localStorage.getItem("rewards");
    if (!rewards) {
        defaultWheels();
        return;
    }
    const rewardsParse = JSON.parse(rewards);
    rewardsParse.forEach(reward => {
        addRewardRow(reward[0],reward[1]/10);
    });
    const pityRows = JSON.parse(localStorage.getItem("pity"));
    pityRows.forEach(pity => {
        addPityRow(pity[0],pity[1]);
    });
    loadMiscValues(JSON.parse(localStorage.getItem("misc")));
}

//autorun
enableAutoSave();
loadConfig();