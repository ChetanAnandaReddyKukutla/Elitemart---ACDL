# EliteMart Adobe Experience Platform XDM Data Layer

This document describes the current Adobe Experience Platform data-layer contract for EliteMart. The implementation lives in `frontend/src/utils/analytics.js` and pushes every event to both `window.dataLayer` and `window.adobeDataLayer`.

## Event Groups

Only three logical event groups are used.

| Group | `event` | `eventType` |
| --- | --- | --- |
| Page Load | `pageLoad` | `application.screenView` |
| Link Click | `linkClick` | `web.webInteraction.linkClicks` |
| Purchase | `purchase` | `commerce.purchases` |

Every event includes a UTC ISO-8601 `timestamp`, `page`, and `custData`.

## Customer

```js
custData: {
  loginStatus: "loggedin",
  customerID: "66f3a1b2",
  customerType: "customer"
}
```

Guest visitors use `loginStatus: "guest"` and `customerID: "anonymous"`.

## Product

Product payloads are populated from runtime product, cart, checkout, or order data.

```js
product: {
  productName: "Classic Oxford Button-Down Shirt",
  productSKU: "OX-SH-001",
  price: "39.99",
  quantity: 1,
  category: "Top Wear",
  brand: "Urban Threads",
  selectedSize: "M",
  currencyCode: "USD"
}
```

## Commerce Screen Cart

The `cart` object is only allowed on Cart page load, Checkout page load, and Purchase.

```js
cart: {
  cartValue: "79.98",
  totalItems: "2"
}
```

Generic interactions such as add to cart, remove product, size selection, quantity updates, product cards, search, checkout CTA, and continue shopping do not include `cart`.

## Product List Items

Commerce payloads use Adobe's `productListItems` array and include every product in the cart, checkout, or purchase.

```js
productListItems: [
  {
    name: "Classic Oxford Button-Down Shirt",
    SKU: "OX-SH-001",
    quantity: 1,
    priceTotal: "39.99",
    selectedSize: "M",
    category: "Top Wear",
    brand: "Urban Threads",
    currencyCode: "USD"
  }
]
```

## Commerce Objects

Add to cart sends:

```js
commerce: {
  productListAdds: {
    value: 1
  }
}
```

Successful purchase sends:

```js
commerce: {
  purchases: {
    value: 1
  }
}
```

## Validation Checklist

- No retired cart identifier field is sent.
- No product subcategory field is sent.
- `cart` appears only on Cart page load, Checkout page load, and Purchase.
- Product information is populated whenever a product is involved.
- Cart, Checkout, Add to Cart, and Purchase use `productListItems`.
- Brand and category are populated from runtime product metadata.
- Every payload has a UTC timestamp.
- All interactions use `web.webInteraction.linkClicks`.
- All page loads use `application.screenView`.
- Purchase uses `commerce.purchases`.
