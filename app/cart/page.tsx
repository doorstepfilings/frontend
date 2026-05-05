import { CartView } from "@/components/cart/cart-view";
import { PublicShell } from "@/components/layout/public-shell";

export default function CartPage() {
  return (
    <PublicShell>
      <div className="container mx-auto px-6 lg:px-10 py-12 lg:py-20">
        <CartView />
      </div>
    </PublicShell>
  );
}
