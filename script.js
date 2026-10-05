/* NEXLIFE — private, local-first life RPG */
(() => {
  'use strict';

  const XP_PER_LEVEL = 500;
  const FOCUS_SECONDS = 25 * 60;
  const FOCUS_REWARD = 25;
  const QUEST_DOMAINS = ['study', 'trading', 'fitness', 'projects', 'growth'];
  const DOMAIN_NAMES = { study: 'Study', trading: 'Trading', fitness: 'Fitness', projects: 'Projects', growth: 'Self growth' };
  const DOMAIN_ICONS = { study: '◈', trading: '⌁', fitness: '✳', projects: '⌘', growth: '◎' };
  const DEFAULT_QUESTS = [
    { id: 'study-default', name: 'Study economics for 30 minutes', domain: 'study', reward: 80, description: 'Choose one idea and give it your full attention.', completed: false },
    { id: 'trading-default', name: 'Review two market charts', domain: 'trading', reward: 50, description: 'Write down what you notice before making a prediction.', completed: false },
    { id: 'fitness-default', name: 'Move your body', domain: 'fitness', reward: 100, description: 'A workout, a walk, or any movement that feels good.', completed: false },
    { id: 'projects-default', name: 'Build something for 30 minutes', domain: 'projects', reward: 60, description: 'Take one small, visible step on a project.', completed: false },
    { id: 'growth-default', name: 'Read 10 pages', domain: 'growth', reward: 30, description: 'Learn something that helps you see things differently.', completed: false }
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const safeParse = (value, fallback) => {
    try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
  };
  const getToday = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const offsetDate = (days) => { const date = new Date(); date.setDate(date.getDate() + days); return date; };
  const getYesterday = () => getToday(offsetDate(-1));
  const clamp = (number, min, max) => Math.max(min, Math.min(max, number));
  const formatNumber = (number) => new Intl.NumberFormat().format(number);

  const storedQuests = safeParse(localStorage.getItem('nexlife_quests'), null);
  let quests = Array.isArray(storedQuests) ? storedQuests.map(normalizeQuest).filter(Boolean) : structuredClone(DEFAULT_QUESTS);
  let totalXP = Math.max(0, Number(localStorage.getItem('nexlife_totalXP')) || 0);
  let todayXP = Math.max(0, Number(localStorage.getItem('nexlife_todayXP')) || 0);
  let streak = Math.max(0, Number(localStorage.getItem('nexlife_streak')) || 0);
  let lastActive = localStorage.getItem('nexlife_lastActive') || null;
  let currentDay = localStorage.getItem('nexlife_day') || getToday();
  let bossCompleted = localStorage.getItem('nexlife_boss') === getToday();
  let playerName = localStorage.getItem('nexlife_player') || 'PLAYER';
  let dailyHistory = safeParse(localStorage.getItem('nexlife_history'), {});
  if (!dailyHistory || typeof dailyHistory !== 'object' || Array.isArray(dailyHistory)) dailyHistory = {};
  let activeFilter = 'all';
  let toastTimeout;
  let focusInterval = null;
  let focusRemaining = FOCUS_SECONDS;
  let focusEndsAt = null;
  let focusRunning = false;

  const els = {
    level: $('#level'), sideLevel: $('#sideLevel'), xpText: $('#xpText'), xpFill: $('#xpFill'), totalXP: $('#totalXP'), todayXP: $('#todayXP'),
    streak: $('#streak'), sideStreak: $('#sideStreak'), sideXP: $('#sideXP'), questList: $('#questList'), progressPercent: $('#progressPercent'),
    dailyProgressFill: $('#dailyProgressFill'), dateBox: $('#dateBox'), pageTitle: $('#pageTitle'), pageSubtitle: $('#pageSubtitle'),
    questModal: $('#questModal'), profileModal: $('#profileModal'), xpPopup: $('#xpPopup'), levelUp: $('#levelUp'), newLevel: $('#newLevel'),
    bossButton: $('#completeBoss'), bossStatus: $('#bossStatus'), toast: $('#toast'), timerDisplay: $('#timerDisplay'),
    timerStatus: $('#timerStatus'), timerProgress: $('#timerProgress'), timerToggle: $('#timerToggle'), timerReset: $('#timerReset')
  };

  function normalizeQuest(item) {
    if (!item || typeof item !== 'object' || typeof item.name !== 'string' || !item.name.trim()) return null;
    const domain = QUEST_DOMAINS.includes(item.domain) ? item.domain : 'growth';
    return {
      id: String(item.id || `quest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`).slice(0, 100),
      name: item.name.trim().slice(0, 72), domain,
      reward: clamp(Number(item.reward) || 50, 5, 500),
      description: String(item.description || '').slice(0, 180),
      completed: Boolean(item.completed)
    };
  }

  function ensureTodayRecord() {
    const today = getToday();
    if (!dailyHistory[today] || typeof dailyHistory[today] !== 'object') dailyHistory[today] = { xp: 0, quests: 0, focus: 0 };
    dailyHistory[today].xp = Math.max(0, Number(dailyHistory[today].xp) || 0);
    dailyHistory[today].quests = Math.max(0, Number(dailyHistory[today].quests) || 0);
    dailyHistory[today].focus = Math.max(0, Number(dailyHistory[today].focus) || 0);
    return dailyHistory[today];
  }

  function saveState() {
    try {
      localStorage.setItem('nexlife_quests', JSON.stringify(quests));
      localStorage.setItem('nexlife_totalXP', String(totalXP));
      localStorage.setItem('nexlife_todayXP', String(todayXP));
      localStorage.setItem('nexlife_streak', String(streak));
      localStorage.setItem('nexlife_lastActive', lastActive || '');
      localStorage.setItem('nexlife_day', getToday());
      localStorage.setItem('nexlife_player', playerName);
      localStorage.setItem('nexlife_history', JSON.stringify(dailyHistory));
      if (bossCompleted) localStorage.setItem('nexlife_boss', getToday());
      else localStorage.removeItem('nexlife_boss');
    } catch (error) {
      showToast('Your browser could not save progress. Try freeing up local storage.');
      console.warn('NEXLIFE could not persist local progress:', error);
    }
  }

  function checkNewDay() {
    const today = getToday();
    if (currentDay !== today) {
      quests = quests.map((quest) => ({ ...quest, completed: false }));
      todayXP = 0;
      bossCompleted = false;
      currentDay = today;
      localStorage.removeItem('nexlife_perfect_day');
      saveState();
    }
    ensureTodayRecord();
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
    const percent = (currentXP / XP_PER_LEVEL) * 100;
    els.level.textContent = level;
    els.sideLevel.textContent = level;
    els.xpText.textContent = `${formatNumber(currentXP)} / ${XP_PER_LEVEL} XP`;
    els.xpFill.style.width = `${percent}%`;
    const xpTrack = $('.xp-track');
    if (xpTrack) xpTrack.setAttribute('aria-valuenow', String(currentXP));
    els.totalXP.textContent = formatNumber(totalXP);
    els.todayXP.textContent = formatNumber(todayXP);
    els.streak.textContent = streak;
    els.sideStreak.textContent = streak;
    els.sideXP.textContent = formatNumber(totalXP);
    $('#sidePlayerName').textContent = playerName;
    if (previousLevel !== null && level > previousLevel) showLevelUp(level);
  }

  function addXP(amount, { recordActivity = true } = {}) {
    const safeAmount = Math.max(0, Math.round(Number(amount) || 0));
    if (!safeAmount) return;
    const previousLevel = getLevel();
    totalXP += safeAmount;
    todayXP += safeAmount;
    ensureTodayRecord().xp += safeAmount;
    if (recordActivity) registerActivity();
    saveState();
    updatePlayer(previousLevel);
    updateDailyProgress();
    renderWeek();
    showXP(safeAmount);
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

  function showToast(message) {
    window.clearTimeout(toastTimeout);
    els.toast.textContent = message;
    els.toast.classList.add('show');
    toastTimeout = window.setTimeout(() => els.toast.classList.remove('show'), 2800);
  }

  function renderQuests() {
    const visibleQuests = quests.filter((quest) => {
      if (activeFilter === 'active') return !quest.completed;
      if (activeFilter === 'completed') return quest.completed;
      return true;
    });
    els.questList.replaceChildren();
    $('#questCount').textContent = `${quests.filter((quest) => !quest.completed).length}`;

    if (!visibleQuests.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      if (quests.length === 0) {
        empty.innerHTML = '<strong>Your day is a blank page.</strong>Add a small quest to get your momentum going.';
      } else if (activeFilter === 'completed') {
        empty.innerHTML = '<strong>No finished quests just yet.</strong>Your completed missions will live here.';
      } else if (activeFilter === 'active') {
        empty.innerHTML = '<strong>All caught up.</strong>Try another filter, or add a new quest for today.';
      } else {
        empty.innerHTML = '<strong>No quests for today.</strong>Add one meaningful next step to get started.';
      }
      els.questList.append(empty);
      updateDailyProgress();
      return;
    }

    for (const quest of visibleQuests) {
      const card = document.createElement('article');
      card.className = `quest${quest.completed ? ' completed' : ''}`;
      const check = document.createElement('button');
      check.className = 'quest-check';
      check.type = 'button';
      check.dataset.id = quest.id;
      check.setAttribute('aria-label', quest.completed ? `Mark ${quest.name} incomplete` : `Complete ${quest.name}`);
      check.setAttribute('aria-pressed', String(quest.completed));
      check.textContent = quest.completed ? '✓' : '';
      check.addEventListener('click', () => completeQuest(quest.id));

      const main = document.createElement('div');
      main.className = 'quest-main';
      const title = document.createElement('div');
      title.className = 'quest-title';
      title.textContent = quest.name;
      const description = document.createElement('div');
      description.className = 'quest-description';
      description.textContent = quest.description || 'A small step, just for today.';
      const domain = document.createElement('span');
      domain.className = 'quest-domain';
      domain.textContent = `${DOMAIN_ICONS[quest.domain]}  ${DOMAIN_NAMES[quest.domain]}`;
      main.append(title, description, domain);

      const reward = document.createElement('span');
      reward.className = 'quest-xp';
      reward.textContent = `+${quest.reward} XP`;
      const remove = document.createElement('button');
      remove.className = 'delete-quest';
      remove.type = 'button';
      remove.setAttribute('aria-label', `Delete ${quest.name}`);
      remove.title = 'Delete quest';
      remove.textContent = '×';
      remove.addEventListener('click', () => deleteQuest(quest.id));
      card.append(check, main, reward, remove);
      els.questList.append(card);
    }
    updateDailyProgress();
  }

  function completeQuest(id) {
    const quest = quests.find((item) => item.id === id);
    if (!quest || quest.completed) return;
    quest.completed = true;
    ensureTodayRecord().quests += 1;
    addXP(quest.reward);
    saveState();
    renderQuests();
    updateDailyProgress();
    updateBoss();
  }

  function deleteQuest(id) {
    quests = quests.filter((quest) => quest.id !== id);
    saveState();
    renderQuests();
    updateBoss();
    showToast('Quest removed from today.');
  }

  function updateDailyProgress() {
    const completed = quests.filter((quest) => quest.completed).length;
    const percent = quests.length ? Math.round((completed / quests.length) * 100) : 0;
    els.progressPercent.textContent = `${percent}%`;
    els.dailyProgressFill.style.width = `${percent}%`;
    $('.daily-track').setAttribute('aria-valuenow', String(percent));
    $('#dailyProgressText').textContent = `${completed} of ${quests.length} quest${quests.length === 1 ? '' : 's'}`;
    const remaining = quests.length - completed;
    $('#progressRemaining').textContent = remaining === 0 ? (quests.length ? 'All done — lovely work.' : 'Add your first quest') : `${remaining} left to go`;
    updateBoss();
  }

  function updateBoss() {
    const completed = quests.filter((quest) => quest.completed).length;
    $('#bossQuestCount').textContent = `${completed} / ${quests.length} complete`;
    if (bossCompleted) {
      els.bossButton.disabled = true;
      els.bossButton.classList.add('completed');
      els.bossButton.innerHTML = 'Daily boss defeated <span>✓</span>';
      els.bossStatus.textContent = 'You showed up for yourself today. Bonus earned.';
    } else if (quests.length === 0) {
      els.bossButton.disabled = true;
      els.bossButton.classList.remove('completed');
      els.bossButton.innerHTML = 'Create a quest to begin <span>→</span>';
      els.bossStatus.textContent = 'Start with one small promise to yourself.';
    } else if (completed < quests.length) {
      els.bossButton.disabled = true;
      els.bossButton.classList.remove('completed');
      els.bossButton.innerHTML = 'Finish today’s quests first <span>→</span>';
      els.bossStatus.textContent = 'Complete all of today’s quests to unlock your bonus.';
    } else {
      els.bossButton.disabled = false;
      els.bossButton.classList.remove('completed');
      els.bossButton.innerHTML = 'Claim your daily bonus <span>→</span>';
      els.bossStatus.textContent = 'Every quest is complete. Claim your well-earned bonus.';
    }
  }

  function completeBoss() {
    if (bossCompleted || !quests.length || !quests.every((quest) => quest.completed)) return;
    bossCompleted = true;
    saveState();
    addXP(100);
    updateBoss();
    showToast('Daily boss defeated. +100 XP — that was all you.');
  }

  function renderWeek() {
    const today = getToday();
    const records = [];
    for (let dayOffset = -6; dayOffset <= 0; dayOffset += 1) {
      const date = offsetDate(dayOffset);
      const dateKey = getToday(date);
      const xp = Math.max(0, Number(dailyHistory[dateKey]?.xp) || 0);
      records.push({ date, dateKey, xp, today: dateKey === today });
    }
    const maxXP = Math.max(100, ...records.map((record) => record.xp));
    const total = records.reduce((sum, record) => sum + record.xp, 0);
    const daysActive = records.filter((record) => record.xp > 0).length;
    $('#weekTotal').textContent = `${formatNumber(total)} XP`;
    $('#weekDaysActive').textContent = `${daysActive} active day${daysActive === 1 ? '' : 's'}`;
    const wrapper = $('#weekActivity');
    wrapper.replaceChildren();
    for (const record of records) {
      const day = document.createElement('div');
      day.className = 'week-day';
      const track = document.createElement('div');
      track.className = 'week-bar-track';
      track.title = `${record.date.toLocaleDateString(undefined, { weekday: 'long' })}: ${record.xp} XP`;
      const bar = document.createElement('div');
      bar.className = `week-bar${record.today ? ' today' : ''}`;
      bar.style.height = `${record.xp ? Math.max(7, Math.round((record.xp / maxXP) * 100)) : 3}%`;
      track.append(bar);
      const label = document.createElement('span');
      label.className = `week-day-label${record.today ? ' today' : ''}`;
      label.textContent = record.date.toLocaleDateString(undefined, { weekday: 'narrow' });
      day.append(track, label);
      wrapper.append(day);
    }
  }

  function updateDate() {
    els.dateBox.textContent = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function setFilter(filter) {
    activeFilter = filter;
    $$('.filter-button').forEach((button) => {
      const selected = button.dataset.filter === filter;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    renderQuests();
  }

  function showPage(pageId) {
    const page = document.getElementById(pageId);
    if (!page) return;
    $$('.page').forEach((item) => {
      const active = item.id === pageId;
      item.classList.toggle('active', active);
      item.hidden = !active;
    });
    $$('.nav-item').forEach((item) => {
      const active = item.dataset.page === pageId;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    const titles = {
      dashboard: ['Your overview', 'A little progress, repeated daily, becomes a lot.'],
      study: ['Study', 'Make room for curiosity.'],
      trading: ['Trading', 'Practice process over impulse.'],
      fitness: ['Fitness', 'Show up for the body you live in.'],
      projects: ['Projects', 'Turn a small idea into a real thing.'],
      growth: ['Self growth', 'Keep becoming someone you believe in.']
    };
    const [title, subtitle] = titles[pageId] || titles.dashboard;
    els.pageTitle.textContent = title;
    els.pageSubtitle.textContent = subtitle;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openModal(modal) {
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const focusTarget = $('input:not([type="file"]), select, textarea, button', modal);
    if (focusTarget) window.setTimeout(() => focusTarget.focus(), 40);
  }

  function closeModal(modal) {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    if (!$('.modal.show')) document.body.style.overflow = '';
  }

  function openQuestModal(domain = '') {
    if (domain && QUEST_DOMAINS.includes(domain)) $('#questDomain').value = domain;
    openModal(els.questModal);
  }

  function createQuest(event) {
    event.preventDefault();
    const name = $('#questName').value.trim();
    const domain = $('#questDomain').value;
    const reward = clamp(Number($('#questReward').value) || 50, 5, 500);
    const description = $('#questDescription').value.trim();
    if (!name || !QUEST_DOMAINS.includes(domain)) return;
    quests.push(normalizeQuest({ id: `quest-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`, name, domain, reward, description, completed: false }));
    saveState();
    setFilter('all');
    updateBoss();
    $('#questForm').reset();
    $('#questReward').value = '50';
    closeModal(els.questModal);
    showToast('Quest added. Make it yours.');
  }

  function saveProfile(event) {
    event.preventDefault();
    const value = $('#playerNameInput').value.trim().slice(0, 24);
    playerName = value || 'PLAYER';
    saveState();
    updatePlayer();
    closeModal(els.profileModal);
    showToast(`Good to have you here, ${playerName}.`);
  }

  function exportBackup() {
    const backup = {
      app: 'NEXLIFE', version: 1, exportedAt: new Date().toISOString(),
      playerName, quests, totalXP, todayXP, streak, lastActive, currentDay: getToday(), bossCompleted,
      dailyHistory
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexlife-backup-${getToday()}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Your private backup has been downloaded.');
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('That backup is larger than 2 MB.');
      const backup = JSON.parse(await file.text());
      if (backup.app !== 'NEXLIFE' || backup.version !== 1 || !Array.isArray(backup.quests)) {
        throw new Error('This file is not a supported NEXLIFE backup.');
      }
      const importedQuests = backup.quests.map(normalizeQuest).filter(Boolean);
      if (importedQuests.length !== backup.quests.length) throw new Error('Some quests in this backup are not valid.');
      const sameDay = backup.currentDay === getToday();
      quests = sameDay ? importedQuests : importedQuests.map((quest) => ({ ...quest, completed: false }));
      totalXP = Math.max(0, Number(backup.totalXP) || 0);
      todayXP = sameDay ? Math.max(0, Number(backup.todayXP) || 0) : 0;
      streak = Math.max(0, Number(backup.streak) || 0);
      lastActive = typeof backup.lastActive === 'string' ? backup.lastActive : null;
      playerName = String(backup.playerName || 'PLAYER').slice(0, 24);
      dailyHistory = backup.dailyHistory && typeof backup.dailyHistory === 'object' && !Array.isArray(backup.dailyHistory) ? backup.dailyHistory : {};
      bossCompleted = sameDay && Boolean(backup.bossCompleted);
      currentDay = getToday();
      saveState();
      renderQuests();
      updatePlayer();
      updateDailyProgress();
      renderWeek();
      closeModal(els.profileModal);
      showToast('Backup restored. Your progress is back.');
    } catch (error) {
      showToast(error instanceof SyntaxError ? 'Could not read that JSON backup.' : error.message || 'Could not restore that backup.');
    } finally {
      event.target.value = '';
    }
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(focusRemaining / 60);
    const seconds = focusRemaining % 60;
    els.timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const progress = 1 - focusRemaining / FOCUS_SECONDS;
    els.timerProgress.style.strokeDashoffset = String(490.1 * progress);
    els.timerToggle.textContent = focusRunning ? 'Pause session' : (focusRemaining === FOCUS_SECONDS || focusRemaining === 0 ? 'Start focus' : 'Resume session');
    els.timerToggle.classList.toggle('is-running', focusRunning);
    els.timerStatus.textContent = focusRunning ? 'YOU’RE IN THE ZONE' : (focusRemaining === 0 ? 'SESSION COMPLETE' : (focusRemaining === FOCUS_SECONDS ? 'READY WHEN YOU ARE' : 'PAUSED — TAKE YOUR TIME'));
  }

  function finishFocusSession() {
    window.clearInterval(focusInterval);
    focusInterval = null;
    focusRunning = false;
    focusRemaining = 0;
    ensureTodayRecord().focus += 25;
    addXP(FOCUS_REWARD);
    updateTimerDisplay();
    saveState();
    renderWeek();
    showToast('Focus session complete. Take a breath — +25 XP earned.');
  }

  function tickTimer() {
    if (!focusRunning || !focusEndsAt) return;
    focusRemaining = Math.max(0, Math.ceil((focusEndsAt - Date.now()) / 1000));
    if (focusRemaining <= 0) finishFocusSession();
    else updateTimerDisplay();
  }

  function toggleTimer() {
    if (focusRunning) {
      focusRemaining = Math.max(0, Math.ceil((focusEndsAt - Date.now()) / 1000));
      focusRunning = false;
      focusEndsAt = null;
      window.clearInterval(focusInterval);
      focusInterval = null;
    } else {
      if (focusRemaining <= 0) focusRemaining = FOCUS_SECONDS;
      focusRunning = true;
      focusEndsAt = Date.now() + focusRemaining * 1000;
      focusInterval = window.setInterval(tickTimer, 250);
    }
    updateTimerDisplay();
  }

  function resetTimer() {
    window.clearInterval(focusInterval);
    focusInterval = null;
    focusRunning = false;
    focusEndsAt = null;
    focusRemaining = FOCUS_SECONDS;
    updateTimerDisplay();
  }

  function bindEvents() {
    $$('.nav-item').forEach((button) => button.addEventListener('click', () => showPage(button.dataset.page)));
    $$('.domain-card').forEach((button) => button.addEventListener('click', () => showPage(button.dataset.domain)));
    $$('.domain-add').forEach((button) => button.addEventListener('click', () => openQuestModal(button.dataset.createDomain)));
    $('#openQuest').addEventListener('click', () => openQuestModal());
    $('#questForm').addEventListener('submit', createQuest);
    $('#editProfile').addEventListener('click', () => {
      $('#playerNameInput').value = playerName === 'PLAYER' ? '' : playerName;
      openModal(els.profileModal);
    });
    $('#profileForm').addEventListener('submit', saveProfile);
    $('#exportData').addEventListener('click', exportBackup);
    $('#profileExport').addEventListener('click', exportBackup);
    $('#importData').addEventListener('change', importBackup);
    $('#closeQuest').addEventListener('click', () => closeModal(els.questModal));
    $('#closeProfile').addEventListener('click', () => closeModal(els.profileModal));
    $$('.modal').forEach((modal) => {
      modal.addEventListener('click', (event) => { if (event.target === modal || event.target.classList.contains('modal-backdrop')) closeModal(modal); });
    });
    $('#completeBoss').addEventListener('click', completeBoss);
    $$('.filter-button').forEach((button) => button.addEventListener('click', () => setFilter(button.dataset.filter)));
    els.timerToggle.addEventListener('click', toggleTimer);
    els.timerReset.addEventListener('click', resetTimer);
    $('#closeLevelUp').addEventListener('click', closeLevelUp);
    els.levelUp.addEventListener('click', (event) => { if (event.target === els.levelUp) closeLevelUp(); });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (els.questModal.classList.contains('show')) closeModal(els.questModal);
        if (els.profileModal.classList.contains('show')) closeModal(els.profileModal);
        if (els.levelUp.classList.contains('show')) closeLevelUp();
      }
    });
  }

  function init() {
    checkNewDay();
    verifyStreak();
    updateDate();
    updatePlayer();
    renderQuests();
    updateDailyProgress();
    updateBoss();
    renderWeek();
    updateTimerDisplay();
    bindEvents();
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./service-worker.js').catch((error) => console.info('Offline cache is not available:', error));
    }
  }

  init();
})();
