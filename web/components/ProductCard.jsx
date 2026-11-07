import Link from "next/link";
import { useCart } from "./CartContext";

export const CATEGORY_NAMES = {
  audio: "Audio",
  phones: "Phones",
  laptops: "Laptops",
  wearables: "Wearables",
  accessories: "Accessories",
};

export function money(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function stars(rating) {
  const full = Math.round(Number(rating));
  return "★".repeat(full) + "☆".repeat(5 - full);
}

export function tagLabel(p) {
  if (p.tag === "sale" && p.old_price_cents) {
    return `-${Math.round((1 - p.price_cents / p.old_price_cents) * 100)}% off`;
  }
  return p.tag === "hot" ? "🔥 Best seller" : p.tag === "new" ? "New" : "";
}

function AddBtn({ product }) {
  const { addToCart } = useCart();
  return (
    <button
      className="add-btn"
      onClick={(e) => {
        addToCart(product.id, 1);
        e.currentTarget.classList.add("added");
        e.currentTarget.textContent = "✓ Added";
        setTimeout(() => {
          e.currentTarget.classList.remove("added");
          e.currentTarget.textContent = "Add to cart";
        }, 900);
      }}
    >
      Add to cart
    </button>
  );
}

export default function ProductCard({ product }) {
  return (
    <article className="card">
      <Link className="card-img" href={`/product/${product.id}`} style={{ background: product.grad }}>
        <span aria-hidden="true">{product.emoji}</span>
        {tagLabel(product) ? (
          <span className={`tag ${product.tag === "sale" ? "" : product.tag}`}>{tagLabel(product)}</span>
        ) : null}
      </Link>
      <div className="card-body">
        <span className="card-cat">{CATEGORY_NAMES[product.category] || product.category}</span>
        <h3 className="card-title"><Link href={`/product/${product.id}`}>{product.name}</Link></h3>
        <p className="card-rating"><span className="stars">{stars(product.rating)}</span> {product.rating}</p>
        <div className="card-foot">
          <span className="price">
            {money(product.price_cents)}
            {product.old_price_cents ? <span className="old">{money(product.old_price_cents)}</span> : ""}
          </span>
          <AddBtn product={product} />
        </div>
      </div>
    </article>
  );
}
