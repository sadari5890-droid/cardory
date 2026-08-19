"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, GripVertical, History, ImagePlus, LoaderCircle, LogIn, LogOut, Palette, Plus, RefreshCw, Save, Search, Sparkles, Trash2, Upload, UserRound, WandSparkles, X } from "lucide-react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";
import { CardItem, ProjectData, SIZE_MAP, SizeKey } from "@/lib/types";

const defaultDesign = { textColor: "#FFF9EE", accentColor: "#FF5C35", overlay: 48, align: "left" as const, position: "bottom" as const };
const uid = () => crypto.randomUUID();

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
}

function CardCanvas({ card, size, preview = false }: { card: CardItem; size: SizeKey; preview?: boolean }) {
  const dim = SIZE_MAP[size];
  const ratio = dim.width / dim.height;
  const pos = card.design.position === "top" ? "flex-start" : card.design.position === "center" ? "center" : "flex-end";
  return (
    <div className={`card-canvas ${preview ? "preview" : ""}`} style={{ aspectRatio: String(ratio), color: card.design.textColor, textAlign: card.design.align }}>
      {card.image ? <img src={card.image} alt="글자 없는 카드 배경" /> : <div className="image-placeholder"><ImagePlus /><span>이미지를 생성하면 여기에 표시돼요</span></div>}
      <div className="shade" style={{ background: `linear-gradient(to bottom, rgba(8,9,12,${card.design.overlay / 180}), rgba(8,9,12,${card.design.overlay / 100}))` }} />
      <div className="card-copy" style={{ justifyContent: pos, alignItems: card.design.align === "center" ? "center" : "flex-start" }}>
        <span className="accent" style={{ background: card.design.accentColor }} />
        <h2>{card.title || "제목을 입력하세요"}</h2>
        <p>{card.body || "카드의 이야기를 입력하세요."}</p>
      </div>
    </div>
  );
}

function AuthModal({ onClose, onSignedIn }: { onClose: () => void; onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const submit = async () => {
    const supabase = getSupabase();
    if (!supabase) return toast.error("Supabase 환경 변수가 아직 연결되지 않았어요.");
    if (!email || password.length < 6) return toast.error("이메일과 6자 이상의 비밀번호를 입력해주세요.");
    setLoading(true); setMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: location.origin } });
    setLoading(false);
    if (result.error) return toast.error(result.error.message === "Invalid login credentials" ? "이메일 또는 비밀번호를 확인해주세요." : result.error.message);
    if (result.data.session) { toast.success(mode === "login" ? "바로 로그인했어요." : "계정을 만들고 로그인했어요."); onSignedIn(); onClose(); }
    else setMessage("확인 메일을 한 번만 열어주세요. 다음부터는 비밀번호로 바로 로그인됩니다.");
  };
  const resetPassword = async () => { const supabase = getSupabase(); if (!supabase || !email) return toast.error("이메일을 먼저 입력해주세요."); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/?recovery=1` }); if (error) toast.error(error.message.toLowerCase().includes("rate limit") ? "인증 메일 요청 한도를 넘었어요. 잠시 후 다시 시도하거나, 이미 받은 최신 메일의 링크를 이용해주세요." : error.message); else setMessage("비밀번호 설정 메일을 보냈어요. 가장 최근에 받은 메일의 링크를 열어주세요."); };
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e => e.stopPropagation()}><button className="icon-btn close" onClick={onClose}><X /></button><div className="modal-mark"><Sparkles /></div><h2>{mode === "login" ? "바로 로그인" : "새 계정 만들기"}</h2><p>한 번 로그인하면 이 브라우저에서 상태가 유지돼요. 더 이상 매번 이메일 링크를 열 필요가 없습니다.</p><div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>로그인</button><button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>회원가입</button></div><label>이메일</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@example.com" autoComplete="email"/><label>비밀번호</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6자 이상" autoComplete={mode === "login" ? "current-password" : "new-password"} onKeyDown={e => e.key === "Enter" && submit()}/>{message && <div className="success-box"><Check /> {message}</div>}<button className="primary wide" disabled={loading} onClick={submit}>{loading ? <LoaderCircle className="spin"/> : <LogIn/>}{mode === "login" ? "로그인" : "계정 만들기"}</button>{mode === "login" && <button className="text-button auth-help" onClick={resetPassword}>기존 이메일 계정인가요? 비밀번호 만들기</button>}</div></div>;
}

function PasswordUpdateModal({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const updatePassword = async () => {
    const supabase = getSupabase();
    if (!supabase) return toast.error("Supabase 연결이 필요해요.");
    if (password.length < 6) return toast.error("새 비밀번호는 6자 이상이어야 해요.");
    if (password !== confirmPassword) return toast.error("두 비밀번호가 서로 달라요.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("새 비밀번호를 저장했어요. 이제 바로 로그인할 수 있습니다.");
    onClose();
  };
  return <div className="modal-backdrop"><div className="modal"><div className="modal-mark"><Check /></div><h2>새 비밀번호 설정</h2><p>메일 인증이 완료됐어요. Cardory에서 사용할 새 비밀번호를 두 번 입력해주세요.</p><label>새 비밀번호</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6자 이상" autoComplete="new-password"/><label>비밀번호 확인</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="한 번 더 입력" autoComplete="new-password" onKeyDown={e => e.key === "Enter" && updatePassword()}/><button className="primary wide" disabled={loading} onClick={updatePassword}>{loading ? <LoaderCircle className="spin"/> : <Check/>}비밀번호 저장하고 시작하기</button></div></div>;
}

export default function Home() {
  const [persona, setPersona] = useState("따뜻하지만 똑똑한 라이프스타일 브랜드. 복잡한 정보를 쉽고 다정하게 설명해요.");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [size, setSize] = useState<SizeKey>("square");
  const [cards, setCards] = useState<CardItem[]>([]);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState("");
  const [character, setCharacter] = useState<string>();
  const [sourceFile, setSourceFile] = useState<File>();
  const [useCharacter, setUseCharacter] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  const [userEmail, setUserEmail] = useState<string>();
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const current = cards[active];

  useEffect(() => {
    const supabase = getSupabase(); if (!supabase) return;
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    if (code) supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) toast.error("인증 링크가 만료됐거나 이미 사용됐어요. 가장 최근 메일의 링크를 열어주세요.");
      else setShowPasswordUpdate(true);
      window.history.replaceState({}, "", location.pathname);
    });
    supabase.auth.getUser().then(({ data }) => { setUserEmail(data.user?.email); if (data.user) loadHistory(); });
    const { data } = supabase.auth.onAuthStateChange((event, session) => { setUserEmail(session?.user.email); if (session?.user) loadHistory(); if (event === "PASSWORD_RECOVERY") setShowPasswordUpdate(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  const progress = useMemo(() => cards.length ? cards.filter(c => c.image).length / cards.length * 100 : 0, [cards]);

  async function api(url: string, options: RequestInit) {
    const res = await fetch(url, options); const body = await res.json();
    if (!res.ok) throw new Error(body.error || "요청을 처리하지 못했어요."); return body;
  }

  async function createCharacterSheet() {
    if (!sourceFile) return toast.error("사진이나 캐릭터 이미지를 먼저 선택해주세요.");
    setBusy("캐릭터 시트를 만드는 중");
    try { const form = new FormData(); form.append("image", sourceFile); form.append("persona", persona); const data = await api("/api/character", { method: "POST", body: form }); setCharacter(data.image); setUseCharacter(true); toast.success("캐릭터 시트를 만들었어요."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "생성에 실패했어요."); } finally { setBusy(""); }
  }

  async function generateProject() {
    if (!topic.trim()) return toast.error("카드뉴스 주제를 입력해주세요.");
    setBusy("이야기의 흐름을 설계하는 중");
    try {
      const plan = await api("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ persona, topic, count }) });
      const next: CardItem[] = plan.cards.map((c: any) => ({ ...c, id: uid(), design: { ...defaultDesign } })); setCards(next); setActive(0);
      for (let i = 0; i < next.length; i++) {
        setBusy(`${i + 1}/${next.length} 카드 이미지를 그리는 중`);
        try { const result = await api("/api/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: `${next[i].imagePrompt}. Brand persona and art direction: ${persona}`, size: SIZE_MAP[size].api, reference: useCharacter ? character : undefined }) }); next[i] = { ...next[i], image: result.image }; setCards([...next]); }
        catch (e) { toast.error(`${i + 1}번 이미지: ${e instanceof Error ? e.message : "실패"}`); }
      }
      toast.success("카드뉴스 초안이 완성됐어요.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "생성에 실패했어요."); } finally { setBusy(""); }
  }

  function updateCard(patch: Partial<CardItem>) { setCards(cards.map((c, i) => i === active ? { ...c, ...patch } : c)); }
  function updateDesign(patch: Partial<CardItem["design"]>) { if (current) updateCard({ design: { ...current.design, ...patch } }); }
  function move(from: number, to: number) { if (to < 0 || to >= cards.length) return; const next = [...cards]; const [item] = next.splice(from, 1); next.splice(to, 0, item); setCards(next); setActive(to); }
  function addCard() { setCards([...cards, { id: uid(), title: "새로운 이야기", body: "여기에 내용을 입력하세요.", imagePrompt: "A refined editorial scene with generous negative space", design: { ...defaultDesign } }]); setActive(cards.length); }
  function removeCard() { if (cards.length <= 1) return toast.error("카드는 한 장 이상 필요해요."); setCards(cards.filter((_, i) => i !== active)); setActive(Math.max(0, active - 1)); }

  async function regenerateImage() {
    if (!current) return; setBusy(`${active + 1}번 이미지를 다시 그리는 중`);
    try { const result = await api("/api/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: `${current.imagePrompt}. Brand persona and art direction: ${persona}`, size: SIZE_MAP[size].api, reference: useCharacter ? character : undefined }) }); updateCard({ image: result.image }); toast.success("새 이미지로 교체했어요."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "생성에 실패했어요."); } finally { setBusy(""); }
  }

  async function renderPng(card: CardItem, index: number) {
    const d = SIZE_MAP[size]; const canvas = document.createElement("canvas"); canvas.width = d.width; canvas.height = d.height; const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#191B20"; ctx.fillRect(0, 0, d.width, d.height);
    if (card.image) { const img = new Image(); img.src = card.image; await img.decode(); const scale = Math.max(d.width / img.width, d.height / img.height); const w = img.width * scale, h = img.height * scale; ctx.drawImage(img, (d.width - w) / 2, (d.height - h) / 2, w, h); }
    const gradient = ctx.createLinearGradient(0, 0, 0, d.height); gradient.addColorStop(0, `rgba(8,9,12,${card.design.overlay / 180})`); gradient.addColorStop(1, `rgba(8,9,12,${card.design.overlay / 100})`); ctx.fillStyle = gradient; ctx.fillRect(0, 0, d.width, d.height);
    const pad = Math.round(d.width * .075); const maxW = d.width - pad * 2; ctx.textAlign = card.design.align; const x = card.design.align === "center" ? d.width / 2 : pad; ctx.textBaseline = "top";
    const wrap = (text: string, font: string, max: number) => { ctx.font = font; const lines: string[] = []; let line = ""; for (const ch of text) { if (ctx.measureText(line + ch).width > max && line) { lines.push(line); line = ch; } else line += ch; } if (line) lines.push(line); return lines; };
    const titleFont = `800 ${Math.round(d.width * .075)}px Arial, sans-serif`; const bodyFont = `500 ${Math.round(d.width * .033)}px Arial, sans-serif`; const titleLines = wrap(card.title, titleFont, maxW); const bodyLines = wrap(card.body, bodyFont, maxW); const titleLH = d.width * .088, bodyLH = d.width * .05; const blockH = 18 + 34 + titleLines.length * titleLH + 26 + bodyLines.length * bodyLH;
    let y = card.design.position === "top" ? pad : card.design.position === "center" ? (d.height - blockH) / 2 : d.height - pad - blockH;
    ctx.fillStyle = card.design.accentColor; const barX = card.design.align === "center" ? d.width / 2 - 38 : pad; ctx.fillRect(barX, y, 76, 12); y += 46;
    ctx.fillStyle = card.design.textColor; ctx.font = titleFont; for (const line of titleLines) { ctx.fillText(line, x, y); y += titleLH; } y += 18; ctx.font = bodyFont; for (const line of bodyLines) { ctx.fillText(line, x, y); y += bodyLH; }
    const link = document.createElement("a"); link.download = `cardory-${String(index + 1).padStart(2, "0")}.png`; link.href = canvas.toDataURL("image/png"); link.click();
  }
  async function downloadAll() { setBusy("PNG를 준비하는 중"); for (let i = 0; i < cards.length; i++) { await renderPng(cards[i], i); await new Promise(r => setTimeout(r, 180)); } setBusy(""); toast.success(`${cards.length}장의 PNG를 저장했어요.`); }

  async function saveProject() {
    const supabase = getSupabase(); if (!supabase) return toast.error("Supabase 연결이 필요해요."); const { data: { user } } = await supabase.auth.getUser(); if (!user) return setShowAuth(true);
    const data: ProjectData = { persona, topic, size, cards, characterSheet: character };
    const { error } = await supabase.from("card_projects").insert({ user_id: user.id, title: cards[0]?.title || topic, topic, card_count: cards.length, data }); if (error) toast.error(error.message); else { toast.success("생성 기록에 저장했어요."); loadHistory(); }
  }
  async function loadHistory() { const supabase = getSupabase(); if (!supabase) return; const { data } = await supabase.from("card_projects").select("*").order("created_at", { ascending: false }).limit(30); setHistory(data || []); }
  function openHistory(item: any) { const d = item.data as ProjectData; setPersona(d.persona); setTopic(d.topic); setSize(d.size); setCards(d.cards); setCharacter(d.characterSheet); setUseCharacter(!!d.characterSheet); setActive(0); setShowHistory(false); }
  async function deleteHistory(id: string) { if (!confirm("이 카드뉴스 기록을 삭제할까요?")) return; const supabase = getSupabase(); if (!supabase) return; const { error } = await supabase.from("card_projects").delete().eq("id", id); if (error) toast.error(error.message); else { setHistory(history.filter(h => h.id !== id)); toast.success("기록을 삭제했어요."); } }
  async function signOut() { await getSupabase()?.auth.signOut(); setUserEmail(undefined); toast.success("로그아웃했어요."); }

  return <main>
    <header><a className="brand" href="#"><span><Sparkles /></span>Cardory</a><nav><button className="ghost" onClick={() => { loadHistory(); setShowHistory(!showHistory); }}><History /> 작업 기록</button>{userEmail ? <button className="user-pill" onClick={signOut}><span>{userEmail[0].toUpperCase()}</span>{userEmail}<LogOut /></button> : <button className="outline" onClick={() => setShowAuth(true)}><LogIn /> 로그인</button>}</nav></header>
    {showHistory && <div className="archive-backdrop"><section className="archive-shell"><div className="archive-head"><div><small>MY CARDORY</small><h2>카드뉴스 보관함</h2><p>만들었던 카드뉴스를 한곳에서 다시 열고 관리하세요.</p></div><div className="archive-head-actions"><button className="outline" onClick={() => { setShowHistory(false); setCards([]); }}><Plus/> 새 카드뉴스</button><button className="icon-btn" onClick={() => setShowHistory(false)}><X/></button></div></div>{userEmail ? <><div className="archive-toolbar"><div className="archive-search"><Search/><input value={historySearch} onChange={e => setHistorySearch(e.target.value)} placeholder="제목이나 주제 검색"/></div><span>전체 {history.length}개</span></div><div className="archive-grid">{history.filter(h => `${h.title} ${h.topic}`.toLowerCase().includes(historySearch.toLowerCase())).map(h => <article className="project-card" key={h.id}><button className="project-preview" onClick={() => openHistory(h)}>{h.data?.cards?.[0]?.image ? <img src={h.data.cards[0].image} alt=""/> : <div className="project-empty"><Sparkles/></div>}<span>{h.card_count}장</span></button><div className="project-meta"><button onClick={() => openHistory(h)}><strong>{h.title}</strong><small>{new Date(h.created_at).toLocaleDateString("ko-KR")} · {h.topic}</small></button><button className="project-delete" onClick={() => deleteHistory(h.id)} aria-label={`${h.title} 삭제`}><Trash2/></button></div></article>)}</div>{!history.length && <div className="empty-history"><History/><h3>아직 저장한 카드뉴스가 없어요</h3><p>카드뉴스를 만든 뒤 저장하면 이곳에 차곡차곡 모입니다.</p><button className="primary" onClick={() => setShowHistory(false)}><Plus/> 첫 카드뉴스 만들기</button></div>}</> : <div className="empty-history archive-login"><UserRound/><h3>로그인하면 작업을 한곳에 모을 수 있어요</h3><p>비밀번호로 한 번 로그인하면 다음 방문에도 유지됩니다.</p><button className="primary" onClick={() => setShowAuth(true)}><LogIn/> 바로 로그인</button></div>}</section></div>}

    {!cards.length ? <section className="landing">
      <div className="hero-copy"><div className="eyebrow"><span /> YOUR STORY, BEAUTIFULLY TOLD</div><h1>브랜드의 생각을<br/><em>눈에 머무는 이야기</em>로.</h1><p>페르소나와 주제만 알려주세요. 글의 흐름부터 일관된 비주얼까지, 나만의 카드뉴스 스튜디오.</p><div className="trust"><div><strong>01</strong><span>브랜드 맞춤 글</span></div><div><strong>02</strong><span>일관된 비주얼</span></div><div><strong>03</strong><span>자유로운 편집</span></div></div></div>
      <div className="create-panel">
        <div className="step-head"><span>01</span><div><small>BRAND FOUNDATION</small><h2>어떤 목소리로 말할까요?</h2></div></div>
        <label>브랜드 페르소나 <span>말투, 분위기, 타깃을 자유롭게 적어주세요</span></label><textarea value={persona} onChange={e => setPersona(e.target.value)} rows={3} />
        <label>카드뉴스 주제</label><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="예: 번아웃 없이 오래 일하는 5가지 방법" onKeyDown={e => e.key === "Enter" && generateProject()} />
        <div className="form-row"><div><label>카드 개수</label><div className="counter"><button onClick={() => setCount(Math.max(2, count - 1))}>−</button><strong>{count}<small> 장</small></strong><button onClick={() => setCount(Math.min(10, count + 1))}>＋</button></div></div><div className="size-field"><label>이미지 크기</label><select value={size} onChange={e => setSize(e.target.value as SizeKey)}>{Object.entries(SIZE_MAP).map(([key, v]) => <option key={key} value={key}>{v.label}</option>)}</select></div></div>
        <div className="character-box"><div className="character-title"><div><UserRound /><span><strong>나만의 인물/캐릭터</strong><small>선택 사항 · 모든 카드에서 같은 모습 유지</small></span></div>{character && <label className="toggle"><input type="checkbox" checked={useCharacter} onChange={e => setUseCharacter(e.target.checked)} /><i /></label>}</div>
          {character ? <div className="character-ready"><img src={character} alt="생성된 캐릭터 시트"/><div><strong><Check /> 캐릭터 시트 준비 완료</strong><p>얼굴, 의상과 그림체를 모든 이미지의 기준으로 사용해요.</p><button className="text-button" onClick={() => { setCharacter(undefined); setSourceFile(undefined); }}>다른 사진 사용</button></div></div> : sourceFile ? <div className="source-ready"><img src={URL.createObjectURL(sourceFile)} alt="업로드 미리보기"/><div><strong>{sourceFile.name}</strong><small>이 사진을 바탕으로 4면 캐릭터 시트를 만들어요.</small><button className="secondary small" onClick={createCharacterSheet}><WandSparkles /> 캐릭터 시트 만들기</button></div></div> : <button className="upload-zone" onClick={() => fileInput.current?.click()}><Upload /><span><strong>사진 또는 캐릭터 업로드</strong><small>JPG, PNG, WEBP · 최대 10MB</small></span></button>}
          <input ref={fileInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e => e.target.files?.[0] && setSourceFile(e.target.files[0])}/>
        </div>
        <button className="primary generate" disabled={!!busy} onClick={generateProject}>{busy ? <><LoaderCircle className="spin" /> {busy}</> : <><Sparkles /> 카드뉴스 만들기 <ArrowRight /></>}</button><p className="privacy">업로드한 이미지는 카드뉴스 생성 외 목적으로 사용하지 않아요.</p>
      </div>
    </section> : <section className="studio">
      <aside className="card-list"><div className="list-head"><div><small>STORY FLOW</small><h2>카드 구성</h2></div><span>{cards.length}장</span></div><div className="progress"><i style={{ width: `${progress}%` }} /></div><div className="thumbs">{cards.map((card, i) => <button key={card.id} className={`thumb ${i === active ? "active" : ""}`} onClick={() => setActive(i)}><GripVertical className="grip"/><div className="thumb-image"><CardCanvas card={card} size={size} preview /></div><div><small>{String(i + 1).padStart(2, "0")}</small><strong>{card.title}</strong></div></button>)}</div><button className="add-card" onClick={addCard}><Plus /> 카드 추가</button></aside>
      <div className="stage"><div className="stage-top"><button className="ghost" onClick={() => setCards([])}><ArrowLeft /> 처음부터</button><div className="stage-actions"><button className="outline" onClick={saveProject}><Save /> 저장</button><button className="primary" onClick={downloadAll}><Download /> PNG 전체 받기</button></div></div><div className={`canvas-wrap ${size}`}><CardCanvas card={current} size={size}/>{busy && <div className="canvas-loading"><LoaderCircle className="spin"/><strong>{busy}</strong><small>고해상도 이미지는 잠시 시간이 걸려요</small></div>}</div><div className="canvas-nav"><button className="icon-btn" disabled={active === 0} onClick={() => setActive(active - 1)}><ArrowLeft /></button><span><strong>{active + 1}</strong> / {cards.length}</span><button className="icon-btn" disabled={active === cards.length - 1} onClick={() => setActive(active + 1)}><ArrowRight /></button></div></div>
      <aside className="editor"><div className="editor-head"><small>CARD {String(active + 1).padStart(2, "0")}</small><h2>내용과 디자인</h2></div><label>제목 <span>{current.title.length}/40</span></label><textarea value={current.title} maxLength={40} rows={2} onChange={e => updateCard({ title: e.target.value })}/><label>본문 <span>{current.body.length}/140</span></label><textarea value={current.body} maxLength={140} rows={4} onChange={e => updateCard({ body: e.target.value })}/><label>이미지 설명</label><textarea value={current.imagePrompt} rows={4} onChange={e => updateCard({ imagePrompt: e.target.value })}/><button className="secondary wide" disabled={!!busy} onClick={regenerateImage}><RefreshCw /> 이미지만 다시 만들기</button><div className="divider"/><div className="section-label"><Palette /> 디자인</div><label>텍스트 위치</label><div className="segmented">{(["top", "center", "bottom"] as const).map(v => <button className={current.design.position === v ? "active" : ""} key={v} onClick={() => updateDesign({ position: v })}>{v === "top" ? "상단" : v === "center" ? "중앙" : "하단"}</button>)}</div><label>정렬</label><div className="segmented">{(["left", "center"] as const).map(v => <button className={current.design.align === v ? "active" : ""} key={v} onClick={() => updateDesign({ align: v })}>{v === "left" ? "왼쪽" : "가운데"}</button>)}</div><label>배경 어둡기 <span>{current.design.overlay}%</span></label><input type="range" min="10" max="80" value={current.design.overlay} onChange={e => updateDesign({ overlay: Number(e.target.value) })}/><div className="colors"><label>글자색<input type="color" value={current.design.textColor} onChange={e => updateDesign({ textColor: e.target.value })}/></label><label>포인트<input type="color" value={current.design.accentColor} onChange={e => updateDesign({ accentColor: e.target.value })}/></label></div><div className="editor-bottom"><button className="danger" onClick={removeCard}><Trash2 /> 삭제</button><div><button className="icon-btn" onClick={() => move(active, active - 1)}><ArrowLeft /></button><button className="icon-btn" onClick={() => move(active, active + 1)}><ArrowRight /></button></div></div></aside>
    </section>}
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSignedIn={() => {}}/>}
    {showPasswordUpdate && <PasswordUpdateModal onClose={() => setShowPasswordUpdate(false)}/>}
  </main>;
}
