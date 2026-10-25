'use client';
import React from 'react';
import Link from 'next/link';
import './primeedge.css';
export default function PrimeShell({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}){return <div className="pe-root"><div className="pe-wrap"><header className="pe-header"><Link href="/" className="pe-brand">✦ PRIME<span>EDGE</span></Link><nav className="pe-nav" aria-label="PrimeEdge features"><Link href="/research">Research Lab</Link><Link href="/intelligence">Bet Intelligence</Link><Link href="/dashboard">My Dashboard</Link><Link href="/learn">Academy</Link></nav></header><section className="pe-hero"><div className="pe-kicker">PRIMEEDGE SPORTS / ANALYTICS</div><h1>{title}</h1><p>{subtitle}</p></section>{children}<footer className="pe-footer">Research and education only · No real-money wagers are placed here · Odds and estimates are not guarantees</footer></div></div>}
