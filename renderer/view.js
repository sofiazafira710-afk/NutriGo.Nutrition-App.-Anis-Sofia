const { ipcRenderer } = require('electron');
const mealsPlanContainer = document.getElementById('mealsPlanContainer');
const editForm = document.getElementById('editForm');
const saveBtn = document.getElementById('saveBtn');

try{
    // Read Operation/ User click view meals plan button
    window.addEventListener('DOMContentLoaded', async () =>{
    const plan = await ipcRenderer.invoke('load-plans')
    console.log("Loaded plan data:", plan);

    mealsPlanContainer.innerHTML = ""; // Clear previous results

    if (plan.length === 0) {
        listContainer.innerHTML = "<p>No plan saved yet.</p>"
        return;
    }

    //  Construct saved meals plan structure
    plan.forEach((item, index) => {
        const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        let daysHtml='<div class="grid-container">'

        daysOrder.forEach(day => {
            const dayData = item.daysOfWeek[day]

            let mealsHtml = '';
            if (dayData && dayData.meals){
                dayData.meals.forEach(meal => {
                    mealsHtml += `
                        <br><strong>${meal.title}</strong><br>
                        ${meal.readyInMinutes} min | ${meal.servings} servings
                    `
                })
            }

            let nutrientHtml = ''
            if (dayData && dayData.nutrients){
                const n = dayData.nutrients;
                nutrientHtml = `
                    Calories: ${n.calories} kcal | Protein: ${n.protein} mg | Fat: ${n.fat} mg | 
                    Carbohydrates: ${n.carbohydrates} mg
                `
            }

            daysHtml+= `
            <div class="day-card">
                <h3>${day} <button class='delete-day-btn' data-index='${index}' data-day='${day}' >Clear</button></h3>
                <div class="mealsCard">
                    ${mealsHtml || '<p>No meals planned.</p>'}
                </div>
                <br>
                ${nutrientHtml}
            </div>
        `;
        })

        daysHtml += '</div>'

        //Display saved meals plan with neat structure
        mealsPlanContainer.innerHTML +=`
            <div class="week-section" style="margin-bottom: 30px;">
                <h2>Week ${index + 1}</h2>
                <!--User can edit/update calories-->
                <p><strong>Goal:</strong> ${item.goal} | <strong>Target Calories:</strong> ${item.targetCalories} kcal 
                <button class="edit-btn" data-index="${index}" data-calories="${item.targetCalories}">Edit</button> |
                <strong>Allergies/Exclude:</strong> ${item.exclude} <button id="excludeBtn" value="${item.exclude}" 
                style="display:none"></button></p>
                ${daysHtml}
                <hr style="margin: 30px 0; border: 0; border-top: 1px solid #ccc;">
            </div>
        `;
    });
});
} catch (error) {
    console.error('An error occurred:', error);
}

//  Update Operation/update target calories
mealsPlanContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-btn')) {
        selectedWeekIndex = event.target.getAttribute('data-index');
        const currentCalories = event.target.getAttribute('data-calories');
        
        document.getElementById('newCalories').value = currentCalories;
        editForm.style.display = 'block';
    }
});

//  Save and trigger backend update in main.js
saveBtn.addEventListener('click', async (event) => {
    event.preventDefault(); 

    console.log("Save button clicked!");
    if (selectedWeekIndex === null) return;

    const newCalories = document.getElementById('newCalories').value;
    const indexAsNumber = parseInt(selectedWeekIndex, 10);
    console.log("Sending to main process...", { indexAsNumber, newCalories });

    // Send index and new calories to main.js
    const result = await ipcRenderer.invoke('update-week-plan', {
        index: indexAsNumber, 
        newCalories: newCalories
    });
    
    console.log("Result received:", result);

    if (result.success) {
        //  Instantly reload the page to show the newly updated JSON data
        window.location.reload();
    } else {
        alert("Failed to update plan.");
    }
});

//  Delete Operation/Delete meals plan for an entire day
mealsPlanContainer.addEventListener('click', async (event) => {
    if (event.target.classList.contains('delete-day-btn')) {
        const weekIndex = event.target.getAttribute('data-index');
        const currentDay = event.target.getAttribute('data-day');
        
        if (!confirm(`Are you sure you want to clear all meals for ${currentDay}?`)) {
            return;
        }

        console.log("Sending delete request to main process...", { weekIndex, currentDay });
    
        try {
            //  Save the data to the main.js
            const deleteResult = await ipcRenderer.invoke('delete-day-plan', {
                index: parseInt(weekIndex, 10),
                dayName: currentDay
            });

            console.log("Result received:", deleteResult);

            if (deleteResult.success) {
                //  Instantly reload the page to show the updated JSON data
                window.location.reload();
            } else {
                alert("Failed to delete day plan.");
            }
        } catch (error) {
            console.error("Error invoking delete-day-plan:", error);
        }
    }
    
});