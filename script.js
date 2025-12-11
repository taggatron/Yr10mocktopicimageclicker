// GitHub Copilot (GPT-5)
// Simple interactive overlays over a composite image.

async function loadTopics() {
  const res = await fetch('topics.json');
  if (!res.ok) throw new Error('Failed to load topics.json');
  return res.json();
}

function px(n) { return `${n}px`; }

function makeOverlay(topic, imgRect, scaleX, scaleY, editMode, onChange) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.setAttribute('data-id', topic.id);
  overlay.title = `${topic.label} — ${topic.hint || ''}`;

  // Scale coordinates from topics.json to current rendered image size
  const left = imgRect.left + topic.x * scaleX;
  const top = imgRect.top + topic.y * scaleY;
  const width = topic.w * scaleX;
  const height = topic.h * scaleY;

  overlay.style.left = px(left - imgRect.left);
  overlay.style.top = px(top - imgRect.top);
  overlay.style.width = px(width);
  overlay.style.height = px(height);

  overlay.addEventListener('click', () => {
    const el = document.getElementById('selectedTopic');
    el.textContent = topic.label;
    // Trigger flash animation
    el.classList.remove('flash');
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add('flash');
  });

  if (editMode) {
    overlay.classList.add('editing');
    // Add drag to move
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;
    overlay.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('handle')) return; // handles manage resize
      e.preventDefault();
      startX = e.clientX; startY = e.clientY;
      startLeft = parseFloat(overlay.style.left); startTop = parseFloat(overlay.style.top);
      const move = (ev) => {
        const dx = ev.clientX - startX; const dy = ev.clientY - startY;
        overlay.style.left = px(startLeft + dx);
        overlay.style.top = px(startTop + dy);
      };
      const up = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        // Update topic using inverse scale to natural coords
        const newLeft = parseFloat(overlay.style.left);
        const newTop = parseFloat(overlay.style.top);
        topic.x = Math.round(newLeft / scaleX);
        topic.y = Math.round(newTop / scaleY);
        onChange && onChange();
      };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });

    // Add resize handles
    const handles = ['tl','tr','bl','br'];
    handles.forEach((pos) => {
      const h = document.createElement('div');
      h.className = `handle ${pos}`;
      overlay.appendChild(h);
      h.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startX = e.clientX; startY = e.clientY;
        const startW = parseFloat(overlay.style.width);
        const startH = parseFloat(overlay.style.height);
        const startL = parseFloat(overlay.style.left);
        const startT = parseFloat(overlay.style.top);
        const move = (ev) => {
          const dx = ev.clientX - startX; const dy = ev.clientY - startY;
          let w = startW, h2 = startH, l = startL, t = startT;
          if (pos.includes('r')) w = startW + dx; else { w = startW - dx; l = startL + dx; }
          if (pos.includes('b')) h2 = startH + dy; else { h2 = startH - dy; t = startT + dy; }
          overlay.style.width = px(Math.max(10, w));
          overlay.style.height = px(Math.max(10, h2));
          overlay.style.left = px(l);
          overlay.style.top = px(t);
        };
        const up = () => {
          document.removeEventListener('mousemove', move);
          document.removeEventListener('mouseup', up);
          const newLeft = parseFloat(overlay.style.left);
          const newTop = parseFloat(overlay.style.top);
          const newW = parseFloat(overlay.style.width);
          const newH = parseFloat(overlay.style.height);
          topic.x = Math.round(newLeft / scaleX);
          topic.y = Math.round(newTop / scaleY);
          topic.w = Math.round(newW / scaleX);
          topic.h = Math.round(newH / scaleY);
          onChange && onChange();
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
      });
    });
  }

  return overlay;
}

async function init() {
  const img = document.getElementById('topicsImage');
  const wrapper = img.parentElement;
  const selectedTopic = document.getElementById('selectedTopic');
  const toggleBtn = document.getElementById('toggleRegions');
  const editBtn = document.getElementById('toggleEdit');
  const exportBtn = document.getElementById('exportJson');

  selectedTopic.textContent = 'Loading…';

  // Wait for image to load to get dimensions
  await new Promise((resolve) => {
    if (img.complete) return resolve();
    img.onload = resolve;
    img.onerror = () => {
      selectedTopic.textContent = 'Missing image: place your file at assets/science-topics.png';
      resolve();
    };
  });

  const topics = await loadTopics();
  selectedTopic.textContent = 'No selection yet. Click an icon.';

  const naturalW = img.naturalWidth || 1000;
  const naturalH = img.naturalHeight || 700;
  const rect = img.getBoundingClientRect();
  const scaleX = rect.width / naturalW;
  const scaleY = rect.height / naturalH;

  const overlays = [];
  let editMode = false;
  const notifyChange = () => { /* no-op, could highlight save state */ };
  topics.forEach((t) => {
    const ov = makeOverlay(t, rect, scaleX, scaleY, editMode, notifyChange);
    overlays.push(ov);
    ov.classList.add('invisible'); // clickable but no visible outline by default
    wrapper.appendChild(ov);
  });

  let show = false;
  toggleBtn.addEventListener('click', () => {
    show = !show;
    overlays.forEach((ov) => {
      ov.classList.toggle('invisible', !show);
    });
    toggleBtn.textContent = show ? 'Hide Region Outlines' : 'Toggle Region Outlines';
  });

  editBtn.addEventListener('click', () => {
    editMode = !editMode;
    editBtn.textContent = editMode ? 'Disable Edit Mode' : 'Enable Edit Mode';
    // Rebuild overlays to attach edit handlers
    overlays.forEach((ov) => ov.remove());
    overlays.length = 0;
    const rect3 = img.getBoundingClientRect();
    const sx = rect3.width / naturalW;
    const sy = rect3.height / naturalH;
    topics.forEach((t) => {
      const ov = makeOverlay(t, rect3, sx, sy, editMode, notifyChange);
      overlays.push(ov);
      // When entering edit mode, make outlines visible to help alignment
      if (editMode) show = true;
      ov.classList.toggle('invisible', !show);
      wrapper.appendChild(ov);
    });
    toggleBtn.textContent = show ? 'Hide Region Outlines' : 'Toggle Region Outlines';
  });

  exportBtn.addEventListener('click', () => {
    const data = JSON.stringify(topics, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'topics.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // Reposition overlays on resize
  window.addEventListener('resize', () => {
    const rect2 = img.getBoundingClientRect();
    const scaleX2 = rect2.width / naturalW;
    const scaleY2 = rect2.height / naturalH;
    topics.forEach((t, i) => {
      const ov = overlays[i];
      const left = t.x * scaleX2;
      const top = t.y * scaleY2;
      const width = t.w * scaleX2;
      const height = t.h * scaleY2;
      ov.style.left = px(left);
      ov.style.top = px(top);
      ov.style.width = px(width);
      ov.style.height = px(height);
    });
  });
}

init().catch((e) => {
  const el = document.getElementById('selectedTopic');
  el.textContent = `Error: ${e.message}`;
});
