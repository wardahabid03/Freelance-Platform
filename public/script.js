function filterSkillsDropdown() {
  var input, filter, skills, i;
  input = document.getElementById("searchcon");
  filter = input.value.toUpperCase();
  skills = [
    "Graphic Design",
    "Content Writing",
    "Digital Marketing",
    "Programming & Tech",
  ]; // Add your skills here
  var dropdownContainer = document.getElementById("dropdown-container");
  dropdownContainer.innerHTML = "";

  if (filter.length === 0) {
    dropdownContainer.style.display = "none";
    return;
  }

  for (i = 0; i < skills.length; i++) {
    if (skills[i].toUpperCase().startsWith(filter)) {
      var option = document.createElement("div");
      option.textContent = skills[i];
      option.className = "dropdown-option";
      option.addEventListener("click", function () {
        input.value = this.textContent; //Change here for redirection
        dropdownContainer.innerHTML = "";
        dropdownContainer.style.display = "none";
      });
      dropdownContainer.appendChild(option);
    }
  }

  // Display the dropdown if there are matching skills
  if (dropdownContainer.childElementCount > 0) {
    dropdownContainer.style.display = "block";
  } else {
    dropdownContainer.style.display = "none";
  }
}
