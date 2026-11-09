import { Link, NavLink, Outlet } from "react-router-dom";
import { useApp } from "../store/context";

const LINKS = [
  ["/", "Today"],
  ["/system", "Number system"],
  ["/cards", "Cards"],
  ["/journeys", "Journeys"],
  ["/train", "Train"],
  ["/progress", "Progress"],
  ["/guide", "Guide"],
];

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return <div className={`toast${toast.bad ? " bad" : ""}`} role="status">{toast.text}</div>;
}

export default function Shell() {
  return (
    <>
      <header className="top">
        <div className="top-in">
          <Link to="/" className="brand">Memory Training</Link>
          <nav className="nav">
            {LINKS.map(([to, text]) => <NavLink key={to} to={to} end={to === "/"}>{text}</NavLink>)}
          </nav>
        </div>
      </header>
      <main className="page">
        <Outlet />
        <footer className="foot">
          <Link to="/data">Backup and data</Link>
          <Link to="/guide">How it works</Link>
          <a href="/">Home site</a>
        </footer>
      </main>
      <Toast />
    </>
  );
}
