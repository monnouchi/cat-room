export function setupSettings({ button, panel, toggle, narration, initial = true,
  onChange, document: doc = globalThis.document }) {
  function apply(value) {
    toggle.checked = value;
    for (const element of narration) element.hidden = !value;
  }
  function close(focus = false) {
    panel.hidden = true; button.setAttribute('aria-expanded', 'false');
    if (focus) button.focus();
  }
  apply(initial);
  button.onclick = () => {
    const opening = panel.hidden;
    panel.hidden = !opening; button.setAttribute('aria-expanded', String(opening));
    if (opening) toggle.focus();
  };
  toggle.onchange = () => { apply(toggle.checked); onChange(toggle.checked); };
  doc.addEventListener('pointerdown', event => {
    if (!panel.hidden && !panel.contains(event.target) && !button.contains(event.target)) close();
  });
  doc.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { close(true); event.preventDefault(); }
  });
}
