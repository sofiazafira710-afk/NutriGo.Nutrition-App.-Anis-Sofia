const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let glutFreeWindow;
let viewPlanWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.loadFile('renderer/index.html');
}
app.whenReady().then(createMainWindow);

//  Create gluten free window
function createGlutFreeWindow() {
  
  glutFreeWindow = new BrowserWindow({
    width: 600,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  glutFreeWindow.loadFile('renderer/glutFree.html');
}

ipcMain.on('open-glutFree-window', () => {
  createGlutFreeWindow();
});

//  Save data into diet.json
ipcMain.on('save-dietPlan', (event, dietPlanData) => {
  const filePath = path.join(__dirname, 'data', 'diet.json');
  let diet = [];

  try{
    if (fs.existsSync(filePath)) {
      diet = JSON.parse(fs.readFileSync(filePath));
    }

    diet.push(dietPlanData);
    fs.writeFileSync(filePath, JSON.stringify(diet, null, 2));
    
    }
    catch (error){
      console.error("Error saving diet plan:", error)
  }

});

//  Create view meals plan window
function createViewPlanWindow() {
  
  viewPlanWindow = new BrowserWindow({
    width: 600,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  viewPlanWindow.loadFile('renderer/view.html');
}

ipcMain.on('open-viewPlan-window', () => {
  createViewPlanWindow();
});

//Retrieved saved meal plans
ipcMain.handle('load-plans', () => {
  const filePath = path.join(__dirname, 'data', 'diet.json');

  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath));
  } else {
    return []; // No file means no data yet
  }
});

//  Update week plan when user edit target calories
ipcMain.handle('update-week-plan', async (event, { index, newCalories }) => {
    try {
      const apiKey = '738f6824cab540c4bd9489808bad2147';
      const timeFrame = 'week';
      const diet = 'gluten free';
      const exclude = ''; 

      //  Fetch new plan directly from Spoonacular in main.js using fetch
      const url = `https://api.spoonacular.com/mealplanner/generate?timeFrame=${timeFrame}&
      targetCalories=${newCalories}&diet=${diet}&exclude=${exclude}&apiKey=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      //  Read diet.json
      const filePath = path.join(__dirname, 'data','diet.json');
      let allPlans = JSON.parse(fs.readFileSync(filePath));

      //  Replace the old week data with the new values
      allPlans[index].targetCalories = newCalories;
      allPlans[index].daysOfWeek = data.week; // Spoonacular's weekly days object

      //  Save the updated list back to diet.json
      fs.writeFileSync(filePath, JSON.stringify(allPlans, null, 2));
      console.log("File saved successfully!");
        return { success: true };
    } catch (error) {
        console.error("Error updating plan in main.js:", error);
        return { success: false };
    }
});

//  Delete an entire day when user click clear button
ipcMain.handle('delete-day-plan', async (event, { index, dayName }) => {
    try {
      
      //  Read diet.json first
      const filePath = path.join(__dirname, 'data','diet.json');
      let allPlans = JSON.parse(fs.readFileSync(filePath));

      //  Check if the plan and the specific day exist
      if (allPlans[index] && allPlans[index].daysOfWeek && 
        allPlans[index].daysOfWeek[dayName]) {
            
        // Clear the meals array for that specific day
        allPlans[index].daysOfWeek[dayName].meals = [];

        // Reset the nutrients for that day
        if (allPlans[index].daysOfWeek[dayName].nutrients) {
            allPlans[index].daysOfWeek[dayName].nutrients = {
                calories: 0,
                protein: 0,
                fat: 0,
                carbohydrates:0
            };
        }

      //  Save the updated list back to diet.json
      fs.writeFileSync(filePath, JSON.stringify(allPlans, null, 2));
      console.log(`Day "${dayName}" cleared successfully`);
      return { success: true };
      }
      
    }catch (error) {
        console.error("Error clearing day plan in main.js:", error);
        return { success: false };
    }
});
