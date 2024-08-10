$(document).ready(function() {
    // Initially show Instructions
    showSection('instructions');

    // Handle navigation
    $('#navInstructions').click(function() {
        showSection('instructions');
    });

    $('#navCoaches').click(function() {
        showSection('coaches');
    });

    $('#navTeams').click(function() {
        showSection('teams');
    });

    $('#navPlayers').click(function() {
        showSection('players');
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
            addCoach(coachName);
            $('#coachName').val(''); // Clear the input field
        }
    });

    // Function to add a coach to the list
    function addCoach(name) {
        $('#coachesList').append(`
            <li class="list-group-item">
                <span class="coach-name">${name}</span>
                <button class="btn btn-sm btn-warning edit-coach-btn">Edit</button>
            </li>
        `);
    }

    // Handle editing coach names
    $('#coachesList').on('click', '.edit-coach-btn', function() {
        const coachName = $(this).siblings('.coach-name').text();
        $('#editCoachName').val(coachName);
        $('#editCoachForm').removeClass('d-none');
        $(this).closest('li').remove();
    });

    $('#editCoachForm').submit(function(event) {
        event.preventDefault();
        const newName = $('#editCoachName').val().trim();
        if (newName) {
            addCoach(newName);
            $('#editCoachForm').addClass('d-none');
        }
    });

    // Handle adding teams
    $('#assignTeamsForm').submit(function(event) {
        event.preventDefault();
        const teamName = $('#teamName').val().trim();
        const teamColor = $('#teamColor').val();
        if (teamName) {
            addTeam(teamName, teamColor);
            $('#teamName').val(''); // Clear the input field
            $('#teamColor').val('#000000'); // Reset color picker
        }
    });

    // Function to add a team to the list
    function addTeam(name, color) {
        $('#teamsList').append(`
            <li class="list-group-item" style="background-color: ${color}; color: #fff;">
                ${name} <span class="badge badge-light" style="background-color: ${color};">Color</span>
            </li>
        `);
    }

    // Example function to add a player
    function addPlayer(name, score) {
        $('#playersTable tbody').append(`
            <tr>
                <td contenteditable="true">${name}</td>
                <td contenteditable="true">${score}</td>
            </tr>
        `);
    }

    // Example function to save players to local storage
    function savePlayers() {
        // Collect player data and save to local storage
    }

    // Example function to generate team assignments
    function generateTeamAssignments() {
        // Generate and display team assignments
    }
});
