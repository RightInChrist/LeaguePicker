$(document).ready(function() {
    let nextCoachId = 1;
    let nextPlayerId = 1;

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
            id = nextCoachId++;
        }
        addToCoachesTable(name, id);
        saveToLocalStorage();
    }

    function addToCoachesTable(name, id) {
        $('#coachesTable tbody').append(`
            <tr data-id=${id}>
                <td class="coach-name" contenteditable="true">${name}</td>
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
            id = nextPlayerId++;
        }
        addToPlayersTable(name, id);
        saveToLocalStorage();
    }

    function addToPlayersTable(name, id) {
        $('#playersTable tbody').append(`
            <tr data-id="${id}">
                <td class="player-name" contenteditable="true">${name}</td>
                <td class="average-score">unknown</td>
            </tr>
        `);
    }

    // Handle editing tables
    $('tbody').on('blur', 'td', function() {
        console.log('tbody blur');
        saveToLocalStorage();
    });

    // Function to update average scores in the players section
    function updatePlayersSection() {
        console.log('updatePlayersSection');
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
        console.log('updateScoresSection');
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

        console.log('save coaches', coaches);
        console.log('save players', players);
        console.log('save scores', scores);
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
});
