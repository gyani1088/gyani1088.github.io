document.addEventListener("DOMContentLoaded", () => {
    const val = [10, 40, 30, 50];
    const weight = [5, 4, 6, 3];
    const W = 10;
    const n = val.length;
    const maxVal = Math.max(...val);

    const tableContainer = document.getElementById("table-container");
    const startBtn = document.getElementById("start-btn");

    // Build Table
    const table = document.createElement("table");
    
    // Top Row (j labels)
    const trHeader = document.createElement("tr");
    const thAxis = document.createElement("th");
    thAxis.className = "axis-label";
    thAxis.innerText = "i \\ j";
    trHeader.appendChild(thAxis);
    
    for (let j = 0; j <= W; j++) {
        const th = document.createElement("th");
        th.className = "col-label";
        th.innerText = "j=" + j;
        trHeader.appendChild(th);
    }
    table.appendChild(trHeader);

    // Rows for items
    for (let i = 0; i <= n; i++) {
        const tr = document.createElement("tr");
        
        // Left Column (i labels and item visuals)
        const tdRowLabel = document.createElement("th");
        tdRowLabel.className = "row-label " + (i === 0 ? "row-label-0" : "");
        tdRowLabel.id = `row-label-${i}`;
        
        if (i === 0) {
            tdRowLabel.innerText = "i=0";
        } else {
            const idx = i - 1;
            const wBarWidth = Math.max(10, (val[idx] / maxVal) * 100);
            tdRowLabel.innerHTML = `
                <div class="item-panel">
                    <div>i=${i}</div>
                    <div class="weight-circle">${weight[idx]}</div>
                    <div class="value-bar-container">
                        <div class="value-bar-fill" style="width: ${wBarWidth}%"></div>
                        <div class="value-bar-text">v=${val[idx]}</div>
                    </div>
                </div>
            `;
        }
        tr.appendChild(tdRowLabel);

        // DP Cells
        for (let j = 0; j <= W; j++) {
            const td = document.createElement("td");
            td.className = "dp-cell";
            td.id = `cell-${i}-${j}`;
            td.innerHTML = `
                <div class="dp-val"></div>
                <div class="dp-bottom">
                    <div class="chosen-circles"></div>
                    <div class="chosen-text"></div>
                </div>
            `;
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    tableContainer.appendChild(table);

    // Helper functions for animation
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    const setCellData = (i, j, value, chosenList) => {
        const cell = document.getElementById(`cell-${i}-${j}`);
        cell.querySelector(".dp-val").innerText = value;
        
        const circlesDiv = cell.querySelector(".chosen-circles");
        circlesDiv.innerHTML = "";
        chosenList.forEach(w => {
            const circle = document.createElement("div");
            circle.className = "small-circle";
            circle.innerText = w;
            circlesDiv.appendChild(circle);
        });
        
        cell.querySelector(".chosen-text").innerText = chosenList.length ? `[${chosenList.join(", ")}]` : "[]";
    };

    const highlight = (elementId, turnOn) => {
        const el = document.getElementById(elementId);
        if (el) {
            if (turnOn) el.classList.add("highlight");
            else el.classList.remove("highlight");
        }
    };

    // Main DP Animation Logic
    const runDpAnimation = async (delayMs) => {
        let dp = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));
        let chosen = Array.from({ length: n + 1 }, () => Array(W + 1).fill([]));

        // Initialize row 0
        for (let j = 0; j <= W; j++) {
            setCellData(0, j, 0, []);
            highlight(`cell-0-${j}`, true);
            await sleep(delayMs);
            highlight(`cell-0-${j}`, false);
        }

        // Initialize col 0
        for (let i = 0; i <= n; i++) {
            setCellData(i, 0, 0, []);
            highlight(`cell-${i}-0`, true);
            await sleep(delayMs);
            highlight(`cell-${i}-0`, false);
        }

        // Main nested loops
        for (let i = 1; i <= n; i++) {
            for (let j = 1; j <= W; j++) {
                highlight(`cell-${i}-${j}`, true);
                await sleep(delayMs);

                const currentWeight = weight[i - 1];
                const currentValue = val[i - 1];

                if (currentWeight > j) {
                    highlight(`cell-${i - 1}-${j}`, true);
                    await sleep(Math.max(80, delayMs / 3));
                    highlight(`cell-${i - 1}-${j}`, false);

                    dp[i][j] = dp[i - 1][j];
                    chosen[i][j] = [...chosen[i - 1][j]];
                } else {
                    const includeVal = currentValue + dp[i - 1][j - currentWeight];
                    const excludeVal = dp[i - 1][j];

                    if (includeVal > excludeVal) {
                        highlight(`row-label-${i}`, true);
                        highlight(`cell-${i - 1}-${j - currentWeight}`, true);
                        await sleep(Math.max(120, delayMs / 3));
                        
                        highlight(`row-label-${i}`, false);
                        highlight(`cell-${i - 1}-${j - currentWeight}`, false);

                        dp[i][j] = includeVal;
                        chosen[i][j] = [...chosen[i - 1][j - currentWeight], currentWeight];
                    } else {
                        highlight(`cell-${i - 1}-${j}`, true);
                        await sleep(Math.max(80, delayMs / 3));
                        highlight(`cell-${i - 1}-${j}`, false);

                        dp[i][j] = excludeVal;
                        chosen[i][j] = [...chosen[i - 1][j]];
                    }
                }

                setCellData(i, j, dp[i][j], chosen[i][j]);
                await sleep(delayMs);
                highlight(`cell-${i}-${j}`, false);
            }
        }

        setTimeout(() => alert(`Update complete. Max value is at (i=${n},j=${W})=${dp[n][W]}`), 100);
        startBtn.disabled = false;
    };

    startBtn.addEventListener("click", () => {
        startBtn.disabled = true;
        // Reset grid visuals before starting
        for(let i=0; i<=n; i++) {
            for(let j=0; j<=W; j++) {
                document.getElementById(`cell-${i}-${j}`).querySelector(".dp-val").innerText = "";
                document.getElementById(`cell-${i}-${j}`).querySelector(".chosen-circles").innerHTML = "";
                document.getElementById(`cell-${i}-${j}`).querySelector(".chosen-text").innerText = "";
            }
        }
        runDpAnimation(800);
    });
});
