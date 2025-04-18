// 1) Inject tab & panel
const tab = document.createElement('div');
tab.id = 'mini-notes-tab';
tab.textContent = 'Notes';
document.body.appendChild(tab);

const panel = document.createElement('div');
panel.id = 'mini-notes-panel';
panel.innerHTML = `
  <div id="notes-list"></div>
  <form id="new-note-form">
    <textarea id="new-note" placeholder="New note…"></textarea>
    <button id="add-note-btn" type="submit">Add</button>
  </form>
`;
document.body.appendChild(panel);

// 2) Toggle panel
tab.addEventListener('click', e => {
    e.stopPropagation();
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) refreshNotes();
});
document.addEventListener('click', e => {
    if (!panel.contains(e.target) && e.target !== tab) {
        panel.classList.remove('open');
    }
});
panel.addEventListener('click', e => e.stopPropagation());

// 3) Storage helpers
const now = () => Date.now();

function getNotes(cb) {
    chrome.storage.local.get({ notes: [] }, ({ notes }) => {
        const objs = notes.map(n =>
            typeof n === 'string'
                ? { text: n, created: now(), last: now(), clicks: 0 }
                : n
        );
        if (notes.length && typeof notes[0] === 'string') {
            chrome.storage.local.set({ notes: objs }, () => cb(objs));
        } else cb(objs);
    });
}
function saveNotes(notes, cb) {
    chrome.storage.local.set({ notes }, cb);
}

// 4) Render
function refreshNotes() {
    getNotes(notes => {
        const list = document.getElementById('notes-list');
        list.innerHTML = '';
        notes.forEach((note, i) => {
            const card = document.createElement('div');
            card.className = 'note-card';

            // TEXT SPAN → single‑click: copy+count + enter edit
            const span = document.createElement('div');
            span.textContent = note.text;
            span.addEventListener('click', e => {
                e.stopPropagation();
                copyAndCount(i, note);
                enterEdit(i, span, note);
            });
            card.appendChild(span);

            // META
            const meta = document.createElement('div');
            meta.className = 'note-meta';
            meta.textContent =
                `Last: ${new Date(note.last).toLocaleString()}\n` +
                `Clicks: ${note.clicks}`;
            card.appendChild(meta);

            // DELETE
            const del = document.createElement('button');
            del.className = 'delete-btn';
            del.textContent = '×';
            del.addEventListener('click', e => {
                e.stopPropagation();
                deleteNote(i);
            });
            card.appendChild(del);

            list.appendChild(card);
        });
    });
}

// 5) Add new
document.getElementById('new-note-form').addEventListener('submit', e => {
    e.preventDefault();
    const ta = document.getElementById('new-note');
    const text = ta.value.trim();
    if (!text) return;
    getNotes(notes => {
        notes.push({ text, created: now(), last: now(), clicks: 0 });
        saveNotes(notes, () => {
            ta.value = '';
            refreshNotes();
        });
    });
});

// 6) Delete
function deleteNote(idx) {
    getNotes(notes => {
        notes.splice(idx, 1);
        saveNotes(notes, refreshNotes);
    });
}

// 7) Copy & count
function copyAndCount(idx, note) {
    navigator.clipboard.writeText(note.text).catch(() => { });
    getNotes(notes => {
        notes[idx].clicks++;
        notes[idx].last = now();
        saveNotes(notes, refreshNotes);
    });
}

// 8) Inline edit (single‑click)
function enterEdit(idx, span, note) {
    const ta = document.createElement('textarea');
    ta.className = 'note-edit';
    ta.value = note.text;
    span.replaceWith(ta);
    autoResize(ta);
    ta.focus();

    // grow with content
    ta.addEventListener('input', () => autoResize(ta));
    // blur → save
    ta.addEventListener('blur', () => {
        const newText = ta.value.trim();
        getNotes(notes => {
            notes[idx].text = newText;
            notes[idx].last = now();
            saveNotes(notes, refreshNotes);
        });
    });
}

// auto‑grow helper
function autoResize(ta) {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
}

function refreshNotes() {
    getNotes(notes => {
        const list = document.getElementById('notes-list');
        list.innerHTML = '';
        notes.forEach((note, i) => {
            const card = document.createElement('div');
            card.className = 'note-card';

            // 1) CLICKABLE TEXT → copy+count
            const span = document.createElement('div');
            span.textContent = note.text;
            span.addEventListener('click', e => {
                e.stopPropagation();
                copyAndCount(i, note);
            });
            card.appendChild(span);

            // 2) EDIT BUTTON ✎
            const edit = document.createElement('button');
            edit.className = 'edit-btn';
            edit.textContent = '✎';
            edit.addEventListener('click', e => {
                e.stopPropagation();
                enterEdit(i, span, note);
            });
            card.appendChild(edit);

            // 3) META INFO
            const meta = document.createElement('div');
            meta.className = 'note-meta';
            meta.textContent =
                `Last: ${new Date(note.last).toLocaleString()}\n` +
                `Clicks: ${note.clicks}`;
            card.appendChild(meta);

            // 4) DELETE BUTTON ×
            const del = document.createElement('button');
            del.className = 'delete-btn';
            del.textContent = '×';
            del.addEventListener('click', e => {
                e.stopPropagation();
                deleteNote(i);
            });
            card.appendChild(del);

            list.appendChild(card);
        });
    });
}