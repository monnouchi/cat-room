export function setupCapture({ canvas, button, dialog, preview, save, share, close, status,
  navigator: nav = globalThis.navigator, document: doc = globalThis.document,
  URL: urls = globalThis.URL, File: FileType = globalThis.File }) {
  let busy = false, file, previewURL;
  function release() {
    if (previewURL) urls.revokeObjectURL(previewURL);
    previewURL = undefined; file = undefined; preview.removeAttribute('src');
  }
  dialog.addEventListener('close', release);
  close.onclick = () => { if (!busy) dialog.close(); };
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  button.onclick = async () => {
    if (busy || dialog.open) return;
    busy = true; button.disabled = true;
    try {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(value => value ? resolve(value) : reject(new Error('empty image')), 'image/png');
      });
      file = new FileType([blob], 'cat-room.png', { type: 'image/png' });
      previewURL = urls.createObjectURL(blob); preview.src = previewURL;
      share.hidden = true;
      try { share.hidden = !(typeof nav.share === 'function' && typeof nav.canShare === 'function'
        && nav.canShare({ files: [file] })); } catch {}
      save.disabled = false;
      status.textContent = ''; dialog.showModal();
    } catch {
      release(); status.textContent = 'しゃしんをつくれませんでした。もういちどためしてね。';
      share.hidden = true; save.disabled = true; dialog.showModal();
    } finally { busy = false; button.disabled = false; }
  };
  save.onclick = () => {
    if (busy || !file || save.disabled) return;
    try {
      const anchor = doc.createElement('a'); const downloadURL = urls.createObjectURL(file);
      anchor.href = downloadURL; anchor.download = file.name;
      try { doc.body.appendChild(anchor); anchor.click(); }
      finally { anchor.remove(); const timer = setTimeout(() => urls.revokeObjectURL(downloadURL), 30000); timer.unref?.(); }
      save.disabled = true;
      status.textContent = 'ほぞんをはじめました。';
    } catch { status.textContent = 'ほぞんできませんでした。もういちどためしてね。'; }
  };
  share.onclick = async () => {
    if (busy || !file) return;
    busy = true; share.disabled = save.disabled = true;
    try { await nav.share({ title: 'ねこのへや', files: [file] }); status.textContent = ''; }
    catch (error) {
      status.textContent = error.name === 'AbortError' ? '' : 'おくれませんでした。ほぞんもつかえます。';
    } finally { busy = false; share.disabled = save.disabled = false; }
  };
}

if (typeof document !== 'undefined') {
  const get = id => document.getElementById(id);
  setupCapture({ canvas: get('room'), button: get('capture'), dialog: get('photo-dialog'),
    preview: get('photo-preview'), save: get('photo-save'), share: get('photo-share'),
    close: get('photo-close'), status: get('photo-status') });
}
