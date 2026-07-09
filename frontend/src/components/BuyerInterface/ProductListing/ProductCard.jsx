import React from 'react';
import './ProductCard.css';
import { useNavigate } from 'react-router-dom'

function ProductCard(props) {
  const navigate = useNavigate();
  return (
    <div className='product-card col-md-3' onClick={()=>navigate(`/buyer/products/${props.product._id}`)}>
        <div className="product-card-image">
            <img src={props.product && props.product.images && props.product.images[0]} alt="" />
        </div>
        <div className='product-card-details'>
            <h4>{props.product && props.product.productname}</h4>
            <p>{props.product && (props.product.productdescription.length > 60 ? props.product.productdescription.slice(0, 57)+'...' : props.product.productdescription)}</p>
            <p className='product-card-details-price'>&#8377; {props.product && props.product.price}</p>
        </div>
    </div>
  )
}

export default ProductCard