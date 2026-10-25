import './style.css';
export const metadata = { title:'PrimeEdge Sports', description:'Sports odds research and payout tools' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
