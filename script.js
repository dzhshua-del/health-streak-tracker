document.addEventListener("DOMContentLoaded", () => {
    const habitForm = document.getElementById("habitForm");
    const habitInput = document.getElementById("habitInput");
    const habitList = document.getElementById("habitList");
    const presetList = document.getElementById("presetList");

    const presetHabits = ["Walking", "Drink water", "Reading", "Exercise", "Meditation", "Sleep 8 hours"];
    let habits = loadHabits();

    function loadHabits() {
        try {
            const saved = JSON.parse(localStorage.getItem("habits"));
            if (!Array.isArray(saved)) {
                return [];
            }

            return saved.map((habit) => {
                if (typeof habit === "string") {
                    return { id: createId(habit), name: habit, completedDates: [] };
                }
                return {
                    id: habit.id || createId(habit.name),
                    name: habit.name,
                    completedDates: Array.isArray(habit.completedDates) ? habit.completedDates : []
                };
            });
        } catch {
            return [];
        }
    }

    function createId(name) {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
    }

    function getLocalDate(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function shiftDate(dateString, days) {
        const date = new Date(`${dateString}T12:00:00`);
        date.setDate(date.getDate() + days);
        return getLocalDate(date);
    }

    function drawStreakChart() {
        const canvas = document.getElementById("streakChart");
        if (!canvas) {
            return;
        }

        const context = canvas.getContext("2d");
        const width = canvas.width;
        const height = canvas.height;
        const padding = { top: 20, right: 20, bottom: 45, left: 40 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const dates = [];
        for (let offset = 6; offset >= 0; offset--) {
            dates.push(shiftDate(getLocalDate(), -offset));
        }

        const counts = dates.map((date) =>
            habits.filter((habit) => habit.completedDates.includes(date)).length
        );
        const maximum = Math.max(habits.length, 1);

        context.clearRect(0, 0, width, height);
        context.fillStyle = "#404e38";
        context.fillRect(0, 0, width, height);
        context.font = "14px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";

        context.strokeStyle = "rgba(255, 255, 255, 0.25)";
        context.lineWidth = 1;
        for (let value = 0; value <= maximum; value++) {
            const y = padding.top + chartHeight - (value / maximum) * chartHeight;
            context.beginPath();
            context.moveTo(padding.left, y);
            context.lineTo(width - padding.right, y);
            context.stroke();

            context.fillStyle = "#ffffff";
            context.textAlign = "right";
            context.fillText(String(value), padding.left - 8, y);
        }

        const slotWidth = chartWidth / dates.length;
        const barWidth = Math.min(55, slotWidth * 0.55);

        dates.forEach((date, index) => {
            const count = counts[index];
            const barHeight = (count / maximum) * chartHeight;
            const x = padding.left + slotWidth * index + (slotWidth - barWidth) / 2;
            const y = padding.top + chartHeight - barHeight;

            context.fillStyle = count > 0 ? "#9acb91" : "rgba(255, 255, 255, 0.18)";
            context.fillRect(x, y, barWidth, barHeight);

            context.fillStyle = "#ffffff";
            context.textAlign = "center";
            context.fillText(String(count), x + barWidth / 2, y - 10);

            const label = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
                weekday: "short"
            });
            context.fillText(label, x + barWidth / 2, height - 20);
        });
    }

    function getStreak(completedDates) {
        const today = getLocalDate();
        let dateToCheck = completedDates.includes(today) ? today : shiftDate(today, -1);

        if (!completedDates.includes(dateToCheck)) {
            return 0;
        }

        let streak = 0;
        while (completedDates.includes(dateToCheck)) {
            streak++;
            dateToCheck = shiftDate(dateToCheck, -1);
        }
        return streak;
    }

    function saveAndRender() {
        localStorage.setItem("habits", JSON.stringify(habits));
        habitList.innerHTML = "";
        drawStreakChart();

        if (habits.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "emptyMessage";
            emptyMessage.textContent = "No habits added yet.";
            habitList.appendChild(emptyMessage);
            return;
        }

        habits.forEach((habit) => {
            const today = getLocalDate();
            const isCompletedToday = habit.completedDates.includes(today);

            const habitItem = document.createElement("div");
            habitItem.className = "habitItem";

            const habitName = document.createElement("span");
            habitName.className = "habitName";
            habitName.textContent = habit.name;

            const streak = document.createElement("span");
            streak.className = "streak";
            streak.textContent = `${getStreak(habit.completedDates)} day streak`;

            const completeButton = document.createElement("button");
            completeButton.type = "button";
            completeButton.className = "completeButton" + (isCompletedToday ? " completed" : "");
            completeButton.textContent = isCompletedToday ? "Completed" : "Mark done";
            completeButton.addEventListener("click", () => {
                if (isCompletedToday) {
                    habit.completedDates = habit.completedDates.filter((date) => date !== today);
                } else {
                    habit.completedDates.push(today);
                }
                saveAndRender();
            });

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "removeButton";
            removeButton.textContent = "Remove";
            removeButton.addEventListener("click", () => {
                habits = habits.filter((item) => item.id !== habit.id);
                saveAndRender();
            });

            habitItem.append(habitName, streak, completeButton, removeButton);
            habitList.appendChild(habitItem);
        });
    }

    function addHabit(name) {
        const cleanName = name.trim();
        if (!cleanName) {
            return;
        }

        const alreadyAdded = habits.some(
            (habit) => habit.name.toLowerCase() === cleanName.toLowerCase()
        );
        if (alreadyAdded) {
            return;
        }

        habits.push({
            id: createId(cleanName),
            name: cleanName,
            completedDates: []
        });
        saveAndRender();
    }

    presetHabits.forEach((habitName) => {
        const presetButton = document.createElement("button");
        presetButton.type = "button";
        presetButton.className = "presetButton";
        presetButton.textContent = "+" + habitName;
        presetButton.addEventListener("click", () => addHabit(habitName));
        presetList.appendChild(presetButton);
    });

    habitForm.addEventListener("submit", (event) => {
        event.preventDefault();
        addHabit(habitInput.value);
        habitInput.value = "";
    });

    saveAndRender();
});