
// Anti-inspection security scripts
document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
document.addEventListener('keydown', function(e) {
  if (e.key === 'F12' || e.keyCode === 123) { e.preventDefault(); }
  if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) { e.preventDefault(); }
  if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) { e.preventDefault(); }
  if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) { e.preventDefault(); }
  if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) { e.preventDefault(); }
});
