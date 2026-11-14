const base = (inner, cls = '') =>
  `<svg class="ico ${cls}" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

export const icons = {
  arrow: base('<path d="M4 12h15M13 6l6 6-6 6"/>', 'ico-arrow'),
  phone: base('<path d="M5 4h3.5l1.8 4.6-2.3 1.5a11 11 0 0 0 5.4 5.4l1.5-2.3L20 15v3.5a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z"/>'),
  chat: base('<path d="M4 5.5h16v11H10l-4.5 3.5v-3.5H4z"/><path d="M8 10h8M8 13h5"/>'),
  close: base('<path d="M6 6l12 12M18 6 6 18"/>'),
  chevron: base('<path d="M9 5l7 7-7 7"/>', 'ico-chevron'),
  expand: base('<path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5"/>'),
  copy: base('<rect x="8" y="8" width="11" height="11" rx="1.5"/><path d="M5 15V6a1.5 1.5 0 0 1 1.5-1.5H15"/>'),
  edit: base('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
};
