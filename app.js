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
                <td>
                    <button class="remove-coach-btn btn btn-danger btn-sm">X</button>
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
                <td>
                    <button class="remove-player-btn btn btn-danger btn-sm">X</button>
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

    function addToAssignPlayerToCoachTable(playerName, playerId, coachName, coachId) {
        $('#playersToCoachesTable tbody').append(`
            <tr data-player-id=${playerId} data-coach-id=${coachId} data-player-name=${playerName} data-coach-name=${coachName}>
                <td>${playerName}</td>
                <td>${coachName}</td>
                <td>
                    <button class="remove-player-to-coach-btn btn btn-danger btn-sm">X</button>
                </td>
            </tr>
        `);
    }

    function addToAssignPlayerToPlayerTable(playerOneName, playerOneId, playerTwoName, playerTwoId) {
        $('#playersToPlayersTable tbody').append(`
            <tr data-player-one-id=${playerOneId} data-player-two-id=${playerTwoId} data-player-one-name=${playerOneName} data-player-two-name=${playerTwoName}>
                <td>${playerOneName}</td>
                <td>${playerTwoName}</td>
                <td>
                    <button class="remove-player-to-player-btn btn btn-danger btn-sm">X</button>
                </td>
            </tr>
        `);
    }

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

        const assignedPlayersToCoaches = [];
        $('#playersToCoachesTable tbody tr').each(function() {
            const playerName = $(this).data('player-name');
            const playerId = $(this).data('player-id');
            const coachName = $(this).data('coach-name');
            const coachId = $(this).data('coach-id');
            assignedPlayersToCoaches.push({ playerName, playerId, coachName, coachId });
        });

        const assignedPlayersToPlayers = [];
        $('#playersToPlayersTable tbody tr').each(function() {
            const playerOneName = $(this).data('player-one-name');
            const playerOneId = $(this).data('player-one-id');
            const playerTwoName = $(this).data('player-two-name');
            const playerTwoId = $(this).data('player-two-id');
            assignedPlayersToPlayers.push({ playerOneName, playerOneId, playerTwoName, playerTwoId });
        });

        localStorage.setItem('coaches', JSON.stringify(coaches));
        localStorage.setItem('players', JSON.stringify(players));
        localStorage.setItem('scores', JSON.stringify(scores));
        localStorage.setItem('assignedPlayersToCoaches', JSON.stringify(assignedPlayersToCoaches));
        localStorage.setItem('assignedPlayersToPlayers', JSON.stringify(assignedPlayersToPlayers));
        if (!skipUpdates) {
            updateSections();
            populateSelectors();
        }
    }

    // Function to load data from local storage
    function loadFromLocalStorage() {
        const coaches = JSON.parse(localStorage.getItem('coaches') || '[]');
        const players = JSON.parse(localStorage.getItem('players') || '[]');
        const scores = JSON.parse(localStorage.getItem('scores') || '[]');
        const assignedPlayersToCoaches = JSON.parse(localStorage.getItem('assignedPlayersToCoaches') || '[]');
        const assignedPlayersToPlayers = JSON.parse(localStorage.getItem('assignedPlayersToPlayers') || '[]');

        coaches.forEach(coach => addToCoachesTable(coach.name, coach.id));
        players.forEach(player => addToPlayersTable(player.name, player.id));
        assignedPlayersToCoaches.forEach(assigned => addToAssignPlayerToCoachTable(assigned.playerName, assigned.playerId, assigned.coachName, assigned.coachId));
        assignedPlayersToPlayers.forEach(assigned => addToAssignPlayerToPlayerTable(assigned.playerOneName, assigned.playerOneId, assigned.playerTwoName, assigned.playerTwoId));
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
            coaches.push({ name: name, id: id, players: [], assigned: [] });
        });

        let players = [];
        $('#playersTable tbody tr').each(function() {
            const name = $(this).find('.player-name').text().trim();
            const id = $(this).data('id');
            const averageScore = $(this).find('.average-score').text().trim();
            players.push({ name: name, id: id, averageScore: parseFloat(averageScore) });
        });

        // Sort players by average score (descending)
        players.sort((a, b) => b.averageScore - a.averageScore);

        // Function to assign a player to a coach
        function assignPlayerToCoach(player, coach) {
            console.log('assignPlayerToCoach', player.name, coach.name);
            coach.assigned.push(player);
        }

        $('#playersToCoachesTable tbody tr').each(function() {
            const playerId = $(this).data('player-id');
            const coachId = $(this).data('coach-id');
            const coach = coaches.find(c => c.id === coachId);
            const player = players.find(p => p.id === playerId);
            assignPlayerToCoach(player, coach);
            players = players.filter(p => p.id !== player.id); // Remove assigned child from players list
        });

        const assignedPlayersToPlayers = new Map();
        $('#playersToPlayersTable tbody tr').each(function() {
            const playerOneId = $(this).data('player-one-id');
            const playerTwoId = $(this).data('player-two-id');
            const playerOne = players.find(p => p.id === playerOneId);
            const playerTwo = players.find(p => p.id === playerTwoId);
        
            if (!assignedPlayersToPlayers.has(playerOneId)) {
                assignedPlayersToPlayers.set(playerOneId, [playerOne, playerTwo]);
            } else {
                const existingGroup = assignedPlayersToPlayers.get(playerOneId);
                if (!existingGroup.find(p => p.id === playerTwoId)) {
                    existingGroup.push(playerTwo);
                }
            }
        });
        
        assignedPlayersToPlayers.forEach((siblingGroup) => {
            let minPlayersCount = Math.min(...coaches.map(coach => coach.players.length));
            let availableCoaches = coaches.filter(coach => coach.players.length === minPlayersCount);

            const randomCoachIndex = Math.floor(Math.random() * availableCoaches.length);
            const selectedCoach = availableCoaches[randomCoachIndex];
        
            // Assign the sibling group to the selected coach
            siblingGroup.forEach(sibling => {
                assignPlayerToCoach(sibling, selectedCoach);
                players = players.filter(p => p.id !== sibling.id); // Remove assigned sibling from players list
            });
        });

        // Assign the remaining players to coaches
        let nextCoachIndex = 0;
        players.forEach(player => {
            let playerAssigned = false;
            while (!playerAssigned) {
                for (let i = nextCoachIndex; i < coaches.length; i++) {
                    const coach = coaches[i];
    
                    // Check if there's a higher scored player in the assigned list
                    const higherScorePlayerIndex = coach.assigned.findIndex(p => p.averageScore > player.averageScore);
                    if (higherScorePlayerIndex !== -1) {
                        // Swap the player with the higher scored player
                        const higherScorePlayer = coach.assigned[higherScorePlayerIndex];
                        coach.assigned.splice(higherScorePlayerIndex, 1); // Remove higher scored player from assigned list
                        coach.players.push(higherScorePlayer); // Reinsert higher scored player back into the players list
                        nextCoachIndex++;
                        if (nextCoachIndex >= coaches.length) {
                            nextCoachIndex = 0;
                        }
                        continue; // try giving player to next coach
                    }
    
                    coach.players.push(player);
                    nextCoachIndex++;
                    if (nextCoachIndex >= coaches.length) {
                        nextCoachIndex = 0;
                    }
                    playerAssigned = true;
                    break;
                }
            }
        });

        // Go through each coach and clear out assigned list
        coaches.forEach(coach => {
            coach.assigned.forEach(assignedPlayer => {
                coach.players.push(assignedPlayer);
            });
        });

        console.log(coaches);

        // Update the coaches teams section
        let coachesTeamsHtml = '';
        const playersAssignedToTeams = [];
        coaches.forEach(coach => {
            let totalScore = 0;
            let totalPlayers = 0;
            let playersHtml = '';
            coach.players.forEach(player => {
                totalPlayers++;
                playersAssignedToTeams.push(player);
                totalScore += player.averageScore;
                playersHtml += `
                    <tr>
                        <td>${player.name}</td>
                        <td>${player.averageScore}</td>
                    </tr>
                `;
            });

            coachesTeamsHtml += `
                <div class="coach-team sub-section">
                    <h4>${coach.name}</h4>
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
                            <tr>
                                <td><strong>Total Players</strong></td>
                                <td><strong>${totalPlayers}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        });

        $('#naiveAssignments').html(coachesTeamsHtml);

        let playersInLeague = [];
        $('#playersTable tbody tr').each(function() {
            const name = $(this).find('.player-name').text().trim();
            const id = $(this).data('id');
            const averageScore = $(this).find('.average-score').text().trim();
            playersInLeague.push({ name: name, id: id, averageScore: parseFloat(averageScore) });
        });

        // Find unassigned players
        const unassignedPlayers = playersInLeague.filter(player => {
            return !playersAssignedToTeams.some(assignedPlayer => assignedPlayer.id === player.id);
        });
        if (unassignedPlayers.length > 0) {
            console.log('These players did not get assigned to a team:', unassignedPlayers);
        } else {
            console.log('All players were assigned to a team.');
        }
        console.log('totalPlayersInLeague', playersInLeague.length);
        console.log('totalPlayersAssignedToTeams', playersAssignedToTeams.length);
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

    // Populate player and coach selectors
    function populateSelectors() {
        const players = [];
        const coaches = [];

        $('#playersTable tbody tr').each(function() {
            const name = $(this).find('.player-name').text().trim();
            const id = $(this).data('id');
            players.push({ name: name, id: id });
        });

        $('#coachesTable tbody tr').each(function() {
            const name = $(this).find('.coach-name').text().trim();
            const id = $(this).data('id');
            coaches.push({ name: name, id: id });
        });

        // Populate player and coach selects
        const playerSelect = $('#playerSelect');
        const coachSelect = $('#coachSelect');
        const playerSelectSibling = $('#playerSelectSibling');
        const siblingSelect = $('#siblingSelect');

        playerSelect.empty();
        coachSelect.empty();
        playerSelectSibling.empty();
        siblingSelect.empty();

        players.forEach(player => {
            playerSelect.append(`<option value="${player.id}">${player.name}</option>`);
            playerSelectSibling.append(`<option value="${player.id}">${player.name}</option>`);
            siblingSelect.append(`<option value="${player.id}">${player.name}</option>`);
        });

        coaches.forEach(coach => {
            coachSelect.append(`<option value="${coach.id}">${coach.name}</option>`);
        });
    }

    // Handle manual player to coach assignment
    $('#assignPlayerToCoach').click(function() {
        const playerId = $('#playerSelect').val();
        const playerName = $('#playerSelect :selected').text();
        const coachId = $('#coachSelect').val();
        const coachName = $('#coachSelect :selected').text();
        addToAssignPlayerToCoachTable(playerName, playerId, coachName, coachId);
        saveToLocalStorage(true);
    });

    $('#assignSibling').click(function() {
        const playerOneId = $('#playerSelectSibling').val();
        const playerOneName = $('#playerSelectSibling :selected').text();
        const playerTwoId = $('#siblingSelect').val();
        const playerTwoName = $('#siblingSelect :selected').text();
        addToAssignPlayerToPlayerTable(playerOneName, playerOneId, playerTwoName, playerTwoId);
        saveToLocalStorage(true);
    });

    // Initialize selectors
    populateSelectors();

    $('#closeBannerButton').click(function() {
        $('#banner').fadeOut();
    });

    $('.remove-coach-btn').click(function() {
        const coachId = $(this).closest('tr').data('id');
        $(`tr[data-id=${coachId}]`).remove();
        $(`tr[data-coach-id=${coachId}]`).remove();
        saveToLocalStorage();
    });

    $('.remove-player-btn').click(function() {
        const playerId = $(this).closest('tr').data('id');
        $(`tr[data-id=${playerId}]`).remove();
        $(`tr[data-player-id=${playerId}]`).remove();
        $(`tr[data-player-one-id=${playerId}]`).remove();
        $(`tr[data-player-two-id=${playerId}]`).remove();
        saveToLocalStorage();
    });

    $('.remove-player-to-coach-btn').click(function() {
        const playerId = $(this).closest('tr').data('player-id');
        const coachId = $(this).closest('tr').data('coach-id');
        $(`tr[data-player-id=${playerId}][data-coach-id=${coachId}]`).remove();
        saveToLocalStorage();
    });

    $('.remove-player-to-player-btn').click(function() {
        const playerOneId = $(this).closest('tr').data('player-one-id');
        const playerTwoId = $(this).closest('tr').data('player-two-id');
        $(`tr[data-player-one-id=${playerOneId}][data-player-two-id=${playerTwoId}]`).remove();
        saveToLocalStorage();
    });

    $('#clearAllLocalData').click(function() {
        $('#clearAllLocalDataConfirm').removeClass('hidden');
    });

    $('#clearAllLocalDataConfirm').click(function() {
        localStorage.clear();
        window.location.reload();
    });
});
