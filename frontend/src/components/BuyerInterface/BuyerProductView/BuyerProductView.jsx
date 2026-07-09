import React, { useEffect, useState } from 'react';
import './BuyerProductView.css';
import { Trophy, Flame, Flower2, Sparkle, GraduationCap, Briefcase, Plus, Minus, Share, Box } from 'lucide-react';
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";
import { useParams } from 'react-router-dom';
import { GetContext } from '../../../context/ProductsProvider';
import { toast } from 'react-toastify';

function BuyerProductView() {
    const { product, setProduct } = GetContext();

    const [isRequested, setIsRequested] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    const [productQuantity, setProductQuantity] = useState(0);

    const { productid } = useParams();

    const fetchAllProductrequests = async() => {
        console.log("calling fetch")
        try {
            const api_header = { 
              Authorization: `Bearer ${localStorage.getItem('campusrecycletoken')}`,
              "Content-Type": "multipart/form-data"
            };
            const bodyData = {
                // Need to write something
            }
            const response = await apiConnector("POST", authroutes.GET_ALL_SENT_PRODUCT_REQUESTS, bodyData, api_header);
            console.log(response.data);
            if (response.data.success) {
                console.log("Requests fetched successfully");
                for(let data of response.data.data){
                    console.log("data: ", productid);
                    if(data.product._id === productid) {
                        setIsRequested(true);
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    const handleChangeProductQuantity = (action) => {
        if(action === "inc"){
            if(productQuantity+1 > product.quantity) return;
            setProductQuantity(productQuantity+1);
        }else{
            if(productQuantity-1 < 0) return;
            setProductQuantity(productQuantity-1);
        }
    }

    const handleProductRequest = async() => {
        if(isRequested) return;
        if (productQuantity === 0){


            toast.warn("Please select at least one product", {
                  position: "top-right",
                  autoClose: 3000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                  theme: "colored",
                });
            return;
        }
        setIsRequesting(true);

        const user = localStorage.getItem('campusrecycleuser');
        const userObj = JSON.parse(user);
        const buyerEmail = userObj.email;
        try {
            const api_header = { 
              Authorization: `Bearer ${localStorage.getItem('campusrecycletoken')}`,
              "Content-Type": "multipart/form-data"
            };
            const bodyData = {
                buyername: buyerEmail,
                selleremail: product.owner.email,
                productid: product._id,
                quantity: productQuantity
            }
            const response = await apiConnector("POST", authroutes.PRODUCT_REQUEST, bodyData, api_header);
            console.log(response.data);
            if (response.data.success) {

              toast.success("Product requested", {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "colored",
                  });
              
              setIsRequested(true);
            }
          } catch (error) {
            console.log(error);
          } finally {
            setIsRequesting(false);
          }
    }

    const fetchProductDetails = async () => {
        try {
          const api_header = {
            Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
            "Content-Type": "multipart/form-data",
          };
          const bodyData = {
            productid: productid,
          };
          const response = await apiConnector(
            "POST",
            authroutes.GET_PRODUCT_DETAILS,
            bodyData,
            api_header
          );
          console.log(response.data);
          if (response.data.success) {
            setProduct(response.data.data);
          }
        } catch (error) {
          console.log(error);
        }
      };

    useEffect(()=>{
        if(!product){
            fetchProductDetails();
        }

        fetchAllProductrequests();
    }, []);
  return (
    <div className='buyer-product-view'>
        <div className='buyer-product-view-container'>
            <h3>{product && product.productname}</h3>
            <div className='buyer-product-view-container-product-image'>
                <div className='buyer-product-view-container-product-image-main'>
                    <img src={product && product.images[0]} alt="" />
                </div>
                <div className='buyer-product-view-container-product-image-secondary-first'>
                    <img src={product && product.images[1]} alt="" />
                    <img src={product && product.images[2]} alt="" />
                </div>
                <div className='buyer-product-view-container-product-image-secondary-second'>
                    <img className='img-1' src={product && product.images[3]} alt="" />
                    <img className='img-2' src={product && product.images[4]} alt="" />
                </div>
            </div>
            <div className='buyer-product-view-container-product-details'>
                <div className="buyer-product-view-container-product-details-info">
                    <div className="seller-account">
                        <div className="profile-picture">
                            <img src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" alt="" />
                        </div>
                        <div className="profile-desc">
                            <h6>Selling from {product && product.owner.firstname} {product && product.owner.lastname}</h6>
                            <p>Seller</p>
                        </div>
                    </div>
                    <div className="product-perks">
                        <div className="icon">
                            <Box />
                        </div>
                        <div className="perk-info">
                            <h6>All your college necessities are right here</h6>
                            <p>No need to search anywhere else!.</p>
                        </div>
                    </div>
                    <div className="product-perks">
                        <div className="icon">
                            <Flame />
                        </div>
                        <div className="perk-info">
                            <h6>Anyone can be both a buyer and a seller!</h6>
                            <p>Join us in our recycling initiative.</p>
                        </div>
                    </div>
                    <div className="product-perks">
                        <div className="icon">
                            <Share />
                        </div>
                        <div className="perk-info">
                            <h6>Share with friends</h6>
                            <p>Help them to find what they need and support sustainable choices.</p>
                        </div>
                    </div>
                    <div className="product-perks">
                        <div className="icon">
                            <Sparkle />
                        </div>
                        <div className="perk-info">
                            <h6>Give your unused items a new purpose</h6>
                            <p>let’s reduce waste together. Turn clutter into cash while contributing to a greener campus!</p>
                        </div>
                    </div>
                    <div className="what-will-you-do">
                        <h6>Product Description</h6>
                        <p>{product && product.productdescription}</p>

                        <h6>What you’ll do</h6>
                        <p>If you want a particular item, select the item and click on the "Request" button to add it to your list. After verification, we will confirm your order.</p>
                        <p>The product will be delivered within 2-3 working days. Payment can be made either online or in person at the time of delivery. </p>
                        <p>You can cancel your order anytime by removing your request from the "Orders" section.</p>
                        <p>Make sure the product is in the same condition as described on the page.</p>
                    </div>
                    <div className="meet-your-seller">
                        <h5>Meet your seller</h5>
                        <div className="card">
                            <img src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" alt="" />
                            <h5>{product && product.owner.firstname} {product && product.owner.lastname}</h5>
                            <span>Seller</span>
                            <span>email: {product && product.owner.email}</span>
                        </div>
                        {/* <p>Hello, I’m Mathieu Lehanneur, a French multidisciplinary designer. I create furniture, objects and spaces that blend design, art, nature and science. I believe in magic and wonder, and I always strive to imbue everything with the power to surprise us.</p> */}
                    </div>
                </div>
                <div className="buyer-product-view-container-product-details-request">
                    <div className="price-card">
                        <h5>
                            &#x20B9;{product && product.price} Per Product
                        </h5>
                        <p>{product && product.quantity} left - {product && product.status}</p>
                        <div className='quantity-input'>
                            <span className={`quantity-input-btn-plus ${productQuantity+1 > (product && product.quantity) ? 'disabled' : ''}`} onClick={()=>handleChangeProductQuantity("inc")} >
                                <Plus/>
                            </span>
                            <span className='quantity-input-counter'>
                                {productQuantity}
                            </span>
                            <span className={`quantity-input-btn-minus ${productQuantity-1 < 0 ? 'disabled' : ''}`} onClick={()=>handleChangeProductQuantity("dec")} >
                                <Minus/>
                            </span>
                        </div>
                        <button className='btn' onClick={handleProductRequest} disabled={isRequested || isRequesting} style={{ cursor: isRequested ? 'no-drop' : 'pointer', backgroundColor: isRequested ? '#63cd81' : '' }}>
                            {isRequested ? 'Requested' : isRequesting ? 'Requesting...' : 'Request'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default BuyerProductView