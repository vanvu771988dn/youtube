import React, { useMemo, useState, useEffect } from 'react';
import { getAllBookmarks, removeBookmark } from '../lib/bookmarks';
import BookmarkIcon from './icons/BookmarkIcon';

const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(getAllBookmarks());

  useEffect(() => {
    if (!open) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'trendhub.bookmarks.v1') {
        setItems(getAllBookmarks());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [open]);

  const count = items.length;

  return (
    <header className="bg-slate-800/80 backdrop-blur-sm sticky top-0 z-20 shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-cyan-400">
          Trend<span className="text-white">Hub</span>
        </h1>
        <button
          type="button"
          onClick={() => { setItems(getAllBookmarks()); setOpen(v => !v); }}
          className="relative flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold px-3 py-2 rounded"
          aria-expanded={open}
          aria-controls="bookmarks-panel"
          title="View bookmarks"
        >
          <BookmarkIcon filled className="h-5 w-5" />
          Bookmarks
          {count > 0 && (
            <span className="ml-1 bg-yellow-400 text-black text-xs px-2 py-0.5 rounded-full font-bold">{count}</span>
          )}
        </button>
      </div>

      {open && (
        <div id="bookmarks-panel" className="bg-slate-900/95 border-t border-slate-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Saved Bookmarks</h2>
              <button onClick={() => setOpen(false)} className="text-slate-300 hover:text-white">Close</button>
            </div>
            {items.length === 0 ? (
              <p className="text-slate-400">No bookmarks yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map(item => (
                  <a key={`${item.platform}:${item.id}`} href={item.url} target="_blank" rel="noopener noreferrer" className="bg-slate-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition block">
                    <div className="relative h-36">
                      <img src={item.thumbnail} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute bottom-2 right-2">
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); removeBookmark(item.id, item.platform); setItems(getAllBookmarks()); }}
                          className="bg-black bg-opacity-70 text-white rounded-full p-1.5 hover:bg-opacity-90"
                          title="Remove bookmark"
                        >
                          <BookmarkIcon filled className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-sm font-semibold line-clamp-2" title={item.title}>{item.title}</div>
                      <div className="text-xs text-slate-400 mt-1">{item.creatorName}</div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
