const { ipcRenderer } = require('electron');
const resultDietDiv = document.getElementById('resultDietDiv');
const mealOutput = document.getElementById('mealOutput');
const generatePlan = document.getElementById('generatePlan')
const viewMealsBtn = document.getElementById('viewMealsBtn')

let timeFrame  
let targetCalories
let diet
let exclude
let daysOfWeek

// Create Operation/User submit form to generate meals plane
generatePlan.addEventListener('click', (event) => {
    // Prevent form from refreshing the page
    event.preventDefault(); 

    // Parameters in API
    timeFrame = "week";
    targetCalories = document.getElementById('calories').value;
    diet = "gluten free";
    exclude = document.getElementById('allergies').value;

    // Extra parameters
    myname = document.getElementById('name').value;
    goal = document.getElementById('goal').value;

    // Error Form incomplete
    if (!targetCalories || !myname || !goal) {
        alert('Please fill in the form completely!');
        return;
    }
    const apiKey = "738f6824cab540c4bd9489808bad2147";
    try{
    fetch(`https://api.spoonacular.com/mealplanner/generate?timeFrame=${timeFrame}&targetCalories=${targetCalories}
        &diet=${diet}&exclude=${exclude}&apiKey=${apiKey}`)
    .then((response) => response.json())
    .then((data) => {
        console.log(data);

        let htmlContent = `
          <h3>Weekly Plan for ${myname}</h3>
          <p><strong>Goal:</strong> ${goal} | <strong>Target Calories:</strong> ${targetCalories} kcal</p>
          <hr>
        `;

        // Loop through each day in the week
        daysOfWeek = data.week;
        
        for (let day in daysOfWeek) {
            const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
            
            // Calculation
            const dayCalories = daysOfWeek[day].nutrients?.calories || 0;
            const caloriesLeft = targetCalories - dayCalories;

            htmlContent += `<div class="day-plan">`;
            htmlContent += `<h4>${capitalizedDay}</h4>`;

            // Display the daily remaining calories summary
            htmlContent += `
              <p>
                <strong>Total Day Calories:</strong> ${Math.round(dayCalories)} kcal | 
                <strong>Calories Left:</strong> <span>${Math.round(caloriesLeft)} kcal</span>
              </p>
            `;

            htmlContent += `<ul>`;
            // Loop through the meals for that specific day
            
            daysOfWeek[day].meals.forEach(meal => {
                htmlContent += `
                    <li>
                        <strong>${meal.title}</strong>
                        <br>
                        Ready in: ${meal.readyInMinutes} mins | Servings: ${meal.servings}
                        <br>
                        <a href="${meal.sourceUrl}" target="_blank">View Recipe</a>
                        <br>
                        
                    </li>
                `;
            });

            htmlContent += `</ul>`;
            htmlContent += `</div><hr>`;
        }

        resultDietDiv.innerHTML = htmlContent;
        mealOutput.style.display = 'block';
        
    })
    alert('Meals plan generated');
    }
    catch(error) {
        console.error("Error fetching meal plan:", error);
        resultDietDiv.innerHTML = `<p style="color: red;">Failed to load meal plan. Please try again.</p>`;
    };
});

//Save data to main.js  
document.getElementById('saveMealsBtn').addEventListener('click', () => {
    console.log("Save button was clicked!");
    if (!daysOfWeek) {
        alert('Please generate a meal plan first!');
        return;
    }
    ipcRenderer.send('save-dietPlan', { myname, goal, targetCalories,exclude, daysOfWeek});
    alert('Meals plan saved!');
});

viewMealsBtn.addEventListener('click', () => {
    ipcRenderer.send('open-viewPlan-window');
});

