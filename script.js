/* =========================================================
   NEXLIFE V2
   Your Real Life = Your Game
========================================================= */


/* =========================
   DOM
========================= */

const levelEl = document.getElementById("level");
const sideLevelEl = document.getElementById("sideLevel");

const xpTextEl = document.getElementById("xpText");
const xpFillEl = document.getElementById("xpFill");

const totalXPEl = document.getElementById("totalXP");
const todayXPEl = document.getElementById("todayXP");

const streakEl = document.getElementById("streak");
const statStreakEl = document.getElementById("sideStreak");
const sideXP = document.getElementById("sideXP");

const questList = document.getElementById("questList");

const progressPercent =
    document.getElementById("progressPercent");

const dailyProgressFill =
    document.getElementById("dailyProgressFill");

const dateBox =
    document.getElementById("dateBox");

const pageTitle =
    document.getElementById("pageTitle");

const questModal =
    document.getElementById("questModal");

const xpPopup =
    document.getElementById("xpPopup");

const levelUp =
    document.getElementById("levelUp");

const newLevel =
    document.getElementById("newLevel");

const bossButton =
    document.getElementById("completeBoss");

const bossStatus =
    document.getElementById("bossStatus");


/* =========================
   CONSTANTS
========================= */

const XP_PER_LEVEL = 500;

const domainNames = {
    study: "Study",
    trading: "Trading",
    fitness: "Fitness",
    projects: "Projects",
    growth: "Self Growth"
};


/* =========================
   DEFAULT QUESTS
========================= */

const defaultQuests = [

    {
        id: "study-default",
        name: "Study Economics",
        domain: "study",
        reward: 80,
        description: "Study economics for 30 minutes.",
        completed: false
    },

    {
        id: "trading-default",
        name: "Analyze 2 Trading Charts",
        domain: "trading",
        reward: 50,
        description: "Analyze two charts and write your observations.",
        completed: false
    },

    {
        id: "fitness-default",
        name: "Complete a Workout",
        domain: "fitness",
        reward: 100,
        description: "Complete today's training session.",
        completed: false
    },

    {
        id: "projects-default",
        name: "Work on NEXA",
        domain: "projects",
        reward: 60,
        description: "Spend 30 minutes building your project.",
        completed: false
    },

    {
        id: "growth-default",
        name: "Read 10 Pages",
        domain: "growth",
        reward: 30,
        description: "Read at least 10 pages.",
        completed: false
    }

];


/* =========================
   STATE
========================= */

let quests =
    JSON.parse(localStorage.getItem("nexlife_quests"))
    || defaultQuests;

let totalXP =
    Number(localStorage.getItem("nexlife_totalXP"))
    || 0;

let todayXP =
    Number(localStorage.getItem("nexlife_todayXP"))
    || 0;

let streak =
    Number(localStorage.getItem("nexlife_streak"))
    || 0;

let lastActive =
    localStorage.getItem("nexlife_lastActive")
    || null;

let currentDay =
    localStorage.getItem("nexlife_day")
    || getToday();

let bossCompleted =
    localStorage.getItem("nexlife_boss") === getToday();


/* =========================
   DATE
========================= */

function getToday() {

    const now = new Date();

    const year = now.getFullYear();

    const month =
        String(now.getMonth() + 1)
        .padStart(2, "0");

    const day =
        String(now.getDate())
        .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function getYesterday() {

    const date = new Date();

    date.setDate(date.getDate() - 1);

    const year = date.getFullYear();

    const month =
        String(date.getMonth() + 1)
        .padStart(2, "0");

    const day =
        String(date.getDate())
        .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function updateDate() {

    const now = new Date();

    dateBox.textContent =
        now.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );

}


/* =========================
   LOCAL STORAGE
========================= */

function saveState() {

    localStorage.setItem(
        "nexlife_quests",
        JSON.stringify(quests)
    );

    localStorage.setItem(
        "nexlife_totalXP",
        totalXP
    );

    localStorage.setItem(
        "nexlife_todayXP",
        todayXP
    );

    localStorage.setItem(
        "nexlife_streak",
        streak
    );

    localStorage.setItem(
        "nexlife_lastActive",
        lastActive
    );

    localStorage.setItem(
        "nexlife_day",
        getToday()
    );

}


/* =========================
   NEW DAY
========================= */

function checkNewDay() {

    const today = getToday();

    if (currentDay !== today) {

        quests.forEach(
            quest => {
                quest.completed = false;
            }
        );

        todayXP = 0;

        bossCompleted = false;

        localStorage.removeItem("nexlife_boss");

        currentDay = today;

        saveState();
    }

}


/* =========================
   STREAK
========================= */

function verifyStreak() {

    const today = getToday();

    const yesterday = getYesterday();

    if (!lastActive) {

        streak = 0;

        saveState();

        return;
    }

    if (
        lastActive !== today &&
        lastActive !== yesterday
    ) {

        streak = 0;

        saveState();
    }

}


function registerActivity() {

    const today = getToday();

    const yesterday = getYesterday();

    if (lastActive === today) {
        return;
    }

    if (lastActive === yesterday) {

        streak++;

    } else {

        streak = 1;

    }

    lastActive = today;

    saveState();
}


/* =========================
   LEVEL SYSTEM
========================= */

function getLevel() {

    return Math.floor(totalXP / XP_PER_LEVEL) + 1;

}


function getCurrentLevelXP() {

    return totalXP % XP_PER_LEVEL;

}


function updatePlayer(previousLevel = null) {

    const level = getLevel();

    const currentXP = getCurrentLevelXP();

    const percent =
        Math.min(
            (currentXP / XP_PER_LEVEL) * 100,
            100
        );

    levelEl.textContent = level;

    sideLevelEl.textContent = level;

    xpTextEl.textContent =
        `${currentXP} / ${XP_PER_LEVEL} XP`;

    xpFillEl.style.width =
        `${percent}%`;

    totalXPEl.textContent =
        totalXP;

    todayXPEl.textContent =
        todayXP;

    streakEl.textContent =
        `${streak} 🔥`;

    statStreakEl.textContent =
        streak;

    sideXP.textContent =
        totalXP;

    if (
        previousLevel !== null &&
        level > previousLevel
    ) {

        showLevelUp(level);

    }

}


/* =========================
   XP
========================= */

function addXP(amount) {

    const previousLevel = getLevel();

    totalXP += amount;

    todayXP += amount;

    registerActivity();

    saveState();

    updatePlayer(previousLevel);

    showXP(amount);

    updateDailyProgress();

}


/* =========================
   XP POPUP
========================= */

function showXP(amount) {

    xpPopup.innerHTML =
        `<span>+${amount} XP</span>`;

    xpPopup.classList.remove("show");

    void xpPopup.offsetWidth;

    xpPopup.classList.add("show");

    setTimeout(() => {

        xpPopup.classList.remove("show");

    }, 1100);

}


/* =========================
   LEVEL UP
========================= */

function showLevelUp(level) {

    newLevel.textContent = level;

    levelUp.classList.add("show");

}


function closeLevelUp() {

    levelUp.classList.remove("show");

}

window.closeLevelUp = closeLevelUp;


/* =========================
   QUEST RENDER
========================= */

function renderQuests() {

    questList.innerHTML = "";

    if (quests.length === 0) {

        questList.innerHTML = `
            <div class="empty">
                No quests yet.<br>
                Create your first mission.
            </div>
        `;

        return;
    }


    quests.forEach(quest => {

        const item =
            document.createElement("div");

        item.className =
            `quest ${quest.completed ? "completed" : ""}`;

        item.innerHTML = `

            <button
                class="quest-check"
                data-id="${quest.id}"
                aria-label="Complete quest"
            >
                ${quest.completed ? "✓" : ""}
            </button>

            <div class="quest-main">

                <div class="quest-title">
                    ${escapeHTML(quest.name)}
                </div>

                <div class="quest-description">
                    ${escapeHTML(
                        quest.description || ""
                    )}
                </div>

                <span class="quest-domain">
                    ${getDomainIcon(quest.domain)}
                    ${domainNames[quest.domain] || "Other"}
                </span>

            </div>

            <div class="quest-xp">
                +${quest.reward} XP
            </div>

            <button
                class="delete-quest"
                data-delete="${quest.id}"
                aria-label="Delete quest"
            >
                ×
            </button>

        `;

        questList.appendChild(item);

    });


    document
        .querySelectorAll(".quest-check")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    completeQuest(
                        button.dataset.id
                    );

                }
            );

        });


    document
        .querySelectorAll(".delete-quest")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteQuest(
                        button.dataset.delete
                    );

                }
            );

        });

}


/* =========================
   QUEST COMPLETE
========================= */

function completeQuest(id) {

    const quest =
        quests.find(q => q.id === id);

    if (!quest) return;

    if (quest.completed) return;

    quest.completed = true;

    addXP(Number(quest.reward));

    saveState();

    renderQuests();

    updateDailyProgress();

    checkPerfectDay();

}


/* =========================
   DELETE QUEST
========================= */

function deleteQuest(id) {

    quests =
        quests.filter(
            quest => quest.id !== id
        );

    saveState();

    renderQuests();

    updateDailyProgress();

}


/* =========================
   DAILY PROGRESS
========================= */

function updateDailyProgress() {

    if (quests.length === 0) {

        progressPercent.textContent = "0%";

        dailyProgressFill.style.width = "0%";

        return;
    }

    const completed =
        quests.filter(
            quest => quest.completed
        ).length;

    const percent =
        Math.round(
            (completed / quests.length) * 100
        );

    progressPercent.textContent =
        `${percent}%`;

    dailyProgressFill.style.width =
        `${percent}%`;

}


/* =========================
   PERFECT DAY
========================= */

function checkPerfectDay() {

    if (quests.length === 0) {
        return;
    }

    const allDone =
        quests.every(
            quest => quest.completed
        );

    const bonusGiven =
        localStorage.getItem(
            "nexlife_perfect_day"
        ) === getToday();


    if (allDone && !bonusGiven) {

        localStorage.setItem(
            "nexlife_perfect_day",
            getToday()
        );

        addXP(100);

        setTimeout(() => {

            alert(
                "🔥 PERFECT DAY!\n\nAll quests completed.\nBonus: +100 XP"
            );

        }, 300);

    }

}


/* =========================
   DAILY BOSS
========================= */

function completeBoss() {

    if (bossCompleted) {

        return;
    }

    bossCompleted = true;

    localStorage.setItem(
        "nexlife_boss",
        getToday()
    );

    addXP(100);

    bossButton.textContent =
        "BOSS DEFEATED ✓";

    bossButton.classList.add("completed");

}


bossButton.addEventListener(
    "click",
    completeBoss
);


/* =========================
   ADD QUEST MODAL
========================= */

const openQuest =
    document.getElementById("openQuest");

const openQuest2 =
    document.getElementById("openQuest2");

const closeQuest =
    document.getElementById("closeQuest");

const questForm =
    document.getElementById("questForm");


function openQuestModal() {

    questModal.classList.add("show");

    setTimeout(() => {

        document
            .getElementById("questName")
            .focus();

    }, 100);

}


function closeQuestModal() {

    questModal.classList.remove("show");

}


openQuest.addEventListener(
    "click",
    openQuestModal
);


if (openQuest2) {

    openQuest2.addEventListener(
        "click",
        openQuestModal
    );

}


closeQuest.addEventListener(
    "click",
    closeQuestModal
);


questModal.addEventListener(
    "click",
    event => {

        if (event.target === questModal) {

            closeQuestModal();

        }

    }
);


/* =========================
   FORM
========================= */

questForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const name =
            document
                .getElementById("questName")
                .value
                .trim();

        const domain =
            document
                .getElementById("questDomain")
                .value;

        const reward =
            Number(
                document
                    .getElementById("questReward")
                    .value
            );

        const description =
            document
                .getElementById("questDescription")
                .value
                .trim();


        if (!name) {
            return;
        }


        const quest = {

            id:
                "quest-" +
                Date.now(),

            name,

            domain,

            reward:
                Math.max(
                    5,
                    Math.min(
                        reward || 50,
                        500
                    )
                ),

            description,

            completed: false

        };


        quests.push(quest);

        saveState();

        renderQuests();

        updateDailyProgress();

        questForm.reset();

        document
            .getElementById("questReward")
            .value = 50;

        closeQuestModal();

    }
);


/* =========================
   NAVIGATION
========================= */

const navItems =
    document.querySelectorAll(".nav-item");

const pages =
    document.querySelectorAll(".page");


function showPage(pageId) {

    pages.forEach(page => {

        page.classList.remove("active");

    });


    const page =
        document.getElementById(pageId);

    if (page) {

        page.classList.add("active");

    }


    navItems.forEach(item => {

        item.classList.toggle(
            "active",
            item.dataset.page === pageId
        );

    });


    const titles = {

        dashboard: "Dashboard",

        study: "Study",

        trading: "Trading",

        fitness: "Fitness",

        projects: "Projects",

        growth: "Self Growth"

    };


    pageTitle.textContent =
        titles[pageId] || "NEXLIFE";

}


navItems.forEach(item => {

    item.addEventListener(
        "click",
        () => {

            showPage(
                item.dataset.page
            );

        }
    );

});


/* =========================
   DOMAIN BUTTONS
========================= */

document
    .querySelectorAll("[data-domain]")
    .forEach(card => {

        card.addEventListener(
            "click",
            () => {

                const domain =
                    card.dataset.domain;

                showPage(domain);

            }
        );

    });


/* =========================
   BACK DASHBOARD
========================= */

document
    .querySelectorAll(".back-dashboard")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showPage("dashboard");

            }
        );

    });


/* =========================
   HELPERS
========================= */

function getDomainIcon(domain) {

    const icons = {

        study: "🎓",

        trading: "📈",

        fitness: "🏋️",

        projects: "💻",

        growth: "🧠"

    };

    return icons[domain] || "🎯";

}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================
   RESTORE BOSS
========================= */

function restoreBoss() {

    if (!bossButton) return;

    if (bossCompleted) {

        bossButton.textContent =
            "BOSS DEFEATED ✓";

        bossButton.classList.add(
            "completed"
        );

    }

}


/* =========================
   INIT
========================= */

function init() {

    checkNewDay();

    verifyStreak();

    updateDate();

    renderQuests();

    updatePlayer();

    updateDailyProgress();

    restoreBoss();

}


/* START */

init();
