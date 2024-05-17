function handleButtonClick(projectId, action) {

    console.log(projectId);
    console.log(action);

    const projectsContainer = document.getElementById("ActiveProjects");
    const projectDiv = document.createElement("div");

    if (action === "Completed") {
        projectDiv.innerHTML = `
        <label for="rating">Rate the project:</label>
        <div class="rating-container">
            <input type="radio" id="rating-1" name="rating" value="1">
            <label for="rating-1">1</label>

            <input type="radio" id="rating-2" name="rating" value="2">
            <label for="rating-2">2</label>

            <input type="radio" id="rating-3" name="rating" value="3">
            <label for="rating-3">3</label>

            <input type="radio" id="rating-4" name="rating" value="4">
            <label for="rating-4">4</label>

            <input type="radio" id="rating-5" name="rating" value="5">
            <label for="rating-5">5</label>

            <button class="submit-button" onclick="submitRating(${projectId})">Submit Rating</button>
        </div>
        `;
    } else {
        // Handle other status or remove rating input if not needed
        projectDiv.innerHTML = '';
        location.reload();
    }

    // Remove any existing rating div before adding a new one
  

    projectsContainer.appendChild(projectDiv);


    fetch('/updateProjectStatus', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            projectId: projectId,
            status: action,
        }),
    })

    
        .then(response => response.json())
        .then(data => {
            if (data.success) {

       
                // Optionally update the UI to reflect the status change
                console.log(`Project status updated to ${action}`);
            } else {
                console.error('Error updating project status:', data.error);
            }
        })
        .catch(error => console.error('Error:', error));


}

let project_Id;

function cancelReason(projectId,status){
console.log(projectId)
project_Id=projectId;
 // Show the modal and overlay
 document.getElementById('cancelModal').style.display = 'block';
 document.getElementById('overlay').style.display = 'block';
}

function submitCancellation() {
 // Get the selected reason
 const selectedReason = document.querySelector('input[name="reason"]:checked');

 // Check if a reason is selected
 if (selectedReason) {
   // Create the status variable
   const cancelstatus = `Cancelled ${selectedReason.value}`;

   // You can do something with the 'status' variable, for example, send it to the server

   // Close the modal and overlay
   document.getElementById('cancelModal').style.display = 'none';
   document.getElementById('overlay').style.display = 'none';

   handleButtonClick(project_Id, cancelstatus);

   // You can continue with your existing logic after the cancellation here
 } else {
   alert('Please select a reason for cancellation.');
 }



}


function submitRating(projectId) {
    const selectedRating = document.querySelector('input[name="rating"]:checked');

    if (selectedRating) {
        const rating = selectedRating.value;

        // Perform API call to update the rating in the database
        // You need to replace the following with the actual API endpoint and method
        fetch(`/updateProjectRating?projectid=${projectId}&rating=${rating}`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Optionally update the UI or take other actions on success
                    console.log('Rating submitted successfully:', data.message);
                } else {
                    console.error('Error submitting rating:', data.error);
                }
            })
            .catch(error => {
                console.error('Error submitting rating:', error);
            });
    } else {
        // Handle the case where no rating is selected
        alert('Please select a rating before submitting.');
    }

    // Reload the page after submitting the rating
    location.reload();
}