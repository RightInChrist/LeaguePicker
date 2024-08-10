$(document).ready(function() {
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

    // Handle editing tables
    $('tbody').on('blur', 'td', function() {
        saveToLocalStorage();
    });

    // Function to update average scores in the players section
    function updatePlayersSection() {
        $('#playersTable tbody tr').each(function() {
            const playerId = $(this).data('id');
            const scores = [];
            $('#scoresTable tbody tr').each(function() {
                $(this).find('td').each(function() {
                    if ($(this).data('player-id') === playerId) {
                        const score = parseFloat($(this).text().trim()) || 0;
                        scores.push(score);
                    }
                });
            });
            const averageScore = scores.length ? (scores.reduce((a, b) => a + b) / scores.length).toFixed(2) : 0;
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
        let rowInner = `<td class="player-name">${player.name}</td>`;
        let rowHtml = `<tr data-id="${player.id}">`;

        coaches.forEach(coach => {
            const score = getScore(player.id, coach.id);
            rowInner += `<td contenteditable="true" data-coach-id="${coach.id}" data-player-id="${player.id}">${score}</td>`;
        });
        rowHtml += rowInner;
        rowHtml += '</tr>';

        if (existingPlayerIds.includes(player.id)) {
            // Update existing row
            $(`#scoresTable tbody tr[data-id="${player.id}"]`).html(rowInner);
        } else {
            // Append new row
            $('#scoresTable tbody').append(rowHtml);
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
    function saveToLocalStorage() {
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
        updateSections();
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
    $('#assignTeams').click(function() {
        const players = [];
        $('#playersTable tbody tr').each(function() {
            const name = $(this).find('.player-name').text().trim();
            const averageScore = parseFloat($(this).find('.average-score').text().trim()) || 0;
            players.push({ name: name, averageScore: averageScore });
        });

        // Sort players by average score (descending)
        players.sort((a, b) => b.averageScore - a.averageScore);

        // Simple assignment logic: Distribute players into teams
        const teams = [];
        players.forEach((player, index) => {
            const teamNumber = index % 3 + 1; // Assuming 3 teams
            if (!teams[teamNumber - 1]) {
                teams[teamNumber - 1] = [];
            }
            teams[teamNumber - 1].push(player);
        });

        // Update the assignments table
        let assignmentsHtml = '';
        players.forEach(player => {
            const team = teams.flat().find(p => p.name === player.name);
            assignmentsHtml += `
                <tr>
                    <td>${player.name}</td>
                    <td>Team ${teams.findIndex(t => t.includes(team)) + 1}</td>
                </tr>
            `;
        });
        $('#assignmentsTable tbody').html(assignmentsHtml);
    });

    // Handle keydown events in the scores section
    $('#scoresTable').on('keydown', 'td', function(e) {
        const $currentCell = $(this);
        console.log($currentCell.text());
        const $table = $currentCell.closest('table');
        const $rows = $table.find('tbody tr');
        const $cells = $currentCell.closest('tr').find('td');

        let currentRowIndex = $rows.index($currentCell.closest('tr'));
        let currentCellIndex = $cells.index($currentCell);

        switch (e.key) {
            case 'Tab':
                e.preventDefault(); // Prevent default tab behavior

                let $nextCell = $cells.eq(currentCellIndex + 1);

                if (!$nextCell.length) {
                    let $nextRow = $rows.eq(currentRowIndex + 1);
                    if ($nextRow.length) {
                        const $nextRowCells = $nextRow.find('td');
                        $nextCell = $nextRowCells.eq(currentCellIndex);
                    }
                }

                if ($nextCell.length) {
                    $nextCell.get(0).focus();
                }
                break;

            case 'Enter':
                e.preventDefault(); // Prevent default enter behavior

                let $nextRow = $rows.eq(currentRowIndex + 1);
                if ($nextRow.length) {
                    const $nextRowCells = $nextRow.find('td');
                    const $nextCell = $nextRowCells.eq(currentCellIndex);

                    if ($nextCell.length) {
                        $nextCell.get(0).focus();
                    } else {
                        $nextRowCells.get(0).focus();
                    }
                }
                break;

            default:
                break;
        }
    });
});
