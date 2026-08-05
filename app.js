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

    // Names are user input rendered into HTML strings; escape them so a
    // name like O'Brien <b>Jr</b> displays literally instead of being
    // parsed as markup, and always wrap attribute values in quotes so
    // spaces survive the save/load round-trip.
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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
            <tr data-id="${escapeHtml(id)}">
                <td class="coach-name" contenteditable="true">${escapeHtml(name)}</td>
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
            <tr data-id="${escapeHtml(id)}">
                <td class="player-name" contenteditable="true">${escapeHtml(name)}</td>
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
            <tr data-player-id="${escapeHtml(playerId)}" data-coach-id="${escapeHtml(coachId)}" data-player-name="${escapeHtml(playerName)}" data-coach-name="${escapeHtml(coachName)}">
                <td>${escapeHtml(playerName)}</td>
                <td>${escapeHtml(coachName)}</td>
                <td>
                    <button class="remove-player-to-coach-btn btn btn-danger btn-sm">X</button>
                </td>
            </tr>
        `);
    }

    function addToAssignPlayerToPlayerTable(playerOneName, playerOneId, playerTwoName, playerTwoId) {
        $('#playersToPlayersTable tbody').append(`
            <tr data-player-one-id="${escapeHtml(playerOneId)}" data-player-two-id="${escapeHtml(playerTwoId)}" data-player-one-name="${escapeHtml(playerOneName)}" data-player-two-name="${escapeHtml(playerTwoName)}">
                <td>${escapeHtml(playerOneName)}</td>
                <td>${escapeHtml(playerTwoName)}</td>
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
        headersHtml += `<th>${escapeHtml(coach.name)}</th>`;
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
            let rowHtml = `<tr data-id="${escapeHtml(player.id)}"><td class="player-name">${escapeHtml(player.name)}</td>`;

            coaches.forEach(coach => {
                const score = getScore(player.id, coach.id);
                rowHtml += `<td contenteditable="true" data-coach-id="${escapeHtml(coach.id)}" data-player-id="${escapeHtml(player.id)}">${escapeHtml(score)}</td>`;
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
            coaches.push({ name: name, id: id, players: [] });
        });

        if (coaches.length === 0) {
            $('#naiveAssignments').html('<p>Add at least one coach before assigning teams.</p>');
            return;
        }

        // Players with no valid scores draft at 0 so totals stay numeric.
        const roster = [];
        $('#playersTable tbody tr').each(function() {
            const name = $(this).find('.player-name').text().trim();
            const id = $(this).data('id');
            const averageScore = parseFloat($(this).find('.average-score').text().trim());
            roster.push({ name: name, id: id, averageScore: Number.isFinite(averageScore) ? averageScore : 0 });
        });

        const playerById = new Map(roster.map(p => [p.id, p]));
        const coachById = new Map(coaches.map(c => [c.id, c]));
        const placed = new Set();

        function place(player, coach) {
            if (!player || !coach || placed.has(player.id)) {
                return;
            }
            coach.players.push(player);
            placed.add(player.id);
        }

        // 1) Manual player->coach picks are fixed. Stale rows referencing
        //    removed players/coaches are skipped rather than crashing.
        const manualCoachByPlayer = new Map();
        $('#playersToCoachesTable tbody tr').each(function() {
            const player = playerById.get($(this).data('player-id'));
            const coach = coachById.get($(this).data('coach-id'));
            if (player && coach) {
                manualCoachByPlayer.set(player.id, coach);
                place(player, coach);
            }
        });

        // 2) Keep-together pairs, merged into groups (a<->b, b<->c form one
        //    group of three). A group with a manually assigned member joins
        //    that member's coach; otherwise it goes to the smallest team.
        const groupByPlayer = new Map();
        $('#playersToPlayersTable tbody tr').each(function() {
            const one = playerById.get($(this).data('player-one-id'));
            const two = playerById.get($(this).data('player-two-id'));
            if (!one || !two || one.id === two.id) {
                return;
            }
            const groupOne = groupByPlayer.get(one.id);
            const groupTwo = groupByPlayer.get(two.id);
            if (groupOne && groupTwo) {
                if (groupOne !== groupTwo) {
                    groupTwo.forEach(p => {
                        groupOne.push(p);
                        groupByPlayer.set(p.id, groupOne);
                    });
                }
            } else if (groupOne) {
                groupOne.push(two);
                groupByPlayer.set(two.id, groupOne);
            } else if (groupTwo) {
                groupTwo.push(one);
                groupByPlayer.set(one.id, groupTwo);
            } else {
                const group = [one, two];
                groupByPlayer.set(one.id, group);
                groupByPlayer.set(two.id, group);
            }
        });

        const smallestTeam = () => coaches.reduce((min, c) => c.players.length < min.players.length ? c : min);

        const seenGroups = new Set();
        groupByPlayer.forEach(group => {
            if (seenGroups.has(group)) {
                return;
            }
            seenGroups.add(group);
            const anchor = group.find(p => manualCoachByPlayer.has(p.id));
            const coach = anchor ? manualCoachByPlayer.get(anchor.id) : smallestTeam();
            group.forEach(p => place(p, coach));
        });

        // 3) Everyone else, highest score first, onto the team with the
        //    lowest total score (ties broken by fewest players) so manual
        //    picks and sibling groups are balanced around, not ignored.
        const teamTotal = c => c.players.reduce((sum, p) => sum + p.averageScore, 0);
        roster
            .filter(p => !placed.has(p.id))
            .sort((a, b) => b.averageScore - a.averageScore)
            .forEach(player => {
                const coach = coaches.reduce((best, c) => {
                    const bestTotal = teamTotal(best);
                    const candidateTotal = teamTotal(c);
                    if (candidateTotal < bestTotal) {
                        return c;
                    }
                    if (candidateTotal === bestTotal && c.players.length < best.players.length) {
                        return c;
                    }
                    return best;
                });
                place(player, coach);
            });

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
                        <td>${escapeHtml(player.name)}</td>
                        <td>${player.averageScore.toFixed(2)}</td>
                    </tr>
                `;
            });

            coachesTeamsHtml += `
                <div class="coach-team sub-section">
                    <h4>${escapeHtml(coach.name)}</h4>
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

        // Every roster player is placed by construction (manual, group, or
        // balance pass), so no unassigned-player reconciliation is needed.
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
            playerSelect.append(`<option value="${escapeHtml(player.id)}">${escapeHtml(player.name)}</option>`);
            playerSelectSibling.append(`<option value="${escapeHtml(player.id)}">${escapeHtml(player.name)}</option>`);
            siblingSelect.append(`<option value="${escapeHtml(player.id)}">${escapeHtml(player.name)}</option>`);
        });

        coaches.forEach(coach => {
            coachSelect.append(`<option value="${escapeHtml(coach.id)}">${escapeHtml(coach.name)}</option>`);
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

    // Delegated handlers: rows are added dynamically after page load, so
    // binding directly to the buttons present at ready-time leaves every
    // later-added row with a dead X button.
    $(document).on('click', '.remove-coach-btn', function() {
        const coachId = $(this).closest('tr').data('id');
        $(`tr[data-id="${coachId}"]`).remove();
        $(`tr[data-coach-id="${coachId}"]`).remove();
        saveToLocalStorage();
    });

    $(document).on('click', '.remove-player-btn', function() {
        const playerId = $(this).closest('tr').data('id');
        $(`tr[data-id="${playerId}"]`).remove();
        $(`tr[data-player-id="${playerId}"]`).remove();
        $(`tr[data-player-one-id="${playerId}"]`).remove();
        $(`tr[data-player-two-id="${playerId}"]`).remove();
        saveToLocalStorage();
    });

    $(document).on('click', '.remove-player-to-coach-btn', function() {
        const playerId = $(this).closest('tr').data('player-id');
        const coachId = $(this).closest('tr').data('coach-id');
        $(`tr[data-player-id="${playerId}"][data-coach-id="${coachId}"]`).remove();
        saveToLocalStorage();
    });

    $(document).on('click', '.remove-player-to-player-btn', function() {
        const playerOneId = $(this).closest('tr').data('player-one-id');
        const playerTwoId = $(this).closest('tr').data('player-two-id');
        $(`tr[data-player-one-id="${playerOneId}"][data-player-two-id="${playerTwoId}"]`).remove();
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
