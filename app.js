$(document).ready(function() {
    let ignoreBlur = false;

    // Function to generate a simple UUID
    function generateUUID() {
        return 'xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0,
                    v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Load data from local storage on page load
    loadFromLocalStorage();

    // Initially show Instructions
    showSection('instructions');

    // Handle navigation
    $('#navInstructions').click(function() {
        showSection('instructions');
    });

    $('#navCoaches').click(function() {
        showSection('coaches');
    });

    $('#navPlayers').click(function() {
        showSection('players');
    });

    $('#navScores').click(function() {
        showSection('scores');
    });

    $('#navAssignments').click(function() {
        showSection('assignments');
    });

    // Function to show the selected section and hide others
    function showSection(sectionId) {
        $('.section').addClass('d-none'); // Hide all sections
        $('#' + sectionId).removeClass('d-none'); // Show the selected section
        $('.nav-link').removeClass('active'); // Remove active class from all nav links
        $('#nav' + sectionId.charAt(0).toUpperCase() + sectionId.slice(1)).addClass('active'); // Set active class
    }

    // Handle adding coaches
    $('#addCoachForm').submit(function(event) {
        event.preventDefault();
        const coachName = $('#coachName').val().trim();
        if (coachName) {
            upsertCoach(coachName);
            $('#coachName').val(''); // Clear the input field
        }
    });

    // Function to upsert a coach
    function upsertCoach(name, id = null) {
        if (!id) {
            id = generateUUID();
        }
        addToCoachesTable(name, id);
        saveToLocalStorage();
    }

    function addToCoachesTable(name, id) {
        $('#coachesTable tbody').append(`
            <tr data-id=${id}>
                <td class="coach-name" contenteditable="true">${name}</td>
                <td>
                    <button class="btn btn-sm btn-secondary move-up">↑</button>
                    <button class="btn btn-sm btn-secondary move-down">↓</button>
                </td>
            </tr>
        `);
    }

    // Handle adding players
    $('#addPlayerForm').submit(function(event) {
        event.preventDefault();
        const playerName = $('#playerName').val().trim();
        if (playerName) {
            upsertPlayer(playerName);
            $('#playerName').val(''); // Clear the input field
        }
    });

    // Function to upsert a player
    function upsertPlayer(name, id = null) {
        if (!id) {
            id = generateUUID();
        }
        addToPlayersTable(name, id);
        saveToLocalStorage();
    }

    function addToPlayersTable(name, id) {
        $('#playersTable tbody').append(`
            <tr data-id="${id}">
                <td class="player-name" contenteditable="true">${name}</td>
                <td class="average-score">unknown</td>
                <td>
                    <button class="btn btn-sm btn-secondary move-up">↑</button>
                    <button class="btn btn-sm btn-secondary move-down">↓</button>
                </td>
            </tr>
        `);
    }

    // Handle moving rows up and down
    $('#coachesTable').on('click', '.move-up', function() {
        const $row = $(this).closest('tr');
        const $prevRow = $row.prev();
        if ($prevRow.length) {
            $row.insertBefore($prevRow);
            saveToLocalStorage();
        }
    });

    $('#coachesTable').on('click', '.move-down', function() {
        const $row = $(this).closest('tr');
        const $nextRow = $row.next();
        if ($nextRow.length) {
            $row.insertAfter($nextRow);
            saveToLocalStorage();
        }
    });

    $('#playersTable').on('click', '.move-up', function() {
        const $row = $(this).closest('tr');
        const $prevRow = $row.prev();
        if ($prevRow.length) {
            $row.insertBefore($prevRow);
            saveToLocalStorage();
        }
    });

    $('#playersTable').on('click', '.move-down', function() {
        const $row = $(this).closest('tr');
        const $nextRow = $row.next();
        if ($nextRow.length) {
            $row.insertAfter($nextRow);
            saveToLocalStorage();
        }
    });

    // Handle blur events with consideration of ignoreBlur flag
    $('tbody').on('blur', 'td', function() {
        if (!ignoreBlur) {
            saveToLocalStorage();
        }
    });

    // Function to update average scores in the players section
    function updatePlayersSection() {
        $('#playersTable tbody tr').each(function() {
            const playerId = $(this).data('id');
            const scores = [];
            
            $('#scoresTable tbody tr').each(function() {
                $(this).find('td').each(function() {
                    if ($(this).data('player-id') === playerId) {
                        const scoreText = $(this).text().trim();
                        const score = parseFloat(scoreText);
    
                        // Only add valid numbers to the scores array
                        if (!isNaN(score)) {
                            scores.push(score);
                        }
                    }
                });
            });
    
            // Calculate the average score, and if no valid scores, leave it as empty
            const averageScore = scores.length ? (scores.reduce((a, b) => a + b) / scores.length).toFixed(2) : '';
            $(this).find('.average-score').text(averageScore);
        });
    }    

    // Function to update the scores section
    function updateScoresSection() {
        const coaches = [];
        $('#coachesTable tbody tr').each(function() {
            const name = $(this).find('.coach-name').text().trim();
            const id = $(this).data('id');
            coaches.push({ name: name, id: id });
        });

        const players = [];
        $('#playersTable tbody tr').each(function() {
            const name = $(this).find('.player-name').text().trim();
            const id = $(this).data('id');
            players.push({ name: name, id: id });
        });

    // Update table headers
    let headersHtml = `<th>Player Name</th>`;
    coaches.forEach(coach => {
        headersHtml += `<th>${coach.name}</th>`;
    });
    
    if ($('#scoresTable thead').length === 0) {
        // Create thead if not exists
        $('#scoresTable').append(`
            <thead>
                <tr>${headersHtml}</tr>
            </thead>
            <tbody></tbody>
        `);
    } else {
        // Update existing headers
        $('#scoresTable thead tr').html(headersHtml);
    }

    // Update table rows
    const existingPlayerIds = $('#scoresTable tbody tr').map(function() {
        return $(this).data('id');
    }).get();

    players.forEach(player => {
        if (!existingPlayerIds.includes(player.id)) {
            let rowHtml = `<tr data-id="${player.id}"><td class="player-name">${player.name}</td>`;

            coaches.forEach(coach => {
                const score = getScore(player.id, coach.id);
                rowHtml += `<td contenteditable="true" data-coach-id="${coach.id}" data-player-id="${player.id}">${score}</td>`;
            });
            rowHtml += '</tr>';
            $('#scoresTable tbody').append(rowHtml);
        } else {
            // update existing data
            coaches.forEach(coach => {
                const score = getScore(player.id, coach.id);
                $(`td[data-coach-id="${coach.id}"][data-player-id="${player.id}"]`).text(score);
            });
        }
    });

    // Remove rows for players no longer in the list
    $('#scoresTable tbody tr').each(function() {
        const playerId = $(this).data('id');
        if (!players.some(player => player.id === playerId)) {
            $(this).remove();
        }
    });
    }

    // Function to get the score for a given player and coach from localStorage
    function getScore(playerId, coachId) {
        const scores = JSON.parse(localStorage.getItem('scores') || '[]');
        const scoreEntry = scores.find(score => score.playerId === playerId && score.coachId === coachId);
        return scoreEntry ? scoreEntry.score : '';
    }

    // Function to save data to local storage
    function saveToLocalStorage(skipUpdates = false) {
        const coaches = [];
        $('#coachesTable tbody tr').each(function() {
            const name = $(this).find('.coach-name').text().trim();
            const id = $(this).data('id');
            coaches.push({ name: name, id: id });
        });

        const players = [];
        $('#playersTable tbody tr').each(function() {
            const name = $(this).find('.player-name').text().trim();
            const id = $(this).data('id');
            const averageScore = $(this).find('.average-score').text().trim();
            players.push({ name: name, id: id, averageScore: averageScore });
        });

        const scores = [];
        $('#scoresTable tbody tr').each(function() {
            $(this).find('td').each(function() {
                const playerId = $(this).data('player-id');
                const coachId = $(this).data('coach-id');
                if (coachId) {
                    const score = $(this).text().trim();
                    scores.push({ playerId: playerId, coachId: coachId, score: score });
                }
            });
        });

        localStorage.setItem('coaches', JSON.stringify(coaches));
        localStorage.setItem('players', JSON.stringify(players));
        localStorage.setItem('scores', JSON.stringify(scores));
        if (!skipUpdates) {
            updateSections();
        }
    }

    // Function to load data from local storage
    function loadFromLocalStorage() {
        const coaches = JSON.parse(localStorage.getItem('coaches') || '[]');
        const players = JSON.parse(localStorage.getItem('players') || '[]');
        const scores = JSON.parse(localStorage.getItem('scores') || '[]');

        nextCoachId = coaches.length + 1; // Set nextCoachId based on existing data
        nextPlayerId = players.length + 1; // Set nextPlayerId based on existing data

        coaches.forEach(coach => addToCoachesTable(coach.name, coach.id));
        players.forEach(player => addToPlayersTable(player.name, player.id));
        updateSections();
    }

    function updateSections() {
        updateScoresSection();
        updatePlayersSection();
    }

    // Assign teams based on average scores
    $('#assignTeamsNaive').click(function() {

        const coaches = [];
        $('#coachesTable tbody tr').each(function() {
            const name = $(this).find('.coach-name').text().trim();
            const id = $(this).data('id');
            coaches.push({ name: name, id: id, players: [] });
        });

        const players = [];
        $('#playersTable tbody tr').each(function() {
            const name = $(this).find('.player-name').text().trim();
            const id = $(this).data('id');
            const averageScore = $(this).find('.average-score').text().trim();
            players.push({ name: name, id: id, averageScore: parseFloat(averageScore) });
        });

        // Sort players by average score (descending)
        players.sort((a, b) => b.averageScore - a.averageScore);

        // Distribute players among coaches
        let coachIndex = 0;
        players.forEach(player => {
            coaches[coachIndex].players.push(player);
            coachIndex = (coachIndex + 1) % coaches.length;
        });

        console.log(coaches);

        // Update the coaches teams section
        let coachesTeamsHtml = '';
        coaches.forEach(coach => {
            let totalScore = 0;
            let playersHtml = '';
            coach.players.forEach(player => {
                totalScore += player.averageScore;
                playersHtml += `
                    <tr>
                        <td>${player.name}</td>
                        <td>${player.averageScore}</td>
                    </tr>
                `;
            });

            coachesTeamsHtml += `
                <div class="coach-team">
                    <h3>${coach.name}</h3>
                    <table class="table mt-3">
                        <thead>
                            <tr>
                                <th>Player Name</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${playersHtml}
                            <tr>
                                <td><strong>Total Score</strong></td>
                                <td><strong>${totalScore.toFixed(2)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        });

        $('#naiveAssignments').html(coachesTeamsHtml);
    });

    function focusCell(cell) {
        const $cell = $(cell);
    
        ignoreBlur = true; // Temporarily ignore blur
        saveToLocalStorage(true);
        cell.focus();
        setTimeout(() => ignoreBlur = false, 0); // Re-enable blur
    
        // Select all text if the cell contains text
        if ($cell.text().trim().length > 0) {
            const range = document.createRange();
            const selection = window.getSelection();
    
            range.selectNodeContents(cell);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    function onKeyDown(e, self) {
        const $currentCell = $(self);
        const $table = $currentCell.closest('table');
        const $rows = $table.find('tbody tr');
        const $cells = $currentCell.closest('tr').find('td');
    
        const currentRowIndex = $rows.index($currentCell.closest('tr'));
        const currentCellIndex = $cells.index($currentCell);
    
        switch (e.key) {
            case 'Tab':
                e.preventDefault(); // Prevent default tab behavior
    
                if (e.shiftKey) { // Handle Shift+Tab for reverse navigation
                    let $prevCell = $cells.eq(currentCellIndex - 1);
                    if (currentCellIndex === 1) {
                        let $prevRow = $rows.eq(currentRowIndex - 1);
                        if ($prevRow.length) {
                            const $prevRowCells = $prevRow.find('td');
                            $prevCell = $prevRowCells.eq($prevRowCells.length - 1);
                        }
                    }
    
                    if ($prevCell.length) {
                        focusCell($prevCell[0]);
                    }
                } else { // Handle Tab for forward navigation
                    let $nextCell = $cells.eq(currentCellIndex + 1);
                    if (!$nextCell.length) {
                        let $nextRow = $rows.eq(currentRowIndex + 1);
                        if ($nextRow.length) {
                            const $nextRowCells = $nextRow.find('td');
                            $nextCell = $nextRowCells.eq(1);
                        }
                    }
    
                    if ($nextCell.length) {
                        focusCell($nextCell[0]);
                    }
                }
                break;
    
            case 'Enter':
                e.preventDefault(); // Prevent default enter behavior
    
                if (e.shiftKey) { // Handle Shift+Enter for reverse row navigation
                    let $prevRow = $rows.eq(currentRowIndex - 1);
                    if ($prevRow.length) {
                        const $prevRowCells = $prevRow.find('td');
                        const $prevCell = $prevRowCells.eq(currentCellIndex);
    
                        if ($prevCell.length) {
                            focusCell($prevCell[0]);
                        } else {
                            focusCell($prevRowCells.eq($prevRowCells.length - 1)[0]);
                        }
                    }
                } else { // Handle Enter for forward row navigation
                    let $nextRow = $rows.eq(currentRowIndex + 1);
                    if ($nextRow.length) {
                        const $nextRowCells = $nextRow.find('td');
                        const $nextCell = $nextRowCells.eq(currentCellIndex);
    
                        if ($nextCell.length) {
                            focusCell($nextCell[0]);
                        } else {
                            focusCell($nextRowCells.eq(0)[0]);
                        }
                    }
                }
                break;
    
            default:
                break;
        }
    }    

    // Handle keydown events in the scores section
    $('#scoresTable').on('keydown', 'td', function(e) {
        onKeyDown(e, this);
    });

});
