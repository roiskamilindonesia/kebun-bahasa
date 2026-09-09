const fruits = [
  ['grape', 'Anggur', 'Grape', 'عِنَب'],
  ['orange', 'Jeruk', 'Orange', 'بُرْتُقَال'],
  ['mango', 'Mangga', 'Mango', 'مَانْجُو'],
  ['apple', 'Apel', 'Apple', 'تُفَّاح'],
  ['banana', 'Pisang', 'Banana', 'مَوْز'],
  ['strawberry', 'Stroberi', 'Strawberry', 'فَرَاوِلَة'],
];
const choices = [
  [1, 2, 0],
  [1, 3, 4],
  [5, 2, 0],
  [4, 5, 3],
  [4, 1, 2],
  [0, 5, 3],
];
let lang = 'en',
  round = 0,
  phase = 'learn',
  heard = false,
  selected = null,
  dragging = null,
  suppressClick = false;
const $ = (id) => document.getElementById(id);
const say = (name, key, done) => {
  const a = new Audio(`./audio/${name}-${lang}.wav`);
  a.onended = done || (() => {});
  a.play().catch(() =>
    alert('Suara belum bisa diputar. Periksa volume dan coba lagi.'),
  );
};
function render() {
  const f = fruits[round],
    name = lang === 'en' ? f[2] : f[3];
  $('bar').style.width = `${(round / 6) * 100}%`;
  $('score').textContent = round;
  $('round').textContent = `Buah ${round + 1} dari 6`;
  $('number').textContent = String(round + 1).padStart(2, '0');
  $('fruit-image').src = `./fruits/${f[0]}.webp`;
  $('fruit-image').alt = f[1];
  $('label').textContent =
    heard || phase === 'quiz' ? name : 'Ini buah apa, ya?';
  $('sub').textContent =
    heard || phase === 'quiz' ? f[1] : 'Sentuh gambar untuk mendengar';
  $('title').textContent =
    phase === 'learn' ? 'Yuk, kenalan dengan buah!' : 'Suara mana yang cocok?';
  $('step1').className = phase === 'learn' ? 'active' : '';
  $('step2').className = phase === 'quiz' ? 'active' : '';
  $('learn').hidden = phase !== 'learn';
  $('quiz').hidden = phase !== 'quiz';
  $('start').disabled = !heard;
  $('dots').innerHTML = fruits
    .map(
      (_, i) =>
        `<i class="dot ${i < round ? 'done' : i === round ? 'current' : ''}">${i < round ? '✓' : i + 1}</i>`,
    )
    .join('');
  if (phase === 'quiz') renderQuiz();
}
function renderQuiz() {
  const list = choices[round] || [];
  $('options').innerHTML = list
    .map(
      (index, slot) =>
        `<button class="option ${selected === slot ? 'selected' : ''}" data-slot="${slot}"><span>🔊</span><small>Suara ${slot + 1}</small></button>`,
    )
    .join('');
  document.querySelectorAll('.option').forEach((button) => {
    const slot = +button.dataset.slot;
    button.onclick = () => {
      if (suppressClick) return;
      selected = slot;
      renderQuiz();
      say(fruits[list[slot]][0], `choice-${slot}`);
    };
    button.onpointerdown = (e) => {
      dragging = {
        slot,
        pointerId: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        moved: false,
      };
    };
  });
}
function inside(x, y) {
  const b = $('drop').getBoundingClientRect();
  return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
}
window.addEventListener(
  'pointermove',
  (e) => {
    if (!dragging || e.pointerId !== dragging.pointerId) return;
    if (Math.hypot(e.clientX - dragging.x, e.clientY - dragging.y) > 8)
      dragging.moved = true;
    if (!dragging.moved) return;
    e.preventDefault();
    $('drop').classList.toggle('dragover', inside(e.clientX, e.clientY));
  },
  { passive: false },
);
window.addEventListener(
  'pointerup',
  (e) => {
    if (!dragging || e.pointerId !== dragging.pointerId) return;
    if (dragging.moved) {
      e.preventDefault();
      suppressClick = true;
      setTimeout(() => (suppressClick = false), 350);
      if (inside(e.clientX, e.clientY)) answer(dragging.slot);
    }
    dragging = null;
    $('drop').classList.remove('dragover');
  },
  { passive: false },
);
window.addEventListener('pointercancel', () => {
  dragging = null;
  $('drop').classList.remove('dragover');
});
function answer(slot) {
  if (selected === null) selected = slot;
  const correct = choices[round][slot] === round;
  const box = $('drop');
  box.className = correct ? 'correct' : 'wrong';
  box.innerHTML = correct
    ? '<i>✓</i><b>Betul! Kamu hebat!</b><small>Kata berikutnya sudah siap.</small>'
    : '<i>↻</i><b>Belum cocok. Coba lagi, yuk!</b><small>Dengarkan kata contohnya sekali lagi.</small>';
  if (correct) {
    say('correct', 'feedback');
    $('next').hidden = false;
  } else say('retry', 'feedback');
}
$('fruit').onclick = () =>
  say(fruits[round][0], 'word', () => {
    heard = true;
    render();
  });
$('start').onclick = () => {
  phase = 'quiz';
  render();
};
$('drop').onclick = () => {
  if (selected !== null) answer(selected);
};
$('next').onclick = () => {
  round++;
  selected = null;
  heard = false;
  $('next').hidden = true;
  $('drop').className = '';
  $('drop').innerHTML =
    '<i>🎧</i><b>Taruh suaramu di sini</b><small>Geser tombol suara ke kotak ini</small>';
  if (round === 6) {
    $('play').hidden = true;
    $('complete').hidden = false;
    $('bar').style.width = '100%';
    $('score').textContent = 6;
  } else {
    phase = 'learn';
    render();
  }
};
$('again').onclick = () => {
  round = 0;
  phase = 'learn';
  heard = false;
  selected = null;
  $('complete').hidden = true;
  $('play').hidden = false;
  render();
};
['en', 'ar'].forEach(
  (code) =>
    ($(code).onclick = () => {
      lang = code;
      document
        .querySelectorAll('.lang')
        .forEach((x) => x.classList.toggle('active', x.id === code));
      round = 0;
      phase = 'learn';
      heard = false;
      selected = null;
      render();
    }),
);
$('guide').onclick = () => $('dialog').showModal();
$('close').onclick = $('okay').onclick = () => $('dialog').close();
render();
