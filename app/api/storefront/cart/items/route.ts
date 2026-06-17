import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { addCartItem, getCart, removeCartItem, updateCartItem } from '@/lib/fleetbase/storefront';
import { sessionCookieOptions } from '@/lib/runtime';

async function resolveCartId() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get('cart_id')?.value;
  if (cartId) {
    return cartId;
  }
  const cart = await getCart();
  return cart.id;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cartId = await resolveCartId();
    const cart = await addCartItem(cartId, body.productId, {
      quantity: body.quantity,
      variants: body.variants,
      addons: body.addons,
      store_location: body.store_location
    });
    const response = NextResponse.json({ cart });
    response.cookies.set('cart_id', cart.id, sessionCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to add item.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const cartId = await resolveCartId();
    const cart = await updateCartItem(cartId, body.lineItemId, { quantity: body.quantity, variants: body.variants, addons: body.addons });
    return NextResponse.json({ cart });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update item.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const cartId = await resolveCartId();
    const cart = await removeCartItem(cartId, body.lineItemId);
    return NextResponse.json({ cart });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to remove item.' }, { status: 500 });
  }
}
