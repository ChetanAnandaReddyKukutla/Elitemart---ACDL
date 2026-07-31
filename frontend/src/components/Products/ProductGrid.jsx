import React from 'react'
import {Link} from "react-router-dom"
import { buildProduct } from "../../utils/analytics.js"
const ProductGrid = ({products, loading, error}) => {
  const productList = Array.isArray(products) ? products : [];
  if(loading){
    return <p>Loading...</p>
  }
  if(error){
    return <p>Error:{error}</p>
  }
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        {productList.map((product,idx)=>(
            <Link
              key={idx}
              to={`/product/${product._id}`}
              className='block'
              data-analytics-name={product.name}
              data-analytics-type="product card"
              data-analytics-position="product grid"
              data-analytics-product={JSON.stringify(buildProduct(product))}
            >
              <div className="bg-white p-4 rounded-lg">
                <div className="w-full h-96 mb-4">
                  <img src={product.images[0].url} alt={product.images[0].altText || product.name} className='w-full h-full object-cover rounded-lg' />
                </div>
                <h3 className="text-sm mb-2">{product.name}</h3>
                <p className='text-gray-500 font-medium text-sm tracking-tighter'>$ {product.price}</p>
              </div>
            </Link>
        ))}
    </div>
  )
}

export default ProductGrid
