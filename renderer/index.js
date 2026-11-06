const { ipcRenderer } = require('electron');
const searchBtn = document.getElementById('searchBtn');
const resultDiv = document.getElementById('result');
const glutFreeBtn = document.getElementById('glutFreeBtn');

const caloriesBtn = document.getElementById('caloriesBtn');
const countCaloriesForm =document.getElementById('countCaloriesForm');
const calculateBtn = document.getElementById('calculateBtn');
const resultCalories = document.getElementById('resultCalories');

//  User enter a food name into the search bar
searchBtn.addEventListener('click', async () => {

  let food = document.getElementById("food").value
  if (food === "") {
        alert("Please enter a food name.");
        return;
    }
  const apiKey = '738f6824cab540c4bd9489808bad2147'

  fetch(`https://api.spoonacular.com/recipes/guessNutrition?title=${food}&apiKey=${apiKey}`)//api url
  .then((response) => response.json())
  
  .then((data) => {
    //Empty results
    if (!data || !data.calories || !data.protein ||
        !data.fat || !data.carbs) {

        resultDiv.innerHTML = `
            <p style="color: red;">
                No nutrition information found.
                Please try another food name.
            </p>
        `;

        resultDiv.style.display = 'block';
        return;
    }
    let protein = data.protein?data.protein.value:0
    let calories = data.calories?data.calories.value :0
    let fat = data.fat.value
    let carbs = data.carbs.value
    console.log(data)

      resultDiv.innerHTML = `
      <h3>${food}</h3>
      
      <p>Calories: ${calories.toFixed(1)} kcal</p>
      <p>Carb: ${carbs.toFixed(1)} g</p>
      <p>Fat: ${fat.toFixed(1)} g</p>
      <p>Protein: ${protein.toFixed(1)} g</p>`
      result.style.display = 'block';
      
     } )
    .catch((error) => {
        console.error (error)

        resultDiv.innerHTML = `
            <p>Unable to retrieve nutrition information.
            Please check your connection and try again.</p>
        `;

        resultDiv.style.display = 'block';
        })
});
    

//  User click 'calculate my calories' button
caloriesBtn.addEventListener('click', () => {
    countCaloriesForm.style.display = 'block';
    caloriesBtn.style.display = 'none'; // Hide button after clicking
});

//  Calculation
calculateBtn.addEventListener('click', (event) => {
    // Prevent form from refreshing the page
    event.preventDefault(); 

    // Get values from inputs
    const gender = document.getElementById('gender').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const activityMultiplier = parseFloat(document.getElementById('lifestyle').value);
    const goal = document.getElementById('goal').value;
    const age = parseInt(document.getElementById('age').value)

    // Invalid input
    if (!age || !weight || !height ||
        age <= 0 || weight <= 0 || height <= 20) {

        alert("Please enter valid age, weight and height.");
        return;
    }

    // BMR Calculation 
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    if (gender === 'male') {
        bmr += 5;
    } else {
        bmr -= 161;
    }

    // TDEE Calculation (BMR * Activity Level)
    let tdee = bmr * activityMultiplier;

    //---------------if...else control statements------------
    let targetCalories;
    if (goal === 'lose') {
        targetCalories = tdee - 500; // Deficit for weight loss
    } else if (goal === 'gain') {
        targetCalories = tdee + 500; // Surplus for muscle gain
    } else {
        targetCalories = tdee; // Maintenance
    }
    resultCalories.innerHTML = `
    <p style="font-size: 1.2em; color: darkgreen;">Recommended target calories for your goal: 
    <strong>${Math.round(targetCalories)} kcal/day</strong></p>

    `
})


//  Open Gluten Free Diet Page
glutFreeBtn.addEventListener('click', () =>{

  ipcRenderer.send('open-glutFree-window');
})

