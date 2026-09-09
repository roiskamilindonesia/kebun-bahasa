'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { flushSync } from 'react-dom';
import { ArrowRight, Check, CircleHelp, Grip, Headphones, Leaf, RotateCcw, Sparkles, Sprout, Star, Volume2, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { vocabularyThemes, vocabularyCount } from './vocabulary';

const fruits = [
  { id:'grape', idn:'Anggur', en:'Grape', ar:'عِنَب', roman:'‘Inab', tint:'#f0e9fa' },
  { id:'orange', idn:'Jeruk', en:'Orange', ar:'بُرْتُقَال', roman:'Burtuqāl', tint:'#fff0d8' },
  { id:'mango', idn:'Mangga', en:'Mango', ar:'مَانْجُو', roman:'Mānjū', tint:'#fff1d8' },
  { id:'apple', idn:'Apel', en:'Apple', ar:'تُفَّاح', roman:'Tuffāḥ', tint:'#ffebeb' },
  { id:'banana', idn:'Pisang', en:'Banana', ar:'مَوْز', roman:'Mawz', tint:'#fff5d2' },
  { id:'strawberry', idn:'Stroberi', en:'Strawberry', ar:'فَرَاوِلَة', roman:'Farāwilah', tint:'#ffebee' },
];
const choices = [[1,2,0],[1,3,4],[5,2,0],[4,5,3],[4,1,2],[0,5,3]];
type Phase = 'learn'|'quiz'|'done';

export default function Home() {
  const [language,setLanguage] = useState<'en'|'ar'>('en');
  const [round,setRound] = useState(0);
  const [phase,setPhase] = useState<Phase>('learn');
  const [heard,setHeard] = useState(false);
  const [selected,setSelected] = useState<number|null>(null);
  const [feedback,setFeedback] = useState<'idle'|'wrong'|'correct'>('idle');
  const [playing,setPlaying] = useState<string|null>(null);
  const [audioError,setAudioError] = useState(false);
  const [help,setHelp] = useState(false);
  const [catalogOpen,setCatalogOpen] = useState(false);
  const [catalogTheme,setCatalogTheme] = useState('fruit');
  const [over,setOver] = useState(false);
  const [drag,setDrag] = useState<{index:number,x:number,y:number}|null>(null);
  const liveState = useRef({ language, round, phase, feedback });
  liveState.current = { language, round, phase, feedback };
  const actionRef = useRef<(index:number)=>void>(()=>{});
  actionRef.current = answer;
  const audio = useRef<HTMLAudioElement|null>(null);
  const drop = useRef<HTMLButtonElement>(null);
  const gesture = useRef<{index:number,x:number,y:number,moved:boolean}|null>(null);
  const suppressClick = useRef(false);
  const fruit = fruits[round];
  const completed = phase==='done' ? 6 : round+(feedback==='correct'?1:0);

  function stopAudio(){ if(audio.current){ audio.current.pause(); audio.current.onended=null; audio.current.onerror=null; } setPlaying(null); }
  function playFile(file:string,key:string,onSuccess?:()=>void){
    stopAudio(); setAudioError(false);
    const clip = new Audio('/audio/'+file+'.wav'); audio.current=clip; setPlaying(key);
    clip.onended=()=>{setPlaying(null);onSuccess?.();};
    clip.onerror=()=>{setPlaying(null);setAudioError(true);};
    clip.play().catch(()=>{setPlaying(null);setAudioError(true);});
  }
  function listen(index:number,key:string){
    playFile(fruits[index].id+'-'+language,key,()=>{if(key==='fruit')setHeard(true);});
  }
  function reset(lang=language){stopAudio();setLanguage(lang);setRound(0);setPhase('learn');setHeard(false);setSelected(null);setFeedback('idle');setDrag(null);setOver(false);gesture.current=null;setAudioError(false);}
  function answer(index:number){
    if(phase!=='quiz'||feedback==='correct')return;
    setSelected(index); const correct=choices[round][index]===round;
    setFeedback(correct?'correct':'wrong');
    playFile(correct?'correct':'retry','feedback');
  }
  function next(){
    stopAudio();setAudioError(false);
    if(round===5){setPhase('done');return;}
    setRound(round+1);setPhase('learn');setHeard(false);setSelected(null);setFeedback('idle');
  }
  function pointerDown(e:PointerEvent<HTMLButtonElement>,index:number){
    if(feedback==='correct'||e.button!==0)return;
    gesture.current={index,x:e.clientX,y:e.clientY,moved:false};
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function pointerMove(e:PointerEvent<HTMLButtonElement>){
    const g=gesture.current;if(!g)return;
    if(Math.hypot(e.clientX-g.x,e.clientY-g.y)>9)g.moved=true;
    if(!g.moved)return;
    setDrag({index:g.index,x:e.clientX,y:e.clientY});
    const b=drop.current?.getBoundingClientRect();
    setOver(!!b&&e.clientX>=b.left&&e.clientX<=b.right&&e.clientY>=b.top&&e.clientY<=b.bottom);
  }
  function pointerUp(e:PointerEvent<HTMLButtonElement>){
    const g=gesture.current;if(!g)return;
    const b=drop.current?.getBoundingClientRect();
    if(g.moved){suppressClick.current=true;setTimeout(()=>{suppressClick.current=false;},0);if(b&&e.clientX>=b.left&&e.clientX<=b.right&&e.clientY>=b.top&&e.clientY<=b.bottom)answer(g.index);}
    gesture.current=null;setDrag(null);setOver(false);
  }
  useEffect(()=>()=>{audio.current?.pause();},[]);

  useEffect(()=>{
    type Tool = {name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean};execute:(input:unknown)=>unknown};
    const context=(document as Document & {modelContext?:{registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;
    if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    const register=(tool:Tool)=>{try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{/* Optional enhancement. */}};
    register({name:'get_lesson_state',description:'Read the current fruit lesson, language, phase, and answer feedback.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({...liveState.current,fruit:fruits[liveState.current.round].id})});
    register({name:'submit_sound_choice',description:'Submit sound choice 1, 2, or 3 for the current quiz, using the same answer box as the learner.',inputSchema:{type:'object',properties:{choice:{type:'integer',minimum:1,maximum:3}},required:['choice'],additionalProperties:false},annotations:{readOnlyHint:false},execute:(input)=>{
      const data=input as {choice?:unknown};
      if(!data || typeof data.choice!=='number' || !Number.isInteger(data.choice) || data.choice<1 || data.choice>3)throw new Error('Choice must be 1, 2, or 3.');
      if(liveState.current.phase!=='quiz' || liveState.current.feedback==='correct')throw new Error('A quiz must be open and awaiting an answer.');
      const index=data.choice-1;
      flushSync(()=>actionRef.current(index));
      return {...liveState.current};
    }});
    return ()=>lifecycle.abort();
  },[]);

  return <div className={`app-shell phase-${phase}`}>
    <header className="topbar"><a className="brand" href="/" aria-label="Kebun Kata, halaman awal"><span className="brand-icon"><Sprout size={27}/></span><span>Kebun<span className="brand-light">Kata</span><small>TUMBUH BERSAMA KATA</small></span></a><button className="help-button" onClick={()=>setHelp(true)}><CircleHelp size={20}/><span>Panduan</span></button></header>
    <main className="main">
      <div className="lesson-top"><div className="lesson-label"><span className="tiny-leaf"><Leaf size={16}/></span> KELOMPOK 01 <span className="divider">/</span> Buah-buahan</div><div className="top-actions"><button className="catalog-button" onClick={()=>setCatalogOpen(true)}><Sparkles size={16}/> {vocabularyCount} kata</button><Tabs value={language} onValueChange={v=>reset(v as 'en'|'ar')}><TabsList className="language-tabs" aria-label="Bahasa belajar"><TabsTrigger value="en">Aa <span>Inggris</span></TabsTrigger><TabsTrigger value="ar"><span lang="ar">ع</span> <span>Arab</span></TabsTrigger></TabsList></Tabs></div></div>
      <div className="progress-row"><Progress value={completed/6*100} aria-label={`${completed} dari 6 buah selesai`} className="lesson-progress"/><span><Star size={17} fill="#f5bb3f" stroke="#b47a09"/> {completed}<span className="muted">/ 6</span></span></div>
      {phase==='done'? <section className="celebration"><div className="trophy"><Star size={68} fill="currentColor"/></div><span className="eyebrow">KEBUN KATAMU BERTUMBUH!</span><h1>Hebat, kamu sudah belajar<br/>6 nama buah!</h1><p>Setiap usaha adalah langkah baru. Terima kasih sudah mencoba!</p><div className="harvest">{fruits.map(f=><img key={f.id} src={`/fruits/${f.id}.webp`} alt={f.idn}/>)}</div><button className="primary" onClick={()=>reset()}><RotateCcw size={19}/> Main lagi</button><button className="text-button" onClick={()=>reset(language==='en'?'ar':'en')}>Coba bahasa {language==='en'?'Arab':'Inggris'} <ArrowRight size={18}/></button></section> : <>
      <div className="title-row"><div><span className="eyebrow">PETUALANGAN KECIL, KATA BARU</span><h1>{phase==='learn'?'Yuk, kenalan dengan buah!':'Suara mana yang cocok?'}</h1></div><span className="round-label">Buah {round+1} <span>dari 6</span></span></div>
      <section className="game-board" aria-label={`Belajar ${fruit.idn}`}>
        <div className="picture-side" style={{'--fruit-tint':fruit.tint} as React.CSSProperties}>
          <span className="fruit-number">{String(round+1).padStart(2,'0')}</span><span className="listen-label"><Headphones size={16}/> Sentuh & dengarkan</span>
          <button className={`fruit-button ${playing==='fruit'?'is-playing':''}`} onClick={()=>listen(round,'fruit')} aria-label={`Dengarkan nama ${fruit.idn} dalam bahasa ${language==='en'?'Inggris':'Arab'}`}><img src={`/fruits/${fruit.id}.webp`} alt={fruit.idn} draggable={false}/><span className="fruit-sound"><Volume2 size={25}/></span></button>
          <div className="word-caption">{heard||playing==='fruit'||feedback==='correct'?<><strong lang={language} dir={language==='ar'?'rtl':undefined}>{fruit[language]}</strong><span>{language==='ar'?fruit.roman+' · ':''}{fruit.idn}</span></>:<><strong>Ini buah apa, ya?</strong><span>Sentuh gambar untuk mendengar</span></>}</div>
        </div>
        <div className="activity-side">
          <div className="step-tabs"><span className={phase==='learn'?'active':''}><b>1</b> Dengarkan</span><span className="step-line"/><span className={phase==='quiz'?'active':''}><b>2</b> Cocokkan</span></div>
          {phase==='learn'?<div className="learn-content"><span className="big-listen"><Volume2 size={32}/></span><h2>Dengar dulu,<br/>lalu tirukan.</h2><p>Sentuh gambar buah di {''}<span className="desktop-word">samping</span><span className="mobile-word">atas</span>.<br/>Kamu boleh mendengarnya berkali-kali.</p><button className="primary" disabled={!heard} onClick={()=>{stopAudio();setPhase('quiz');setAudioError(false);}}>Ayo, tebak suaranya <ArrowRight size={21}/></button><span className="gentle-note">{heard?'Sudah siap? Yuk, coba!':'Dengarkan sampai selesai, lalu lanjut.'}</span></div>:<div className="quiz-content"><h2>Dengarkan. Pilih. Cocokkan!</h2><p>Sentuh tombol untuk mendengar.<br/>Geser suara yang cocok ke kotak.</p><div className="sound-options">{choices[round].map((index,i)=><button key={i} className={`sound-option color-${i} ${selected===i?'selected':''} ${playing===`choice-${i}`?'is-playing':''} ${drag?.index===i?'dragging':''}`} disabled={feedback==='correct'} aria-label={`Dengarkan suara ${i+1}`} aria-pressed={selected===i} onPointerDown={e=>pointerDown(e,i)} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={()=>{gesture.current=null;setDrag(null);setOver(false);}} onClick={()=>{if(suppressClick.current)return;setSelected(i);setFeedback('idle');listen(index,`choice-${i}`);}}><span className="sound-top"><span>{i+1}</span><Grip size={14}/></span><Volume2 size={30}/><span className="sound-name">Suara {i+1}</span></button>)}</div>
          <button aria-live="polite" aria-atomic="true" ref={drop} className={`answer-box ${feedback} ${over?'drag-over':''}`} disabled={feedback==='correct'} onClick={()=>{if(selected!==null)answer(selected);}} aria-label={selected===null?'Kotak jawaban. Pilih suara dahulu.':`Masukkan suara ${selected+1} ke kotak jawaban`}><span className="box-icon">{feedback==='correct'?<Check size={26}/>:feedback==='wrong'?<RotateCcw size={25}/>:<Headphones size={27}/>}</span><strong>{feedback==='correct'?'Betul! Kamu hebat!':feedback==='wrong'?'Belum cocok. Coba lagi, yuk!':over?'Lepaskan di sini!':'Taruh suaramu di sini'}</strong><span>{feedback==='correct'?`${fruit[language]} · ${fruit.idn}`:feedback==='wrong'?'Dengarkan buahnya sekali lagi.':selected!==null?`Atau ketuk di sini untuk memilih suara ${selected+1}`:'Geser tombol suara ke kotak ini'}</span></button>
          {feedback==='correct'?<button className="primary next-button" onClick={next}>{round===5?'Lihat hasil belajarku':'Buah berikutnya'} <ArrowRight size={20}/></button>:<p className="tap-hint">Bisa juga: ketuk suara, lalu ketuk kotak.</p>}
          </div>}
        </div>
      </section>
      <div className="bottom-row"><span><Sparkles size={17}/> Pelan-pelan saja. Yang penting mencoba!</span><div className="fruit-trail" aria-label="Perjalanan enam buah">{fruits.map((f,i)=><span key={f.id} className={`${i===round?'current':''} ${i<completed?'finished':''}`} aria-label={`${f.idn}${i<completed?', selesai':i===round?', sedang dipelajari':''}`}>{i<completed?<Check size={16}/>:i+1}</span>)}</div></div>
      </>}
      {audioError&&<div role="alert" className="audio-alert">Suara belum bisa diputar. Periksa volume dan koneksi, lalu sentuh tombol suaranya lagi.</div>}
    </main>
    <footer><span><Sprout size={16}/> Sedikit bermain, banyak belajar.</span><span>Inggris & Arab · Tanpa iklan</span></footer>
    {drag&&<div className="drag-ghost" style={{left:drag.x,top:drag.y}}><Volume2 size={25}/><b>Suara {drag.index+1}</b></div>}
    <Dialog open={help} onOpenChange={setHelp}><DialogContent className="guide" showCloseButton={false}><div className="guide-heading"><DialogTitle>Panduan teman belajar</DialogTitle><DialogClose aria-label="Tutup panduan" className="close-guide"><X size={20}/></DialogClose></div><DialogDescription>Dampingi si kecil, ikuti rasa ingin tahunya.</DialogDescription><ol><li><b>Dengarkan.</b> Sentuh gambar buah dan tirukan suaranya bersama.</li><li><b>Cocokkan.</b> Dengarkan tiga pilihan, lalu geser pilihan ke kotak. Bisa juga ketuk pilihan, lalu ketuk kotak.</li><li><b>Coba lagi.</b> Jawaban yang belum cocok boleh diulang. Tidak ada batas waktu atau pengurangan bintang.</li></ol><p>Pilih Inggris atau Arab di atas. Mengganti bahasa memulai sesi baru. Suara kosakata dan umpan balik sudah disertakan; aplikasi tidak memakai mikrofon atau merekam suara anak.</p><DialogClose className="primary">Yuk, bermain <ArrowRight size={18}/></DialogClose></DialogContent></Dialog>
    <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}><DialogContent className="catalog-dialog" showCloseButton={false}><div className="guide-heading"><div><DialogTitle>Perpustakaan kata</DialogTitle><DialogDescription>{vocabularyCount} kosakata dalam 11 tema</DialogDescription></div><DialogClose aria-label="Tutup perpustakaan" className="close-guide"><X size={20}/></DialogClose></div><div className="theme-grid">{vocabularyThemes.map(theme=><button key={theme.id} className={`theme-card ${catalogTheme===theme.id?'active':''}`} onClick={()=>setCatalogTheme(theme.id)}><span>{theme.emoji}</span><strong>{theme.title}</strong><small>{theme.words.length} kata</small></button>)}</div><div className="word-list"><h3>{vocabularyThemes.find(theme=>theme.id===catalogTheme)?.title}</h3><div className="word-chips">{vocabularyThemes.find(theme=>theme.id===catalogTheme)?.words.map((word,index)=><span key={`${word}-${index}`}>{index+1}. {word}</span>)}</div></div></DialogContent></Dialog>
  </div>;
}
