import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <div className="logo">⚡ Voltra</div>
          <p>Honest electronics. Fair prices.<br />Since 2026.</p>
        </div>
        <div className="footer-cols">
          <Link href="/">Shop</Link>
          <Link href="/#deals">Deals</Link>
          <Link href="/">Returns</Link>
          <Link href="/">Support</Link>
        </div>
      </div>
      <p className="copyright">© 2026 Voltra Electronics. A demo store — no real orders are placed.</p>
    </footer>
  );
}
