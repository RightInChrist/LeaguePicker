$(document).ready(function() {
    // Initially show the instructions
    $('#instructions').removeClass('hidden');
    $('#toggleInstructions').text('Hide Instructions');

    // Toggle instructions visibility on button click
    $('#toggleInstructions').click(function() {
        $('#instructions').toggleClass('hidden');
        if ($('#instructions').hasClass('hidden')) {
            $(this).text('Show Instructions');
        } else {
            $(this).text('Hide Instructions');
        }
    });

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
            <li class="list-group-item">${name}</li>
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
