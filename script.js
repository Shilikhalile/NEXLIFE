/* NEXLIFE — local-first life RPG, vNext */
(() => {
  'use strict';

  const XP_PER_LEVEL = 500;
  const FOCUS_REWARD = 25;
  const QUEST_DOMAINS = ['study', 'trading', 'fitness', 'projects', 'growth'];
  const DOMAIN_NAMES = { study: 'Study', trading: 'Trading', fitness: 'Fitness', projects: 'Projects', growth: 'Self growth' };
  const DOMAIN_ICONS = { study: '◈', trading: '⌁', fitness: '✳', projects: '⌘', growth: '◎' };
  const DEFAULT_QUESTS = [
    { id: 'study-default', name: 'Study economics for 30 minutes', domain: 'study', reward: 80, description: 'Choose one idea and give it your full attention.', recurrence: 'daily', completed: false },
    { id: 'trading-default', name: 'Review two market charts', domain: 'trading', reward: 50, description: 'Write down what you notice before making a prediction.', recurrence: 'daily', completed: false },
    { id: 'fitness-default', name: 'Move your body', domain: 'fitness', reward: 100, description: 'A workout, a walk, or any movement that feels good.', recurrence: 'daily', completed: false },
    { id: 'projects-default', name: 'Build something for 30 minutes', domain: 'projects', reward: 60, description: 'Take one small, visible step on a project.', recurrence: 'daily', completed: false },
    { id: 'growth-default', name: 'Read 10 pages', domain: 'growth', reward: 30, description: 'Learn something that helps you see things differently.', recurrence: 'daily', completed: false }
  ];
  const TEMPLATES = [
    { id: 'study-focus', name: 'Focused study block', domain: 'study', reward: 60, description: 'Complete one focused 25-minute study session.', recurrence: 'daily' },
    { id: 'study-recall', name: 'Recall yesterday’s lesson', domain: 'study', reward: 35, description: 'Write down what you remember before opening your notes.', recurrence: 'daily' },
    { id: 'trading-journal', name: 'Write a market journal entry', domain: 'trading', reward: 40, description: 'Note the setup, the risk, and one lesson. This is a learning exercise, not financial advice.', recurrence: 'once' },
    { id: 'fitness-walk', name: 'Take a 20-minute walk', domain: 'fitness', reward: 45, description: 'Get outside, move at a comfortable pace, and enjoy the reset.', recurrence: 'daily' },
    { id: 'fitness-train', name: 'Complete a workout', domain: 'fitness', reward: 80, description: 'Finish a session that fits your current energy and ability.', recurrence: 'weekly' },
    { id: 'project-build', name: 'Build one small feature', domain: 'projects', reward: 70, description: 'Turn one clear next step into something you can see or use.', recurrence: 'daily' },
    { id: 'growth-read', name: 'Read 10 pages', domain: 'growth', reward: 30, description: 'Read something that helps you think or feel differently.', recurrence: 'daily' },
    { id: 'growth-reflect', name: 'Write a short reflection', domain: 'growth', reward: 25, description: 'What felt good today? What is one thing you want to carry into tomorrow?', recurrence: 'daily' },
    { id: 'reset-plan', name: 'Plan tomorrow’s top priority', domain: 'growth', reward: 25, description: 'Choose one important task and define the first tiny step.', recurrence: 'daily' },
    { id: 'weekly-review', name: 'Review the week', domain: 'growth', reward: 60, description: 'Notice what worked, what you learned, and what you want to adjust.', recurrence: 'weekly' }
  ];
  const WEEKLY_CHALLENGES = [
    { id: 'quest-eight', type: 'quests', target: 8, title: 'Stack eight small wins', description: 'Complete 8 quests this week.' },
    { id: 'xp-four-hundred', type: 'xp', target: 400, title: 'Earn 400 XP', description: 'Collect 400 XP before the week resets.' },
    { id: 'focus-four', type: 'focus', target: 4, title: 'Make room for focus', description: 'Finish 4 focus sessions this week.' },
    { id: 'active-four', type: 'days', target: 4, title: 'Show up on four days', description: 'Earn XP on 4 different days this week.' }
  ];
  const ACHIEVEMENTS = [
    { id: 'first-quest', title: 'First steps', description: 'Complete your first quest.', reward: 25, icon: '✦', test: (s) => s.quests >= 1, progress: (s) => `${Math.min(s.quests, 1)} / 1 quest` },
    { id: 'ten-quests', title: 'Finding your rhythm', description: 'Complete 10 quests.', reward: 60, icon: '↗', test: (s) => s.quests >= 10, progress: (s) => `${Math.min(s.quests, 10)} / 10 quests` },
    { id: 'fifty-quests', title: 'Quietly unstoppable', description: 'Complete 50 quests.', reward: 150, icon: '✧', test: (s) => s.quests >= 50, progress: (s) => `${Math.min(s.quests, 50)} / 50 quests` },
    { id: 'first-focus', title: 'In the zone', description: 'Finish your first focus session.', reward: 25, icon: '◷', test: (s) => s.focus >= 1, progress: (s) => `${Math.min(s.focus, 1)} / 1 session` },
    { id: 'five-focus', title: 'Deep work', description: 'Finish 5 focus sessions.', reward: 100, icon: '◎', test: (s) => s.focus >= 5, progress: (s) => `${Math.min(s.focus, 5)} / 5 sessions` },
    { id: 'three-day-streak', title: 'Keep the promise', description: 'Build a 3-day streak.', reward: 50, icon: '♨', test: (s) => s.streak >= 3, progress: (s) => `${Math.min(s.streak, 3)} / 3 days` },
    { id: 'seven-day-streak', title: 'A week of showing up', description: 'Build a 7-day streak.', reward: 150, icon: '☼', test: (s) => s.streak >= 7, progress: (s) => `${Math.min(s.streak, 7)} / 7 days` },
    { id: 'level-five', title: 'Rising player', description: 'Reach level 5.', reward: 200, icon: '⬆', test: (s) => s.level >= 5, progress: (s) => `${Math.min(s.level, 5)} / 5 levels` }
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const safeParse = (value, fallback) => { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
  const getToday = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const offsetDate = (days, from = new Date()) => { const date = new Date(from); date.setDate(date.getDate() + days); return date; };
  const getYesterday = () => getToday(offsetDate(-1));
  const clamp = (number, min, max) => Math.max(min, Math.min(max, number));
  const formatNumber = (number) => new Intl.NumberFormat().format(number);
  const validDays = (days) => [...new Set((Array.isArray(days) ? days : []).map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort((a, b) => a - b);

  function normalizeQuest(item) {
    if (!item || typeof item !== 'object' || typeof item.name !== 'string' || !item.name.trim()) return null;
    const recurrence = ['once', 'daily', 'weekly'].includes(item.recurrence) ? item.recurrence : 'daily';
    return {
      id: String(item.id || `quest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`).slice(0, 100),
      name: item.name.trim().slice(0, 72),
      domain: QUEST_DOMAINS.includes(item.domain) ? item.domain : 'growth',
      reward: clamp(Number(item.reward) || 50, 5, 500),
      description: String(item.description || '').slice(0, 180),
      recurrence,
      days: recurrence === 'weekly' ? validDays(item.days).length ? validDays(item.days) : [new Date().getDay()] : [],
      createdOn: /^\d{4}-\d{2}-\d{2}$/.test(item.createdOn || '') ? item.createdOn : getToday(),
      completed: Boolean(item.completed)
    };
  }

  const storedQuests = safeParse(localStorage.getItem('nexlife_quests'), null);
  let quests = Array.isArray(storedQuests) ? storedQuests.map(normalizeQuest).filter(Boolean) : structuredClone(DEFAULT_QUESTS).map(normalizeQuest);
  let totalXP = Math.max(0, Number(localStorage.getItem('nexlife_totalXP')) || 0);
  let todayXP = Math.max(0, Number(localStorage.getItem('nexlife_todayXP')) || 0);
  let streak = Math.max(0, Number(localStorage.getItem('nexlife_streak')) || 0);
  let lastActive = localStorage.getItem('nexlife_lastActive') || null;
  let currentDay = localStorage.getItem('nexlife_day') || getToday();
  let bossCompleted = localStorage.getItem('nexlife_boss') === getToday();
  let playerName = localStorage.getItem('nexlife_player') || 'PLAYER';
  let dailyHistory = safeParse(localStorage.getItem('nexlife_history'), {});
  if (!dailyHistory || typeof dailyHistory !== 'object' || Array.isArray(dailyHistory)) dailyHistory = {};
  let achievementClaims = new Set(safeParse(localStorage.getItem('nexlife_achievement_claims'), []));
  let weeklyChallenge = safeParse(localStorage.getItem('nexlife_weekly_challenge'), null);
  let activeFilter = 'all';
  let editingQuestId = null;
  let undoDeleteState = null;
  let toastTimeout;
  let reminderInterval;
  let reminderTime = localStorage.getItem('nexlife_reminder_time') || 'off';
  let reminderLastSent = localStorage.getItem('nexlife_reminder_last_sent') || '';
  let currentTheme = localStorage.getItem('nexlife_theme') === 'light' ? 'light' : 'dark';
  let focusMinutes = clamp(Number(localStorage.getItem('nexlife_focus_minutes')) || 25, 25, 60);
  if (![25, 45, 60].includes(focusMinutes)) focusMinutes = 25;
  let breakMinutes = clamp(Number(localStorage.getItem('nexlife_break_minutes')) || 5, 5, 15);
  if (![5, 10, 15].includes(breakMinutes)) breakMinutes = 5;
  let timerMode = 'focus';
  let timerRemaining = focusMinutes * 60;
  let timerEndsAt = null;
  let timerInterval = null;
  let timerRunning = false;

  const els = {
    level: $('#level'), sideLevel: $('#sideLevel'), xpText: $('#xpText'), xpFill: $('#xpFill'), totalXP: $('#totalXP'), todayXP: $('#todayXP'),
    streak: $('#streak'), sideStreak: $('#sideStreak'), sideXP: $('#sideXP'), questList: $('#questList'), progressPercent: $('#progressPercent'),
    dailyProgressFill: $('#dailyProgressFill'), dateBox: $('#dateBox'), pageTitle: $('#pageTitle'), pageSubtitle: $('#pageSubtitle'),
    questModal: $('#questModal'), templateModal: $('#templateModal'), profileModal: $('#profileModal'), xpPopup: $('#xpPopup'), levelUp: $('#levelUp'), newLevel: $('#newLevel'),
    bossButton: $('#completeBoss'), bossStatus: $('#bossStatus'), toast: $('#toast'), timerDisplay: $('#timerDisplay'), timerStatus: $('#timerStatus'),
    timerProgress: $('#timerProgress'), timerToggle: $('#timerToggle'), timerReset: $('#timerReset')
  };

  function ensureDayRecord(dateKey = getToday()) {
    if (!dailyHistory[dateKey] || typeof dailyHistory[dateKey] !== 'object' || Array.isArray(dailyHistory[dateKey])) dailyHistory[dateKey] = {};
    const record = dailyHistory[dateKey];
    record.xp = Math.max(0, Number(record.xp) || 0);
    record.quests = Math.max(0, Number(record.quests) || 0);
    record.focus = Math.max(0, Number(record.focus) || 0);
    record.focusSessions = Math.max(0, Number(record.focusSessions) || Math.floor(record.focus / 25));
    if (!Array.isArray(record.completedItems)) record.completedItems = [];
    return record;
  }

  function persistState() {
    try {
      localStorage.setItem('nexlife_quests', JSON.stringify(quests));
      localStorage.setItem('nexlife_totalXP', String(totalXP));
      localStorage.setItem('nexlife_todayXP', String(todayXP));
      localStorage.setItem('nexlife_streak', String(streak));
      localStorage.setItem('nexlife_lastActive', lastActive || '');
      localStorage.setItem('nexlife_day', getToday());
      localStorage.setItem('nexlife_player', playerName);
      localStorage.setItem('nexlife_history', JSON.stringify(dailyHistory));
      localStorage.setItem('nexlife_achievement_claims', JSON.stringify([...achievementClaims]));
      localStorage.setItem('nexlife_weekly_challenge', JSON.stringify(weeklyChallenge));
      localStorage.setItem('nexlife_focus_minutes', String(focusMinutes));
      localStorage.setItem('nexlife_break_minutes', String(breakMinutes));
      localStorage.setItem('nexlife_reminder_time', reminderTime);
      localStorage.setItem('nexlife_reminder_last_sent', reminderLastSent);
      if (bossCompleted) localStorage.setItem('nexlife_boss', getToday());
      else localStorage.removeItem('nexlife_boss');
    } catch (error) {
      showToast('Your browser could not save progress. Try freeing up local storage.');
      console.warn('NEXLIFE could not persist local progress:', error);
    }
  }

  function getTodayQuests() {
    const today = new Date();
    return quests.filter((quest) => {
      if (quest.recurrence === 'daily') return true;
      if (quest.recurrence === 'weekly') return quest.days.includes(today.getDay());
      return quest.createdOn === getToday();
    });
  }

  function checkNewDay() {
    const today = getToday();
    if (currentDay !== today) {
      quests = quests.filter((quest) => quest.recurrence !== 'once' || quest.createdOn === today);
      quests = quests.map((quest) => {
        const dueNow = quest.recurrence === 'daily' || (quest.recurrence === 'weekly' && quest.days.includes(new Date().getDay()));
        return dueNow ? { ...quest, completed: false } : quest;
      });
      todayXP = 0;
      bossCompleted = false;
      currentDay = today;
    }
    ensureDayRecord();
    getCurrentChallenge();
    persistState();
  }

  function verifyStreak() {
    if (lastActive && lastActive !== getToday() && lastActive !== getYesterday()) streak = 0;
  }

  function registerActivity() {
    const today = getToday();
    if (lastActive === today) return;
    streak = lastActive === getYesterday() ? streak + 1 : 1;
    lastActive = today;
  }

  function getLevel() { return Math.floor(totalXP / XP_PER_LEVEL) + 1; }

  function updatePlayer(previousLevel = null) {
    const level = getLevel();
    const currentXP = totalXP % XP_PER_LEVEL;
    els.level.textContent = level;
    els.sideLevel.textContent = level;
    els.xpText.textContent = `${formatNumber(currentXP)} / ${XP_PER_LEVEL} XP`;
    els.xpFill.style.width = `${(currentXP / XP_PER_LEVEL) * 100}%`;
    $('.xp-track').setAttribute('aria-valuenow', String(currentXP));
    els.totalXP.textContent = formatNumber(totalXP);
    els.todayXP.textContent = formatNumber(todayXP);
    els.streak.textContent = streak;
    els.sideStreak.textContent = streak;
    els.sideXP.textContent = formatNumber(totalXP);
    $('#sidePlayerName').textContent = playerName;
    if (previousLevel !== null && level > previousLevel) showLevelUp(level);
  }

  function addXP(amount, options = {}) {
    const safeAmount = Math.max(0, Math.round(Number(amount) || 0));
    if (!safeAmount) return;
    const previousLevel = getLevel();
    totalXP += safeAmount;
    todayXP += safeAmount;
    ensureDayRecord().xp += safeAmount;
    registerActivity();
    persistState();
    updatePlayer(previousLevel);
    updateDailyProgress();
    renderWeek();
    showXP(safeAmount);
    if (!options.skipChallenge) checkWeeklyChallenge();
    if (!options.skipAchievements) checkAchievements();
  }

  function showXP(amount) {
    els.xpPopup.textContent = `+${formatNumber(amount)} XP`;
    els.xpPopup.classList.remove('show');
    void els.xpPopup.offsetWidth;
    els.xpPopup.classList.add('show');
    window.setTimeout(() => els.xpPopup.classList.remove('show'), 1200);
  }

  function showLevelUp(level) {
    els.newLevel.textContent = level;
    els.levelUp.classList.add('show');
    els.levelUp.setAttribute('aria-hidden', 'false');
    $('#closeLevelUp').focus();
  }

  function closeLevelUp() {
    els.levelUp.classList.remove('show');
    els.levelUp.setAttribute('aria-hidden', 'true');
  }

  function showToast(message, actionLabel = '', action = null, duration = 2800) {
    window.clearTimeout(toastTimeout);
    $('#toastMessage').textContent = message;
    const actionButton = $('#toastAction');
    actionButton.hidden = !action;
    actionButton.textContent = actionLabel || 'Undo';
    actionButton.onclick = action ? () => { actionButton.hidden = true; action(); } : null;
    els.toast.classList.add('show');
    toastTimeout = window.setTimeout(() => els.toast.classList.remove('show'), duration);
  }

  function renderQuests() {
    const todayQuests = getTodayQuests();
    const visibleQuests = todayQuests.filter((quest) => activeFilter === 'active' ? !quest.completed : activeFilter === 'completed' ? quest.completed : true);
    els.questList.replaceChildren();
    $('#questCount').textContent = String(todayQuests.filter((quest) => !quest.completed).length);
    if (!visibleQuests.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      if (!todayQuests.length) empty.innerHTML = '<strong>No quests are scheduled today.</strong>Add a one-time quest, set up a habit, or start with a template.';
      else if (activeFilter === 'completed') empty.innerHTML = '<strong>No finished quests just yet.</strong>Your completed missions will live here.';
      else if (activeFilter === 'active') empty.innerHTML = '<strong>All caught up.</strong>Try another filter, or add a new quest for today.';
      else empty.innerHTML = '<strong>Your day is a blank page.</strong>Add a small quest to get your momentum going.';
      els.questList.append(empty);
      updateDailyProgress();
      return;
    }
    for (const quest of visibleQuests) {
      const card = document.createElement('article');
      card.className = `quest${quest.completed ? ' completed' : ''}`;
      const check = document.createElement('button');
      check.className = 'quest-check'; check.type = 'button'; check.dataset.id = quest.id;
      check.setAttribute('aria-label', quest.completed ? `Mark ${quest.name} incomplete` : `Complete ${quest.name}`);
      check.setAttribute('aria-pressed', String(quest.completed)); check.textContent = quest.completed ? '✓' : '';
      check.addEventListener('click', () => completeQuest(quest.id));
      const main = document.createElement('div'); main.className = 'quest-main';
      const title = document.createElement('div'); title.className = 'quest-title'; title.textContent = quest.name;
      const description = document.createElement('div'); description.className = 'quest-description'; description.textContent = quest.description || 'A small step, just for today.';
      const domain = document.createElement('span'); domain.className = 'quest-domain';
      const repeatLabel = quest.recurrence === 'daily' ? ' · Daily' : quest.recurrence === 'weekly' ? ` · Weekly (${quest.days.map(dayShortName).join(', ')})` : ' · Today';
      domain.textContent = `${DOMAIN_ICONS[quest.domain]}  ${DOMAIN_NAMES[quest.domain]}${repeatLabel}`;
      main.append(title, description, domain);
      const reward = document.createElement('span'); reward.className = 'quest-xp'; reward.textContent = `+${quest.reward} XP`;
      const actions = document.createElement('div'); actions.className = 'quest-actions';
      const edit = document.createElement('button'); edit.className = 'edit-quest'; edit.type = 'button'; edit.title = 'Edit quest'; edit.setAttribute('aria-label', `Edit ${quest.name}`); edit.textContent = '✎'; edit.addEventListener('click', () => openEditQuest(quest.id));
      const remove = document.createElement('button'); remove.className = 'delete-quest'; remove.type = 'button'; remove.setAttribute('aria-label', `Delete ${quest.name}`); remove.title = 'Delete quest'; remove.textContent = '×'; remove.addEventListener('click', () => deleteQuest(quest.id));
      actions.append(edit, remove);
      card.append(check, main, reward, actions);
      els.questList.append(card);
    }
    updateDailyProgress();
  }

  function completeQuest(id) {
    const quest = quests.find((item) => item.id === id);
    if (!quest || quest.completed || !getTodayQuests().includes(quest)) return;
    quest.completed = true;
    const record = ensureDayRecord();
    record.quests += 1;
    record.completedItems.push({ id: quest.id, name: quest.name, domain: quest.domain, xp: quest.reward, at: new Date().toISOString() });
    addXP(quest.reward);
    persistState();
    renderQuests();
    updateBoss();
  }

  function deleteQuest(id) {
    const index = quests.findIndex((quest) => quest.id === id);
    if (index < 0) return;
    const [quest] = quests.splice(index, 1);
    if (undoDeleteState?.timer) window.clearTimeout(undoDeleteState.timer);
    undoDeleteState = { quest, index, timer: null };
    undoDeleteState.timer = window.setTimeout(() => { undoDeleteState = null; }, 8000);
    persistState();
    renderQuests();
    updateBoss();
    showToast('Quest removed.', 'Undo', restoreDeletedQuest, 7000);
  }

  function restoreDeletedQuest() {
    if (!undoDeleteState) return;
    window.clearTimeout(undoDeleteState.timer);
    quests.splice(undoDeleteState.index, 0, undoDeleteState.quest);
    undoDeleteState = null;
    persistState();
    renderQuests();
    updateBoss();
    showToast('Quest restored.');
  }

  function updateDailyProgress() {
    const todayQuests = getTodayQuests();
    const completed = todayQuests.filter((quest) => quest.completed).length;
    const percent = todayQuests.length ? Math.round((completed / todayQuests.length) * 100) : 0;
    els.progressPercent.textContent = `${percent}%`;
    els.dailyProgressFill.style.width = `${percent}%`;
    $('.daily-track').setAttribute('aria-valuenow', String(percent));
    $('#dailyProgressText').textContent = `${completed} of ${todayQuests.length} quest${todayQuests.length === 1 ? '' : 's'}`;
    const remaining = todayQuests.length - completed;
    $('#progressRemaining').textContent = remaining === 0 ? (todayQuests.length ? 'All done — lovely work.' : 'Add your first quest') : `${remaining} left to go`;
    updateBoss();
  }

  function updateBoss() {
    const todayQuests = getTodayQuests();
    const completed = todayQuests.filter((quest) => quest.completed).length;
    $('#bossQuestCount').textContent = `${completed} / ${todayQuests.length} complete`;
    if (bossCompleted) {
      els.bossButton.disabled = true; els.bossButton.classList.add('completed');
      els.bossButton.innerHTML = 'Daily boss defeated <span>✓</span>'; els.bossStatus.textContent = 'You showed up for yourself today. Bonus earned.';
    } else if (!todayQuests.length) {
      els.bossButton.disabled = true; els.bossButton.classList.remove('completed');
      els.bossButton.innerHTML = 'Create a quest to begin <span>→</span>'; els.bossStatus.textContent = 'Start with one small promise to yourself.';
    } else if (completed < todayQuests.length) {
      els.bossButton.disabled = true; els.bossButton.classList.remove('completed');
      els.bossButton.innerHTML = 'Finish today’s quests first <span>→</span>'; els.bossStatus.textContent = 'Complete all of today’s quests to unlock your bonus.';
    } else {
      els.bossButton.disabled = false; els.bossButton.classList.remove('completed');
      els.bossButton.innerHTML = 'Claim your daily bonus <span>→</span>'; els.bossStatus.textContent = 'Every quest is complete. Claim your well-earned bonus.';
    }
  }

  function completeBoss() {
    const todayQuests = getTodayQuests();
    if (bossCompleted || !todayQuests.length || !todayQuests.every((quest) => quest.completed)) return;
    bossCompleted = true; persistState(); addXP(100); updateBoss(); showToast('Daily boss defeated. +100 XP — that was all you.');
  }

  function getWeekStart(date = new Date()) {
    const start = new Date(date); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); return getToday(start);
  }

  function getCurrentChallenge() {
    const weekKey = getWeekStart();
    if (!weeklyChallenge || weeklyChallenge.weekKey !== weekKey || !WEEKLY_CHALLENGES.some((item) => item.id === weeklyChallenge.id)) {
      const monday = new Date(`${weekKey}T00:00:00`);
      const weekNumber = Math.floor(monday.getTime() / (7 * 24 * 60 * 60 * 1000));
      const challenge = WEEKLY_CHALLENGES[((weekNumber % WEEKLY_CHALLENGES.length) + WEEKLY_CHALLENGES.length) % WEEKLY_CHALLENGES.length];
      weeklyChallenge = { weekKey, id: challenge.id, claimed: false };
    }
    return { ...WEEKLY_CHALLENGES.find((item) => item.id === weeklyChallenge.id), ...weeklyChallenge };
  }

  function getChallengeProgress(challenge) {
    const start = new Date(`${challenge.weekKey}T00:00:00`);
    const weekRecords = Array.from({ length: 7 }, (_, index) => dailyHistory[getToday(offsetDate(index, start))] || {});
    if (challenge.type === 'quests') return weekRecords.reduce((sum, record) => sum + (Number(record.quests) || 0), 0);
    if (challenge.type === 'xp') return weekRecords.reduce((sum, record) => sum + (Number(record.xp) || 0), 0);
    if (challenge.type === 'focus') return weekRecords.reduce((sum, record) => sum + (Number(record.focusSessions) || Math.floor((Number(record.focus) || 0) / 25)), 0);
    return weekRecords.filter((record) => (Number(record.xp) || 0) > 0).length;
  }

  function renderWeeklyChallenge() {
    const challenge = getCurrentChallenge();
    const progress = getChallengeProgress(challenge);
    const goal = challenge.target;
    $('#challengeTitle').textContent = challenge.title;
    $('#challengeDescription').textContent = challenge.description;
    $('#challengeReward').textContent = `+${challenge.reward || 120} XP`;
    $('#challengeCount').textContent = `${Math.min(progress, goal)} / ${goal}`;
    $('#challengeProgressFill').style.width = `${Math.min(100, Math.round((progress / goal) * 100))}%`;
    $('.challenge-progress-track').setAttribute('aria-valuenow', String(Math.min(100, Math.round((progress / goal) * 100))));
    $('#challengeStatus').textContent = weeklyChallenge.claimed ? 'Reward earned' : 'Resets Monday';
  }

  function checkWeeklyChallenge() {
    const challenge = getCurrentChallenge();
    renderWeeklyChallenge();
    if (!weeklyChallenge.claimed && getChallengeProgress(challenge) >= challenge.target) {
      weeklyChallenge.claimed = true;
      persistState();
      addXP(challenge.reward || 120, { skipChallenge: true });
      showToast(`Weekly challenge complete — +${challenge.reward || 120} XP!`);
      renderWeeklyChallenge();
    }
  }

  function getAchievementStats() {
    const records = Object.values(dailyHistory).filter((record) => record && typeof record === 'object');
    return {
      quests: records.reduce((sum, record) => sum + (Number(record.quests) || 0), 0),
      focus: records.reduce((sum, record) => sum + (Number(record.focusSessions) || Math.floor((Number(record.focus) || 0) / 25)), 0),
      streak, level: getLevel()
    };
  }

  function checkAchievements() {
    const stats = getAchievementStats();
    for (const achievement of ACHIEVEMENTS) {
      if (achievement.test(stats) && !achievementClaims.has(achievement.id)) {
        achievementClaims.add(achievement.id);
        persistState();
        addXP(achievement.reward, { skipAchievements: true });
        showToast(`Achievement unlocked: ${achievement.title} · +${achievement.reward} XP`);
      }
    }
    renderAchievements();
  }

  function renderAchievements() {
    const stats = getAchievementStats();
    const grid = $('#achievementGrid');
    if (!grid) return;
    grid.replaceChildren();
    const unlocked = ACHIEVEMENTS.filter((achievement) => achievementClaims.has(achievement.id));
    $('#achievementCount').textContent = `${unlocked.length} / ${ACHIEVEMENTS.length} earned`;
    $('#achievementXP').textContent = `${formatNumber(unlocked.reduce((sum, item) => sum + item.reward, 0))} bonus XP earned`;
    for (const achievement of ACHIEVEMENTS) {
      const earned = achievementClaims.has(achievement.id);
      const card = document.createElement('article');
      card.className = `achievement-card panel${earned ? ' earned' : ' locked'}`;
      const icon = document.createElement('span'); icon.className = 'achievement-icon'; icon.textContent = earned ? achievement.icon : '◌';
      const title = document.createElement('h3'); title.textContent = achievement.title;
      const description = document.createElement('p'); description.textContent = achievement.description;
      const bottom = document.createElement('div'); bottom.className = 'achievement-bottom';
      const progress = document.createElement('span'); progress.textContent = earned ? 'UNLOCKED' : achievement.progress(stats);
      const reward = document.createElement('strong'); reward.textContent = `+${achievement.reward} XP`;
      bottom.append(progress, reward); card.append(icon, title, description, bottom); grid.append(card);
    }
  }

  function getActivityScore(record = {}) {
    const journal = typeof record.journal === 'string' && record.journal.trim();
    return Math.max(0, Number(record.xp) || 0)
      + Math.max(0, Number(record.quests) || 0) * 25
      + Math.max(0, Number(record.focus) || 0) * 2
      + (journal || record.journalMood ? 20 : 0);
  }

  function renderActivityHeatmap(dayKeys) {
    const grid = $('#activityHeatmap');
    grid.replaceChildren();
    const scores = dayKeys.map((dayKey) => getActivityScore(dailyHistory[dayKey] || {}));
    const maxScore = Math.max(1, ...scores);
    dayKeys.forEach((dayKey, index) => {
      const record = dailyHistory[dayKey] || {};
      const score = scores[index];
      const level = score ? Math.max(1, Math.ceil((score / maxScore) * 4)) : 0;
      const date = new Date(`${dayKey}T12:00:00`);
      const dateLabel = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      const questsDone = Math.max(0, Number(record.quests) || 0);
      const focusMinutesDone = Math.max(0, Number(record.focus) || 0);
      const xpEarned = Math.max(0, Number(record.xp) || 0);
      const cell = document.createElement('span');
      cell.className = 'activity-cell';
      cell.dataset.level = String(level);
      cell.setAttribute('role', 'listitem');
      cell.setAttribute('aria-label', `${dateLabel}: ${xpEarned} XP, ${questsDone} quests, ${focusMinutesDone} focus minutes${record.journal || record.journalMood ? ', reflection saved' : ''}`);
      cell.title = `${dateLabel} · ${xpEarned} XP · ${questsDone} quests · ${focusMinutesDone} focus min`;
      grid.append(cell);
    });
  }

  function renderWeeklyRecap() {
    const start = new Date(`${getWeekStart()}T12:00:00`);
    const weekKeys = Array.from({ length: 7 }, (_, index) => getToday(offsetDate(index, start))).filter((dayKey) => dayKey <= getToday());
    const records = weekKeys.map((dayKey) => dailyHistory[dayKey] || {});
    const questsDone = records.reduce((sum, record) => sum + Math.max(0, Number(record.quests) || 0), 0);
    const focusMinutesDone = records.reduce((sum, record) => sum + Math.max(0, Number(record.focus) || 0), 0);
    const xpEarned = records.reduce((sum, record) => sum + Math.max(0, Number(record.xp) || 0), 0);
    const activeDays = records.filter((record) => getActivityScore(record) > 0).length;
    const domainTotals = {};
    records.forEach((record) => (Array.isArray(record.completedItems) ? record.completedItems : []).forEach((item) => {
      if (item && QUEST_DOMAINS.includes(item.domain)) domainTotals[item.domain] = (domainTotals[item.domain] || 0) + 1;
    }));
    const leadingCount = Math.max(0, ...Object.values(domainTotals));
    const leadingDomains = Object.entries(domainTotals).filter(([, count]) => count === leadingCount).map(([domain]) => DOMAIN_NAMES[domain]);
    $('#weeklyQuests').textContent = formatNumber(questsDone);
    $('#weeklyFocus').textContent = formatNumber(focusMinutesDone);
    $('#weeklyXP').textContent = formatNumber(xpEarned);
    $('#weeklyActiveDays').textContent = `${activeDays} / 7`;
    $('#weeklyInsight').textContent = activeDays
      ? `${activeDays} ${activeDays === 1 ? 'day' : 'days'} of showing up this week.${leadingDomains.length ? ` Your most active ${leadingDomains.length === 1 ? 'path' : 'paths'}: ${leadingDomains.join(', ')}.` : ' Add a quest to reveal your strongest path.'}`
      : 'Your weekly story starts with one small win. Pick a tiny step and begin.';
  }

  function updateJournalCount() {
    $('#journalCount').textContent = `${$('#journalEntry').value.length} / 500`;
  }

  function renderDailyJournal() {
    const record = dailyHistory[getToday()] || {};
    const moods = ['great', 'good', 'okay', 'challenging'];
    $('#journalEntry').value = typeof record.journal === 'string' ? record.journal.slice(0, 500) : '';
    $('#journalMood').value = moods.includes(record.journalMood) ? record.journalMood : '';
    updateJournalCount();
    const savedAt = typeof record.journalUpdatedAt === 'string' ? new Date(record.journalUpdatedAt) : null;
    $('#journalSaved').textContent = savedAt && Number.isFinite(savedAt.getTime())
      ? `Saved at ${savedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : 'Not saved yet';
  }

  function saveDailyJournal(event) {
    event.preventDefault();
    const entry = $('#journalEntry').value.trim().slice(0, 500);
    const moodValue = $('#journalMood').value;
    const mood = ['great', 'good', 'okay', 'challenging'].includes(moodValue) ? moodValue : '';
    const record = ensureDayRecord();
    if (!entry && !mood) {
      delete record.journal;
      delete record.journalMood;
      delete record.journalUpdatedAt;
    } else {
      record.journal = entry;
      record.journalMood = mood;
      record.journalUpdatedAt = new Date().toISOString();
    }
    persistState();
    renderHistory();
    showToast(entry || mood ? 'Reflection saved on this device.' : 'Today’s reflection was cleared.');
  }

  function renderHistory() {
    const dayKeys = Object.keys(dailyHistory).sort().reverse();
    const totalQuests = dayKeys.reduce((sum, day) => sum + (Number(dailyHistory[day]?.quests) || 0), 0);
    const totalFocus = dayKeys.reduce((sum, day) => sum + (Number(dailyHistory[day]?.focusSessions) || Math.floor((Number(dailyHistory[day]?.focus) || 0) / 25)), 0);
    $('#historyQuestTotal').textContent = formatNumber(totalQuests);
    $('#historyFocusTotal').textContent = formatNumber(totalFocus);
    $('#historyXPTotal').textContent = `${formatNumber(totalXP)} XP`;
    renderDailyJournal();
    renderWeeklyRecap();
    const list = $('#historyList'); list.replaceChildren();
    const recentDayKeys = Array.from({ length: 30 }, (_, offset) => getToday(offsetDate(-offset)));
    renderActivityHeatmap(recentDayKeys.slice().reverse());
    const activeDays = recentDayKeys.filter((day) => {
      const record = dailyHistory[day] || {};
      return getActivityScore(record) > 0;
    });
    if (!activeDays.length) {
      const empty = document.createElement('div'); empty.className = 'empty';
      empty.innerHTML = '<strong>Your story starts with one small win.</strong>Completed quests, focus sessions, and reflections will appear here.';
      list.append(empty); return;
    }
    for (const dayKey of activeDays) {
      const record = ensureDayRecord(dayKey);
      const card = document.createElement('article'); card.className = 'history-day panel';
      const date = new Date(`${dayKey}T12:00:00`);
      const head = document.createElement('div'); head.className = 'history-day-head';
      const dateText = document.createElement('div'); dateText.className = 'history-date';
      const dayName = document.createElement('strong'); dayName.textContent = date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      const dateSub = document.createElement('span'); dateSub.textContent = dayKey === getToday() ? 'TODAY' : dayKey;
      dateText.append(dayName, dateSub);
      const dayXP = document.createElement('strong'); dayXP.className = 'history-xp'; dayXP.textContent = `+${formatNumber(Number(record.xp) || 0)} XP`;
      head.append(dateText, dayXP);
      const stats = document.createElement('div'); stats.className = 'history-day-stats';
      const questsStat = document.createElement('span'); questsStat.textContent = `${Number(record.quests) || 0} quests`;
      const focusStat = document.createElement('span'); focusStat.textContent = `${Number(record.focusSessions) || 0} focus sessions`;
      const minutesStat = document.createElement('span'); minutesStat.textContent = `${Number(record.focus) || 0} focus min`;
      stats.append(questsStat, focusStat, minutesStat); card.append(head, stats);
      const doneNames = record.completedItems || [];
      if (doneNames.length) {
        const items = document.createElement('ul'); items.className = 'history-quests';
        for (const item of doneNames.slice(0, 6)) { const li = document.createElement('li'); li.textContent = item.name || 'Completed quest'; items.append(li); }
        card.append(items);
      }
      if ((typeof record.journal === 'string' && record.journal.trim()) || record.journalMood) {
        const reflection = document.createElement('p'); reflection.className = 'history-reflection';
        const moodNames = { great: 'Great', good: 'Good', okay: 'In-between', challenging: 'Challenging' };
        const mood = moodNames[record.journalMood];
        reflection.textContent = `${mood ? `${mood} · ` : ''}${String(record.journal || '').slice(0, 500)}`;
        card.append(reflection);
      }
      list.append(card);
    }
  }

  function dayShortName(day) { return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day] || ''; }

  function renderWeek() {
    const records = [];
    for (let dayOffset = -6; dayOffset <= 0; dayOffset += 1) {
      const date = offsetDate(dayOffset); const dateKey = getToday(date);
      records.push({ date, dateKey, xp: Math.max(0, Number(dailyHistory[dateKey]?.xp) || 0), today: dateKey === getToday() });
    }
    const maxXP = Math.max(100, ...records.map((record) => record.xp));
    const total = records.reduce((sum, record) => sum + record.xp, 0);
    const daysActive = records.filter((record) => record.xp > 0).length;
    $('#weekTotal').textContent = `${formatNumber(total)} XP`;
    $('#weekDaysActive').textContent = `${daysActive} active day${daysActive === 1 ? '' : 's'}`;
    const wrapper = $('#weekActivity'); wrapper.replaceChildren();
    for (const record of records) {
      const day = document.createElement('div'); day.className = 'week-day';
      const track = document.createElement('div'); track.className = 'week-bar-track';
      track.title = `${record.date.toLocaleDateString(undefined, { weekday: 'long' })}: ${record.xp} XP`;
      const bar = document.createElement('div'); bar.className = `week-bar${record.today ? ' today' : ''}`;
      bar.style.height = `${record.xp ? Math.max(7, Math.round((record.xp / maxXP) * 100)) : 3}%`;
      track.append(bar);
      const label = document.createElement('span'); label.className = `week-day-label${record.today ? ' today' : ''}`;
      label.textContent = record.date.toLocaleDateString(undefined, { weekday: 'narrow' }); day.append(track, label); wrapper.append(day);
    }
  }

  function updateDate() { els.dateBox.textContent = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }

  function applyTheme(theme) {
    currentTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = currentTheme;
    document.documentElement.style.colorScheme = currentTheme;
    const isDark = currentTheme === 'dark';
    const toggle = $('#themeToggle');
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
    toggle.title = `Switch to ${isDark ? 'light' : 'dark'} mode`;
    $('#themeIcon').textContent = isDark ? '☀' : '☾';
    $('#themeLabel').textContent = isDark ? 'Light mode' : 'Dark mode';
    $('meta[name="theme-color"]').content = isDark ? '#090d0b' : '#f3f6f0';
    try { localStorage.setItem('nexlife_theme', currentTheme); }
    catch (error) { console.info('NEXLIFE could not save the theme preference:', error); }
  }

  function setFilter(filter) {
    activeFilter = filter;
    $$('.filter-button').forEach((button) => { const selected = button.dataset.filter === filter; button.classList.toggle('active', selected); button.setAttribute('aria-pressed', String(selected)); });
    renderQuests();
  }

  function showPage(pageId) {
    const page = document.getElementById(pageId); if (!page) return;
    $$('.page').forEach((item) => { const active = item.id === pageId; item.classList.toggle('active', active); item.hidden = !active; });
    $$('.nav-item').forEach((item) => { const active = item.dataset.page === pageId; item.classList.toggle('active', active); if (active) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current'); });
    const titles = {
      dashboard: ['Your overview', 'A little progress, repeated daily, becomes a lot.'], study: ['Study', 'Make room for curiosity.'], trading: ['Trading', 'Practice process over impulse.'], fitness: ['Fitness', 'Show up for the body you live in.'],
      projects: ['Projects', 'Turn a small idea into a real thing.'], growth: ['Self growth', 'Keep becoming someone you believe in.'], history: ['Your history', 'A look at every step that got you here.'], achievements: ['Achievements', 'Your effort, made visible.']
    };
    const [title, subtitle] = titles[pageId] || titles.dashboard;
    els.pageTitle.textContent = title; els.pageSubtitle.textContent = subtitle;
    if (pageId === 'history') renderHistory();
    if (pageId === 'achievements') renderAchievements();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openModal(modal) {
    modal.classList.add('show'); modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    const focusTarget = $('input:not([type="file"]), select, textarea, button', modal);
    if (focusTarget) window.setTimeout(() => focusTarget.focus(), 40);
  }

  function closeModal(modal) {
    modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true');
    if (!$('.modal.show')) document.body.style.overflow = '';
  }

  function setWeekdayCheckboxes(days = []) {
    $$('input[name="weekday"]').forEach((input) => { input.checked = days.includes(Number(input.value)); });
  }

  function updateRepeatControls() {
    $('#weeklyDays').hidden = $('#questRecurrence').value !== 'weekly';
    if ($('#questRecurrence').value === 'weekly' && !$$('input[name="weekday"]:checked').length) setWeekdayCheckboxes([new Date().getDay()]);
  }

  function openQuestModal(options = {}) {
    $('#questForm').reset(); $('#questReward').value = '50'; $('#questRecurrence').value = 'once'; setWeekdayCheckboxes([]);
    editingQuestId = null;
    $('#questModalTitle').textContent = 'Create a quest';
    $('#questModalDescription').textContent = 'Give your next small win a name. You can always change direction.';
    $('#saveQuestButton').innerHTML = 'Add to today’s quests <span>→</span>';
    if (options.questId) {
      const quest = quests.find((item) => item.id === options.questId); if (!quest) return;
      editingQuestId = quest.id;
      $('#questName').value = quest.name; $('#questDomain').value = quest.domain; $('#questReward').value = quest.reward;
      $('#questDescription').value = quest.description; $('#questRecurrence').value = quest.recurrence; setWeekdayCheckboxes(quest.days);
      $('#questModalTitle').textContent = 'Edit quest'; $('#questModalDescription').textContent = 'Change the details, schedule, or reward for this mission.';
      $('#saveQuestButton').innerHTML = 'Save changes <span>→</span>';
    } else if (options.template) {
      const template = options.template;
      $('#questName').value = template.name; $('#questDomain').value = template.domain; $('#questReward').value = template.reward;
      $('#questDescription').value = template.description; $('#questRecurrence').value = template.recurrence || 'daily';
      if ($('#questRecurrence').value === 'weekly') setWeekdayCheckboxes([new Date().getDay()]);
    } else if (options.domain && QUEST_DOMAINS.includes(options.domain)) $('#questDomain').value = options.domain;
    updateRepeatControls(); openModal(els.questModal);
  }

  function openEditQuest(id) { openQuestModal({ questId: id }); }

  function submitQuest(event) {
    event.preventDefault();
    const name = $('#questName').value.trim(); const domain = $('#questDomain').value;
    const reward = clamp(Number($('#questReward').value) || 50, 5, 500); const description = $('#questDescription').value.trim();
    const recurrence = $('#questRecurrence').value;
    const days = recurrence === 'weekly' ? validDays($$('input[name="weekday"]:checked').map((input) => Number(input.value))) : [];
    if (!name || !QUEST_DOMAINS.includes(domain)) return;
    if (recurrence === 'weekly' && !days.length) { showToast('Choose at least one day for a weekly quest.'); return; }
    if (editingQuestId) {
      const index = quests.findIndex((quest) => quest.id === editingQuestId); if (index < 0) return;
      const old = quests[index];
      quests[index] = normalizeQuest({ ...old, name, domain, reward, description, recurrence, days, createdOn: recurrence === 'once' ? getToday() : old.createdOn });
      showToast('Quest updated. Nice and clear.');
    } else {
      const id = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `quest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      quests.push(normalizeQuest({ id, name, domain, reward, description, recurrence, days, createdOn: getToday(), completed: false }));
      showToast('Quest added. Make it yours.');
    }
    persistState(); setFilter('all'); updateBoss(); closeModal(els.questModal);
  }

  function renderTemplates() {
    const grid = $('#templateGrid'); grid.replaceChildren();
    for (const template of TEMPLATES) {
      const button = document.createElement('button'); button.type = 'button'; button.className = `template-card ${template.domain}`; button.dataset.template = template.id;
      const icon = document.createElement('span'); icon.className = 'template-icon'; icon.textContent = DOMAIN_ICONS[template.domain];
      const content = document.createElement('span'); content.className = 'template-copy';
      const title = document.createElement('strong'); title.textContent = template.name;
      const description = document.createElement('small'); description.textContent = template.description;
      const footer = document.createElement('span'); footer.className = 'template-footer'; footer.textContent = `+${template.reward} XP · ${template.recurrence === 'weekly' ? 'Weekly' : template.recurrence === 'daily' ? 'Daily' : 'One time'}`;
      content.append(title, description, footer); const arrow = document.createElement('span'); arrow.className = 'template-arrow'; arrow.textContent = '→';
      button.append(icon, content, arrow); button.addEventListener('click', () => { closeModal(els.templateModal); openQuestModal({ template }); }); grid.append(button);
    }
  }

  function saveProfile(event) {
    event.preventDefault(); playerName = $('#playerNameInput').value.trim().slice(0, 24) || 'PLAYER';
    persistState(); updatePlayer(); closeModal(els.profileModal); showToast(`Good to have you here, ${playerName}.`);
  }

  function exportBackup() {
    const backup = {
      app: 'NEXLIFE', version: 2, exportedAt: new Date().toISOString(), playerName, quests, totalXP, todayXP, streak, lastActive,
      currentDay: getToday(), bossCompleted, dailyHistory, achievementClaims: [...achievementClaims], weeklyChallenge,
      focusMinutes, breakMinutes, reminderTime, theme: currentTheme
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `nexlife-backup-${getToday()}.json`; document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    showToast('Your private backup has been downloaded.');
  }

  async function importBackup(event) {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('That backup is larger than 2 MB.');
      const backup = JSON.parse(await file.text());
      if (backup.app !== 'NEXLIFE' || ![1, 2].includes(backup.version) || !Array.isArray(backup.quests)) throw new Error('This file is not a supported NEXLIFE backup.');
      const importedQuests = backup.quests.map(normalizeQuest).filter(Boolean);
      if (importedQuests.length !== backup.quests.length) throw new Error('Some quests in this backup are not valid.');
      const sameDay = backup.currentDay === getToday();
      quests = sameDay ? importedQuests : importedQuests.filter((quest) => quest.recurrence !== 'once').map((quest) => ({ ...quest, completed: false }));
      totalXP = Math.max(0, Number(backup.totalXP) || 0); todayXP = sameDay ? Math.max(0, Number(backup.todayXP) || 0) : 0;
      streak = Math.max(0, Number(backup.streak) || 0); lastActive = typeof backup.lastActive === 'string' ? backup.lastActive : null;
      playerName = String(backup.playerName || 'PLAYER').slice(0, 24);
      dailyHistory = backup.dailyHistory && typeof backup.dailyHistory === 'object' && !Array.isArray(backup.dailyHistory) ? backup.dailyHistory : {};
      bossCompleted = sameDay && Boolean(backup.bossCompleted); currentDay = getToday();
      achievementClaims = new Set(Array.isArray(backup.achievementClaims) ? backup.achievementClaims : []);
      weeklyChallenge = backup.weeklyChallenge && backup.weeklyChallenge.weekKey === getWeekStart() ? backup.weeklyChallenge : null;
      focusMinutes = [25, 45, 60].includes(Number(backup.focusMinutes)) ? Number(backup.focusMinutes) : 25;
      breakMinutes = [5, 10, 15].includes(Number(backup.breakMinutes)) ? Number(backup.breakMinutes) : 5;
      reminderTime = ['off', '09:00', '12:00', '17:00', '20:00'].includes(backup.reminderTime) ? backup.reminderTime : 'off';
      if (backup.theme === 'light' || backup.theme === 'dark') applyTheme(backup.theme);
      $('#focusDuration').value = String(focusMinutes); $('#breakDuration').value = String(breakMinutes); $('#reminderTime').value = reminderTime;
      timerMode = 'focus'; timerRemaining = focusMinutes * 60; persistState(); renderQuests(); updatePlayer(); updateDailyProgress(); renderWeek(); renderWeeklyChallenge();
      renderAchievements(); renderHistory(); updateReminderStatus(); closeModal(els.profileModal); showToast('Backup restored. Your progress is back.'); checkAchievements();
    } catch (error) {
      showToast(error instanceof SyntaxError ? 'Could not read that JSON backup.' : error.message || 'Could not restore that backup.');
    } finally { event.target.value = ''; }
  }

  function timerDuration() { return (timerMode === 'focus' ? focusMinutes : breakMinutes) * 60; }

  function updateTimerDisplay() {
    const minutes = Math.floor(timerRemaining / 60); const seconds = timerRemaining % 60;
    els.timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const progress = 1 - timerRemaining / timerDuration();
    els.timerProgress.style.strokeDashoffset = String(490.1 * clamp(progress, 0, 1));
    els.timerToggle.textContent = timerRunning ? 'Pause session' : (timerRemaining === timerDuration() || timerRemaining === 0 ? `Start ${timerMode === 'focus' ? 'focus' : 'break'}` : 'Resume session');
    els.timerToggle.classList.toggle('is-running', timerRunning);
    els.timerStatus.textContent = timerRunning ? (timerMode === 'focus' ? 'YOU’RE IN THE ZONE' : 'TAKE A BREATH') : (timerRemaining === 0 ? (timerMode === 'focus' ? 'FOCUS COMPLETE' : 'BREAK COMPLETE') : (timerMode === 'focus' ? (timerRemaining === timerDuration() ? 'READY WHEN YOU ARE' : 'PAUSED — TAKE YOUR TIME') : (timerRemaining === timerDuration() ? 'BREAK WHEN YOU’RE READY' : 'BREAK PAUSED')));
    $('#focusDuration').disabled = timerRunning; $('#breakDuration').disabled = timerRunning;
    $('.timer-reward').innerHTML = timerMode === 'focus' ? '<span>✦</span> +25 XP after each focus session' : '<span>◷</span> Rest is part of the rhythm';
  }

  function finishTimer() {
    window.clearInterval(timerInterval); timerInterval = null; timerEndsAt = null; timerRunning = false; timerRemaining = 0;
    if (timerMode === 'focus') {
      const record = ensureDayRecord(); record.focus += focusMinutes; record.focusSessions += 1;
      timerMode = 'break'; timerRemaining = breakMinutes * 60;
      addXP(FOCUS_REWARD); showToast(`Focus session complete. Take a ${breakMinutes}-minute break — +25 XP.`);
    } else {
      timerMode = 'focus'; timerRemaining = focusMinutes * 60; showToast('Break complete. Start another focus session when you’re ready.');
    }
    persistState(); updateTimerDisplay(); renderHistory(); renderWeeklyChallenge();
  }

  function tickTimer() {
    if (!timerRunning || !timerEndsAt) return;
    timerRemaining = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
    if (timerRemaining <= 0) finishTimer(); else updateTimerDisplay();
  }

  function toggleTimer() {
    if (timerRunning) {
      timerRemaining = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000)); timerRunning = false; timerEndsAt = null;
      window.clearInterval(timerInterval); timerInterval = null;
    } else {
      if (timerRemaining <= 0) timerRemaining = timerDuration();
      timerRunning = true; timerEndsAt = Date.now() + timerRemaining * 1000; timerInterval = window.setInterval(tickTimer, 250);
    }
    updateTimerDisplay();
  }

  function resetTimer() {
    window.clearInterval(timerInterval); timerInterval = null; timerRunning = false; timerEndsAt = null; timerMode = 'focus'; timerRemaining = focusMinutes * 60; updateTimerDisplay();
  }

  function updateReminderStatus() {
    const status = $('#reminderStatus'); const button = $('#enableReminders');
    if (!('Notification' in window)) { status.textContent = 'This browser does not support notifications.'; button.disabled = true; return; }
    if (Notification.permission === 'granted') {
      button.textContent = 'Notifications enabled'; button.disabled = false;
      status.textContent = reminderTime === 'off' ? 'Choose a time to set a daily reminder.' : `Reminder set for ${reminderTime}. NEXLIFE must be open.`;
    } else if (Notification.permission === 'denied') {
      button.textContent = 'Notifications blocked'; button.disabled = true; status.textContent = 'Allow notifications in your browser settings to use reminders.';
    } else {
      button.textContent = 'Enable notifications'; button.disabled = false; status.textContent = 'Reminders run only while NEXLIFE is open.';
    }
  }

  async function enableReminders() {
    if (!('Notification' in window)) { showToast('This browser does not support notifications.'); return; }
    try {
      const permission = await Notification.requestPermission(); updateReminderStatus();
      if (permission === 'granted') { showToast('Notifications enabled. Choose a reminder time.'); checkReminder(); }
      else showToast(permission === 'denied' ? 'Notifications were blocked in your browser.' : 'Notification permission was not granted.');
    } catch { showToast('Could not request notification permission.'); }
  }

  async function checkReminder() {
    if (currentDay !== getToday()) {
      checkNewDay();
      renderQuests();
      updateDailyProgress();
      renderWeek();
      renderWeeklyChallenge();
    }
    updateReminderStatus();
    if (reminderTime === 'off' || !('Notification' in window) || Notification.permission !== 'granted') return;
    const now = new Date(); const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const stamp = `${getToday()} ${time}`;
    if (time !== reminderTime || reminderLastSent === stamp) return;
    reminderLastSent = stamp; persistState();
    const title = 'A small step for today?'; const options = { body: 'Your NEXLIFE quests are ready whenever you are.', icon: new URL('./icon.svg', location.href).href, tag: 'nexlife-daily-reminder' };
    try {
      const registration = await navigator.serviceWorker?.ready;
      if (registration?.showNotification) await registration.showNotification(title, options);
      else new Notification(title, options);
    } catch (error) { console.info('Reminder notification could not be shown:', error); }
  }

  function setReminderTime(value) {
    reminderTime = ['off', '09:00', '12:00', '17:00', '20:00'].includes(value) ? value : 'off';
    persistState(); updateReminderStatus(); checkReminder();
  }

  function bindEvents() {
    $$('.nav-item').forEach((button) => button.addEventListener('click', () => showPage(button.dataset.page)));
    $$('.domain-card').forEach((button) => button.addEventListener('click', () => showPage(button.dataset.domain)));
    $$('.domain-add').forEach((button) => button.addEventListener('click', () => openQuestModal({ domain: button.dataset.createDomain })));
    $('#openQuest').addEventListener('click', () => openQuestModal());
    $('#questForm').addEventListener('submit', submitQuest);
    $('#questRecurrence').addEventListener('change', updateRepeatControls);
    $('#editProfile').addEventListener('click', () => { $('#playerNameInput').value = playerName === 'PLAYER' ? '' : playerName; openModal(els.profileModal); });
    $('#profileForm').addEventListener('submit', saveProfile);
    $('#exportData').addEventListener('click', exportBackup); $('#profileExport').addEventListener('click', exportBackup); $('#importData').addEventListener('change', importBackup);
    $('#openTemplates').addEventListener('click', () => openModal(els.templateModal));
    $('#themeToggle').addEventListener('click', () => applyTheme(currentTheme === 'dark' ? 'light' : 'dark'));
    $('#closeTemplates').addEventListener('click', () => closeModal(els.templateModal));
    $('#closeQuest').addEventListener('click', () => closeModal(els.questModal)); $('#closeProfile').addEventListener('click', () => closeModal(els.profileModal));
    $$('.modal').forEach((modal) => modal.addEventListener('click', (event) => { if (event.target === modal || event.target.classList.contains('modal-backdrop')) closeModal(modal); }));
    $('#completeBoss').addEventListener('click', completeBoss);
    $$('.filter-button').forEach((button) => button.addEventListener('click', () => setFilter(button.dataset.filter)));
    els.timerToggle.addEventListener('click', toggleTimer); els.timerReset.addEventListener('click', resetTimer);
    $('#focusDuration').value = String(focusMinutes); $('#breakDuration').value = String(breakMinutes);
    $('#dailyJournalForm').addEventListener('submit', saveDailyJournal);
    $('#journalEntry').addEventListener('input', updateJournalCount);
    $('#focusDuration').addEventListener('change', () => { focusMinutes = Number($('#focusDuration').value); persistState(); resetTimer(); });
    $('#breakDuration').addEventListener('change', () => { breakMinutes = Number($('#breakDuration').value); if (timerMode === 'break') { timerRemaining = breakMinutes * 60; } persistState(); updateTimerDisplay(); });
    $('#reminderTime').value = reminderTime; $('#reminderTime').addEventListener('change', (event) => setReminderTime(event.target.value));
    $('#enableReminders').addEventListener('click', enableReminders);
    $('#closeLevelUp').addEventListener('click', closeLevelUp);
    els.levelUp.addEventListener('click', (event) => { if (event.target === els.levelUp) closeLevelUp(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkReminder(); });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        for (const modal of $$('.modal.show')) closeModal(modal);
        if (els.levelUp.classList.contains('show')) closeLevelUp();
      }
    });
  }

  function init() {
    applyTheme(currentTheme);
    checkNewDay(); verifyStreak(); updateDate(); updatePlayer(); renderQuests(); updateDailyProgress(); updateBoss(); renderWeek(); renderWeeklyChallenge(); renderAchievements(); renderHistory(); renderTemplates(); updateTimerDisplay(); bindEvents(); updateReminderStatus();
    reminderInterval = window.setInterval(checkReminder, 20000);
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./service-worker.js').catch((error) => console.info('Offline cache is not available:', error));
  }

  init();
})();
