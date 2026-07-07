import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive, Bold, BookOpen, Check, ChevronDown, ChevronRight, Clock3, Download,
  Feather, FileText, Focus, Hash, Inbox, Italic, Library, List, MapPin, Menu,
  MoreHorizontal, NotebookPen, Plus, Quote, Route, ScrollText, Search, Settings2,
  Share2, Star, Target, Trash2, Type, UserRound, X,
} from 'lucide-react';

type GroupId = 'inbox' | 'project' | 'journal' | 'archive';
type ProjectSection = 'front' | 'prologue' | 'chapter' | 'epilogue' | 'afterword' | 'notes' | 'characters' | 'locations' | 'plot';
type Sheet = {
  id: string;
  group: GroupId;
  section?: ProjectSection;
  title: string;
  content: string;
  updatedAt: number;
  favorite?: boolean;
  goal?: number;
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const seedSheets: Sheet[] = [
  {
    id: 'morning', group: 'project', section: 'chapter', title: '清晨的房间', favorite: true, goal: 1200,
    updatedAt: Date.now() - 1000 * 60 * 3,
    content: `清晨六点，光从百叶窗的缝隙里慢慢渗进来。\n\n房间还保留着夜晚的安静，桌上的水杯映出一小块摇晃的天光。我没有立刻打开电脑，只是坐了一会儿，听见楼下第一辆自行车经过。\n\n## 关于缓慢\n\n我们总把开始想得太郑重，仿佛一定要有完整的计划、合适的天气，以及一种笃定的心情。可真正的开始往往很轻：写下一个句子，给一个模糊的念头留出位置。\n\n> 写作不是把想好的事情记下来，而是在句子里遇见自己尚未想明白的部分。\n\n今天要写的，也许只是这样一个清晨。`,
  },
  {
    id: 'island', group: 'project', section: 'chapter', title: '无人岛来信', goal: 2000,
    updatedAt: Date.now() - 1000 * 60 * 50,
    content: `海潮在凌晨退去，留下了一整片发亮的沙滩。\n\n这是我抵达岛上的第七天。`,
  },
  {
    id: 'rain', group: 'inbox', title: '雨天备忘', updatedAt: Date.now() - 86400000,
    content: `雨落在旧空调的铁皮上，声音像一把散开的豆子。\n\n记住这个声音。`,
  },
  {
    id: 'walk', group: 'journal', title: '七月散步', updatedAt: Date.now() - 86400000 * 2,
    content: `傍晚沿着河边走了四公里。风很热，但水面是凉的颜色。`,
  },
  {
    id: 'outline', group: 'inbox', title: '短篇小说结构', updatedAt: Date.now() - 86400000 * 4,
    content: `# 三幕\n\n- 离开\n- 迷路\n- 回来时带着一件不属于自己的东西`,
  },
];

const groups: { id: GroupId; label: string; icon: typeof Inbox }[] = [
  { id: 'inbox', label: '收集箱', icon: Inbox },
  { id: 'project', label: '长篇计划', icon: Library },
  { id: 'journal', label: '日记', icon: Clock3 },
  { id: 'archive', label: '归档', icon: Archive },
];

const storySections: { id: ProjectSection; label: string; icon: typeof FileText }[] = [
  { id: 'front', label: '前言部分', icon: ScrollText },
  { id: 'prologue', label: '序幕', icon: Feather },
  { id: 'chapter', label: '章节', icon: BookOpen },
  { id: 'epilogue', label: '尾声', icon: FileText },
  { id: 'afterword', label: '后记', icon: FileText },
];

const materialSections: { id: ProjectSection; label: string; icon: typeof FileText }[] = [
  { id: 'notes', label: '笔记', icon: NotebookPen },
  { id: 'characters', label: '角色', icon: UserRound },
  { id: 'locations', label: '地点', icon: MapPin },
  { id: 'plot', label: '情节', icon: Route },
];

const STORAGE_KEY = 'muse-writing-app-v1';

function countWords(text: string) {
  const chinese = text.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const latin = text.match(/[a-zA-Z0-9]+(?:['’-][a-zA-Z0-9]+)*/g)?.length ?? 0;
  return chinese + latin;
}

function relativeTime(timestamp: number) {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`;
  if (minutes < 4320) return `${Math.floor(minutes / 1440)} 天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function excerpt(text: string) {
  return text.replace(/[#>*_`\-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 58) || '从这里开始写作…';
}

function App() {
  const [sheets, setSheets] = useState<Sheet[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '') as Sheet[] | null;
      return (stored || seedSheets).map(sheet => sheet.group === 'project' && !sheet.section ? { ...sheet, section: 'chapter' } : sheet);
    }
    catch { return seedSheets; }
  });
  const [activeId, setActiveId] = useState(sheets[0]?.id ?? '');
  const [activeGroup, setActiveGroup] = useState<GroupId>('project');
  const [activeSection, setActiveSection] = useState<ProjectSection>('chapter');
  const [chaptersOpen, setChaptersOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [mobilePane, setMobilePane] = useState<'library' | 'sheets' | 'editor'>('editor');
  const [saved, setSaved] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installHelp, setInstallHelp] = useState(false);
  const [pwaInstalled, setPwaInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const isTauri = '__TAURI_INTERNALS__' in window;

  useEffect(() => {
    if (isTauri) document.documentElement.classList.add('tauri-app');
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => { setPwaInstalled(true); setInstallPrompt(null); };
    window.addEventListener('beforeinstallprompt', onInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [isTauri]);

  const visibleSheets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sheets
      .filter(sheet => sheet.group === activeGroup)
      .filter(sheet => activeGroup !== 'project' || sheet.section === activeSection)
      .filter(sheet => !needle || `${sheet.title} ${sheet.content}`.toLowerCase().includes(needle))
      .sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || b.updatedAt - a.updatedAt);
  }, [sheets, activeGroup, activeSection, query]);

  const selected = sheets.find(sheet => sheet.id === activeId);
  const active = selected && selected.group === activeGroup && (activeGroup !== 'project' || selected.section === activeSection)
    ? selected
    : visibleSheets[0];
  const totalWords = sheets.reduce((sum, sheet) => sum + countWords(sheet.content), 0);
  const activeWords = active ? countWords(active.content) : 0;
  const currentContextLabel = activeGroup === 'project'
    ? [...storySections, ...materialSections].find(section => section.id === activeSection)?.label
    : groups.find(group => group.id === activeGroup)?.label;

  useEffect(() => {
    setSaved(false);
    const timer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
      setSaved(true);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [sheets]);

  useEffect(() => {
    if (visibleSheets.length && !visibleSheets.some(sheet => sheet.id === activeId)) {
      setActiveId(visibleSheets[0].id);
    }
    if (!visibleSheets.length && activeId) setActiveId('');
  }, [visibleSheets, activeId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() === 'n') { event.preventDefault(); createSheet(); }
      if (event.key.toLowerCase() === 'f') { event.preventDefault(); setFocusMode(false); searchRef.current?.focus(); }
      if (event.key.toLowerCase() === 's') { event.preventDefault(); localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets)); setSaved(true); }
      if (event.key.toLowerCase() === 'e') { event.preventDefault(); setFocusMode(value => !value); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function updateActive(patch: Partial<Sheet>) {
    if (!active) return;
    setSheets(items => items.map(sheet => sheet.id === active.id ? { ...sheet, ...patch, updatedAt: Date.now() } : sheet));
  }

  function createSheet() {
    const destinationGroup = activeGroup === 'archive' ? 'inbox' : activeGroup;
    const created: Sheet = {
      id: crypto.randomUUID(), group: destinationGroup,
      section: destinationGroup === 'project' ? activeSection : undefined,
      title: '无题文稿', content: '', updatedAt: Date.now(), goal: 1000,
    };
    setSheets(items => [created, ...items]);
    setActiveId(created.id);
    setMobilePane('editor');
    window.setTimeout(() => editorRef.current?.focus(), 50);
  }

  function deleteActive() {
    if (!active) return;
    const remaining = sheets.filter(sheet => sheet.id !== active.id);
    setSheets(remaining);
    setActiveId(remaining[0].id);
    setMenuOpen(false);
  }

  function applyMarkup(before: string, after = before) {
    const input = editorRef.current;
    if (!input || !active) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = active.content.slice(start, end) || '文字';
    const next = active.content.slice(0, start) + before + selected + after + active.content.slice(end);
    updateActive({ content: next });
    window.setTimeout(() => { input.focus(); input.setSelectionRange(start + before.length, start + before.length + selected.length); }, 0);
  }

  function exportMarkdown() {
    if (!active) return;
    const blob = new Blob([`# ${active.title}\n\n${active.content}`], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${active.title || '无题文稿'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function openGroup(group: GroupId) {
    setActiveGroup(group);
    if (group === 'project') setActiveSection('chapter');
    setQuery('');
    setMobilePane('sheets');
  }

  function openSection(section: ProjectSection) {
    setActiveGroup('project');
    setActiveSection(section);
    setQuery('');
    setMobilePane('sheets');
  }

  async function installPwa() {
    if (!installPrompt) { setInstallHelp(true); return; }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setPwaInstalled(true);
    setInstallPrompt(null);
  }

  return (
    <main className={`app ${focusMode ? 'focus-mode' : ''}`}>
      <aside className={`library-pane mobile-${mobilePane}`}>
        <div className="traffic-lights" data-tauri-drag-region aria-hidden="true"><i /><i /><i /></div>
        <div className="brand"><span className="brand-glyph">M</span><div><strong>缪思</strong><small>MUSE</small></div></div>

        <nav className="group-nav">
          <p>资料库</p>
          {groups.map(group => {
            const Icon = group.icon;
            const count = sheets.filter(sheet => sheet.group === group.id).length;
            return <button key={group.id} className={activeGroup === group.id ? 'active' : ''} onClick={() => openGroup(group.id)}>
              <Icon size={17} strokeWidth={1.8} /><span>{group.label}</span><em>{count}</em>
            </button>;
          })}
          {activeGroup === 'project' ? <>
            <p className="subheading project-heading">作品结构</p>
            {storySections.map(section => {
              const Icon = section.icon;
              const count = sheets.filter(sheet => sheet.group === 'project' && sheet.section === section.id).length;
              return <div className="project-nav-block" key={section.id}>
                <button className={`project-nav-item ${activeSection === section.id ? 'active' : ''}`} onClick={() => {
                  openSection(section.id);
                  if (section.id === 'chapter') setChaptersOpen(value => !value);
                }}>
                  <span>{section.id === 'chapter' ? <ChevronRight className={chaptersOpen ? 'open' : ''} size={15} /> : <Icon size={15} />}<b>{section.label}</b></span><em>{count}</em>
                </button>
                {section.id === 'chapter' && chaptersOpen && <div className="chapter-children">
                  {sheets.filter(sheet => sheet.group === 'project' && sheet.section === 'chapter').sort((a, b) => a.updatedAt - b.updatedAt).map((sheet, index) =>
                    <button key={sheet.id} className={sheet.id === activeId ? 'selected' : ''} onClick={() => { openSection('chapter'); setActiveId(sheet.id); setMobilePane('editor'); }}><i>{index + 1}</i><span>{sheet.title || `第 ${index + 1} 章`}</span></button>
                  )}
                </div>}
              </div>;
            })}
            <p className="subheading material-heading">写作素材</p>
            {materialSections.map(section => {
              const Icon = section.icon;
              const count = sheets.filter(sheet => sheet.group === 'project' && sheet.section === section.id).length;
              return <button key={section.id} className={`project-nav-item ${activeSection === section.id ? 'active' : ''}`} onClick={() => openSection(section.id)}>
                <span><Icon size={15} /><b>{section.label}</b></span><em>{count}</em>
              </button>;
            })}
          </> : <>
            <p className="subheading">快捷访问</p>
            <button onClick={() => { const favorite = sheets.find(sheet => sheet.favorite); if (favorite) { setActiveGroup(favorite.group); if (favorite.section) setActiveSection(favorite.section); setActiveId(favorite.id); setMobilePane('editor'); } }}><Star size={17} /><span>收藏</span></button>
            <button onClick={() => editorRef.current?.focus()}><Target size={17} /><span>写作目标</span></button>
          </>}
        </nav>

        {!isTauri && !pwaInstalled && <button className="pwa-install" onClick={() => void installPwa()}><Download size={15} /><span>安装到设备</span></button>}
        <div className="library-footer">
          <div className="week-progress"><span><b>本周</b><em>{totalWords.toLocaleString()} 字</em></span><i><b style={{ width: `${Math.min(100, totalWords / 50)}%` }} /></i><small>目标 5,000 字</small></div>
          <button title="设置"><Settings2 size={18} /></button>
        </div>
      </aside>

      <section className={`sheets-pane mobile-${mobilePane}`}>
        <header className="sheets-header">
          <div><button className="mobile-back" onClick={() => setMobilePane('library')}><Menu size={19} /></button><strong>{currentContextLabel}</strong><ChevronDown size={14} /></div>
          <button className="new-sheet" onClick={createSheet} title="新建文稿（⌘N）"><Plus size={20} /></button>
        </header>
        <label className="search-box"><Search size={15} /><input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索文稿" />{query && <button onClick={() => setQuery('')}><X size={14} /></button>}</label>

        <div className="sheet-list">
          {visibleSheets.map(sheet => (
            <button key={sheet.id} className={sheet.id === active?.id ? 'active' : ''} onClick={() => { setActiveId(sheet.id); setMobilePane('editor'); }}>
              <div><strong>{sheet.title || '无题文稿'}</strong>{sheet.favorite && <Star size={12} fill="currentColor" />}</div>
              <p>{excerpt(sheet.content)}</p>
              <footer><span>{relativeTime(sheet.updatedAt)}</span><span>{countWords(sheet.content)} 字</span></footer>
            </button>
          ))}
          {!visibleSheets.length && <div className="empty-list"><FileText size={30} /><p>这里还没有文稿</p><button onClick={createSheet}>创建第一篇</button></div>}
        </div>
        <footer className="sheets-footer"><span>{visibleSheets.length} 篇文稿</span><button><MoreHorizontal size={18} /></button></footer>
      </section>

      <section className={`editor-pane mobile-${mobilePane}`}>
        <header className="editor-toolbar">
          <div className="toolbar-left"><button className="mobile-back" onClick={() => setMobilePane('sheets')}><List size={19} /></button><span className={`save-state ${saved ? 'saved' : ''}`}>{saved ? <><Check size={13} /> 已保存</> : '保存中…'}</span></div>
          <div className="format-tools">
            <button title="标题" onClick={() => applyMarkup('## ', '')}><Type size={17} /></button>
            <button title="粗体" onClick={() => applyMarkup('**')}><Bold size={17} /></button>
            <button title="斜体" onClick={() => applyMarkup('_')}><Italic size={17} /></button>
            <button title="引用" onClick={() => applyMarkup('> ', '')}><Quote size={17} /></button>
            <button title="列表" onClick={() => applyMarkup('- ', '')}><List size={17} /></button>
          </div>
          <div className="toolbar-actions">
            <button className={focusMode ? 'selected' : ''} title="专注模式（⌘E）" onClick={() => setFocusMode(value => !value)}><Focus size={18} /></button>
            <button title="导出 Markdown" disabled={!active} onClick={exportMarkdown}><Share2 size={18} /></button>
            <div className="more-wrap"><button title="更多" disabled={!active} onClick={() => setMenuOpen(value => !value)}><MoreHorizontal size={20} /></button>{menuOpen && active && <div className="more-menu">
              <button onClick={() => { updateActive({ favorite: !active.favorite }); setMenuOpen(false); }}><Star size={15} />{active.favorite ? '取消收藏' : '加入收藏'}</button>
              <button onClick={() => { updateActive({ group: 'archive' }); setMenuOpen(false); }}><Archive size={15} />移至归档</button>
              <button onClick={exportMarkdown}><Download size={15} />导出 Markdown</button>
              <button className="danger" onClick={deleteActive}><Trash2 size={15} />删除文稿</button>
            </div>}</div>
          </div>
        </header>

        {active ? <><div className="paper">
          <input className="title-input" value={active.title} onChange={event => updateActive({ title: event.target.value })} aria-label="文稿标题" />
          <div className="title-rule"><span>{new Date(active.updatedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span><i /></div>
          <textarea ref={editorRef} className="editor" value={active.content} onChange={event => updateActive({ content: event.target.value })} spellCheck placeholder="从这里开始写作…" aria-label="正文" />
        </div>

        <footer className="editor-status">
          <span><Hash size={13} />Markdown</span>
          <div className="goal-meter" title={`目标 ${active.goal ?? 1000} 字`}><i><b style={{ width: `${Math.min(100, activeWords / (active.goal ?? 1000) * 100)}%` }} /></i><span>{activeWords} / {active.goal ?? 1000}</span></div>
          <span>{Math.max(1, Math.ceil(activeWords / 400))} 分钟阅读</span>
        </footer></> : <div className="empty-editor"><span><FileText size={28} /></span><h2>{currentContextLabel}还没有内容</h2><p>在这里建立第一篇文稿，之后的新建内容也会自动归入这个分类。</p><button onClick={createSheet}><Plus size={16} />新建文稿</button></div>}
      </section>
      {installHelp && <div className="install-backdrop" onClick={() => setInstallHelp(false)}>
        <section className="install-card" onClick={event => event.stopPropagation()}>
          <button className="install-close" onClick={() => setInstallHelp(false)}><X size={18} /></button>
          <span className="install-icon"><Download size={22} /></span>
          <h2>安装缪思</h2>
          {/iPad|iPhone|iPod/.test(navigator.userAgent)
            ? <p>在 Safari 底部点击“分享”，选择“添加到主屏幕”，再点击“添加”。</p>
            : <p>请使用 Chrome 或 Edge 打开本页，然后从浏览器菜单选择“安装缪思”或“安装应用”。</p>}
          <button className="install-done" onClick={() => setInstallHelp(false)}>知道了</button>
        </section>
      </div>}
    </main>
  );
}

export default App;
