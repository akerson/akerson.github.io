// Global variables to store simulation data
let rewardIdCounter = 0;
let pityIdCounter = 0;
let toggleType = "earnings";
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
    if (toggleType === "goals") {
        const freeReward = parseFloat(document.getElementById('freeGoal').value);
        document.getElementById('freeReward').value = freeReward;
        totalProbability +=  freeReward
    }
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
    if (toggleType === "earnings") await runEarningsSimulation();
    else await runGoalsSimulation();
}

class rewardChance {
    constructor(reward, probability) {
        this.reward = reward;
        this.probability = Math.floor(probability*10);
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
    document.getElementById('currentGems').value = 0;
    document.getElementById('gemsPerTicket').value = 200;
    document.getElementById('goalCost').value = 12500;
    document.getElementById('freeGoal').value = 0.1;
}

function getRewards(flat) {
    const rewards = [];
    let probabilityLeft = 100;
    const rewardRows = document.querySelectorAll('.reward-row');
    if (toggleType === "goals") {
        const probability2 = parseFloat(document.getElementById('freeGoal').value);
        probabilityLeft -= probability2;
        rewards.push(new rewardChance("FREE",probability2));
    }
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
            if (row.reward === "FREE" || row.reward === 0) return;
            formatted.push([row.reward,row.probability]);
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

async function runGoalsSimulation() {
    const numTickets = parseInt(document.getElementById('numTickets').value);
    const ticketsToRun = parseInt(document.getElementById('ticketsToRun').value);
    const currentTokens = parseInt(document.getElementById('currentTokens').value);
    const numSimulations = parseInt(document.getElementById('numSimulations').value);
    const currentGems = parseInt(document.getElementById('currentGems').value);
    const gemsPerTicket = parseInt(document.getElementById('gemsPerTicket').value);
    const goalCost = parseInt(document.getElementById('goalCost').value);
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
    if (numSimulations <= 0) {
        alert('Number of tickets and simulations must be positive.');
        return;
    }

    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    
    // Allow UI to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Run simulations
    const simulationRunsNeeded = [];
    const simulationResultsPassFail = [];
    const simulationGemsRequired = [];

    for (let sim = 0; sim < numSimulations; sim++) {
        let totalValue = currentTokens;
        let reachedGoal = false;
        let numRuns = 0;

        //find remaining prizes
        const remainingPity = getPity().filter((pityPrize) => pityPrize[1] > numTickets);

        while(!reachedGoal && totalValue < goalCost) {
            numRuns++;
            //we run until we reach, we report the number of runs it took, and if we made it or not. Additionally, we capture gems required to meet it
            const result = simulateTicket(rewards);
            if (result === "FREE") {
                reachedGoal = true;
            }
            else {
                totalValue += result;
            }
            if (remainingPity.length > 0 && remainingPity[0][1] <= numRuns+numTickets) {
                const pitypoints = remainingPity.shift();
                totalValue += pitypoints[0];
            }
            if (numRuns >= 10000) {
                break; //this is to prevent a crash out
            }
        }

        //we know runs needed so just report it out
        simulationRunsNeeded.push(numRuns)
        //calculate how many runs we were allowed based off gems and free runs to see if we actually passed
        const runsAllowed = ticketsToRun + Math.floor(currentGems/gemsPerTicket);
        simulationResultsPassFail.push(runsAllowed >= numRuns);
        //gems required is similar calculation, take the actual runs and figure out how many were out of pocket
        const gemsRequired = Math.max(0,(numRuns-ticketsToRun)*gemsPerTicket);
        simulationGemsRequired.push(gemsRequired);
    }

    // Display results
    updateChart(simulationRunsNeeded,simulationResultsPassFail,simulationGemsRequired);
    
    // Hide loading
    document.getElementById('loading').style.display = 'none';
    document.getElementById('results').style.display = 'block';

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
    const random = Math.floor(Math.random()*1000)+1;
    let cumulativeProbability = 0;
    
    for (const reward of rewards) {
        if (random <= cumulativeProbability+reward.probability) {
            return reward.reward;
        }
        cumulativeProbability += reward.probability;
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
    const count = (data.length);
    const sum = (data.reduce((a, b) => a + b, 0));
    const mean = (sum / count);
    const median = count % 2 === 0 
        ? (sorted[count/2 - 1] + sorted[count/2]) / 2 
        : sorted[Math.floor(count/2)];
    const min = sorted[0];
    const max = sorted[count - 1];
    const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);
    
    return {count, mean, median, min, max, stdDev};
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function updateStatsEarned(data) {
    document.getElementById('statsEarned').style.display = 'block';
    document.getElementById('statsGoals').style.display = 'none';
    const stats = calculateStats(data);
    document.getElementById('mean').textContent = numberWithCommas(stats.mean.toFixed(2));
    document.getElementById('median').textContent = numberWithCommas(stats.median);
    document.getElementById('min').textContent = numberWithCommas(stats.min);
    document.getElementById('max').textContent = numberWithCommas(stats.max);
    document.getElementById('stdDev').textContent = numberWithCommas(stats.stdDev.toFixed(2));
}

function updateStatsGoals(runs,passfail,gemsreq) {
    document.getElementById('statsEarned').style.display = 'none';
    document.getElementById('statsGoals').style.display = 'block';
    //runs
    const stats1 = calculateStats(runs);
    document.getElementById('meanR').textContent = numberWithCommas(stats1.mean.toFixed(2));
    document.getElementById('medianR').textContent = numberWithCommas(stats1.median);
    document.getElementById('minR').textContent = numberWithCommas(stats1.min);
    document.getElementById('maxR').textContent = numberWithCommas(stats1.max);
    document.getElementById('stdDevR').textContent = numberWithCommas(stats1.stdDev.toFixed(2));
    //pass or fail
    const passes = passfail.filter(value => value === true).length;
    const fails = passfail.filter(value => value === false).length;
    const passPercent = passes/fails;
    document.getElementById('pass').textContent = numberWithCommas(passes);
    document.getElementById('fail').textContent = numberWithCommas(fails);
    document.getElementById('passPercent').textContent = (passPercent*100).toFixed(2)+"%";
    //gems required
    const stats2 = calculateStats(gemsreq);
    document.getElementById('meanG').textContent = numberWithCommas(stats2.mean.toFixed(2));
    document.getElementById('medianG').textContent = numberWithCommas(stats2.median);
    document.getElementById('minG').textContent = numberWithCommas(stats2.min);
    document.getElementById('maxG').textContent = numberWithCommas(stats2.max);
    document.getElementById('stdDevG').textContent = numberWithCommas(stats2.stdDev.toFixed(2));
}

function updateChart(data,passfail,gemsreq) {
    const numBins = Math.floor(Math.log2(data.length))+1;
    const chartType = "bar";
    const color = "#ffb300";
    
    if (data.length === 0) {
        alert('Please enter valid numeric data');
        return;
    }

    const { bins, counts } = createBins(data, numBins);
    if (toggleType === "earnings") updateStatsEarned(data);
    if (toggleType === "goals") updateStatsGoals(data,passfail,gemsreq);

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

function toggleSimulationMode() {
    const earningsMode = document.querySelector('input[name="simulationMode"][value="earnings"]').checked;
    const displayType = earningsMode ? 'None' : 'Block';
    const extraParams = document.getElementsByClassName('goal-focus');
    for (let i = 0; i < extraParams.length; i++) {
        extraParams[i].style.display = displayType;
    }
    document.getElementById('freeHero').style.display = displayType;
    if (earningsMode) {
        toggleType = "earnings";
    }
    else {
        toggleType = "goals";
    }
    updateSummary();
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
    miscValues.push(document.querySelector('input[name="simulationMode"][value="earnings"]').checked);
    miscValues.push(document.getElementById('numSimulations').value);
    miscValues.push(document.getElementById('currentGems').value);
    miscValues.push(document.getElementById('gemsPerTicket').value);
    miscValues.push(document.getElementById('goalCost').value);
    miscValues.push(document.getElementById('freeGoal').value);
    return miscValues;
}

function loadMiscValues(miscValues) {
    document.getElementById('numTickets').value = miscValues[0];
    document.getElementById('ticketsToRun').value = miscValues[1];
    document.getElementById('currentTokens').value = miscValues[2];
    if (miscValues.length <= 3) return;
    document.querySelector('input[name="simulationMode"][value="earnings"]').checked = miscValues[3];
    document.querySelector('input[name="simulationMode"][value="goals"]').checked = !miscValues[3];
    if (miscValues[3]) toggleType = "earnings";
    else toggleType = "goals";
    document.getElementById('numSimulations').value = miscValues[4];
    document.getElementById('currentGems').value = miscValues[5];
    document.getElementById('gemsPerTicket').value = miscValues[6];
    document.getElementById('goalCost').value = miscValues[7];
    document.getElementById('freeGoal').value = miscValues[8];
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
toggleSimulationMode();
enableAutoSave();
loadConfig();
