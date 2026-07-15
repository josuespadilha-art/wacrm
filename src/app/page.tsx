"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

function FAQItem({ q, a }: { q: string, a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-q" onClick={() => setOpen(!open)}>
        {q}
        <div className="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </div>
      </button>
      <div className="faq-a">
        <p>{a}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [leads, setLeads] = useState(300);
  const [ticket, setTicket] = useState(150);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const conversaoPerdida = 0.15; 
  const dinheiroNaMesa = Math.round(leads * conversaoPerdida * ticket);

  useEffect(() => {
    const handleScroll = () => {
      const nav = document.getElementById('nav');
      if (window.scrollY > 20) {
        nav?.classList.add('scrolled');
      } else {
        nav?.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root{
          --bg:#020617;
          --bg-2:#0A0F1F;
          --panel:#0D1224;
          --panel-2:#111830;
          --line: rgba(255,255,255,0.08);
          --line-strong: rgba(255,255,255,0.14);
          --text:#F4F6FB;
          --text-soft:#9AA3B8;
          --text-dim:#6B7284;
          --violet:#7C5CFC;
          --violet-2:#9D7BFF;
          --violet-glow: rgba(124,92,252,0.5);
          --green:#22C55E;
          --red:#F43F5E;
          --amber:#F59E0B;
          --radius-lg:24px;
          --radius-md:16px;
          --maxw:1220px;
        }
        .landing-body {
          background:var(--bg);
          color:var(--text);
          font-family:'Inter',sans-serif;
          -webkit-font-smoothing:antialiased;
          overflow-x:hidden;
        }
        .landing-body img{max-width:100%;display:block;}
        .landing-body a{color:inherit;text-decoration:none;}
        .landing-body ul{list-style:none;margin:0;padding:0;}
        .wrap{max-width:var(--maxw); margin:0 auto; padding:0 clamp(20px,5vw,56px);}

        /* background grid + glow */
        .bg-grid{
          position:fixed; inset:0; z-index:0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size:64px 64px;
          mask-image:radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%);
          pointer-events:none;
        }
        .glow{
          position:fixed; z-index:0; border-radius:50%;
          filter:blur(120px); pointer-events:none;
        }
        .glow-1{width:600px;height:600px; background:rgba(124,92,252,0.25); top:-200px; left:-100px;}
        .glow-2{width:500px;height:500px; background:rgba(124,92,252,0.15); top:200px; right:-150px;}

        .landing-body section, .landing-body header, .landing-body footer{position:relative; z-index:1;}

        .eyebrow{
          display:inline-flex; align-items:center; gap:10px;
          font-size:12.5px; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
          color:var(--violet-2);
        }
        .eyebrow::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--violet); box-shadow:0 0 12px var(--violet-glow); display:inline-block;}

        .landing-body h1, .landing-body h2, .landing-body h3{margin:0; font-weight:800; letter-spacing:-0.02em; color:var(--text);}

        /* ---------- NAV ---------- */
        .nav{
          position:sticky; top:0; z-index:50;
          background:rgba(2,6,23,0.72);
          backdrop-filter:blur(16px);
          border-bottom:1px solid transparent;
          transition:border-color .3s ease;
        }
        .nav.scrolled{border-color:var(--line);}
        .nav-inner{
          max-width:var(--maxw); margin:0 auto;
          padding:18px clamp(20px,5vw,56px);
          display:flex; align-items:center; justify-content:space-between;
          gap:24px;
        }
        .brand{display:flex; align-items:center; gap:10px; font-weight:800; font-size:19px;}
        .brand .dot{
          width:11px;height:11px;border-radius:4px;
          background:linear-gradient(135deg, var(--violet-2), var(--violet));
          box-shadow:0 0 16px var(--violet-glow);
        }
        .nav-links{display:flex; align-items:center; gap:36px;}
        .nav-links a{font-size:14.5px; font-weight:600; color:var(--text-soft); transition:color .2s ease;}
        .nav-links a:hover{color:var(--text);}
        .nav-cta{display:flex; align-items:center; gap:14px;}

        .btn{
          display:inline-flex; align-items:center; justify-content:center; gap:8px;
          font-weight:700; font-size:14.5px;
          padding:12px 24px; border-radius:11px; cursor:pointer;
          border:1px solid transparent;
          transition:transform .25s ease, box-shadow .25s ease, background .25s ease, border-color .25s ease;
          white-space:nowrap;
        }
        .btn-primary{
          background:linear-gradient(135deg, var(--violet-2), var(--violet));
          color:#fff;
          box-shadow:0 8px 24px -8px var(--violet-glow);
        }
        .btn-primary:hover{transform:translateY(-2px); box-shadow:0 14px 32px -8px var(--violet-glow);}
        .btn-ghost{background:transparent; border-color:var(--line-strong); color:var(--text);}
        .btn-ghost:hover{background:rgba(255,255,255,0.06); border-color:rgba(255,255,255,0.3);}
        .btn-sm{padding:10px 18px; font-size:13.5px;}
        .btn-lg{padding:16px 32px; font-size:16px;}

        .burger{display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:6px;}
        .burger span{width:22px;height:2px;background:var(--text);border-radius:2px;}

        /* ---------- HERO ---------- */
        .hero{padding:96px 0 40px; text-align:center;}
        .hero-badge{
          display:inline-flex; align-items:center; gap:8px;
          background:var(--panel); border:1px solid var(--line-strong);
          padding:8px 16px; border-radius:100px; font-size:13px; font-weight:600; color:var(--text-soft);
          margin-bottom:28px;
          opacity:0; animation:fadeUp .7s ease forwards;
        }
        .hero h1{
          font-size:clamp(34px,5.2vw,64px);
          line-height:1.08; max-width:920px; margin:0 auto;
          opacity:0; animation:fadeUp .8s ease .1s forwards;
        }
        .hero h1 .grad{
          background:linear-gradient(135deg, var(--violet-2), #C9B8FF);
          -webkit-background-clip:text; background-clip:text; color:transparent;
        }
        .hero p.lead{
          max-width:600px; margin:26px auto 0;
          font-size:17.5px; line-height:1.7; color:var(--text-soft);
          opacity:0; animation:fadeUp .8s ease .2s forwards;
        }
        .hero-actions{
          display:flex; align-items:center; justify-content:center; gap:16px; margin-top:38px; flex-wrap:wrap;
          opacity:0; animation:fadeUp .8s ease .3s forwards;
        }
        .hero-sub{
          margin-top:20px; font-size:13px; color:var(--text-dim); font-weight:600;
          display:flex; gap:20px; justify-content:center; flex-wrap:wrap;
          opacity:0; animation:fadeUp .8s ease .38s forwards;
        }
        .hero-sub span{display:flex; align-items:center; gap:7px;}
        .hero-sub svg{width:14px;height:14px;color:var(--green);}

        @keyframes fadeUp{
          from{opacity:0; transform:translateY(18px);}
          to{opacity:1; transform:translateY(0);}
        }

        /* ---------- HERO MOCKUP ---------- */
        .hero-mockup{
          margin:64px auto 0; max-width:1080px; position:relative;
          opacity:0; transform:translateY(30px) scale(0.98);
          animation:mockupIn 1s ease .45s forwards;
        }
        @keyframes mockupIn{
          to{opacity:1; transform:translateY(0) scale(1);}
        }
        .mockup-frame{
          border-radius:18px; border:1px solid var(--line-strong);
          background:var(--panel);
          box-shadow:0 60px 120px -40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03);
          overflow:hidden;
          position:relative;
        }
        .mockup-bar{
          display:flex; align-items:center; gap:8px;
          padding:14px 18px; border-bottom:1px solid var(--line);
          background:rgba(255,255,255,0.02);
        }
        .mockup-bar span{width:11px;height:11px;border-radius:50%;background:var(--line-strong);}
        .mockup-bar .url{
          margin-left:14px; font-size:12px; color:var(--text-dim); font-weight:600;
        }
        .mockup-frame img{width:100%; display:block;}
        .mockup-glow{
          position:absolute; inset:-2px; z-index:-1;
          background:linear-gradient(135deg, var(--violet), transparent 60%);
          border-radius:20px; opacity:0.35; filter:blur(30px);
        }

        /* floating pill stats over mockup */
        .float-stat{
          position:absolute; z-index:5;
          background:var(--panel-2); border:1px solid var(--line-strong);
          border-radius:14px; padding:14px 18px;
          box-shadow:0 20px 50px -20px rgba(0,0,0,0.6);
          animation:floaty 5s ease-in-out infinite;
        }
        .float-stat.f1{ top:8%; left:-6%; animation-delay:0s;}
        .float-stat.f2{ bottom:10%; right:-5%; animation-delay:1.2s;}
        @keyframes floaty{
          0%,100%{transform:translateY(0);}
          50%{transform:translateY(-10px);}
        }
        .fstat-label{font-size:11px; color:var(--text-dim); font-weight:700; text-transform:uppercase; letter-spacing:.05em;}
        .fstat-value{font-size:20px; font-weight:800; margin-top:4px;}
        .fstat-value.green{color:var(--green);}
        .fstat-value.red{color:var(--red);}

        /* ---------- LOGOS STRIP ---------- */
        .logos{padding:50px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line);}
        .logos-label{text-align:center; font-size:12.5px; color:var(--text-dim); font-weight:700; letter-spacing:.1em; text-transform:uppercase; margin-bottom:28px;}
        .logos-row{display:flex; justify-content:center; align-items:center; gap:56px; flex-wrap:wrap; opacity:0.5;}
        .logos-row span{font-weight:800; font-size:17px; color:var(--text-soft);}

        /* ---------- CALC SECTION ---------- */
        .section{padding:120px 0;}
        .section-head{max-width:640px; margin:0 auto 56px; text-align:center;}
        .section-head h2{font-size:clamp(28px,3.6vw,44px); line-height:1.18; margin-top:16px;}
        .section-head p{margin-top:18px; color:var(--text-soft); font-size:16.5px; line-height:1.7;}

        .calc-box{
          max-width:820px; margin:0 auto;
          background:var(--panel); border:1px solid var(--line-strong);
          border-radius:var(--radius-lg); padding:clamp(28px,5vw,52px);
        }
        .calc-inputs{display:grid; grid-template-columns:1fr 1fr; gap:28px; margin-bottom:36px;}
        .calc-field label{display:block; font-size:13px; font-weight:700; color:var(--text-soft); margin-bottom:12px;}
        .calc-field .slider-row{display:flex; align-items:center; gap:14px;}
        .calc-field input[type=range]{
          flex:1; -webkit-appearance:none; height:6px; border-radius:6px;
          background:var(--line-strong); outline:none;
        }
        .calc-field input[type=range]::-webkit-slider-thumb{
          -webkit-appearance:none; width:20px;height:20px;border-radius:50%;
          background:var(--violet-2); cursor:pointer; box-shadow:0 0 0 5px rgba(124,92,252,0.25);
        }
        .calc-field .val{
          font-weight:800; font-size:16px; min-width:86px; text-align:right; color:var(--text);
        }
        .calc-result{
          background:linear-gradient(135deg, rgba(124,92,252,0.15), rgba(124,92,252,0.03));
          border:1px solid rgba(124,92,252,0.3);
          border-radius:18px; padding:32px; text-align:center;
        }
        .calc-result .label{font-size:13.5px; font-weight:700; color:var(--text-soft); text-transform:uppercase; letter-spacing:.06em;}
        .calc-result .amount{
          font-size:clamp(36px,6vw,56px); font-weight:900; margin-top:10px;
          background:linear-gradient(135deg, #fff, var(--violet-2));
          -webkit-background-clip:text; background-clip:text; color:transparent;
        }
        .calc-result .sub{margin-top:8px; font-size:14px; color:var(--text-dim);}

        /* ---------- FEATURE SHOWCASE (alternating) ---------- */
        .showcase{display:flex; flex-direction:column; gap:140px;}
        .feature-row{
          display:grid; grid-template-columns:0.85fr 1.15fr; gap:64px; align-items:center;
        }
        .feature-row.reverse{grid-template-columns:1.15fr 0.85fr;}
        .feature-row.reverse .feature-copy{order:2;}
        .feature-row.reverse .feature-visual{order:1;}
        .feature-copy .eyebrow{margin-bottom:18px;}
        .feature-copy h3{font-size:clamp(24px,3vw,34px); line-height:1.22;}
        .feature-copy p{margin-top:18px; color:var(--text-soft); font-size:16px; line-height:1.75;}
        .feature-list{margin-top:24px; display:flex; flex-direction:column; gap:14px;}
        .feature-list li{display:flex; gap:12px; align-items:flex-start; font-size:14.5px; color:var(--text-soft);}
        .feature-list svg{width:18px;height:18px;color:var(--violet-2); flex-shrink:0; margin-top:1px;}

        .feature-visual{
          position:relative;
          border-radius:18px; border:1px solid var(--line-strong);
          background:var(--panel);
          box-shadow:0 40px 90px -30px rgba(0,0,0,0.6);
          overflow:hidden;
        }
        .feature-visual img{width:100%; display:block;}
        .feature-visual .fv-bar{
          display:flex; align-items:center; gap:7px; padding:12px 16px; border-bottom:1px solid var(--line);
          background:rgba(255,255,255,0.02);
        }
        .feature-visual .fv-bar span{width:9px;height:9px;border-radius:50%;background:var(--line-strong);}

        /* ---------- PHONE WHATSAPP DEMO ---------- */
        .phone-section{overflow:hidden;}
        .phone-grid{display:grid; grid-template-columns:0.9fr 1.1fr; gap:64px; align-items:center;}
        .phone-copy .eyebrow{margin-bottom:18px;}
        .phone-copy h2{font-size:clamp(26px,3.4vw,40px); line-height:1.2;}
        .phone-copy p{margin-top:20px; color:var(--text-soft); font-size:16px; line-height:1.75; max-width:460px;}
        .phone-steps{margin-top:28px; display:flex; flex-direction:column; gap:20px;}
        .phone-step{display:flex; gap:14px; align-items:flex-start;}
        .phone-step .num{
          width:28px;height:28px;border-radius:50%;
          background:var(--panel-2); border:1px solid var(--line-strong);
          display:flex; align-items:center; justify-content:center;
          font-size:12.5px; font-weight:800; color:var(--violet-2); flex-shrink:0;
        }
        .phone-step.active .num{background:linear-gradient(135deg, var(--violet-2), var(--violet)); color:#fff; border-color:transparent;}
        .phone-step div.txt strong{display:block; font-size:14.5px; color:var(--text); font-weight:700;}
        .phone-step div.txt span{font-size:13.5px; color:var(--text-dim);}

        .phone-visual-wrap{display:flex; justify-content:center;}
        .phone-mock{
          position:relative;
          width:300px; height:610px;
          background:#0b0f1a;
          border-radius:44px;
          border:8px solid #14182a;
          box-shadow:0 60px 100px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04);
          overflow:hidden;
        }
        .phone-notch{
          position:absolute; top:0; left:50%; transform:translateX(-50%);
          width:120px; height:22px; background:#14182a; border-radius:0 0 16px 16px; z-index:5;
        }
        .phone-screen{
          position:absolute; inset:0; display:flex; flex-direction:column;
          background:#0B141A;
        }
        .wa-header{
          background:#1F2C34; padding:34px 16px 12px; display:flex; align-items:center; gap:10px;
          border-bottom:1px solid rgba(255,255,255,0.05);
        }
        .wa-avatar{
          width:34px;height:34px;border-radius:50%;
          background:linear-gradient(135deg, var(--violet-2), var(--violet));
          display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; color:#fff;
        }
        .wa-header .wa-name{font-size:14px; font-weight:700; color:#fff;}
        .wa-header .wa-status{font-size:11px; color:#8696A0;}
        .wa-status.online{color:#25D366;}
        .wa-body{
          flex:1; padding:16px 12px; display:flex; flex-direction:column; gap:8px; overflow:hidden;
          background-image:radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size:14px 14px;
        }
        .wa-bubble{
          max-width:78%; padding:9px 12px; border-radius:10px; font-size:13px; line-height:1.45;
          opacity:0; transform:translateY(10px) scale(0.97);
          animation:bubbleIn .4s ease forwards;
        }
        .wa-bubble.in{background:#1F2C34; color:#E9EDEF; align-self:flex-start; border-top-left-radius:2px;}
        .wa-bubble.out{background:#005C4B; color:#E9EDEF; align-self:flex-end; border-top-right-radius:2px;}
        .wa-bubble .time{display:block; font-size:9.5px; color:#8696A0; margin-top:4px; text-align:right;}
        .wa-bubble.system{
          align-self:center; background:rgba(255,255,255,0.06); color:#C9D1D9;
          font-size:11.5px; padding:6px 12px; border-radius:8px; text-align:center; max-width:90%;
        }
        @keyframes bubbleIn{ to{opacity:1; transform:translateY(0) scale(1);} }
        .wa-typing-indicator{
          align-self:flex-start; background:#1F2C34; padding:10px 14px; border-radius:10px; border-top-left-radius:2px;
          display:flex; gap:4px; opacity:0; animation:bubbleIn .4s ease forwards;
        }
        .wa-typing-indicator span{width:6px;height:6px;border-radius:50%;background:#8696A0; animation:typing 1.2s infinite;}
        .wa-typing-indicator span:nth-child(2){animation-delay:.2s;}
        .wa-typing-indicator span:nth-child(3){animation-delay:.4s;}
        .wa-footer{
          padding:10px 14px; background:#1F2C34; display:flex; align-items:center; gap:10px;
        }
        .wa-footer .input-fake{
          flex:1; background:#2A3942; border-radius:100px; padding:9px 14px; font-size:12.5px; color:#8696A0;
        }
        .wa-footer .send-btn{
          width:34px;height:34px;border-radius:50%;background:#25D366; display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .wa-footer .send-btn svg{width:15px;height:15px; color:#0B141A;}

        /* ---------- AI DEMO SECTION ---------- */
        .ai-section{
          background:var(--bg-2);
          border-top:1px solid var(--line);
          border-bottom:1px solid var(--line);
        }
        .ai-grid{display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center;}
        .ai-copy .eyebrow{margin-bottom:18px;}
        .ai-copy h2{font-size:clamp(26px,3.4vw,40px); line-height:1.2;}
        .ai-copy p{margin-top:20px; color:var(--text-soft); font-size:16px; line-height:1.75; max-width:460px;}
        .ai-tags{display:flex; flex-wrap:wrap; gap:10px; margin-top:26px;}
        .ai-tag{
          background:var(--panel); border:1px solid var(--line-strong);
          padding:8px 14px; border-radius:100px; font-size:13px; font-weight:600; color:var(--text-soft);
        }

        .ai-card{
          background:var(--panel); border:1px solid var(--line-strong);
          border-radius:var(--radius-lg); padding:28px;
          box-shadow:0 40px 90px -30px rgba(0,0,0,0.6);
        }
        .ai-card-top{display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;}
        .ai-live{display:flex; align-items:center; gap:8px; font-size:12.5px; font-weight:700; color:var(--red);}
        .ai-live .pulse{width:8px;height:8px;border-radius:50%;background:var(--red); animation:pulse 1.5s infinite;}
        @keyframes pulse{
          0%{box-shadow:0 0 0 0 rgba(244,63,94,0.6);}
          70%{box-shadow:0 0 0 8px rgba(244,63,94,0);}
          100%{box-shadow:0 0 0 0 rgba(244,63,94,0);}
        }
        .ai-amount{font-size:15px; font-weight:800; color:var(--text);}
        .ai-msg{
          background:var(--panel-2); border:1px solid var(--line); border-radius:14px; padding:18px; margin-bottom:16px;
        }
        .ai-msg-top{display:flex; justify-content:space-between; font-size:12.5px; color:var(--text-dim); font-weight:700; margin-bottom:10px;}
        .ai-msg-top .obj{color:var(--amber);}
        .ai-msg p{margin:0; font-size:14.5px; color:var(--text-soft); font-style:italic; line-height:1.6;}
        .ai-suggestion{
          background:rgba(124,92,252,0.1); border:1px solid rgba(124,92,252,0.3);
          border-radius:14px; padding:18px;
        }
        .ai-suggestion-label{font-size:12px; font-weight:800; color:var(--violet-2); text-transform:uppercase; letter-spacing:.05em; margin-bottom:8px;}
        .ai-suggestion p{margin:0; font-size:14.5px; color:var(--text); line-height:1.6;}
        .ai-typing{display:inline-flex; gap:4px; margin-left:6px;}
        .ai-typing span{width:5px;height:5px;border-radius:50%;background:var(--violet-2); animation:typing 1.2s infinite;}
        .ai-typing span:nth-child(2){animation-delay:.2s;}
        .ai-typing span:nth-child(3){animation-delay:.4s;}
        @keyframes typing{
          0%,60%,100%{opacity:.3; transform:translateY(0);}
          30%{opacity:1; transform:translateY(-3px);}
        }

        /* ---------- FAQ ---------- */
        .faq-list{max-width:760px; margin:0 auto; display:flex; flex-direction:column; gap:14px;}
        .faq-item{
          background:var(--panel); border:1px solid var(--line-strong);
          border-radius:14px; overflow:hidden;
          transition:border-color .25s ease;
        }
        .faq-item.open{border-color:rgba(124,92,252,0.4);}
        .faq-q{
          width:100%; display:flex; align-items:center; justify-content:space-between; gap:16px;
          padding:20px 24px; background:none; border:none; cursor:pointer; text-align:left;
          font-size:15.5px; font-weight:700; color:var(--text); font-family:inherit;
        }
        .faq-q .icon{
          width:22px;height:22px; border-radius:50%; background:var(--panel-2); border:1px solid var(--line-strong);
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
          transition:transform .3s ease, background .3s ease;
        }
        .faq-item.open .faq-q .icon{transform:rotate(45deg); background:linear-gradient(135deg, var(--violet-2), var(--violet)); border-color:transparent;}
        .faq-q .icon svg{width:12px;height:12px; color:var(--text-soft);}
        .faq-item.open .faq-q .icon svg{color:#fff;}
        .faq-a{
          max-height:0; overflow:hidden; transition:max-height .35s ease, padding .35s ease;
          padding:0 24px;
        }
        .faq-item.open .faq-a{max-height:220px; padding:0 24px 22px;}
        .faq-a p{margin:0; font-size:14.5px; color:var(--text-soft); line-height:1.7;}

        /* ---------- PRICING ---------- */
        .pricing-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:26px;}
        .price-card{
          background:var(--panel); border:1px solid var(--line-strong);
          border-radius:var(--radius-lg); padding:36px 30px;
          position:relative;
          transition:transform .3s ease, border-color .3s ease;
        }
        .price-card:hover{transform:translateY(-6px); border-color:rgba(124,92,252,0.4);}
        .price-card.popular{
          border-color:var(--violet);
          background:linear-gradient(180deg, rgba(124,92,252,0.1), var(--panel) 40%);
        }
        .popular-badge{
          position:absolute; top:-13px; left:50%; transform:translateX(-50%);
          background:linear-gradient(135deg, var(--violet-2), var(--violet));
          color:#fff; font-size:11.5px; font-weight:800; padding:6px 16px; border-radius:100px;
          letter-spacing:.03em; box-shadow:0 8px 20px -6px var(--violet-glow);
        }
        .price-tier{font-size:13px; font-weight:700; color:var(--violet-2); text-transform:uppercase; letter-spacing:.08em;}
        .price-name{font-size:22px; font-weight:800; margin-top:10px;}
        .price-amount{display:flex; align-items:baseline; gap:6px; margin-top:20px;}
        .price-amount .num{font-size:40px; font-weight:900;}
        .price-amount .period{font-size:14px; color:var(--text-dim); font-weight:600;}
        .price-features{margin:28px 0 30px; display:flex; flex-direction:column; gap:13px;}
        .price-features li{display:flex; gap:10px; align-items:flex-start; font-size:14px; color:var(--text-soft);}
        .price-features svg{width:16px;height:16px;color:var(--green); flex-shrink:0; margin-top:2px;}
        .price-card .btn{width:100%;}

        /* ---------- FINAL CTA ---------- */
        .final-cta{
          text-align:center;
          background:radial-gradient(ellipse 60% 100% at 50% 100%, rgba(124,92,252,0.2), transparent);
          border-top:1px solid var(--line);
        }
        .final-cta h2{font-size:clamp(28px,4vw,46px); max-width:680px; margin:0 auto; line-height:1.2;}
        .final-cta p{max-width:480px; margin:20px auto 36px; color:var(--text-soft); font-size:16.5px; line-height:1.7;}

        /* ---------- FOOTER ---------- */
        footer{border-top:1px solid var(--line); padding:48px 0 30px;}
        .foot-inner{display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;}
        .foot-brand{display:flex; align-items:center; gap:10px; font-weight:800;}
        footer p{color:var(--text-dim); font-size:13px;}

        /* counters */
        .counter{font-variant-numeric:tabular-nums;}

        /* ---------- RESPONSIVE ---------- */
        @media (max-width:980px){
          .feature-row, .feature-row.reverse{grid-template-columns:1fr; gap:36px;}
          .feature-row.reverse .feature-copy{order:1;}
          .feature-row.reverse .feature-visual{order:2;}
          .ai-grid{grid-template-columns:1fr; gap:44px;}
          .phone-grid{grid-template-columns:1fr; gap:44px;}
          .phone-visual-wrap{order:-1;}
          .pricing-grid{grid-template-columns:1fr; max-width:420px; margin:0 auto;}
          .nav-links{display:none;}
          .burger{display:flex;}
          .nav-cta .btn-ghost{display:none;}
          .calc-inputs{grid-template-columns:1fr;}
          .logos-row{gap:32px;}
          .float-stat{display:none;}
        }
        @media (max-width:600px){
          .hero{padding:70px 0 20px;}
          .section{padding:80px 0;}
          .showcase{gap:90px;}
          .phone-mock{width:260px; height:540px;}
        }

        .mobile-menu{
          display:none; position:fixed; inset:0; z-index:60; background:var(--bg);
          padding:26px clamp(20px,5vw,56px); flex-direction:column;
        }
        .mobile-menu.open{display:flex;}
        .mobile-menu-top{display:flex; justify-content:space-between; align-items:center; margin-bottom:40px;}
        .mobile-menu a{font-size:24px; font-weight:800; padding:16px 0; border-bottom:1px solid var(--line);}
        .close-btn{background:none;border:none;font-size:28px;cursor:pointer;color:var(--text);}

        @media (prefers-reduced-motion: reduce){
          *{animation:none !important; transition:none !important;}
        }
      `}} />

      <div className="landing-body">
        <div className="bg-grid"></div>
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>

        <nav className="nav" id="nav">
          <div className="nav-inner">
            <a href="#top" className="brand"><span className="dot"></span>Visuno</a>
            <ul className="nav-links">
              <li><a href="#produto">Produto</a></li>
              <li><a href="#calculadora">Calculadora</a></li>
              <li><a href="#whatsapp">WhatsApp</a></li>
              <li><a href="#ia">IA</a></li>
              <li><a href="#precos">Preços</a></li>
            </ul>
            <div className="nav-cta">
              <Link href="/login" className="btn btn-ghost btn-sm">Entrar</Link>
              <Link href="/signup" className="btn btn-primary btn-sm">Começar Grátis</Link>
              <button className="burger" id="burgerBtn" aria-label="Abrir menu" onClick={() => setMobileMenuOpen(true)}>
                <span></span><span></span><span></span>
              </button>
            </div>
          </div>
        </nav>

        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`} id="mobileMenu">
          <div className="mobile-menu-top">
            <span className="brand">Visuno</span>
            <button className="close-btn" id="closeBtn" onClick={() => setMobileMenuOpen(false)}>&times;</button>
          </div>
          <a href="#produto" onClick={() => setMobileMenuOpen(false)}>Produto</a>
          <a href="#calculadora" onClick={() => setMobileMenuOpen(false)}>Calculadora</a>
          <a href="#whatsapp" onClick={() => setMobileMenuOpen(false)}>WhatsApp</a>
          <a href="#ia" onClick={() => setMobileMenuOpen(false)}>IA</a>
          <a href="#precos" onClick={() => setMobileMenuOpen(false)}>Preços</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
          <Link href="/signup" className="btn btn-primary" style={{ marginTop: '24px' }}>Começar Grátis</Link>
        </div>

        <header className="hero" id="top">
          <div className="wrap">
            <div className="hero-badge">💬 Muito mais que um bot. Uma plataforma completa.</div>
            <h1>Recupere clientes e pare de perdê-los <span className="grad">por falta de acompanhamento.</span></h1>
            <p className="lead">A Visuno monitora automaticamente sua base de clientes, identifica quem deixou de comprar, automatiza o relacionamento pelo WhatsApp e ajuda sua empresa a aumentar a recorrência e o faturamento.</p>
            <div className="hero-actions">
              <Link href="/signup" className="btn btn-primary btn-lg">Começar teste gratuito →</Link>
            </div>
            <div className="hero-sub">
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                Não precisa de cartão
              </span>
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                Configuração em minutos
              </span>
            </div>

            <div className="hero-mockup">
              <div className="mockup-glow"></div>
              <div className="float-stat f1">
                <div className="fstat-label">Receita Recuperada</div>
                <div className="fstat-value green">R$ 128.450</div>
              </div>
              <div className="float-stat f2">
                <div className="fstat-label">Clientes em Risco</div>
                <div className="fstat-value red">356</div>
              </div>
              <div className="mockup-frame">
                <div className="mockup-bar">
                  <span></span><span></span><span></span>
                  <span className="url">visuno.com.br/dashboard</span>
                </div>
                <Image src="/screenshots/dashboard.png" alt="Visuno Dashboard" width={1080} height={675} className="w-full h-auto" priority />
              </div>
            </div>
          </div>
        </header>

        {/* LOGOS STRIP */}
        <section className="logos">
          <div className="wrap">
            <div className="logos-label">Confiado por empresas inovadoras</div>
            <div className="logos-row">
              <span>SafeTrust</span>
              <span>DataCorp</span>
              <span>NeuralSys</span>
              <span>FlowTeam</span>
            </div>
          </div>
        </section>

        {/* FEATURE SHOWCASE */}
        <section className="section" id="produto">
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow">Funcionalidades</div>
              <h2>Controle total sobre suas vendas</h2>
              <p>Métricas reais, fluxos visuais e um calendário que trabalha por você.</p>
            </div>
            
            <div className="showcase">
              {/* Feature 1 */}
              <div className="feature-row">
                <div className="feature-copy">
                  <div className="eyebrow">Pipeline</div>
                  <h3>Pipeline de Vendas Visual</h3>
                  <p>Arraste e solte seus negócios. Saiba exatamente onde cada lead está parado e nunca deixe uma oportunidade esfriar na caixa de entrada.</p>
                  <ul className="feature-list">
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                      Etapas 100% customizáveis
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                      Valores reais de cada funil
                    </li>
                  </ul>
                </div>
                <div className="feature-visual">
                  <div className="fv-bar"><span></span><span></span><span></span></div>
                  <Image src="/screenshots/pipeline.png" alt="Pipeline" width={800} height={500} className="w-full h-auto" />
                </div>
              </div>

              {/* Feature 2 */}
              <div className="feature-row reverse">
                <div className="feature-copy">
                  <div className="eyebrow">Analytics</div>
                  <h3>Métricas e Top Produtos</h3>
                  <p>Descubra de onde vem o seu dinheiro. Analise métricas, taxas de conversão e saiba o que mais vende na sua empresa.</p>
                  <ul className="feature-list">
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                      Gráficos em tempo real
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                      Relatórios detalhados
                    </li>
                  </ul>
                </div>
                <div className="feature-visual">
                  <div className="fv-bar"><span></span><span></span><span></span></div>
                  <Image src="/screenshots/analytics.png" alt="Analytics" width={800} height={500} className="w-full h-auto" />
                </div>
              </div>

              {/* Feature 3 */}
              <div className="feature-row">
                <div className="feature-copy">
                  <div className="eyebrow">Agenda</div>
                  <h3>Agenda Centralizada</h3>
                  <p>Tenha visão macro de todos os turnos e agendamentos. A equipe inteira com seus horários alinhados no mesmo sistema.</p>
                  <ul className="feature-list">
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                      Sincronização de equipe
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                      Lembretes automáticos
                    </li>
                  </ul>
                </div>
                <div className="feature-visual">
                  <div className="fv-bar"><span></span><span></span><span></span></div>
                  <Image src="/screenshots/agenda.png" alt="Agenda" width={800} height={500} className="w-full h-auto" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CALC SECTION */}
        <section className="section" id="calculadora" style={{ background: 'var(--bg-2)' }}>
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow">Simulador</div>
              <h2>Quanto custa a desorganização?</h2>
              <p>Calcule o valor que você está perdendo mensalmente por falta de follow-up e organização no WhatsApp.</p>
            </div>

            <div className="calc-box">
              <div className="calc-inputs">
                <div className="calc-field">
                  <label>Novos chamados no WhatsApp (mês)</label>
                  <div className="slider-row">
                    <input 
                      type="range" min="50" max="2000" step="50" 
                      value={leads} onChange={(e) => setLeads(Number(e.target.value))}
                    />
                    <div className="val counter">{leads}</div>
                  </div>
                </div>
                
                <div className="calc-field">
                  <label>Ticket Médio (R$)</label>
                  <div className="slider-row">
                    <input 
                      type="range" min="50" max="5000" step="50" 
                      value={ticket} onChange={(e) => setTicket(Number(e.target.value))}
                    />
                    <div className="val counter">R$ {ticket}</div>
                  </div>
                </div>
              </div>

              <div className="calc-result">
                <div className="label">Você está deixando na mesa aproximadamente</div>
                <div className="amount counter">R$ {dinheiroNaMesa.toLocaleString('pt-BR')}</div>
                <div className="sub">* Baseado na média de mercado de 15% de perda por falta de organização.</div>
              </div>
            </div>
          </div>
        </section>

        {/* PHONE WHATSAPP DEMO SECTION */}
        <section className="section phone-section" id="whatsapp">
          <div className="wrap">
            <div className="phone-grid">
              <div className="phone-copy">
                <div className="eyebrow">Integração Oficial</div>
                <h2>Seu WhatsApp turbinado.</h2>
                <p>Conecte seu número em segundos através do QR Code e transforme seu WhatsApp comum em uma máquina de vendas distribuída para toda a equipe.</p>
                <div className="phone-steps">
                  <div className="phone-step active">
                    <div className="num">1</div>
                    <div className="txt">
                      <strong>Conecte seu WhatsApp</strong>
                      <span>Leia o QR Code e integre seu número na hora.</span>
                    </div>
                  </div>
                  <div className="phone-step">
                    <div className="num">2</div>
                    <div className="txt">
                      <strong>Atribuição automática</strong>
                      <span>As mensagens são distribuídas para sua equipe de vendas.</span>
                    </div>
                  </div>
                  <div className="phone-step">
                    <div className="num">3</div>
                    <div className="txt">
                      <strong>Acompanhe o Histórico</strong>
                      <span>Tenha visão completa de todas as negociações no CRM.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="phone-visual-wrap">
                <div className="phone-mock">
                  <div className="phone-notch"></div>
                  <div className="phone-screen">
                    <div className="wa-header">
                      <div className="wa-avatar">MS</div>
                      <div>
                        <div className="wa-name">Marcos Silva</div>
                        <div className="wa-status online">online</div>
                      </div>
                    </div>
                    <div className="wa-body">
                      <div className="wa-bubble system">Atendimento atribuído para Ana</div>
                      <div className="wa-bubble in" style={{ animationDelay: '0.5s' }}>
                        Olá! Vi o anúncio no Instagram e queria saber mais sobre os planos de vocês.
                        <span className="time">10:42</span>
                      </div>
                      <div className="wa-bubble out" style={{ animationDelay: '1.5s' }}>
                        Olá, Marcos! Tudo bem? Ana por aqui. Claro, posso te ajudar! Qual o tamanho da sua equipe de vendas hoje?
                        <span className="time">10:45</span>
                      </div>
                      <div className="wa-typing-indicator" style={{ animationDelay: '2.5s' }}>
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                    <div className="wa-footer">
                      <div className="input-fake">Mensagem...</div>
                      <div className="send-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI SECTION */}
        <section className="section ai-section" id="ia">
          <div className="wrap">
            <div className="ai-grid">
              <div className="ai-copy">
                <div className="eyebrow">Inteligência Artificial</div>
                <h2>A IA que lê nas entrelinhas.</h2>
                <p>Nossa inteligência artificial analisa cada conversa do seu WhatsApp e sugere as melhores respostas e ações para fechar negócio mais rápido.</p>
                <div className="ai-tags">
                  <span className="ai-tag">Análise de Sentimento</span>
                  <span className="ai-tag">Respostas Prontas</span>
                  <span className="ai-tag">Qualificação Automática</span>
                </div>
              </div>
              
              <div className="ai-card">
                <div className="ai-card-top">
                  <div className="ai-live">
                    <div className="pulse"></div> Análise em tempo real
                  </div>
                  <div className="ai-amount">Prob. de Fechar: <span style={{ color: 'var(--green)'}}>87%</span></div>
                </div>
                
                <div className="ai-msg">
                  <div className="ai-msg-top">
                    <span>Cliente: Marcos Silva</span>
                    <span className="obj">Objeção: Preço</span>
                  </div>
                  <p>&quot;Gostei muito da proposta, mas achei o valor um pouco acima do que estávamos planejando gastar agora.&quot;</p>
                </div>
                
                <div className="ai-suggestion">
                  <div className="ai-suggestion-label">Sugestão da IA <span className="ai-typing"><span></span><span></span><span></span></span></div>
                  <p>Marcos, entendo perfeitamente. Se eu conseguir dividir esse valor em 12x sem juros, fica mais confortável para o seu planejamento?</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="section" id="precos">
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow">Planos</div>
              <h2>O investimento que se paga sozinho</h2>
              <p>Recupere de 2 a 4 clientes perdidos no mês e o sistema já cobre o custo com lucro.</p>
            </div>

            <div className="pricing-grid">
              <div className="price-card">
                <div className="price-tier">Mensal</div>
                <div className="price-name">Plano Mensal</div>
                <div className="price-amount"><span className="num">R$ 119</span><span className="period">/mês</span></div>
                <ul className="price-features">
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> Acesso completo à Visuno</li>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> Sem fidelidade</li>
                </ul>
                <Link href="/signup" className="btn btn-ghost">Assinar Mensal</Link>
              </div>

              <div className="price-card popular">
                <div className="popular-badge">Mais Popular</div>
                <div className="price-tier">Semestral</div>
                <div className="price-name">Plano Semestral</div>
                <div className="price-amount"><span className="num">R$ 99</span><span className="period">/mês</span></div>
                <ul className="price-features">
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> Acesso completo à Visuno</li>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> Cobrança de R$ 594 a cada 6 meses</li>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> Economia de R$ 120</li>
                </ul>
                <Link href="/signup" className="btn btn-primary">Assinar Semestral</Link>
              </div>

              <div className="price-card">
                <div className="price-tier">Anual</div>
                <div className="price-name">Plano Anual</div>
                <div className="price-amount"><span className="num">R$ 89</span><span className="period">/mês</span></div>
                <ul className="price-features">
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> Acesso completo à Visuno</li>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> Cobrança de R$ 1.068 por ano</li>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> Economia de R$ 360</li>
                </ul>
                <Link href="/signup" className="btn btn-ghost">Assinar Anual</Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="section" id="faq" style={{ background: 'var(--bg-2)' }}>
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow">FAQ</div>
              <h2>Perguntas Frequentes</h2>
              <p>Tudo o que você precisa saber sobre o Visuno antes de começar.</p>
            </div>
            
            <div className="faq-list">
              <FAQItem 
                q="Preciso de um cartão de crédito para testar?" 
                a="Não. Você pode iniciar o seu teste gratuito de 7 dias sem cadastrar nenhum cartão. Nós queremos que você veja o valor da plataforma antes de tomar qualquer decisão." 
              />
              <FAQItem 
                q="O Visuno funciona com WhatsApp normal ou só Business?" 
                a="O Visuno é 100% compatível tanto com o WhatsApp Messenger padrão quanto com o WhatsApp Business. A conexão é feita via QR Code." 
              />
              <FAQItem 
                q="Posso conectar mais de um número no sistema?" 
                a="Sim! A partir do plano Growth, você pode conectar múltiplos números na mesma plataforma, centralizando o atendimento de várias filiais ou setores." 
              />
              <FAQItem 
                q="Minha equipe inteira pode usar o mesmo número simultaneamente?" 
                a="Com certeza! Nosso inbox compartilhado permite que dezenas de atendentes conversem com seus clientes usando o mesmo número de WhatsApp simultaneamente, sem quedas ou desconexões." 
              />
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="section final-cta">
          <div className="wrap">
            <h2>Pronto para assumir o controle do seu WhatsApp?</h2>
            <p>Feche a torneira por onde seu dinheiro está escorrendo. Comece agora sem risco.</p>
            <Link href="/signup" className="btn btn-primary btn-lg">Criar conta gratuita</Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer>
          <div className="wrap foot-inner">
            <div className="foot-brand"><span className="brand"><span className="dot"></span>Visuno</span></div>
            <p>© {new Date().getFullYear()} Visuno. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
