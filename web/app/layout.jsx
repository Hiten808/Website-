import "./globals.css";
import { CartProvider } from "../components/CartContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ToastProvider } from "../components/Toast";

export const metadata = {
  title: "Voltra — Electronics Store",
  description: "Premium electronics at honest prices.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <CartProvider>
            <Header />
            {children}
            <Footer />
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
