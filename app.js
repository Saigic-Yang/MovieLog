const genres = ['剧情', '喜剧', '科幻', '动作', '动画', '纪录片', '悬疑'];
const storageKey = 'movielog.records.v1';

const state = {
  records: [],
  activeTab: 'record'
};

const refs = {
  tabs: document.querySelectorAll('.tab'),
  recordView: document.getElementById('record-view'),
  insightView: document.getElementById('insight-view'),
  form: document.getElementById('record-form'),
  title: document.getElementById('title'),
  genre: document.getElementById('genre'),
  rating: document.getElementById('rating'),
  ratingValue: document.getElementById('rating-value'),
  watchDate: document.getElementById('watch-date'),
  duration: document.getElementById('duration'),
  note: document.getElementById('note'),
  totalMovies: document.getElementById('total-movies'),
  avgRating: document.getElementById('avg-rating'),
  monthProgress: document.getElementById('month-progress'),
  totalHours: document.getElementById('total-hours'),
  topGenre: document.getElementById('top-genre'),
  genreBars: document.getElementById('genre-bars'),
  emptyState: document.getElementById('empty-state'),
  recentList: document.getElementById('recent-list')
};

function bootstrap() {
  refs.watchDate.value = new Date().toISOString().slice(0, 10);

  genres.forEach((genre) => {
    const option = document.createElement('option');
    option.value = genre;
    option.textContent = genre;
    refs.genre.appendChild(option);
  });

  refs.tabs.forEach((button) => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  });

  refs.rating.addEventListener('input', () => {
    refs.ratingValue.textContent = `${Number(refs.rating.value).toFixed(1)} ⭐`;
  });

  refs.form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveRecord();
  });

  loadRecords();
  renderInsights();
}

function switchTab(tabName) {
  state.activeTab = tabName;
  refs.tabs.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tabName);
  });

  refs.recordView.classList.toggle('hidden', tabName !== 'record');
  refs.insightView.classList.toggle('hidden', tabName !== 'insight');
}

function saveRecord() {
  const record = {
    id: crypto.randomUUID(),
    title: refs.title.value.trim(),
    genre: refs.genre.value,
    rating: Number(refs.rating.value),
    watchDate: refs.watchDate.value,
    durationMinutes: Number(refs.duration.value),
    note: refs.note.value.trim()
  };

  if (!record.title || !record.watchDate || record.durationMinutes <= 0) {
    return;
  }

  state.records.unshift(record);
  persistRecords();
  refs.form.reset();
  refs.watchDate.value = new Date().toISOString().slice(0, 10);
  refs.rating.value = '4';
  refs.ratingValue.textContent = '4.0 ⭐';

  renderInsights();
  switchTab('insight');
}

function loadRecords() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      state.records = parsed;
    }
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function persistRecords() {
  localStorage.setItem(storageKey, JSON.stringify(state.records));
}

function renderInsights() {
  const total = state.records.length;
  const totalRating = state.records.reduce((sum, item) => sum + item.rating, 0);
  const totalMinutes = state.records.reduce((sum, item) => sum + item.durationMinutes, 0);
  const avgRating = total === 0 ? 0 : totalRating / total;
  const month = new Date().toISOString().slice(0, 7);
  const monthProgress = state.records.filter((item) => item.watchDate.startsWith(month)).length;

  const genreCount = Object.fromEntries(genres.map((genre) => [genre, 0]));
  state.records.forEach((item) => {
    genreCount[item.genre] += 1;
  });

  const topGenreEntry = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0];

  refs.totalMovies.textContent = `${total} 部`;
  refs.avgRating.textContent = `${avgRating.toFixed(2)} ⭐`;
  refs.monthProgress.textContent = `${monthProgress} 部`;
  refs.totalHours.textContent = `${(totalMinutes / 60).toFixed(1)} 小时`;
  refs.topGenre.textContent = topGenreEntry?.[1] > 0 ? topGenreEntry[0] : '暂无数据';

  refs.genreBars.innerHTML = '';
  Object.entries(genreCount).forEach(([genre, value]) => {
    const row = document.createElement('div');
    row.className = 'bar-row';

    const label = document.createElement('span');
    label.textContent = genre;

    const track = document.createElement('div');
    track.className = 'bar-track';

    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.width = total === 0 ? '0%' : `${(value / total) * 100}%`;
    track.appendChild(bar);

    const count = document.createElement('em');
    count.textContent = value;

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(count);
    refs.genreBars.appendChild(row);
  });

  renderRecent();
}

function renderRecent() {
  const recent = state.records.slice(0, 5);
  refs.recentList.innerHTML = '';
  refs.emptyState.classList.toggle('hidden', recent.length > 0);

  recent.forEach((item) => {
    const li = document.createElement('li');

    const left = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = item.title;
    const meta = document.createElement('p');
    meta.textContent = `${item.genre} · ${item.watchDate} · ${item.durationMinutes} 分钟`;
    left.appendChild(title);
    left.appendChild(meta);

    const score = document.createElement('span');
    score.textContent = `${item.rating.toFixed(1)}⭐`;

    li.appendChild(left);
    li.appendChild(score);
    refs.recentList.appendChild(li);
  });
}

bootstrap();
