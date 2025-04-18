const input = document.getElementById('note-input');
const addBtn = document.getElementById('add-btn');
const container = document.getElementById('notes-container');

// Load and render existing notes on popup open
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get({ notes: [] }, ({ notes }) => {
    renderNotes(notes);
  });
});

addBtn.addEventListener('click', () => {
  const text = input.value.trim();
  if (!text) return;
  // Fetch, update, and save
  chrome.storage.local.get({ notes: [] }, ({ notes }) => {
    const updated = [...notes, text];
    chrome.storage.local.set({ notes: updated }, () => {
      renderNotes(updated);
      input.value = '';
    });
  });
});

function renderNotes(notes) {
  container.innerHTML = '';
  notes.forEach((note, idx) => {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = `
      <span>${note}</span>
      <button data-idx="${idx}">&times;</button>
    `;
    container.appendChild(card);
  });
  // Attach delete handlers
  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', e => {
      const i = Number(e.target.dataset.idx);
      deleteNote(i);
    });
  });
}

function deleteNote(index) {
  chrome.storage.local.get({ notes: [] }, ({ notes }) => {
    notes.splice(index, 1);
    chrome.storage.local.set({ notes }, () => {
      renderNotes(notes);
    });
  });
}
